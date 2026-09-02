import type { ProductDetail } from "./product-details";
import { RESPONSIBLE_USE_SECURE } from "./responsible-use";

// ============================================================================
// SECUREVISION PRODUCT DETAIL CONTENT
// ----------------------------------------------------------------------------
// Structured content for the /securevision/[slug] detail pages, rendered by
// the same ProductDetailView template as MobilityCare.
//
// Wording policy: privacy-aware / movement-first language. No surveillance of
// the general public as a target use, no infallible-identification claims, no
// certifications, no accuracy figures. Watchlist and ReID carry explicit
// responsible-deployment notices.
// ============================================================================

/** Canonical responsible-use statement — see src/data/responsible-use.ts. */
const SECURE_PRIVACY = RESPONSIBLE_USE_SECURE;

export const secureProductDetails: ProductDetail[] = [
  // ==========================================================================
  // 01 — SUSPICIOUSMOTION
  // ==========================================================================
  {
    slug: "suspiciousmotion",
    overview:
      "SuspiciousMotion surfaces candidate movement events — loitering, running, restricted-zone entry and tailgating-like patterns — from camera streams for operator review, using movement-first processing that does not require identity recognition.",
    environments: ["Campus", "Transport hub", "Enterprise", "Public space"],
    glance: {
      input: "Camera stream",
      analysis: "Behaviour analysis",
      output: "Event alerts",
      user: "Security operator",
    },
    problem:
      "Security teams cannot manually watch every camera continuously, and many safety events are defined by movement rather than identity.",
    solution:
      "Person and pose tracking converts streams into movement trajectories; temporal behaviour analysis flags patterns that deviate from configured norms and surfaces them as timeline events with alerts.",
    whoFor: [
      "Campuses and universities",
      "Offices and enterprise sites",
      "Malls and retail complexes",
      "Hospitals",
      "Transport hubs",
      "Factory security teams",
    ],
    receives: [
      "Loitering alert",
      "Running alert",
      "Restricted-zone event",
      "Tailgating indicator",
      "Perimeter event",
      "Event timeline",
    ],
    whyItMatters:
      "Movement-defined events surface for operator review instead of being found hours later in recorded footage — and initial processing works without identifying anyone.",
    workflow: [
      "Cameras stream into the movement pipeline",
      "People are tracked as non-identifying trajectories",
      "Behaviour analysis compares movement against configured rules and norms",
      "Anomalous events post to the operator timeline",
      "Operator reviews and responds",
    ],
    deployment: [
      "Works with existing fixed cameras",
      "Zone and rule configuration per site",
      "Operator timeline and alert routing",
      "PrivacyGuard controls apply platform-wide",
    ],
    metrics: [
      { value: "Movement-first", label: "Detection basis" },
      { value: "5", label: "Event types (example config)" },
      { value: "Per-zone", label: "Rule configuration" },
      { value: "Timeline", label: "Evidence format" },
    ],
    interpretation:
      "Alerts are indicators for a trained operator to review — an anomaly is a deviation from configured movement norms, not an accusation. Escalation remains a human decision.",
    tech: {
      systemOverview:
        "A streaming pipeline: person detection and pose tracking produce trajectories; trajectory and temporal features feed anomaly rules and models; events are ranked and posted to an operator timeline with the triggering clip reference.",
      inputs: [
        "Fixed camera streams (RTSP/ONVIF-class sources)",
        "Zone and rule configuration",
        "Site calibration metadata",
      ],
      pipeline: [
        "Camera stream",
        "Person / pose tracking",
        "Trajectory features",
        "Temporal behaviour analysis",
        "Anomaly rules / model",
        "Event timeline + alert",
      ],
      features: [
        "Dwell time and loitering descriptors",
        "Speed and running indicators",
        "Zone entry / exit events",
        "Entry-pairing (tailgating-like) indicators",
        "Perimeter-crossing events",
      ],
      models: [
        "Multi-person detection and tracking",
        "Trajectory feature extraction",
        "Rule-assisted anomaly scoring designed to stay explainable",
      ],
      outputSchema: [
        { field: "event_type", desc: "loitering | running | zone | tailgating | perimeter" },
        { field: "zone_id", desc: "Configured zone reference" },
        { field: "track_ref", desc: "Anonymous trajectory reference" },
        { field: "severity", desc: "Configured severity level" },
        { field: "timeline_entry", desc: "Event with clip reference" },
      ],
      longitudinal:
        "Event history per zone supports reviewing recurring hotspots and tuning rules over time.",
      quality: [
        "Per-camera health and coverage checks",
        "Confidence flags on low-visibility tracks",
        "Rule tuning per zone to manage false positives",
      ],
      integration: [
        "Operator dashboard and alert routing",
        "VMS integration for clip review",
        "Feeds ForensicSearch event indexing",
      ],
      limitations: [
        "Detects movement patterns, not intent — operator review is required",
        "Coverage and lighting constrain tracking quality",
        "Initial detection is identity-free by design",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["campusshield", "crowdsense", "forensicsearch"],
    ctaLabel: "Explore SuspiciousMotion",
  },

  // ==========================================================================
  // 02 — CROWDSENSE
  // ==========================================================================
  {
    slug: "crowdsense",
    valueProp: "See crowd flow, bottlenecks and movement risk live.",
    overview:
      "CrowdSense converts movement trajectories into aggregate flow, density, queue and bottleneck intelligence for operators of busy public and commercial spaces.",
    environments: ["Smart city", "Stadium", "Airport", "Metro", "Mall"],
    glance: {
      input: "Camera streams",
      analysis: "Flow analytics",
      output: "Density & flow ops view",
      user: "Operations team",
    },
    problem:
      "Operators need to understand how crowds are moving before density or flow problems become safety incidents.",
    solution:
      "Aggregate — never individual-focused — analytics turn trajectories into heatmaps, density scores, queue lengths, flow directions and bottleneck alerts on a continuously updating operations dashboard.",
    whoFor: [
      "Smart-city control rooms",
      "Stadiums and event venues",
      "Airports and metro stations",
      "Malls and large retail",
      "Universities",
    ],
    receives: [
      "Crowd heatmap",
      "Density score",
      "Queue length",
      "Flow direction",
      "Bottleneck alert",
      "Evacuation movement summary",
    ],
    whyItMatters:
      "Crowd problems build over minutes; an operator who can see density and flow trending toward risk can intervene before a bottleneck becomes an incident.",
    workflow: [
      "Cameras cover key zones and corridors",
      "Trajectories aggregate into flow and density measures",
      "Dashboard shows zone-level state and trends",
      "Threshold alerts flag emerging bottlenecks",
      "Operations team redirects flow or opens capacity",
    ],
    deployment: [
      "Zone-level configuration per venue",
      "Live operations dashboard",
      "Aggregate-only analytics by default",
      "EventShield extends this for high-density events",
    ],
    metrics: [
      { value: "Aggregate", label: "Analytics level" },
      { value: "Per-zone", label: "Density scoring" },
      { value: "Live", label: "Ops dashboard" },
      { value: "Heatmap", label: "Spatial view" },
    ],
    interpretation:
      "Outputs describe crowd state — where density is building, where flow is stalling — so operational decisions (opening gates, redirecting queues) are grounded in current movement rather than guesswork.",
    tech: {
      systemOverview:
        "Trajectory streams are spatially binned and temporally aggregated into zone-level flow fields, density estimates and queue descriptors; thresholds and trend detection drive operational alerts.",
      inputs: [
        "Fixed camera streams over configured zones",
        "Zone geometry and capacity configuration",
        "Event-schedule context where relevant",
      ],
      pipeline: [
        "Camera streams",
        "Trajectory extraction",
        "Spatial aggregation",
        "Density / flow / queue analytics",
        "Threshold + trend alerts",
        "Operations dashboard",
      ],
      features: [
        "Zone density estimates",
        "Directional flow fields",
        "Queue-length descriptors",
        "Bottleneck formation indicators",
        "Evacuation-flow summaries",
      ],
      models: [
        "Multi-camera trajectory aggregation",
        "Density estimation over configured zones",
        "Flow-trend and bottleneck detection",
      ],
      outputSchema: [
        { field: "zone_density", desc: "Per-zone density score" },
        { field: "flow_field", desc: "Directional flow summary" },
        { field: "queue_length", desc: "Queue descriptors per line" },
        { field: "bottleneck_alert", desc: "Emerging-bottleneck flag" },
        { field: "heatmap", desc: "Privacy-aware (aggregated) spatial heatmap" },
      ],
      longitudinal:
        "Historical flow patterns per zone support planning — recurring bottlenecks, peak-hour profiles and layout decisions.",
      quality: [
        "Camera-coverage validation per zone",
        "Density confidence flags under occlusion",
        "Aggregation windows tuned per venue",
      ],
      integration: [
        "Control-room dashboards",
        "Alert routing to operations channels",
        "EventShield and RetailGuard build on the same analytics",
      ],
      limitations: [
        "Aggregate analytics — not designed to follow individuals",
        "Estimates degrade with poor coverage or extreme occlusion",
        "Operational response remains with the venue team",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["eventshield", "retailguard", "suspiciousmotion"],
    ctaLabel: "Explore CrowdSense",
  },

  // ==========================================================================
  // 03 — INDUSTRIALSAFETY
  // ==========================================================================
  {
    slug: "industrialsafety",
    valueProp: "Worker safety — measured, monitored, alerted.",
    overview:
      "IndustrialSafety applies movement analysis to worker-safety events and operational zones — falls, slips, restricted-zone entry, fatigue-like movement and evacuation status across industrial facilities.",
    environments: ["Factory", "Warehouse", "Construction", "Energy"],
    glance: {
      input: "Site cameras",
      analysis: "Safety-event AI",
      output: "Safety alerts",
      user: "EHS / safety team",
    },
    problem:
      "Falls, slips, unsafe zones and emergency movement events can go unnoticed in large industrial facilities.",
    solution:
      "Movement analysis over site cameras flags fall/slip-like events, restricted-zone entries and unusual movement, and summarises evacuation flow during emergencies.",
    whoFor: [
      "Factories",
      "Warehouses",
      "Construction sites",
      "Power and energy plants",
      "Mining operations",
      "Logistics hubs",
    ],
    receives: [
      "Fall / slip alert",
      "Restricted-zone alert",
      "Worker-safety dashboard",
      "Emergency status",
      "Fatigue-like movement indicator",
      "Evacuation flow",
    ],
    whyItMatters:
      "A worker down in a low-traffic aisle or an entry into an unsafe zone becomes an alert in the moment — not a finding in the next shift's review.",
    workflow: [
      "Site cameras cover operational and restricted zones",
      "Movement pipeline tracks worker motion",
      "Safety events are detected and classified",
      "Alerts route to the safety team",
      "Evacuation mode summarises site-wide flow during emergencies",
    ],
    deployment: [
      "Zone configuration mapped to the site's safety plan",
      "Alert routing to EHS and control-room channels",
      "Evacuation-mode summaries for drills and incidents",
      "PrivacyGuard controls for worker privacy",
    ],
    metrics: [
      { value: "Per-zone", label: "Safety rules" },
      { value: "Continuous", label: "Intended monitoring mode" },
      { value: "Drill-ready", label: "Evacuation summaries" },
      { value: "Dashboard", label: "EHS reporting" },
    ],
    interpretation:
      "Alerts are prompts for a safety response — a fall-like event needs a human check, a restricted-zone entry needs follow-up. The dashboard also gives EHS teams recurring-risk visibility by zone.",
    tech: {
      systemOverview:
        "A safety-event pipeline: worker movement is tracked per zone; pose-dynamics and trajectory features feed fall/slip and zone-event detectors; events route to alerts and an EHS dashboard, with an evacuation-flow mode for emergencies.",
      inputs: [
        "Site camera streams",
        "Zone and shift configuration",
        "Site safety-plan geometry",
      ],
      pipeline: [
        "Site cameras",
        "Worker movement tracking",
        "Pose-dynamics features",
        "Safety-event detection",
        "Alert + dashboard",
        "Evacuation summaries",
      ],
      features: [
        "Fall / slip-like pose dynamics",
        "Restricted-zone entry events",
        "Fatigue-like movement descriptors",
        "Evacuation-flow aggregates",
      ],
      models: [
        "Person tracking robust to PPE and industrial clothing",
        "Fall / slip event detection over pose dynamics",
        "Zone-rule engine mapped to the safety plan",
      ],
      outputSchema: [
        { field: "safety_event", desc: "fall | slip | zone | fatigue-like" },
        { field: "zone_id", desc: "Site zone reference" },
        { field: "alert", desc: "Routed alert with clip reference" },
        { field: "ehs_summary", desc: "Dashboard aggregates by zone/shift" },
        { field: "evac_status", desc: "Evacuation-flow summary" },
      ],
      longitudinal:
        "Zone-level event history highlights recurring risk areas for preventive action.",
      quality: [
        "Per-camera coverage checks against the safety plan",
        "Event confidence flags for operator triage",
        "Drill-mode validation of evacuation summaries",
      ],
      integration: [
        "EHS dashboards and alerting channels",
        "VMS clip review",
        "SuspiciousMotion shares the same tracking layer",
      ],
      limitations: [
        "Detects movement events, not physiological state",
        "Camera coverage defines the monitored area",
        "Alerts support, not replace, site safety procedures",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["suspiciousmotion", "privacyguard", "crowdsense"],
    ctaLabel: "Explore IndustrialSafety",
  },

  // ==========================================================================
  // 04 — PRIVACYGUARD
  // ==========================================================================
  {
    slug: "privacyguard",
    overview:
      "PrivacyGuard is the architectural privacy-control layer for SecureVision, designed to support skeleton-only analytics, face blur, privacy-aware aggregated heatmaps, role-based access, audit logs, retention controls and consent/policy logging. What a given site enables is a deployment decision.",
    environments: ["All SecureVision sites", "Public sector", "Enterprise"],
    glance: {
      input: "Raw streams",
      analysis: "Privacy controls",
      output: "Governed analytics",
      user: "Compliance + operators",
    },
    problem:
      "Useful spatial intelligence should not require unrestricted retention of identifiable video.",
    solution:
      "PrivacyGuard enforces movement-first processing: optional face blur and skeleton extraction happen before analytics, access is role-based and audited, and retention is configurable per policy.",
    whoFor: [
      "Every SecureVision customer",
      "Public-sector deployments",
      "Privacy-sensitive enterprises",
      "Compliance and legal teams",
    ],
    receives: [
      "Skeleton-only analytics mode",
      "Face blur",
      "Privacy-aware aggregated heatmaps",
      "Role-based access",
      "Audit logs",
      "Retention controls",
      "Consent / policy logs",
    ],
    whyItMatters:
      "Privacy controls applied at the pipeline level — before analytics — make SecureVision deployable in environments where raw-video surveillance would be unacceptable or unlawful.",
    workflow: [
      "Streams enter the pipeline",
      "Optional face blur is applied",
      "Skeleton / movement extraction replaces identifiable video for analytics",
      "Role-based dashboards expose only permitted views",
      "Every access and policy change is logged",
    ],
    deployment: [
      "Policy configuration per site and per role",
      "Retention schedules per data class",
      "Audit-log export for compliance review",
      "Applies across all SecureVision products",
    ],
    metrics: [
      { value: "Pipeline-level", label: "Where controls apply" },
      { value: "Role-based", label: "Access model" },
      { value: "Logged", label: "Every access" },
      { value: "Configurable", label: "Retention" },
    ],
    interpretation:
      "PrivacyGuard is described accurately as privacy-aware, privacy-first architecture — it minimises identifiable data and governs access. It is not a claim of guaranteed anonymity.",
    tech: {
      systemOverview:
        "A control plane over the SecureVision pipeline: transformation stages (blur, skeletonization) run before analytics; an authorization layer mediates every dashboard view; audit and policy logs record access, configuration and retention events.",
      inputs: [
        "Raw camera streams",
        "Site privacy policy configuration",
        "Role and permission definitions",
      ],
      pipeline: [
        "Raw stream",
        "Optional face blur",
        "Skeleton / movement extraction",
        "Movement features",
        "Controlled analytics",
        "Role-based dashboard",
      ],
      features: [
        "Skeleton-only representation of people",
        "Privacy-aware (aggregated) heatmaps",
        "Policy-scoped analytic views",
      ],
      models: [
        "Face detection for blur application",
        "Pose/skeleton extraction as the analytic substrate",
        "Policy engine for access and retention",
      ],
      outputSchema: [
        { field: "privacy_mode", desc: "Active processing mode per stream" },
        { field: "access_log", desc: "Who viewed what, when" },
        { field: "policy_log", desc: "Configuration and consent records" },
        { field: "retention_state", desc: "Data-class retention status" },
      ],
      longitudinal:
        "Audit and policy logs form a reviewable history for compliance and governance processes.",
      quality: [
        "Blur/skeletonization verification sampling",
        "Alerting on policy-violating configuration attempts",
        "Periodic access-log review workflows",
      ],
      integration: [
        "Applies to all SecureVision modules",
        "Audit export to compliance tooling",
        "Identity-requiring modules (ReID, Watchlist) run under stricter policy gates",
      ],
      limitations: [
        "Privacy-aware architecture, not a guarantee of anonymity",
        "Lawful-basis and policy decisions remain with the deploying organisation",
        "Controls govern the GaitAI pipeline, not external systems",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["suspiciousmotion", "crowdsense", "forensicsearch"],
    ctaLabel: "Explore PrivacyGuard",
  },

  // ==========================================================================
  // 05 — CAMPUSSHIELD
  // ==========================================================================
  {
    slug: "campusshield",
    overview:
      "CampusShield combines movement-event monitoring across campus spaces — visitor movement timelines, after-hours alerts, fall detection, restricted-zone monitoring and tailgating indicators.",
    environments: ["University", "Corporate campus", "Hospital", "R&D campus"],
    glance: {
      input: "Campus cameras",
      analysis: "Movement events",
      output: "Campus safety view",
      user: "Campus security",
    },
    problem:
      "Large campuses contain many buildings, movement zones and after-hours situations that cannot be continuously supervised manually.",
    solution:
      "A campus-wide movement-event layer: zone rules per building, after-hours profiles, fall detection in low-traffic areas and entry-pairing indicators at controlled doors.",
    whoFor: [
      "Universities",
      "Corporate campuses",
      "Hospitals",
      "Research campuses",
      "IT parks",
    ],
    receives: [
      "Visitor movement timeline",
      "After-hours movement alert",
      "Fall detection",
      "Restricted-zone monitoring",
      "Tailgating indicator",
    ],
    whyItMatters:
      "Campus security teams get a quiet, privacy-aware safety layer across dozens of buildings — surfacing the handful of events that need attention instead of walls of screens.",
    workflow: [
      "Campus cameras feed the movement pipeline",
      "Zone and schedule profiles define normal movement",
      "Events (after-hours, falls, zone entries) are flagged",
      "Security reviews the campus timeline",
      "Incidents escalate through existing procedures",
    ],
    deployment: [
      "Building- and zone-level configuration",
      "After-hours schedule profiles",
      "Campus-wide operator timeline",
      "AccessMotion adds entry-consistency signals at controlled doors",
    ],
    metrics: [
      { value: "Multi-building", label: "Coverage model" },
      { value: "Schedule-aware", label: "After-hours rules" },
      { value: "Timeline", label: "Operator view" },
      { value: "Privacy-first", label: "Processing mode" },
    ],
    interpretation:
      "Events are review prompts for campus security. A quiet timeline is the normal state; deviations — an after-hours movement, a fall-like event — are what the team actually needs to see.",
    tech: {
      systemOverview:
        "A multi-site configuration of the SecureVision event pipeline: per-building zones and schedules, shared operator timeline, and campus-level aggregation of movement events.",
      inputs: [
        "Campus camera streams",
        "Building / zone / schedule configuration",
        "Controlled-door locations",
      ],
      pipeline: [
        "Campus cameras",
        "Movement tracking",
        "Zone + schedule rules",
        "Event detection",
        "Campus timeline",
        "Escalation",
      ],
      features: [
        "After-hours movement events",
        "Fall-like pose dynamics",
        "Zone entry / exit events",
        "Entry-pairing (tailgating) indicators",
      ],
      models: [
        "Shared tracking layer with SuspiciousMotion",
        "Schedule-aware rule evaluation",
        "Fall detection tuned for corridors and stairwells",
      ],
      outputSchema: [
        { field: "campus_event", desc: "Typed movement event with zone" },
        { field: "timeline", desc: "Campus-wide event timeline" },
        { field: "after_hours_flag", desc: "Schedule-deviation indicator" },
        { field: "escalation_ref", desc: "Hand-off to incident workflow" },
      ],
      longitudinal:
        "Event history by building and hour supports staffing and patrol planning.",
      quality: [
        "Coverage checks per building",
        "Schedule-profile validation",
        "Event confidence flags for triage",
      ],
      integration: [
        "Campus security dashboards",
        "AccessMotion at controlled entries",
        "ForensicSearch for post-event review",
      ],
      limitations: [
        "Monitors movement events, not identity or intent",
        "Coverage limited to camera-visible areas",
        "Escalation follows the campus's own procedures",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["accessmotion", "suspiciousmotion", "privacyguard"],
    ctaLabel: "Explore CampusShield",
  },

  // ==========================================================================
  // 06 — FORENSICSEARCH
  // ==========================================================================
  {
    slug: "forensicsearch",
    overview:
      "ForensicSearch indexes movement and event evidence in recorded footage so authorized investigators can narrow hours of multi-camera video by time, path, movement pattern or tracked subject.",
    environments: ["Enterprise security", "Campus", "Transport", "Retail"],
    glance: {
      input: "Recorded footage",
      analysis: "Movement indexing",
      output: "Search results + timeline",
      user: "Investigator",
    },
    problem:
      "After an event, investigators may need to manually review large amounts of video across cameras.",
    solution:
      "Uploaded footage is indexed by movement: trajectories, events and appearance-agnostic movement descriptors become searchable, producing candidate segments and camera-wise trails instead of raw hours.",
    whoFor: [
      "Enterprise security teams",
      "Campus investigation units",
      "Transport-hub security",
      "Retail loss-prevention (authorized use)",
    ],
    receives: [
      "Search results",
      "Incident timeline",
      "Camera-wise movement trail",
      "Movement-pattern query",
      "Evidence review pack",
    ],
    whyItMatters:
      "An investigation that would take a team days of manual scrubbing becomes a set of ranked candidate segments — reviewed, confirmed and documented by a human investigator.",
    workflow: [
      "Authorized investigator uploads or selects footage",
      "Pipeline indexes movement and events",
      "Investigator queries by time, zone, path or pattern",
      "Candidate segments are ranked for review",
      "Confirmed findings compile into a review pack",
    ],
    deployment: [
      "Post-event, access-controlled workflow",
      "Case-scoped footage handling and retention",
      "Query audit logs per case",
      "Respects lawful purpose, access control and retention policy",
    ],
    metrics: [
      { value: "Case-scoped", label: "Access model" },
      { value: "Multi-camera", label: "Trail reconstruction" },
      { value: "Ranked", label: "Candidate review" },
      { value: "Audited", label: "Every query" },
    ],
    interpretation:
      "Results are candidates for human confirmation — the system narrows where to look; the investigator decides what was found. All use sits inside the organisation's lawful-purpose and retention policies.",
    tech: {
      systemOverview:
        "An offline indexing pipeline over recorded footage: detection, tracking and event extraction build a searchable movement index; a query layer returns ranked segments and cross-camera trails within an access-controlled case workspace.",
      inputs: [
        "Recorded multi-camera footage",
        "Case scope and authorization",
        "Camera-topology metadata",
      ],
      pipeline: [
        "Footage ingest",
        "Movement indexing",
        "Event extraction",
        "Query layer",
        "Ranked candidates",
        "Review pack",
      ],
      features: [
        "Trajectory and path descriptors",
        "Event tags (zone entries, running, dwell)",
        "Appearance-agnostic movement descriptors",
        "Cross-camera trail candidates",
      ],
      models: [
        "Batch detection and tracking",
        "Movement-descriptor indexing",
        "Query ranking over indexed segments",
      ],
      outputSchema: [
        { field: "candidates", desc: "Ranked matching segments" },
        { field: "trail", desc: "Camera-wise movement trail" },
        { field: "timeline", desc: "Reconstructed incident timeline" },
        { field: "review_pack", desc: "Confirmed-evidence compilation" },
        { field: "query_log", desc: "Audited query history" },
      ],
      longitudinal:
        "Case workspaces preserve query history and confirmed findings for review and hand-over.",
      quality: [
        "Index-coverage report per footage set",
        "Candidate confidence scores for triage",
        "Human confirmation required before inclusion in review packs",
      ],
      integration: [
        "VMS footage export ingestion",
        "ReID for cross-camera candidate matching where authorized",
        "Evidence-pack export",
      ],
      limitations: [
        "Candidates require human confirmation",
        "Index quality depends on footage quality",
        "Deployment must respect access control, lawful purpose and retention policy",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["reid", "suspiciousmotion", "privacyguard"],
    ctaLabel: "Explore ForensicSearch",
  },

  // ==========================================================================
  // 07 — REID
  // ==========================================================================
  {
    slug: "reid",
    valueProp: "Track the same person across cameras — by gait.",
    overview:
      "ReID estimates cross-camera correspondence using body- and movement-level signatures — for authorized investigation and operational continuity when appearance changes, faces are unavailable or cameras capture people from a distance.",
    environments: ["Airport", "Rail", "Campus", "Investigation"],
    glance: {
      input: "Multi-camera views",
      analysis: "Movement signatures",
      output: "Candidate trails",
      user: "Authorized investigator",
    },
    problem:
      "Cross-camera continuity is difficult when appearance changes, faces are unavailable or cameras capture people from a distance.",
    solution:
      "Gait and body-level movement signatures link candidate observations across cameras, producing confidence-scored trails and camera-transition maps for human review.",
    whoFor: [
      "Airports and rail networks",
      "Large campuses",
      "Enterprise investigation teams",
      "Authorized security operations",
    ],
    receives: [
      "Cross-camera trail",
      "Movement signature",
      "Confidence score",
      "Timeline",
      "Camera transition map",
    ],
    whyItMatters:
      "Continuity across cameras — the question every multi-camera investigation asks — becomes a ranked, reviewable hypothesis instead of hours of manual matching.",
    workflow: [
      "Authorized case defines the tracked subject and scope",
      "Movement signatures are computed per observation",
      "Candidate matches link observations across cameras",
      "Each link carries a confidence score",
      "Investigator confirms or rejects each candidate",
    ],
    deployment: [
      "Case-scoped, access-controlled operation",
      "Confidence thresholds configured per deployment",
      "Every match logged for audit",
      "Runs under PrivacyGuard policy gates",
    ],
    metrics: [
      { value: "Confidence-scored", label: "Match model" },
      { value: "Human-confirmed", label: "Final decision" },
      { value: "Case-scoped", label: "Authorization" },
      { value: "Audited", label: "Match history" },
    ],
    interpretation:
      "Results are confidence-based candidate matching, not infallible identity proof. A trail is a hypothesis for an investigator to verify against other evidence.",
    tech: {
      systemOverview:
        "A signature-matching pipeline: per-observation gait and body descriptors are embedded and compared across cameras; a linking layer assembles candidate trails with per-link confidence and a transition map.",
      inputs: [
        "Multi-camera observations within case scope",
        "Camera topology",
        "Case authorization metadata",
      ],
      pipeline: [
        "Observations",
        "Signature embedding",
        "Cross-camera matching",
        "Trail assembly",
        "Confidence scoring",
        "Investigator review",
      ],
      features: [
        "Gait-dynamics descriptors",
        "Body-proportion descriptors",
        "Temporal-consistency constraints",
        "Camera-transition priors",
      ],
      models: [
        "Movement-signature embedding",
        "Cross-camera candidate matching",
        "Trail assembly with consistency checks",
      ],
      outputSchema: [
        { field: "trail", desc: "Ordered cross-camera observations" },
        { field: "link_confidence", desc: "Per-link match confidence" },
        { field: "transition_map", desc: "Camera-to-camera path summary" },
        { field: "review_state", desc: "Investigator confirm/reject status" },
        { field: "audit_entry", desc: "Logged match decision" },
      ],
      longitudinal:
        "Case history preserves confirmed and rejected candidates, improving reviewer context over an investigation.",
      quality: [
        "Confidence thresholds gate what is shown",
        "Distance, angle and gait-visibility affect signature quality and are flagged",
        "Human confirmation is required on every link",
      ],
      integration: [
        "ForensicSearch case workspaces",
        "Watchlist (only under its own authorization regime)",
        "Evidence-pack export",
      ],
      limitations: [
        "Confidence-based candidates — not identity proof",
        "Signature quality varies with viewpoint and capture conditions",
        "Restricted to authorized, case-scoped use under policy",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["forensicsearch", "watchlist", "suspiciousmotion"],
    ctaLabel: "Explore ReID",
  },

  // ==========================================================================
  // 08 — ACCESSMOTION
  // ==========================================================================
  {
    slug: "accessmotion",
    overview:
      "AccessMotion uses gait and movement consistency as an additional authentication signal alongside authorized primary methods — a passive second factor for high-security spaces.",
    environments: ["Data centre", "R&D lab", "Defence campus", "High-security office"],
    glance: {
      input: "Approach + entry video",
      analysis: "Consistency check",
      output: "Access confidence",
      user: "Access-control system",
    },
    problem:
      "High-security access can benefit from an additional passive consistency signal beyond a single credential.",
    solution:
      "Movement consistency between the presenting person and their enrolled movement profile produces an access-confidence signal that complements — never replaces — the primary credential.",
    whoFor: [
      "Data centres",
      "R&D laboratories",
      "Defence and government campuses",
      "High-security corporate sites",
    ],
    receives: [
      "Access confidence",
      "Identity-consistency signal",
      "Tailgating alert",
      "Movement verification",
      "Access audit log",
    ],
    whyItMatters:
      "A stolen badge walks differently than its owner. A passive consistency signal raises the bar at sensitive doors without adding user friction.",
    workflow: [
      "Enrolled personnel consent to movement-profile enrolment",
      "At entry, primary credential is presented as usual",
      "Movement consistency is scored passively",
      "Low-consistency events flag for secondary verification",
      "All decisions log to the access audit trail",
    ],
    deployment: [
      "Consent-based enrolment for authorized personnel",
      "Integration with existing access-control systems",
      "Site-configured confidence thresholds",
      "Positioned as an additional factor, not sole authentication",
    ],
    metrics: [
      { value: "Second factor", label: "Security role" },
      { value: "Passive", label: "User friction" },
      { value: "Consent-based", label: "Enrolment" },
      { value: "Audited", label: "Every decision" },
    ],
    interpretation:
      "A low consistency score is a prompt for secondary verification — not a denial by itself. Policy decides what happens at each confidence band; AccessMotion supplies the signal.",
    tech: {
      systemOverview:
        "An enrolment-and-verification pipeline: consented movement profiles are built per authorized person; at entry, approach movement is scored for consistency against the profile bound to the presented credential.",
      inputs: [
        "Entry-zone camera views",
        "Enrolled movement profiles (consented)",
        "Primary credential events from the access system",
      ],
      pipeline: [
        "Approach video",
        "Gait feature extraction",
        "Profile comparison",
        "Consistency score",
        "Access-policy decision",
        "Audit log",
      ],
      features: [
        "Gait-dynamics descriptors",
        "Approach-path consistency",
        "Entry-pairing (tailgating) detection",
      ],
      models: [
        "Per-person movement-profile modelling",
        "Consistency scoring against the credentialed profile",
        "Tailgating detection at controlled doors",
      ],
      outputSchema: [
        { field: "access_confidence", desc: "Consistency score band" },
        { field: "consistency_signal", desc: "Credential-vs-movement agreement" },
        { field: "tailgating_alert", desc: "Entry-pairing event" },
        { field: "audit_entry", desc: "Logged decision with factors" },
      ],
      longitudinal:
        "Profiles adapt to gradual change under re-enrolment policy; drift is flagged rather than silently absorbed.",
      quality: [
        "Enrolment-quality gates before activation",
        "Environmental checks at entry zones",
        "Threshold tuning per site security policy",
      ],
      integration: [
        "Access-control system integration",
        "CampusShield entry events",
        "Security-operations audit tooling",
      ],
      limitations: [
        "An additional factor — never sole authentication",
        "Requires consented enrolment of authorized personnel",
        "Capture conditions at the entry zone affect signal quality",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["campusshield", "watchlist", "reid"],
    ctaLabel: "Explore AccessMotion",
  },

  // ==========================================================================
  // 09 — EVENTSHIELD
  // ==========================================================================
  {
    slug: "eventshield",
    valueProp: "Stadium, concert, conference — crowd-movement indicators for the operations room.",
    overview:
      "EventShield aggregates crowd movement into operational safety indicators for high-density venues — entry/exit flow, density-risk indicators, bottlenecks, abnormal crowd-motion indicators and evacuation summaries.",
    environments: ["Stadium", "Concert", "Conference", "Public gathering"],
    glance: {
      input: "Venue cameras",
      analysis: "Crowd-risk analytics",
      output: "Ops safety indicators",
      user: "Event operations",
    },
    problem:
      "Large events create rapidly changing crowd density and entry/exit conditions.",
    solution:
      "Event-tuned crowd analytics track flow and density against venue capacity, flagging bottlenecks and abnormal crowd-motion indicators for the operations team. Real-time-oriented monitoring where the deployment is configured for it.",
    whoFor: [
      "Stadiums",
      "Event organisers",
      "Conference centres",
      "Civic bodies and police (authorized operations)",
    ],
    receives: [
      "Entry / exit flow",
      "Density risk",
      "Bottleneck indicator",
      "Abnormal crowd-motion indicator",
      "Evacuation movement summary",
    ],
    whyItMatters:
      "During an event, minutes matter: seeing a gate backing up or density climbing in a stand gives operations time to act before conditions become dangerous.",
    workflow: [
      "Venue zones and capacities are configured pre-event",
      "Live flow and density track against thresholds",
      "Bottleneck and abnormal crowd-motion indicators reach operations",
      "Teams adjust gates, routes and announcements",
      "Post-event summaries feed the next event plan",
    ],
    deployment: [
      "Pre-event zone and capacity configuration",
      "Event-day operations dashboard",
      "Aggregate-only crowd analytics",
      "Post-event review reports",
    ],
    metrics: [
      { value: "Per-gate", label: "Flow tracking" },
      { value: "Capacity-aware", label: "Density risk" },
      { value: "Live", label: "Ops indicators" },
      { value: "Post-event", label: "Review reports" },
    ],
    interpretation:
      "Indicators describe crowd state relative to the venue plan. Operations teams read them alongside radio traffic and stewarding reports — the dashboard informs the decision, people make it.",
    tech: {
      systemOverview:
        "CrowdSense analytics specialised for events: capacity-aware density-risk indicators, gate-flow tracking, sudden-dispersal movement descriptors and evacuation summaries, configured per event.",
      inputs: [
        "Venue camera streams",
        "Zone / gate / capacity configuration",
        "Event schedule",
      ],
      pipeline: [
        "Venue cameras",
        "Trajectory aggregation",
        "Capacity-aware analytics",
        "Risk indicators",
        "Ops dashboard",
        "Post-event report",
      ],
      features: [
        "Gate entry/exit flow rates",
        "Zone density vs capacity",
        "Sudden-dispersal (panic-like) movement descriptors",
        "Evacuation-flow aggregates",
      ],
      models: [
        "Event-tuned density estimation",
        "Flow-rate tracking per gate",
        "Sudden-dispersal movement descriptors over aggregate motion",
      ],
      outputSchema: [
        { field: "gate_flow", desc: "Entry/exit rates per gate" },
        { field: "density_risk", desc: "Zone density vs capacity band" },
        { field: "bottleneck", desc: "Forming-bottleneck indicator" },
        { field: "dispersal_alert", desc: "Sudden-dispersal (abnormal crowd-motion) indicator" },
        { field: "event_report", desc: "Post-event movement summary" },
      ],
      longitudinal:
        "Event-over-event comparisons support venue planning — recurring pinch points, gate allocation and stewarding placement.",
      quality: [
        "Pre-event coverage validation per zone",
        "Threshold rehearsal against venue plans",
        "Indicator confidence flags during degraded coverage",
      ],
      integration: [
        "Event control-room dashboards",
        "CrowdSense shared analytics core",
        "Alert routing to operations channels",
      ],
      limitations: [
        "Aggregate indicators — not individual tracking",
        "Coverage and camera placement bound accuracy",
        "Crowd-management decisions remain with the venue",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["crowdsense", "suspiciousmotion", "privacyguard"],
    ctaLabel: "Explore EventShield",
  },

  // ==========================================================================
  // 10 — RETAILGUARD
  // ==========================================================================
  {
    slug: "retailguard",
    overview:
      "RetailGuard provides movement-aware operational analytics across retail zones — loitering alerts, queue analytics, emergency flow, staff-safety events and crowd heatmaps.",
    environments: ["Retail chain", "Mall", "Big-box store"],
    glance: {
      input: "Store cameras",
      analysis: "Retail movement analytics",
      output: "Floor ops insights",
      user: "Store operations",
    },
    problem:
      "Retail environments combine queue management, staff safety, emergency flow and unusual-movement monitoring.",
    solution:
      "One movement layer serves all four: queue and flow analytics for operations, loitering and unusual-movement events for security, and staff-safety alerts for duty managers.",
    whoFor: [
      "Retail chains",
      "Malls",
      "Big-box stores",
      "Store operations and loss-prevention teams (authorized use)",
    ],
    receives: [
      "Loitering alert",
      "Queue analytics",
      "Emergency flow",
      "Staff-safety event",
      "Crowd heatmap",
    ],
    whyItMatters:
      "The same cameras that watch the floor become an operations tool: shorter queues, earlier safety response and movement-defined security events — without identity-first surveillance.",
    workflow: [
      "Store zones (queues, aisles, backrooms) are configured",
      "Movement analytics run across the floor",
      "Queue and density insights reach operations",
      "Movement events reach security / duty managers",
      "Heatmaps inform layout and staffing decisions",
    ],
    deployment: [
      "Per-store zone configuration",
      "Chain-level and store-level dashboards",
      "Aggregate heatmaps for layout planning",
      "PrivacyGuard controls throughout",
    ],
    metrics: [
      { value: "Per-zone", label: "Floor configuration" },
      { value: "Queue-level", label: "Wait analytics" },
      { value: "Aggregate", label: "Heatmaps" },
      { value: "Chain-wide", label: "Dashboards" },
    ],
    interpretation:
      "Operational reads: a queue alert means open a till; a loitering event means send a colleague to assist or check; heatmaps show where the floor actually works. Movement events are prompts, not accusations.",
    tech: {
      systemOverview:
        "A retail configuration of the SecureVision analytics core: queue and flow analytics per configured zone, movement-event detection on the floor, and aggregate heatmapping for planning.",
      inputs: [
        "Store camera streams",
        "Zone configuration (queues, aisles, service areas)",
        "Store schedule",
      ],
      pipeline: [
        "Store cameras",
        "Movement tracking",
        "Zone analytics",
        "Events + queue insights",
        "Store dashboard",
        "Chain aggregation",
      ],
      features: [
        "Queue length and wait descriptors",
        "Dwell / loitering descriptors",
        "Emergency-flow aggregates",
        "Staff-zone safety events",
      ],
      models: [
        "Queue analytics over configured lines",
        "Dwell-pattern detection",
        "Shared event pipeline with SuspiciousMotion",
      ],
      outputSchema: [
        { field: "queue_stats", desc: "Per-queue length and trend" },
        { field: "movement_event", desc: "Loitering / unusual-movement event" },
        { field: "staff_event", desc: "Staff-zone safety event" },
        { field: "heatmap", desc: "Aggregate floor heatmap" },
        { field: "chain_rollup", desc: "Multi-store aggregation" },
      ],
      longitudinal:
        "Day-over-day and store-over-store comparisons support staffing, layout and loss-prevention planning.",
      quality: [
        "Zone-coverage validation per store",
        "Queue-calibration checks",
        "Event confidence flags for triage",
      ],
      integration: [
        "Store operations dashboards",
        "CrowdSense analytics core",
        "Alert routing to duty managers",
      ],
      limitations: [
        "Movement-defined events — human review before any action",
        "Coverage varies with store camera layouts",
        "Loss-prevention use must follow policy and law",
      ],
    },
    privacy: SECURE_PRIVACY,
    related: ["crowdsense", "suspiciousmotion", "privacyguard"],
    ctaLabel: "Explore RetailGuard",
  },

  // ==========================================================================
  // 11 — WATCHLIST
  // ==========================================================================
  {
    slug: "watchlist",
    valueProp: "Lawful, audited, and intended only for authorized deployments.",
    overview:
      "Watchlist provides policy-governed candidate matching against an authorized watchlist, with confidence scoring, consent/policy logs and auditability. It is restricted to deployments with lawful authority — it is not offered for general-public surveillance.",
    environments: ["Authorized law enforcement", "Defence", "Critical infrastructure (where lawful)"],
    glance: {
      input: "Authorized streams",
      analysis: "Candidate matching",
      output: "Reviewable candidates",
      user: "Authorized operator",
    },
    problem:
      "Certain high-security environments may require controlled candidate matching against an authorized watchlist.",
    solution:
      "Movement-signature comparison against a lawfully constituted watchlist produces confidence-scored candidates for mandatory human review, inside a policy-governed, fully audited workflow.",
    whoFor: [
      "Authorized law-enforcement deployments",
      "Defence agencies",
      "Critical-infrastructure sites where lawful",
    ],
    receives: [
      "Watchlist match candidates",
      "Confidence score",
      "Policy / consent logs",
      "Audit history",
      "Access control",
    ],
    whyItMatters:
      "Where the law authorises watchlist screening, the difference between responsible and irresponsible deployment is governance: candidate-only outputs, mandatory review, scoped lists, and an audit trail for every match and every access.",
    workflow: [
      "Deployment authority and list governance are established first",
      "Watchlist entries are enrolled under policy",
      "Streams within the authorized scope are screened",
      "Candidates above threshold go to mandatory human review",
      "Every match, review and access is logged",
    ],
    deployment: [
      "Intended only for deployments with lawful authority and policy controls",
      "List governance: scoped entries, review cycles, removal process",
      "Mandatory human adjudication of candidates",
      "Audit trail available for oversight bodies",
    ],
    metrics: [
      { value: "Lawful-basis", label: "Deployment gate" },
      { value: "Candidate-only", label: "Output type" },
      { value: "Human review", label: "Mandatory step" },
      { value: "Auditable", label: "Oversight trail" },
    ],
    interpretation:
      "A match is a confidence-scored candidate for adjudication — never an automatic identification or action trigger. Responsible deployment: this product is not offered for monitoring the general public, and outputs must not be treated as unrestricted identification.",
    tech: {
      systemOverview:
        "A governed matching pipeline: enrolled movement signatures form the watchlist; screening within the authorized scope produces candidates with confidence scores; an adjudication workflow enforces human review; policy and audit layers record everything.",
      inputs: [
        "Authorized camera scope",
        "Lawfully constituted watchlist enrolments",
        "Policy configuration and authority records",
      ],
      pipeline: [
        "Authorized streams",
        "Movement-signature extraction",
        "Watchlist comparison",
        "Confidence-scored candidates",
        "Mandatory human review",
        "Audit log",
      ],
      features: [
        "Gait-signature comparison",
        "Confidence banding per candidate",
        "Scope enforcement per camera and time window",
      ],
      models: [
        "Movement-signature embedding shared with ReID",
        "Watchlist comparison with per-candidate confidence",
        "Policy engine enforcing scope and review requirements",
      ],
      outputSchema: [
        { field: "candidate", desc: "Watchlist match candidate" },
        { field: "confidence", desc: "Match confidence band" },
        { field: "review_state", desc: "Adjudication outcome" },
        { field: "policy_log", desc: "Authority / consent records" },
        { field: "audit_history", desc: "Complete access and match log" },
      ],
      longitudinal:
        "Audit history supports external oversight and periodic review of list scope and system behaviour.",
      quality: [
        "Confidence thresholds set under policy, not convenience",
        "Capture-quality flags on every candidate",
        "Mandatory adjudication before any operational use",
      ],
      integration: [
        "ReID signature core",
        "PrivacyGuard policy and audit layers",
        "Oversight reporting export",
      ],
      limitations: [
        "Candidates are not identity proof; adjudication is mandatory",
        "Restricted to lawful, authorized, scoped deployments",
        "Not offered for general-public surveillance",
      ],
    },
    privacy:
      "Responsible deployment: Watchlist is restricted to deployments with lawful authority, governed lists, mandatory human adjudication and auditability. It is not offered for general-public surveillance, and its outputs must never be treated as unrestricted identification. " +
      SECURE_PRIVACY,
    related: ["reid", "accessmotion", "privacyguard"],
    ctaLabel: "Discuss an authorized deployment",
  },
];
