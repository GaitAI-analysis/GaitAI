import {
  allPublications,
  type Publication,
} from "@/data/publications";

/**
 * Controlled topic vocabulary for the research library, derived ONLY from
 * the keywords already present on each publication record (plus, for the
 * patent, terms taken verbatim from its own title). No publication is
 * assigned a topic its own metadata does not support.
 */
const KEYWORD_TOPIC: Record<string, string> = {
  "gait recognition": "Gait Recognition",
  "gait biometric": "Gait Recognition",
  "gait anonymization": "Privacy",
  "de-identification": "Privacy",
  privacy: "Privacy",
  "reversible deep learning pipeline": "Deep Learning",
  "deep learning": "Deep Learning",
  "machine learning": "Machine Learning",
  "artificial intelligence": "Machine Learning",
  biometrics: "Biometrics",
  covariates: "Gait Recognition",
  "computer vision": "Computer Vision",
  "video surveillance": "Security",
  surveillance: "Security",
  "sensor-based surveillance": "Security",
  "pattern recognition": "Pattern Recognition",
  "data preprocessing": "Machine Learning",
  "feature selection": "Machine Learning",
  "feature extraction": "Computer Vision",
  classification: "Machine Learning",
  "pose estimation": "Pose Estimation",
};

/** Topics for the patent, from its own title wording. */
const PATENT_TOPICS = ["Gait Recognition", "Deep Learning", "Biometrics"];

export function topicsFor(pub: Publication): string[] {
  if (pub.kind === "patent") return PATENT_TOPICS;
  const out: string[] = [];
  for (const k of pub.keywords ?? []) {
    const topic = KEYWORD_TOPIC[k.toLowerCase()];
    if (topic && !out.includes(topic)) out.push(topic);
  }
  return out;
}

export const allTopics: string[] = Array.from(
  new Set(allPublications.flatMap((p) => topicsFor(p)))
).sort();

export const allYears: number[] = Array.from(
  new Set(allPublications.map((p) => p.year))
).sort((a, b) => b - a);

export const allPublishers: string[] = Array.from(
  new Set(allPublications.map((p) => p.publisher))
).sort();

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

/** "Published 18 January 2023" → "January 2023"; falls back to the year. */
export function displayDate(pub: Publication): string {
  const m = pub.date?.match(new RegExp(`(${MONTHS})\\s+(\\d{4})`));
  if (m) return `${m[1]} ${m[2]}`;
  return String(pub.year);
}

/** Newest-first ordering by year, then by any month found in the date. */
export function dateSortKey(pub: Publication): number {
  const m = pub.date?.match(new RegExp(`(${MONTHS})`));
  const month = m ? MONTHS.split("|").indexOf(m[1]) + 1 : 0;
  return pub.year * 100 + month;
}

/** Plain-text citation assembled from the record's own fields. */
export function formatCitation(pub: Publication): string {
  const authors = pub.authors.join(", ");
  if (pub.kind === "patent") {
    return `${authors}. "${pub.title}." Patent ${pub.patentNumber}, ${pub.publisher}, granted ${pub.grantDate}.`;
  }
  const doi = pub.doi ? ` https://doi.org/${pub.doi}` : "";
  return `${authors} (${pub.year}). "${pub.title}." ${pub.venue}, ${pub.publisher}.${doi}`;
}

/** Related publications = most shared controlled topics, newest first. */
export function relatedPublications(pub: Publication, count = 3): Publication[] {
  const mine = new Set(topicsFor(pub));
  return allPublications
    .filter((p) => p.id !== pub.id)
    .map((p) => ({
      p,
      shared: topicsFor(p).filter((t) => mine.has(t)).length,
    }))
    .sort((a, b) => b.shared - a.shared || dateSortKey(b.p) - dateSortKey(a.p))
    .slice(0, count)
    .map(({ p }) => p);
}
