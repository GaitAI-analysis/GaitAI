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
import {
  TALKS_SPEAKER,
  TALK_KIND_LABEL,
  talkRecords,
} from "@/data/talks";
import { gaitscapeNodes } from "@/data/gaitscape/graph";
import { allPublications } from "@/data/publications";
import { researchAreas } from "@/data/evidence";
import { useCaseDetails } from "@/data/usecase-details";
import { insightArticles } from "@/data/insights";
import { LAB_BASIS_LABEL, labs } from "@/data/labs";
import {
  comparisonHref,
  comparisonLabel,
  productComparisons,
} from "@/data/comparisons";

export type SearchGroup =
  | "destination"
  | "product"
  | "capability"
  | "environment"
  | "research"
  | "publication"
  | "talk"
  | "lab"
  | "insight";

/** Group order in the palette — most-used first. */
export const SEARCH_GROUPS: SearchGroup[] = [
  "destination",
  "product",
  "lab",
  "capability",
  "environment",
  "research",
  "publication",
  "talk",
  "insight",
];

export const SEARCH_GROUP_LABEL: Record<SearchGroup, string> = {
  destination: "Pages",
  product: "Products",
  lab: "Labs",
  capability: "Capabilities",
  environment: "Environments",
  research: "Research",
  publication: "Publications",
  talk: "Talks",
  insight: "Blog",
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
// the right place for a name the site no longer shows. This route has been
// called the Movement Lab, the Movement Intelligence Lab and the Movement
// Studio; whichever one a reader learned has to keep finding it, for a page
// that never moved. The visible title is the current name only, and the
// current name is the Movement Intelligence Lab again.
const destinationEntries: SearchEntry[] = [
  {
    id: "destination:movement-lab",
    group: "destination",
    title: "Movement Intelligence Lab",
    detail: "See movement become intelligence, stage by stage, with example values",
    meta: "Interactive",
    href: "/movement-lab/",
    haystack: norm([
      "movement intelligence lab",
      "analyze explore movement pose gait cycle features analytics report",
      "trajectories density flow candidate events operator view",
      "explainability illustrative demo example values footage",
      /* Retired names: findable, never shown. */
      "movement studio",
      "movement lab",
    ]),
  },
  {
    /* The experiments index. Its own entries deep-link into the two routes
       above, so they are not indexed separately — that would list one page
       twice under one heading. Their names live in the haystack instead, so
       "signal inspector" and "footage check" both arrive here. */
    id: "destination:labs",
    group: "destination",
    title: "GaitAI Labs",
    detail: "Experimental movement-intelligence experiences, in one place",
    meta: "Interactive",
    href: "/labs/",
    haystack: norm([
      "gaitai labs experiments experimental",
      "explore movement before deploying it",
      /* Every lab's name and strap, so "movement x-ray", "time machine" and
         "footage check" all arrive at the index that lists them. */
      labs.map((lab) => `${lab.name} ${lab.strap}`).join(" "),
      "human view ai view x-ray xray skeleton landmarks trajectory",
      "longitudinal sessions baseline scrub trend",
    ]),
  },
  {
    /* The page a visitor is most likely to search by a word that is not its
       route: "blog" reaches nothing under /insights unless it is spelled out
       somewhere, and the retired name has to keep working for anyone who
       learned it. */
    id: "destination:blog",
    group: "destination",
    title: "Blog & Updates",
    detail:
      "Technical explainers, research translation, engineering notes and product updates",
    meta: "Editorial",
    href: "/insights/",
    haystack: norm([
      "blog updates gaitai blog",
      "articles posts stories essays research notes engineering notes",
      "product updates company news what we are building",
      /* Retired name: findable, never shown. */
      "journal gaitai journal insights",
    ]),
  },
  {
    /* The blog's three standing destinations beside the feed. They are in the
       navbar's Blog dropdown, the sitemap and the atlas; leaving them out of
       the palette was the one place a reader could ask for "foundations" or
       "archive" and be told the site has neither. */
    id: "destination:blog-foundations",
    group: "destination",
    title: "GaitAI Foundations",
    detail: "The five ideas behind GaitAI's movement-intelligence thinking",
    meta: "Editorial",
    href: "/insights/start-here/",
    haystack: norm([
      "gaitai foundations start here new to gaitai where do i begin",
      "curated reading path five stories introduction primer",
      "movement intelligence identity responsible ai mobility evidence",
    ]),
  },
  {
    id: "destination:blog-topics",
    group: "destination",
    title: "Blog Topics",
    detail: "Browse the writing by subject",
    meta: "Editorial",
    href: "/insights/topics/",
    haystack: norm([
      "topics subjects categories browse by subject",
      "movement intelligence responsible ai mobility research engineering",
      "what has gaitai written about",
    ]),
  },
  {
    id: "destination:blog-archive",
    group: "destination",
    title: "Blog Archive",
    detail: "Everything GaitAI has published, by year and month",
    meta: "Editorial",
    href: "/insights/archive/",
    haystack: norm([
      "archive back issues everything published complete index",
      "by year by month older posts past stories",
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

// ── Labs ───────────────────────────────────────────────────────────────────
// One entry per experiment, linked to its own address rather than to the index
// that lists it. Before this, "privacy lens" and "movement x-ray" matched only
// the /labs haystack, so a reader who knew what they wanted landed on a page
// listing eight things and had to find it again. Four of the eight live inside
// a longer page, so their href carries an anchor — which is exactly why they
// need their own row: nothing else on the site can take a reader straight to
// the Fusion Sandbox.
const labEntries: SearchEntry[] = labs.map((lab) => ({
  id: `lab:${lab.id}`,
  group: "lab" as const,
  title: lab.name,
  detail: lab.strap,
  /* Where it lives, when that is not simply its own page — the same
     distinction /labs draws, so the palette and the index agree. */
  meta: lab.home ?? "Interactive",
  /* labs.ts already carries trailing slashes before its anchors — the
     validator enforces it — so this passes the href straight through. */
  href: lab.href,
  haystack: norm([
    lab.name,
    lab.strap,
    lab.body,
    LAB_BASIS_LABEL[lab.basis],
    lab.home,
    "lab labs experiment experimental interactive try explore",
  ]),
}));

// ── Named comparisons ──────────────────────────────────────────────────────
// "WalkScan vs RehabTrack" is a real query, and before this it matched only
// the two module pages separately — which is precisely the answer a reader
// asking it has already failed to get. Grouped with products, because that is
// what they are about, and the meta says "Comparison" so the row is not
// mistaken for a module.
const comparisonEntries: SearchEntry[] = productComparisons.map(
  (comparison) => ({
    id: `product:compare-${comparison.id}`,
    group: "product" as const,
    title: comparisonLabel(comparison),
    detail: comparison.question,
    meta: "Comparison",
    href: comparisonHref(comparison),
    haystack: norm([
      comparisonLabel(comparison),
      comparison.pair.join(" "),
      comparison.question,
      "compare comparison versus vs side by side difference which",
    ]),
  }),
);

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

// ── Capabilities, movement signals and capture sources, from the graph ──────
// Three node families, one palette group, three metas. They are all "things
// the platform knows about" from a searcher's point of view, and splitting
// them into three headings for four rows each would make the palette longer
// without making anything easier to find. The meta keeps them distinct: a
// capture source is what a reader HAS, a movement signal is what is read off
// it, and a capability is what does the reading.
//
// Capture sources are the reason "CCTV" now finds something. It used to match
// only whatever product descriptions happened to contain the word.
const capabilityEntries: SearchEntry[] = gaitscapeNodes
  .filter(
    (n) =>
      n.type === "capability" || n.type === "signal" || n.type === "input",
  )
  .map((n) => ({
    id: `capability:${n.id}`,
    group: "capability" as const,
    title: n.title,
    detail: n.shortDescription ?? "",
    meta:
      n.type === "signal"
        ? "Movement signal"
        : n.type === "input"
          ? "Capture source"
          : "AI capability",
    href: `/gaitscape/?focus=${n.id}`,
    haystack: norm([
      n.title,
      n.shortDescription,
      n.type,
      /* The words a reader would actually type for a camera or a device,
         which are not all in the node titles. */
      n.type === "input"
        ? "input capture source camera footage feed device sensor what i have"
        : undefined,
    ]),
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

// ── Journal ────────────────────────────────────────────────────────────────
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

// ── Talks, presentations and the poster ─────────────────────────────────────
// Every field comes from the record, so a search for "ICA3C", "poster" or
// "Windhoek" finds the entry it belongs to. They all resolve to one route,
// which is why the id carries the record id and the detail carries the venue:
// the palette has to distinguish 22 rows that share an href.
const talkEntries: SearchEntry[] = talkRecords.map((talk) => ({
  id: `talk-${talk.id}`,
  group: "talk",
  title: talk.title,
  detail: [TALK_KIND_LABEL[talk.kind], talk.event, talk.venue]
    .filter(Boolean)
    .join(" · "),
  meta: String(talk.year),
  /* Trailing slash required: next.config.mjs sets trailingSlash, so a hard
     load of "/research/talks" 404s on GitHub Pages even though client-side
     navigation normalised it. All 22 talk entries shared this href. */
  href: "/research/talks/",
  haystack: norm([
    talk.title,
    TALK_KIND_LABEL[talk.kind],
    talk.event,
    talk.venue,
    talk.description,
    talk.date,
    String(talk.year),
    TALKS_SPEAKER,
    "talk presentation poster speaking record founder",
  ]),
}));

export const searchIndex: SearchEntry[] = [
  ...destinationEntries,
  ...productEntries,
  ...comparisonEntries,
  ...labEntries,
  ...capabilityEntries,
  ...environmentEntries,
  ...researchEntries,
  ...publicationEntries,
  ...talkEntries,
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
