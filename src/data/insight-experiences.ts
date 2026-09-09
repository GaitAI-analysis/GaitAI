/**
 * ARTICLE EXPERIENCES — the interactive layer, as data.
 *
 * `data/insights.ts` is the writing and stays the authority. This file says,
 * per article, which interactive figures sit where, which terms become
 * inspectable in which section, what the Visual Story's moments are, how the
 * article hands over to the next Foundation, and which doors it opens onto
 * the rest of the site. The components that draw all of this live in
 * `components/insights/experience/`; nothing here is a component, so an
 * article can gain or lose an interaction without touching the template.
 *
 * Every visual referenced here is ILLUSTRATIVE unless it is drawn from the
 * project's own gait keyframes, and the figures print that status on
 * themselves. No entry may introduce a number the article does not support.
 */

import type { SectionMotif } from "@/components/insights/experience/SectionMark";

/** The interactive figures the registry knows how to draw. */
export type FigureKey =
  | "video-to-intelligence"
  | "one-frame-hold"
  | "signal-quality"
  | "motion-dna-branches"
  | "privacy-transform"
  | "privacy-pipeline"
  | "longitudinal-trend"
  | "fusion-experiment"
  | "five-questions"
  /* the recurring series */
  | "pose-error-explorer";

export type FigureState = Record<string, string | number | boolean>;

export interface VisualMomentSpec {
  id: string;
  title: string;
  text: string;
  figure: FigureKey;
  state: FigureState;
}

export interface EvidenceLink {
  /** A publication id — routes to /publications/<id>/. */
  publication: string;
  /** Why it matters to THIS article, one line. */
  why: string;
}

export interface ArticleExperience {
  slug: string;
  /** Which figure is the hero, in place of the drawn cover. */
  hero: FigureKey;
  /** The section-transition motif for this essay. */
  motif: SectionMotif;
  /** Figures placed after a section's prose, by section id. */
  figures: Partial<Record<string, FigureKey[]>>;
  /** Inspectable terms per section (ids from data/insight-terms.ts). */
  terms: Partial<Record<string, string[]>>;
  /** The Visual Story: 5–7 moments. */
  moments: VisualMomentSpec[];
  /** The narrative bridge into the next Foundation. */
  bridge: {
    /** "You now know how a walking video becomes movement intelligence." */
    learned: string;
    /** "What else can one walk reveal?" */
    nextQuestion: string;
  };
  /** Doors onto the rest of the site. Only concepts that exist. */
  links: {
    evidence?: EvidenceLink[];
    gaitscape?: Array<{ label: string; node: string }>;
    lab?: { label: string };
    ask?: boolean;
  };
}

export const articleExperiences: Record<string, ArticleExperience> = {
  /* ── 01 ─────────────────────────────────────────────────────────────── */
  "from-walking-video-to-movement-intelligence": {
    slug: "from-walking-video-to-movement-intelligence",
    hero: "video-to-intelligence",
    motif: "wave",
    figures: {
      "from-pixels-to-pose": ["one-frame-hold"],
      "quality-before-intelligence": ["signal-quality"],
    },
    terms: {
      "from-pixels-to-pose": ["pose-estimation", "temporal-modelling"],
      "skeleton-is-not-gait-intelligence": ["cadence", "stride-variability", "symmetry", "trajectory"],
      "why-fusion-matters": ["multimodal-fusion"],
      "quality-before-intelligence": ["signal-quality", "silent-corruption"],
      "from-metric-to-decision-support": ["personal-baseline", "decision-support"],
    },
    moments: [
      {
        id: "raw",
        title: "A walking clip",
        text: "To a camera this is pixels: clothing, light, background and, somewhere in it, a person moving.",
        figure: "video-to-intelligence",
        state: { stage: 0 },
      },
      {
        id: "person",
        title: "The person is found",
        text: "Detection and tracking pick one body out of the frame and follow it, so what comes next belongs to one walk.",
        figure: "video-to-intelligence",
        state: { stage: 1 },
      },
      {
        id: "pose",
        title: "Pixels become landmarks",
        text: "Pose estimation keeps a handful of joints and discards appearance. This is geometry, not yet gait.",
        figure: "video-to-intelligence",
        state: { stage: 3 },
      },
      {
        id: "sequence",
        title: "Frames become a sequence",
        text: "Only across frames do rhythm, symmetry and variability exist. A single frame shows posture; the sequence shows gait.",
        figure: "video-to-intelligence",
        state: { stage: 4 },
      },
      {
        id: "signals",
        title: "The sequence becomes signals",
        text: "Cadence, stride rhythm, left/right symmetry and variability are read off the joint trajectories.",
        figure: "video-to-intelligence",
        state: { stage: 5 },
      },
      {
        id: "context",
        title: "A number meets its context",
        text: "A measurement is placed against a baseline and a history, and its capture quality travels with it.",
        figure: "video-to-intelligence",
        state: { stage: 6 },
      },
      {
        id: "decision",
        title: "Decision support, not a diagnosis",
        text: "What reaches a clinician or operator is an interpretable reading to review — the intelligence lives between observation and action.",
        figure: "video-to-intelligence",
        state: { stage: 7 },
      },
    ],
    bridge: {
      learned: "You now know how a walking video becomes movement intelligence.",
      nextQuestion: "What else can one walk reveal?",
    },
    links: {
      evidence: [
        {
          publication: "iet-pose-2022",
          why: "Pose features as the representation gait is read from — the step this essay calls pixels to pose.",
        },
        {
          publication: "prl-2023",
          why: "How preprocessing and feature selection shape what a gait pipeline can measure.",
        },
      ],
      gaitscape: [
        { label: "Pose estimation", node: "cap-pose" },
        { label: "Temporal modelling", node: "cap-temporal" },
        { label: "Cadence", node: "sig-cadence" },
      ],
      lab: { label: "Watch a clip become movement signals in the Movement Intelligence Lab" },
      ask: true,
    },
  },

  /* ── 02 ─────────────────────────────────────────────────────────────── */
  "your-walk-is-more-than-a-biometric": {
    slug: "your-walk-is-more-than-a-biometric",
    hero: "motion-dna-branches",
    motif: "branch",
    figures: {},
    terms: {
      identity: ["temporal-modelling"],
      mobility: ["cadence", "symmetry", "stride-variability"],
      recovery: ["personal-baseline"],
      risk: ["decision-support"],
      "safety-and-spatial-intelligence": ["trajectory"],
    },
    moments: [
      {
        id: "one",
        title: "One movement",
        text: "A single walking signal, drawn from the gait cycle. Everything that follows is a way of reading it.",
        figure: "motion-dna-branches",
        state: { branch: "none" },
      },
      {
        id: "identity",
        title: "Read as identity",
        text: "The narrowest reading: a recurring temporal pattern treated as a signature. A research property, not a guarantee.",
        figure: "motion-dna-branches",
        state: { branch: "identity" },
      },
      {
        id: "mobility",
        title: "Read as mobility",
        text: "The same signal, read functionally: cadence, stride and symmetry describe how well someone is moving now.",
        figure: "motion-dna-branches",
        state: { branch: "mobility" },
      },
      {
        id: "recovery",
        title: "Read as recovery",
        text: "Placed beside an earlier walk, the difference is the information: progression against a baseline.",
        figure: "motion-dna-branches",
        state: { branch: "recovery" },
      },
      {
        id: "risk",
        title: "Read as risk",
        text: "Variability and instability, and how they change over time — a reason to look closer, not a prediction.",
        figure: "motion-dna-branches",
        state: { branch: "risk" },
      },
      {
        id: "safety",
        title: "Read as safety",
        text: "At the level of a space: trajectory, unusual activity and flow — questions that never need a name attached.",
        figure: "motion-dna-branches",
        state: { branch: "safety" },
      },
    ],
    bridge: {
      learned: "You now know that one movement carries several kinds of intelligence, and identity is the narrowest of them.",
      nextQuestion: "Can a system understand how you move without knowing who you are?",
    },
    links: {
      evidence: [
        {
          publication: "ai-review-2023",
          why: "The identity reading of gait, surveyed across covariates — the research framing this note widens.",
        },
        {
          publication: "eaai-2024",
          why: "Model-based gait recognition: the representation the identity reading is built on.",
        },
      ],
      gaitscape: [
        { label: "Gait identity", node: "sig-gait-identity" },
        { label: "Mobility decline", node: "sig-mobility-decline" },
        { label: "Rehabilitation progress", node: "sig-rehab-progress" },
      ],
      lab: { label: "See the same clip read as several signals in the Movement Intelligence Lab" },
      ask: true,
    },
  },

  /* ── 03 ─────────────────────────────────────────────────────────────── */
  "movement-intelligence-without-identification": {
    slug: "movement-intelligence-without-identification",
    hero: "privacy-transform",
    motif: "trace",
    figures: {
      "separate-sensing-from-identification": ["privacy-pipeline"],
    },
    terms: {
      "separate-sensing-from-identification": ["privacy-transformation", "trajectory"],
      "privacy-by-architecture": ["decision-support"],
      "more-privacy-does-not-mean-less-intelligence": ["pose-estimation"],
    },
    moments: [
      {
        id: "rgb",
        title: "Raw RGB",
        text: "Everything a camera holds: face, clothing, build, background — and the movement, somewhere inside it.",
        figure: "privacy-transform",
        state: { stage: 0 },
      },
      {
        id: "redacted",
        title: "Face redacted",
        text: "The most recognisable region is removed at the edge. Much of the appearance remains.",
        figure: "privacy-transform",
        state: { stage: 1 },
      },
      {
        id: "silhouette",
        title: "Silhouette",
        text: "Shape without texture. Build and gait are still visible; colour, face and clothing detail are gone.",
        figure: "privacy-transform",
        state: { stage: 2 },
      },
      {
        id: "skeleton",
        title: "Skeleton",
        text: "Joints and bones only. Structural movement is intact; direct visual identity is far lower — but pose itself can carry identifying information.",
        figure: "privacy-transform",
        state: { stage: 4 },
      },
      {
        id: "trajectory",
        title: "Trajectory",
        text: "The path movement leaves through time. Minimal image information; temporal movement retained.",
        figure: "privacy-transform",
        state: { stage: 5 },
      },
      {
        id: "minimised",
        title: "Minimised output",
        text: "What leaves the system: a flow, a count, an event. Whether this is private depends on implementation, storage and deployment — not on the diagram.",
        figure: "privacy-transform",
        state: { stage: 6 },
      },
    ],
    bridge: {
      learned: "You now know that sensing movement and identifying a person are separable stages, and that the separation is an architectural choice.",
      nextQuestion: "If one reading is never the whole story, what does change over time tell us?",
    },
    links: {
      evidence: [
        {
          publication: "iet-privacy-2022",
          why: "Protecting a gait dataset inside a deep-learning pipeline — privacy treated as part of the architecture.",
        },
      ],
      gaitscape: [
        { label: "Privacy transformation", node: "cap-privacy" },
        { label: "Trajectory", node: "sig-trajectory" },
      ],
      ask: true,
    },
  },

  /* ── 04 ─────────────────────────────────────────────────────────────── */
  "fall-risk-is-a-trend-not-a-number": {
    slug: "fall-risk-is-a-trend-not-a-number",
    hero: "longitudinal-trend",
    motif: "markers",
    figures: {},
    terms: {
      "one-number-loses-context": ["trajectory"],
      "individual-baseline-matters": ["personal-baseline"],
      "which-signals-can-change": ["stride-variability", "symmetry", "cadence"],
      "trend-plus-context": ["signal-quality"],
      "decision-support-not-prediction": ["decision-support"],
    },
    moments: [
      {
        id: "one",
        title: "One number",
        text: "A single assessment looks like an answer. It is one observation, on one day, with no reference point.",
        figure: "longitudinal-trend",
        state: { step: 0 },
      },
      {
        id: "two",
        title: "A second reading",
        text: "Now there is a comparison. Is this ordinary day-to-day variation, or a direction?",
        figure: "longitudinal-trend",
        state: { step: 1 },
      },
      {
        id: "sequence",
        title: "A sequence",
        text: "With repeated assessments the single number shrinks into one point among several, and a trajectory appears.",
        figure: "longitudinal-trend",
        state: { step: 4 },
      },
      {
        id: "baseline",
        title: "Population reference",
        text: "Against a population threshold every reading may look acceptable — the same score for two very different people.",
        figure: "longitudinal-trend",
        state: { step: 4, reference: "population" },
      },
      {
        id: "personal",
        title: "Personal baseline",
        text: "Against this person's own earlier walks, the same points tell a different story. Deviation from self is harder to explain away.",
        figure: "longitudinal-trend",
        state: { step: 4, reference: "personal" },
      },
      {
        id: "signals",
        title: "Inside one assessment",
        text: "Each point carries several signals and its capture quality. A trend in the measurement setup is not a trend in the person.",
        figure: "longitudinal-trend",
        state: { step: 4, reference: "personal", point: 3 },
      },
    ],
    bridge: {
      learned: "You now know that one number is an observation and a trajectory is context — and that the reference is the person's own baseline.",
      nextQuestion: "When several sensors agree, how do we know the agreement is real?",
    },
    links: {
      evidence: [
        {
          publication: "neurocomputing-2022",
          why: "Intra-class variation — why the same person's gait differs from day to day, which is what a baseline has to absorb.",
        },
      ],
      gaitscape: [
        { label: "Fall risk", node: "sig-fall-risk" },
        { label: "Stride variability", node: "sig-stride-variability" },
        { label: "Mobility decline", node: "sig-mobility-decline" },
      ],
      lab: { label: "Explore stride variability and symmetry in the Movement Intelligence Lab" },
      ask: true,
    },
  },

  /* ── 05 ─────────────────────────────────────────────────────────────── */
  "when-fusion-looks-better-than-it-is": {
    slug: "when-fusion-looks-better-than-it-is",
    hero: "fusion-experiment",
    motif: "streams",
    figures: {
      "the-bigger-lesson": ["five-questions"],
    },
    terms: {
      "is-the-benchmark-too-easy": ["multimodal-fusion"],
      "what-happens-when-a-modality-disappears": ["pose-estimation"],
      "missing-or-silently-corrupted": ["silent-corruption", "signal-quality"],
    },
    moments: [
      {
        id: "streams",
        title: "Four streams, one result",
        text: "RGB, pose, IMU and audio converge on a fusion stage. With everything present the result looks complete.",
        figure: "fusion-experiment",
        state: { rgb: "ok", pose: "ok", imu: "ok", audio: "ok" },
      },
      {
        id: "missing",
        title: "Remove a stream",
        text: "The IMU disappears. The gap is visible: coverage drops and the system can say what it can no longer answer.",
        figure: "fusion-experiment",
        state: { rgb: "ok", pose: "ok", imu: "missing", audio: "ok" },
      },
      {
        id: "corrupt",
        title: "Corrupt a stream",
        text: "Pose still arrives, but wrong. The result keeps its size and its confident layout — nothing announces the damage.",
        figure: "fusion-experiment",
        state: { rgb: "ok", pose: "corrupt", imu: "ok", audio: "ok" },
      },
      {
        id: "both",
        title: "Missing is not corrupted",
        text: "Known absence is a routing problem. Silent corruption is a detection problem. A model tested only under clean removal has not met the second.",
        figure: "fusion-experiment",
        state: { rgb: "ok", pose: "corrupt", imu: "missing", audio: "ok" },
      },
      {
        id: "questions",
        title: "Five questions",
        text: "Benchmark difficulty, missing inputs, silent corruption, faithful explanations, statistical and operational significance.",
        figure: "five-questions",
        state: { open: 0 },
      },
    ],
    bridge: {
      learned: "You now know how to tell a convincing multimodal result from a well-decorated benchmark number.",
      nextQuestion: "You have followed one walk from pixels to evidence. Where does the reading path begin again?",
    },
    links: {
      evidence: [
        {
          publication: "ivc-2023",
          why: "Machine learning against deep learning for gait, feature by feature — the kind of baseline comparison question one asks for.",
        },
        {
          publication: "dsp-2024",
          why: "Deep learning for gait pattern recognition, with the evaluation choices that decide whether a gain is real.",
        },
      ],
      gaitscape: [
        { label: "Multimodal fusion", node: "cap-fusion" },
        { label: "Explainability", node: "cap-explain" },
      ],
      ask: true,
    },
  },

  /* ══════════════════════════════════════════════════════════════════════
     AI UNDER STRESS
     ══════════════════════════════════════════════════════════════════════ */

  /* ── AI Under Stress · 01 ────────────────────────────────────────────── */
  "when-pose-estimation-lies": {
    slug: "when-pose-estimation-lies",
    hero: "pose-error-explorer",
    motif: "trace",
    figures: {},
    terms: {
      "plausible-is-not-correct": ["pose-estimation"],
      "where-keypoints-go-wrong": ["covariates", "occlusion"],
      "confidence-is-not-correctness": ["keypoint-confidence"],
      "what-the-error-does-downstream": ["symmetry", "cadence", "temporal-modelling"],
      "seeing-the-lie": ["signal-quality", "multimodal-fusion"],
      "what-this-means": ["decision-support"],
    },
    moments: [
      {
        id: "clean",
        title: "A clean frame",
        text: "Full body, steady camera, good light. Every joint the estimator returns was observed.",
        figure: "pose-error-explorer",
        state: { issue: "none", view: "original" },
      },
      {
        id: "occlusion-ai",
        title: "A plausible skeleton",
        text: "The far leg is behind a bin. The estimator still returns a complete skeleton, and nothing on it says which joints are guesses.",
        figure: "pose-error-explorer",
        state: { issue: "occlusion", view: "ai" },
      },
      {
        id: "occlusion-original",
        title: "The frame it came from",
        text: "Against the original, the filled-in knee sits off the hidden leg. The estimate was confident; the joint was never seen.",
        figure: "pose-error-explorer",
        state: { issue: "occlusion", view: "original" },
      },
      {
        id: "blur",
        title: "Motion blur",
        text: "The swing foot is a streak. Its ankle lands along the streak, ahead of the foot — and step timing reads from that ankle.",
        figure: "pose-error-explorer",
        state: { issue: "blur", view: "original" },
      },
      {
        id: "cropped",
        title: "Cropped feet",
        text: "The feet were never in the frame. Ankles appear at the bottom edge anyway; heel strike, and everything timed from it, is gone.",
        figure: "pose-error-explorer",
        state: { issue: "cropped", view: "original" },
      },
      {
        id: "crossing",
        title: "Left and right trade places",
        text: "At mid-stance the legs overlap and swap for a span of frames. Each frame is plausible; the symmetry reading is inverted.",
        figure: "pose-error-explorer",
        state: { issue: "crossing", view: "original" },
      },
    ],
    bridge: {
      learned: "You now know that a pose estimator fails by answering — with a skeleton that looks right — and why a measurement has to check it against time, anatomy and other sensors.",
      nextQuestion: "What else happens to movement AI when the world stops cooperating?",
    },
    links: {
      evidence: [
        {
          publication: "neurocomputing-2022",
          why: "The covariates — clothing, carrying, view, occlusion — that change how a walk looks without changing the walk, surveyed across methods.",
        },
        {
          publication: "iet-pose-2022",
          why: "Pose features as the representation gait is read from: the joints this essay watches go astray.",
        },
        {
          publication: "prl-2023",
          why: "How preprocessing decides what a gait pipeline can measure — the stage where a bad frame should be caught.",
        },
      ],
      gaitscape: [
        { label: "Pose estimation", node: "cap-pose" },
        { label: "Step symmetry", node: "sig-step-symmetry" },
        { label: "Gait analysis", node: "cap-gait" },
      ],
      lab: { label: "Watch pose landmarks being tracked on a clip in the Movement Intelligence Lab" },
      ask: true,
    },
  },
};

export function getArticleExperience(slug: string): ArticleExperience | undefined {
  return articleExperiences[slug];
}
