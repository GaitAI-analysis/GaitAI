// ============================================================================
// TRUST & BUYER READINESS
// ----------------------------------------------------------------------------
// Two canonical, reusable sets:
//
//   privacyControls  — what the architecture supports, per control area
//   deploymentSteps  — how a GaitAI engagement actually runs
//   deploymentFacts  — the procurement questions buyers ask first
//
// SOURCING RULE
// Every statement below restates something already documented in this
// repository — the PrivacyGuard product record and its detail page, the
// shared privacy notes in product-details*.ts and usecase-details.ts, the
// privacy layer in `aiPipeline`, the per-product `deployment` / `tech.inputs`
// / `tech.integration` arrays, and `systemFactsFor()` in the GaitScape graph.
// `source` names that origin so a reviewer can check it.
//
// LANGUAGE RULE
// Capability language only — "supports", "designed for", "configurable",
// "available". No certification, no compliance status, no guarantee. What is
// deliberately NOT claimed is listed in `notClaimed` and rendered on the page,
// because saying so plainly is more useful to a buyer than staying quiet.
// ============================================================================

export interface PrivacyControl {
  /** Control area a security reviewer will look for. */
  topic: string;
  /** What the architecture supports — capability language only. */
  support: string;
  /** Where this is documented in the product. */
  source: string;
}

export const privacyControls: PrivacyControl[] = [
  {
    topic: "Processing location",
    support:
      "Designed for edge and on-device inference as well as server-side processing; the optimised edge pipeline is the subject of the granted patent. Which mode a site runs is a deployment decision.",
    source: "Patent 402202 · Edge inference capability",
  },
  {
    topic: "Non-identifying mode",
    support:
      "Skeleton-only processing replaces identifiable video as the analytic substrate, so movement analytics can run without identity. SecureVision leads with identity-free capabilities by default.",
    source: "PrivacyGuard · pipeline stages",
  },
  {
    topic: "Face blur",
    support:
      "Optional face blur is applied as a pipeline transformation stage — before analytics, not after.",
    source: "PrivacyGuard · processing pipeline",
  },
  {
    topic: "Raw video handling",
    support:
      "Raw streams enter the pipeline and are transformed into movement features; analytics operate on those features rather than on raw footage.",
    source: "PrivacyGuard · privacy stack",
  },
  {
    topic: "Retention controls",
    support:
      "Retention is configurable per data class, with retention schedules set per site. Clinical captures are retained only as long as the care workflow requires.",
    source: "PrivacyGuard · deployment · shared clinical privacy note",
  },
  {
    topic: "Role-based access",
    support:
      "An authorization layer mediates dashboard views, so roles see only permitted data. Policy is configured per site and per role.",
    source: "PrivacyGuard · access model",
  },
  {
    topic: "Audit logs",
    support:
      "Access and policy-change events are logged, and audit logs can be exported for an organisation's own compliance review.",
    source: "PrivacyGuard · audit and policy logs",
  },
  {
    topic: "Consent",
    support:
      "Clinical assessments are captured with informed consent. Policy and consent records are held alongside the audit log.",
    source: "Shared clinical privacy note · PrivacyGuard output schema",
  },
  {
    topic: "Data in transit",
    support:
      "Captures are uploaded over encrypted channels.",
    source: "Shared clinical privacy note",
  },
  {
    topic: "Biometric and identity processing",
    support:
      "Identity-bearing modules (ReID, AccessMotion, Watchlist) run behind stricter policy gates and deploy only where there is lawful authority, consent and a full audit trail. Where non-identifying movement intelligence is sufficient, that is the default.",
    source: "Responsible-deployment policy · Watchlist product record",
  },
  {
    topic: "Training data",
    support:
      "Privacy-preserving handling of gait datasets inside deep-learning pipelines is a published research area (IET Biometrics, 2022).",
    source: "Publication: gait dataset privacy protection",
  },
  {
    topic: "Scope of the controls",
    support:
      "These controls govern the GaitAI pipeline. Lawful basis, consent management and decisions about deployment remain with the deploying organisation, and privacy-aware architecture is not a guarantee of anonymity.",
    source: "PrivacyGuard · documented limitations",
  },
];

/**
 * Stated explicitly on the security page. Nothing in this repository
 * establishes any of these, so the site must not imply them.
 */
export const notClaimed: string[] = [
  "SOC 2, ISO 27001 or any other security certification",
  "HIPAA, GDPR or DPDP Act compliance certification",
  "A specific guaranteed retention or deletion window",
  "Guaranteed encryption of data at rest",
  "Clinical approval, regulatory clearance or medical-device status",
  "Measured accuracy, latency or performance figures",
];

// ----------------------------------------------------------------------------
// DEPLOY GAITAI
// ----------------------------------------------------------------------------

export interface DeploymentStep {
  title: string;
  desc: string;
}

export const deploymentSteps: DeploymentStep[] = [
  {
    title: "Define the environment",
    desc: "Agree the setting and the question it has to answer — a clinic corridor, a ward, an academy, a concourse, a plant floor — and which outcome matters there.",
  },
  {
    title: "Connect movement input",
    desc: "Point GaitAI at what already exists: a phone or clinic camera, existing CCTV or uploaded footage, or wearable and smartwatch signals.",
  },
  {
    title: "Configure intelligence modules",
    desc: "Select the modules the environment needs. Products share one movement engine, so a single capture workflow can feed several of them.",
  },
  {
    title: "Validate with the team",
    desc: "Clinicians or operators review real outputs against their own judgement, and zones, thresholds and report formats are tuned to the site.",
  },
  {
    title: "Pilot and measure outcomes",
    desc: "Run the workflow in place, review what the movement record shows, and decide together what a wider rollout would need.",
  },
];

/** Typical pilot length, as already stated on the MobilityCare page. */
export const PILOT_DURATION = "4–6 weeks";

export interface DeploymentFact {
  question: string;
  answer: string;
}

export const deploymentFacts: DeploymentFact[] = [
  {
    question: "What input does GaitAI need?",
    answer:
      "A short walking video for clinical assessment, camera or CCTV feeds for SecureVision, and smartwatch or mobile sensor signals for continuous monitoring. No markers or specialist capture rig is required for a basic assessment.",
  },
  {
    question: "Can we use our existing video or CCTV?",
    answer:
      "Yes — SecureVision modules are built around existing camera feeds, and ForensicSearch works on uploaded footage after an event. Camera coverage and lighting determine tracking quality.",
  },
  {
    question: "Is wearable and mobile input supported?",
    answer:
      "WatchCare fuses smartwatch and mobile IMU signals with vision-derived features for daily mobility monitoring; RemoteCare uses guided walking video captured at home.",
  },
  {
    question: "Where does processing run?",
    answer:
      "The architecture is designed for edge and on-device inference alongside server-side processing. The hosting model for a given site is agreed during deployment.",
  },
  {
    question: "What comes out of it?",
    answer:
      "PDF reports and mobility scores for clinical workflows, structured CSV / JSON exports for downstream systems and research pipelines, and operator dashboards with alert routing for safety environments.",
  },
  {
    question: "How does it integrate?",
    answer:
      "Reports export into existing documentation workflows; SecureVision integrates with VMS for clip review and routes alerts into existing operator and EHS channels; audit logs export to an organisation's own compliance tooling.",
  },
  {
    question: "Who is in the loop?",
    answer:
      "A clinician, therapist or caregiver reviews clinical outputs; a trained operator reviews safety events. Every output is decision support — it does not diagnose, and it does not act on its own.",
  },
  {
    question: "How long is a pilot?",
    answer: `Typically ${PILOT_DURATION}, scoped around one environment and a small set of modules.`,
  },
];
