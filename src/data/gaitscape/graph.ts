import { allProducts, industryUseCases } from "@/data/products";
import { allPublications } from "@/data/publications";
import { useCaseHrefById } from "@/data/usecase-details";
/* The vocabulary only, and that module imports nothing — see the note in
   capture-sources.ts for why this must not become an import of
   product-details.ts again. */
import {
  CAPTURE_SOURCES,
  CAPTURE_SOURCE_LABEL,
  sortCaptureSources,
  type CaptureSource,
  type CaptureSourceDef,
} from "@/data/capture-sources";
import type {
  GaitscapeNode,
  GaitscapeRelationship,
  SystemFacts,
} from "./types";

// ============================================================================
// STATIC NODE FAMILIES
// products and application domains are derived from canonical site data
// below; these families name the signals / capabilities / outcomes the site
// already talks about (product outputs, aiPipeline, page copy).
// ============================================================================

export const CORE_ID = "core";

const coreNode: GaitscapeNode = {
  id: CORE_ID,
  type: "core",
  title: "Human Movement Intelligence",
  shortDescription:
    "One movement-intelligence layer powering every GaitAI product across both verticals.",
};

const verticalNodes: GaitscapeNode[] = [
  {
    id: "mobilitycare",
    type: "vertical",
    title: "MobilityCare",
    shortDescription:
      "Movement intelligence for care, mobility, rehabilitation, sports and wearables.",
    vertical: "mobilitycare",
    href: "/mobilitycare",
  },
  {
    id: "securevision",
    type: "vertical",
    title: "SecureVision",
    shortDescription:
      "Privacy-aware movement intelligence for safer campuses, cities, industry and events.",
    vertical: "securevision",
    href: "/securevision",
  },
];

const signalNodes: GaitscapeNode[] = [
  { id: "sig-gait-identity", type: "signal", title: "Gait identity", shortDescription: "A person's individual walking signature, usable as a movement biometric." },
  { id: "sig-stride-variability", type: "signal", title: "Stride variability", shortDescription: "Step-to-step rhythm consistency — an early instability marker." },
  { id: "sig-balance", type: "signal", title: "Balance & postural sway", shortDescription: "Stability and sway signals extracted from body movement." },
  { id: "sig-cadence", type: "signal", title: "Cadence & rhythm", shortDescription: "Steps per minute and walking rhythm over time." },
  { id: "sig-step-symmetry", type: "signal", title: "Step symmetry", shortDescription: "Left/right movement balance across steps and limbs." },
  { id: "sig-walking-speed", type: "signal", title: "Walking speed", shortDescription: "Gait speed — a widely used functional mobility measure." },
  { id: "sig-posture", type: "signal", title: "Posture markers", shortDescription: "Body-alignment markers observed while standing and walking." },
  { id: "sig-mobility-decline", type: "signal", title: "Mobility decline", shortDescription: "Gradual longitudinal change in everyday movement." },
  { id: "sig-rehab-progress", type: "signal", title: "Rehabilitation progress", shortDescription: "Session-over-session movement recovery trend." },
  { id: "sig-fall-risk", type: "signal", title: "Fall-risk signals", shortDescription: "Movement patterns associated with elevated fall risk." },
  { id: "sig-tremor-neuro", type: "signal", title: "Neurological movement signals", shortDescription: "Shuffling, freezing-like events, tremor and turning difficulty." },
  { id: "sig-trajectory", type: "signal", title: "Trajectory & path", shortDescription: "Where people move — paths, zones and timelines across space." },
  { id: "sig-behaviour", type: "signal", title: "Behaviour patterns", shortDescription: "Movement events such as loitering, running or tailgating." },
  { id: "sig-crowd-flow", type: "signal", title: "Crowd movement", shortDescription: "Density, queues, bottlenecks and flow direction at crowd scale." },
];

const capabilityNodes: GaitscapeNode[] = [
  { id: "cap-pose", type: "capability", title: "Pose estimation", shortDescription: "Detects body landmarks from video — skeleton signals at frame rate." },
  { id: "cap-gait", type: "capability", title: "Gait analysis", shortDescription: "Cadence, stride rhythm, speed, asymmetry, posture, balance, variability." },
  { id: "cap-temporal", type: "capability", title: "Temporal modelling", shortDescription: "Longitudinal movement trends across sessions, days and months." },
  { id: "cap-biometrics", type: "capability", title: "Movement biometrics", shortDescription: "Identity-bearing movement signatures beyond face or fingerprint." },
  { id: "cap-reid", type: "capability", title: "Person re-identification", shortDescription: "Linking the same person across cameras by movement signature." },
  { id: "cap-har", type: "capability", title: "Human activity recognition", shortDescription: "Classifying movement events from human activity." },
  { id: "cap-trajectory", type: "capability", title: "Trajectory analysis", shortDescription: "Modelling paths, flow and spatial movement over time." },
  { id: "cap-fusion", type: "capability", title: "Multimodal sensor fusion", shortDescription: "Smartwatch and IMU signals fused with video features." },
  { id: "cap-edge", type: "capability", title: "Edge inference", shortDescription: "Optimized on-device movement analytics pipelines." },
  { id: "cap-anomaly", type: "capability", title: "Anomaly detection", shortDescription: "Surfacing unusual movement without identifying anyone first." },
  { id: "cap-risk", type: "capability", title: "Risk scoring", shortDescription: "Combining movement signals into fall, injury and safety risk indicators." },
  // The capability the privacy RESEARCH informs is a principle — handling
  // gait data with minimal identity exposure. The shipped controls
  // (skeleton-only processing, face blur, retention, access, audit) are a
  // separate implementation and are listed as such on /research; naming them
  // here made the paper read as proof of the controls.
  { id: "cap-privacy", type: "capability", title: "Privacy-aware analytics", shortDescription: "Privacy-aware data handling that minimises unnecessary identity exposure." },
  { id: "cap-explain", type: "capability", title: "Explainable reporting", shortDescription: "Clinician- and operator-friendly reports, scores and trends." },
];

const outcomeNodes: GaitscapeNode[] = [
  { id: "out-early-risk", type: "outcome", title: "Earlier mobility-risk insight", shortDescription: "Movement decline surfaced while earlier review is still useful." },
  { id: "out-fall-awareness", type: "outcome", title: "Fall-risk awareness", shortDescription: "Low / medium / high fall-risk context for care teams." },
  { id: "out-rehab", type: "outcome", title: "Objective rehabilitation monitoring", shortDescription: "Measured recovery progress across therapy sessions." },
  { id: "out-assessment", type: "outcome", title: "Functional movement assessment", shortDescription: "Objective gait and mobility reports from short videos." },
  { id: "out-performance", type: "outcome", title: "Performance & injury-risk insight", shortDescription: "Symmetry, fatigue and return-to-play signals for athletes." },
  { id: "out-identity", type: "outcome", title: "Movement-based identity", shortDescription: "Recognition and access support when faces aren't enough." },
  { id: "out-safer-spaces", type: "outcome", title: "Safer public environments", shortDescription: "Movement awareness across campuses, cities, industry and events." },
  { id: "out-privacy", type: "outcome", title: "Privacy-aware monitoring", shortDescription: "Movement intelligence without invasive surveillance." },
  { id: "out-realtime", type: "outcome", title: "Real-time safety analytics", shortDescription: "Movement-event alerts operators can review and act on." },
];

// Research areas — each backed by publications / the granted patent listed
// in publications.ts. Capability links follow the papers' own keywords.
const researchNodes: GaitscapeNode[] = [
  {
    id: "res-gait-biometrics",
    type: "research",
    title: "Gait recognition & biometrics",
    shortDescription:
      "Founder-led journal work on deep-learning gait recognition with covariates (Springer, Elsevier).",
    href: "/publications",
    publicationIds: [
      "ai-review-2023",
      "neurocomputing-2022",
      "eaai-2024",
      "dsp-2024",
      "prl-2023",
      "ivc-2023",
    ],
  },
  {
    id: "res-pose-gait",
    type: "research",
    title: "Pose-based gait analysis",
    shortDescription:
      "Covariate-invariant gait recognition built on pose features (IET Biometrics).",
    href: "/publications",
    publicationIds: ["iet-pose-2022"],
  },
  {
    id: "res-privacy",
    type: "research",
    title: "Privacy-preserving gait data",
    shortDescription:
      "Protecting gait datasets inside deep-learning pipelines (IET Biometrics).",
    href: "/publications",
    publicationIds: ["iet-privacy-2022"],
  },
  {
    id: "res-edge",
    type: "research",
    title: "Edge gait analytics (Patent 402202)",
    shortDescription:
      "Granted Indian patent: covariate-based gait recognition for edge analytics.",
    href: "/publications",
    publicationIds: ["patent-covariate-gait-edge"],
  },
];

// ============================================================================
// DERIVED NODES — products and application domains from canonical data
// ============================================================================

const productNodes: GaitscapeNode[] = allProducts.map((p) => ({
  id: p.id,
  type: "product",
  title: p.short,
  shortDescription: p.description,
  vertical: p.vertical,
  href: `/${p.vertical}#${p.id}`,
  tags: p.outputs.slice(0, 4),
}));

const domainNodes: GaitscapeNode[] = industryUseCases.map((u) => ({
  id: `dom-${u.id}`,
  type: "domain",
  title: u.industry,
  shortDescription: u.problem,
  vertical: u.vertical,
  href: useCaseHrefById(u.id),
}));

// ============================================================================
// CAPTURE SOURCES — WHAT THE READER ALREADY HAS
// ----------------------------------------------------------------------------
// The vocabulary a buyer answers in, matched against each module's own
// documented input string from systemFactsFor(). `pose` is a derived stream
// rather than a device, so it is matched on the pose-estimation capability;
// `multi` is matched on multimodal sensor fusion — the capability whose whole
// definition is combining sources — or on a module documented with two or
// more distinct devices.
//
// The mobile row is grounded in the pipeline record: aiPipeline's fusion stage
// reads "Smartwatch and mobile IMU signals fused with video features", and a
// module that takes a standard-camera walking video takes one from a phone.
//
// THIS USED TO LIVE IN analytics.ts. It moved here because the map needed it
// too — "click CCTV, see which modules can work from it" was the one question
// GaitScape could not answer, since inputs were not in the graph at all — and
// analytics.ts already imports this module, so the alternative was a second
// copy of these regexes and an import cycle. analytics.ts now re-exports these
// four names, so every existing caller is untouched.
// ============================================================================

export type { CaptureSource, CaptureSourceDef };
export { CAPTURE_SOURCES, CAPTURE_SOURCE_LABEL };

const VIDEO_INPUT = /\bvideo\b|walking video/i;
const CCTV_INPUT = /cctv|camera feed|cameras|camera analytics/i;
const WEARABLE_INPUT = /smartwatch|wearable|imu|sensor signals/i;
const MOBILE_DEPLOY = /mobile/i;

/**
 * Which capture sources a module can work from. Read off the module's own
 * documented input (and, for the mobile row, its documented delivery), not
 * assigned by hand.
 */
export function sourcesForProduct(productId: string): CaptureSource[] {
  const facts = systemFactsFor(productId);
  const capabilities = PRODUCT_MAP[productId]?.capabilities ?? [];
  const found = new Set<CaptureSource>();

  if (VIDEO_INPUT.test(facts.input)) found.add("video");
  if (CCTV_INPUT.test(facts.input)) found.add("cctv");
  if (WEARABLE_INPUT.test(facts.input)) found.add("wearable");
  // A standard-camera walking video can be captured on a phone; a module
  // delivered on mobile is reachable that way too.
  if (found.has("video") || MOBILE_DEPLOY.test(facts.deployment)) {
    found.add("mobile");
  }
  if (capabilities.includes("cap-pose")) found.add("pose");
  if (capabilities.includes("cap-fusion") || found.size >= 3) found.add("multi");

  return CAPTURE_SOURCES.map((source) => source.id).filter((id) =>
    found.has(id),
  );
}

/**
 * SUPPORTING sources — documented, and no longer invisible.
 *
 * `sourcesForProduct` reads `systemFactsFor().input`, which is a module's
 * PRIMARY input in one sentence. Seven modules' detail records name a source
 * that sentence does not: FallRisk's "wearable mobility signals when
 * available", WalkScan's "compatible CCTV / fixed-camera footage where
 * appropriate", and so on.
 *
 * That was a contradiction a reader could hit in two clicks. The footage
 * matcher rated WalkScan LOW for a fixed camera while WalkScan's own page said
 * CCTV footage works; the stack configurator dropped FallRisk the moment
 * "Wearable" was ticked, while FallRisk's page listed wearable signals.
 *
 * THE FIX IS NOT TO MERGE THE TWO LISTS. Flattening them creates the opposite
 * wrong answer — FallRisk offered to someone holding only a watch, which it
 * cannot work from, because its wearable support is an addition to video
 * rather than a substitute. So the hedge is kept: the hedged sources are
 * declared on the product record as `supportingSources`, and surfaces that ask
 * "what do you have?" keep using the primary list while surfaces that describe
 * a module state both.
 *
 * WHY IT IS DECLARED AND NOT INFERRED HERE. It was inferred, by matching the
 * same regexes below against each module's `tech.inputs` prose — which meant
 * this file imported product-details.ts, and this file is reachable from the
 * client bundle of seven routes. /use-cases, /research/talks and /gaitscape
 * each carried about 25 kB of product copy they never render. The prose is
 * still the source of truth; `validate:gaitai` now does the matching, at build
 * time, and fails if a declared list and the prose disagree in either
 * direction.
 */
export function supportingSourcesForProduct(
  productId: string,
): CaptureSource[] {
  const product = allProducts.find((entry) => entry.id === productId);
  const primary = new Set(sourcesForProduct(productId));
  return sortCaptureSources(
    (product?.supportingSources ?? []).filter((id) => !primary.has(id)),
  );
}

/** Graph node id for a capture source. */
export const inputNodeId = (source: CaptureSource) => `in-${source}`;

/**
 * The capture sources, as nodes. Derived from the same vocabulary above, so
 * the map, the footage matcher, the signal chain and the comparison table all
 * name the same six things.
 */
const inputNodes: GaitscapeNode[] = CAPTURE_SOURCES.map((source) => ({
  id: inputNodeId(source.id),
  type: "input",
  title: source.label,
  shortDescription: source.note,
  href: "/movement-lab#footage",
}));

export const gaitscapeNodes: GaitscapeNode[] = [
  coreNode,
  ...verticalNodes,
  ...inputNodes,
  ...signalNodes,
  ...capabilityNodes,
  ...productNodes,
  ...domainNodes,
  ...researchNodes,
  ...outcomeNodes,
];

export const nodeById = new Map(gaitscapeNodes.map((n) => [n.id, n]));

// ============================================================================
// PRODUCT → SIGNAL / CAPABILITY / OUTCOME MAPPINGS
// Curated strictly from each product's documented outputs & description.
// ============================================================================

type ProductMap = Record<
  string,
  { signals: string[]; capabilities: string[]; outcomes: string[] }
>;

const PRODUCT_MAP: ProductMap = {
  walkscan: {
    signals: ["sig-walking-speed", "sig-cadence", "sig-step-symmetry", "sig-posture"],
    capabilities: ["cap-pose", "cap-gait", "cap-explain"],
    outcomes: ["out-assessment", "out-rehab"],
  },
  fallrisk: {
    signals: ["sig-balance", "sig-stride-variability", "sig-posture", "sig-mobility-decline", "sig-fall-risk", "sig-walking-speed"],
    capabilities: ["cap-gait", "cap-temporal", "cap-risk", "cap-explain"],
    outcomes: ["out-early-risk", "out-fall-awareness"],
  },
  rehabtrack: {
    signals: ["sig-rehab-progress", "sig-step-symmetry", "sig-stride-variability"],
    capabilities: ["cap-gait", "cap-temporal", "cap-explain"],
    outcomes: ["out-rehab"],
  },
  sportsmotion: {
    signals: ["sig-step-symmetry", "sig-stride-variability", "sig-posture", "sig-cadence"],
    capabilities: ["cap-pose", "cap-gait", "cap-risk", "cap-temporal"],
    outcomes: ["out-performance"],
  },
  watchcare: {
    signals: ["sig-walking-speed", "sig-cadence", "sig-mobility-decline", "sig-fall-risk", "sig-stride-variability"],
    capabilities: ["cap-fusion", "cap-temporal", "cap-risk", "cap-edge"],
    outcomes: ["out-early-risk", "out-fall-awareness"],
  },
  neuromotion: {
    signals: ["sig-tremor-neuro", "sig-step-symmetry", "sig-balance", "sig-stride-variability"],
    capabilities: ["cap-gait", "cap-temporal", "cap-explain"],
    outcomes: ["out-assessment", "out-early-risk"],
  },
  orthomotion: {
    signals: ["sig-posture", "sig-step-symmetry", "sig-walking-speed"],
    capabilities: ["cap-pose", "cap-gait", "cap-explain"],
    outcomes: ["out-rehab", "out-assessment"],
  },
  seniorcare: {
    signals: ["sig-mobility-decline", "sig-balance", "sig-walking-speed", "sig-fall-risk"],
    capabilities: ["cap-gait", "cap-temporal", "cap-risk"],
    outcomes: ["out-early-risk", "out-fall-awareness"],
  },
  pediatricmotion: {
    signals: ["sig-step-symmetry", "sig-posture"],
    capabilities: ["cap-pose", "cap-gait", "cap-temporal"],
    outcomes: ["out-assessment"],
  },
  prostheticfit: {
    signals: ["sig-step-symmetry", "sig-walking-speed", "sig-posture"],
    capabilities: ["cap-gait", "cap-explain"],
    outcomes: ["out-assessment", "out-rehab"],
  },
  remotecare: {
    signals: ["sig-rehab-progress", "sig-walking-speed", "sig-mobility-decline"],
    capabilities: ["cap-gait", "cap-temporal", "cap-explain"],
    outcomes: ["out-rehab"],
  },
  clinicaltrials: {
    signals: ["sig-stride-variability", "sig-walking-speed", "sig-cadence", "sig-rehab-progress"],
    capabilities: ["cap-gait", "cap-temporal", "cap-explain"],
    outcomes: ["out-assessment", "out-rehab"],
  },
  suspiciousmotion: {
    signals: ["sig-behaviour", "sig-trajectory"],
    capabilities: ["cap-har", "cap-anomaly", "cap-privacy", "cap-edge"],
    outcomes: ["out-realtime", "out-safer-spaces", "out-privacy"],
  },
  crowdsense: {
    signals: ["sig-crowd-flow", "sig-trajectory"],
    capabilities: ["cap-trajectory", "cap-anomaly", "cap-har"],
    outcomes: ["out-safer-spaces", "out-realtime"],
  },
  industrialsafety: {
    signals: ["sig-fall-risk", "sig-behaviour", "sig-trajectory"],
    capabilities: ["cap-har", "cap-anomaly", "cap-risk", "cap-edge"],
    outcomes: ["out-realtime", "out-safer-spaces"],
  },
  privacyguard: {
    signals: [],
    capabilities: ["cap-privacy", "cap-explain"],
    outcomes: ["out-privacy"],
  },
  campusshield: {
    signals: ["sig-behaviour", "sig-trajectory", "sig-fall-risk"],
    capabilities: ["cap-anomaly", "cap-har", "cap-privacy"],
    outcomes: ["out-safer-spaces", "out-realtime"],
  },
  forensicsearch: {
    signals: ["sig-trajectory", "sig-gait-identity", "sig-behaviour"],
    capabilities: ["cap-reid", "cap-trajectory", "cap-biometrics"],
    outcomes: ["out-safer-spaces"],
  },
  reid: {
    signals: ["sig-gait-identity", "sig-trajectory"],
    capabilities: ["cap-reid", "cap-biometrics", "cap-temporal"],
    outcomes: ["out-identity", "out-safer-spaces"],
  },
  accessmotion: {
    signals: ["sig-gait-identity"],
    capabilities: ["cap-biometrics", "cap-edge", "cap-privacy"],
    outcomes: ["out-identity"],
  },
  eventshield: {
    signals: ["sig-crowd-flow", "sig-trajectory", "sig-behaviour"],
    capabilities: ["cap-trajectory", "cap-anomaly", "cap-risk"],
    outcomes: ["out-realtime", "out-safer-spaces"],
  },
  retailguard: {
    signals: ["sig-behaviour", "sig-crowd-flow", "sig-trajectory"],
    capabilities: ["cap-anomaly", "cap-har"],
    outcomes: ["out-safer-spaces", "out-realtime"],
  },
  watchlist: {
    signals: ["sig-gait-identity"],
    capabilities: ["cap-biometrics", "cap-reid", "cap-privacy"],
    outcomes: ["out-identity", "out-privacy"],
  },
};

// Research → capability links, following the publications' own keywords.
// Exported so the site-wide evidence layer (src/data/evidence.ts) can resolve
// which capabilities have peer-reviewed backing without restating the mapping.
export const RESEARCH_MAP: Record<string, string[]> = {
  "res-gait-biometrics": ["cap-biometrics", "cap-gait", "cap-reid"],
  "res-pose-gait": ["cap-pose", "cap-gait"],
  "res-privacy": ["cap-privacy"],
  /*
   * Patent 402202 is about running covariate-robust gait analysis on
   * constrained hardware. Mapping it to cap-biometrics as well pulled the
   * whole identity group (ForensicSearch, ReID, Watchlist) in behind a patent
   * that does not address those products — the biometrics claim belongs to
   * res-gait-biometrics, which cites it. Edge deployment only.
   */
  "res-edge": ["cap-edge"],
};

// ============================================================================
// COMPARISON FACTS — curated from product descriptions & the privacy layer
// ----------------------------------------------------------------------------
// ORDER MATTERS HERE. `buildRelationships()` below runs at module evaluation
// and now calls `sourcesForProduct`, which calls `systemFactsFor`, which reads
// these three consts. They used to sit after the relationship build, which was
// harmless while nothing at eval time touched them — and became a
// "Cannot access 'MOBILITY_FACTS' before initialization" the moment capture
// sources joined the graph. TypeScript cannot see that: a `const` read from
// inside a hoisted function body typechecks fine and throws at run time. So
// they are placed above the build, and this note is why they must stay there.
// ============================================================================

const MOBILITY_FACTS: SystemFacts = {
  input: "Short walking video (standard camera)",
  environment: "Clinics, hospitals, care settings",
  deployment: "Web dashboard, PDF reports",
  privacy: "Consent-based clinical capture",
};

const SECURE_FACTS: SystemFacts = {
  input: "CCTV / camera feeds",
  environment: "Campuses, cities, industry, events",
  deployment: "Real-time video analytics, operator alerts",
  privacy: "PrivacyGuard: skeleton-only analytics, face blur, audit logs",
};

const FACT_OVERRIDES: Record<string, Partial<SystemFacts>> = {
  watchcare: {
    input: "Smartwatch & wearable sensor signals",
    environment: "Everyday life — home, outdoors, work",
    deployment: "Mobile + web caregiver dashboard",
  },
  remotecare: {
    input: "Guided walking video captured at home",
    environment: "Home care & telehealth",
    deployment: "Clinician dashboard with patient timelines",
  },
  clinicaltrials: {
    environment: "Research studies & clinical trials",
    deployment: "Study dashboards, gait-measure export",
  },
  forensicsearch: {
    input: "Uploaded CCTV footage (post-event)",
    deployment: "Post-event investigation workspace",
  },
  accessmotion: {
    input: "Access-point cameras alongside existing credentials",
    environment: "Data centers, labs, high-security offices",
  },
  privacyguard: {
    input: "Applies to all connected camera analytics",
    environment: "Every SecureVision deployment",
    deployment: "Policy layer: retention, roles, audit logs",
  },
  watchlist: {
    environment: "Lawfully authorized deployments only",
    privacy: "Policy + consent logs, auditability, legal governance",
  },
};

export function systemFactsFor(productId: string): SystemFacts {
  const product = allProducts.find((p) => p.id === productId);
  const base =
    product?.vertical === "securevision" ? SECURE_FACTS : MOBILITY_FACTS;
  return { ...base, ...FACT_OVERRIDES[productId] };
}


// ============================================================================
// RELATIONSHIPS
// ============================================================================

function buildRelationships(): GaitscapeRelationship[] {
  const rels: GaitscapeRelationship[] = [];

  for (const v of verticalNodes) {
    rels.push({ source: v.id, target: CORE_ID, type: "belongs-to" });
  }

  for (const p of allProducts) {
    rels.push({
      source: p.id,
      target: p.vertical,
      type: "belongs-to",
      evidence: p.name,
    });
    /* Which capture sources this module can work from — the answer to
       "click CCTV, show me what could use it". Derived, so a module whose
       documented input changes moves on the map without anyone editing it. */
    for (const source of sourcesForProduct(p.id)) {
      rels.push({
        source: p.id,
        target: inputNodeId(source),
        type: "captured-by",
        evidence: `${p.short} input: ${systemFactsFor(p.id).input}`,
      });
    }
    const map = PRODUCT_MAP[p.id];
    if (!map) continue;
    for (const s of map.signals) {
      rels.push({
        source: p.id,
        target: s,
        type: "senses",
        evidence: `${p.short} outputs: ${p.outputs.slice(0, 3).join(", ")}`,
      });
    }
    for (const c of map.capabilities) {
      rels.push({
        source: p.id,
        target: c,
        type: "powered-by",
        evidence: `${p.label} — ${p.description}`,
      });
    }
    for (const o of map.outcomes) {
      rels.push({
        source: p.id,
        target: o,
        type: "produces",
        evidence: p.headline,
      });
    }
  }

  for (const u of industryUseCases) {
    for (const pid of u.productIds) {
      rels.push({
        source: pid,
        target: `dom-${u.id}`,
        type: "serves",
        evidence: `${u.industry}: ${u.outcome}`,
      });
    }
  }

  for (const [resId, caps] of Object.entries(RESEARCH_MAP)) {
    const res = nodeById.get(resId);
    const pubs = (res?.publicationIds ?? [])
      .map((id) => allPublications.find((p) => p.id === id)?.title)
      .filter(Boolean);
    for (const cap of caps) {
      rels.push({
        source: cap,
        target: resId,
        type: "grounded-in",
        evidence: pubs[0],
      });
    }
  }

  return rels;
}

export const gaitscapeRelationships: GaitscapeRelationship[] =
  buildRelationships();

// ============================================================================
// SHARED HELPERS
// ============================================================================

export const NODE_TYPE_LABEL: Record<GaitscapeNode["type"], string> = {
  core: "Core",
  vertical: "Vertical",
  input: "Capture source",
  signal: "Movement signal",
  capability: "AI capability",
  product: "Product",
  domain: "Application domain",
  research: "Research",
  outcome: "Outcome",
};

export const REL_TYPE_LABEL: Record<GaitscapeRelationship["type"], string> = {
  "belongs-to": "belongs to",
  "captured-by": "captured by",
  senses: "reads signal",
  "powered-by": "powered by",
  serves: "serves",
  produces: "produces",
  "grounded-in": "grounded in",
  expresses: "expresses",
};

export const productMapFor = (id: string) => PRODUCT_MAP[id];
