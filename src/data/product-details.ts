// ============================================================================
// MOBILITYCARE PRODUCT DETAIL CONTENT
// ----------------------------------------------------------------------------
// Structured content for the /mobilitycare/[slug] detail pages. One record per
// product; a single shared template (ProductDetailView) renders all of them.
//
// Wording policy: every string here must describe GaitAI as assessment /
// screening / monitoring / decision support. No diagnosis, no certification,
// no accuracy or compliance claims. Example metrics are illustrative sample-
// report values, never measured performance claims.
// ============================================================================

import { productById } from "./products";
import { RESPONSIBLE_USE_CARE } from "./responsible-use";

export interface ProductDetail {
  /** Route slug — /mobilitycare/[slug]/ — matches GaitProduct.id */
  slug: string;
  /**
   * One-line value proposition under the product name.
   *
   * OPTIONAL, and omitted wherever it would only restate the canonical
   * `headline` from products.ts. Seven records used to carry a
   * byte-identical copy, which is a silent drift surface: correcting the
   * headline left the detail page serving the old line. Set this only when
   * the detail page genuinely needs a different line; otherwise
   * `productValueProp()` resolves the canonical one.
   */
  valueProp?: string;
  /** Short overview paragraph */
  overview: string;
  /** Environment tags shown in the hero */
  environments: string[];
  /** At-a-glance row: Input → Analysis → Output → User */
  glance: { input: string; analysis: string; output: string; user: string };

  // ------ Executive view ------
  problem: string;
  solution: string;
  whoFor: string[];
  receives: string[];
  whyItMatters: string;
  workflow: string[];
  deployment: string[];
  /** Illustrative sample-report values (labelled as such in the UI) */
  metrics: { value: string; label: string }[];
  /** Clinical / operational interpretation of the outputs */
  interpretation: string;

  // ------ Technical view ------
  tech: {
    systemOverview: string;
    inputs: string[];
    pipeline: string[];
    features: string[];
    models: string[];
    outputSchema: { field: string; desc: string }[];
    longitudinal?: string;
    quality: string[];
    integration: string[];
    limitations: string[];
  };

  /** Privacy & responsible-use note */
  privacy: string;
  /** Exactly three related product ids */
  related: [string, string, string];
  ctaLabel: string;
}

/**
 * One canonical responsible-use statement for the whole site — see
 * src/data/responsible-use.ts. Previously spelled out here as accomplished
 * deployment fact, which claimed more than /legal/security/ does.
 */
const SHARED_PRIVACY = RESPONSIBLE_USE_CARE;

export const productDetails: ProductDetail[] = [
  // ==========================================================================
  // 01 — WALKSCAN
  // ==========================================================================
  {
    slug: "walkscan",
    overview:
      "WalkScan converts a short walking video into structured gait and mobility measurements. It is designed to give clinicians and movement professionals a measured layer of evidence alongside visual observation.",
    environments: ["Clinic", "Rehab", "Sports", "Research"],
    glance: {
      input: "Walking video",
      analysis: "Gait AI",
      output: "Movement report",
      user: "Clinician",
    },
    problem:
      "Walking assessments are often based on manual observation and occasional measurements. Subtle changes in cadence, symmetry, stride pattern or posture can be difficult to compare consistently across visits.",
    solution:
      "A guided walking video is processed through pose and movement analysis to extract repeatable gait descriptors and present them in an easy-to-review report.",
    whoFor: [
      "Physiotherapists",
      "Rehabilitation clinics",
      "Orthopedic teams",
      "Neurology teams",
      "Elderly-care services",
      "Sports and wellness professionals",
      "Research studies",
    ],
    receives: [
      "Walking speed",
      "Cadence",
      "Step / stride pattern",
      "Gait asymmetry",
      "Postural indicators",
      "Mobility score",
      "Trend comparison where prior sessions exist",
      "Downloadable report",
    ],
    whyItMatters:
      "Turns ordinary walking footage into structured evidence that can be compared over time — the same walk, measured the same way, at every visit.",
    workflow: [
      "Record a 10–20 second walk",
      "Upload the clip",
      "AI processes the gait",
      "Clinician reviews the measurements",
      "Report added to the patient / assessment workflow",
    ],
    deployment: [
      "Web upload from any smartphone or clinic camera",
      "No wearables or markers required for a basic assessment",
      "Reports export as PDF for existing documentation workflows",
      "Works as a standalone tool or as the capture layer for RehabTrack and FallRisk",
    ],
    metrics: [
      { value: "1.12 m/s", label: "Walking speed" },
      { value: "108 /min", label: "Cadence" },
      { value: "94%", label: "Step symmetry" },
      { value: "82 / 100", label: "Mobility score" },
    ],
    interpretation:
      "The report is read as a structured snapshot of how a person walked during the capture — speed, rhythm, symmetry and posture — so the clinician can compare it against earlier sessions and their own observation. Values support assessment; they are not a diagnosis.",
    tech: {
      systemOverview:
        "WalkScan is a video-to-metrics pipeline: a short walking clip is converted into per-frame pose sequences, segmented into gait cycles, summarised into repeatable movement descriptors and rendered as a report.",
      inputs: [
        "Short walking video (10–20 s)",
        "Smartphone recording",
        "Clinic camera",
        "Compatible CCTV / fixed-camera footage where appropriate",
      ],
      pipeline: [
        "Video",
        "Person / pose tracking",
        "Temporal gait-cycle analysis",
        "Gait feature extraction",
        "Quality checks",
        "Mobility summary",
        "Report",
      ],
      features: [
        "Walking speed and cadence",
        "Step and stride timing",
        "Left / right symmetry indices",
        "Stride-length proxies",
        "Postural angle indicators",
        "Gait variability descriptors",
      ],
      models: [
        "Pose-estimation network producing per-frame skeleton landmarks",
        "Temporal gait-cycle segmentation over pose sequences",
        "Feature aggregation into session-level movement descriptors",
        "Report generator with reference-range context",
      ],
      outputSchema: [
        { field: "walking_speed", desc: "Estimated walking speed (m/s)" },
        { field: "cadence", desc: "Steps per minute" },
        { field: "symmetry_index", desc: "Left/right step symmetry (0–100)" },
        { field: "stride_pattern", desc: "Step / stride timing descriptors" },
        { field: "posture_markers", desc: "Trunk / postural angle indicators" },
        { field: "mobility_score", desc: "Composite session score (0–100)" },
        { field: "quality_flags", desc: "Capture-quality gating results" },
      ],
      longitudinal:
        "When earlier WalkScan sessions exist for the same person, the report includes change-over-time comparisons for speed, cadence and symmetry.",
      quality: [
        "Capture is quality-gated: inadequate visibility, occlusion or an incomplete walk produces a re-capture prompt instead of low-confidence numbers",
        "Per-metric confidence flags accompany the report",
        "Guided capture instructions reduce camera-angle variation",
      ],
      integration: [
        "PDF report export",
        "Structured JSON export for downstream systems",
        "Feeds RehabTrack, FallRisk and RemoteCare as the assessment layer",
      ],
      limitations: [
        "Measurements describe the captured walk only — a short clip is a sample, not continuous behaviour",
        "Camera angle, clothing and lighting affect capture quality; gated captures must be repeated",
        "Outputs support assessment and are not a medical diagnosis",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["rehabtrack", "fallrisk", "orthomotion"],
    ctaLabel: "Pilot WalkScan",
  },

  // ==========================================================================
  // 02 — FALLRISK
  // ==========================================================================
  {
    slug: "fallrisk",
    valueProp:
      "Surface mobility deterioration and fall-risk indicators for earlier review.",
    overview:
      "FallRisk combines gait, balance, movement variability, posture and longitudinal change into an interpretable mobility-risk profile.",
    environments: ["Hospital", "Elderly care", "Home care", "Preventive health"],
    glance: {
      input: "Assessments + history",
      analysis: "Risk model",
      output: "Risk profile",
      user: "Care team",
    },
    problem:
      "Gradual mobility decline can appear between scheduled assessments. A patient may still be walking independently while variability, balance or gait stability is worsening.",
    solution:
      "GaitAI compares multiple movement indicators and their changes over time to generate a low / medium / high mobility-risk category with visible contributing factors.",
    whoFor: [
      "Hospitals",
      "Elderly-care centres",
      "Home-care providers",
      "Physiotherapy",
      "Preventive-health programs",
      "Caregivers",
    ],
    receives: [
      "Low / medium / high risk indicator",
      "Risk contributors",
      "Mobility trend",
      "Change from previous assessment",
      "Escalation flag",
      "Caregiver / clinician summary",
    ],
    whyItMatters:
      "A visible risk category with named contributors gives care teams a structured basis for deciding who to review next, instead of relying on ad-hoc observation.",
    workflow: [
      "Run a walking assessment (or reuse a WalkScan session)",
      "AI compares indicators against the person's own baseline",
      "Risk category and contributors are generated",
      "Care team reviews the summary",
      "Escalation or intervention is planned where needed",
    ],
    deployment: [
      "Works from periodic video assessments, WatchCare wearable trends, or both",
      "Ward-level and facility-level dashboards for care organisations",
      "Caregiver summaries written in plain language",
      "Configurable escalation criteria per facility",
    ],
    metrics: [
      { value: "Medium", label: "Risk category" },
      { value: "3", label: "Named contributors" },
      { value: "−0.08 m/s", label: "Speed change vs baseline" },
      { value: "↑ 12%", label: "Stride variability change" },
    ],
    interpretation:
      "The category is a movement-risk decision-support indicator: it says this person's movement profile has shifted in ways associated with reduced stability, and shows which signals drove that call. It is not a prediction that a specific individual will fall.",
    tech: {
      systemOverview:
        "FallRisk is a longitudinal risk-profiling layer: it consumes repeated movement assessments and optional wearable signals, compares them against an individual baseline, and produces an interpretable risk category with contributing factors.",
      inputs: [
        "Walking assessment video",
        "Repeated WalkScan assessments",
        "Wearable mobility signals when available",
        "Longitudinal movement history",
      ],
      pipeline: [
        "Assessments + history",
        "Baseline alignment",
        "Signal extraction",
        "Change detection",
        "Risk categorisation",
        "Contributor attribution",
        "Care summary",
      ],
      features: [
        "Stride variability",
        "Walking speed",
        "Cadence variability",
        "Asymmetry",
        "Balance indicators",
        "Postural sway proxies",
        "Change from individual baseline",
      ],
      models: [
        "Individual-baseline modelling from repeated assessments",
        "Multi-signal change detection across gait and balance indicators",
        "Rule-assisted risk categorisation designed to stay interpretable",
        "Contributor attribution so every category shows its drivers",
      ],
      outputSchema: [
        { field: "risk_level", desc: "low | medium | high" },
        { field: "contributors", desc: "Ranked signals driving the category" },
        { field: "trend", desc: "Mobility trajectory vs baseline" },
        { field: "delta_prev", desc: "Change since previous assessment" },
        { field: "escalation_flag", desc: "Meets configured escalation criteria" },
        { field: "summary", desc: "Plain-language care summary" },
      ],
      longitudinal:
        "Risk is always computed against the individual's own baseline, so a naturally slow walker is not misread as high risk and a fast walker's decline is not missed.",
      quality: [
        "A category is only issued when enough valid assessments exist",
        "Contributors are surfaced so reviewers can sanity-check every call",
        "Low-confidence inputs are flagged rather than silently included",
      ],
      integration: [
        "Care-team dashboard",
        "Caregiver summary export",
        "SeniorCare and WatchCare feed FallRisk directly",
      ],
      limitations: [
        "The score is a movement-risk decision-support indicator — not a prediction that a specific individual will fall",
        "Depends on assessment cadence: infrequent assessments limit trend resolution",
        "Environmental and medical fall factors outside movement data are not captured",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["seniorcare", "watchcare", "remotecare"],
    ctaLabel: "Explore FallRisk",
  },

  // ==========================================================================
  // 03 — REHABTRACK
  // ==========================================================================
  {
    slug: "rehabtrack",
    valueProp: "Make recovery visible from session to session.",
    overview:
      "RehabTrack compares movement across rehabilitation sessions to quantify how gait, symmetry, mobility and functional movement change during recovery.",
    environments: ["Physiotherapy", "Post-surgical", "Sports rehab", "Neuro rehab"],
    glance: {
      input: "Session assessments",
      analysis: "Longitudinal comparison",
      output: "Recovery record",
      user: "Therapist",
    },
    problem:
      "Patients and therapists often know that movement “looks better,” but lack objective evidence showing where and how recovery occurred.",
    solution:
      "Repeated assessments are aligned into a longitudinal recovery record that highlights improvement, stagnation and unresolved asymmetry.",
    whoFor: [
      "Physiotherapy clinics",
      "Post-surgical rehabilitation",
      "Sports rehabilitation",
      "Neurological rehabilitation",
      "Orthopedic rehabilitation",
    ],
    receives: [
      "Baseline vs current comparison",
      "Recovery trend",
      "Symmetry improvement",
      "Walking-speed change",
      "Cadence change",
      "Functional mobility trend",
      "Session-by-session report",
    ],
    whyItMatters:
      "Transforms recovery from a subjective impression into a visible trajectory — for the therapist planning the next block, and for the patient staying motivated.",
    workflow: [
      "Capture a baseline assessment",
      "Run therapy",
      "Reassess at the next session",
      "AI compares sessions",
      "Progress is visualised",
      "Therapist adjusts the plan",
    ],
    deployment: [
      "Sits on top of WalkScan captures — no extra capture hardware",
      "Session tagging by date and rehabilitation stage",
      "Patient-friendly progress views for engagement and retention",
      "Clinic dashboard across active rehabilitation caseloads",
    ],
    metrics: [
      { value: "+18%", label: "Symmetry vs baseline" },
      { value: "+0.15 m/s", label: "Walking-speed change" },
      { value: "6", label: "Sessions compared" },
      { value: "↗", label: "Functional mobility trend" },
    ],
    interpretation:
      "Session-over-session deltas show where recovery is progressing and where asymmetry persists, so therapy time is spent on what has not yet resolved. Trends support the therapist's clinical reasoning; they do not replace it.",
    tech: {
      systemOverview:
        "RehabTrack aligns repeated movement assessments for the same person into a longitudinal record, computes deltas over gait and mobility descriptors, and renders recovery trajectories.",
      inputs: [
        "Baseline walking assessment",
        "Follow-up walking assessments",
        "Optional wearable data",
        "Session date / rehabilitation stage",
      ],
      pipeline: [
        "Baseline",
        "Follow-up sessions",
        "Session alignment",
        "Delta computation",
        "Trend modelling",
        "Progress visualisation",
        "Therapist report",
      ],
      features: [
        "Walking speed per session",
        "Cadence per session",
        "Symmetry indices over time",
        "Asymmetry-resolution tracking",
        "Functional mobility descriptors",
      ],
      models: [
        "Session alignment against the person's baseline",
        "Delta and trend computation across sessions",
        "Stagnation detection for plateaued indicators",
      ],
      outputSchema: [
        { field: "baseline_ref", desc: "Baseline session reference" },
        { field: "session_deltas", desc: "Per-metric change per session" },
        { field: "recovery_trend", desc: "Direction and slope per indicator" },
        { field: "unresolved", desc: "Indicators without improvement" },
        { field: "report", desc: "Session-by-session progress report" },
      ],
      longitudinal:
        "The entire product is longitudinal: every output is a comparison across sessions rather than a single-session snapshot.",
      quality: [
        "Sessions failing capture-quality gates are excluded from trends",
        "Comparisons flag when capture conditions differed materially between sessions",
        "Minimum-session thresholds before a trend is displayed",
      ],
      integration: [
        "WalkScan as the capture layer",
        "PDF progress reports",
        "Clinic dashboard for active caseloads",
      ],
      limitations: [
        "Trend quality depends on consistent capture conditions across sessions",
        "Progress shown is movement progress — pain, confidence and function beyond gait need clinical assessment",
        "Not a substitute for the therapist's treatment decisions",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["walkscan", "orthomotion", "sportsmotion"],
    ctaLabel: "Use RehabTrack in a pilot",
  },

  // ==========================================================================
  // 04 — SPORTSMOTION
  // ==========================================================================
  {
    slug: "sportsmotion",
    valueProp: "Athlete movement measured, compared and tracked.",
    overview:
      "SportsMotion analyzes walking and running mechanics to surface asymmetry, imbalance, fatigue-related change and recovery trends.",
    environments: ["Academy", "Performance centre", "Sports rehab", "S&C"],
    glance: {
      input: "Running video",
      analysis: "Motion AI",
      output: "Movement profile",
      user: "Coach / physio",
    },
    problem:
      "Return-to-play and movement-quality decisions are frequently made from short visual assessments, athlete feedback and isolated tests.",
    solution:
      "AI-based motion analysis creates repeatable measurements that can be compared with the athlete's own baseline.",
    whoFor: [
      "Sports academies",
      "Performance centres",
      "Physiotherapists",
      "Strength and conditioning teams",
      "Rehabilitation teams",
    ],
    receives: [
      "Running symmetry",
      "Left / right movement comparison",
      "Limb imbalance indicators",
      "Knee / hip movement markers",
      "Cadence",
      "Fatigue-related movement change",
      "Recovery trend",
      "Return-to-play decision-support summary",
    ],
    whyItMatters:
      "Baselining every athlete makes deviation visible: post-injury sessions are compared against the athlete's own healthy movement, not a generic norm.",
    workflow: [
      "Baseline the athlete pre-season",
      "Capture walking / running sessions over time",
      "AI compares against the individual baseline",
      "Asymmetry and fatigue-related change are flagged",
      "Coach and physio review the return-to-play summary",
    ],
    deployment: [
      "Pitch-side or treadmill capture from a phone or fixed camera",
      "Squad-level dashboards for academies and performance centres",
      "Integrates with RehabTrack for injury-rehabilitation blocks",
      "Optional wearable signals for training-load context",
    ],
    metrics: [
      { value: "97%", label: "Running symmetry (baseline)" },
      { value: "89%", label: "Running symmetry (current)" },
      { value: "172 /min", label: "Cadence" },
      { value: "↓", label: "Fatigue-related change" },
    ],
    interpretation:
      "A widening left/right gap or fatigue-related drift is read as a movement-risk indicator worth investigating — it informs return-to-play conversations rather than deciding them.",
    tech: {
      systemOverview:
        "SportsMotion extends the gait pipeline to running mechanics: higher-cadence pose tracking, sport-relevant joint markers and baseline-relative comparison across sessions.",
      inputs: [
        "Walking / running video",
        "Repeated performance sessions",
        "Optional wearables",
        "Individual baseline",
      ],
      pipeline: [
        "Running video",
        "Pose tracking",
        "Stride segmentation",
        "Mechanics feature extraction",
        "Baseline comparison",
        "Fatigue / asymmetry flags",
        "Performance report",
      ],
      features: [
        "Running symmetry indices",
        "Limb-imbalance indicators",
        "Knee / hip movement markers",
        "Cadence and stride timing",
        "Session-to-session fatigue-related drift",
      ],
      models: [
        "High-cadence pose tracking tuned for running",
        "Stride-level mechanics extraction",
        "Athlete-baseline comparison model",
        "Fatigue-related change detection across a session and across sessions",
      ],
      outputSchema: [
        { field: "run_symmetry", desc: "Left/right running symmetry (0–100)" },
        { field: "limb_imbalance", desc: "Imbalance indicators per limb" },
        { field: "joint_markers", desc: "Knee / hip movement markers" },
        { field: "cadence", desc: "Steps per minute" },
        { field: "fatigue_drift", desc: "Within/between-session change" },
        { field: "rtp_summary", desc: "Return-to-play decision-support summary" },
      ],
      longitudinal:
        "Recovery trends compare each session against the athlete's pre-injury baseline, making the remaining gap explicit.",
      quality: [
        "Capture-quality gating for frame rate, visibility and stride count",
        "Baseline validity checks before comparisons are shown",
        "Confidence flags on joint-level markers",
      ],
      integration: [
        "Squad dashboard",
        "RehabTrack for rehabilitation blocks",
        "Structured export for performance-analysis stacks",
      ],
      limitations: [
        "Outputs are movement-risk indicators, not injury predictions",
        "Camera placement and frame rate constrain joint-marker precision",
        "Return-to-play remains a clinical and coaching decision",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["rehabtrack", "watchcare", "walkscan"],
    ctaLabel: "Explore SportsMotion",
  },

  // ==========================================================================
  // 05 — WATCHCARE
  // ==========================================================================
  {
    slug: "watchcare",
    valueProp: "Continuous mobility intelligence from everyday wearables.",
    overview:
      "WatchCare uses smartwatch, phone and compatible wearable signals to track everyday movement between formal assessments.",
    environments: ["Home", "Elderly care", "Rehab adherence", "Wellness"],
    glance: {
      input: "Wearable signals",
      analysis: "Trend AI",
      output: "Mobility trends",
      user: "Caregiver / clinician",
    },
    problem:
      "Clinic visits provide snapshots. Mobility deterioration may occur during the days or weeks between those snapshots.",
    solution:
      "Wearable-derived activity and movement patterns are summarized into longitudinal mobility indicators and change alerts.",
    whoFor: [
      "Elderly users and their caregivers",
      "Remote-care teams",
      "Physiotherapy patients",
      "Senior-care organisations",
      "Wellness programs",
    ],
    receives: [
      "Daily mobility score",
      "Step / cadence trend",
      "Activity decline indicator",
      "Fall-risk trend",
      "Rehabilitation adherence",
      "Sports recovery trend",
      "Caregiver / clinician dashboard",
    ],
    whyItMatters:
      "Adds the missing time dimension between clinic visits — decline that develops over weeks becomes visible as a trend instead of a surprise.",
    workflow: [
      "Person wears their usual smartwatch",
      "Signals sync in the background",
      "Daily features are computed against a personal baseline",
      "Trends and change alerts surface on the dashboard",
      "Caregiver or clinician follows up when something shifts",
    ],
    deployment: [
      "Works with consumer smartwatches and phone motion signals",
      "No new hardware for most users",
      "Family caregiver view plus professional dashboard",
      "Feeds FallRisk and SeniorCare with between-visit evidence",
    ],
    metrics: [
      { value: "78 / 100", label: "Daily mobility score" },
      { value: "−14%", label: "Weekly activity change" },
      { value: "21 days", label: "Trend window" },
      { value: "1", label: "Change alert this month" },
    ],
    interpretation:
      "Trends are read relative to the person's own baseline: a sustained decline in daily movement or cadence is an indicator to check in, not a diagnosis of any condition.",
    tech: {
      systemOverview:
        "WatchCare is a continuous-signal pipeline: wearable streams are preprocessed, windowed into daily features, compared against a personal baseline and summarised into trends and change alerts.",
      inputs: [
        "Smartwatch signals",
        "IMU / accelerometer",
        "Step activity",
        "Daily movement patterns",
        "Smartphone motion signals where available",
      ],
      pipeline: [
        "Wearable stream",
        "Preprocessing",
        "Windowing",
        "Daily features",
        "Personal baseline",
        "Trend detection",
        "Dashboard",
      ],
      features: [
        "Daily step and cadence descriptors",
        "Activity-volume and rhythm features",
        "Gait-variability proxies from IMU signals",
        "Rest / active pattern features",
      ],
      models: [
        "Signal preprocessing and artifact rejection",
        "Personal-baseline modelling per user",
        "Trend and change-point detection over daily features",
        "Alert generation with configurable sensitivity",
      ],
      outputSchema: [
        { field: "mobility_score", desc: "Daily composite score (0–100)" },
        { field: "step_trend", desc: "Step / cadence trajectory" },
        { field: "decline_flag", desc: "Sustained activity-decline indicator" },
        { field: "fallrisk_trend", desc: "Movement-risk trajectory input to FallRisk" },
        { field: "adherence", desc: "Rehabilitation activity adherence" },
        { field: "alerts", desc: "Change alerts with triggering signals" },
      ],
      longitudinal:
        "All outputs are longitudinal by construction — daily features accumulate into personal baselines and multi-week trends.",
      quality: [
        "Wear-time validation before a day counts toward trends",
        "Artifact rejection for non-wear and charging periods",
        "Alerts require sustained change, not single-day dips",
      ],
      integration: [
        "Caregiver mobile / web dashboard",
        "FallRisk and SeniorCare as downstream consumers",
        "Structured export for care-management systems",
      ],
      limitations: [
        "Consumer wearable signals vary by device and wear habits",
        "Trends indicate change in movement behaviour, not its medical cause",
        "Not an emergency-detection or SOS system",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["fallrisk", "seniorcare", "remotecare"],
    ctaLabel: "Explore WatchCare",
  },

  // ==========================================================================
  // 06 — NEUROMOTION
  // ==========================================================================
  {
    slug: "neuromotion",
    valueProp: "Quantify neurological movement patterns over time.",
    overview:
      "NeuroMotion supports objective monitoring of gait patterns associated with neurological movement difficulties — including Parkinsonian gait monitoring, stroke rehabilitation, ataxic gait, multiple-sclerosis-related mobility change and neuropathy-related gait change.",
    environments: ["Neurology", "Neuro rehab", "Hospital", "Research"],
    glance: {
      input: "Walk + turn video",
      analysis: "Neuro-gait AI",
      output: "Movement record",
      user: "Neurology team",
    },
    problem:
      "Small changes in shuffling, asymmetry, turning and walking stability can be difficult to quantify using observation alone.",
    solution:
      "Guided walking and turning assessments are converted into repeatable neuro-relevant movement indicators tracked against the person's own history.",
    whoFor: [
      "Neurologists",
      "Neurorehabilitation centres",
      "Hospitals",
      "Movement-disorder clinics",
      "Research labs",
    ],
    receives: [
      "Shuffling indicator",
      "Freezing-like movement marker",
      "Step asymmetry",
      "Turning stability",
      "Walking-speed change",
      "Cadence change",
      "Longitudinal mobility trend",
    ],
    whyItMatters:
      "Provides a repeatable movement record that can complement clinical assessment — the same protocol, measured the same way, at every visit.",
    workflow: [
      "Run a guided walk-and-turn protocol",
      "AI extracts neuro-relevant movement indicators",
      "Session is added to the person's longitudinal record",
      "Clinician reviews change since previous sessions",
      "Record complements the clinical assessment",
    ],
    deployment: [
      "Clinic-corridor capture with a phone or fixed camera",
      "Repeatable protocols for consistent session comparison",
      "Longitudinal record per patient",
      "Research-mode export for movement-disorder studies",
    ],
    metrics: [
      { value: "0.31 s", label: "Turn-hesitation time" },
      { value: "91%", label: "Step symmetry" },
      { value: "−6 /min", label: "Cadence vs baseline" },
      { value: "8", label: "Sessions on record" },
    ],
    interpretation:
      "Indicators quantify how movement patterns are changing over time. NeuroMotion does not diagnose neurological conditions — it gives the clinical team a measured record to read alongside their assessment.",
    tech: {
      systemOverview:
        "NeuroMotion applies the gait pipeline to neuro-relevant protocols: walking plus turning assessments, indicator extraction tuned to shuffling, hesitation and stability, and strict longitudinal tracking.",
      inputs: [
        "Walking video",
        "Turning assessment",
        "Repeated sessions",
        "Optional wearable signals",
      ],
      pipeline: [
        "Guided protocol capture",
        "Pose tracking",
        "Gait + turn segmentation",
        "Neuro-indicator extraction",
        "Baseline comparison",
        "Longitudinal record",
        "Clinician view",
      ],
      features: [
        "Shuffling indicators (step height / length proxies)",
        "Freezing-like hesitation markers",
        "Turning stability and turn duration",
        "Step asymmetry",
        "Walking speed and cadence trajectories",
      ],
      models: [
        "Pose tracking robust to slow and shuffling gait",
        "Turn detection and segmentation",
        "Hesitation-event detection over temporal pose features",
        "Longitudinal change modelling per indicator",
      ],
      outputSchema: [
        { field: "shuffle_index", desc: "Shuffling indicator" },
        { field: "hesitation_events", desc: "Freezing-like movement markers" },
        { field: "step_asymmetry", desc: "Left/right asymmetry" },
        { field: "turn_stability", desc: "Turning stability descriptors" },
        { field: "speed_delta", desc: "Walking-speed change vs baseline" },
        { field: "trend", desc: "Longitudinal mobility trend" },
      ],
      longitudinal:
        "Every session extends the person's record; clinicians read direction and rate of change rather than isolated values.",
      quality: [
        "Protocol compliance checks (complete walk, complete turn)",
        "Capture gating for visibility and occlusion",
        "Indicator confidence flags on every session",
      ],
      integration: [
        "Clinician longitudinal view",
        "ClinicalTrials export for research cohorts",
        "WalkScan-compatible capture workflow",
      ],
      limitations: [
        "NeuroMotion does not diagnose Parkinson's disease, stroke, MS or any condition",
        "Indicators are movement descriptors; their clinical meaning is determined by the care team",
        "Session comparability depends on following the guided protocol",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["walkscan", "rehabtrack", "watchcare"],
    ctaLabel: "Explore NeuroMotion",
  },

  // ==========================================================================
  // 07 — ORTHOMOTION
  // ==========================================================================
  {
    slug: "orthomotion",
    valueProp: "Measure how joints, limbs and posture affect walking.",
    overview:
      "OrthoMotion evaluates movement changes associated with orthopedic, musculoskeletal and post-surgical mobility — knee and hip recovery, foot and ankle mobility, spine and posture, limp assessment and post-surgical gait monitoring.",
    environments: ["Orthopedics", "Post-surgical", "Physiotherapy", "Rehab"],
    glance: {
      input: "Walking video",
      analysis: "Ortho-gait AI",
      output: "Recovery evidence",
      user: "Ortho team",
    },
    problem:
      "Orthopedic recovery is often judged from visual gait checks and patient-reported comfort, which makes small residual limps and loading asymmetries easy to miss.",
    solution:
      "Walking assessments are converted into limp, loading and posture indicators that can be compared before and after surgery or across recovery.",
    whoFor: [
      "Orthopedic surgeons",
      "Physiotherapists",
      "Sports-medicine teams",
      "Rehabilitation centres",
      "Post-surgical follow-up clinics",
    ],
    receives: [
      "Limp / asymmetry indicator",
      "Limb-loading proxy",
      "Posture angle indicators",
      "Step-length comparison",
      "Walking-speed comparison",
      "Recovery trend",
    ],
    whyItMatters:
      "Adds quantitative movement evidence to orthopedic recovery monitoring — residual asymmetry stays visible until it is actually resolved.",
    workflow: [
      "Capture a pre-op or baseline walk where possible",
      "Repeat short assessments across recovery",
      "AI compares limp, loading and posture indicators",
      "Ortho team reviews the recovery trend",
      "Follow-up focuses on unresolved indicators",
    ],
    deployment: [
      "Corridor or clinic capture with existing devices",
      "Pre-op / post-op comparison workflow",
      "Works alongside RehabTrack during therapy blocks",
      "PDF recovery evidence for surgical follow-up",
    ],
    metrics: [
      { value: "0.14", label: "Limp index" },
      { value: "−9%", label: "Loading asymmetry vs last visit" },
      { value: "+4 cm", label: "Step-length recovery" },
      { value: "12 wks", label: "Monitoring span" },
    ],
    interpretation:
      "Indicators quantify how the operated or affected side is being used during walking. They support recovery monitoring and follow-up planning; they are not a diagnostic measurement of joint health.",
    tech: {
      systemOverview:
        "OrthoMotion tunes the gait pipeline to musculoskeletal recovery: limp and loading proxies, posture angles and side-to-side comparisons tracked across the recovery timeline.",
      inputs: [
        "Walking video",
        "Repeated post-op assessments",
        "Optional reference baseline",
      ],
      pipeline: [
        "Walking video",
        "Pose tracking",
        "Side-to-side comparison",
        "Limp / loading indicators",
        "Posture analysis",
        "Recovery trend",
        "Report",
      ],
      features: [
        "Limp / asymmetry indices",
        "Limb-loading proxies from stance-time and movement patterns",
        "Posture angle indicators (trunk lean, pelvic proxies)",
        "Step-length and walking-speed comparisons",
      ],
      models: [
        "Stance / swing segmentation per limb",
        "Side-to-side asymmetry modelling",
        "Posture-angle estimation from pose sequences",
        "Recovery-trend computation across sessions",
      ],
      outputSchema: [
        { field: "limp_index", desc: "Limp / asymmetry indicator" },
        { field: "loading_proxy", desc: "Limb-loading asymmetry proxy" },
        { field: "posture_angles", desc: "Posture angle indicators" },
        { field: "step_length_delta", desc: "Step-length comparison" },
        { field: "speed_delta", desc: "Walking-speed comparison" },
        { field: "recovery_trend", desc: "Trajectory across sessions" },
      ],
      longitudinal:
        "Recovery is presented as a trajectory from baseline (or first capture) through each follow-up, with unresolved indicators highlighted.",
      quality: [
        "Capture gating for visibility and complete gait cycles",
        "Comparability flags when capture conditions change between visits",
        "Confidence flags on posture-angle indicators",
      ],
      integration: [
        "RehabTrack for therapy-block tracking",
        "ProstheticFit for device-related comparisons",
        "PDF export for surgical follow-up records",
      ],
      limitations: [
        "Video-based proxies do not measure internal joint forces",
        "Loading indicators are movement-derived proxies, not force-plate measurements",
        "Outputs support recovery monitoring, not diagnosis of joint pathology",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["walkscan", "rehabtrack", "prostheticfit"],
    ctaLabel: "Explore OrthoMotion",
  },

  // ==========================================================================
  // 08 — SENIORCARE
  // ==========================================================================
  {
    slug: "seniorcare",
    valueProp:
      "Surface longitudinal mobility changes and decline indicators for review.",
    overview:
      "SeniorCare provides periodic movement assessments and longitudinal mobility summaries for older adults.",
    environments: ["Senior living", "Elderly care", "Home care", "Families"],
    glance: {
      input: "Periodic assessments",
      analysis: "Baseline comparison",
      output: "Mobility summary",
      user: "Care staff / family",
    },
    problem:
      "Gradual decline may be missed when assessment occurs only after a complaint, near-fall or visible functional deterioration.",
    solution:
      "Create an individual mobility baseline and compare subsequent assessments against that baseline.",
    whoFor: [
      "Senior-living facilities",
      "Elderly-care centres",
      "Home-care organisations",
      "Families / caregivers",
      "Preventive-health programs",
    ],
    receives: [
      "Monthly mobility score",
      "Change-from-baseline indicator",
      "Walking-speed trend",
      "Balance score",
      "Gait variability",
      "Mobility-decline alert",
      "Caregiver summary",
      "FallRisk integration",
    ],
    whyItMatters:
      "Routine, low-effort assessments make gradual change visible on a chart rather than only in hindsight, while a review is still useful.",
    workflow: [
      "Establish a mobility baseline on enrolment",
      "Run a short monthly walking assessment",
      "AI compares against the individual baseline",
      "Decline alerts surface to care staff",
      "Family receives a plain-language summary",
    ],
    deployment: [
      "Facility-wide monthly screening programs",
      "Resident-level longitudinal records",
      "Family caregiver summaries",
      "FallRisk escalation for residents whose profile shifts",
    ],
    metrics: [
      { value: "81 / 100", label: "Monthly mobility score" },
      { value: "−4 pts", label: "Change from baseline" },
      { value: "0.9 m/s", label: "Walking-speed trend" },
      { value: "Stable", label: "Balance score" },
    ],
    interpretation:
      "Scores are read against the resident's own baseline: a sustained downward trend is an early indicator to review mobility support, footwear, environment or therapy — not a diagnosis.",
    tech: {
      systemOverview:
        "SeniorCare operationalises periodic screening: scheduled short assessments per resident, baseline-relative scoring, decline detection and caregiver-friendly reporting.",
      inputs: [
        "Periodic walking assessments",
        "Individual mobility baseline",
        "Optional WatchCare wearable trends",
      ],
      pipeline: [
        "Monthly assessment",
        "Gait feature extraction",
        "Baseline comparison",
        "Decline detection",
        "Alerting",
        "Caregiver summary",
      ],
      features: [
        "Walking speed and cadence",
        "Balance indicators",
        "Gait variability",
        "Change-from-baseline descriptors",
      ],
      models: [
        "Individual-baseline modelling per resident",
        "Decline detection over monthly assessments",
        "Alert thresholds configurable per facility",
      ],
      outputSchema: [
        { field: "mobility_score", desc: "Monthly composite score (0–100)" },
        { field: "baseline_delta", desc: "Change from individual baseline" },
        { field: "speed_trend", desc: "Walking-speed trajectory" },
        { field: "balance_score", desc: "Balance indicator" },
        { field: "variability", desc: "Gait-variability descriptor" },
        { field: "decline_alert", desc: "Sustained-decline flag" },
      ],
      longitudinal:
        "Monthly assessments accumulate into a per-resident mobility record; alerts are driven by sustained baseline-relative change.",
      quality: [
        "Assessment gating for incomplete or occluded captures",
        "Alerts require sustained change across assessments",
        "Staff can annotate context (illness, footwear, environment)",
      ],
      integration: [
        "FallRisk for risk categorisation",
        "WatchCare for between-assessment trends",
        "Care-management export",
      ],
      limitations: [
        "Monthly cadence bounds how quickly change can be detected",
        "Scores reflect movement during the assessment, not full daily function",
        "Decline alerts are indicators for review, not clinical determinations",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["fallrisk", "watchcare", "remotecare"],
    ctaLabel: "Explore SeniorCare",
  },

  // ==========================================================================
  // 09 — PEDIATRICMOTION
  // ==========================================================================
  {
    slug: "pediatricmotion",
    valueProp: "Longitudinal movement screening for growing children.",
    overview:
      "PediatricMotion supports observation and tracking of children's gait development and movement changes — including toe-walking, gait asymmetry, developmental movement monitoring, orthopedic follow-up, cerebral-palsy rehabilitation monitoring and sports movement screening.",
    environments: ["Pediatric clinic", "Rehab", "Schools", "Sports screening"],
    glance: {
      input: "Child's walking video",
      analysis: "Screening AI",
      output: "Screening summary",
      user: "Clinician / parent",
    },
    problem:
      "Children's movement changes with growth, which makes it hard to tell developmental variation from a pattern that deserves follow-up — especially from occasional visual checks.",
    solution:
      "Short guided captures are converted into consistent screening indicators that can be compared across months of growth or treatment.",
    whoFor: [
      "Pediatric physiotherapists",
      "Pediatric orthopedic clinics",
      "Developmental follow-up programs",
      "Rehabilitation centres",
      "Schools and academies",
    ],
    receives: [
      "Toe-walking indicator",
      "Gait asymmetry",
      "Walking-pattern summary",
      "Left / right comparison",
      "Longitudinal movement change",
      "Parent / clinician report",
    ],
    whyItMatters:
      "Makes repeated movement observations easier to compare throughout growth or treatment — the same walk, measured the same way, every visit.",
    workflow: [
      "Record a short guided walk",
      "AI extracts screening indicators",
      "Session joins the child's longitudinal record",
      "Clinician reviews change over growth / treatment",
      "Parent receives a plain-language summary",
    ],
    deployment: [
      "Clinic capture or guided at-home capture",
      "Growth-aware longitudinal records",
      "Parent-friendly reports alongside clinical views",
      "School / academy screening programs",
    ],
    metrics: [
      { value: "Present", label: "Toe-walking indicator" },
      { value: "88%", label: "Step symmetry" },
      { value: "5", label: "Sessions on record" },
      { value: "↗", label: "Pattern-consistency trend" },
    ],
    interpretation:
      "Outputs are screening and monitoring support: they show whether a pattern like toe-walking or asymmetry is persisting, improving or resolving over time. They are not a developmental or medical diagnosis.",
    tech: {
      systemOverview:
        "PediatricMotion adapts the gait pipeline to children's movement: capture guidance for shorter attention spans, screening-oriented indicators and growth-aware longitudinal comparison.",
      inputs: [
        "Short guided walking video",
        "Repeated sessions across growth / treatment",
        "Session context (age, treatment stage)",
      ],
      pipeline: [
        "Guided capture",
        "Pose tracking",
        "Gait segmentation",
        "Screening-indicator extraction",
        "Longitudinal comparison",
        "Parent / clinician report",
      ],
      features: [
        "Toe-walking indicators (heel-contact proxies)",
        "Left / right asymmetry",
        "Walking-pattern descriptors",
        "Change across sessions",
      ],
      models: [
        "Pose tracking tuned for smaller body proportions",
        "Heel-contact and foot-pattern proxy extraction",
        "Growth-aware longitudinal comparison",
      ],
      outputSchema: [
        { field: "toe_walk_indicator", desc: "Toe-walking screening indicator" },
        { field: "asymmetry", desc: "Left/right gait asymmetry" },
        { field: "pattern_summary", desc: "Walking-pattern summary" },
        { field: "lr_comparison", desc: "Side-by-side comparison" },
        { field: "long_change", desc: "Longitudinal movement change" },
        { field: "report", desc: "Parent / clinician report" },
      ],
      longitudinal:
        "Sessions are compared with growth in mind: the record shows whether a screening indicator persists, improves or resolves across months.",
      quality: [
        "Capture gating tuned for short, variable child walks",
        "Repeat-capture prompts instead of low-confidence outputs",
        "Session-context annotation for fair comparison",
      ],
      integration: [
        "WalkScan-compatible capture",
        "RehabTrack for treatment blocks",
        "Report export for referral workflows",
      ],
      limitations: [
        "Presented as screening / monitoring support, not diagnosis",
        "Children's variable walking requires more captures for stable trends",
        "Indicators inform follow-up decisions made by clinicians",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["walkscan", "rehabtrack", "sportsmotion"],
    ctaLabel: "Explore PediatricMotion",
  },

  // ==========================================================================
  // 10 — PROSTHETICFIT
  // ==========================================================================
  {
    slug: "prostheticfit",
    valueProp: "Measure how an assistive device changes the walk.",
    overview:
      "ProstheticFit compares walking mechanics with different device configurations or across fitting and rehabilitation sessions.",
    environments: ["Prosthetics", "Orthotics", "Rehab", "Device research"],
    glance: {
      input: "Before / after walks",
      analysis: "Movement comparison",
      output: "Movement evidence",
      user: "Prosthetist",
    },
    problem:
      "The movement effect of a fitting change is often judged from a brief visual check, leaving symmetry and loading changes invisible during fitting decisions.",
    solution:
      "Walks captured before and after an adjustment are compared side by side, so the movement effect of each fitting change is measured rather than assumed.",
    whoFor: [
      "Prosthetic clinics",
      "Orthotic clinics",
      "Rehabilitation teams",
      "Assistive-device researchers",
    ],
    receives: [
      "Movement comparison per configuration",
      "Walking symmetry",
      "Loading-asymmetry proxy",
      "Step pattern",
      "Walking speed",
      "Mobility improvement trend",
    ],
    whyItMatters:
      "Makes the effect of fitting changes visible rather than relying only on subjective comfort and visual observation.",
    workflow: [
      "Capture a baseline walk",
      "Adjust the device",
      "Repeat the walk",
      "AI compares the two sessions",
      "Clinician reviews the measured change",
    ],
    deployment: [
      "In-clinic before / after capture during fitting sessions",
      "Configuration metadata attached to each session",
      "Longitudinal record across fitting and rehabilitation",
      "Research mode for device studies",
    ],
    metrics: [
      { value: "+7%", label: "Symmetry after adjustment" },
      { value: "−11%", label: "Loading asymmetry proxy" },
      { value: "+0.06 m/s", label: "Walking-speed change" },
      { value: "3", label: "Configurations compared" },
    ],
    interpretation:
      "Comparisons show how each configuration changed symmetry, loading proxies and speed for this person. They inform the fitting decision alongside comfort and clinical judgement.",
    tech: {
      systemOverview:
        "ProstheticFit is a paired-comparison pipeline: sessions are captured under labelled device configurations and compared per-metric, with a longitudinal view across the fitting journey.",
      inputs: [
        "Walking assessment",
        "Before / after fitting captures",
        "Device configuration metadata where available",
      ],
      pipeline: [
        "Baseline walk",
        "Device adjustment",
        "Repeat walk",
        "Paired comparison",
        "Fit evidence",
        "Clinician review",
      ],
      features: [
        "Walking symmetry per configuration",
        "Loading-asymmetry proxies",
        "Step-pattern descriptors",
        "Walking speed per configuration",
      ],
      models: [
        "Paired session comparison controlling for capture conditions",
        "Configuration-tagged longitudinal modelling",
        "Improvement-trend computation across fittings",
      ],
      outputSchema: [
        { field: "config_comparison", desc: "Per-metric before/after deltas" },
        { field: "symmetry", desc: "Walking symmetry per session" },
        { field: "loading_proxy", desc: "Loading-asymmetry proxy" },
        { field: "step_pattern", desc: "Step-pattern descriptors" },
        { field: "speed", desc: "Walking speed per session" },
        { field: "improvement_trend", desc: "Trajectory across fittings" },
      ],
      longitudinal:
        "The fitting journey is stored as a sequence of configuration-tagged sessions, so long-term improvement is visible beyond any single adjustment.",
      quality: [
        "Paired captures are checked for comparable conditions",
        "Comparisons flag when sessions are not directly comparable",
        "Confidence flags on loading proxies",
      ],
      integration: [
        "OrthoMotion for related musculoskeletal indicators",
        "RehabTrack during rehabilitation with the device",
        "Structured export for device research",
      ],
      limitations: [
        "Loading proxies are movement-derived, not direct force measurements",
        "Comfort and residual-limb health remain clinical inputs outside video data",
        "Comparisons describe movement change, not device safety or certification",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["orthomotion", "walkscan", "rehabtrack"],
    ctaLabel: "Explore ProstheticFit",
  },

  // ==========================================================================
  // 11 — REMOTECARE
  // ==========================================================================
  {
    slug: "remotecare",
    valueProp: "Walk at home. Let your care team review progress remotely.",
    overview:
      "RemoteCare enables guided movement assessments outside the clinic and delivers structured reports to the clinician.",
    environments: ["Telehealth", "Home care", "Physiotherapy", "Hospitals"],
    glance: {
      input: "Home walking video",
      analysis: "Gait AI + QC",
      output: "Remote report",
      user: "Care team",
    },
    problem:
      "Remote patients can be difficult to assess between appointments — decline or stalled recovery may go unnoticed until the next visit.",
    solution:
      "Patients record short guided walks at home; captures are quality-checked, analysed and delivered to the clinician as structured reports with change tracking.",
    whoFor: [
      "Telehealth providers",
      "Physiotherapy clinics",
      "Hospitals",
      "Home-care teams",
    ],
    receives: [
      "Remote gait report",
      "Mobility score",
      "Change since previous assessment",
      "Clinician dashboard",
      "Patient timeline",
      "Alert when movement changes beyond configured criteria",
    ],
    whyItMatters:
      "Extends objective movement assessment beyond the clinic — patients stay visible between appointments without extra visits.",
    workflow: [
      "Patient receives guided capture instructions",
      "Records a short walk at home",
      "Uploads the clip",
      "Quality check gates the capture",
      "Gait analysis runs",
      "Report lands on the clinician dashboard",
      "Care team decides on follow-up",
    ],
    deployment: [
      "Patient-side guided capture on any smartphone",
      "Clinician dashboard with per-patient timelines",
      "Configurable change-alert criteria",
      "Works as the remote arm of WalkScan / RehabTrack programs",
    ],
    metrics: [
      { value: "76 / 100", label: "Mobility score" },
      { value: "+3 pts", label: "Change since last assessment" },
      { value: "94%", label: "Captures passing QC" },
      { value: "14 days", label: "Assessment interval" },
    ],
    interpretation:
      "Remote reports are read like in-clinic WalkScan reports, with extra attention to the quality flags: the dashboard makes between-visit change visible so follow-ups can be scheduled when movement shifts.",
    tech: {
      systemOverview:
        "RemoteCare wraps the gait pipeline in a remote capture-and-review loop: guided patient capture, upload, automated quality control, analysis and clinician-facing reporting.",
      inputs: [
        "Guided home walking video",
        "Patient / session identifiers",
        "Previous remote assessments",
      ],
      pipeline: [
        "Guided capture",
        "Secure upload",
        "Quality check",
        "Gait analysis",
        "Clinician dashboard",
        "Follow-up decision",
      ],
      features: [
        "Standard WalkScan gait descriptors",
        "Change-since-last-assessment deltas",
        "Capture-quality descriptors per session",
      ],
      models: [
        "Automated capture QC (visibility, framing, walk completeness)",
        "Standard gait feature extraction",
        "Change detection across remote sessions",
        "Alert generation on configured criteria",
      ],
      outputSchema: [
        { field: "gait_report", desc: "Remote gait report" },
        { field: "mobility_score", desc: "Session score (0–100)" },
        { field: "delta_prev", desc: "Change since previous assessment" },
        { field: "qc_result", desc: "Capture-quality outcome" },
        { field: "timeline", desc: "Patient assessment timeline" },
        { field: "alert", desc: "Configured-criteria change alert" },
      ],
      longitudinal:
        "Each patient accumulates a remote-assessment timeline; alerts fire on movement change beyond the criteria the care team configures.",
      quality: [
        "Uploads that fail QC prompt a guided re-capture instead of producing weak numbers",
        "Home capture conditions are recorded with each session",
        "Alerts require change beyond configured thresholds",
      ],
      integration: [
        "Clinician dashboard",
        "WalkScan / RehabTrack program integration",
        "Structured export for telehealth platforms",
      ],
      limitations: [
        "Home capture varies more than clinic capture; QC gating rejects some sessions",
        "Reports support remote monitoring decisions, not diagnosis",
        "Not an emergency or real-time supervision channel",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["watchcare", "walkscan", "fallrisk"],
    ctaLabel: "Explore RemoteCare",
  },

  // ==========================================================================
  // 12 — CLINICALTRIALS
  // ==========================================================================
  {
    slug: "clinicaltrials",
    valueProp:
      "Structured, repeatable movement-analysis outputs for research, clinical-study and device-evaluation workflows.",
    overview:
      "ClinicalTrials provides structured gait and movement measurements that can be collected repeatedly across participants and study visits.",
    environments: ["CROs", "Academia", "Pharma", "Device studies"],
    glance: {
      input: "Protocol captures",
      analysis: "Gait-measure pipeline",
      output: "Study exports",
      user: "Research team",
    },
    problem:
      "Human-movement endpoints can be expensive, inconsistent and difficult to standardise across visits and sites.",
    solution:
      "Protocol-guided captures are processed through a consistent pipeline with quality control, producing participant-level metrics and cohort-level exports suitable for downstream analysis.",
    whoFor: [
      "Clinical research organisations",
      "Academic studies",
      "Pharma research",
      "Medical-device studies",
      "Rehabilitation studies",
      "Digital-biomarker research",
    ],
    receives: [
      "Study dashboard",
      "Gait measure export",
      "Cohort trend",
      "Participant longitudinal trajectory",
      "Quality-control flags",
      "Protocol-based reports",
      "Structured export for downstream analysis",
    ],
    whyItMatters:
      "Standardised capture and processing make movement endpoints repeatable across visits and sites — the consistency layer studies usually have to build themselves.",
    workflow: [
      "Define the capture protocol per study",
      "Sites capture protocol-guided walks per visit",
      "QC gates every capture",
      "Metrics accumulate per participant",
      "Cohort trends and exports are generated for analysis",
    ],
    deployment: [
      "Multi-site capture with a shared protocol",
      "Participant / visit identifier scheme per study",
      "Study dashboard with QC visibility",
      "Structured exports for statistical pipelines",
    ],
    metrics: [
      { value: "240", label: "Participants (example cohort)" },
      { value: "5", label: "Visits per participant" },
      { value: "96%", label: "Captures passing QC" },
      { value: "CSV / JSON", label: "Export formats" },
    ],
    interpretation:
      "Outputs are research endpoints — digital movement biomarker candidates collected under a consistent protocol. Their validity as surrogate endpoints is a question for each study's own analysis.",
    tech: {
      systemOverview:
        "ClinicalTrials industrialises the gait pipeline for studies: protocol-driven capture, per-capture QC, participant-level feature extraction, longitudinal aggregation, cohort analysis and structured export.",
      inputs: [
        "Protocol-guided walking videos",
        "Repeated study visits",
        "Wearable streams where included in protocol",
        "Participant / visit identifiers",
      ],
      pipeline: [
        "Capture protocol",
        "QC",
        "Feature extraction",
        "Participant-level metrics",
        "Longitudinal aggregation",
        "Cohort analysis",
        "Export",
      ],
      features: [
        "Standardised gait descriptor set per protocol",
        "Participant-level longitudinal trajectories",
        "Cohort-level distributions and trends",
      ],
      models: [
        "Protocol-consistent feature extraction",
        "Per-capture QC with study-visible flags",
        "Longitudinal aggregation per participant",
        "Cohort-level trend computation",
      ],
      outputSchema: [
        { field: "participant_metrics", desc: "Per-visit gait descriptors" },
        { field: "trajectory", desc: "Participant longitudinal trajectory" },
        { field: "cohort_trend", desc: "Cohort-level aggregation" },
        { field: "qc_flags", desc: "Per-capture quality-control flags" },
        { field: "protocol_report", desc: "Protocol-based reports" },
        { field: "export", desc: "Structured CSV / JSON export" },
      ],
      longitudinal:
        "Participant trajectories across visits are first-class outputs, with QC flags carried alongside every data point.",
      quality: [
        "Every capture passes protocol QC before entering the dataset",
        "QC flags are exported with the data, never silently dropped",
        "Site-level capture consistency is visible on the dashboard",
      ],
      integration: [
        "Structured export for statistical pipelines",
        "WatchCare wearable streams where a protocol includes them",
        "NeuroMotion protocols for movement-disorder studies",
      ],
      limitations: [
        "Outputs are digital movement biomarker candidates — validated surrogate endpoints require study-level evidence",
        "Cross-site consistency depends on protocol adherence",
        "GaitAI provides measurements and exports; study design and analysis remain with the research team",
      ],
    },
    privacy: SHARED_PRIVACY,
    related: ["walkscan", "watchcare", "neuromotion"],
    ctaLabel: "Discuss a ClinicalTrials deployment",
  },
];

export const productDetailBySlug = (slug: string) =>
  allProductDetails.find((d) => d.slug === slug);

/**
 * The one-liner for a product detail page: the record's own `valueProp`
 * where it differs from the canonical headline, otherwise the headline
 * itself. One string, one place to edit it.
 */
/**
 * The module's own overview sentence, for a flagship block on a vertical page.
 *
 * `productValueProp` is not the right field there: several modules have no
 * `valueProp`, so it falls back to the headline — which is already the
 * flagship block's own h2 and the product card's title, putting the same
 * sentence on the page three times. The overview says something new.
 */
export const productOverview = (slug: string): string =>
  productDetailBySlug(slug)?.overview ?? productById(slug)?.description ?? "";

export const productValueProp = (slug: string): string =>
  productDetailBySlug(slug)?.valueProp ?? productById(slug)?.headline ?? "";

// Combined lookup across both verticals. The secure file only imports the
// ProductDetail *type* from here, so this import is not a runtime cycle.
import { secureProductDetails } from "./product-details-secure";

export const allProductDetails: ProductDetail[] = [
  ...productDetails,
  ...secureProductDetails,
];
