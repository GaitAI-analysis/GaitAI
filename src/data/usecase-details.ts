// ============================================================================
// USE-CASE DETAIL CONTENT
// ----------------------------------------------------------------------------
// Structured content for /use-cases/[slug] pages, rendered by
// UseCaseDetailView. The operational problem statement is reused from
// industryUseCases (data/products.ts) via `caseId` — this file adds the
// deployment-depth layers on top.
//
// Wording policy: no invented customers, pilots, metrics or validation
// claims. Pages describe what a deployment is designed to do.
// ============================================================================

export interface UseCaseDetail {
  /** Route slug — /use-cases/[slug]/ */
  slug: string;
  /** industryUseCases id this deployment extends */
  caseId: string;
  family: "mobilitycare" | "securevision";
  valueProp: string;
  /** Deployment overview */
  overview: string;
  /** Why current workflows fall short */
  shortfall: string;
  /** How the recommended products work together */
  together: string;
  /** Example workflow */
  workflow: string[];
  /** Expected operational outcome */
  outcome: string;
  /** Signals / outputs the deployment produces */
  signals: string[];
  /** Deployment considerations */
  deployment: string[];
  privacy: string;
  /** Exactly three related use-case slugs */
  related: [string, string, string];
}

const CARE_PRIVACY =
  "Assessments are captured with informed consent, uploaded over encrypted channels and retained only as long as the care workflow requires, with role-based access and audit logging. GaitAI outputs are AI-generated movement metrics for assessment support and monitoring — they do not diagnose medical conditions and do not replace clinical judgement.";

const SECURE_PRIVACY_UC =
  "Deployments run on SecureVision's privacy-first architecture: movement-level processing, optional face blur, privacy-aware (aggregated) analytics, role-based access, audit logs and configurable retention. Movement events are decision support for trained operators; identity-requiring modules operate only under lawful, policy-governed authorization.";

export const useCaseDetails: UseCaseDetail[] = [
  // ==========================================================================
  // MOBILITYCARE DEPLOYMENTS
  // ==========================================================================
  {
    slug: "physiotherapy-clinics",
    caseId: "physio",
    family: "mobilitycare",
    valueProp: "Objective movement evidence for every therapy plan.",
    overview:
      "For physiotherapy environments, GaitAI can turn routine walking checks into structured assessments: WalkScan captures the baseline, RehabTrack tracks recovery across sessions, and SportsMotion covers athletic caseloads.",
    shortfall:
      "Visual observation and occasional stopwatch measurements are hard to compare across visits and therapists, so genuine progress — or quiet stagnation — is easy to miss.",
    together:
      "WalkScan is the capture and measurement layer; RehabTrack aligns those sessions into recovery trajectories; SportsMotion adds running mechanics for sport-focused patients. One capture workflow feeds all three.",
    workflow: [
      "Baseline WalkScan at intake",
      "Therapy sessions proceed as usual",
      "Short reassessment walk at review visits",
      "RehabTrack compares sessions and highlights unresolved asymmetry",
      "Report added to the patient record and shared with the patient",
    ],
    outcome:
      "Objective gait reports, rehabilitation progress and measurable movement comparison.",
    signals: [
      "Walking speed and cadence per session",
      "Symmetry change across therapy",
      "Recovery trend per patient",
      "Session-by-session progress reports",
      "Athletic movement profiles where relevant",
    ],
    deployment: [
      "Corridor or treatment-room capture with a phone or fixed camera",
      "No wearables required for the core workflow",
      "Reports export to existing documentation",
    ],
    privacy: CARE_PRIVACY,
    related: ["hospitals", "sports-academies", "prosthetic-orthotic-clinics"],
  },
  {
    slug: "hospitals",
    caseId: "hospitals",
    family: "mobilitycare",
    valueProp: "Mobility evidence from admission to discharge.",
    overview:
      "For hospital environments, GaitAI can combine FallRisk for ward mobility-risk screening, NeuroMotion for neurological gait monitoring and OrthoMotion for post-surgical recovery — one movement layer across departments.",
    shortfall:
      "Manual mobility assessment doesn't scale across wards, and subtle decline between scheduled checks can surface only as an incident.",
    together:
      "Short walking assessments feed all three products: FallRisk stratifies ward mobility risk, NeuroMotion tracks neuro-relevant indicators longitudinally, and OrthoMotion quantifies post-surgical gait recovery for discharge planning.",
    workflow: [
      "Admission mobility assessment establishes a baseline",
      "Ward reassessments run on a schedule or after events",
      "FallRisk categories prioritise mobility support",
      "Specialty teams review NeuroMotion / OrthoMotion trends",
      "Discharge planning uses the measured recovery record",
    ],
    outcome:
      "Mobility assessment, ward fall-risk support, post-surgical recovery and discharge-planning evidence.",
    signals: [
      "Ward-level mobility-risk categories",
      "Risk contributors per patient",
      "Neurological movement-pattern trends",
      "Post-surgical recovery trajectories",
      "Discharge-readiness movement evidence",
    ],
    deployment: [
      "Corridor capture points per ward",
      "Role-based dashboards per department",
      "Escalation criteria configured with clinical governance",
    ],
    privacy: CARE_PRIVACY,
    related: ["physiotherapy-clinics", "neurology-clinics", "elderly-care-centers"],
  },
  {
    slug: "sports-academies",
    caseId: "sports",
    family: "mobilitycare",
    valueProp: "Every athlete baselined, every deviation visible.",
    overview:
      "For sports-academy environments, GaitAI can baseline every athlete with SportsMotion, adds WatchCare wearable trends for training-load context, and runs RehabTrack through injury-rehabilitation blocks.",
    shortfall:
      "Return-to-play and workload decisions made from short visual assessments and athlete self-report miss the asymmetries and fatigue-related changes that movement data makes visible.",
    together:
      "SportsMotion measures running mechanics against each athlete's own baseline; WatchCare fills the days between sessions with wearable trends; RehabTrack turns injury recovery into a measured trajectory back to baseline.",
    workflow: [
      "Pre-season baseline for every athlete",
      "Periodic movement sessions during training",
      "Wearable trends monitor between sessions",
      "Injured athletes move into RehabTrack blocks",
      "Return-to-play summaries inform coach and physio decisions",
    ],
    outcome:
      "Performance movement analytics, injury-risk indicators and return-to-play progress.",
    signals: [
      "Running symmetry vs baseline",
      "Limb-imbalance indicators",
      "Fatigue-related movement change",
      "Recovery trajectory after injury",
      "Squad-level movement dashboards",
    ],
    deployment: [
      "Pitch-side or treadmill capture",
      "Squad dashboards for coaching staff",
      "Optional wearable integration per athlete",
    ],
    privacy: CARE_PRIVACY,
    related: ["fitness-wellness", "schools-academies", "physiotherapy-clinics"],
  },
  {
    slug: "elderly-care-centers",
    caseId: "elderly",
    family: "mobilitycare",
    valueProp:
      "See decline building — when earlier review may be useful.",
    overview:
      "For elderly-care environments, GaitAI can run SeniorCare monthly screening for every resident, FallRisk stratification on top, and WatchCare wearable trends for residents who need continuous visibility.",
    shortfall:
      "Assessments triggered by complaints or near-falls arrive after decline has already progressed; monthly observation without measurement misses slow change.",
    together:
      "SeniorCare provides the periodic assessment rhythm and caregiver summaries; FallRisk converts those assessments and their trends into risk categories with contributors; WatchCare adds day-to-day movement trends between screenings.",
    workflow: [
      "Baseline assessment at enrolment",
      "Short monthly walking assessment per resident",
      "FallRisk updates categories from trends",
      "Care staff act on decline alerts",
      "Families receive plain-language summaries",
    ],
    outcome:
      "Periodic mobility screening, fall-risk trend, caregiver alerts and mobility-decline reporting.",
    signals: [
      "Monthly mobility score per resident",
      "Change-from-baseline indicators",
      "Low / medium / high mobility-risk categories",
      "Decline alerts to care staff",
      "Caregiver and family summaries",
    ],
    deployment: [
      "Facility-wide monthly screening program",
      "Care-staff dashboard with escalation criteria",
      "Optional consumer-smartwatch integration",
    ],
    privacy: CARE_PRIVACY,
    related: ["home-care-telehealth", "insurance-wellness", "hospitals"],
  },
  {
    slug: "neurology-clinics",
    caseId: "neuro",
    family: "mobilitycare",
    valueProp: "A measured movement record beside every clinical assessment.",
    overview:
      "For neurology environments, GaitAI can pair NeuroMotion protocol assessments with WalkScan's standard gait measurements and WatchCare's between-visit trends for longitudinal movement monitoring.",
    shortfall:
      "Subtle changes in shuffling, turning and stability are difficult to quantify from observation, and episodic events rarely coincide with clinic visits.",
    together:
      "NeuroMotion runs walk-and-turn protocols and extracts neuro-relevant indicators; WalkScan supplies the general gait measurements; WatchCare captures day-to-day mobility so between-visit change is visible at the next appointment.",
    workflow: [
      "Guided walk-and-turn protocol at each visit",
      "Indicators join the patient's longitudinal record",
      "Wearable trends track mobility between visits",
      "Clinician reviews direction and rate of change",
      "Record complements the clinical assessment",
    ],
    outcome:
      "Longitudinal monitoring of neurological movement patterns and rehabilitation progress.",
    signals: [
      "Shuffling and hesitation indicators",
      "Turning-stability descriptors",
      "Walking-speed and cadence trajectories",
      "Between-visit mobility trends",
      "Session-comparable protocol records",
    ],
    deployment: [
      "Clinic-corridor protocol capture",
      "Longitudinal record per patient",
      "Research-mode export for studies",
    ],
    privacy: CARE_PRIVACY,
    related: ["hospitals", "research-clinical-trials", "physiotherapy-clinics"],
  },
  {
    slug: "home-care-telehealth",
    caseId: "homecare",
    family: "mobilitycare",
    valueProp: "Patients stay visible between visits.",
    overview:
      "For home-care environments, GaitAI can combine RemoteCare guided home assessments, WatchCare daily wearable trends and FallRisk stratification — giving care teams continuous visibility without extra visits.",
    shortfall:
      "Between appointments, remote patients are effectively invisible: decline, stalled recovery or rising fall risk surfaces only at the next scheduled contact.",
    together:
      "RemoteCare delivers structured gait reports from guided home captures; WatchCare fills the gaps with daily movement trends; FallRisk reads both streams and flags patients whose risk profile is shifting.",
    workflow: [
      "Patient receives guided capture instructions",
      "Short walks recorded at home on a schedule",
      "Quality-checked analyses reach the clinician dashboard",
      "Wearable trends stream between assessments",
      "Care team follows up when movement changes",
    ],
    outcome:
      "Remote assessment, daily mobility trend and caregiver/clinician visibility between visits.",
    signals: [
      "Remote gait reports",
      "Daily mobility scores",
      "Change-since-last-assessment deltas",
      "Risk-category shifts",
      "Configured change alerts",
    ],
    deployment: [
      "Patient-side capture on any smartphone",
      "Clinician dashboard with per-patient timelines",
      "Alert criteria configured per program",
    ],
    privacy: CARE_PRIVACY,
    related: ["elderly-care-centers", "insurance-wellness", "physiotherapy-clinics"],
  },
  {
    slug: "fitness-wellness",
    caseId: "fitness",
    family: "mobilitycare",
    valueProp: "Movement quality as a premium member benefit.",
    overview:
      "A fitness and wellness deployment uses SportsMotion and WalkScan to give members a measured movement baseline, posture and gait screening, and progress reports over a training program.",
    shortfall:
      "Gyms and wellness centres rarely measure movement quality — members get workout tracking but no objective view of how their gait, posture or symmetry is changing.",
    together:
      "WalkScan provides the accessible walking assessment every member can do; SportsMotion adds running mechanics for performance-oriented members. Both feed member-facing progress reports.",
    workflow: [
      "Movement baseline at membership onboarding",
      "Training program proceeds",
      "Periodic reassessment walks or runs",
      "Members see measured movement change",
      "Trainers adjust programs from the data",
    ],
    outcome:
      "Movement baseline, posture/gait screening and wellness reports.",
    signals: [
      "Member movement baselines",
      "Posture and gait screening summaries",
      "Symmetry and cadence trends",
      "Member-facing progress reports",
    ],
    deployment: [
      "Simple capture station or treadmill setup",
      "Member-facing reports as a premium tier",
      "Trainer dashboards across members",
    ],
    privacy: CARE_PRIVACY,
    related: ["sports-academies", "schools-academies", "insurance-wellness"],
  },
  {
    slug: "schools-academies",
    caseId: "schools",
    family: "mobilitycare",
    valueProp: "Developmental movement, observed consistently through growth.",
    overview:
      "For school environments, GaitAI can pair PediatricMotion developmental screening with SportsMotion for student athletes — structured movement observation across terms and seasons.",
    shortfall:
      "Children's developmental movement and sports injury-risk screening are rarely measured early; occasional visual checks can't separate growth variation from patterns worth following up.",
    together:
      "PediatricMotion tracks developmental indicators like toe-walking and asymmetry across growth; SportsMotion screens student athletes' running mechanics for imbalance that may warrant review.",
    workflow: [
      "Consent-based screening program per term",
      "Short guided walks captured at school or clinic",
      "Indicators tracked across terms",
      "Flagged patterns referred to clinicians",
      "Sports teams screen athletes each season",
    ],
    outcome:
      "Developmental movement observation, sports injury-risk screening support and posture awareness.",
    signals: [
      "Toe-walking and asymmetry indicators",
      "Term-over-term movement change",
      "Athlete symmetry screening",
      "Parent and clinician reports",
    ],
    deployment: [
      "Consent-first program design",
      "Guided capture suitable for children",
      "Referral workflow to clinical partners",
    ],
    privacy: CARE_PRIVACY,
    related: ["sports-academies", "fitness-wellness", "physiotherapy-clinics"],
  },
  {
    slug: "prosthetic-orthotic-clinics",
    caseId: "prosthetics",
    family: "mobilitycare",
    valueProp: "Every fitting change, measured in the walk.",
    overview:
      "A prosthetics and orthotics deployment uses ProstheticFit to compare device configurations and WalkScan for standard gait assessment across the fitting journey.",
    shortfall:
      "Device fit is judged largely by comfort report and visual check; symmetry and loading changes between configurations stay invisible to the fitting decision.",
    together:
      "WalkScan measures each walk; ProstheticFit pairs before/after captures around every adjustment so the movement effect of each configuration is explicit, and tracks improvement across the journey.",
    workflow: [
      "Baseline walk before adjustment",
      "Device configuration is changed",
      "Repeat walk under the new configuration",
      "Paired comparison reviewed with the patient",
      "Longitudinal record tracks the fitting journey",
    ],
    outcome:
      "Assistive-device comparison, walking symmetry and longitudinal mobility assessment.",
    signals: [
      "Per-configuration symmetry comparison",
      "Loading-asymmetry proxies",
      "Walking-speed change per adjustment",
      "Fitting-journey improvement trend",
    ],
    deployment: [
      "In-clinic before/after capture during fittings",
      "Configuration metadata per session",
      "Research mode for device studies",
    ],
    privacy: CARE_PRIVACY,
    related: ["physiotherapy-clinics", "hospitals", "research-clinical-trials"],
  },
  {
    slug: "insurance-wellness",
    caseId: "insurance",
    family: "mobilitycare",
    valueProp: "Preventive mobility intelligence across a covered population.",
    overview:
      "An insurance and wellness-program deployment uses WatchCare wearable trends, FallRisk stratification and SeniorCare screening to run preventive mobility programs across members or cohorts.",
    shortfall:
      "Annual screenings can't see mobility change as it happens; preventive programs need ongoing, low-friction signals rather than yearly snapshots.",
    together:
      "WatchCare provides continuous, consented wearable trends; SeniorCare adds structured periodic assessments for older cohorts; FallRisk turns both into risk categories that prioritise outreach.",
    workflow: [
      "Members enrol with consent",
      "Wearable trends accumulate passively",
      "Periodic assessments for higher-risk cohorts",
      "Risk shifts trigger wellness outreach",
      "Cohort-level trends inform program design",
    ],
    outcome:
      "Preventive mobility trend across individuals or cohorts.",
    signals: [
      "Daily mobility trends per member",
      "Cohort-level mobility distributions",
      "Risk-category movements",
      "Outreach prioritisation lists",
    ],
    deployment: [
      "Consent-first enrolment design",
      "Cohort dashboards without individual exposure beyond policy",
      "Configurable program criteria",
    ],
    privacy: CARE_PRIVACY,
    related: ["elderly-care-centers", "home-care-telehealth", "fitness-wellness"],
  },
  {
    slug: "research-clinical-trials",
    caseId: "trials",
    family: "mobilitycare",
    valueProp: "Repeatable movement endpoints across sites and visits.",
    overview:
      "For research environments, GaitAI can use ClinicalTrials for protocol-based measurement, WalkScan as the capture instrument and WatchCare for continuous digital-biomarker streams where the protocol includes wearables.",
    shortfall:
      "Human-movement endpoints are expensive and inconsistent to standardise across visits and sites — every study rebuilds its own capture, QC and export pipeline.",
    together:
      "WalkScan standardises the capture; ClinicalTrials wraps it in protocol QC, participant trajectories, cohort aggregation and structured export; WatchCare contributes wearable streams for protocols that include them.",
    workflow: [
      "Capture protocol defined per study",
      "Sites capture protocol-guided walks per visit",
      "Every capture passes QC before entering the dataset",
      "Participant trajectories accumulate across visits",
      "Cohort exports feed the study's statistical pipeline",
    ],
    outcome:
      "Digital gait/mobility endpoints, cohort analysis and exportable study data.",
    signals: [
      "Per-visit gait descriptors",
      "Participant longitudinal trajectories",
      "Cohort trends with QC flags",
      "Structured CSV/JSON exports",
    ],
    deployment: [
      "Multi-site capture under a shared protocol",
      "Study dashboard with QC visibility",
      "Export formats for downstream analysis",
    ],
    privacy: CARE_PRIVACY,
    related: ["hospitals", "neurology-clinics", "prosthetic-orthotic-clinics"],
  },

  // ==========================================================================
  // SECUREVISION DEPLOYMENTS
  // ==========================================================================
  {
    slug: "airports-metro-rail",
    caseId: "airports",
    family: "securevision",
    valueProp: "Flow, safety and investigation — without identity-first surveillance.",
    overview:
      "For transport-hub environments, GaitAI can combine CrowdSense passenger-flow analytics, SuspiciousMotion movement-event detection and — under authorization — ReID for cross-camera investigation support.",
    shortfall:
      "Manual monitoring can't track flow and movement events across hundreds of cameras, and post-incident review means scrubbing hours of footage by hand.",
    together:
      "CrowdSense keeps operators ahead of density and queue problems; SuspiciousMotion surfaces movement-defined events identity-free; ReID supports authorized investigations that need cross-camera continuity.",
    workflow: [
      "Zones and flows configured across the hub",
      "Live density and queue analytics reach the control room",
      "Movement events alert operators in the moment",
      "Incidents escalate through hub procedures",
      "Authorized investigations use indexed movement evidence",
    ],
    outcome:
      "Passenger flow, movement-event alerts and authorized cross-camera investigation support.",
    signals: [
      "Zone density and queue lengths",
      "Flow-direction trends",
      "Movement-event timeline",
      "Authorized cross-camera trails",
    ],
    deployment: [
      "Works with existing camera estates",
      "Control-room dashboard integration",
      "Investigation modules gated by authorization policy",
    ],
    privacy: SECURE_PRIVACY_UC,
    related: ["smart-cities", "large-events-stadiums", "malls-retail"],
  },
  {
    slug: "smart-cities",
    caseId: "smartcities",
    family: "securevision",
    valueProp: "Public-space intelligence that respects the public.",
    overview:
      "For smart-city environments, GaitAI can pair CrowdSense aggregate public-space analytics with ForensicSearch post-event investigation, governed end-to-end by PrivacyGuard.",
    shortfall:
      "Cities need crowd-risk awareness and workable post-event investigation, but public deployments cannot be built on unrestricted identifiable video.",
    together:
      "CrowdSense produces privacy-aware (aggregated) flow and density intelligence for city operations; ForensicSearch narrows authorized post-event review; PrivacyGuard enforces blur, skeleton-mode, access control and retention across everything.",
    workflow: [
      "Public zones configured with civic oversight",
      "Aggregate flow and density feed city operations",
      "Crowd-risk alerts support event and transit planning",
      "Post-event investigations run case-scoped and audited",
      "Privacy reports support governance review",
    ],
    outcome:
      "Crowd-risk insight, privacy-aware (aggregated) spatial analytics and audited post-event investigation.",
    signals: [
      "Privacy-aware (aggregated) crowd heatmaps",
      "Zone density trends",
      "Crowd-risk alerts",
      "Audited case-scoped investigation results",
    ],
    deployment: [
      "Civic governance and oversight integration",
      "Aggregate-only analytics by default",
      "Full audit trails for accountability",
    ],
    privacy: SECURE_PRIVACY_UC,
    related: ["airports-metro-rail", "large-events-stadiums", "corporate-university-campuses"],
  },
  {
    slug: "corporate-university-campuses",
    caseId: "campuses",
    family: "securevision",
    valueProp: "Quiet safety across every building.",
    overview:
      "For campus environments, GaitAI can layer CampusShield movement-event monitoring, AccessMotion entry-consistency signals at sensitive doors, and SuspiciousMotion anomaly detection across shared spaces.",
    shortfall:
      "Campuses span many buildings and after-hours situations that security staff cannot continuously supervise, and identity-first monitoring is unacceptable in work and study spaces.",
    together:
      "CampusShield provides the campus-wide event timeline; SuspiciousMotion supplies the underlying anomaly detection; AccessMotion adds a passive second factor and tailgating indicators at controlled entries.",
    workflow: [
      "Buildings, zones and schedules configured",
      "Movement events surface on the campus timeline",
      "After-hours and fall events alert the security desk",
      "Controlled doors add consistency signals",
      "Incidents escalate through campus procedures",
    ],
    outcome:
      "Workplace/campus safety, after-hours movement alerts, tailgating indicators and access consistency.",
    signals: [
      "Campus event timeline",
      "After-hours movement alerts",
      "Fall-detection events",
      "Entry-consistency and tailgating indicators",
    ],
    deployment: [
      "Building-by-building rollout",
      "Consent-based enrolment for access signals",
      "Privacy-first processing across shared spaces",
    ],
    privacy: SECURE_PRIVACY_UC,
    related: ["factories-warehouses", "smart-cities", "malls-retail"],
  },
  {
    slug: "factories-warehouses",
    caseId: "factories",
    family: "securevision",
    valueProp: "Worker safety events, seen as they happen.",
    overview:
      "For industrial environments, GaitAI can run IndustrialSafety worker-safety monitoring — falls, slips, restricted zones, evacuation flow — with SuspiciousMotion covering site-security movement events.",
    shortfall:
      "Falls and unsafe-zone entries in large facilities often go unnoticed until harm is done; safety reviews happen after incidents instead of during them.",
    together:
      "IndustrialSafety flags candidate safety events and summarises evacuation flow; SuspiciousMotion covers the security side — perimeter, after-hours and restricted-area movement — on the same camera estate.",
    workflow: [
      "Zones mapped to the site safety plan",
      "Worker movement monitored across shifts",
      "Fall/slip and zone events alert the safety team",
      "Evacuation mode summarises drills and emergencies",
      "EHS reviews zone-level trends for prevention",
    ],
    outcome:
      "Worker fall/slip events, restricted zones, evacuation status and movement-safety analytics.",
    signals: [
      "Fall / slip alerts",
      "Restricted-zone events",
      "Evacuation-flow summaries",
      "Zone-level safety trends",
    ],
    deployment: [
      "Configuration mapped to the existing safety plan",
      "Alert routing to EHS and control rooms",
      "Worker-privacy controls throughout",
    ],
    privacy: SECURE_PRIVACY_UC,
    related: ["corporate-university-campuses", "airports-metro-rail", "smart-cities"],
  },
  {
    slug: "malls-retail",
    caseId: "retail",
    family: "securevision",
    valueProp: "One movement layer for queues, safety and security.",
    overview:
      "For retail environments, GaitAI can combine RetailGuard floor analytics, CrowdSense flow intelligence for common areas, and SuspiciousMotion movement-event detection — on the cameras already installed.",
    shortfall:
      "Queue management, staff safety, emergency flow and unusual-movement monitoring are usually four separate problems handled with partial visibility.",
    together:
      "RetailGuard handles store-level queues, staff-safety events and heatmaps; CrowdSense covers mall-level flow and density; SuspiciousMotion surfaces movement-defined security events across both.",
    workflow: [
      "Store and common-area zones configured",
      "Queue and density insights reach operations",
      "Movement events reach security and duty managers",
      "Emergency mode summarises evacuation flow",
      "Heatmaps inform layout and staffing",
    ],
    outcome:
      "Queue/flow analytics, unusual-movement events, emergency flow and staff safety.",
    signals: [
      "Queue lengths and trends",
      "Floor and common-area heatmaps",
      "Movement-event alerts",
      "Emergency-flow summaries",
    ],
    deployment: [
      "Works with existing store cameras",
      "Store- and chain-level dashboards",
      "Privacy-first processing by default",
    ],
    privacy: SECURE_PRIVACY_UC,
    related: ["airports-metro-rail", "large-events-stadiums", "corporate-university-campuses"],
  },
  {
    slug: "large-events-stadiums",
    caseId: "events",
    family: "securevision",
    valueProp: "Crowd risk visible while there's still time to act.",
    overview:
      "For large-event environments, GaitAI can pair EventShield's capacity-aware crowd-risk indicators with CrowdSense's underlying flow analytics — from gates opening to the final exit surge.",
    shortfall:
      "High-density events change by the minute; without live density and flow indicators, operations teams learn about bottlenecks when they've already formed.",
    together:
      "CrowdSense provides the aggregate movement analytics; EventShield specialises them for events — gate flow against plan, density against capacity, abnormal crowd-motion indicators and evacuation summaries.",
    workflow: [
      "Zones, gates and capacities configured pre-event",
      "Live flow and density track against the event plan",
      "Bottleneck and abnormal crowd-motion indicators reach operations",
      "Teams adjust gates, routes and announcements",
      "Post-event reports feed the next plan",
    ],
    outcome:
      "Density, entry/exit flow, bottlenecks and high-density crowd movement alerts.",
    signals: [
      "Per-gate entry/exit flow",
      "Zone density vs capacity",
      "Bottleneck-formation indicators",
      "Evacuation movement summaries",
    ],
    deployment: [
      "Pre-event configuration and rehearsal",
      "Event-day control-room dashboard",
      "Aggregate-only crowd analytics",
    ],
    privacy: SECURE_PRIVACY_UC,
    related: ["smart-cities", "airports-metro-rail", "malls-retail"],
  },
];

export const getUseCaseDetail = (slug: string) =>
  useCaseDetails.find((d) => d.slug === slug);
