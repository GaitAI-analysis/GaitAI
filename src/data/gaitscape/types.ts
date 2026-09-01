/**
 * GaitScape graph model — the interactive Human Movement Intelligence map.
 *
 * Nodes are derived from canonical site data wherever it exists
 * (products.ts, publications.ts); relationships carry an `evidence` string
 * pointing at the documented source (a product output, a use-case entry,
 * a publication) so nothing in the landscape is invented.
 */

export type GaitscapeNodeType =
  | "core"
  | "vertical"
  | "signal"
  | "capability"
  | "product"
  | "domain"
  | "research"
  | "outcome";

export interface GaitscapeNode {
  id: string;
  type: GaitscapeNodeType;
  title: string;
  shortDescription: string;
  /** Owning vertical when one clearly applies. */
  vertical?: "mobilitycare" | "securevision";
  /** Site route for the node's CTA, when one exists. */
  href?: string;
  tags?: readonly string[];
  /** Publication ids from publications.ts backing a research node. */
  publicationIds?: readonly string[];
}

export type GaitscapeRelationType =
  | "belongs-to" // product → vertical, vertical → core
  | "senses" // product → signal
  | "powered-by" // product → capability
  | "serves" // product → domain
  | "produces" // product → outcome
  | "grounded-in" // capability → research
  | "expresses"; // signal → core

export interface GaitscapeRelationship {
  source: string;
  target: string;
  type: GaitscapeRelationType;
  /** Where this link is documented (product output, use case, paper…). */
  evidence?: string;
}

export interface GaitscapeChallenge {
  id: string;
  question: string;
  summary: string;
  signalIds: readonly string[];
  capabilityIds: readonly string[];
  productIds: readonly string[];
  researchIds: readonly string[];
  outcomeId: string;
}

/** Comparison facts per product, curated from the product descriptions. */
export interface SystemFacts {
  input: string;
  environment: string;
  deployment: string;
  privacy: string;
}
