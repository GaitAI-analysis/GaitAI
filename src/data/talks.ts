/**
 * TALKS & PRESENTATIONS — the founder's verified speaking record.
 *
 * PROVENANCE, WHICH IS THE WHOLE POINT OF THIS FILE. These are Anubha
 * Parashar's talks, presentations and posters, delivered in an academic and
 * personal research capacity. They are NOT GaitAI company appearances, and
 * nothing here may be presented as one — the company has delivered no talks
 * of its own. Every consuming surface says whose record it is.
 *
 * EVERY FIELD IS THE SOURCE'S OWN TEXT. Two pages on the founder's research
 * site are the only inputs:
 *
 *   https://anubhaparashar.github.io/publication.html#conferences
 *   https://anubhaparashar.github.io/event.html#talks
 *
 * Titles, dates, events, venues and descriptions are copied verbatim; a field
 * the source does not carry is simply absent rather than filled in. This file
 * was generated from those pages rather than transcribed, because 23 records
 * is 180-odd chances to mistype a venue and the page's entire value is that it
 * matches the record.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *
 *   - No recordings. Neither source carries a video URL for any of these, so
 *     there is no "Watch recording" control anywhere and no recording section.
 *   - No technical demos. Nothing in either source is evidenced as a demo, so
 *     ordinary talks are not relabelled as demos to fill a category.
 *   - No speaker photographs presented as talk imagery. Some records carry a
 *     photo; they are offered as dated evidence, not as hero art.
 *   - 8 of the 16 conference papers. See PROMOTED_REASON below.
 *
 * RESEARCH RELATIONS ARE EXPLICIT, NEVER INFERRED FROM WORDING. A record maps
 * onto a GaitAI research area only where the work itself is that research: the
 * gait, pose and privacy items map, and the IoT, teaching, access-control and
 * autonomous-vehicle items map to nothing. An LLM workshop is not GaitAI
 * research because both involve AI.
 */

import { researchAreas } from "@/data/evidence";

export const TALKS_SPEAKER = "Anubha Parashar";

/** The two pages every record below came from. */
export const TALKS_SOURCES = {
  conferences: "https://anubhaparashar.github.io/publication.html#conferences",
  talks: "https://anubhaparashar.github.io/event.html#talks",
} as const;

/**
 * Why 8 of 16 conference papers appear here and 8 do not.
 *
 * All 16 carry both Slides and a Certificate, so evidence of having been
 * presented cannot narrow the set — it selects everything. The second test is
 * subject: the paper has to be about movement, gait, or the privacy of the
 * people being observed, which is what makes it part of the research record
 * behind this platform. The other eight are real presented papers and remain
 * on the founder's publication record; they are simply not GaitAI's lineage.
 */
export const PROMOTED_REASON =
  "Conference papers appear here only where the work is gait, pose or " +
  "observation-privacy research and the source links presentation evidence.";

export type TalkKind =
  | "invited-talk"
  | "presentation"
  | "poster"
  | "conference-presentation";

export const TALK_KIND_LABEL: Record<TalkKind, string> = {
  "invited-talk": "Invited talk",
  presentation: "Presentation",
  poster: "Research poster",
  "conference-presentation": "Conference presentation",
};

/** Plural forms, for filters and counts. */
export const TALK_KIND_PLURAL: Record<TalkKind, string> = {
  "invited-talk": "Invited talks",
  presentation: "Conference presentations",
  poster: "Research posters",
  "conference-presentation": "Selected paper presentations",
};

export type EvidenceKind =
  | "slides"
  | "certificate"
  | "poster"
  | "paper"
  | "doi"
  | "photo";

/** The label each evidence kind is offered under. */
export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  slides: "View slides",
  certificate: "View certificate",
  poster: "View poster",
  paper: "View paper",
  doi: "View record",
  photo: "View photograph",
};

export interface TalkEvidence {
  kind: EvidenceKind;
  href: string;
}

export interface TalkRecord {
  id: string;
  kind: TalkKind;
  title: string;
  /** The source's own date string — "May 3, 2025", "2019-2020", "2006". */
  date?: string;
  year: number;
  /** Conference or programme, where the source names one separately. */
  event?: string;
  /** Venue or place, where the source names one separately. */
  venue?: string;
  description?: string;
  evidence: TalkEvidence[];
  /** A GaitAI research-area id, only where the work IS that research. */
  researchAreaId?: string;
  sourceUrl: string;
}

export const talkRecords: TalkRecord[] = [
  {
    id: "talk-01-speaker-global-ai-jaipur-fundamentals-of-llms-rag",
    kind: "invited-talk",
    title: "Speaker — Global AI Jaipur: Fundamentals of LLMs & RAG",
    date: "May 3, 2025",
    year: 2025,
    venue: "Jaipur, India",
    description: "Invited speaker session on the fundamentals of large language models and retrieval-augmented generation.",
    evidence: [],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "talk-02-speaker-for-an-expert-talk-on-ai-and-online-teaching-learn",
    kind: "invited-talk",
    title: "Speaker for an Expert Talk on AI and Online Teaching-Learning Practices",
    date: "Sep 23–27, 2024",
    year: 2024,
    venue: "Faculty Development Programme",
    description: "Expert talk on Artificial Intelligence and online teaching-learning practices, documented through the event certificate and related FDP record.",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/8.%20Expert%20talk%20on%20AI/Dr.%20Anubha%20Parashar.pdf" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "conference-01-deep-learning-based-framework-for-accurate-clothing-attrib",
    kind: "conference-presentation",
    title: "Deep Learning-based Framework for Accurate Clothing Attribute Recognition and Style Navigation for Gait Recognition",
    year: 2023,
    event: "International Conference on Bio-engineering for Smart Technologies, 2023",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/1/Deep%20Learning-based%20Framework%20for%20Accurate%20Clothing%20Attribute%20Recognition.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/1/Anubha%20Parashar.png" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/1/conference_041818.pdf" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "talk-03-speaker-for-an-expert-talk",
    kind: "invited-talk",
    title: "Speaker for an Expert Talk",
    date: "Sep 25–27, 2023",
    year: 2023,
    venue: "Academic expert talk",
    description: "Invited expert talk sharing knowledge and insights on contemporary topics in technology and research with students and faculty.",
    evidence: [{ kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/3.%20expert%20talk%20on%20AI/1.jpeg" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "talk-04-speaker-iot-and-ai-workshop-muj-acm-sigai-student-chapter",
    kind: "invited-talk",
    title: "Speaker — IoT and AI Workshop, MUJ ACM SIGAI Student Chapter",
    date: "Mar 2, 2023",
    year: 2023,
    venue: "Manipal University Jaipur, Jaipur, India",
    description: "Aimed to promote Embedded Systems, AI and IoT.",
    evidence: [],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "conference-02-protecting-the-privacy-of-face-by-de-identification-pipeli",
    kind: "conference-presentation",
    title: "Protecting the Privacy of Face by De-Identification Pipeline Based on Deep Learning",
    date: "Oct 19–21, 2022",
    year: 2022,
    event: "16th International Conference on Signal Image Technology and Internet Based Systems (SITIS)",
    venue: "Dijon, France",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/2/ppt.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/2/Certificate-Anubha.pdf" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/2/BIOSIG_2022_paper_45.pdf" }, { kind: "doi", href: "https://ieeexplore.ieee.org/document/10090162" }],
    researchAreaId: "res-privacy",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "conference-03-optimized-pose-based-gait-analysis-for-surveillance",
    kind: "conference-presentation",
    title: "Optimized Pose-Based Gait Analysis for Surveillance",
    date: "Aug 5–6, 2021",
    year: 2021,
    event: "2nd International Conference on Innovations in Computational Intelligence and Computer Vision",
    venue: "Manipal University Jaipur",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/3/ICICV_2021_Gait_Analysis_Presentation.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/3/certificate.jpg" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/3/ICICV-2021_paper_363.pdf" }, { kind: "doi", href: "https://doi.org/10.1007/978-981-19-0475-2_54" }],
    researchAreaId: "res-pose-gait",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "talk-05-speaker-for-an-iot-session",
    kind: "invited-talk",
    title: "Speaker for an IoT Session",
    date: "2021",
    year: 2021,
    venue: "IoT speaker session",
    description: "Invited IoT speaker session sharing applied Internet of Things concepts and practical perspectives with students and participants.",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/5.%20iot%20speaker/certificates-speakers.pdf" }, { kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/5.%20iot%20speaker/IMG_20210214_105415.jpg" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "presentation-03-early-detection-of-rheumatoid-arthritis-in-knee-using-deep",
    kind: "presentation",
    title: "Early Detection of Rheumatoid Arthritis in Knee using Deep Learning",
    date: "August 9–12, 2021",
    year: 2021,
    event: "International Conference on Data Science, Machine Learning and Artificial Intelligence (DSMLAI)",
    venue: "Namibia University of Science and Technology (NUST), Windhoek, Namibia",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/6.%20presentation/3/certi.jpg" }],
    sourceUrl: "https://anubhaparashar.github.io/publication.html#presentations",
  },
  {
    id: "conference-07-surveillance-system-to-provide-secured-gait-signatures-in",
    kind: "conference-presentation",
    title: "Surveillance System To Provide Secured Gait Signatures In Multi View Variations Using Deep Learning",
    date: "Jan 29–31, 2020",
    year: 2020,
    event: "International Conference on Modelling, Simulation & Intelligent Computing",
    venue: "BITS Dubai",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/7/Surveillance%20System%20to%20Provide%20Secured%20Gait%20Signatures%20Using.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/7/certi.jpeg" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/7/Surveillance%20System%20to%20Provide%20Secured%20Gait%20Signatures%20for%20Multi%20View%20Angles%20Using%20Deep%20Learning.pdf" }, { kind: "doi", href: "https://link.springer.com/chapter/10.1007/978-981-15-5243-4_21" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "talk-06-speaker-for-an-expert-talk-on-technology-and-innovation",
    kind: "invited-talk",
    title: "Speaker for an Expert Talk on Technology and Innovation",
    date: "May 18, 2020",
    year: 2020,
    venue: "Academic expert talk",
    description: "Invited expert talk on technology and innovation for academic participants.",
    evidence: [{ kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/6/1.png" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "talk-07-speaker-introduction-to-artificial-intelligence-and-iot",
    kind: "invited-talk",
    title: "Speaker — Introduction to Artificial Intelligence and IoT",
    date: "Apr 20, 2020",
    year: 2020,
    venue: "Manipal University Jaipur, Jaipur, India",
    description: "Project-based online expert session introducing Artificial Intelligence and the Internet of Things.",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/2/certi.pdf" }, { kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/2/FB_IMG_1594393539551.jpg" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "talk-08-speaker-for-an-expert-talk-on-iot",
    kind: "invited-talk",
    title: "Speaker for an Expert Talk on IoT",
    date: "2019–2020",
    year: 2020,
    venue: "Internet of Things expert talk series",
    description: "Delivered sessions on IoT architecture, security, and emerging applications for students and young professionals.",
    evidence: [{ kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/4.%20expert%20talk%20on%20IoT/IMG-20190326-WA0004.jpg" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "poster-gait-biometrics-ica3c-2020",
    kind: "poster",
    title: "Gait Biometrics – Deep Learning Based Surveillance System using Gait Signatures",
    year: 2020,
    event: "1st Online International Conference on Advances in Computing, Communication and Control (ICA3C-2020)",
    venue: "IIMT University, Meerut",
    evidence: [{ kind: "poster", href: "https://anubhaparashar.github.io/files/4.%20Publication/7.%20poster/Anubha_Poster_Gait_Biometrics.pdf" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#posters",
  },
  {
    id: "presentation-02-deep-learning-based-surveillance-system-using-gait-signatu",
    kind: "presentation",
    title: "Deep Learning based Surveillance System using Gait Signatures",
    date: "June 16–17, 2020",
    year: 2020,
    event: "1st Online International Conference on Advances in Computing, Communication and Control (ICA3C-2020)",
    venue: "IIMT University, Meerut",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/6.%20presentation/2/certi.pdf" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#presentations",
  },
  {
    id: "talk-09-speaker-expert-talk-on-machine-intelligence",
    kind: "invited-talk",
    title: "Speaker — Expert Talk on Machine Intelligence",
    date: "May 27, 2019",
    year: 2019,
    venue: "Bhimrao Aambedkar University, Agra, India",
    description: "Delivered an expert talk on recent trends in machine intelligence and its challenges during the one-week FDP on Advancement in Computer Science under TEQIP-III. The linked certificate records the talk date as May 29, 2019.",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/7/20260516_172526.jpg" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "conference-11-tracing-gesture-and-extracting-gait-features-to-recognize",
    kind: "conference-presentation",
    title: "Tracing Gesture and Extracting Gait Features to Recognize Parkinson's Disease Using Multi-layered Back Propagation Algorithm",
    date: "Sep 5–7, 2018",
    year: 2018,
    event: "International Conference on Innovative Technologies (InTech 2018)",
    venue: "Zagreb, Croatia",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/11/Final%20PPT%20_40%20.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/11/2.jpg" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/11/IN-TECH_2018_paper_40%20%282%29.pdf" }, { kind: "doi", href: "http://in-tech.info/download/%20IN_TECH_2018_Proceedings" }],
    researchAreaId: "res-pose-gait",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "conference-13-identification-of-gait-data-using-machine-learning-techniq",
    kind: "conference-presentation",
    title: "Identification of gait data using machine learning technique to categories human locomotion",
    date: "Oct 13–15, 2018",
    year: 2018,
    event: "10th International Conference on Security of Information and Networks",
    venue: "Jaipur, India",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/13/Final%20PPT-thesis%20ppt.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/13/certi.png" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/13/Identification%20of%20GAIT%20data%20using%20machine%20learning%20technique%20to%20categorise%20human%20locomotion%20%282%29.pdf" }, { kind: "doi", href: "https://doi.org/10.1145/3136825.3136903" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "talk-10-speaker-expert-talk-on-iot-its-applications",
    kind: "invited-talk",
    title: "Speaker — Expert Talk on IoT & Its Applications",
    date: "Feb 8, 2018",
    year: 2018,
    venue: "Bhimrao Aambedkar University, Agra, India",
    description: "Expert talk delivered during the Faculty Development Programme on Exploration of IoT & Its Applications.",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/1/DR.%20ANUBHA%20PARASHAR.pdf" }, { kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/1/20180208_143012.jpg" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
  {
    id: "conference-14-clustering-gait-data-using-different-machine-learning-tech",
    kind: "conference-presentation",
    title: "Clustering Gait Data using different machine learning techniques and finding the best technique",
    date: "Aug 6–7, 2016",
    year: 2016,
    event: "International Conference on Smart Trends for Information Technology and Computer Communications",
    venue: "Jaipur, India",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/14/110-.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/14/certi.jpeg" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/14/110.pdf" }, { kind: "doi", href: "https://doi.org/10.1007/978-981-10-3433-6_51" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "conference-15-classifying-gait-data-using-different-machine-learning-tec",
    kind: "conference-presentation",
    title: "Classifying Gait Data using different machine learning techniques and finding the optimum technique of classification",
    date: "Jul 1–2, 2016",
    year: 2016,
    event: "International Conference on ICT for Sustainable Development",
    venue: "Panaji, Goa, India",
    evidence: [{ kind: "slides", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/15/Final%20PPT-thesis%20ppt.pdf" }, { kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/15/certi.png" }, { kind: "paper", href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/15/243.pdf.pdf" }, { kind: "doi", href: "https://doi.org/10.1007/978-981-10-3920-1_31" }],
    researchAreaId: "res-gait-biometrics",
    sourceUrl: "https://anubhaparashar.github.io/publication.html#conferences",
  },
  {
    id: "presentation-01-electronic-commerce",
    kind: "presentation",
    title: "Electronic Commerce",
    date: "September 25, 2010",
    year: 2010,
    event: "Indian Society for Technical Education (ISTE) Annual Students' Convention (ASC-2010)",
    venue: "BVICAM, New Delhi",
    evidence: [{ kind: "certificate", href: "https://anubhaparashar.github.io/files/4.%20Publication/6.%20presentation/1/certi.jpeg" }],
    sourceUrl: "https://anubhaparashar.github.io/publication.html#presentations",
  },
  {
    id: "talk-11-talk-on-java-as-a-language",
    kind: "invited-talk",
    title: "Talk on Java as a Language",
    date: "2006",
    year: 2006,
    venue: "Times of India feature, St. George's Grammar School, Hyderabad",
    description: "Talk on Java as a Language, featured in a Times of India article during school years at St. George's Grammar School, Hyderabad.",
    evidence: [{ kind: "photo", href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/9.%20times%20of%20india/1.png" }],
    sourceUrl: "https://anubhaparashar.github.io/event.html#talks",
  },
];

/** Records of one kind, newest first. */
export const talksOfKind = (kind: TalkKind) =>
  talkRecords.filter((t) => t.kind === kind);

/**
 * Counts, per kind, derived from the records themselves.
 *
 * Reported separately and never summed into one "talks" figure: 11 invited
 * talks, 3 conference presentations and 1 poster are three different kinds of
 * activity, and "15 talks" would misdescribe all three.
 */
export const talkCounts = {
  invitedTalks: talksOfKind("invited-talk").length,
  presentations: talksOfKind("presentation").length,
  posters: talksOfKind("poster").length,
  paperPresentations: talksOfKind("conference-presentation").length,
} as const;

/** Only kinds that actually have records — an empty filter is not offered. */
export const talkKindsPresent = (
  ["invited-talk", "presentation", "poster", "conference-presentation"] as TalkKind[]
).filter((kind) => talksOfKind(kind).length > 0);

const areaById = new Map(researchAreas.map((a) => [a.id, a]));

/** The research area a record maps onto, when one was declared. */
export function researchAreaForTalk(talk: TalkRecord) {
  return talk.researchAreaId ? areaById.get(talk.researchAreaId) : undefined;
}

/** Newest-first, which is the order every surface shows them in. */
export const talksNewestFirst = [...talkRecords].sort((a, b) => b.year - a.year);

/**
 * The featured record: the most recent invited talk.
 *
 * Chosen by date, not by judgement about which was most impressive — there is
 * no attendance, rating or reach data behind any of these, so recency is the
 * only honest ordering.
 */
export const featuredTalk = talksOfKind("invited-talk")[0];
