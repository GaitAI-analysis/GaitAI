// ============================================================================
// EVIDENCE LAYER
// ----------------------------------------------------------------------------
// Resolves "what published work actually backs this?" for capabilities,
// products and research areas — entirely by DERIVING from data that already
// exists in the repository:
//
//   publications.ts ......... the 8 peer-reviewed papers + 1 granted patent
//   gaitscape/graph.ts ...... research nodes (with real publicationIds),
//                             RESEARCH_MAP (research → capability) and the
//                             product → capability relationships
//
// Nothing here introduces a new claim. If a capability has no research node
// mapped to it, this module returns nothing for it — that absence is the
// honest answer and is reported rather than filled in.
//
// IMPORTANT SCOPE NOTE
// The published record covers gait recognition / biometrics, pose-based gait
// analysis, privacy-preserving gait data and edge gait analytics. It does NOT
// contain clinical validation studies, accuracy benchmarks, datasets or pilot
// results. Evidence surfaced from here is therefore always framed as the
// research basis for a *capability*, never as validation of a clinical,
// safety or accuracy outcome.
// ============================================================================

import { allProducts } from "@/data/products";
import {
  RESEARCH_MAP,
  gaitscapeNodes,
  gaitscapeRelationships,
  nodeById,
} from "@/data/gaitscape/graph";
import { allPublications, type Publication } from "@/data/publications";

/** A research area from the GaitScape graph, resolved against publications. */
export interface ResearchArea {
  id: string;
  title: string;
  summary: string;
  /** Publication records backing this area (papers and/or the patent). */
  publications: Publication[];
  /** Capability nodes this area underpins. */
  capabilities: { id: string; title: string; description: string }[];
  /**
   * Every product reaching this area through any of its capabilities, ordered
   * by how many of them it draws on. Kept for counts and for the flat listing.
   */
  products: AreaProduct[];
  /**
   * Products reached through a capability this research is SPECIFICALLY about
   * — the tier that can fairly be called directly informed.
   */
  directProducts: AreaProduct[];
  /**
   * Products reached only through a broad platform capability that many
   * products share. The research is architecturally relevant to them; it does
   * not address them specifically, and must not be read as validating them.
   */
  architecturalProducts: AreaProduct[];
  /**
   * Where published research informs a PRINCIPLE but the shipped controls are
   * a separate implementation, this states the boundary. Editorial framing of
   * an existing distinction — it adds no capability claim.
   */
  implementationNote?: string;
}

export interface AreaProduct {
  id: string;
  short: string;
  /** Professional one-line label from the product record. */
  label: string;
  vertical: string;
  href: string;
  /** Which of this area's capabilities this product is built on. */
  capabilityIds: string[];
}

/** Capability-level evidence attached to one product. */
export interface CapabilityEvidence {
  capabilityId: string;
  capabilityTitle: string;
  /** Research areas grounding this capability, with their publications. */
  areas: { id: string; title: string; publications: Publication[] }[];
}

const publicationById = new Map(allPublications.map((p) => [p.id, p]));

const resolvePublications = (ids: readonly string[] | undefined): Publication[] =>
  (ids ?? [])
    .map((id) => publicationById.get(id))
    .filter((p): p is Publication => Boolean(p));

/** capability id → research area ids, inverted from RESEARCH_MAP. */
const capabilityToResearch = (() => {
  const map = new Map<string, string[]>();
  for (const [researchId, capabilityIds] of Object.entries(RESEARCH_MAP)) {
    for (const capabilityId of capabilityIds) {
      if (!map.has(capabilityId)) map.set(capabilityId, []);
      map.get(capabilityId)!.push(researchId);
    }
  }
  return map;
})();

/** capability id → product ids, from the documented `powered-by` relations. */
const capabilityToProducts = (() => {
  const map = new Map<string, string[]>();
  for (const rel of gaitscapeRelationships) {
    if (rel.type !== "powered-by") continue;
    if (!map.has(rel.target)) map.set(rel.target, []);
    map.get(rel.target)!.push(rel.source);
  }
  return map;
})();

/** product id → capability ids, from the same relations. */
const productToCapabilities = (() => {
  const map = new Map<string, string[]>();
  for (const rel of gaitscapeRelationships) {
    if (rel.type !== "powered-by") continue;
    if (!map.has(rel.source)) map.set(rel.source, []);
    map.get(rel.source)!.push(rel.target);
  }
  return map;
})();

/**
 * BROAD vs SPECIFIC capabilities.
 *
 * A research area reaches some products through a capability the paper is
 * actually about (movement biometrics, person re-identification, pose
 * estimation, privacy-aware analytics, edge inference), and others only
 * through a general platform capability that most of the portfolio shares.
 * Collapsing both into one "products" list made a gait-recognition paper look
 * like it stood behind FallRisk and WatchCare, which it does not.
 *
 * The split is derived, not asserted: a capability used by more than a third
 * of the portfolio is treated as broad platform infrastructure. On the current
 * data that marks exactly one — Gait analysis, used by 11 of 23 products —
 * and leaves the identity, pose, privacy and edge capabilities specific.
 * Nothing is hand-listed, so adding a product or a research node re-derives
 * the tiers automatically.
 */
const BROAD_CAPABILITY_SHARE = 1 / 3;

/**
 * The published privacy work is about protecting gait datasets inside a
 * deep-learning pipeline. The shipped privacy controls — skeleton-only
 * processing, face blur, retention, access control, auditability — are a
 * separate implementation, configured per deployment. One did not demonstrate
 * the other, and the page must not let the paper stand in for the controls.
 */
const IMPLEMENTATION_NOTES: Record<string, string> = {
  "res-privacy":
    "This record informs privacy-aware analytics principles. GaitAI's implementation controls — skeleton-only processing, face blurring, retention and access controls, auditability — are separate, configured per deployment, and are not demonstrated by the cited work.",
};

const broadCapabilityIds = new Set(
  Array.from(capabilityToProducts.entries())
    .filter(
      ([, products]) =>
        new Set(products).size > allProducts.length * BROAD_CAPABILITY_SHARE,
    )
    .map(([capabilityId]) => capabilityId),
);

/**
 * The four research areas the publications actually cover, each resolved to
 * its papers/patent, the capabilities it grounds and the products that draw on
 * those capabilities. Ordered by weight of published record.
 */
export const researchAreas: ResearchArea[] = gaitscapeNodes
  .filter((node) => node.type === "research")
  .map((node) => {
    const capabilityIds = RESEARCH_MAP[node.id] ?? [];
    const productIds = new Set<string>();
    for (const capabilityId of capabilityIds) {
      for (const productId of capabilityToProducts.get(capabilityId) ?? []) {
        productIds.add(productId);
      }
    }

    return {
      id: node.id,
      title: node.title,
      summary: node.shortDescription,
      publications: resolvePublications(node.publicationIds),
      capabilities: capabilityIds.flatMap((id) => {
        const capability = nodeById.get(id);
        return capability
          ? [
              {
                id,
                title: capability.title,
                description: capability.shortDescription,
              },
            ]
          : [];
      }),
      products: allProducts
        .filter((product) => productIds.has(product.id))
        .map((product) => ({
          id: product.id,
          short: product.short,
          label: product.label,
          vertical: product.vertical,
          href: `/${product.vertical}/${product.id}/`,
          capabilityIds: (productToCapabilities.get(product.id) ?? []).filter(
            (id) => capabilityIds.includes(id),
          ),
        }))
        // Strongest connection first: a product built on two of this area's
        // capabilities is more directly grounded in it than one built on a
        // single capability. `sort` is stable, so equal counts retain the
        // canonical product order above.
        .sort((a, b) => b.capabilityIds.length - a.capabilityIds.length),
    };
  })
  .map((area) => ({
    ...area,
    implementationNote: IMPLEMENTATION_NOTES[area.id],
    directProducts: area.products.filter((product) =>
      product.capabilityIds.some((id) => !broadCapabilityIds.has(id)),
    ),
    architecturalProducts: area.products.filter((product) =>
      product.capabilityIds.every((id) => broadCapabilityIds.has(id)),
    ),
  }))
  .sort((a, b) => b.publications.length - a.publications.length);

const researchAreaById = new Map(researchAreas.map((area) => [area.id, area]));

/**
 * Capability-level research basis for one product. Returns only capabilities
 * that a research node genuinely maps to; products whose capabilities are all
 * un-researched return an empty array.
 */
export function evidenceForProduct(productId: string): CapabilityEvidence[] {
  const capabilityIds = productToCapabilities.get(productId) ?? [];

  return capabilityIds.flatMap((capabilityId) => {
    const areaIds = capabilityToResearch.get(capabilityId) ?? [];
    if (areaIds.length === 0) return [];

    const capability = nodeById.get(capabilityId);
    if (!capability) return [];

    return [
      {
        capabilityId,
        capabilityTitle: capability.title,
        areas: areaIds.flatMap((areaId) => {
          const area = researchAreaById.get(areaId);
          return area
            ? [{ id: area.id, title: area.title, publications: area.publications }]
            : [];
        }),
      },
    ];
  });
}

/**
 * Distinct publications backing any capability a product is built on —
 * the flat list used by the compact "Research basis" link on detail pages.
 */
export function publicationsForProduct(productId: string): Publication[] {
  const seen = new Map<string, Publication>();
  for (const entry of evidenceForProduct(productId)) {
    for (const area of entry.areas) {
      for (const publication of area.publications) {
        seen.set(publication.id, publication);
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.year - a.year);
}

/** Capability titles a product uses that have a published research basis. */
export function researchedCapabilitiesForProduct(productId: string): string[] {
  return evidenceForProduct(productId).map((entry) => entry.capabilityTitle);
}
