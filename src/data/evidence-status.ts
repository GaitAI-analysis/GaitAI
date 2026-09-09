// ============================================================================
// EVIDENCE STATUS — WHAT IS ACTUALLY ESTABLISHED, PER MODULE
// ----------------------------------------------------------------------------
// A structured answer to "how far does the evidence for this module go?", so
// product pages, the Trust Center and the GaitScape inspector can all state it
// the same way instead of each implying something different.
//
// DERIVATION RULE — available evidence is resolved from documented sources.
//
//   research foundation   DERIVED. True when evidence.ts places the module in a
//                         research area's DIRECT tier: the publication is about
//                         a capability the module is built on.
//   architectural research DERIVED. True when the module reaches a research area
//                         only through a broad shared capability. Listed apart
//                         so it is never mistaken for the row above.
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
// Unpublished implementation, benchmark, validation and deployment categories
// are constants because they are facts about this inventory, not
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
import { researchAreas, type ResearchArea } from "@/data/evidence";
import type { Publication } from "@/data/publications";
import { hasSampleOutput } from "@/data/sample-outputs";

/**
 * An unclaimed regulatory status is distinct from unpublished evidence.
 * "In development" is reserved for work with a documented development basis.
 */
export type EvidenceState = "available" | "in-development" | "not-published" | "not-claimed";

/** Review of the website's published evidence inventory, not a study date. */
export const EVIDENCE_REVIEWED_AT = "2026-09-09";

export const EVIDENCE_STATE_LABEL: Record<EvidenceState, string> = {
  available: "Available",
  "in-development": "In development",
  "not-published": "Not yet published",
  "not-claimed": "Not claimed",
};

export interface EvidenceSource {
  label: string;
  href: string;
  kind: "publication" | "specification" | "prototype" | "context";
}

export interface EvidenceRow {
  id: string;
  label: string;
  state: EvidenceState;
  /** One line saying what this row means — shown, not hidden in a tooltip. */
  detail: string;
  sources: EvidenceSource[];
  applicability: string;
  limitation: string;
}

export interface ModuleEvidence {
  productId: string;
  rows: EvidenceRow[];
  /** Documented evidence categories, not a score or product maturity rating. */
  availableCount: number;
  total: number;
  reviewedAt: string;
}

/**
 * Repository-wide constants. Stated once here so no page can imply otherwise.
 */
const PRODUCT_VALIDATION: Omit<EvidenceRow, "state"> = {
  id: "product-validation",
  label: "Product-specific validation",
  detail:
    "No study in the published record evaluates this module's output for a particular intended use.",
  sources: [{ label: "Published evidence inventory", href: "/research/evidence/", kind: "context" }],
  applicability: "Validation must match the module, population and intended decision.",
  limitation: "A product description or related research paper does not establish validated performance.",
};

const CASE_STUDY: Omit<EvidenceRow, "state"> = {
  id: "case-study",
  label: "Pilot & deployment evidence",
  detail:
    "No named pilot, deployment result or customer outcome is documented.",
  sources: [{ label: "Trust Center", href: "/trust/", kind: "context" }],
  applicability: "Pilot and deployment evidence is assessed separately from research.",
  limitation: "Use-case journeys describe intended workflows, not customer results.",
};

const detailSlugs = new Set(allProductDetails.map((d) => d.slug));

/** Distinct publications across a set of research areas, newest first. */
function publicationsIn(areas: ResearchArea[]): Publication[] {
  const seen = new Map<string, Publication>();
  for (const area of areas) for (const paper of area.publications) seen.set(paper.id, paper);
  return Array.from(seen.values()).sort((a, b) => b.year - a.year);
}

const paperSource = (paper: Publication): EvidenceSource => ({
  label: `${paper.title} · ${paper.venue}, ${paper.year}`,
  href: `/publications/${paper.id}/`,
  kind: "publication",
});

export function evidenceStatusFor(productId: string): ModuleEvidence {
  // evidence.ts already separates the two tiers of a research relationship;
  // this file must keep them apart. DIRECT: the research is specifically about
  // a capability the module is built on. ARCHITECTURAL: the module only reaches
  // the research through a broad shared capability. The second must never be
  // presented as the first, and neither is product validation.
  const directAreas = researchAreas.filter((area) =>
    area.directProducts.some((entry) => entry.id === productId),
  );
  const architecturalAreas = researchAreas.filter((area) =>
    area.architecturalProducts.some((entry) => entry.id === productId),
  );
  const directPapers = publicationsIn(directAreas);
  const architecturalPapers = publicationsIn(architecturalAreas).filter(
    (paper) => !directPapers.some((direct) => direct.id === paper.id),
  );
  const hasFoundation = directPapers.length > 0;
  const hasArchitectural = architecturalPapers.length > 0;
  const hasDetail = detailSlugs.has(productId);
  const hasDemo = hasSampleOutput(productId);
  const product = allProducts.find((item) => item.id === productId);
  const productHref = product ? `/${product.vertical}/${productId}/` : "/products/";

  const rows: EvidenceRow[] = [
    {
      id: "research-foundation",
      label: "Research foundation",
      state: hasFoundation ? "available" : "not-published",
      detail: hasFoundation
        ? `${directPapers.length} published ${
            directPapers.length === 1 ? "record directly addresses" : "records directly address"
          } a capability this module is built on (${directAreas
            .map((area) => area.title)
            .join(", ")}).`
        : "No published record in this library directly addresses a capability this module is built on.",
      sources: directPapers.map(paperSource),
      applicability: "The cited work is specifically about a method or movement signal this module draws on.",
      limitation: "Research relevance is not evidence that this product's outputs have been validated.",
    },
    {
      id: "architectural-research",
      label: "Architectural research relationship",
      state: hasArchitectural ? "available" : "not-published",
      detail: hasArchitectural
        ? `${architecturalPapers.length} published ${
            architecturalPapers.length === 1 ? "record informs" : "records inform"
          } shared platform capabilities this module uses (${architecturalAreas
            .map((area) => area.title)
            .join(", ")}). The research does not address this module's application specifically.`
        : "No further shared-platform research relationship is recorded beyond the research foundation above.",
      sources: architecturalPapers.map(paperSource),
      applicability: "Shared capabilities such as pose estimation or temporal modelling are used by many modules.",
      limitation: "A shared-platform relationship is the weakest research link and must not be read as validating this module.",
    },
    {
      id: "product-module",
      /* Was "Product module", which named the thing rather than the evidence
         and so read as a fifth row about existence rather than about basis.
         The row's own detail always described a specification; the label now
         says so. */
      label: "Product specification",
      state: hasDetail ? "available" : "not-published",
      detail: hasDetail
        ? "The module has a documented specification: inputs, pipeline, outputs and stated limitations."
        : "The module is described at family level; its own specification is not yet documented.",
      sources: hasDetail ? [{ label: "Product documentation", href: productHref, kind: "specification" }] : [],
      applicability: "Documented inputs, intended workflow and output design.",
      limitation: "Documentation does not establish a released implementation or deployment readiness.",
    },
    {
      id: "product-implementation",
      label: "Product implementation evidence",
      state: "not-published",
      detail: "No module-specific release or deployment record is published here.",
      sources: [{ label: "Product and deployment context", href: "/trust/", kind: "context" }],
      applicability: "Production implementation is distinct from this website's interactive prototypes.",
      limitation: "The browser pose explorer is not the full clinical or operational product pipeline.",
    },
    {
      id: "interactive-demo",
      label: "Interactive demo",
      state: hasDemo ? "available" : "not-published",
      detail: hasDemo
        ? "A sample output is available to explore. Illustrative demo — example values, not a measured result."
        : "No sample output has been built for this module yet.",
      sources: hasDemo ? [{ label: "Explore illustrative output", href: `${productHref}#sample`, kind: "prototype" }] : [],
      applicability: "An interactive explanation of the intended output and workflow.",
      limitation: "Sample outputs contain illustrative values and are not measurements of a visitor or product performance.",
    },
    {
      id: "benchmark-validation",
      label: "Benchmark validation",
      state: "not-published",
      detail: "Validation pending publication. No product benchmark numbers are supplied.",
      sources: [{ label: "Research evidence inventory", href: "/research/evidence/", kind: "context" }],
      applicability: "A benchmark needs a defined dataset, sample count, environment, hardware and evaluation method.",
      limitation: "Accuracy, sensitivity, specificity, latency and FPS cannot be inferred from a demonstration.",
    },
    { ...PRODUCT_VALIDATION, state: "not-published" },
    { ...CASE_STUDY, state: "not-published" },
    {
      id: "clinical-validation",
      label: "Product-specific clinical validation",
      state: "not-published",
      detail: "No product-specific clinical validation study is published in this library.",
      sources: [{ label: "Responsible use and intended context", href: "/legal/responsible-ai/", kind: "context" }],
      applicability: "Clinical applicability depends on the intended use; safety modules are not presented as clinical tools.",
      limitation: "No output replaces clinician judgement or establishes a diagnosis.",
    },
    {
      id: "regulatory-status",
      label: "Regulatory clearance",
      state: "not-claimed",
      detail: "No medical-device clearance, regulatory approval or compliance status is claimed.",
      sources: [{ label: "What GaitAI does not claim", href: "/trust/#not-claimed", kind: "context" }],
      applicability: "Regulatory applicability depends on the intended use and deployment jurisdiction.",
      limitation: "Research publications, patents and prototypes are not regulatory clearances.",
    },
  ];

  return {
    productId,
    rows,
    availableCount: rows.filter((r) => r.state === "available").length,
    total: rows.length,
    reviewedAt: EVIDENCE_REVIEWED_AT,
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
    withArchitecturalResearch: count("architectural-research"),
    withSpecification: count("product-module"),
    withDemo: count("interactive-demo"),
    withValidation: count("product-validation"),
    withCaseStudy: count("case-study"),
  };
})();
