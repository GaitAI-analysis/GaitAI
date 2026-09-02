// ============================================================================
// MOVEMENT LAB — SYNTHETIC DEMONSTRATION DATA
// ----------------------------------------------------------------------------
// EVERY NUMBER, SERIES, TRAJECTORY AND INDICATOR IN THIS FILE IS INVENTED FOR
// ILLUSTRATION. Nothing here comes from a real capture, a real person, a real
// deployment, a real model or a real measurement, and nothing here may be
// presented as a product-performance figure, a benchmark, an accuracy claim or
// a clinical result.
//
// The lab exists to show the SHAPE of the pipeline — what enters it, what each
// stage does, what comes out, and why an indicator was surfaced. Concrete
// values make that legible in a way empty placeholders do not, so the values
// are concrete and every surface that renders one also renders the
// "Illustrative demo · synthetic data" label. The components enforce this: the
// metric component takes a `synthetic` flag and the lab sets it everywhere.
//
// The series are hand-written rather than generated, so the lab renders
// identically on the server, on the client and in a screenshot.
//
// Stage names, toggle names, capability names and output names are NOT
// invented: they are the platform's own vocabulary from products.ts,
// gaitscape/graph.ts and the analytics model.
// ============================================================================

import type { PipelineStage } from "@/components/analytics/AnalyticsPipeline";
import type {
  TrajectoryPath,
  TrajectoryZone,
} from "@/components/analytics/graphics";

export const SYNTHETIC_LABEL = "Illustrative demo · synthetic data";

// ============================================================================
// MOBILITYCARE — one walking assessment, staged
// ============================================================================

export const MOBILITY_STAGES: PipelineStage[] = [
  { id: "video", name: "Video", note: "A short walking clip, captured on request" },
  { id: "pose", name: "Person / pose", note: "Body landmarks per frame" },
  { id: "cycle", name: "Gait cycle", note: "Frames segmented into strides" },
  { id: "features", name: "Movement features", note: "Cadence, timing, symmetry, posture" },
  { id: "analytics", name: "Analytics", note: "Compared against this person's own baseline" },
  { id: "report", name: "Report", note: "A structured output for review" },
];

/** The feature toggles the lab offers, and the stage each belongs to. */
export const MOBILITY_LAYERS = [
  { id: "pose", label: "Pose", stage: "pose" },
  { id: "joints", label: "Joint trajectories", stage: "pose" },
  { id: "cycle", label: "Gait cycle", stage: "cycle" },
  { id: "cadence", label: "Cadence", stage: "features" },
  { id: "timing", label: "Step timing", stage: "features" },
  { id: "symmetry", label: "Symmetry", stage: "features" },
  { id: "posture", label: "Posture", stage: "features" },
  { id: "trend", label: "Temporal trend", stage: "analytics" },
] as const;

export type MobilityLayer = (typeof MOBILITY_LAYERS)[number]["id"];

/**
 * The synthetic readings. Units are the units the product records use
 * (steps/min, per cent, degrees, seconds); the values are illustrative.
 */
export const MOBILITY_METRICS = {
  cadence: {
    label: "Cadence",
    value: "112",
    unit: "steps/min",
    note: "Steps per minute across the captured walk.",
    series: [104, 108, 110, 113, 111, 112, 112],
  },
  symmetry: {
    label: "Step symmetry",
    value: "94",
    unit: "%",
    note: "Left/right step-time balance. 100% would be perfectly even.",
    bins: [0.15, 0.3, 0.55, 0.8, 1, 0.7, 0.35, 0.2],
    markerIndex: 4,
  },
  variability: {
    label: "Stride variability",
    value: "Low",
    unit: "",
    note: "Step-to-step consistency over the captured strides.",
    series: [3.1, 2.8, 3.4, 2.9, 3.2, 3.0, 3.3, 2.9],
  },
  timing: {
    label: "Stance / swing",
    value: "61 / 39",
    unit: "%",
    note: "Share of the stride spent in stance and in swing.",
  },
  posture: {
    label: "Trunk angle",
    value: "173",
    unit: "°",
    note: "Trunk alignment through mid-stance.",
  },
  speed: {
    label: "Walking speed",
    value: "1.06",
    unit: "m/s",
    note: "Average over the captured walk.",
    series: [1.18, 1.15, 1.12, 1.1, 1.08, 1.06],
  },
} as const;

/** Four assessments of the same synthetic subject, for the trend stage. */
export const MOBILITY_TREND = {
  points: ["Baseline", "Review 02", "Review 03", "Review 04"],
  speed: [1.18, 1.12, 1.09, 1.06],
  symmetry: [97, 96, 95, 94],
  variability: [2.6, 2.9, 3.1, 3.3],
};

/** What the report stage lists. Output names come from the product records. */
export const MOBILITY_REPORT = [
  "Walking speed",
  "Cadence",
  "Step / stride pattern",
  "Asymmetry",
  "Posture markers",
  "Change from this person's baseline",
];

export const MOBILITY_EXPLAIN = {
  question: "Why was this indicator surfaced?",
  factors: [
    { label: "Cadence variability", direction: "up" as const },
    { label: "Step asymmetry", direction: "up" as const },
    { label: "Longitudinal activity", direction: "down" as const },
    { label: "Postural stability indicator", direction: "down" as const },
  ],
  usedFor: [
    "Screening support",
    "Clinician review",
    "Comparison against this person's own earlier assessments",
  ],
  not: [
    "A prediction that a specific fall will occur",
    "A diagnosis of any condition",
    "A substitute for clinical judgement",
  ],
  footnote:
    "Directions only. GaitAI outputs are AI-generated movement metrics intended as decision support — the contribution of each factor is not presented as a weight, because this demonstration has no measured model behind it.",
};

// ============================================================================
// SECUREVISION — one public space, staged
// ============================================================================

export const SECURE_STAGES: PipelineStage[] = [
  { id: "video", name: "Video", note: "An existing camera feed in the space" },
  { id: "extract", name: "Movement extraction", note: "People as movement, not identities" },
  { id: "trajectories", name: "Trajectories", note: "Paths through the space over time" },
  { id: "density", name: "Density / flow", note: "Where it fills up, and which way it moves" },
  { id: "events", name: "Candidate events", note: "Movement worth a second look" },
  { id: "operator", name: "Operator view", note: "What a trained reviewer sees" },
];

export const SECURE_LAYERS = [
  { id: "trajectories", label: "Trajectories", stage: "trajectories" },
  { id: "density", label: "Density", stage: "density" },
  { id: "flow", label: "Flow direction", stage: "density" },
  { id: "zones", label: "Zones", stage: "trajectories" },
  { id: "candidates", label: "Candidate events", stage: "events" },
  { id: "privacy", label: "Privacy-aware view", stage: "extract" },
] as const;

export type SecureLayer = (typeof SECURE_LAYERS)[number]["id"];

/**
 * Synthetic plan-view paths in a 0–100 × 0–100 space. One path is marked as
 * the one a candidate event was surfaced from — the dwell-and-return shape the
 * explainability panel describes.
 */
export const SECURE_PATHS: TrajectoryPath[] = [
  { id: "p1", points: [[4, 46], [22, 44], [40, 42], [58, 41], [78, 40], [96, 39]] },
  { id: "p2", points: [[4, 62], [24, 60], [44, 57], [62, 55], [80, 53], [96, 52]] },
  { id: "p3", points: [[6, 30], [26, 33], [46, 34], [66, 32], [84, 29], [96, 27]] },
  { id: "p4", points: [[96, 70], [76, 68], [56, 66], [36, 64], [16, 63], [4, 62]] },
  { id: "p5", points: [[50, 8], [50, 24], [52, 40], [54, 56], [56, 74], [56, 92]] },
  {
    id: "p6",
    // Enters, dwells at a zone edge, doubles back, and crosses again.
    points: [[8, 20], [26, 26], [40, 34], [38, 48], [30, 58], [40, 66], [58, 70], [76, 74]],
    candidate: true,
  },
  { id: "p7", points: [[96, 18], [78, 22], [60, 26], [42, 24], [24, 20], [8, 16]] },
];

export const SECURE_ZONES: TrajectoryZone[] = [
  { id: "z1", label: "Entry", x: 2, y: 8, w: 16, h: 26 },
  { id: "z2", label: "Concourse", x: 30, y: 30, w: 34, h: 34 },
  { id: "z3", label: "Restricted", x: 74, y: 62, w: 22, h: 30 },
];

export const SECURE_METRICS = {
  occupancy: {
    label: "Tracked movement",
    value: "7",
    unit: "paths",
    note: "Distinct movement paths in this illustrative scene.",
  },
  density: {
    label: "Peak zone density",
    value: "Concourse",
    unit: "",
    note: "The zone carrying the most movement in this scene.",
    series: [2, 3, 5, 6, 8, 7, 5, 4],
  },
  dwell: {
    label: "Longest dwell",
    value: "00:41",
    unit: "mm:ss",
    note: "Longest continuous time in one zone for a single path.",
  },
  candidates: {
    label: "Candidate events",
    value: "1",
    unit: "",
    note: "Movement patterns flagged for operator review.",
  },
};

export const SECURE_REPORT = [
  "Zone density",
  "Queue length",
  "Flow direction",
  "Movement-event timeline",
  "Candidate events for operator review",
];

export const SECURE_EXPLAIN = {
  question: "Why was this event surfaced?",
  factors: [
    { label: "Extended dwell duration", direction: "up" as const },
    { label: "Repeated zone transition", direction: "up" as const },
    { label: "Direction change", direction: "up" as const },
    { label: "Trajectory deviation from the scene norm", direction: "up" as const },
  ],
  usedFor: [
    "Operator review",
    "Movement-event timeline",
    "Zone and flow context for a decision a person makes",
  ],
  not: [
    "An identification of anyone",
    "An assertion of intent or wrongdoing",
    "Autonomous enforcement of any kind",
  ],
  footnote:
    "Analytics run on movement, not identity: nothing in this view identifies a person, and no face, name or identity attribute is produced. Outputs are decision support for trained operators — operator review is required.",
};
