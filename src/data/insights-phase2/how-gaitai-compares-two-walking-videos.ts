import type { InsightArticle } from "../insights";
import { CONTACT_FORM_HREF } from "../contact";

export const howGaitaiComparesTwoWalkingVideos: InsightArticle = {
  slug: "how-gaitai-compares-two-walking-videos",
  title: "How GaitAI Compares Two Walking Videos",
  titleAccent: "Two Walking Videos",
  deck: "Two street recordings show people walking at a similar pace. The comparison starts with the footfalls each camera captured.",
  postType: "essay",
  category: "ForensicSearch",
  topics: ["movement-intelligence", "responsible-ai"],
  date: "2026-11-16",
  featured: true,
  excerpt: "See how GaitAI compares walking cycles, body outlines and pace across two street recordings, and flags a measurement for which the tracking is unreliable.",
  question: "How can you compare two walking recordings with different amounts of usable footage?",
  ctaLabel: "Watch the demonstration",
  hooks: [],
  openingHook: "",
  twoMinute: [],
  series: "ForensicSearch Demonstrations",
  seriesStep: 2,
  seriesOrder: 2,
  seriesTitle: "The 60-second demonstration",
  evidenceLevel: "illustrative",
  relatedSignals: ["cap-gait", "cap-pose", "sig-cadence", "sig-step-symmetry"],
  memorableInteraction: "Follow the white shoe and use its contacts to locate a complete walking cycle.",
  hero: {
    src: "/assets/images/insights/social/how-gaitai-compares-two-walking-videos.jpg",
    alt: "A still from the demonstration film: Recording A and Recording B side by side under the title 'Gait comparison', each showing a person walking past on a street",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "pipeline",
    alt: "Two street recordings side by side, labelled Recording A and Recording B, in a cycle-aligned replay.",
    image: {
      src: "/assets/images/insights/video/forensicsearch-flagship-poster.jpg",
      width: 1280,
      height: 720,
    },
  },
  tags: ["ForensicSearch", "Gait Cycle", "Cadence", "Gait Energy Image", "Movement Comparison", "Demonstration"],
  relatedProducts: ["forensicsearch"],
  seo: {
    title: "How GaitAI Compares Two Walking Videos",
    description:
      "See how GaitAI compares walking cycles, body outlines and pace across two street recordings, and flags a measurement for which the tracking is unreliable.",
  },
  intro: [
    { type: "lead", text: "When two cameras capture different portions of a walk, the first step is to find something visible in both recordings. In this ForensicSearch demonstration, GaitAI starts with the moment a shoe touches the pavement." },
    {
      type: "video",
      src: "/assets/videos/insights/forensicsearch/flagship.mp4",
      poster: "/assets/images/insights/video/forensicsearch-flagship-poster.jpg",
      captions: "/assets/videos/insights/forensicsearch/flagship.en.vtt",
      title: "How GaitAI compares two walking videos — the 60-second demonstration",
      duration: "1:00",
      caption: "The 60-second ForensicSearch demonstration.",
      width: 1920,
      height: 1080,
    },
  ],
  sections: [
    {
      id: "two-clips-one-question",
      number: "01",
      navLabel: "The recordings",
      title: "Start with what each camera captured",
      blocks: [
        { type: "p", text: "Both cameras show a side view, but the walkers move in opposite directions across the screen. A reviewer can use visible foot contacts as common reference points, even when the angle, background and length of the recordings differ." },
      ],
    },
    {
      id: "the-white-shoe",
      number: "02",
      navLabel: "Walking cycles",
      title: "Find a complete walking cycle",
      blocks: [
        { type: "p", text: "Follow the white shoe from one contact with the pavement to the next contact of that same foot. That interval is one gait cycle. Recording A shows two complete cycles and Recording B shows five. The counts tell the reviewer how much of each walk is available for comparison." },
      ],
    },
    {
      id: "joints-and-outline",
      number: "03",
      navLabel: "Movement features",
      title: "Compare the movement from two views",
      blocks: [
        { type: "p", text: "Pose estimation follows the positions of joints such as the hip, knee and ankle. Silhouette extraction traces the outline of the body through the same frames. Together they let the reviewer inspect individual joint movements and see how the whole outline changes." },
        { type: "p", text: "Cadence adds a measure of pace. Recording A shows **99.2 steps per minute** and Recording B shows **96.4**. The similar cadence gives the reviewer one point of comparison alongside the visible steps and body outlines." },
      ],
    },
    {
      id: "the-withheld-measurement",
      number: "04",
      navLabel: "Tracking quality",
      title: "Check whether the legs can be tracked reliably",
      blocks: [
        { type: "p", text: "Recording B has inconsistent left and right leg labels. A measure of step-time asymmetry needs a reliable assignment of each footfall to a leg. When that assignment can change from frame to frame, the comparison leaves the asymmetry unreported." },
      ],
    },
    {
      id: "what-the-footage-supports",
      number: "05",
      navLabel: "Review",
      title: "Return to the source footage",
      blocks: [
        { type: "p", text: "The cycle counts and cadence give a reviewer specific observations to check against the original clips. A reviewer can replay the relevant footfalls, inspect where the tracking becomes uncertain and interpret the movement alongside the other evidence in the case. [Explore ForensicSearch](/securevision/forensicsearch/) to see the workflow for finding and reviewing candidate footage." },
      ],
    },
  ],
  closing: [
    { type: "p", text: "The [technical walkthrough](/insights/inside-a-gait-comparison-what-the-footage-can-support/) shows how the two walks are aligned and how a series of outlines becomes a gait energy image." },
  ],
  cta: { label: "Request a Demo", href: CONTACT_FORM_HREF },
  related: [
    "inside-a-gait-comparison-what-the-footage-can-support",
    "what-can-a-walk-reveal",
  ],
};
