// ============================================================================
// CAPTURE REPRESENTATIONS — WHAT EACH ONE KEEPS, AND WHAT IT STOPS CARRYING
// ----------------------------------------------------------------------------
// "GaitAI does not always need the full visual identity of a person" is the
// claim. As a sentence a reader cannot check it; this is the version they can
// look at — five representations of the same walk, and the information each
// one carries stated as kinds, not quantities.
//
// THIS FILE FOLLOWS data/privacy-lens.ts, which argues the same thing for
// SecureVision's three-step architecture. Same discipline, and for the same
// reasons:
//
//   · IT NEVER SAYS ANONYMOUS. The words are reduction, minimisation and
//     transformation. Pose and gait can themselves carry identifying
//     information — that is this company's own published research subject —
//     so a section implying otherwise would contradict the research pages two
//     clicks away. No wording here may drift towards it.
//   · NO NUMBERS. There is no "84% of identity removed", because no such
//     measurement exists. The two meters are relative shapes with no scale
//     and no figure printed, and the only property they assert is an
//     ordering — which is the one thing that is true by construction.
//   · A WEARABLE IS NOT ANONYMOUS EITHER. `retainedIdentity` is labelled
//     VISUAL identity throughout, because that is what is checkable from the
//     representation. A sensor stream carries no image and is still bound to
//     the person carrying the device, and nothing here implies otherwise.
//   · IT IS NOT A PRODUCT SPECIFICATION. No module is named as running any
//     particular representation, because which representation a deployment
//     uses is a deployment decision: the task decides the representation,
//     and that is the whole of the claim.
//
// The OUTCOMES are not written here either. They are read by id from the
// site's taxonomy (data/taxonomy.ts → gaitscape/graph.ts), so this section
// names the same outcomes as GaitScape, the product pages and the use cases.
// ============================================================================

import { outcomes } from "@/data/taxonomy";

/** Which of the five the figure is drawing. The component owns the drawing. */
export type RepresentationId =
  | "capture"
  | "silhouette"
  | "pose"
  | "trajectory"
  | "sensor";

export interface CaptureRepresentation {
  id: RepresentationId;
  /** The selector label. Short — this is a rail of five. */
  label: string;
  /** One line: what this representation IS. */
  lead: string;
  /** Kinds of information this representation still carries. */
  kept: string[];
  /** Kinds of information it no longer carries. Empty for raw capture. */
  reduced: string[];
  /** The word shown against the visual-identity meter. */
  identityLabel: string;
  /**
   * Relative VISUAL identity carried, 0–1. Never printed and never given an
   * axis: it only has to decrease down the list, which it does by
   * construction — each representation is derived from the one above it by
   * discarding something.
   */
  retainedIdentity: number;
  /**
   * Relative movement detail carried, 0–1. Also never printed. Pose is the
   * richest movement representation here; a trajectory keeps where somebody
   * went and drops how they moved getting there.
   */
  movementDetail: number;
}

export const captureRepresentations: CaptureRepresentation[] = [
  {
    id: "capture",
    label: "Camera Video",
    lead: "The frame as recorded — everything the camera can see, before anything has been done to it.",
    kept: [
      "Facial appearance",
      "Clothing, colour and build",
      "Scene and background",
      "Body pose and position",
      "Movement over time",
    ],
    reduced: [],
    identityLabel: "Retained in full",
    retainedIdentity: 1,
    movementDetail: 1,
  },
  {
    id: "silhouette",
    label: "Silhouette",
    lead: "Uses body outline and movement shape while suppressing detailed visual identity.",
    kept: [
      "Body outline and build",
      "Posture and lean",
      "Gait timing and cadence",
      "Movement over time",
    ],
    reduced: ["Facial appearance", "Clothing detail and colour", "Scene and background"],
    identityLabel: "Reduced",
    retainedIdentity: 0.55,
    movementDetail: 0.8,
  },
  {
    id: "pose",
    label: "Pose Skeleton",
    lead: "Keeps joint motion, gait rhythm and posture relationships while removing facial and appearance detail.",
    kept: [
      "Body pose as keypoints",
      "Joint angles and symmetry",
      "Stride timing and cadence",
      "Movement over time",
    ],
    reduced: [
      "Facial appearance",
      "Clothing, colour and build",
      "Body outline and mass",
      "Scene and background",
    ],
    identityLabel: "Strongly reduced",
    retainedIdentity: 0.32,
    movementDetail: 0.95,
  },
  {
    id: "trajectory",
    label: "Trajectory",
    lead: "Tracks how movement flows through space — useful for safety, mobility and behaviour context.",
    kept: ["Path and direction", "Dwell and timing", "Speed and change over time"],
    reduced: [
      "Facial appearance",
      "Clothing, colour and build",
      "Posture and limb detail",
      "Body geometry",
    ],
    identityLabel: "Strongly reduced",
    retainedIdentity: 0.18,
    movementDetail: 0.45,
  },
  {
    id: "sensor",
    label: "Sensor Signal",
    lead: "Uses inertial or wearable motion directly, without needing camera identity information.",
    kept: [
      "Acceleration and rotation over time",
      "Step timing and cadence",
      "Activity and posture transitions",
    ],
    reduced: [
      "Any camera image",
      "Facial appearance",
      "Clothing, colour and build",
      "Scene and background",
    ],
    identityLabel: "No camera image",
    retainedIdentity: 0.1,
    movementDetail: 0.6,
  },
];

/**
 * The five stages, drawn left to right as five cards with arrows between.
 *
 * These are the labels the approved wireframe uses, and they are stages of
 * ONE pipeline rather than a second rail a visitor can drive — the only
 * control in the section is the representation selector above them. The
 * workflow section still owns "capture → understand → report → act"; this one
 * answers a different question, which is how much of the person any of it
 * needs.
 *
 * NOTE THE WORDING OF 02 AND 05. Identity detail is REDUCED, never removed
 * outright, and the outcomes are named as outputs rather than as insights
 * "without identity" — pose and gait can themselves carry identifying
 * information, which is this company's own published research subject. See
 * the header of this file; no wording here may drift towards anonymity.
 */
export const captureStages: { step: string; label: string; note: string }[] = [
  {
    step: "1",
    label: "Capture",
    note: "Movement observed from camera or sensor.",
  },
  {
    step: "2",
    label: "Privacy layer",
    note: "Unnecessary identity detail is reduced.",
  },
  {
    step: "3",
    label: "Representation",
    note: "Convert into task-relevant movement representation.",
  },
  {
    step: "4",
    label: "Movement engine",
    note: "Analyse movement features, temporal patterns, inference.",
  },
  {
    step: "5",
    label: "Outcomes",
    note: "Mobility, recovery, reports, safety, privacy-aware analytics.",
  },
];

/** The outcome ids this section shows, read from the taxonomy by id. */
const OUTCOME_IDS = [
  "out-early-risk",
  "out-fall-awareness",
  "out-assessment",
  "out-rehab",
  "out-realtime",
  "out-privacy",
] as const;

/**
 * The outcomes, in the site's own words. Constant across representations on
 * purpose: which representation a task needs is a deployment decision, and
 * lighting different outcomes per representation would be a capability claim
 * this repository cannot support.
 */
export const captureOutcomes = OUTCOME_IDS.flatMap((id) => {
  const node = outcomes.find((outcome) => outcome.id === id);
  return node ? [{ title: node.title, note: node.shortDescription }] : [];
});
