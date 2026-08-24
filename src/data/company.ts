import { papers, patent } from "@/data/publications";

export const researchProof = [
  {
    value: "10+",
    label: "Years of gait research",
    note: "Founder research, academia and applied AI",
  },
  {
    value: "50+",
    label: "Peer-reviewed publications",
    note: `${papers.length} selected works are surfaced on this site`,
  },
  {
    value: "1",
    label: "Granted patent highlighted",
    note: `Indian Patent No. ${patent.patentNumber}`,
  },
] as const;

export const researchProductTimeline = [
  {
    marker: "Research foundation",
    title: "Gait biometrics and movement modelling",
    description:
      "A 10+ year founder research record spanning gait recognition, computer vision and applied movement analysis.",
  },
  {
    marker: "2021",
    title: "Edge gait-recognition patent filed",
    description: `${patent.title}. Application ${patent.applicationNumber}, filed ${patent.filingDate}.`,
  },
  {
    marker: "2022",
    title: "Patent granted and research published",
    description: `Indian Patent No. ${patent.patentNumber} was granted ${patent.grantDate}; selected papers cover covariates, pose features and gait-data privacy.`,
  },
  {
    marker: "2023–2024",
    title: "Research portfolio expands",
    description: `${papers.length} selected papers on this site connect gait recognition, deep learning, feature engineering and privacy-preserving methods.`,
  },
  {
    marker: "GaitAI",
    title: "One movement-intelligence platform",
    description:
      "The research foundation is expressed through MobilityCare and SecureVision, powered by specialized product modules.",
  },
] as const;
