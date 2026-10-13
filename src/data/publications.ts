/**
 * Academic research references. Bibliographic facts and official source links
 * are retained; individual author profiles and document scans are not published.
 * Copyright and patent rights remain with their respective rights holders.
 */

export type PublicationKind = "patent" | "journal";
export type Publisher =
  | "Springer"
  | "Elsevier"
  | "Wiley · IET"
  | "Government of India · IP India";

export interface Publication {
  id: string;
  kind: PublicationKind;
  title: string;
  venue: string;
  publisher: Publisher;
  year: number;
  date?: string;
  doi?: string;
  externalUrl: string;
  publicationStatus?: "publisher-confirmed" | "publisher-unverified";
  verificationNote?: string;
  /** Neutral subject artwork, never a document or certificate scan. */
  cover: string;
  /**
   * Optional card visual with priority over the first-page capture:
   * a publication's own graphical abstract, architecture/method figure,
   * representative result figure or thumbnail. Only assets already
   * associated with the publication — never generated. When absent, the
   * `cover` (PDF first page / certificate capture) is the fallback.
   */
  figure?: string;
  /**
   * Commissioned card artwork for the publications grid: an illustration of
   * the paper's SUBJECT, extracted from the approved artwork set.
   *
   * Deliberately distinct from `figure`, which would be a figure taken from
   * the paper itself. This is neither that nor a page capture: it is a drawn
   * banner, so the grid can carry nine different pictures without implying any
   * of them is a published result. Any label inside an artwork describes the
   * method it depicts — the card's title, venue, year, type, topics and link
   * all come from this record and never from the image.
   */
  artwork?: string;
  abstract?: string;
  keywords?: string[];
  patentNumber?: string;
  applicationNumber?: string;
  filingDate?: string;
  grantDate?: string;
  validityYears?: number;
  jurisdiction?: string;
}

// ============================================================================
// PATENT — surfaced as the hero card on the page.
// ============================================================================

export const patent: Publication = {
  id: "patent-covariate-gait-edge",
  abstract: "Patent reference describing covariate-based gait recognition for edge analytics using an optimized deep learning pipeline. Consult the official registry for the full specification, rights holders and current legal status.",
  kind: "patent",
  title:
    "A Covariate-Based Gait Recognition System and Method for Edge Analytics Using Optimized Deep Learning Pipeline",
  venue: "Patent — Government of India",
  publisher: "Government of India · IP India",
  year: 2022,
  date: "Granted 27 July 2022",
  cover: "/assets/images/publications/edge-gait-patent-402202.webp",
  artwork: "/assets/images/publications/edge-gait-patent-402202.webp",
  patentNumber: "402202",
  applicationNumber: "202111034240",
  filingDate: "29 July 2021",
  grantDate: "27 July 2022",
  validityYears: 20,
  jurisdiction: "India",
  externalUrl:
    "https://ipindiaservices.gov.in/PublicSearch/PublicationSearch/PatentDetails",
};

// ============================================================================
// JOURNAL PAPERS
// ============================================================================

export const papers: Publication[] = [
  {
    id: "ai-review-2023",
    abstract: "A review of deep learning pipelines for gait biometrics, focusing on covariates that affect recognition and the methods used to address them.",
    kind: "journal",
    title:
      "Deep learning pipelines for recognition of gait biometrics with covariates: a comprehensive review",
    venue: "Artificial Intelligence Review",
    publisher: "Springer",
    year: 2023,
    date: "Published 18 January 2023",
    doi: "10.1007/s10462-022-10365-4",
    externalUrl: "https://doi.org/10.1007/s10462-022-10365-4",
    cover: "/assets/images/publications/gait-covariates-review.webp",
    artwork: "/assets/images/publications/gait-covariates-review.webp",
    keywords: [
      "Gait recognition",
      "Biometrics",
      "Covariates",
      "Deep learning",
      "Computer vision",
    ],
  },
  {
    id: "neurocomputing-2022",
    abstract: "A survey of intra-class variation in gait analysis, covering covariates and deep learning methods for gait recognition.",
    kind: "journal",
    title:
      "Intra-class variations with deep learning-based gait analysis: A comprehensive survey of covariates and methods",
    venue: "Neurocomputing",
    publisher: "Elsevier",
    year: 2022,
    date: "Vol. 505, pp. 315–338 · Available online 16 July 2022",
    doi: "10.1016/j.neucom.2022.07.002",
    externalUrl: "https://doi.org/10.1016/j.neucom.2022.07.002",
    cover: "/assets/images/publications/gait-intra-class-variations.webp",
    artwork: "/assets/images/publications/gait-intra-class-variations.webp",
    keywords: [
      "Gait recognition",
      "Biometrics",
      "Covariates",
      "Deep learning",
      "Computer vision",
      "Video surveillance",
    ],
  },
  {
    id: "eaai-2024",
    abstract: "An overview of model-based gait recognition techniques and their role in artificial intelligence approaches to biometrics.",
    kind: "journal",
    title:
      "Advancements in Artificial Intelligence for Biometrics: A Deep Dive into Model-based Gait Recognition Techniques",
    venue: "Engineering Applications of Artificial Intelligence",
    publisher: "Elsevier",
    year: 2024,
    doi: "10.1016/j.engappai.2023.107712",
    externalUrl: "https://doi.org/10.1016/j.engappai.2023.107712",
    cover: "/assets/images/publications/model-based-gait-recognition.webp",
    artwork: "/assets/images/publications/model-based-gait-recognition.webp",
    keywords: [
      "Artificial Intelligence",
      "Gait Recognition",
      "Biometrics",
      "Deep Learning",
      "Sensor-based Surveillance",
    ],
  },
  {
    id: "dsp-2024",
    abstract: "Research on integrating deep learning with gait biometrics for pattern recognition, spanning gait representations and recognition methods.",
    kind: "journal",
    title:
      "Journey into Gait Biometrics: Integrating Deep Learning for Enhanced Pattern Recognition",
    venue: "Digital Signal Processing",
    publisher: "Elsevier",
    year: 2024,
    doi: "10.1016/j.dsp.2024.104393",
    externalUrl: "https://doi.org/10.1016/j.dsp.2024.104393",
    cover: "/assets/images/publications/deep-learning-gait-pattern-recognition.webp",
    artwork: "/assets/images/publications/deep-learning-gait-pattern-recognition.webp",
    keywords: [
      "Gait Recognition",
      "Biometrics",
      "Deep Learning",
      "Surveillance",
      "Pattern Recognition",
    ],
  },
  {
    id: "prl-2023",
    abstract: "A comparative study of data preprocessing and feature selection in gait recognition using machine learning and deep learning approaches.",
    kind: "journal",
    title:
      "Data Preprocessing and Feature Selection Techniques in Gait Recognition: A Comparative Study of Machine Learning and Deep Learning Approaches",
    venue: "Pattern Recognition Letters",
    publisher: "Elsevier",
    year: 2023,
    doi: "10.1016/j.patrec.2023.05.021",
    externalUrl: "https://doi.org/10.1016/j.patrec.2023.05.021",
    cover: "/assets/images/publications/gait-preprocessing-feature-selection.webp",
    artwork: "/assets/images/publications/gait-preprocessing-feature-selection.webp",
    keywords: [
      "Gait recognition",
      "Data preprocessing",
      "Feature selection",
      "Machine learning",
      "Deep learning",
    ],
  },
  {
    id: "ivc-2023",
    abstract: "A manuscript reference comparing machine learning and deep learning approaches to gait feature extraction, reduction, transformation and classification. Publication status remains unverified.",
    publicationStatus: "publisher-unverified",
    verificationNote: "This manuscript reference is retained from the research archive. Its publisher record, DOI and publication status have not been independently verified. The external link searches the publisher catalogue by title.",
    kind: "journal",
    title:
      "Comparative Study of Machine Learning and Deep Learning Techniques for Gait Recognition: Advances in Feature Extraction, Reduction, Transformation, and Classification",
    venue: "Image and Vision Computing",
    publisher: "Elsevier",
    year: 2023,
    externalUrl: "https://www.sciencedirect.com/search?qs=Comparative%20Study%20of%20Machine%20Learning%20and%20Deep%20Learning%20Techniques%20for%20Gait%20Recognition",
    cover: "/assets/images/publications/ml-vs-deep-learning-gait-comparison.webp",
    artwork: "/assets/images/publications/ml-vs-deep-learning-gait-comparison.webp",
    keywords: [
      "Gait recognition",
      "Machine learning",
      "Deep learning",
      "Feature extraction",
      "Classification",
    ],
  },
  {
    id: "iet-pose-2022",
    abstract: "Research on pose features for gait recognition under covariate variation, connecting human pose estimation with movement biometrics.",
    kind: "journal",
    title:
      "A robust covariate-invariant gait recognition based on pose features",
    venue: "IET Biometrics",
    publisher: "Wiley · IET",
    year: 2022,
    date: "Published 20 October 2022 · Vol. 11, pp. 601–613",
    doi: "10.1049/bme2.12103",
    externalUrl: "https://doi.org/10.1049/bme2.12103",
    cover: "/assets/images/publications/pose-covariate-invariant-gait.webp",
    artwork: "/assets/images/publications/pose-covariate-invariant-gait.webp",
    keywords: [
      "Biometrics",
      "Covariates",
      "Deep learning",
      "Gait recognition",
      "Pose estimation",
    ],
  },
  {
    id: "iet-privacy-2022",
    abstract: "Research on protecting gait datasets within deep learning pipelines through privacy preservation, de-identification and gait anonymization.",
    kind: "journal",
    title:
      "Protection of gait data set for preserving its privacy in deep learning pipeline",
    venue: "IET Biometrics",
    publisher: "Wiley · IET",
    year: 2022,
    date: "Accepted 31 July 2022",
    doi: "10.1049/bme2.12093",
    externalUrl: "https://doi.org/10.1049/bme2.12093",
    cover: "/assets/images/publications/privacy-preserving-gait-data.webp",
    artwork: "/assets/images/publications/privacy-preserving-gait-data.webp",
    keywords: [
      "De-identification",
      "Gait anonymization",
      "Gait biometric",
      "Privacy",
      "Reversible deep learning pipeline",
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export const allPublications: Publication[] = [patent, ...papers];

export const publicationsByYear = (() => {
  const map = new Map<number, Publication[]>();
  for (const p of allPublications) {
    if (!map.has(p.year)) map.set(p.year, []);
    map.get(p.year)!.push(p);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b - a);
})();

export const publisherAccent: Record<
  Publisher,
  { text: string; pill: string; ring: string }
> = {
  Springer: {
    text: "text-amber-300",
    pill: "border-amber-300/30 bg-amber-300/8 text-amber-200",
    ring: "ring-amber-300/30",
  },
  Elsevier: {
    text: "text-cyan-300",
    pill: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
    ring: "ring-cyan-300/30",
  },
  "Wiley · IET": {
    text: "text-violet-300",
    pill: "border-violet-300/30 bg-violet-300/8 text-violet-200",
    ring: "ring-violet-300/30",
  },
  "Government of India · IP India": {
    text: "text-amber-300",
    pill: "border-amber-300/40 bg-amber-300/10 text-amber-200",
    ring: "ring-amber-300/40",
  },
};

/** A search destination must never be labelled as a paper or a DOI. */
export function publicationLinkLabel(publication: Publication): string {
  if (publication.kind === "patent") return "Search patent registry";
  if (publication.doi) return "DOI / publisher";
  if (publication.publicationStatus === "publisher-unverified") return "Search publisher catalogue";
  return "Publisher record";
}

export const ACADEMIC_REFERENCES = {
  researchSince: 2014,
  scope: "This collection presents academic research references relevant to movement intelligence. Copyright and patent rights remain with their respective authors, publishers and rights holders. Inclusion does not imply GaitAI authorship, ownership or product-specific validation.",
} as const;
