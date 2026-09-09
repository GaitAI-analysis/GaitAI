/**
 * The inspectable vocabulary of the Insights journal.
 *
 * A short list, on purpose. Only terms whose meaning a first-time reader
 * needs to hold in mind across an article are here; making every technical
 * word a tooltip would turn the prose into a minefield of underlines. Each
 * definition is one or two plain sentences, and where the concept can be SEEN
 * somewhere on the site the entry points at it — the Movement Intelligence
 * Lab, or a GaitScape node — so the popover is a door, not a footnote.
 *
 * Definitions describe measurement, never diagnosis, and none of them states
 * a performance claim.
 */

export interface InsightTerm {
  id: string;
  /** The phrase as it appears in prose. Matching is case-insensitive. */
  term: string;
  /** Other spellings that should also match (first occurrence only). */
  aliases?: string[];
  definition: string;
  /** "See in the Movement Intelligence Lab →" */
  lab?: boolean;
  /** GaitScape node id, opened with ?focus=. */
  gaitscape?: string;
}

export const INSIGHT_TERMS: Record<string, InsightTerm> = {
  cadence: {
    id: "cadence",
    term: "cadence",
    definition:
      "Steps per unit of time. One of the simplest temporal gait descriptors, and one that only exists across a sequence of steps, never in a single frame.",
    lab: true,
    gaitscape: "sig-cadence",
  },
  "stride-variability": {
    id: "stride-variability",
    term: "stride variability",
    aliases: ["movement variability", "cycle-to-cycle variability"],
    definition:
      "How much the timing or length of successive strides fluctuates from one gait cycle to the next. A description of regularity, not a finding on its own.",
    lab: true,
    gaitscape: "sig-stride-variability",
  },
  symmetry: {
    id: "symmetry",
    term: "left/right symmetry",
    aliases: ["symmetry", "asymmetry"],
    definition:
      "How closely the left and right sides of the body mirror each other through the gait cycle — in timing, in stride length and in joint motion.",
    lab: true,
    gaitscape: "sig-step-symmetry",
  },
  "pose-estimation": {
    id: "pose-estimation",
    term: "pose estimation",
    definition:
      "The vision step that reduces each frame to a small set of anatomical landmarks — shoulders, hips, knees, ankles — so appearance is discarded and geometry is kept.",
    lab: true,
    gaitscape: "cap-pose",
  },
  "temporal-modelling": {
    id: "temporal-modelling",
    term: "temporal sequence",
    aliases: ["temporal modelling", "temporal analysis", "temporal pose sequence"],
    definition:
      "Reading landmarks across frames rather than within one. Gait features — rhythm, symmetry, variability — are properties of the sequence, so this is where a posture becomes a gait.",
    gaitscape: "cap-temporal",
  },
  "multimodal-fusion": {
    id: "multimodal-fusion",
    term: "fusion",
    aliases: ["multimodal fusion", "sensor fusion"],
    definition:
      "Combining evidence from different sensors — a camera, a wearable, audio — into one reading. Adding a modality adds parameters; whether it adds capability has to be tested.",
    gaitscape: "cap-fusion",
  },
  "silent-corruption": {
    id: "silent-corruption",
    term: "silent corruption",
    aliases: ["silently corrupted", "corrupted stream"],
    definition:
      "A stream that keeps arriving and looks valid while the evidence it carries is damaged. Unlike a missing stream, nothing marks it as unreliable, so a model may trust it fully.",
  },
  "personal-baseline": {
    id: "personal-baseline",
    term: "personal baseline",
    aliases: ["individual baseline", "own baseline", "their own prior movement"],
    definition:
      "A person's own established movement pattern, measured repeatedly, used as the reference later measurements are compared against — instead of, or alongside, a population norm.",
    gaitscape: "sig-mobility-decline",
  },
  "privacy-transformation": {
    id: "privacy-transformation",
    term: "privacy transformation",
    aliases: ["privacy-aware architecture", "skeletal representation"],
    definition:
      "A deliberate step between the sensor and the analysis that removes identifying detail — face redaction, skeleton-only processing, aggregation — so downstream stages never receive it. Its privacy properties depend on how it is implemented, stored and deployed.",
    gaitscape: "cap-privacy",
  },
  trajectory: {
    id: "trajectory",
    term: "trajectory",
    aliases: ["joint trajectories", "trajectories"],
    definition:
      "The path a joint, a person or a measurement traces over time. In the pipeline it is the shape movement leaves once appearance is gone; in monitoring it is the direction repeated measurements are travelling.",
    gaitscape: "sig-trajectory",
  },
  "signal-quality": {
    id: "signal-quality",
    term: "signal quality",
    aliases: ["capture quality", "signal-quality control"],
    definition:
      "An explicit judgement of whether a capture supports a measurement at all — framing, occlusion, light, duration, a missing or damaged stream — made before any number is emitted.",
  },
  "decision-support": {
    id: "decision-support",
    term: "decision support",
    definition:
      "An output offered to a qualified person to review, in context, with its limitations stated. Not a diagnosis, not a prediction that a specific event will happen to a specific person.",
  },
  covariates: {
    id: "covariates",
    term: "covariates",
    aliases: ["covariate"],
    definition:
      "In gait research, the conditions that change how a walk looks without changing the walk: clothing, a carried bag, the camera's viewpoint, occlusion, the walking surface. Studied because they defeat recognition; read from the measurement side, they are the ways a keypoint gets moved off the body.",
    gaitscape: "cap-pose",
  },
  occlusion: {
    id: "occlusion",
    term: "occlusion",
    aliases: ["occluded", "hidden joint"],
    definition:
      "Part of the body hidden from the camera — by an object, by another person, or by the body itself. A pose estimator usually returns the hidden joints anyway, placed from typical anatomy rather than from evidence.",
  },
  "gait-cycle": {
    id: "gait-cycle",
    term: "gait cycle",
    aliases: ["stride", "stance", "swing"],
    definition:
      "One stride of one leg: heel strike to the next heel strike of the same foot. It divides into stance, while the foot is on the ground, and swing, while it is in the air — and for a short period both feet are down at once.",
    lab: true,
    gaitscape: "cap-gait",
  },
  "keypoint-confidence": {
    id: "keypoint-confidence",
    term: "confidence score",
    aliases: ["keypoint confidence", "confidence"],
    definition:
      "A number a pose estimator attaches to each joint saying how strongly its internal evidence pointed at that location. Not a probability of being right: a filled-in joint can score high, and a swapped side scores like a correct one.",
  },
};

export function getInsightTerm(id: string): InsightTerm | undefined {
  return INSIGHT_TERMS[id];
}
