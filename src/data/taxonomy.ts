// ============================================================================
// GAITAI TAXONOMY — the site-wide conceptual hierarchy
// ----------------------------------------------------------------------------
//   MOVEMENT SIGNAL → AI CAPABILITY → PRODUCT → APPLICATION DOMAIN → OUTCOME
//
//   e.g. Stride variability → Gait analysis → FallRisk → Elderly care
//        → Fall-risk awareness
//
// The graph in src/data/gaitscape/graph.ts is the single source of truth for
// every entity and every relationship between them (it in turn derives
// products and domains from products.ts and research from publications.ts).
// This module is a thin, page-friendly read layer over that graph so the
// homepage, product pages, use cases, research and GaitScape all name the
// same things the same way — instead of each page keeping its own array.
//
// Nothing here declares new taxonomy members or new relationships.
// ============================================================================

import type { Vertical } from "@/data/products";
import {
  NODE_TYPE_LABEL,
  gaitscapeNodes,
  gaitscapeRelationships,
  nodeById,
} from "@/data/gaitscape/graph";
import type { GaitscapeNode } from "@/data/gaitscape/types";

export type TaxonomyLayer =
  | "signal"
  | "capability"
  | "product"
  | "domain"
  | "outcome";

/** Display names for each layer of the hierarchy, shared site-wide. */
export const TAXONOMY_LAYER_LABEL: Record<TaxonomyLayer, string> = {
  signal: NODE_TYPE_LABEL.signal,
  capability: NODE_TYPE_LABEL.capability,
  product: NODE_TYPE_LABEL.product,
  domain: NODE_TYPE_LABEL.domain,
  outcome: NODE_TYPE_LABEL.outcome,
};

const nodesOfType = (type: GaitscapeNode["type"]) =>
  gaitscapeNodes.filter((node) => node.type === type);

export const movementSignals = nodesOfType("signal");
export const aiCapabilities = nodesOfType("capability");
export const applicationDomains = nodesOfType("domain");
export const outcomes = nodesOfType("outcome");

/**
 * Signals and capabilities reachable from a vertical's products, via the
 * documented `senses` / `powered-by` relationships. Used wherever a page
 * needs "what this vertical reads" — replacing hand-maintained string lists.
 */
function verticalNodeTitles(
  vertical: Vertical,
  relationType: "senses" | "powered-by"
): string[] {
  const productIds = new Set(
    gaitscapeNodes
      .filter((node) => node.type === "product" && node.vertical === vertical)
      .map((node) => node.id)
  );

  const titles = new Set<string>();
  for (const rel of gaitscapeRelationships) {
    if (rel.type !== relationType) continue;
    if (!productIds.has(rel.source)) continue;
    const target = nodeById.get(rel.target);
    if (target) titles.add(target.title);
  }
  return Array.from(titles);
}

export const signalTitlesFor = (vertical: Vertical) =>
  verticalNodeTitles(vertical, "senses");

export const capabilityTitlesFor = (vertical: Vertical) =>
  verticalNodeTitles(vertical, "powered-by");

/**
 * The signal + capability vocabulary a vertical works in, as one ordered
 * list — signals first, then the capabilities applied to them.
 */
export const intelligenceVocabularyFor = (vertical: Vertical): string[] => [
  ...signalTitlesFor(vertical),
  ...capabilityTitlesFor(vertical),
];

/** The taxonomy chain for one product, for "how this fits together" blocks. */
export interface ProductTaxonomyChain {
  signals: string[];
  capabilities: string[];
  domains: string[];
  outcomes: string[];
}

export function taxonomyChainFor(productId: string): ProductTaxonomyChain {
  const collect = (type: (typeof gaitscapeRelationships)[number]["type"]) =>
    gaitscapeRelationships
      .filter((rel) => rel.type === type && rel.source === productId)
      .flatMap((rel) => {
        const target = nodeById.get(rel.target);
        return target ? [target.title] : [];
      });

  return {
    signals: collect("senses"),
    capabilities: collect("powered-by"),
    domains: collect("serves"),
    outcomes: collect("produces"),
  };
}
