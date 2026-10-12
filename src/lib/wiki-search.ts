import type { WikiSearchEntry } from "@/data/wiki";

export function wikiSearchArea(entry: WikiSearchEntry) {
  return /\/(web|android|backend)(?:\/|#|$)/.exec(entry.href)?.[1] ?? "foundation";
}

/** Search stays local. Rank titles and phrases first, with platform context included. */
export function searchWiki(entries: WikiSearchEntry[], query: string, limit = 10) {
  const phrase = query.trim().toLowerCase();
  const terms = phrase.split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return entries.map((entry, index) => {
    const title = entry.title.toLowerCase();
    const context = `${entry.product} ${entry.section} ${wikiSearchArea(entry)}`.toLowerCase();
    const text = `${title} ${context} ${entry.text.toLowerCase()}`;
    const score = terms.every((term) => text.includes(term))
      ? (title === phrase ? 40 : title.includes(phrase) ? 16 : 0)
        + terms.reduce((total, term) => total + (title.includes(term) ? 6 : context.includes(term) ? 3 : 1), 0)
        + (entry.href.includes("#") ? 0 : 2)
      : 0;
    return { entry, score, index };
  }).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit).map(({ entry }) => entry);
}

/** Show the matching passage instead of always showing the beginning of a section. */
export function wikiSearchExcerpt(text: string, query: string, length = 180) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const first = terms.map((term) => text.toLowerCase().indexOf(term)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = first > length - 40 ? Math.max(0, text.lastIndexOf(" ", first - 45) + 1) : 0;
  let end = Math.min(text.length, start + length);
  if (end < text.length) end = text.lastIndexOf(" ", end) > start ? text.lastIndexOf(" ", end) : end;
  return `${start ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}
