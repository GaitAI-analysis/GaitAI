/**
 * Academic publications & patent — sourced from src/Assets/Publications cover
 * captures and the Government of India patent certificate.
 *
 * Authors marked as the founder are surfaced as primary text on the cards;
 * remaining co-authors appear in a muted secondary line.
 *
 * Linking strategy
 * ----------------
 *  - `externalUrl` is what the "Open paper" button uses. Where the DOI is
 *    confirmed it links straight to doi.org; everywhere else it links to a
 *    Google Scholar search with the exact paper title, which reliably surfaces
 *    the correct work even when the publisher URL is not at hand.
 *  - `pdfUrl` is what the "Download PDF" button uses. It points to a
 *    deterministic path under /public/publications/pdfs/. Drop the actual PDF
 *    there (filename matching) and the download just works.
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
  authors: string[];
  founderIndex?: number;
  doi?: string;
  externalUrl: string;
  pdfUrl: string;
  cover: string;
  abstract?: string;
  keywords?: string[];
  patentNumber?: string;
  applicationNumber?: string;
  filingDate?: string;
  grantDate?: string;
  validityYears?: number;
  jurisdiction?: string;
}

const scholar = (title: string) =>
  `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;

// ============================================================================
// PATENT — surfaced as the hero card on the page.
// ============================================================================

export const patent: Publication = {
  id: "patent-covariate-gait-edge",
  kind: "patent",
  title:
    "A Covariate-Based Gait Recognition System and Method for Edge Analytics Using Optimized Deep Learning Pipeline",
  venue: "Patent — Government of India",
  publisher: "Government of India · IP India",
  year: 2022,
  date: "Granted 27 July 2022",
  authors: ["Anubha Parashar", "Apoorva Parashar"],
  cover: "/publications/patent-certificate.jpg",
  patentNumber: "402202",
  applicationNumber: "202111034240",
  filingDate: "29 July 2021",
  grantDate: "27 July 2022",
  validityYears: 20,
  jurisdiction: "India",
  externalUrl:
    "https://ipindiaservices.gov.in/PublicSearch/PublicationSearch/PatentDetails",
  pdfUrl: "/publications/patent-certificate.jpg",
};

// ============================================================================
// JOURNAL PAPERS
// ============================================================================

export const papers: Publication[] = [
  {
    id: "ai-review-2023",
    kind: "journal",
    title:
      "Deep learning pipelines for recognition of gait biometrics with covariates: a comprehensive review",
    venue: "Artificial Intelligence Review",
    publisher: "Springer",
    year: 2023,
    date: "Published 18 January 2023",
    authors: [
      "Anubha Parashar",
      "Apoorva Parashar",
      "Weiping Ding",
      "Rajveer S. Shekhawat",
      "Imad Rida",
    ],
    doi: "10.1007/s10462-022-10365-4",
    externalUrl: "https://doi.org/10.1007/s10462-022-10365-4",
    pdfUrl: "/publications/pdfs/ai-review-2023.pdf",
    cover: "/publications/paper-ai-review.jpg",
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
    kind: "journal",
    title:
      "Intra-class variations with deep learning-based gait analysis: A comprehensive survey of covariates and methods",
    venue: "Neurocomputing",
    publisher: "Elsevier",
    year: 2022,
    date: "Vol. 505, pp. 315–338 · Available online 16 July 2022",
    authors: [
      "Anubha Parashar",
      "Rajveer Singh Shekhawat",
      "Weiping Ding",
      "Imad Rida",
    ],
    doi: "10.1016/j.neucom.2022.07.002",
    externalUrl: "https://doi.org/10.1016/j.neucom.2022.07.002",
    pdfUrl: "/publications/pdfs/neurocomputing-2022.pdf",
    cover: "/publications/paper-neurocomputing.jpg",
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
    kind: "journal",
    title:
      "Advancements in Artificial Intelligence for Biometrics: A Deep Dive into Model-based Gait Recognition Techniques",
    venue: "Engineering Applications of Artificial Intelligence",
    publisher: "Elsevier",
    year: 2024,
    authors: [
      "Anubha Parashar",
      "Apoorva Parashar",
      "Mohammad Shabaz",
      "Deepak Gupta",
      "Aditya Kumar Sahu",
    ],
    externalUrl: scholar(
      "Advancements in Artificial Intelligence for Biometrics: A Deep Dive into Model-based Gait Recognition Techniques Anubha Parashar"
    ),
    pdfUrl: "/publications/pdfs/eaai-2024.pdf",
    cover: "/publications/paper-eaai.jpg",
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
    kind: "journal",
    title:
      "Journey into Gait Biometrics: Integrating Deep Learning for Enhanced Pattern Recognition",
    venue: "Digital Signal Processing",
    publisher: "Elsevier",
    year: 2024,
    authors: ["Anubha Parashar", "Apoorva Parashar", "Imad Rida"],
    externalUrl: scholar(
      "Journey into Gait Biometrics Integrating Deep Learning for Enhanced Pattern Recognition Anubha Parashar"
    ),
    pdfUrl: "/publications/pdfs/dsp-2024.pdf",
    cover: "/publications/paper-dsp.jpg",
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
    kind: "journal",
    title:
      "Data Preprocessing and Feature Selection Techniques in Gait Recognition: A Comparative Study of Machine Learning and Deep Learning Approaches",
    venue: "Pattern Recognition Letters",
    publisher: "Elsevier",
    year: 2023,
    authors: [
      "Anubha Parashar",
      "Apoorva Parashar",
      "Weiping Ding",
      "Mohammad Shabaz",
      "Imad Rida",
    ],
    externalUrl: scholar(
      "Data Preprocessing and Feature Selection Techniques in Gait Recognition Anubha Parashar"
    ),
    pdfUrl: "/publications/pdfs/prl-2023.pdf",
    cover: "/publications/paper-prl.jpg",
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
    kind: "journal",
    title:
      "Comparative Study of Machine Learning and Deep Learning Techniques for Gait Recognition: Advances in Feature Extraction, Reduction, Transformation, and Classification",
    venue: "Image and Vision Computing",
    publisher: "Elsevier",
    year: 2023,
    authors: ["Anubha Parashar", "Apoorva Parashar", "Imad Rida"],
    externalUrl: scholar(
      "Comparative Study of Machine Learning and Deep Learning Techniques for Gait Recognition Anubha Parashar Image and Vision Computing"
    ),
    pdfUrl: "/publications/pdfs/ivc-2023.pdf",
    cover: "/publications/paper-ivc.jpg",
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
    kind: "journal",
    title:
      "A robust covariate-invariant gait recognition based on pose features",
    venue: "IET Biometrics",
    publisher: "Wiley · IET",
    year: 2022,
    date: "Accepted 26 September 2022 · Vol. 11, pp. 601–613",
    authors: ["Anubha Parashar", "Apoorva Parashar", "Rajveer Singh Shekhawat"],
    // Switched to a Scholar search keyed on the exact title + founder so it
    // resolves to the right paper rather than the previous mis-attributed DOI.
    externalUrl: scholar(
      "A robust covariate-invariant gait recognition based on pose features Anubha Parashar IET Biometrics"
    ),
    pdfUrl: "/publications/pdfs/iet-pose-2022.pdf",
    cover: "/publications/paper-iet-pose.jpg",
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
    kind: "journal",
    title:
      "Protection of gait data set for preserving its privacy in deep learning pipeline",
    venue: "IET Biometrics",
    publisher: "Wiley · IET",
    year: 2022,
    date: "Accepted 31 July 2022",
    authors: ["Anubha Parashar", "Rajveer Singh Shekhawat"],
    externalUrl: scholar(
      "Protection of gait data set for preserving its privacy in deep learning pipeline Anubha Parashar IET Biometrics"
    ),
    pdfUrl: "/publications/pdfs/iet-privacy-2022.pdf",
    cover: "/publications/paper-iet-privacy.jpg",
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

export const FOUNDER_NAME = "Anubha Parashar";

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
