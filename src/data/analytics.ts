// ============================================================================
// MOVEMENT-INTELLIGENCE ANALYTICS MODEL
// ----------------------------------------------------------------------------
// One relationship layer for every interactive analytical surface on the site:
//
//   /use-cases   Environment Intelligence Explorer
//   /products    Find Your GaitAI Stack, Intelligence Coverage Map, Compare
//   /research    Evidence Explorer
//   /movement-lab Movement Signal Lab
//   /            "What can movement tell us?" teaser
//
// NOTHING HERE IS NEW CONTENT. Every entity and every relationship is read
// out of data the repository already carries:
//
//   products.ts ................ the 23 modules, their outputs and users, and
//                                the 17 environments with their product mixes
//   gaitscape/graph.ts ......... signal / capability / outcome nodes and the
//                                documented senses · powered-by · serves ·
//                                produces relationships, plus systemFactsFor()
//   evidence.ts ................ research areas, and which capability each
//                                published record actually informs
//   usecase-facets.ts .......... per-environment output chips
//   usecase-details.ts ......... deployment depth per environment
//   responsible-use.ts ......... the canonical responsible-use sentence
//
// GaitScape remains the master ecosystem experience and the master taxonomy.
// This module adds no node, no edge and no claim — it adds *query shapes*
// (objectives, capture sources, coverage states, stack recommendations) over
// the same graph, so five analytical surfaces cannot drift apart.
//
// THE TWO VOCABULARIES THIS MODULE INTRODUCES
// Objectives and capture sources are named *views* over existing graph ids,
// not new facts. Each objective declares the signals / outcomes / capabilities
// that define it, and its product set is then derived. Each capture source is
// matched against the product's own documented input string. Both are stated
// as data below so the derivation is auditable rather than hidden in a
// component.
//
// WHAT THIS MODULE MUST NEVER DO
// No relevance scores, no confidence, no accuracy, no maturity, no deployment
// counts. Relationships are discrete and documented: a module either is in an
// environment's documented mix or it is not.
// ============================================================================

import {
  allProducts,
  industryUseCases,
  mobilityProducts,
  secureProducts,
  type GaitProduct,
  type UseCaseEntry,
  type Vertical,
} from "@/data/products";
import {
  gaitscapeNodes,
  gaitscapeRelationships,
  nodeById,
  systemFactsFor,
} from "@/data/gaitscape/graph";
import { evidenceForProduct, researchAreas } from "@/data/evidence";
import { outputChipsFor } from "@/data/usecase-facets";
import { useCaseDetails } from "@/data/usecase-details";
import {
  RESPONSIBLE_USE_CARE,
  RESPONSIBLE_USE_CONTROLS,
  RESPONSIBLE_USE_SECURE,
} from "@/data/responsible-use";

// ============================================================================
// 1 · RELATIONSHIP INDEXES over the GaitScape graph
// ============================================================================

type RelationType = (typeof gaitscapeRelationships)[number]["type"];

/** source id → target ids for one relation type. */
function indexBySource(type: RelationType): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const rel of gaitscapeRelationships) {
    if (rel.type !== type) continue;
    const list = map.get(rel.source);
    if (list) list.push(rel.target);
    else map.set(rel.source, [rel.target]);
  }
  return map;
}

/** target id → source ids for one relation type. */
function indexByTarget(type: RelationType): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const rel of gaitscapeRelationships) {
    if (rel.type !== type) continue;
    const list = map.get(rel.target);
    if (list) list.push(rel.source);
    else map.set(rel.target, [rel.source]);
  }
  return map;
}

const productSignals = indexBySource("senses");
const productCapabilities = indexBySource("powered-by");
const productOutcomes = indexBySource("produces");
const capabilityProducts = indexByTarget("powered-by");
const signalProducts = indexByTarget("senses");
const outcomeProducts = indexByTarget("produces");

const titleOf = (id: string) => nodeById.get(id)?.title ?? id;

/** Node ids → their titles, in graph order, skipping anything unresolved. */
const titlesOf = (ids: readonly string[]): string[] =>
  ids.flatMap((id) => {
    const node = nodeById.get(id);
    return node ? [node.title] : [];
  });

export const capabilityNodes = gaitscapeNodes.filter(
  (node) => node.type === "capability",
);
export const signalNodes = gaitscapeNodes.filter(
  (node) => node.type === "signal",
);
export const outcomeNodes = gaitscapeNodes.filter(
  (node) => node.type === "outcome",
);

// Counts every analytical header uses. Derived — never written by hand, so a
// new module or environment cannot leave a stat stale.
export const ENVIRONMENT_COUNT = industryUseCases.length;
export const MODULE_COUNT = allProducts.length;
export const FAMILY_COUNT = 2;
export const CAPABILITY_COUNT = capabilityNodes.length;
export const SIGNAL_COUNT = signalNodes.length;

export const FAMILY_LABEL: Record<Vertical, string> = {
  mobilitycare: "MobilityCare",
  securevision: "SecureVision",
};

// ============================================================================
// 2 · CAPTURE SOURCES — "what signals are available?"
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
// ============================================================================

export type CaptureSource =
  | "video"
  | "cctv"
  | "wearable"
  | "mobile"
  | "pose"
  | "multi";

export interface CaptureSourceDef {
  id: CaptureSource;
  label: string;
  /** What the reader actually has to hand. */
  note: string;
}

export const CAPTURE_SOURCES: CaptureSourceDef[] = [
  { id: "video", label: "Walking video", note: "A short clip from any standard camera" },
  { id: "cctv", label: "CCTV / fixed camera", note: "An existing camera feed in the space" },
  { id: "wearable", label: "Wearable", note: "Smartwatch or IMU signals" },
  { id: "mobile", label: "Mobile", note: "Capture on a phone, review on mobile" },
  { id: "pose", label: "Pose stream", note: "Skeleton landmarks rather than pixels" },
  { id: "multi", label: "Multiple sources", note: "More than one of the above, together" },
];

export const CAPTURE_SOURCE_LABEL: Record<CaptureSource, string> =
  Object.fromEntries(
    CAPTURE_SOURCES.map((source) => [source.id, source.label]),
  ) as Record<CaptureSource, string>;

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
  const capabilities = productCapabilities.get(productId) ?? [];
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

// ============================================================================
// 3 · OBJECTIVES — "what do you want to understand?"
// ----------------------------------------------------------------------------
// Each objective names the graph ids that define it. A module matches when it
// senses one of the signals, produces one of the outcomes, or is powered by
// one of the capabilities — and, where an objective needs to be finer than the
// graph is, when one of its own documented outputs matches the pattern.
//
// Output patterns are matched against `product.outputs`, which is the module's
// own list of what it produces. That keeps the finer objectives (density vs
// crowd flow, worker safety vs candidate anomalies) traceable to a string the
// product record already carries.
// ============================================================================

export interface ObjectiveDef {
  id: string;
  label: string;
  /** One line naming the question, for the explorer's result panel. */
  question: string;
  family: Vertical;
  signals?: string[];
  outcomes?: string[];
  capabilities?: string[];
  /** Optional narrowing against the module's own documented outputs. */
  outputPattern?: RegExp;
}

export const OBJECTIVES: ObjectiveDef[] = [
  {
    id: "mobility",
    label: "Mobility",
    question: "How is this person moving, and is that changing?",
    family: "mobilitycare",
    signals: ["sig-walking-speed", "sig-mobility-decline"],
    outcomes: ["out-assessment", "out-early-risk"],
  },
  {
    id: "recovery",
    label: "Recovery",
    question: "Is therapy or recovery actually progressing?",
    family: "mobilitycare",
    signals: ["sig-rehab-progress"],
    outcomes: ["out-rehab"],
  },
  {
    id: "fall-risk",
    label: "Fall-risk indicators",
    question: "Which movement patterns are associated with elevated risk?",
    family: "mobilitycare",
    signals: ["sig-fall-risk", "sig-balance", "sig-stride-variability"],
    outcomes: ["out-fall-awareness"],
  },
  {
    id: "movement-quality",
    label: "Movement quality",
    question: "How well is this movement executed — symmetry, posture, rhythm?",
    family: "mobilitycare",
    signals: ["sig-step-symmetry", "sig-posture", "sig-cadence"],
    outcomes: ["out-assessment"],
  },
  {
    id: "performance",
    label: "Performance",
    question: "What do mechanics and fatigue look like for this athlete?",
    family: "mobilitycare",
    outcomes: ["out-performance"],
  },
  {
    id: "crowd-flow",
    label: "Crowd flow",
    question: "How are people moving through this space?",
    family: "securevision",
    signals: ["sig-crowd-flow"],
    outputPattern: /flow|queue|bottleneck|dispersal|evacuation/i,
  },
  {
    id: "density",
    label: "Density",
    question: "Where is this space filling up, and against what capacity?",
    family: "securevision",
    signals: ["sig-crowd-flow"],
    outputPattern: /densit|heatmap|overload/i,
  },
  {
    id: "anomalies",
    label: "Candidate anomalies",
    question: "Which movement events are worth an operator's attention?",
    family: "securevision",
    signals: ["sig-behaviour"],
    capabilities: ["cap-anomaly"],
  },
  {
    id: "worker-safety",
    label: "Worker safety",
    question: "Are people safe in the zones they are moving through?",
    family: "securevision",
    signals: ["sig-fall-risk", "sig-behaviour"],
    outputPattern: /worker|slip|restricted|emergency|staff safety|fall detection/i,
  },
  {
    id: "investigation",
    label: "Cross-camera investigation",
    question: "Where did this movement go across the camera estate?",
    family: "securevision",
    capabilities: ["cap-reid"],
    outputPattern: /cross-camera|camera-wise|trail|search|incident|reconstruction/i,
  },
  {
    id: "privacy",
    label: "Privacy-aware analytics",
    question: "How much can be understood without identifying anyone?",
    family: "securevision",
    capabilities: ["cap-privacy"],
  },
];

export const objectiveById = new Map(
  OBJECTIVES.map((objective) => [objective.id, objective]),
);

/** Module ids matching an objective, in canonical product order. */
export function productsForObjective(objectiveId: string): string[] {
  const objective = objectiveById.get(objectiveId);
  if (!objective) return [];

  const ids = new Set<string>();
  for (const signal of objective.signals ?? []) {
    for (const id of signalProducts.get(signal) ?? []) ids.add(id);
  }
  for (const outcome of objective.outcomes ?? []) {
    for (const id of outcomeProducts.get(outcome) ?? []) ids.add(id);
  }
  for (const capability of objective.capabilities ?? []) {
    for (const id of capabilityProducts.get(capability) ?? []) ids.add(id);
  }

  return allProducts
    .filter((product) => {
      if (!ids.has(product.id)) return false;
      if (product.vertical !== objective.family) return false;
      if (!objective.outputPattern) return true;
      return product.outputs.some((output) =>
        objective.outputPattern!.test(output),
      );
    })
    .map((product) => product.id);
}

const objectiveProducts = new Map(
  OBJECTIVES.map((objective) => [
    objective.id,
    new Set(productsForObjective(objective.id)),
  ]),
);

// ============================================================================
// 4 · PRIVACY POSTURE
// ----------------------------------------------------------------------------
// Four labels over the ONE canonical responsible-use sentence. Each carries
// the clause it stands for, so an analytical panel can never state a stronger
// control than /legal/security/ does. The wording stays architectural — what
// the platform is designed to support — because nothing in this repository
// documents an operational deployment.
// ============================================================================

export interface PrivacyPosture {
  label: string;
  /** The clause of RESPONSIBLE_USE_CONTROLS this label stands for. */
  clause: string;
}

export const PRIVACY_POSTURE: PrivacyPosture[] = [
  {
    label: "Consent-based capture",
    clause: "Designed to support consent-based capture.",
  },
  {
    label: "Privacy-aware processing",
    clause: "Skeleton-only processing modes where configured.",
  },
  {
    label: "Configurable retention",
    clause: "Configurable retention, set per deployment.",
  },
  {
    label: "Role-based access",
    clause: "Role-based access with activity logging.",
  },
];

/** The canonical sentence, for the note under any privacy panel. */
export const PRIVACY_NOTE = RESPONSIBLE_USE_CONTROLS;

export const responsibleUseFor = (family: Vertical) =>
  family === "securevision" ? RESPONSIBLE_USE_SECURE : RESPONSIBLE_USE_CARE;

// ============================================================================
// 5 · THE PRODUCT VIEW
// ============================================================================

export interface AnalyticsProduct {
  id: string;
  short: string;
  label: string;
  description: string;
  family: Vertical;
  href: string;
  /** systemFactsFor(id).input — what goes in. */
  input: string;
  environmentContext: string;
  delivery: string;
  sources: CaptureSource[];
  /** Graph ids, for joins. */
  capabilityIds: string[];
  signalIds: string[];
  outcomeIds: string[];
  /** Display titles for the same, in graph order. */
  capabilities: string[];
  signals: string[];
  outcomes: string[];
  /** The module's own documented outputs. */
  outputs: string[];
  users: string[];
  /** Environment ids whose documented product mix includes this module. */
  environmentIds: string[];
  /** Research areas backing any capability this module is built on. */
  researchAreaIds: string[];
  /** Objectives this module matches. */
  objectiveIds: string[];
  /** Modules documented alongside it, most shared environments first. */
  relatedProductIds: string[];
}

const environmentsByProduct = (() => {
  const map = new Map<string, string[]>();
  for (const environment of industryUseCases) {
    for (const productId of environment.productIds) {
      const list = map.get(productId);
      if (list) list.push(environment.id);
      else map.set(productId, [environment.id]);
    }
  }
  return map;
})();

/**
 * Modules that appear in the same documented environment mixes, ranked by how
 * many environments they share. This is a co-deployment relationship read off
 * `industryUseCases` — not a similarity score.
 */
function relatedProductsFor(productId: string): string[] {
  const mine = new Set(environmentsByProduct.get(productId) ?? []);
  if (mine.size === 0) return [];

  const shared = new Map<string, number>();
  for (const environment of industryUseCases) {
    if (!mine.has(environment.id)) continue;
    for (const other of environment.productIds) {
      if (other === productId) continue;
      shared.set(other, (shared.get(other) ?? 0) + 1);
    }
  }
  return Array.from(shared.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

function toAnalyticsProduct(product: GaitProduct): AnalyticsProduct {
  const facts = systemFactsFor(product.id);
  const capabilityIds = productCapabilities.get(product.id) ?? [];
  const signalIds = productSignals.get(product.id) ?? [];
  const outcomeIds = productOutcomes.get(product.id) ?? [];

  const researchAreaIds = Array.from(
    new Set(
      evidenceForProduct(product.id).flatMap((entry) =>
        entry.areas.map((area) => area.id),
      ),
    ),
  );

  return {
    id: product.id,
    short: product.short,
    label: product.label,
    description: product.description,
    family: product.vertical,
    href: `/${product.vertical}/${product.id}/`,
    input: facts.input,
    environmentContext: facts.environment,
    delivery: facts.deployment,
    sources: sourcesForProduct(product.id),
    capabilityIds,
    signalIds,
    outcomeIds,
    capabilities: titlesOf(capabilityIds),
    signals: titlesOf(signalIds),
    outcomes: titlesOf(outcomeIds),
    outputs: product.outputs,
    users: product.users,
    environmentIds: environmentsByProduct.get(product.id) ?? [],
    researchAreaIds,
    objectiveIds: OBJECTIVES.filter((objective) =>
      objectiveProducts.get(objective.id)?.has(product.id),
    ).map((objective) => objective.id),
    relatedProductIds: relatedProductsFor(product.id),
  };
}

export const analyticsProducts: AnalyticsProduct[] =
  allProducts.map(toAnalyticsProduct);

export const analyticsProductById = new Map(
  analyticsProducts.map((product) => [product.id, product]),
);

export const analyticsProductsFor = (ids: readonly string[]) =>
  ids.flatMap((id) => {
    const product = analyticsProductById.get(id);
    return product ? [product] : [];
  });

// ============================================================================
// 6 · THE ENVIRONMENT VIEW
// ============================================================================

/**
 * Column-head abbreviations of the environment names. Presentation metadata
 * only — each is a shortening of the record's own `industry` string so a
 * 17-column matrix header stays readable; nothing is renamed anywhere else.
 */
const SHORT_NAME: Record<string, string> = {
  physio: "Physio",
  hospitals: "Hospitals",
  sports: "Sports",
  elderly: "Elderly care",
  neuro: "Neurology",
  homecare: "Home care",
  airports: "Transit",
  smartcities: "Smart city",
  campuses: "Campuses",
  factories: "Factories",
  retail: "Retail",
  events: "Events",
  fitness: "Fitness",
  schools: "Schools",
  prosthetics: "Prosthetics",
  insurance: "Insurance",
  trials: "Trials",
};

export interface AnalyticsEnvironment {
  id: string;
  name: string;
  /** Abbreviated name, for matrix column heads and chips. */
  shortName: string;
  family: Vertical;
  problem: string;
  /** What the documented mix produces here — never a measured result. */
  outputSummary: string;
  /** industryUseCases.productIds — the documented mix. */
  productIds: string[];
  /** Objectives reachable in this environment, family-ordered. */
  objectiveIds: string[];
  /** Capture sources the mix can work from. */
  sources: CaptureSource[];
  /** Movement signals the mix reads, in graph order. */
  signalIds: string[];
  signals: string[];
  /** Capabilities the mix applies. */
  capabilityIds: string[];
  capabilities: string[];
  /** Short output chips from usecase-facets, then the record's own list. */
  outputs: string[];
  /** Deployment-depth route when the environment has a detail page. */
  detailSlug?: string;
  /** Signals wording from the deployment record, when present. */
  detailSignals?: string[];
}

function toAnalyticsEnvironment(entry: UseCaseEntry): AnalyticsEnvironment {
  const products = analyticsProductsFor(entry.productIds);
  const detail = useCaseDetails.find((item) => item.caseId === entry.id);

  const union = <T,>(pick: (product: AnalyticsProduct) => T[]): T[] =>
    Array.from(new Set(products.flatMap(pick)));

  const capabilityIds = capabilityNodes
    .map((node) => node.id)
    .filter((id) => products.some((product) => product.capabilityIds.includes(id)));
  const signalIds = signalNodes
    .map((node) => node.id)
    .filter((id) => products.some((product) => product.signalIds.includes(id)));

  return {
    id: entry.id,
    name: entry.industry,
    shortName: SHORT_NAME[entry.id] ?? entry.industry.split(/[,&]/)[0].trim(),
    family: entry.vertical,
    problem: entry.problem,
    outputSummary: entry.outcome,
    productIds: entry.productIds,
    objectiveIds: OBJECTIVES.filter((objective) =>
      entry.productIds.some((id) => objectiveProducts.get(objective.id)?.has(id)),
    ).map((objective) => objective.id),
    sources: CAPTURE_SOURCES.map((source) => source.id).filter((id) =>
      products.some((product) => product.sources.includes(id)),
    ),
    signalIds,
    signals: titlesOf(signalIds),
    capabilityIds,
    capabilities: titlesOf(capabilityIds),
    outputs: outputChipsFor(entry.id).length
      ? outputChipsFor(entry.id)
      : union((product) => product.outputs).slice(0, 6),
    detailSlug: detail?.slug,
    detailSignals: detail?.signals,
  };
}

export const analyticsEnvironments: AnalyticsEnvironment[] =
  industryUseCases.map(toAnalyticsEnvironment);

export const analyticsEnvironmentById = new Map(
  analyticsEnvironments.map((environment) => [environment.id, environment]),
);

// ============================================================================
// 7 · THE CAPABILITY VIEW
// ============================================================================

export interface AnalyticsCapability {
  id: string;
  title: string;
  description: string;
  /** Modules documented as powered by it. */
  productIds: string[];
  /** Environments whose documented mix includes one of those modules. */
  environmentIds: string[];
  /** Capture sources those modules work from. */
  sources: CaptureSource[];
  /** Research areas that inform it, from evidence.ts. */
  researchAreaIds: string[];
}

const researchByCapability = (() => {
  const map = new Map<string, string[]>();
  for (const area of researchAreas) {
    for (const capability of area.capabilities) {
      const list = map.get(capability.id);
      if (list) list.push(area.id);
      else map.set(capability.id, [area.id]);
    }
  }
  return map;
})();

export const analyticsCapabilities: AnalyticsCapability[] = capabilityNodes.map(
  (node) => {
    const productIds = allProducts
      .filter((product) =>
        (capabilityProducts.get(node.id) ?? []).includes(product.id),
      )
      .map((product) => product.id);

    return {
      id: node.id,
      title: node.title,
      description: node.shortDescription,
      productIds,
      environmentIds: industryUseCases
        .filter((environment) =>
          environment.productIds.some((id) => productIds.includes(id)),
        )
        .map((environment) => environment.id),
      sources: CAPTURE_SOURCES.map((source) => source.id).filter((id) =>
        productIds.some((productId) =>
          analyticsProductById.get(productId)?.sources.includes(id),
        ),
      ),
      researchAreaIds: researchByCapability.get(node.id) ?? [],
    };
  },
);

export const analyticsCapabilityById = new Map(
  analyticsCapabilities.map((capability) => [capability.id, capability]),
);

// ============================================================================
// 8 · COVERAGE — capability × environment, as three discrete states
// ----------------------------------------------------------------------------
//   primary     the capability powers a module in this environment's
//               documented product mix
//   supporting  it powers no module in that mix, but does power modules in the
//               same product family — available here, not part of the
//               documented mix
//   none        no module in that family uses it
//
// Deliberately not a score. The repository documents which modules an
// environment's record lists, and nothing finer; a number here would be an
// invention.
// ============================================================================

export type CoverageState = "primary" | "supporting" | "none";

export const COVERAGE_LABEL: Record<CoverageState, string> = {
  primary: "Primary",
  supporting: "Supporting",
  none: "Not used",
};

export const COVERAGE_MEANING: Record<CoverageState, string> = {
  primary: "Powers a module in this environment's documented mix",
  supporting: "Available in this product family, not in the documented mix",
  none: "No module in this family uses this capability",
};

export interface CoverageCell {
  state: CoverageState;
  /** Modules in the environment's mix that use this capability. */
  productIds: string[];
  /** Signals those modules read — the "what would this see here" answer. */
  signals: string[];
}

export function coverageFor(
  capabilityId: string,
  environmentId: string,
): CoverageCell {
  const environment = analyticsEnvironmentById.get(environmentId);
  const capability = analyticsCapabilityById.get(capabilityId);
  if (!environment || !capability) {
    return { state: "none", productIds: [], signals: [] };
  }

  const inMix = environment.productIds.filter((id) =>
    capability.productIds.includes(id),
  );
  if (inMix.length > 0) {
    const signalIds = signalNodes
      .map((node) => node.id)
      .filter((signalId) =>
        inMix.some((productId) =>
          analyticsProductById.get(productId)?.signalIds.includes(signalId),
        ),
      );
    return { state: "primary", productIds: inMix, signals: titlesOf(signalIds) };
  }

  const inFamily = capability.productIds.filter(
    (id) => analyticsProductById.get(id)?.family === environment.family,
  );
  return {
    state: inFamily.length > 0 ? "supporting" : "none",
    productIds: inFamily,
    signals: [],
  };
}

// ============================================================================
// 9 · STACK RECOMMENDATION
// ----------------------------------------------------------------------------
// Deterministic and explainable. The candidate set is the environment's own
// documented product mix, optionally widened to the objective's modules in
// the same family. Ordering is by how many of the reader's three answers a
// module actually satisfies, and the panel states the reason in words rather
// than a score:
//
//   in the environment's documented mix   ·   matches the objective
//   works from a source you have
//
// Ties fall back to canonical product order, so the same three answers always
// produce the same stack.
// ============================================================================

export interface StackMatchReason {
  inEnvironment: boolean;
  matchesObjective: boolean;
  matchesSource: boolean;
}

export interface StackEntry {
  product: AnalyticsProduct;
  reason: StackMatchReason;
}

export interface StackRecommendation {
  environment?: AnalyticsEnvironment;
  objective?: ObjectiveDef;
  sources: CaptureSource[];
  primary?: StackEntry;
  supporting: StackEntry[];
  /** Union of the recommended modules' capabilities / outputs / signals. */
  capabilities: string[];
  signals: string[];
  outputs: string[];
  /** Environments the recommended modules are documented in. */
  environments: string[];
  /** Capture sources the recommended modules actually work from. */
  stackSources: CaptureSource[];
  /** Research areas informing any recommended module's capabilities. */
  researchAreaIds: string[];
  family?: Vertical;
  /** Set when the answers produced nothing — the honest empty state. */
  emptyReason?: string;
}

export interface StackQuery {
  environmentId?: string;
  objectiveId?: string;
  sources?: CaptureSource[];
}

const SUPPORTING_LIMIT = 3;

export function recommendStack(query: StackQuery): StackRecommendation {
  const environment = query.environmentId
    ? analyticsEnvironmentById.get(query.environmentId)
    : undefined;
  const objective = query.objectiveId
    ? objectiveById.get(query.objectiveId)
    : undefined;
  const sources = query.sources ?? [];
  const family = environment?.family ?? objective?.family;

  const empty = (emptyReason?: string): StackRecommendation => ({
    environment,
    objective,
    sources,
    supporting: [],
    capabilities: [],
    signals: [],
    outputs: [],
    environments: [],
    stackSources: [],
    researchAreaIds: [],
    family,
    emptyReason,
  });

  if (!environment && !objective) return empty();

  // Candidates: the environment's documented mix, plus the objective's modules
  // in the same family. Never a module from another family.
  const candidateIds = new Set<string>();
  if (environment) environment.productIds.forEach((id) => candidateIds.add(id));
  if (objective) {
    for (const id of objectiveProducts.get(objective.id) ?? []) {
      if (!family || analyticsProductById.get(id)?.family === family) {
        candidateIds.add(id);
      }
    }
  }

  const scored: StackEntry[] = analyticsProducts
    .filter((product) => candidateIds.has(product.id))
    .map((product) => ({
      product,
      reason: {
        inEnvironment: Boolean(
          environment && environment.productIds.includes(product.id),
        ),
        matchesObjective: Boolean(
          objective && product.objectiveIds.includes(objective.id),
        ),
        matchesSource:
          sources.length === 0 ||
          sources.some((source) => product.sources.includes(source)),
      },
    }))
    // A module that cannot work from any source the reader has is not a
    // recommendation, so it is dropped rather than ranked low.
    .filter((entry) => entry.reason.matchesSource);

  if (scored.length === 0) {
    return empty(
      sources.length > 0
        ? "No module in this environment's documented mix works from the sources selected. Widen the sources, or talk to us about the capture setup."
        : "This combination has no documented module mix yet.",
    );
  }

  const weight = (entry: StackEntry) =>
    (entry.reason.matchesObjective ? 2 : 0) +
    (entry.reason.inEnvironment ? 1 : 0);

  const ordered = [...scored].sort((a, b) => weight(b) - weight(a));
  const [primary, ...rest] = ordered;
  const supporting = rest.slice(0, SUPPORTING_LIMIT);
  const chosen = [primary, ...supporting];

  const orderedUnion = (
    nodes: typeof capabilityNodes,
    pick: (product: AnalyticsProduct) => string[],
  ) =>
    nodes
      .map((node) => node.id)
      .filter((id) => chosen.some((entry) => pick(entry.product).includes(id)))
      .map(titleOf);

  return {
    environment,
    objective,
    sources,
    primary,
    supporting,
    capabilities: orderedUnion(capabilityNodes, (p) => p.capabilityIds),
    signals: orderedUnion(signalNodes, (p) => p.signalIds),
    outputs: Array.from(
      new Set(chosen.flatMap((entry) => entry.product.outputs)),
    ),
    environments: industryUseCases
      .filter((item) =>
        chosen.some((entry) => entry.product.environmentIds.includes(item.id)),
      )
      .map((item) => item.industry),
    stackSources: CAPTURE_SOURCES.map((source) => source.id).filter((id) =>
      chosen.some((entry) => entry.product.sources.includes(id)),
    ),
    researchAreaIds: Array.from(
      new Set(chosen.flatMap((entry) => entry.product.researchAreaIds)),
    ),
    family,
  };
}

// ============================================================================
// 10 · SIGNAL → CAPABILITY → MODULE, per capture source
// ----------------------------------------------------------------------------
// The chain the home teaser and the lab both read: given one source, which
// signals are read from it, which capabilities process them, and which
// modules use those capabilities. Every step is a documented relationship.
// ============================================================================

export interface SourceChain {
  source: CaptureSourceDef;
  signals: string[];
  capabilities: string[];
  productIds: string[];
  /** Outputs the matching modules document. */
  outputs: string[];
}

export function chainForSource(source: CaptureSource): SourceChain {
  const def = CAPTURE_SOURCES.find((item) => item.id === source)!;
  const products = analyticsProducts.filter((product) =>
    product.sources.includes(source),
  );

  const inOrder = (
    nodes: typeof capabilityNodes,
    pick: (product: AnalyticsProduct) => string[],
  ) =>
    nodes
      .map((node) => node.id)
      .filter((id) => products.some((product) => pick(product).includes(id)))
      .map(titleOf);

  return {
    source: def,
    signals: inOrder(signalNodes, (product) => product.signalIds),
    capabilities: inOrder(capabilityNodes, (product) => product.capabilityIds),
    productIds: products.map((product) => product.id),
    outputs: Array.from(new Set(products.flatMap((product) => product.outputs))),
  };
}

// ============================================================================
// 11 · FAMILY SUMMARIES — for headers and orientation
// ============================================================================

export const familySummary = (family: Vertical) => {
  const products = family === "securevision" ? secureProducts : mobilityProducts;
  const environments = analyticsEnvironments.filter(
    (environment) => environment.family === family,
  );
  return {
    label: FAMILY_LABEL[family],
    moduleCount: products.length,
    environmentCount: environments.length,
    capabilityCount: analyticsCapabilities.filter((capability) =>
      capability.productIds.some(
        (id) => analyticsProductById.get(id)?.family === family,
      ),
    ).length,
  };
};
