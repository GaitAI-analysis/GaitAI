/**
 * Editorial analytics — unit checks for the event layer.
 *
 *   npx tsx scripts/test-insight-analytics.ts
 *
 * Runs in Node with a minimal window shim: the module talks only to
 * `window.dispatchEvent`, timers and `sessionStorage`, so nothing else is
 * needed. What is asserted:
 *
 *   · an event fires once when asked to, however often it is called
 *   · session-scoped once-keys survive a "reload" of the module state
 *   · a burst of debounced calls collapses to the last value
 *   · prohibited prop names (email, text, filename, …) are dropped, and so are
 *     free-text values (long, multi-line, or containing "@")
 *   · context enriches an event but never overrides an explicit prop
 *   · the aggregate sink keys events as day__article__event and folds a
 *     dimension in, with nothing else in the id
 *   · a sink failure (no Firebase here) never throws into the caller
 */
import assert from "node:assert/strict";

/* ── the window shim ── */
type Listener = (event: { detail: unknown }) => void;
const listeners: Listener[] = [];
const store = new Map<string, string>();
const shim = {
  innerWidth: 1440,
  dispatchEvent(event: { detail: unknown }) {
    listeners.forEach((listener) => listener(event));
    return true;
  },
  addEventListener(type: string, listener: Listener) {
    if (type === "gaitai:insight-event") listeners.push(listener);
  },
  setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms) as unknown as number,
  clearTimeout: (id: number) => clearTimeout(id as unknown as NodeJS.Timeout),
};
Object.assign(globalThis, {
  window: shim,
  document: { documentElement: { classList: { contains: () => false } } },
  sessionStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  },
  navigator: { doNotTrack: "0" },
  CustomEvent: class CustomEvent {
    type: string;
    detail: unknown;
    constructor(type: string, init: { detail: unknown }) {
      this.type = type;
      this.detail = init.detail;
    }
  },
  performance: globalThis.performance ?? { now: () => Date.now() },
});

async function main() {
const events = await import("../src/lib/insight-events");
const sink = await import("../src/lib/insight-analytics-sink");

const seen: Array<{ name: string; props: Record<string, unknown> }> = [];
shim.addEventListener("gaitai:insight-event", (event) => {
  const detail = event.detail as { name: string; props: Record<string, unknown> };
  seen.push({ name: detail.name, props: detail.props });
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* 1 · once */
events.__resetInsightEventsForTests();
for (let i = 0; i < 5; i++) {
  events.trackInsightEvent("insight_open", { article_slug: "a", series: "S" }, { once: "a" });
}
assert.equal(seen.filter((e) => e.name === "insight_open").length, 1, "once fires exactly once");

/* 2 · session once survives a page-load reset */
events.trackInsightEvent("article_helpful_yes", { article_slug: "a" }, { once: "a", session: true });
events.__resetInsightEventsForTests();
events.trackInsightEvent("article_helpful_yes", { article_slug: "a" }, { once: "a", session: true });
assert.equal(seen.filter((e) => e.name === "article_helpful_yes").length, 1, "session once survives reset");

/* 3 · debounce collapses a drag */
events.__resetInsightEventsForTests();
for (let stage = 0; stage < 8; stage++) {
  events.trackInsightEvent("pipeline_stage_changed", { article_slug: "a", stage }, { debounce: "pipeline" });
}
await sleep(500);
const staged = seen.filter((e) => e.name === "pipeline_stage_changed");
assert.equal(staged.length, 1, "eight stage changes in a burst emit once");
assert.equal(staged[0].props.stage, 7, "the settled stage is the one emitted");

/* 4 · prohibited names and free text are dropped */
const safe = events.sanitize({
  article_slug: "a",
  email: "someone@example.com",
  text: "hello",
  filename: "walk.mp4",
  user_id: "123",
  note: "a\nmultiline",
  address: "x",
  handle: "person@site",
  long: "x".repeat(81),
  stage: 3,
  ratio: 0.123456,
  ok: true,
  Bad_Key: "value",
});
assert.deepEqual(Object.keys(safe).sort(), ["article_slug", "ok", "ratio", "stage"], "only public fields survive");
assert.equal(safe.ratio, 0.12, "numbers are rounded, never precise");

/* 5 · context enriches, explicit props win, empty props do not erase */
events.__resetInsightEventsForTests();
events.setInsightContext({ article_slug: "ctx-slug", series: "Inside the Signal", reading_mode: "read" });
events.trackInsightEvent("insight_shared", { article_slug: "", method: "selection" });
events.trackInsightEvent("term_inspected", { article_slug: "explicit", term: "cadence" });
const shared = seen.find((e) => e.name === "insight_shared")!;
assert.equal(shared.props.article_slug, "ctx-slug", "empty slug falls back to context");
assert.equal(shared.props.series, "Inside the Signal");
assert.equal(shared.props.reading_mode, "read");
assert.equal(shared.props.device_class, "desktop");
assert.equal(shared.props.theme, "dark");
const term = seen.find((e) => e.name === "term_inspected")!;
assert.equal(term.props.article_slug, "explicit", "an explicit slug wins over context");
events.clearInsightContext();

/* 6 · the sink keys by day × article × event and folds one dimension in */
sink.recordInsightEvent("motion_dna_branch_selected", { article_slug: "your-walk", branch: "identity" });
sink.recordInsightEvent("motion_dna_branch_selected", { article_slug: "your-walk", branch: "identity" });
sink.recordInsightEvent("interactive_figure_start", {
  article_slug: "your-walk",
  figure_id: "motion-dna-branches",
  time_to_first: "2-5s",
});
sink.recordInsightEvent("filter_used", { type: "all", topic: "mobility", sort: "newest" });
const pending = sink.__pendingInsightCounts();
const byEvent = Object.fromEntries(pending.map((p) => [p.event, p]));
assert.equal(byEvent["motion_dna_branch_selected:identity"].count, 2, "same key folds into one increment");
assert.equal(byEvent["motion_dna_branch_selected:identity"].article, "your-walk");
assert.match(byEvent["motion_dna_branch_selected:identity"].day, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(byEvent["interactive_figure_start:motion-dna-branches"], "figure start keyed by figure");
assert.ok(byEvent["interactive_figure_start.time_to_first:2-5s"], "time-to-first counted under its own key");
assert.equal(byEvent["filter_used:all"].article, "_site", "hub events count under the site bucket");
for (const item of pending) {
  assert.match(item.event, /^[a-z0-9_:.-]+$/, `event key is id-safe: ${item.event}`);
  assert.match(item.article, /^[a-z0-9_-]+$/, `article key is id-safe: ${item.article}`);
}

/* 7 · a flush without Firebase configured never throws into the caller */
await sleep(1700);
events.trackInsightEvent("cover_story_open", { article_slug: "a" });
await sleep(50);
assert.ok(seen.some((e) => e.name === "cover_story_open"), "events keep flowing after a failed flush");

/* 8 · time-to-first buckets */
assert.equal(events.timeToFirstBucket(500), "0-2s");
assert.equal(events.timeToFirstBucket(2500), "2-5s");
assert.equal(events.timeToFirstBucket(7000), "5-10s");
assert.equal(events.timeToFirstBucket(20000), ">10s");


/* 9 · the admin read side folds counts without inventing anything */
const read = await import("../src/lib/insight-analytics-read");
const docs = [
  { day: "2026-09-01", article: "a", event: "insight_open", count: 3 },
  { day: "2026-09-08", article: "a", event: "insight_open", count: 2 },
  { day: "2026-09-08", article: "a", event: "interactive_figure_start:hero", count: 2 },
  { day: "2026-09-08", article: "a", event: "interactive_figure_start.time_to_first:2-5s", count: 2 },
  { day: "2026-09-08", article: "b", event: "article_helpful_yes", count: 1 },
  { day: "2026-09-08", article: "b", event: "article_helpful_reason:too-technical", count: 1 },
  { day: "2026-09-08", article: "b", event: "bad", count: -4 },
];
const all = read.aggregateInsightCounts(docs);
assert.equal(all.total, 11, "negative counts are ignored, everything else is summed");
assert.equal(all.days, 2);
assert.equal(read.eventTotal(all.byArticle.a, "insight_open"), 5);
assert.equal(read.eventTotal(all.byArticle.a, "interactive_figure_start"), 2, "secondary keys do not double-count the event");
assert.equal(read.eventWith(all.byArticle.a, "interactive_figure_start", "hero"), 2);
assert.deepEqual(read.breakdown(all, "interactive_figure_start", { secondary: "time_to_first" }), [{ dimension: "2-5s", count: 2 }]);
assert.deepEqual(read.breakdown(all, "article_helpful_reason"), [{ dimension: "too-technical", count: 1 }]);
const recent = read.aggregateInsightCounts(docs, "2026-09-05");
assert.equal(read.eventTotal(recent.byArticle.a, "insight_open"), 2, "a period start excludes older days");
assert.equal(read.share(1, 0), null, "no share without a denominator");
assert.equal(read.share(1, 4), 25);
assert.deepEqual(read.parseKey("interactive_figure_start.time_to_first:2-5s"), { event: "interactive_figure_start", secondary: "time_to_first", dimension: "2-5s" });
assert.equal(read.periodStart("all"), null);
assert.match(read.periodStart(7, new Date("2026-09-09T12:00:00Z")) ?? "", /^2026-09-03$/);

console.log("Insight analytics checks passed.");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
