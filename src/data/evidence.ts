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
   * Products that use at least one of those capabilities, ordered by how many
   * of *this area's* capabilities each one draws on — so the most directly
   * connected products come first. Ties keep canonical product order. The
   * ordering is derived from the same `powered-by` relations as the list
   * itself; no relationship is added, removed or weighted by hand.
   */
  products: {
    id: string;
    short: string;
    /** Professional one-line label from the product record. */
    label: string;
    vertical: string;
    href: string;
    /** Which of this area's capabilities this product is built on. */
    capabilityIds: string[];
  }[];
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
 * The four research areas the publications actually cover, each resolved to
 * its papers/patent, the capabilities it grounds and the products built on
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
