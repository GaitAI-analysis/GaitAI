/**
 * Withheld talk evidence — provenance only, never published.
 *
 * The slides and certificates behind the records in `talks.ts`. They are
 * kept so a claim on the Talks page can still be checked against its
 * artefact, and they are in a SEPARATE MODULE for one specific reason:
 * `TalksTimeline` is a client component that imports the records, so
 * anything left on a record is serialised into the page HTML. Thirty
 * certificate URLs shipped that way before this split.
 *
 * NOTHING MAY IMPORT THIS FILE FROM A COMPONENT. It exists for humans and
 * for scripts. If a page ever needs it, that page is doing the wrong
 * thing: both artefact kinds carry personal-name detail on their face,
 * and they remain available on the founder's own research site.
 */

export interface WithheldEvidence {
  /** Matches a `talkRecords` id. */
  id: string;
  title: string;
  kind: "slides" | "certificate";
  href: string;
}

export const withheldTalkEvidence: WithheldEvidence[] = [
  {
    id: "talk-02-speaker-for-an-expert-talk-on-ai-and-online-teaching-learn",
    title: "Speaker for an Expert Talk on AI and Online Teaching-Learning Practices",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/8.%20Expert%20talk%20on%20AI/Dr.%20Anubha%20Parashar.pdf",
  },
  {
    id: "conference-01-deep-learning-based-framework-for-accurate-clothing-attrib",
    title: "Deep Learning-based Framework for Accurate Clothing Attribute Recognition and Style Navigation for Gait Recognition",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/1/Deep%20Learning-based%20Framework%20for%20Accurate%20Clothing%20Attribute%20Recognition.pdf",
  },
  {
    id: "conference-01-deep-learning-based-framework-for-accurate-clothing-attrib",
    title: "Deep Learning-based Framework for Accurate Clothing Attribute Recognition and Style Navigation for Gait Recognition",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/1/Anubha%20Parashar.png",
  },
  {
    id: "conference-02-protecting-the-privacy-of-face-by-de-identification-pipeli",
    title: "Protecting the Privacy of Face by De-Identification Pipeline Based on Deep Learning",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/2/ppt.pdf",
  },
  {
    id: "conference-02-protecting-the-privacy-of-face-by-de-identification-pipeli",
    title: "Protecting the Privacy of Face by De-Identification Pipeline Based on Deep Learning",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/2/Certificate-Anubha.pdf",
  },
  {
    id: "conference-03-optimized-pose-based-gait-analysis-for-surveillance",
    title: "Optimized Pose-Based Gait Analysis for Surveillance",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/3/ICICV_2021_Gait_Analysis_Presentation.pdf",
  },
  {
    id: "conference-03-optimized-pose-based-gait-analysis-for-surveillance",
    title: "Optimized Pose-Based Gait Analysis for Surveillance",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/3/certificate.jpg",
  },
  {
    id: "talk-05-speaker-for-an-iot-session",
    title: "Speaker for an IoT Session",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/5.%20iot%20speaker/certificates-speakers.pdf",
  },
  {
    id: "presentation-03-early-detection-of-rheumatoid-arthritis-in-knee-using-deep",
    title: "Early Detection of Rheumatoid Arthritis in Knee using Deep Learning",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/6.%20presentation/3/certi.jpg",
  },
  {
    id: "conference-07-surveillance-system-to-provide-secured-gait-signatures-in",
    title: "Surveillance System To Provide Secured Gait Signatures In Multi View Variations Using Deep Learning",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/7/Surveillance%20System%20to%20Provide%20Secured%20Gait%20Signatures%20Using.pdf",
  },
  {
    id: "conference-07-surveillance-system-to-provide-secured-gait-signatures-in",
    title: "Surveillance System To Provide Secured Gait Signatures In Multi View Variations Using Deep Learning",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/7/certi.jpeg",
  },
  {
    id: "talk-07-speaker-introduction-to-artificial-intelligence-and-iot",
    title: "Speaker — Introduction to Artificial Intelligence and IoT",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/2/certi.pdf",
  },
  {
    id: "presentation-02-deep-learning-based-surveillance-system-using-gait-signatu",
    title: "Deep Learning based Surveillance System using Gait Signatures",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/6.%20presentation/2/certi.pdf",
  },
  {
    id: "talk-09-speaker-expert-talk-on-machine-intelligence",
    title: "Speaker — Expert Talk on Machine Intelligence",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/7/20260516_172526.jpg",
  },
  {
    id: "conference-11-tracing-gesture-and-extracting-gait-features-to-recognize",
    title: "Tracing Gesture and Extracting Gait Features to Recognize Parkinson's Disease Using Multi-layered Back Propagation Algorithm",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/11/Final%20PPT%20_40%20.pdf",
  },
  {
    id: "conference-11-tracing-gesture-and-extracting-gait-features-to-recognize",
    title: "Tracing Gesture and Extracting Gait Features to Recognize Parkinson's Disease Using Multi-layered Back Propagation Algorithm",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/11/2.jpg",
  },
  {
    id: "conference-13-identification-of-gait-data-using-machine-learning-techniq",
    title: "Identification of gait data using machine learning technique to categories human locomotion",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/13/Final%20PPT-thesis%20ppt.pdf",
  },
  {
    id: "conference-13-identification-of-gait-data-using-machine-learning-techniq",
    title: "Identification of gait data using machine learning technique to categories human locomotion",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/13/certi.png",
  },
  {
    id: "talk-10-speaker-expert-talk-on-iot-its-applications",
    title: "Speaker — Expert Talk on IoT & Its Applications",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/8.%20Blog/1.%20academic/4.%20expert%20talk/1/DR.%20ANUBHA%20PARASHAR.pdf",
  },
  {
    id: "conference-14-clustering-gait-data-using-different-machine-learning-tech",
    title: "Clustering Gait Data using different machine learning techniques and finding the best technique",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/14/110-.pdf",
  },
  {
    id: "conference-14-clustering-gait-data-using-different-machine-learning-tech",
    title: "Clustering Gait Data using different machine learning techniques and finding the best technique",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/14/certi.jpeg",
  },
  {
    id: "conference-15-classifying-gait-data-using-different-machine-learning-tec",
    title: "Classifying Gait Data using different machine learning techniques and finding the optimum technique of classification",
    kind: "slides",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/15/Final%20PPT-thesis%20ppt.pdf",
  },
  {
    id: "conference-15-classifying-gait-data-using-different-machine-learning-tec",
    title: "Classifying Gait Data using different machine learning techniques and finding the optimum technique of classification",
    kind: "certificate",
    href: "https://anubhaparashar.github.io/files/4.%20Publication/3.%20conference/15/certi.png",
  },
];
