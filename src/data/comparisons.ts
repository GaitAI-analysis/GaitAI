// ============================================================================
// NAMED COMPARISONS
// ----------------------------------------------------------------------------
// Two modules are worth comparing when a reader could reasonably pick the
// wrong one. This file names those pairs, and it names ONLY those pairs: a
// site-wide matrix of twenty-three modules against each other answers no
// question anybody actually has, so /products offers these as starting points
// and every product page offers the one pair its own module belongs to.
//
// WHAT IS AND IS NOT DATA HERE. The pair itself is an editorial judgement —
// which two modules get confused — and that is all this file contributes. The
// comparison's CONTENT is read live from the product, capability, environment
// and research records by the comparison table; nothing about a module is
// restated here, so this file cannot drift out of step with the module pages.
// The one line of prose per pair states the QUESTION the comparison answers,
// never an answer, because an answer would be a claim about the modules that
// their own records do not make.
//
// `validate:gaitai` checks both ids exist and that a pair never crosses
// product families — WalkScan against ForensicSearch is not a decision anyone
// is making, and offering it would suggest the two are alternatives.
// ============================================================================

import type { Vertical } from "@/data/products";
import { allProducts, productById } from "@/data/products";

export interface ProductComparison {
  id: string;
  /** Exactly two module ids, in the order they should be shown. */
  pair: [string, string];
  /** The question a reader is holding when they arrive. One line. */
  question: string;
}

/**
 * The pairs. Small on purpose — this list grows only when a real "which of
 * these two?" question exists, not to give every module a comparison.
 */
export const productComparisons: ProductComparison[] = [
  {
    id: "walkscan-rehabtrack",
    pair: ["walkscan", "rehabtrack"],
    question: "Assess a walk once, or track it across a course of treatment?",
  },
  {
    id: "fallrisk-seniorcare",
    pair: ["fallrisk", "seniorcare"],
    question: "Screen for fall risk, or monitor daily movement in a care setting?",
  },
  {
    id: "suspiciousmotion-crowdsense",
    pair: ["suspiciousmotion", "crowdsense"],
    question: "Read one person's movement, or the movement of a crowd?",
  },
  {
    id: "reid-forensicsearch",
    pair: ["reid", "forensicsearch"],
    question: "Follow a person across live cameras, or search recorded footage?",
  },
];

/** `?compare=` link into the comparison on /products, scrolled to it. */
export const comparisonHref = (comparison: ProductComparison) =>
  `/products/?compare=${comparison.pair.join(",")}#compare`;

/**
 * The comparison a given module belongs to, if any. Product pages use this to
 * decide whether to offer a "Compare" link at all — a module in no named pair
 * gets no link, rather than a link to an arbitrary neighbour.
 */
const byProduct = (() => {
  const map = new Map<string, ProductComparison>();
  for (const comparison of productComparisons) {
    for (const id of comparison.pair) map.set(id, comparison);
  }
  return map;
})();

export const comparisonForProduct = (productId: string) =>
  byProduct.get(productId);

/** The other module in a pair, from the point of view of one of them. */
export const comparisonCounterpart = (
  comparison: ProductComparison,
  productId: string,
) => comparison.pair.find((id) => id !== productId);

/** Family of a pair — both members share one, which the validator enforces. */
export const comparisonFamily = (
  comparison: ProductComparison,
): Vertical | undefined => productById(comparison.pair[0])?.vertical;

/** Short display label for a pair: "WalkScan vs RehabTrack". */
export const comparisonLabel = (comparison: ProductComparison) =>
  comparison.pair
    .map((id) => productById(id)?.short ?? id)
    .join(" vs ");

/** Every id referenced by a pair, for the integrity check. */
export const comparisonProductIds = Array.from(byProduct.keys());

/** Guard used by the validator so a typo here fails the build, not a page. */
export const unknownComparisonIds = comparisonProductIds.filter(
  (id) => !allProducts.some((product) => product.id === id),
);
