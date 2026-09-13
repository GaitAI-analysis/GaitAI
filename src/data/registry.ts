/** Canonical inventory. UI summaries are generated from this module; never add
 * a second list of entities or type a catalogue total into page copy. */
import { allProducts, industryUseCases } from "./products";
import { allPublications, papers } from "./publications";
import { researchAreas } from "./evidence";
import { talkRecords, talkCounts } from "./talks";
import { gaitscapeNodes, gaitscapeRelationships } from "./gaitscape/graph";

export const terminology = {
  product: "A named GaitAI offering; a product page describes intended scope, not release or validation status.",
  module: "A modular offering on the shared movement-intelligence platform.",
  productModule: "The canonical catalogue unit. Product and module refer to the same registry entry and are not added together.",
  researchRecord: "A surfaced academic paper or patent informing the research foundation; not a product validation study.",
  publication: "A surfaced academic paper. The wider founder academic record is separate from this curated selection.",
  patent: "A granted intellectual-property record; not evidence of implementation or validated product performance.",
  environment: "A setting in the canonical environment registry.",
  useCase: "An intended workflow within an environment; not a deployment or a separately counted environment.",
  capability: "A named analysis function in the GaitScape graph; not a separately shipped product.",
} as const;

export const researchRecords = allPublications.map((record) => ({
  id: record.id,
  kind: record.kind === "patent" ? "patent" : "publication",
  scope: "founder-academic-record" as const,
  href: `/publications/${record.id}/`,
}));

/** Add a study only with its source, evaluated module and intended use.
 * A paper-to-capability relationship cannot create a validation record. */
export const productValidationStudies: readonly {
  id: string; productId: string; source: string; intendedUse: string;
}[] = [];

export const siteCounts = {
  productModules: allProducts.length,
  mobilitycare: allProducts.filter((p) => p.vertical === "mobilitycare").length,
  securevision: allProducts.filter((p) => p.vertical === "securevision").length,
  verticals: new Set(allProducts.map((p) => p.vertical)).size,
  environments: industryUseCases.length,
  publications: papers.length,
  patents: allPublications.filter((p) => p.kind === "patent").length,
  researchRecords: researchRecords.length,
  researchAreas: researchAreas.length,
  productValidationStudies: productValidationStudies.length,
  talksAndPresentations: talkRecords.length,
  talkKinds: talkCounts,
  gaitscapeNodes: gaitscapeNodes.length,
  gaitscapeRelationships: gaitscapeRelationships.length,
  capabilities: gaitscapeNodes.filter((n) => n.type === "capability").length,
} as const;
