// ============================================================================
// INTELLIGENCE SEARCH INDEX
// ----------------------------------------------------------------------------
// One flat, typed index over everything the site already knows, built by
// DERIVING from the canonical sources — never by listing terms by hand:
//
//   products.ts .................. 23 modules + 17 environments
//   gaitscape/graph.ts ........... capabilities and movement signals
//   publications.ts .............. 8 papers + the granted patent
//   evidence.ts .................. research areas
//   usecase-details.ts ........... the environment detail routes
//   insights.ts .................. published articles
//
// Adding a module, a paper or an article puts it in the palette with no edit
// here. There is no second copy of any product name, description or route.
//
// SEARCH TEXT
// Each entry carries a lowercased `haystack` assembled from its own real
// vocabulary — a module's name, label, description, outputs, capabilities and
// signals — so "queue" finds CrowdSense through its documented outputs and
// "fall risk" finds FallRisk, the elderly-care environment and the screening
// capability. No synonym table is invented; if the word is not in the data,
// it is not a match, which is the honest behaviour.
// ============================================================================

import { allProducts, industryUseCases } from "@/data/products";
import { gaitscapeNodes } from "@/data/gaitscape/graph";
import { allPublications } from "@/data/publications";
import { researchAreas } from "@/data/evidence";
import { useCaseDetails } from "@/data/usecase-details";
import { insightArticles } from "@/data/insights";

export type SearchGroup =
  | "destination"
  | "product"
  | "capability"
  | "environment"
  | "research"
  | "publication"
  | "insight";

/** Group order in the palette — most-used first. */
export const SEARCH_GROUPS: SearchGroup[] = [
  "destination",
  "product",
  "capability",
  "environment",
  "research",
  "publication",
  "insight",
];

export const SEARCH_GROUP_LABEL: Record<SearchGroup, string> = {
  destination: "Experiences",
  product: "Products",
  capability: "Capabilities",
  environment: "Environments",
  research: "Research",
  publication: "Publications",
  insight: "Insights",
};

export interface SearchEntry {
  id: string;
  group: SearchGroup;
  title: string;
  /** One line under the title — the entry's own summary, never invented. */
  detail: string;
  /** Short right-aligned qualifier: family, year, record count. */
  meta?: string;
  href: string;
  /** Lowercased search text assembled from the entry's real vocabulary. */
  haystack: string;
}

const norm = (parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" ").toLowerCase();

// ── Destinations ────────────────────────────────────────────────────────────
// The two interactive experiences. Everything else in this index is derived
// from a data record; these are routes, so this is the one place the index
// names something by hand — and the only place it carries a RETIRED name.
//
// The palette indexed every module, capability, environment, paper and essay,
// and neither of the two experiences a reader is most likely to look for by
// name. Searching "Movement Studio" returned nothing at all.
//
// ALIASES. `haystack` is search text and is never rendered, which makes it
// the right place for a name the site no longer shows. "Movement Intelligence
// Lab" and "Movement Lab" were both used for this route before the rename;
// someone who types either would otherwise get nothing, for a page that has
// not moved. The visible title is the current name only.
const destinationEntries: SearchEntry[] = [
  {
    id: "destination:movement-studio",
    group: "destination",
    title: "Movement Studio",
    detail: "Analyze and explore movement, stage by stage, on synthetic data",
    meta: "Interactive",
    href: "/movement-lab/",
    haystack: norm([
      "movement studio",
      "analyze explore movement pose gait cycle features analytics report",
      "trajectories density flow candidate events operator view",
      "explainability illustrative demo synthetic data footage",
      /* Retired names: findable, never shown. */
      "movement intelligence lab",
      "movement lab",
    ]),
  },
  {
    id: "destination:gaitscape",
    group: "destination",
    title: "GaitScape",
    detail: "The interactive human movement intelligence landscape",
    meta: "Interactive",
    href: "/gaitscape/",
    haystack: norm([
      "gaitscape",
      "ecosystem map landscape graph relationships",
      "capability matrix compare systems signals outcomes",
    ]),
  },
];

// ── Products ────────────────────────────────────────────────────────────────
const productEntries: SearchEntry[] = allProducts.map((p) => ({
  id: `product:${p.id}`,
  group: "product",
  title: p.short,
  detail: p.label,
  meta: p.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision",
  href: `/${p.vertical}/${p.id}/`,
  haystack: norm([
    p.short,
    p.name,
    p.label,
    p.headline,
    p.description,
    p.outputs.join(" "),
    p.users.join(" "),
  ]),
}));

// ── Capabilities and movement signals, from the graph ───────────────────────
const capabilityEntries: SearchEntry[] = gaitscapeNodes
  .filter((n) => n.type === "capability" || n.type === "signal")
  .map((n) => ({
    id: `capability:${n.id}`,
    group: "capability" as const,
    title: n.title,
    detail: n.shortDescription ?? "",
    /* Signals and capabilities share a group in the palette but are labelled
       apart, because "Crowd movement" is an input and "Trajectory analysis"
       is what reads it. */
    meta: n.type === "signal" ? "Movement signal" : "AI capability",
    href: `/gaitscape/?focus=${n.id}`,
    haystack: norm([n.title, n.shortDescription, n.type]),
  }));

// ── Environments ────────────────────────────────────────────────────────────
const detailBySlug = new Map(useCaseDetails.map((d) => [d.caseId, d.slug]));

const environmentEntries: SearchEntry[] = industryUseCases.map((e) => {
  const slug = detailBySlug.get(e.id);
  const products = e.productIds.join(" ");
  return {
    id: `environment:${e.id}`,
    group: "environment",
    title: e.industry,
    detail: e.problem,
    meta: e.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision",
    href: slug ? `/use-cases/${slug}/` : `/use-cases/#${e.id}`,
    haystack: norm([e.industry, e.problem, e.outcome, products]),
  };
});

// ── Research areas ──────────────────────────────────────────────────────────
const researchEntries: SearchEntry[] = researchAreas.map((a) => ({
  id: `research:${a.id}`,
  group: "research",
  title: a.title,
  detail: a.summary,
  meta: `${a.publications.length} ${
    a.publications.length === 1 ? "record" : "records"
  }`,
  href: `/research/evidence/?area=${a.id}`,
  haystack: norm([
    a.title,
    a.summary,
    a.capabilities.map((c) => c.title).join(" "),
  ]),
}));

// ── Publications and the patent ─────────────────────────────────────────────
const publicationEntries: SearchEntry[] = allPublications.map((p) => ({
  id: `publication:${p.id}`,
  group: "publication",
  title: p.title,
  detail: `${p.venue} · ${p.publisher}`,
  meta: `${p.year}`,
  href: `/publications/${p.id}/`,
  haystack: norm([
    p.title,
    p.venue,
    p.publisher,
    p.kind,
    p.authors?.join(" "),
    String(p.year),
  ]),
}));

// ── Insights ────────────────────────────────────────────────────────────────
const insightEntries: SearchEntry[] = insightArticles.map((a) => ({
  id: `insight:${a.slug}`,
  group: "insight",
  title: a.title,
  detail: a.deck,
  meta: a.category,
  href: `/insights/${a.slug}/`,
  haystack: norm([
    a.title,
    a.deck,
    a.excerpt,
    a.category,
    a.question,
    a.topics.join(" "),
  ]),
}));

export const searchIndex: SearchEntry[] = [
  ...destinationEntries,
  ...productEntries,
  ...capabilityEntries,
  ...environmentEntries,
  ...researchEntries,
  ...publicationEntries,
  ...insightEntries,
];

/**
 * Rank a query against the index.
 *
 * Scoring is deliberately simple and explainable: a title that starts with the
 * query outranks a title that contains it, which outranks a body match. There
 * is no fuzzy matching, because a palette that returns near-misses for a
 * technical vocabulary costs more than it saves — if "cadence" is not in the
 * data, returning nothing is the correct answer.
 *
 * Every term must match somewhere, so "fall risk elderly" narrows rather than
 * widens.
 */
export function searchEntries(query: string, limit = 24): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const terms = q.split(/\s+/);

  const scored: { entry: SearchEntry; score: number }[] = [];

  for (const entry of searchIndex) {
    const title = entry.title.toLowerCase();
    let score = 0;
    let matchedAll = true;

    for (const term of terms) {
      if (title.startsWith(term)) score += 100;
      else if (title.includes(term)) score += 60;
      else if (entry.detail.toLowerCase().includes(term)) score += 25;
      else if (entry.haystack.includes(term)) score += 10;
      else {
        matchedAll = false;
        break;
      }
    }

    if (matchedAll) scored.push({ entry, score });
  }

  return scored
    .sort(
      (a, b) =>
        b.score - a.score ||
        SEARCH_GROUPS.indexOf(a.entry.group) -
          SEARCH_GROUPS.indexOf(b.entry.group) ||
        a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, limit)
    .map((s) => s.entry);
}

/**
 * The empty state: a few real starting points rather than a blank panel or an
 * invented "trending" list. Flagship modules, then the two family hubs.
 */
export const searchStarters: SearchEntry[] = (() => {
  const flagships = productEntries.filter((e) =>
    allProducts.some((p) => p.flagship && `product:${p.id}` === e.id),
  );
  /* The two experiences lead: they are the hardest things on the site to
     reach by guessing a name, and the most useful things to be offered. */
  return [...destinationEntries, ...flagships.slice(0, 4)];
})();
