/**
 * READING THE AGGREGATE — the admin side of `insight-analytics-sink.ts`.
 *
 * The sink writes one document per day × article × event key. This module
 * reads those documents (admin-only under `firestore.rules`) and folds them
 * into the shapes the Insights Analytics view needs. Everything below the
 * fetch is pure and unit-tested; the fetch itself is the only Firebase call.
 *
 * Keys arrive as `event`, `event:dimension` or `event.secondary:dimension`
 * (see the sink). `parseKey` splits them back apart; the aggregate keeps the
 * raw key so no information is lost on the way to the table.
 *
 * Nothing here can produce a per-reader figure: the documents hold counts,
 * and counts are all this module knows how to add.
 */

export type InsightCountDoc = { day: string; article: string; event: string; count: number };

export type Period = 7 | 30 | 90 | "all";

/** The first day (inclusive, ISO date) a period reaches back to; null = all. */
export function periodStart(period: Period, now = new Date()): string | null {
  if (period === "all") return null;
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - (period - 1));
  return start.toISOString().slice(0, 10);
}

export type ParsedKey = { event: string; secondary?: string; dimension?: string };

export function parseKey(key: string): ParsedKey {
  const colon = key.indexOf(":");
  const head = colon === -1 ? key : key.slice(0, colon);
  const dimension = colon === -1 ? undefined : key.slice(colon + 1);
  const dot = head.indexOf(".");
  if (dot === -1) return { event: head, dimension };
  return { event: head.slice(0, dot), secondary: head.slice(dot + 1), dimension };
}

/** article → raw key → count, plus per-article totals reachable by event name. */
export interface InsightAggregate {
  byArticle: Record<string, Record<string, number>>;
  /** Number of distinct days with at least one count. */
  days: number;
  total: number;
}

export function aggregateInsightCounts(docs: InsightCountDoc[], since: string | null = null): InsightAggregate {
  const byArticle: Record<string, Record<string, number>> = {};
  const days = new Set<string>();
  let total = 0;
  for (const doc of docs) {
    if (since && doc.day < since) continue;
    if (!Number.isFinite(doc.count) || doc.count <= 0) continue;
    const bucket = (byArticle[doc.article] ??= {});
    bucket[doc.event] = (bucket[doc.event] ?? 0) + doc.count;
    days.add(doc.day);
    total += doc.count;
  }
  return { byArticle, days: days.size, total };
}

/** Sum of every key for `event` on one article (all dimensions folded), ignoring secondary keys. */
export function eventTotal(counts: Record<string, number> | undefined, event: string): number {
  if (!counts) return 0;
  let sum = 0;
  for (const [key, count] of Object.entries(counts)) {
    const parsed = parseKey(key);
    if (parsed.event === event && !parsed.secondary) sum += count;
  }
  return sum;
}

/** Count for one exact `event:dimension` on one article. */
export function eventWith(counts: Record<string, number> | undefined, event: string, dimension: string): number {
  return counts?.[`${event}:${dimension}`] ?? 0;
}

/** dimension → count for one event across the given articles (or all). */
export function breakdown(
  aggregate: InsightAggregate,
  event: string,
  options: { articles?: string[]; secondary?: string } = {},
): Array<{ dimension: string; count: number }> {
  const out = new Map<string, number>();
  const articles = options.articles ?? Object.keys(aggregate.byArticle);
  for (const article of articles) {
    for (const [key, count] of Object.entries(aggregate.byArticle[article] ?? {})) {
      const parsed = parseKey(key);
      if (parsed.event !== event) continue;
      if ((parsed.secondary ?? undefined) !== options.secondary) continue;
      if (parsed.dimension === undefined) continue;
      out.set(parsed.dimension, (out.get(parsed.dimension) ?? 0) + count);
    }
  }
  return [...out.entries()].map(([dimension, count]) => ({ dimension, count })).sort((a, b) => b.count - a.count || a.dimension.localeCompare(b.dimension));
}

/** Sum of an event across every article. */
export function siteTotal(aggregate: InsightAggregate, event: string): number {
  return Object.values(aggregate.byArticle).reduce((sum, counts) => sum + eventTotal(counts, event), 0);
}

/** A whole-number percentage, or null when there is nothing to divide by. */
export function share(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

/**
 * Fetch every count document from `since` onward (or all). Requires an
 * admin session — the rules refuse everyone else, and the caller reports the
 * failure rather than showing invented zeros.
 */
export async function fetchInsightCounts(since: string | null): Promise<InsightCountDoc[]> {
  const [fs, { db }] = await Promise.all([import("firebase/firestore"), import("@/lib/firebase")]);
  const base = fs.collection(db, "insightEventCounts");
  const snap = await fs.getDocs(since ? fs.query(base, fs.where("day", ">=", since)) : base);
  const docs: InsightCountDoc[] = [];
  snap.forEach((row) => {
    const data = row.data() as Partial<InsightCountDoc>;
    if (typeof data.day !== "string" || typeof data.article !== "string" || typeof data.event !== "string") return;
    docs.push({ day: data.day, article: data.article, event: data.event, count: typeof data.count === "number" ? data.count : 0 });
  });
  return docs;
}
