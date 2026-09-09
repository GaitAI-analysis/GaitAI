/**
 * Anonymous interaction events for the Insights journal.
 *
 * The site has no analytics stack of its own — the only counters are the
 * Firestore `articleStats` views and likes — so this is deliberately a
 * DISPATCHER, not a collector. An event is:
 *
 *   1. published on `window` as a `gaitai:insight-event` CustomEvent, so any
 *      future analytics integration (or a QA script) can subscribe without
 *      touching the components;
 *   2. pushed to `window.dataLayer` if a tag manager has put one there;
 *   3. handed to `window.gtag` if it exists.
 *
 * Nothing is stored, nothing is sent from here, and NOTHING PRIVATE IS EVER
 * IN THE PAYLOAD: props are short public identifiers (an article slug, a
 * figure id, a stage index). Selected text, uploaded media, file names and
 * anything typed by the reader must not be passed in — the type of `props`
 * makes long strings inconvenient on purpose.
 */

export type InsightEventName =
  | "article_visual_mode_selected"
  | "visual_story_started"
  | "visual_story_completed"
  | "interactive_figure_used"
  | "privacy_slider_completed"
  | "signal_quality_demo_used"
  | "foundation_next_story_clicked"
  | "term_inspected"
  | "insight_shared"
  | "hub_card_interaction"
  | "ask_gaitai_from_article"
  | "evidence_link_clicked";

export type InsightEventProps = Record<string, string | number | boolean>;

export const INSIGHT_EVENT = "gaitai:insight-event";

/** Events that should fire once per page load per subject, not per gesture. */
const onceKeys = new Set<string>();

type Tracker = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function trackInsightEvent(
  name: InsightEventName,
  props: InsightEventProps = {},
  options: { once?: string } = {},
): void {
  if (typeof window === "undefined") return;
  if (options.once) {
    const key = `${name}:${options.once}`;
    if (onceKeys.has(key)) return;
    onceKeys.add(key);
  }

  /* Guard against a caller accidentally passing free text. */
  const safe: InsightEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" && value.length > 80) continue;
    safe[key] = value;
  }

  const detail = { name, props: safe, at: Date.now() };
  try {
    window.dispatchEvent(new CustomEvent(INSIGHT_EVENT, { detail }));
  } catch {
    /* A browser without CustomEvent has no analytics to feed either. */
  }

  const w = window as Tracker;
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: name, ...safe });
  }
  if (typeof w.gtag === "function") {
    try {
      w.gtag("event", name, safe);
    } catch {
      /* Never let a tag failure reach the reader. */
    }
  }
}
