// ============================================================================
// USE-CASE DISCOVERY METADATA
// ----------------------------------------------------------------------------
// Presentation metadata for the /use-cases explorer: the facets each
// environment can be filtered by, and short output chips for the collapsed
// card.
//
// Nothing here is new content. Facets are either DERIVED from the product mix
// already on the record (a case that deploys WatchCare is a wearable case) or
// a plain categorisation of the environment's own name. Output chips are
// condensations of that record's own `signals` entries — "Walking speed and
// cadence per session" becomes the chips "Walking speed" and "Cadence" — so
// every chip is traceable to a string the record already carried. The full
// `signals` wording stays intact and is what the expanded view and the detail
// page render.
// ============================================================================

import { industryUseCases } from "./products";

/** The filter vocabulary, in the order the chips are shown. */
export const USE_CASE_FACETS = [
  "Clinical",
  "Sports",
  "Elderly",
  "Wearable",
  "Remote care",
  "Research",
  "Transport",
  "Smart city",
  "Campus",
  "Industrial",
  "Retail",
  "Events",
] as const;

export type UseCaseFacet = (typeof USE_CASE_FACETS)[number];

/**
 * Facets that follow from the environment itself. Kept separate from the
 * derived ones below so it stays obvious which is which.
 */
const NAMED_FACETS: Record<string, UseCaseFacet[]> = {
  physio: ["Clinical"],
  hospitals: ["Clinical"],
  sports: ["Sports"],
  elderly: ["Elderly"],
  neuro: ["Clinical"],
  fitness: ["Sports"],
  schools: ["Sports"],
  prosthetics: ["Clinical"],
  airports: ["Transport"],
  smartcities: ["Smart city"],
  campuses: ["Campus"],
  factories: ["Industrial"],
  retail: ["Retail"],
  events: ["Events"],
};

/**
 * Facets implied by the product mix. A case that deploys the wearable product
 * is a wearable case whether or not anybody remembered to tag it, which is
 * the point of deriving rather than listing.
 */
const FACET_BY_PRODUCT: Array<[string, UseCaseFacet]> = [
  ["watchcare", "Wearable"],
  ["remotecare", "Remote care"],
  ["clinicaltrials", "Research"],
];

export const facetsFor = (caseId: string): UseCaseFacet[] => {
  const base = industryUseCases.find((c) => c.id === caseId);
  const out = [...(NAMED_FACETS[caseId] ?? [])];
  for (const [productId, facet] of FACET_BY_PRODUCT) {
    if (base?.productIds.includes(productId) && !out.includes(facet)) {
      out.push(facet);
    }
  }
  return out;
};

/** Facets that actually match at least one environment, in vocabulary order. */
export const activeFacets: UseCaseFacet[] = USE_CASE_FACETS.filter((facet) =>
  industryUseCases.some((c) => facetsFor(c.id).includes(facet)),
);

/**
 * Short output chips per environment — condensations of that record's own
 * `signals`, for the collapsed card only.
 */
export const OUTPUT_CHIPS: Record<string, string[]> = {
  physio: ["Walking speed", "Cadence", "Symmetry change", "Recovery trend"],
  hospitals: [
    "Mobility-risk category",
    "Risk contributors",
    "Movement-pattern trend",
    "Recovery trajectory",
  ],
  sports: [
    "Running symmetry",
    "Limb imbalance",
    "Fatigue change",
    "Recovery trajectory",
  ],
  elderly: [
    "Monthly mobility score",
    "Change from baseline",
    "Mobility-risk category",
    "Decline alerts",
  ],
  neuro: [
    "Shuffling indicators",
    "Turning stability",
    "Walking-speed trajectory",
    "Between-visit trend",
  ],
  homecare: [
    "Remote gait report",
    "Daily mobility score",
    "Change-since-last delta",
    "Change alerts",
  ],
  fitness: [
    "Movement baseline",
    "Posture screening",
    "Symmetry trend",
    "Member report",
  ],
  schools: [
    "Toe-walking indicators",
    "Asymmetry indicators",
    "Term-over-term change",
    "Parent report",
  ],
  prosthetics: [
    "Symmetry per configuration",
    "Loading asymmetry",
    "Walking-speed change",
    "Fitting trend",
  ],
  insurance: [
    "Daily mobility trend",
    "Cohort distribution",
    "Risk-category movement",
    "Outreach list",
  ],
  trials: [
    "Per-visit gait descriptors",
    "Longitudinal trajectory",
    "Cohort trends + QC flags",
    "CSV / JSON export",
  ],
  airports: [
    "Zone density",
    "Queue length",
    "Flow direction",
    "Movement-event timeline",
  ],
  smartcities: [
    "Crowd heatmap",
    "Zone density trend",
    "Crowd-risk alerts",
    "Audited case review",
  ],
  campuses: [
    "Campus event timeline",
    "After-hours alerts",
    "Fall detection",
    "Tailgating indicators",
  ],
  factories: [
    "Fall / slip alerts",
    "Restricted-zone events",
    "Evacuation summary",
    "Zone safety trend",
  ],
  retail: [
    "Queue length",
    "Floor heatmap",
    "Movement-event alerts",
    "Emergency-flow summary",
  ],
  events: [
    "Per-gate flow",
    "Density vs capacity",
    "Bottleneck indicators",
    "Evacuation summary",
  ],
};

export const outputChipsFor = (caseId: string): string[] =>
  OUTPUT_CHIPS[caseId] ?? [];
