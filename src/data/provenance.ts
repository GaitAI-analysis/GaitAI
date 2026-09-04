// ============================================================================
// PROVENANCE — ON WHAT BASIS IS THIS BEING SAID?
// ----------------------------------------------------------------------------
// evidence.ts answers "which paper informs which capability". evidence-status
// answers "how far does the evidence for this module go". Neither could answer
// the question a reader actually has in front of a paragraph, a figure or a
// number on a page: what KIND of thing is this?
//
// That question has seven answers on this site and they are not
// interchangeable. A peer-reviewed result and a synthetic demo reading can sit
// two sections apart on the same page, styled identically, and nothing
// distinguishes them. This file is the vocabulary that does.
//
// IT ADDS NO EVIDENCE AND DERIVES NOTHING NEW. The per-module derivation below
// reads `evidenceStatusFor()` — the same five rows the product pages already
// show — and maps them onto these seven kinds. There is exactly one new fact
// in this file, and it is the one the existing model could not express:
// SYNTHETIC DATA. `sample-outputs.ts` states in its own header that every
// number in it is invented, and `IllustrativeBadge` says so on screen, but
// nothing typed it, so nothing could tell a reader that a demo's numbers are
// invented as distinct from the demo itself being illustrative.
//
// WHAT USES THIS. `ProvenanceMark`, and only in evidence mode. In explore mode
// every one of these renders nothing at all — see components/proof.
// ============================================================================

import { evidenceStatusFor } from "@/data/evidence-status";
import { publicationsForProduct } from "@/data/evidence";
import { hasSampleOutput, sampleOutputFor } from "@/data/sample-outputs";

/**
 * The seven kinds, strongest basis first. The ordering is deliberate and is
 * used when a surface carries more than one: a reader should see the strongest
 * claim's basis first, and the weakest one should never be hidden behind it.
 */
export type ProvenanceKind =
  /** A peer-reviewed paper. The strongest thing on this site. */
  | "published-research"
  /** Patent 402202. Granted, examined, and not the same as a paper. */
  | "granted-patent"
  /** A capability traceable to published work — not a validated product. */
  | "capability-informed"
  /** Documented inputs, pipeline, outputs and limitations. */
  | "product-specification"
  /** An interface that demonstrates a shape rather than reporting a result. */
  | "illustrative-demo"
  /** The numbers in it are invented. Distinct from the demo being illustrative. */
  | "synthetic-data"
  /** Named because its absence matters as much as anything above. */
  | "validation-not-published";

export const PROVENANCE_LABEL: Record<ProvenanceKind, string> = {
  "published-research": "Published research",
  "granted-patent": "Granted patent",
  "capability-informed": "Capability informed by research",
  "product-specification": "Product specification",
  "illustrative-demo": "Illustrative demo",
  "synthetic-data": "Synthetic data",
  "validation-not-published": "Product-specific validation not published",
};

/**
 * What each label actually means, in one line.
 *
 * These are shown, not tucked into a tooltip: a label a reader has to hover to
 * understand has told them nothing, and on a phone it has told them nothing at
 * all. `ProvenanceMark` renders the meaning next to the label wherever there is
 * room and as the accessible name where there is not.
 */
export const PROVENANCE_MEANING: Record<ProvenanceKind, string> = {
  "published-research":
    "Peer-reviewed and published. Establishes a method, not a product result.",
  "granted-patent":
    "A granted patent — examined and granted, which is not the same as a peer-reviewed result.",
  "capability-informed":
    "This capability traces back to published work. The capability, not this module's performance.",
  "product-specification":
    "Documented by GaitAI: inputs, pipeline, outputs and stated limitations. Not an independent finding.",
  "illustrative-demo":
    "An interface that demonstrates the shape of an output. It is not product output.",
  "synthetic-data":
    "Every number shown is invented for illustration. No capture, study or record is involved.",
  "validation-not-published":
    "No published study evaluates this for a particular intended use.",
};

/** Sort order for a set of kinds — strongest basis first. */
const ORDER: ProvenanceKind[] = [
  "published-research",
  "granted-patent",
  "capability-informed",
  "product-specification",
  "illustrative-demo",
  "synthetic-data",
  "validation-not-published",
];

export const sortProvenance = (kinds: readonly ProvenanceKind[]) =>
  [...new Set(kinds)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

// ── Per-module derivation ───────────────────────────────────────────────────

/**
 * Which kinds apply to one module.
 *
 * Read off `evidenceStatusFor()` rather than recomputed, so this can never
 * disagree with the evidence panel on the same page — if that panel says a
 * module has no research foundation, no mark here can claim one. The patent is
 * separated out because "published research" and "a granted patent" are
 * different kinds of record and the brief asks for both.
 */
export function provenanceForProduct(
  productId: string,
): ProvenanceKind[] {
  const status = evidenceStatusFor(productId);
  const stateOf = (id: string) =>
    status.rows.find((row) => row.id === id)?.state;
  const kinds: ProvenanceKind[] = [];

  if (stateOf("research-foundation") === "available") {
    kinds.push("capability-informed");
    const records = publicationsForProduct(productId);
    if (records.some((record) => record.kind === "journal")) {
      kinds.push("published-research");
    }
    if (records.some((record) => record.kind === "patent")) {
      kinds.push("granted-patent");
    }
  }
  if (stateOf("product-module") === "available") {
    kinds.push("product-specification");
  }
  if (hasSampleOutput(productId)) {
    kinds.push("illustrative-demo");
    /* The one thing the existing model could not say. Guarded on the record's
       own `illustrative` flag rather than assumed, so a future sample built
       from real, publishable data would not be mislabelled as invented. */
    if (sampleOutputFor(productId)?.illustrative) {
      kinds.push("synthetic-data");
    }
  }
  /* Always. It is a fact about this repository, not a per-module judgement,
     and it is the mark most worth showing — see evidence-status.ts. */
  kinds.push("validation-not-published");

  return sortProvenance(kinds);
}

// ── The mode itself ─────────────────────────────────────────────────────────

export type ProofMode = "explore" | "evidence";

export const PROOF_MODE_LABEL: Record<ProofMode, string> = {
  explore: "Explore",
  evidence: "Evidence",
};

/** The URL parameter, so an evidence-mode page is a shareable link. */
export const PROOF_MODE_PARAM = "evidence";

/** Storage key, so the choice survives a navigation and a return visit. */
export const PROOF_MODE_STORAGE_KEY = "gaitai:proof-mode";

export const PROOF_MODE_HINT =
  "Evidence mode marks what each part of a page is based on — a published record, a documented specification, or invented example values.";
