import type { InsightArticle } from "../insights";
import { CONTACT_FORM_HREF } from "../contact";

export const insideAGaitComparison: InsightArticle = {
  slug: "inside-a-gait-comparison-what-the-footage-can-support",
  title: "Inside a Gait Comparison: What the Footage Can Support",
  titleAccent: "What the Footage Can Support",
  deck: "How cycle alignment, silhouette averaging and tracking quality determine what a reviewer can compare.",
  postType: "essay",
  category: "ForensicSearch",
  topics: ["movement-intelligence", "responsible-ai"],
  date: "2026-11-16",
  excerpt: "See how two clips are aligned by walking phase, how their silhouettes are averaged, and why unreliable leg labels can rule out side-specific measurements.",
  question: "What changes when you align two walks by the phase of a step?",
  ctaLabel: "Watch the walkthrough",
  hooks: [],
  openingHook: "",
  twoMinute: [],
  series: "ForensicSearch Demonstrations",
  seriesStep: 3,
  seriesOrder: 3,
  seriesTitle: "The technical walkthrough",
  evidenceLevel: "illustrative",
  relatedSignals: ["cap-gait", "cap-pose", "cap-temporal", "sig-cadence", "sig-step-symmetry"],
  memorableInteraction: "Compare matching points in the two walking cycles as the films play side by side.",
  hero: {
    src: "/assets/images/insights/social/inside-a-gait-comparison-what-the-footage-can-support.jpg",
    alt: "A still from the technical walkthrough: two gait energy images side by side, Recording A in white and Recording B in teal, captioned 'Movement evidence. Not an identity.'",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "symmetry",
    alt: "Two gait energy images side by side — soft averaged silhouettes of two walks, one white and one teal.",
    image: {
      src: "/assets/images/insights/video/forensicsearch-technical-poster.jpg",
      width: 1280,
      height: 720,
    },
  },
  tags: ["ForensicSearch", "Gait Cycle", "Phase Alignment", "Gait Energy Image", "Cadence", "Step-Time Asymmetry", "Demonstration"],
  relatedProducts: ["forensicsearch"],
  seo: {
    title: "Inside a Gait Comparison: What the Footage Can Support",
    description:
      "See how two clips are aligned by walking phase, how their silhouettes are averaged, and why unreliable leg labels can rule out side-specific measurements.",
  },
  intro: [
    { type: "lead", text: "Comparing frames taken at the same elapsed time can put one walker mid-stride and the other at foot contact. Aligning by gait phase gives both clips a common reference and makes the comparison easier to inspect." },
    {
      type: "video",
      src: "/assets/videos/insights/forensicsearch/technical.mp4",
      poster: "/assets/images/insights/video/forensicsearch-technical-poster.jpg",
      captions: "/assets/videos/insights/forensicsearch/technical.en.vtt",
      title: "Inside a gait comparison — the technical walkthrough",
      duration: "1:48",
      caption: "The technical walkthrough of phase alignment and measurement quality.",
      width: 1920,
      height: 1080,
    },
  ],
  sections: [
    {
      id: "two-recordings-two-viewpoints",
      number: "01",
      navLabel: "Inputs",
      title: "Check the source clips",
      blocks: [
        { type: "p", text: "The [flagship demonstration](/insights/how-gaitai-compares-two-walking-videos/) uses two side-view recordings. Recording A contains two complete cycles and Recording B contains five. In each clip, consecutive contacts of the same foot define the start and end of a cycle. Partial cycles can still provide context when a reviewer returns to the footage." },
      ],
    },
    {
      id: "gait-cycle-alignment",
      number: "02",
      navLabel: "Phase alignment",
      title: "Align the walks by phase",
      blocks: [
        { type: "p", text: "Each complete cycle can be expressed from its start to its end on a common scale. A contact in Recording A can then be compared with the corresponding contact in Recording B, even if the two cycles take different amounts of time." },
        { type: "p", text: "That alignment makes it easier to compare how the knees, ankles and body outline move through the cycle. Keep the source timestamps available to inspect how long each step took in the original footage." },
      ],
    },
    {
      id: "the-gait-energy-image",
      number: "03",
      navLabel: "Silhouettes",
      title: "Read the gait energy image",
      blocks: [
        { type: "p", text: "A gait energy image averages the silhouettes across a cycle. Bright areas show where the body appears in many frames. Fainter areas trace positions it occupies briefly, often near the feet and lower legs." },
        { type: "p", text: "The average gives a compact view of the overall movement. To inspect when a particular position occurs, go back to the aligned frames. Camera angle, occlusion and errors in the silhouette can all affect the average." },
      ],
    },
    {
      id: "cadence",
      number: "04",
      navLabel: "Cadence",
      title: "Keep cadence tied to the source timing",
      blocks: [
        { type: "p", text: "Cadence measures how often steps occur in the original video. The demonstration reports **99.2 steps per minute** in Recording A and **96.4** in Recording B. Consider those values alongside cycle coverage and the movement visible in the clips." },
      ],
    },
    {
      id: "why-a-measurement-is-withheld",
      number: "05",
      navLabel: "Tracking quality",
      title: "Require stable leg labels for side-specific measures",
      blocks: [
        { type: "p", text: "In Recording B, the pose tracker is inconsistent about which leg is left and which is right. A label swap can assign a footfall to the wrong side or connect points from different legs into a single joint curve. The walkthrough withholds both step-time asymmetry and side-specific joint curves for that recording." },
      ],
    },
    {
      id: "what-remains-for-the-reviewer",
      number: "06",
      navLabel: "Review",
      title: "Trace each measurement back to its inputs",
      blocks: [
        { type: "p", text: "A reviewer can check the cycle boundaries against the visible foot contacts, compare the aligned motion and see which measures depended on unstable tracking. Those details help the reviewer decide what to carry forward and where the available footage leaves uncertainty." },
      ],
    },
  ],
  closing: [
    { type: "p", text: "For the short version, watch [How GaitAI Compares Two Walking Videos](/insights/how-gaitai-compares-two-walking-videos/). The [ForensicSearch overview](/securevision/forensicsearch/) describes the broader footage review workflow." },
  ],
  cta: { label: "Request a Demo", href: CONTACT_FORM_HREF },
  related: [
    "how-gaitai-compares-two-walking-videos",
    "what-can-a-walk-reveal",
  ],
};
