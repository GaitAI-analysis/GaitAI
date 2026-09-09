// ============================================================================
// THE CANONICAL SITE MAP
// ----------------------------------------------------------------------------
// One tree describing the WEBSITE — what contains what, and what a page's
// neighbours are. It answers "where am I?", which is a different question from
// the one GaitScape answers ("how does the intelligence connect?"), and it is
// built from a different kind of fact: routes, not relationships.
//
// EVERY LEAF IS DERIVED. Nothing here is a hand-kept list of pages. The
// sections and their order come from `navLinks`, the products from
// `allProducts`, the environments from `useCaseDetails` × `industryUseCases`,
// the articles from `insightArticles`, the papers from `allPublications`. Add a
// product or publish an article and it appears in the Atlas, in the location
// trail and in the XML sitemap without anyone editing this file — which is the
// only way a site map of seventy pages stays true.
//
// WHAT IS DELIBERATELY NOT HERE. /admin-controlpanel: it is not part of the
// public site and a map that advertises it is a map that invites people to
// try the door. Firestore-published posts are also absent — they are dynamic
// and only `sitemap.ts` (which can await them) knows whether any exist.
//
// A NODE WITHOUT A ROUTE IS A GROUP, NOT A DEAD LINK. "Explore" and
// "Research & IP" are navigation groupings with no page of their own, so they
// render as labels with a child count and never as links to nowhere.
// ============================================================================

import { allProducts, industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
import { insightArticles } from "@/data/insights";
import { allPublications } from "@/data/publications";
import { talkRecords } from "@/data/talks";
import { gaitLabs } from "@/data/labs";
import { topicLabel } from "@/lib/publication";

/** Which accent a branch inherits. Four families, not a rainbow. */
export type AtlasFamily =
  | "root"
  | "mobilitycare"
  | "securevision"
  | "research"
  | "editorial"
  | "neutral";

export interface AtlasNode {
  id: string;
  label: string;
  /** Absolute route with a trailing slash. Absent on grouping nodes. */
  route?: string;
  /** One line, shown on hover/focus and in the detail panel. */
  description?: string;
  /** Secondary line — a year, a venue, a count. Never invented. */
  meta?: string;
  family: AtlasFamily;
  children?: AtlasNode[];
}

const slash = (route: string) =>
  route === "/" ? "/" : `${route.replace(/\/+$/, "")}/`;

/* ── Products ─────────────────────────────────────────────────────────────
   Two families, each from the product registry. `id` IS the detail route's
   slug, which is why nothing here has to know about product-details.ts. */

function productLeaves(vertical: Vertical): AtlasNode[] {
  return allProducts
    .filter((product) => product.vertical === vertical)
    .map((product) => ({
      id: `product:${product.id}`,
      label: product.short,
      route: slash(`/${product.vertical}/${product.id}`),
      description: product.label,
      family: vertical,
    }));
}

/* ── Environments ─────────────────────────────────────────────────────────
   `useCaseDetails` carries the route; the readable name lives on the
   `industryUseCases` record it extends, so the two are joined here rather
   than duplicating either. */

const environmentLeaves: AtlasNode[] = useCaseDetails.map((detail) => {
  const base = industryUseCases.find((entry) => entry.id === detail.caseId);
  return {
    id: `environment:${detail.slug}`,
    label: base?.industry ?? detail.slug,
    route: slash(`/use-cases/${detail.slug}`),
    description: detail.valueProp,
    family: detail.family,
  };
});

/* ── Editorial and research records ───────────────────────────────────── */

const articleLeaves: AtlasNode[] = insightArticles.map((article) => ({
  id: `article:${article.slug}`,
  label: article.title,
  route: slash(`/insights/${article.slug}`),
  description: article.deck,
  meta: article.category,
  family: "editorial",
}));

const topicLeaves: AtlasNode[] = [...new Set(insightArticles.flatMap((article) => article.topics))]
  .sort((a, b) => topicLabel(a).localeCompare(topicLabel(b)))
  .map((topic) => ({
    id: `insights-topic:${topic}`,
    label: topicLabel(topic),
    route: slash(`/insights/topic/${topic}`),
    description: `Stories filed under ${topicLabel(topic)}`,
    family: "editorial" as const,
  }));

const publicationLeaves: AtlasNode[] = allPublications.map((record) => ({
  id: `publication:${record.id}`,
  label: record.title,
  route: slash(`/publications/${record.id}`),
  description: record.venue,
  meta: `${record.year} · ${record.kind === "patent" ? "Patent" : "Paper"}`,
  family: "research",
}));

/* ── The tree ─────────────────────────────────────────────────────────────
   Section order mirrors `navLinks`, so the Atlas and the navbar cannot
   disagree about the shape of the site. */

export const siteMap: AtlasNode = {
  id: "root",
  label: "GaitAI",
  route: "/",
  description: "Human movement intelligence, end to end",
  family: "root",
  children: [
    {
      id: "products",
      label: "Products",
      route: "/products/",
      description: `All ${allProducts.length} modular products`,
      family: "neutral",
      children: [
        {
          id: "mobilitycare",
          label: "MobilityCare",
          route: "/mobilitycare/",
          description: "Clinical movement intelligence",
          family: "mobilitycare",
          children: productLeaves("mobilitycare"),
        },
        {
          id: "securevision",
          label: "SecureVision",
          route: "/securevision/",
          description: "Privacy-aware movement intelligence for public space",
          family: "securevision",
          children: productLeaves("securevision"),
        },
      ],
    },
    {
      /* A grouping node: the navbar's "Explore" menu has no page of its own. */
      id: "explore",
      label: "Explore",
      family: "neutral",
      children: [
        {
          id: "use-cases",
          label: "Use Cases",
          route: "/use-cases/",
          description: "Problems, by environment",
          family: "neutral",
          children: environmentLeaves,
        },
        {
          id: "gaitscape",
          label: "GaitScape",
          route: "/gaitscape/",
          description: "Interactive intelligence landscape",
          family: "neutral",
        },
        {
          id: "movement-lab",
          label: "Movement Intelligence Lab",
          route: "/movement-lab/",
          description: "Interactive movement-analysis experiments",
          family: "neutral",
        },
        {
          /* The gait research hub. Its two assets are leaves derived from
             `gaitLabs`, so a third asset appears here — and in the Atlas and
             the XML sitemap — with the record that adds it. */
          id: "labs",
          label: "GaitAI Labs",
          route: "/labs/",
          description: "Gait datasets & biometrics research",
          family: "research",
          children: gaitLabs.map((lab) => ({
            id: `labs-${lab.id}`,
            label: lab.name,
            route: lab.href,
            description: lab.strap,
            family: "research" as const,
          })),
        },
      ],
    },
    {
      id: "blog",
      label: "Blog",
      route: "/insights/",
      description: "Research translation, engineering notes and product updates",
      family: "editorial",
      children: [
        {
          id: "insights-start-here",
          label: "GaitAI Foundations",
          route: "/insights/start-here/",
          description: "A curated introduction to GaitAI",
          family: "editorial",
        },
        {
          id: "insights-topics",
          label: "Topics",
          route: "/insights/topics/",
          description: "Browse the writing by subject",
          family: "editorial",
        },
        {
          id: "insights-archive",
          label: "Archive",
          route: "/insights/archive/",
          description: "The complete publication by year and month",
          family: "editorial",
        },
        ...topicLeaves,
        ...articleLeaves,
      ],
    },
    {
      id: "research-ip",
      label: "Research & IP",
      family: "research",
      children: [
        {
          id: "research",
          label: "Research",
          route: "/research/",
          description: "Research areas and their evidence",
          family: "research",
        },
        {
          id: "research-evidence",
          label: "Evidence explorer",
          route: "/research/evidence/",
          description: "What each capability is grounded in",
          family: "research",
        },
        {
          id: "publications",
          label: "Publications",
          route: "/publications/",
          description: "Papers and the granted patent",
          family: "research",
          children: publicationLeaves,
        },
        {
          id: "talks",
          label: "Talks & presentations",
          route: "/research/talks/",
          description: `The founder speaking record · ${talkRecords.length}`,
          family: "research",
        },
        {
          id: "responsible-ai",
          label: "Responsible AI",
          route: "/legal/responsible-ai/",
          description: "How the systems may and may not be used",
          family: "research",
        },
        {
          id: "trust",
          label: "Trust",
          route: "/trust/",
          description: "The controls, and what is not claimed",
          family: "research",
        },
      ],
    },
    {
      id: "engage",
      label: "Engage",
      family: "neutral",
      children: [
        {
          id: "contact",
          label: "Request a demo",
          route: "/#contact",
          description: "The one contact form on the site",
          family: "neutral",
        },
        {
          id: "investors",
          label: "Investors",
          route: "/investors/",
          description: "The investment thesis",
          family: "neutral",
        },
      ],
    },
    {
      id: "legal",
      label: "Legal",
      family: "neutral",
      children: [
        {
          id: "privacy",
          label: "Privacy",
          route: "/legal/privacy/",
          description: "What is collected, and what is not",
          family: "neutral",
        },
        {
          id: "security",
          label: "Security",
          route: "/legal/security/",
          description: "How the platform is secured",
          family: "neutral",
        },
        {
          id: "terms",
          label: "Terms",
          route: "/legal/terms/",
          description: "Terms of use",
          family: "neutral",
        },
      ],
    },
  ],
};

/* ── Lookups ──────────────────────────────────────────────────────────────
   Built once at module load: two flat maps over a tree of ~70 nodes, so
   every consumer resolves a route in constant time instead of walking. */

const byId = new Map<string, AtlasNode>();
const parentOf = new Map<string, AtlasNode>();
const byRoute = new Map<string, AtlasNode>();

(function index(node: AtlasNode, parent?: AtlasNode) {
  byId.set(node.id, node);
  if (parent) parentOf.set(node.id, parent);
  /* Anchors are locations on a page, not pages: "/#contact" must not claim
     the trail for "/". */
  if (node.route && !node.route.includes("#")) byRoute.set(node.route, node);
  node.children?.forEach((child) => index(child, node));
})(siteMap);

export const atlasNode = (id: string) => byId.get(id);
export const atlasParent = (id: string) => parentOf.get(id);

/** Every routable page in the map, deduplicated, for the XML sitemap. */
export function siteRoutes(): string[] {
  return [...byRoute.keys()];
}

/**
 * The ancestor chain for a pathname, root first, current page last.
 *
 * Falls back to the longest matching ancestor, so a route the map does not
 * know yet still resolves to its section rather than to nothing — and returns
 * just the root for the home page, which is the honest answer there.
 */
export function atlasTrail(pathname: string): AtlasNode[] {
  const route = slash(pathname.split(/[?#]/)[0] || "/");

  let match = byRoute.get(route);
  if (!match) {
    /* Longest prefix wins: /publications/x/y resolves to /publications/. */
    let best: AtlasNode | undefined;
    let bestLength = 0;
    for (const [candidate, node] of byRoute) {
      if (
        candidate !== "/" &&
        route.startsWith(candidate) &&
        candidate.length > bestLength
      ) {
        best = node;
        bestLength = candidate.length;
      }
    }
    match = best;
  }
  if (!match) return [siteMap];

  const trail: AtlasNode[] = [];
  for (let node: AtlasNode | undefined = match; node; node = parentOf.get(node.id)) {
    trail.unshift(node);
  }
  return trail;
}

/**
 * The current page's neighbours: everything sharing its parent, in map order.
 * Empty for a page whose parent has no other children, so a caller can tell
 * "no siblings" from "one sibling".
 */
export function atlasSiblings(id: string): AtlasNode[] {
  const parent = parentOf.get(id);
  if (!parent?.children) return [];
  return parent.children.filter((child) => child.id !== id);
}

/** Leaves under a node, for the collapsed "· 12" counts. */
export function atlasCount(node: AtlasNode): number {
  if (!node.children) return 0;
  return node.children.length;
}
