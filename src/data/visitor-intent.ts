import type { CaptureSource } from "@/data/gaitscape/graph";

/**
 * VISITOR-INTENT PATHS
 *
 * Seven starting points for a first visit. Each one is nothing more than a
 * pre-filled answer to the questions the product finder already asks —
 * environment, objective, capture source — plus the demo, evidence, research
 * and story pages that already exist for that context. The modules a path shows
 * come from `recommendStack()` in `src/data/analytics.ts`, so this file cannot
 * recommend anything the configurator would not.
 *
 * Paths with no environment or objective (researcher, technology partner) are
 * navigation only: there is no documented "stack" for them and inventing one
 * would be a claim.
 */
export interface VisitorIntentPath {
  id: string;
  label: string;
  /** One line: what this path is for. */
  summary: string;
  /** `industryUseCases` id — an environment the finder knows. */
  environmentId?: string;
  /** `OBJECTIVES` id. */
  objectiveId?: string;
  sources: CaptureSource[];
  demo: { label: string; href: string };
  evidence: { label: string; href: string };
  research: { label: string; href: string };
  /** A GaitScape story id, when one walks this path. */
  storyId?: string;
  useCase?: { label: string; href: string };
  cta: { label: string; href: string };
}

export const visitorIntentPaths: readonly VisitorIntentPath[] = [
  {
    id: "clinician",
    label: "Clinician",
    summary: "Movement review and rehabilitation comparison for a clinic.",
    environmentId: "physio",
    objectiveId: "recovery",
    sources: ["video"],
    demo: { label: "Analyse a demo walk in your browser", href: "/movement-lab/?demo=mobility-walk#analyze" },
    evidence: { label: "Evidence index for every module", href: "/research/evidence/" },
    research: { label: "Peer-reviewed publications", href: "/publications/" },
    storyId: "rehabilitation",
    useCase: { label: "Physiotherapy clinics", href: "/use-cases/physiotherapy-clinics/" },
    cta: { label: "Request a demo", href: "/#contact" },
  },
  {
    id: "researcher",
    label: "Researcher",
    summary: "Publications, methods and how each one traces to a capability.",
    sources: [],
    demo: { label: "Inspect measured pose signals locally", href: "/movement-lab/#analyze" },
    evidence: { label: "Research → capability → product", href: "/research/evidence/" },
    research: { label: "Publication library with provenance filters", href: "/publications/" },
    storyId: "research",
    cta: { label: "Explore the research programme", href: "/research/" },
  },
  {
    id: "healthcare",
    label: "Hospital / healthcare",
    summary: "Mobility assessment and monitoring across a care pathway.",
    environmentId: "hospitals",
    objectiveId: "mobility",
    sources: ["video", "mobile"],
    demo: { label: "Analyse a demo walk in your browser", href: "/movement-lab/?demo=mobility-walk#analyze" },
    evidence: { label: "Evidence index for every module", href: "/research/evidence/" },
    research: { label: "Peer-reviewed publications", href: "/publications/" },
    storyId: "rehabilitation",
    useCase: { label: "Hospitals", href: "/use-cases/hospitals/" },
    cta: { label: "Request a demo", href: "/#contact" },
  },
  {
    id: "sports",
    label: "Sports / rehabilitation",
    summary: "Symmetry, load and return-to-activity movement review.",
    environmentId: "sports",
    objectiveId: "performance",
    sources: ["video"],
    demo: { label: "Analyse a demo walk in your browser", href: "/movement-lab/?demo=mobility-walk#analyze" },
    evidence: { label: "Evidence index for every module", href: "/research/evidence/" },
    research: { label: "Peer-reviewed publications", href: "/publications/" },
    storyId: "motion-dna",
    useCase: { label: "Sports academies", href: "/use-cases/sports-academies/" },
    cta: { label: "Request a demo", href: "/#contact" },
  },
  {
    id: "public-safety",
    label: "Public safety",
    summary: "Movement events for operator review from existing cameras.",
    environmentId: "smartcities",
    objectiveId: "anomalies",
    sources: ["cctv"],
    demo: { label: "Illustrative spatial pipeline walkthrough", href: "/movement-lab/?mode=securevision#walkthrough" },
    evidence: { label: "Evidence index for every module", href: "/research/evidence/" },
    research: { label: "Peer-reviewed publications", href: "/publications/" },
    storyId: "privacy",
    useCase: { label: "Smart cities", href: "/use-cases/smart-cities/" },
    cta: { label: "Request a demo", href: "/#contact" },
  },
  {
    id: "industrial-safety",
    label: "Industrial safety",
    summary: "Unsafe-activity signals and zone awareness for supervisors.",
    environmentId: "factories",
    objectiveId: "worker-safety",
    sources: ["cctv"],
    demo: { label: "Illustrative spatial pipeline walkthrough", href: "/movement-lab/?mode=securevision#walkthrough" },
    evidence: { label: "Evidence index for every module", href: "/research/evidence/" },
    research: { label: "Peer-reviewed publications", href: "/publications/" },
    storyId: "privacy",
    useCase: { label: "Factories & warehouses", href: "/use-cases/factories-warehouses/" },
    cta: { label: "Request a demo", href: "/#contact" },
  },
  {
    id: "technology-partner",
    label: "Technology partner",
    summary: "Architecture, coverage and the controls a deployment inherits.",
    sources: [],
    demo: { label: "Capability × environment coverage map", href: "/products/#coverage" },
    evidence: { label: "Trust Center and what is not claimed", href: "/trust/" },
    research: { label: "GaitScape: the whole landscape as a graph", href: "/gaitscape/" },
    useCase: { label: "Security and deployment controls", href: "/legal/security/" },
    cta: { label: "Discuss an integration", href: "/#contact" },
  },
];

export const visitorIntentById = new Map(visitorIntentPaths.map((path) => [path.id, path]));
