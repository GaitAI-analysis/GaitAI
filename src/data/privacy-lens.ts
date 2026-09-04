// ============================================================================
// PRIVACY LENS — AN ILLUSTRATIVE ARCHITECTURE, NOT A PRODUCT SPECIFICATION
// ----------------------------------------------------------------------------
// SecureVision's central claim is that safety intelligence can be read from
// movement without reading identity. As a sentence that is unfalsifiable: a
// reader has no way to check it. This is the three-step version they can look
// at — what a sensor holds, what a privacy-aware step keeps, and what is left
// for a module to work on.
//
// WHAT THIS FILE IS CAREFUL NOT TO SAY
//
//   · IT IS NOT A CLAIM OF ANONYMITY. The wording is minimisation and
//     transformation, never "anonymous" or "anonymised". Pose and gait are
//     themselves potentially identifying — that is the subject of this
//     company's own research — and a lens that implied otherwise would
//     contradict the research pages three clicks away
//   · IT IS NOT ONE PATH FOR ALL 11 SECUREVISION MODULES. The identity and
//     investigation group exists, is governed separately, and by design does
//     retain identity-bearing information. `APPLIES_TO` says so in as many
//     words, and the lens is explicitly scoped to the identity-free group
//   · IT IS NOT A CERTIFICATION. No compliance standard, no audit, no
//     guarantee. PrivacyGuard is described on the product page as
//     privacy-aware architecture, and this stays inside that description
//   · NO NUMBERS. There is no "97% of identifying information removed",
//     because no such measurement exists. What each stage carries is stated
//     as a list of kinds of information, which is checkable against the
//     architecture rather than being a fabricated metric
//
// The retained-information indicator is a relative shape with no scale on it,
// for the same reason: each stage carries strictly less than the one before,
// and that ordering is all this repository can honestly assert.
// ============================================================================

/** The three states the brief asks for, in order. */
export type PrivacyStageId = "sensing" | "transformed" | "intelligence";

export interface PrivacyStage {
  id: PrivacyStageId;
  /** The rail label — short, uppercase in the UI. */
  label: string;
  /** One line: what this step IS. */
  lead: string;
  /**
   * The kinds of information present at this step. Kinds, not quantities —
   * "facial appearance", not "84% of biometric features".
   */
  carries: string[];
  /** What stops being available after this step. Empty at the last one. */
  drops: string[];
  /**
   * How the figure is drawn here. The component owns the drawing; this only
   * names which of its three renderings applies, so the data file cannot
   * accidentally start describing pixels.
   */
  render: "body" | "skeleton" | "signal";
  /**
   * Relative information retained, 0–1. No axis is ever drawn from this and
   * no number is shown — it only has to be monotonically decreasing, which is
   * the one thing that is true by construction.
   */
  retained: number;
}

export const privacyStages: PrivacyStage[] = [
  {
    id: "sensing",
    label: "Sensing",
    lead: "What a camera holds before anything has been done to it.",
    carries: [
      "Facial appearance",
      "Clothing, colour and build",
      "Body pose and position",
      "Movement over time",
    ],
    drops: ["Facial appearance", "Clothing, colour and build"],
    render: "body",
    retained: 1,
  },
  {
    id: "transformed",
    label: "Privacy transformed",
    lead: "Appearance is minimised at the edge; geometry is what continues.",
    carries: [
      "Body pose as keypoints",
      "Position and direction",
      "Movement over time",
    ],
    drops: ["Static body geometry", "Absolute position"],
    render: "skeleton",
    retained: 0.45,
  },
  {
    id: "intelligence",
    label: "Movement intelligence",
    lead: "Only the movement signal reaches the module that reads it.",
    carries: [
      "Trajectory and dwell",
      "Timing and rhythm",
      "Change over time",
    ],
    drops: [],
    render: "signal",
    retained: 0.15,
  },
];

/** Stated on the instrument, every time it renders. Not optional. */
export const PRIVACY_LENS_BOUNDARY =
  "An illustrative architecture diagram, not a product specification or a measurement. It shows minimisation and transformation — not anonymity: pose and gait can themselves carry identifying information, which is why GaitAI researches the question rather than claiming it away.";

/**
 * The scope line. This is the single most important sentence on the
 * instrument, because a three-step diagram invites the reader to assume every
 * SecureVision module follows it, and the identity group does not.
 */
export const PRIVACY_LENS_APPLIES_TO =
  "This path describes the identity-free group — anomaly detection, crowd flow, worker safety, campus and access monitoring. SecureVision's identity and investigation modules are a separate, governed group that does retain identity-bearing information by design, and they do not run this path.";

export const PRIVACY_LENS_TITLE = "Privacy Lens";
export const PRIVACY_LENS_STRAP =
  "Watch identity leave the frame, one step at a time.";

/**
 * What happens AFTER the three processing steps: governance, not processing.
 *
 * The page this replaces listed these in the same indented stack as the
 * processing steps, which read as though role-based access were another
 * transformation of the video. It is not — it is a control over who may see
 * the output of step three, so it is kept separate and unmistakably so.
 */
export const privacyGovernance: string[] = [
  "Role-based access and audit logs",
  "Retention policies and consent records",
  "Privacy-aware aggregated dashboards and reports",
];
