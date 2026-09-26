// ============================================================================
// GAITAI LABS — GAIT RESEARCH ASSETS
// ----------------------------------------------------------------------------
// /labs is the home of GaitAI's dedicated gait research assets: the gait
// dataset and the gait biometrics lab. This file is the one record of what
// those are, so the page, the Explore menu, the site map, the search palette
// and the assistant's corpus cannot disagree.
//
// WHAT THIS FILE IS NOT. It is not the list of interactive movement
// experiments — Signal Inspector, Footage Check, Movement X-Ray, Privacy Lens,
// Fusion Sandbox, Mobility Time Machine, the Atlas. Those belong to the
// Movement Intelligence Lab and live in `data/experiments.ts`; they used to be
// listed on /labs and are now listed at the foot of /movement-lab. The two
// ideas are kept apart on purpose:
//
//   Movement Intelligence Lab  "Let me experiment with how GaitAI understands
//                               movement."
//   GaitAI Labs                "Let me explore GaitAI's gait dataset and gait
//                               biometrics research."
//
// THE RULE THIS FILE ENFORCES: nothing here states a figure the repository
// cannot cite. The published record (`data/publications.ts`) covers gait
// recognition with covariates, pose-based gait recognition and the protection
// of gait datasets inside deep-learning pipelines. It does not contain dataset
// statistics, recognition results or accuracy figures, so neither do these
// records, and neither do the pages that render them. A `status` says plainly
// how far each asset is along, rather than a placeholder dressed as a result.
// ============================================================================

export type GaitLabStatus =
  /** The asset exists; its public documentation is being finalised. */
  | "documentation-in-preparation"
  /** The environment is structured and grounded; interactive modules follow. */
  | "framework";

export const GAIT_LAB_STATUS_LABEL: Record<GaitLabStatus, string> = {
  "documentation-in-preparation": "Documentation in preparation",
  framework: "Framework · interactive modules to follow",
};

export interface GaitLabRecord {
  id: string;
  name: string;
  /** One line, under the name. */
  strap: string;
  /** What the asset is, in one honest paragraph. */
  body: string;
  /** Its route, with the trailing slash the static host needs. */
  href: string;
  /** The call to action, without the arrow. */
  cta: string;
  status: GaitLabStatus;
  /**
   * Publication ids from `data/publications.ts` this asset rests on. The
   * validator refuses an id that is not a real record, so the "grounded in N
   * papers" line on the page can never count a paper that does not exist.
   */
  publicationIds: string[];
  /**
   * The facets the asset's page is organised around. They are HEADINGS — the
   * fields a dataset card documents, the stages a biometrics pipeline has —
   * never values. A value appears under one only when it can be cited.
   */
  facets: string[];
}

export const GAIT_LABS_EYEBROW = "GaitAI Labs";
export const GAIT_LABS_TITLE_LEAD = "Research infrastructure for";
export const GAIT_LABS_TITLE_ACCENT = "gait intelligence.";
export const GAIT_LABS_BLURB =
  "The gait dataset and the gait biometrics lab behind GaitAI's research: the data foundation, and the environment for studying how a walk becomes a movement signature.";

/**
 * Said once on the hub and once on each asset page. It is the whole page's
 * boundary, not a footnote: the assets are real, the figures are not yet
 * public, and the page must not let a layout imply otherwise.
 */
export const GAIT_LABS_BOUNDARY =
  "GaitAI Labs states only what the published record supports. No dataset figure, recognition result or accuracy appears here until it has been released and can be cited.";

export const gaitLabs: GaitLabRecord[] = [
  {
    id: "dataset",
    name: "Gait Dataset",
    strap: "The data foundation behind gait research",
    body:
      "GaitAI's prepared gait dataset — the data foundation for its gait research. What it captures, how it is organised, how it is protected and how it can be used are documented here as a dataset card once the release documentation is final.",
    href: "/labs/dataset/",
    cta: "Explore dataset",
    status: "documentation-in-preparation",
    /* The published work on gait DATA: protecting a gait dataset inside a
       deep-learning pipeline, and recognition from pose features — the two
       IET Biometrics papers. */
    publicationIds: ["iet-privacy-2022", "iet-pose-2022"],
    facets: [
      "Dataset name",
      "Modalities",
      "Subjects",
      "Sessions",
      "Views",
      "Sensors",
      "Conditions",
      "Research usage",
      "Publications",
      "Availability",
    ],
  },
  {
    id: "biometrics",
    name: "Gait Biometrics Lab",
    strap: "Recognition and movement signatures",
    body:
      "An environment for exploring gait as a biometric: how a stride becomes movement features, how features become a signature, and what covariates and privacy do to that signature. Grounded in the published recognition work, with no result stated ahead of the evidence.",
    href: "/labs/biometrics/",
    cta: "Enter Gait Biometrics Lab",
    status: "framework",
    /* Every gait-recognition paper in the record: the six behind the
       "Gait recognition & biometrics" research area plus the pose-based
       covariate-invariant paper. */
    publicationIds: [
      "iet-pose-2022",
      "ai-review-2023",
      "neurocomputing-2022",
      "eaai-2024",
      "dsp-2024",
      "prl-2023",
      "ivc-2023",
    ],
    facets: [
      "Stride capture",
      "Movement features",
      "Signature",
      "Covariates",
      "Privacy",
      "Matching",
    ],
  },
];

export function gaitLabById(id: string): GaitLabRecord | undefined {
  return gaitLabs.find((lab) => lab.id === id);
}

/**
 * The two labs, stated side by side, so the distinction is made exactly where
 * a reader would blur it. What each INCLUDES is derived at render time from
 * `experiments` and `gaitLabs` — this record carries only what those lists
 * cannot: the question each lab answers and its one-line purpose.
 */
export interface LabDistinctionRecord {
  id: "movement-lab" | "labs";
  name: string;
  href: string;
  /** The reader's own question, in their words. */
  question: string;
  purpose: string;
}

export const LAB_DISTINCTION: LabDistinctionRecord[] = [
  {
    id: "movement-lab",
    name: "Movement Intelligence Lab",
    href: "/movement-lab/",
    question: "Let me experiment with how GaitAI understands movement.",
    purpose:
      "Interactive tools for understanding and experimenting with GaitAI movement analysis.",
  },
  {
    id: "labs",
    name: "GaitAI Labs",
    href: "/labs/",
    question: "Let me explore GaitAI's gait dataset and gait biometrics research.",
    purpose: "Dedicated gait research assets.",
  },
];
