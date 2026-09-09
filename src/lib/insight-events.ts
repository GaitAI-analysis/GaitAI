/**
 * EDITORIAL ANALYTICS FOR GAITAI INSIGHTS — typed, anonymous, aggregate.
 *
 * WHAT THIS MEASURES. Which interface a reader used: a story opened, a figure
 * scrubbed, a branch chosen, a reading mode switched, a next story clicked.
 * The publication learns whether an interaction is discoverable, whether an
 * essay is finished, and where readers go afterwards.
 *
 * WHAT THIS CAN NEVER CARRY. Nothing a reader provided. No email, no comment
 * text, no selected text, no uploaded media, no file name, no gait value, no
 * health information, no question typed into Ask GaitAI, no identifier. The
 * event schema below has no field for any of them; `sanitize()` drops any
 * key or value that looks like one anyway; and the storage rules
 * (firestore.rules, `insightEventCounts`) accept only a closed set of short
 * fields. Privacy is structural, not a promise.
 *
 * HOW AN EVENT TRAVELS.
 *   1. `trackInsightEvent(name, props)` validates and enriches it with public
 *      context only: the article, its series, the reading mode, the device
 *      class and the theme.
 *   2. It is published on `window` as `gaitai:insight-event` (for QA scripts
 *      and any future integration), pushed to `dataLayer` / `gtag` if a tag
 *      manager is present, and
 *   3. counted in Firestore as ONE INCREMENT on an aggregate document keyed by
 *      day × article × event — never a row per reader, never a session. The
 *      sink batches, never blocks, and fails silently (see
 *      `insight-analytics-sink.ts`). Do Not Track switches the sink off.
 *
 * DEDUPLICATION. `once` fires an event once per page load per subject —
 * React StrictMode, re-renders, hydration and repeated IntersectionObserver
 * callbacks all collapse. `session` widens that to once per browser session.
 * `debounce` collapses a burst (a drag across eight stages) into the settled
 * state. Nothing here is ever awaited by a component.
 */

export type DeviceClass = "phone" | "tablet" | "desktop";
export type ReadingMode = "read" | "essentials" | "story";
/** How long after a figure was on screen the reader first touched it. */
export type TimeToFirst = "0-2s" | "2-5s" | "5-10s" | ">10s";
export type HelpfulReason = "too-technical" | "visual-unclear" | "more-examples" | "other";
export type NextStoryVia = "bridge" | "series" | "related" | "selector" | "cover";

type Article = { article_slug: string };

/**
 * THE SCHEMA. Every event the journal can emit and the props each carries.
 * Adding an event means adding it here; the compiler then refuses a call
 * with a missing or extra field, and the analytics tests refuse a prop name
 * from the prohibited list.
 */
export interface InsightEventMap {
  /* ── reach ── */
  insight_impression: Article & { surface: "hub" | "cover" | "series" | "related" | "explorer" };
  insight_open: Article & { series: string; series_order?: number };
  /* ── the cover ── */
  cover_interaction_start: Article;
  cover_stage_changed: Article & { stage: number };
  cover_interaction_complete: Article;
  cover_story_open: Article;
  /* ── reading ── */
  article_scroll_25: Article;
  article_scroll_50: Article;
  article_scroll_75: Article;
  article_scroll_100: Article;
  reading_mode_changed: Article & { reading_mode: ReadingMode };
  visual_story_open: Article;
  visual_story_complete: Article;
  term_inspected: Article & { term: string };
  /* ── figures ── */
  interactive_figure_seen: Article & { figure_id: string };
  interactive_figure_start: Article & { figure_id: string; time_to_first: TimeToFirst };
  interactive_figure_complete: Article & { figure_id: string };
  insight_shared: Article & { figure_id?: string; method: string };
  /* ── destinations ── */
  citation_opened: Article & { publication: string };
  research_opened: Article & { destination: "publications" | "research" | "lab" };
  gaitscape_opened: Article & { node: string };
  product_opened: Article & { destination: string };
  ask_gaitai_article_opened: Article & { section: "current" | "none" };
  newsletter_submitted: { source: string; article_slug?: string };
  next_story_clicked: Article & { to_slug: string; via: NextStoryVia };
  /** Session-level path progression: this Foundation opened after another. */
  foundation_progressed: Article & { series_order: number; from_order: number; via: NextStoryVia | "direct" };
  /* ── hub ── */
  hub_card_interaction: Article & { concept: string };
  foundation_preview_selected: Article & { source: "hover" | "focus" | "tap" | "keys" };
  filter_used: { type: string; topic: string; sort: string };
  /* ── article-specific: the Foundations ── */
  pipeline_stage_changed: Article & { stage: number };
  motion_dna_branch_selected: Article & { branch: string };
  privacy_stage_selected: Article & { stage: number };
  trend_assessment_added: Article & { step: number };
  fusion_stream_changed: Article & { stream: string; state: string };
  signal_quality_demo_used: Article & { condition: string };
  /* ── article-specific: the new series ── */
  pose_issue_selected: Article & { issue: string };
  pose_view_toggled: Article & { view: "ai" | "original" };
  symmetry_adjusted: Article & { state: string };
  camera_angle_changed: Article & { angle_bucket: string };
  privacy_representation_changed: Article & { representation: string };
  system_component_failed: Article & { component: string };
  baseline_mode_changed: Article & { mode: string };
  /* ── product pages (aggregate, like everything else: no reader, no session) ── */
  product_page_open: { product: string; family: string };
  product_mode_selected: { product: string; mode: string };
  product_related_opened: { product: string; destination: string };
  product_demo_clicked: { product: string; placement: "hero" | "pilot" };
  /* ── feedback ── */
  article_helpful_yes: Article;
  article_helpful_no: Article;
  article_helpful_reason: Article & { reason: HelpfulReason };
}

export type InsightEventName = keyof InsightEventMap;
export type InsightEventProps = Record<string, string | number | boolean | undefined>;

/** Context every event is enriched with. Public, coarse, never personal. */
export interface InsightContext {
  article_slug?: string;
  series?: string;
  reading_mode?: ReadingMode;
}

export interface InsightEventDetail {
  name: InsightEventName;
  props: Record<string, string | number | boolean>;
  at: number;
}

export const INSIGHT_EVENT = "gaitai:insight-event";

/**
 * Prop NAMES that must never appear, however innocent the value. A component
 * that tries to log `email`, `text` or `filename` is a bug; the event is
 * dropped and, in development, the console says why.
 */
const PROHIBITED_KEY =
  /(^|_)(email|mail|name|text|message|query|search|file|filename|video|upload|value|values|score|ip|address|phone|comment|selection|content|answer|question|user|uid|id_token|token|session_id|fingerprint)($|_)/i;
/** Only the id-like keys an aggregate can be keyed by. */
const ALLOWED_KEY = /^[a-z][a-z0-9_]{0,39}$/;
const MAX_STRING = 80;

const onceKeys = new Set<string>();
const debounceTimers = new Map<string, number>();
let context: InsightContext = {};

const SESSION_PREFIX = "gaitai:ie:";

type Tracker = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** Set by the article page; cleared when it unmounts. */
export function setInsightContext(next: InsightContext): void {
  context = { ...next };
}

export function clearInsightContext(): void {
  context = {};
}

export function getInsightContext(): InsightContext {
  return { ...context };
}

export function deviceClass(): DeviceClass {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  return width < 700 ? "phone" : width < 1100 ? "tablet" : "desktop";
}

export function themeName(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function timeToFirstBucket(ms: number): TimeToFirst {
  if (ms < 2000) return "0-2s";
  if (ms < 5000) return "2-5s";
  if (ms < 10000) return "5-10s";
  return ">10s";
}

/**
 * Drop anything that could carry a person. Exported so the tests can assert
 * the rule directly rather than infer it from side effects.
 */
export function sanitize(props: InsightEventProps): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (!ALLOWED_KEY.test(key) || PROHIBITED_KEY.test(key)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[insight-events] dropped prop "${key}": not an allowed analytics field`);
      }
      continue;
    }
    if (typeof value === "string") {
      if (value.length === 0 || value.length > MAX_STRING) continue;
      if (/[\n\r@]/.test(value)) continue; /* free text, or an address */
      safe[key] = value;
    } else if (typeof value === "number") {
      if (!Number.isFinite(value)) continue;
      safe[key] = Math.round(value * 100) / 100;
    } else if (typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

function sessionSeen(key: string): boolean {
  try {
    return sessionStorage.getItem(SESSION_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function sessionMark(key: string): void {
  try {
    sessionStorage.setItem(SESSION_PREFIX + key, "1");
  } catch {
    /* Storage blocked: the in-memory once-set still holds for this page. */
  }
}

function emit(name: InsightEventName, safe: Record<string, string | number | boolean>): void {
  const detail: InsightEventDetail = { name, props: safe, at: Date.now() };
  try {
    window.dispatchEvent(new CustomEvent(INSIGHT_EVENT, { detail }));
  } catch {
    /* A browser without CustomEvent has no analytics to feed either. */
  }

  const w = window as Tracker;
  if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: name, ...safe });
  if (typeof w.gtag === "function") {
    try {
      w.gtag("event", name, safe);
    } catch {
      /* Never let a tag failure reach the reader. */
    }
  }

  /* The aggregate sink, lazily loaded so the article never waits on it and a
     page without Firebase never downloads it. Fire and forget. */
  void import("./insight-analytics-sink")
    .then((sink) => sink.recordInsightEvent(name, safe))
    .catch(() => {
      /* Unavailable analytics is not an error the reader should see. */
    });
}

/**
 * Track one event. Typed: `props` must match the schema for `name`.
 *
 *   once      fire once per page load for this subject key
 *   session   with `once`, once per browser session instead
 *   debounce  collapse a burst under this key into its last value (400ms)
 */
export function trackInsightEvent<N extends InsightEventName>(
  name: N,
  props: InsightEventMap[N],
  options: { once?: string; session?: boolean; debounce?: string } = {},
): void {
  if (typeof window === "undefined") return;

  const key = options.once ? `${name}:${options.once}` : null;
  if (key) {
    if (onceKeys.has(key)) return;
    if (options.session && sessionSeen(key)) return;
    onceKeys.add(key);
    if (options.session) sessionMark(key);
  }

  /* Context first, then the caller's props — an empty or undefined prop
     never erases the page's context (a component without the slug to hand
     passes `article_slug: ""` and the article page's context fills it). */
  const enriched: InsightEventProps = {
    ...(context.article_slug ? { article_slug: context.article_slug } : {}),
    ...(context.series ? { series: context.series } : {}),
    ...(context.reading_mode ? { reading_mode: context.reading_mode } : {}),
  };
  for (const [key, value] of Object.entries(props as InsightEventProps)) {
    if (value === undefined || value === null || value === "") continue;
    enriched[key] = value;
  }
  enriched.device_class = deviceClass();
  enriched.theme = themeName();
  const safe = sanitize(enriched);

  if (options.debounce) {
    const debounceKey = `${name}:${options.debounce}`;
    const pending = debounceTimers.get(debounceKey);
    if (pending) window.clearTimeout(pending);
    debounceTimers.set(
      debounceKey,
      window.setTimeout(() => {
        debounceTimers.delete(debounceKey);
        emit(name, safe);
      }, 400),
    );
    return;
  }

  emit(name, safe);
}

/**
 * Remember how the reader is about to arrive at the next story, so the next
 * page can attribute its `insight_open`. Session-scoped, a single word.
 */
export function markNextStoryVia(via: NextStoryVia): void {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}via`, via);
  } catch {
    /* fine */
  }
}

export function takeNextStoryVia(): NextStoryVia | "direct" {
  try {
    const via = sessionStorage.getItem(`${SESSION_PREFIX}via`);
    sessionStorage.removeItem(`${SESSION_PREFIX}via`);
    return (via as NextStoryVia | null) ?? "direct";
  } catch {
    return "direct";
  }
}

/** The Foundations opened in this session, by series order — for the funnel. */
export function recordFoundationOpened(order: number): number[] {
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}foundations`);
    const opened = raw ? (JSON.parse(raw) as number[]).filter((n) => Number.isInteger(n)) : [];
    if (!opened.includes(order)) opened.push(order);
    sessionStorage.setItem(`${SESSION_PREFIX}foundations`, JSON.stringify(opened));
    return opened;
  } catch {
    return [order];
  }
}

/** For tests and QA scripts: forget every once-key on this page. */
export function __resetInsightEventsForTests(): void {
  onceKeys.clear();
  for (const timer of debounceTimers.values()) {
    if (typeof window !== "undefined") window.clearTimeout(timer);
  }
  debounceTimers.clear();
  context = {};
}
