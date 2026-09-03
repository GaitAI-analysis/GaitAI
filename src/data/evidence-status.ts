// ============================================================================
// EVIDENCE STATUS — WHAT IS ACTUALLY ESTABLISHED, PER MODULE
// ----------------------------------------------------------------------------
// A structured answer to "how far does the evidence for this module go?", so
// product pages, the Trust Center and the GaitScape inspector can all state it
// the same way instead of each implying something different.
//
// DERIVATION RULE — nothing here is asserted by hand.
//
//   research foundation   DERIVED. True when evidence.ts resolves at least one
//                         publication for a capability the module is built on.
//                         That join already exists; this only reads it.
//   product module        DERIVED. True when the module has a detail record,
//                         i.e. a documented page describing what it does.
//   interactive demo      DERIVED. True when a sample output exists
//                         for the module in sample-outputs.ts.
//   product validation    ALWAYS "not-published". No study in this repository
//                         evaluates any module's output for an intended use.
//   commercial case study ALWAYS "not-published". No customer, pilot or
//                         deployment record exists anywhere in the repository.
//
// The last two are constants because they are facts about this repository, not
// per-module judgements — and they must not quietly become ✓ when someone adds
// a page. When a real study or case study lands it gets a documented source
// first, and this file reads that source.
//
// TONE
// This panel is transparency, not a warning. A missing row is "not yet
// published", never a failure — the research foundation is real and stated as
// such, and the boundary is stated just as plainly.
// ============================================================================

import { allProducts } from "@/data/products";
import { allProductDetails } from "@/data/product-details";
import { publicationsForProduct } from "@/data/evidence";
import { hasSampleOutput } from "@/data/sample-outputs";

/**
 * Three states, deliberately. "Available" and "not yet published" are the two
 * the current data can produce; "in development" exists so a documented
 * in-flight study has somewhere to go without being marked available.
 */
export type EvidenceState = "available" | "in-development" | "not-published";

export const EVIDENCE_STATE_LABEL: Record<EvidenceState, string> = {
  available: "Available",
  "in-development": "In development",
  "not-published": "Not yet published",
};

export interface EvidenceRow {
  id: string;
  label: string;
  state: EvidenceState;
  /** One line saying what this row means — shown, not hidden in a tooltip. */
  detail: string;
}

export interface ModuleEvidence {
  productId: string;
  rows: EvidenceRow[];
  /** How many rows are established, for a compact "2 of 5" summary. */
  availableCount: number;
  total: number;
}

/**
 * Repository-wide constants. Stated once here so no page can imply otherwise.
 */
const PRODUCT_VALIDATION: Omit<EvidenceRow, "state"> = {
  id: "product-validation",
  label: "Product-specific validation",
  detail:
    "No study in the published record evaluates this module's output for a particular intended use.",
};

const CASE_STUDY: Omit<EvidenceRow, "state"> = {
  id: "case-study",
  label: "Commercial case study",
  detail:
    "No named deployment, pilot result or customer outcome is documented.",
};

const detailSlugs = new Set(allProductDetails.map((d) => d.slug));

export function evidenceStatusFor(productId: string): ModuleEvidence {
  const papers = publicationsForProduct(productId);
  const hasFoundation = papers.length > 0;
  const hasDetail = detailSlugs.has(productId);
  const hasDemo = hasSampleOutput(productId);

  const rows: EvidenceRow[] = [
    {
      id: "research-foundation",
      label: "Research foundation",
      state: hasFoundation ? "available" : "not-published",
      detail: hasFoundation
        ? `${papers.length} published ${
            papers.length === 1 ? "record" : "records"
          } inform a capability this module is built on.`
        : "No published record in this library maps to a capability this module is built on.",
    },
    {
      id: "product-module",
      label: "Product module",
      state: hasDetail ? "available" : "in-development",
      detail: hasDetail
        ? "The module has a documented specification: inputs, pipeline, outputs and stated limitations."
        : "The module is described at family level; its own specification is not yet documented.",
    },
    {
      id: "interactive-demo",
      label: "Interactive demo",
      state: hasDemo ? "available" : "not-published",
      detail: hasDemo
        ? "A sample output is available to explore. Illustrative demo — example values, not a measured result."
        : "No sample output has been built for this module yet.",
    },
    { ...PRODUCT_VALIDATION, state: "not-published" },
    { ...CASE_STUDY, state: "not-published" },
  ];

  return {
    productId,
    rows,
    availableCount: rows.filter((r) => r.state === "available").length,
    total: rows.length,
  };
}

/** Every module's status, for the Trust Center's portfolio-level view. */
export const allModuleEvidence: ModuleEvidence[] = allProducts.map((p) =>
  evidenceStatusFor(p.id),
);

/**
 * Portfolio totals — derived, so the Trust Center can never quote a figure the
 * per-module data does not support.
 */
export const evidenceTotals = (() => {
  const count = (id: string) =>
    allModuleEvidence.filter(
      (m) => m.rows.find((r) => r.id === id)?.state === "available",
    ).length;

  return {
    modules: allModuleEvidence.length,
    withResearchFoundation: count("research-foundation"),
    withSpecification: count("product-module"),
    withDemo: count("interactive-demo"),
    withValidation: count("product-validation"),
    withCaseStudy: count("case-study"),
  };
})();
