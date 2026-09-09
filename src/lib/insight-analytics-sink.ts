"use client";

/**
 * THE AGGREGATE SINK — where an insight event becomes one increment.
 *
 *   insightEventCounts/{day}__{article}__{eventKey}
 *     → { count, day, article, event, updatedAt }
 *
 * One document per day × article × event key, holding a running count. No
 * row is ever written per reader or per session, so there is nothing to
 * stitch, nothing to profile and nothing to leak: the most the collection can
 * say is "on this day, this many readers did this on this story".
 *
 * `eventKey` is the event name, plus one categorical dimension where the
 * event has one worth counting — `motion_dna_branch_selected:identity`,
 * `privacy_stage_selected:4`, `interactive_figure_start:2-5s`. Dimensions are
 * short identifiers from a closed vocabulary in the component that emits
 * them; free text cannot arrive here because `sanitize()` upstream drops it,
 * and the key is filtered to `[a-z0-9_:.-]` again before it becomes a
 * document id.
 *
 * BATCHING. Increments queue for ~1.5 s and commit in one write batch, so a
 * reader who scrubs a figure and scrolls a section costs one round trip, and
 * a drag never produces a network burst (the emitter also debounces). On
 * `pagehide` the queue is flushed once, best-effort.
 *
 * RULES. `firestore.rules` accepts a create with count ≤ 25 and an update
 * that raises count by 1–25 with every other field identical, on a document
 * id that matches the day__article__event pattern. Reads are admin-only. A
 * client cannot set a counter, only ask for a bounded step.
 *
 * DEGRADATION. Firebase unconfigured, offline, blocked or rule-denied all
 * resolve to nothing happening. The first failure is reported once through
 * the project's Firebase logger; after that the sink goes quiet for the page.
 * Do Not Track disables the sink entirely — the window event still fires for
 * QA, nothing is stored.
 */

import type { InsightEventName } from "./insight-events";

const COLLECTION = "insightEventCounts";
const FLUSH_MS = 1500;
const MAX_STEP = 25;

/** Which prop, if any, becomes the counted dimension for an event. */
const DIMENSION: Partial<Record<InsightEventName, string>> = {
  insight_impression: "surface",
  cover_stage_changed: "stage",
  reading_mode_changed: "reading_mode",
  interactive_figure_seen: "figure_id",
  interactive_figure_start: "figure_id",
  interactive_figure_complete: "figure_id",
  insight_shared: "method",
  citation_opened: "publication",
  research_opened: "destination",
  gaitscape_opened: "node",
  product_opened: "destination",
  ask_gaitai_article_opened: "section",
  newsletter_submitted: "source",
  next_story_clicked: "via",
  foundation_progressed: "series_order",
  hub_card_interaction: "concept",
  foundation_preview_selected: "source",
  filter_used: "type",
  pipeline_stage_changed: "stage",
  motion_dna_branch_selected: "branch",
  privacy_stage_selected: "stage",
  trend_assessment_added: "step",
  fusion_stream_changed: "state",
  signal_quality_demo_used: "condition",
  pose_issue_selected: "issue",
  pose_view_toggled: "view",
  symmetry_adjusted: "state",
  camera_angle_changed: "angle_bucket",
  privacy_representation_changed: "representation",
  system_component_failed: "component",
  baseline_mode_changed: "mode",
  article_helpful_reason: "reason",
  product_mode_selected: "mode",
  product_related_opened: "destination",
  product_demo_clicked: "placement",
  term_inspected: "term",
};

/** Time-to-first is counted under its own key as well, so the dashboard can
    answer "was the cue discoverable" without a second dimension. */
const SECONDARY: Partial<Record<InsightEventName, string>> = {
  interactive_figure_start: "time_to_first",
};

type Pending = { article: string; event: string; day: string; count: number };

const queue = new Map<string, Pending>();
let timer: number | null = null;
let disabled = false;
let reported = false;
let listening = false;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function idSafe(value: string | number | boolean): string {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_:.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function doNotTrack(): boolean {
  try {
    return navigator.doNotTrack === "1" || (window as Window & { doNotTrack?: string }).doNotTrack === "1";
  } catch {
    return false;
  }
}

function enqueue(article: string, event: string): void {
  const day = today();
  const id = `${day}__${article}__${event}`;
  const pending = queue.get(id);
  if (pending) pending.count = Math.min(MAX_STEP, pending.count + 1);
  else queue.set(id, { article, event, day, count: 1 });
  if (timer === null) timer = window.setTimeout(() => void flush(), FLUSH_MS);
  if (!listening) {
    listening = true;
    window.addEventListener("pagehide", () => void flush(), { once: false });
  }
}

async function flush(): Promise<void> {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (queue.size === 0 || disabled) return;
  const batchItems = [...queue.entries()];
  queue.clear();
  try {
    const [fs, { db }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
    const batch = fs.writeBatch(db);
    for (const [id, item] of batchItems) {
      batch.set(
        fs.doc(db, COLLECTION, id),
        {
          count: fs.increment(item.count),
          day: item.day,
          article: item.article,
          event: item.event,
          updatedAt: fs.serverTimestamp(),
        },
        { merge: true },
      );
    }
    await batch.commit();
  } catch (err) {
    disabled = true;
    if (!reported) {
      reported = true;
      try {
        const { fbFail } = await import("@/lib/firebase-logger");
        fbFail("insightEventCounts · write", err);
      } catch {
        /* Not even the logger is available; stay silent. */
      }
    }
  }
}

/**
 * Count one event. Called by `trackInsightEvent` after sanitising; never by
 * a component directly.
 */
export function recordInsightEvent(
  name: InsightEventName,
  props: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined" || disabled) return;
  if (doNotTrack()) return;

  /* The bucket: the story, or — for a product page event — the product,
     prefixed so the two vocabularies cannot collide. Never a reader. */
  const bucket =
    typeof props.article_slug === "string"
      ? props.article_slug
      : typeof props.product === "string"
        ? `product-${props.product}`
        : "_site";
  const article = idSafe(bucket) || "_site";
  const dimension = DIMENSION[name];
  const value = dimension ? props[dimension] : undefined;
  const key = value === undefined ? idSafe(name) : `${idSafe(name)}:${idSafe(value)}`;
  enqueue(article, key);

  const secondary = SECONDARY[name];
  const secondaryValue = secondary ? props[secondary] : undefined;
  if (secondary && secondaryValue !== undefined) {
    enqueue(article, `${idSafe(name)}.${idSafe(secondary)}:${idSafe(secondaryValue)}`);
  }
}

/** For QA: what is waiting to be written. */
export function __pendingInsightCounts(): Pending[] {
  return [...queue.values()];
}
