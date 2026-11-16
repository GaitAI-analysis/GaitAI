import type { InsightArticle } from "../insights";

export const whatCanAWalkReveal: InsightArticle = {
  slug: "what-can-a-walk-reveal",
  title: "What Can a Walk Reveal?",
  titleAccent: "Walk Reveal?",
  deck: "A hallway camera follows someone walking away. The sequence still shows where they went and how they moved.",
  postType: "essay",
  category: "ForensicSearch",
  topics: ["movement-intelligence", "responsible-ai"],
  date: "2026-11-16",
  excerpt: "What can a hallway camera tell you about someone walking away? Start with direction, pace and the steps you can actually see.",
  question: "What can you observe when a camera captures a person walking away?",
  ctaLabel: "Watch the opening",
  hooks: [],
  openingHook: "",
  twoMinute: [],
  series: "ForensicSearch Demonstrations",
  seriesStep: 1,
  seriesOrder: 1,
  seriesTitle: "What a walk shows",
  evidenceLevel: "illustrative",
  relatedSignals: ["cap-gait", "cap-pose", "sig-cadence"],
  memorableInteraction: "Follow the walker through the hallway and look for successive foot contacts.",
  hero: {
    src: "/assets/images/insights/social/what-can-a-walk-reveal.jpg",
    alt: "A still from the opening film: a man in a dark jacket walks away down a bright corridor, with the words 'What can a walk reveal?' beside him",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "reduction",
    alt: "A man walking away from the camera down a bright corridor, filmed from behind so that no face is visible.",
    image: {
      src: "/assets/images/insights/video/forensicsearch-opening-poster.jpg",
      width: 1280,
      height: 720,
    },
  },
  tags: ["ForensicSearch", "Gait", "Movement Comparison", "Video Evidence", "Demonstration"],
  relatedProducts: ["forensicsearch"],
  seo: {
    title: "What Can a Walk Reveal? The ForensicSearch Opening Film",
    description:
      "What can a hallway camera tell you about someone walking away? Start with direction, pace and the steps you can actually see.",
  },
  intro: [
    { type: "lead", text: "A man walks away from a hallway camera. The walls give you a reference for his direction of travel. Over the next few seconds, his feet land in turn, his weight shifts and his arms swing. Those details emerge across the sequence." },
    {
      type: "video",
      src: "/assets/videos/insights/forensicsearch/opening.mp4",
      poster: "/assets/images/insights/video/forensicsearch-opening-poster.jpg",
      captions: "/assets/videos/insights/forensicsearch/opening.en.vtt",
      title: "What can a walk reveal? — the opening film",
      duration: "0:08.5",
      caption: "A hallway recording from behind the walker.",
      width: 1920,
      height: 1080,
    },
  ],
  sections: [
    {
      id: "what-the-camera-kept",
      number: "01",
      navLabel: "Direction",
      title: "Follow the path",
      blocks: [
        { type: "p", text: "The corridor gives the eye fixed points to work with. You can see the walker travelling away from the camera and check where his path sits relative to the walls and doors. A second camera could show the same stretch of movement from a different angle." },
      ],
    },
    {
      id: "a-sequence-not-a-frame",
      number: "02",
      navLabel: "Rhythm",
      title: "Watch how the steps repeat",
      blocks: [
        { type: "p", text: "You can follow the rhythm by watching one foot touch the floor and looking for its next contact. A full cycle needs both moments to be visible. As the person gets farther away, smaller details such as the exact instant of contact become harder to see." },
      ],
    },
    {
      id: "what-this-is-not",
      number: "03",
      navLabel: "Clarity",
      title: "Consider what the view leaves unclear",
      blocks: [
        { type: "p", text: "A rear view can hide parts of a step when the legs overlap. The length of the clip, the angle and the visibility of the feet determine which details are worth comparing with another recording." },
      ],
    },
    {
      id: "the-series",
      number: "04",
      navLabel: "Next film",
      title: "Bring a second recording into view",
      blocks: [
        { type: "p", text: "The [one-minute demonstration](/insights/how-gaitai-compares-two-walking-videos/) takes that next step with two street recordings. It shows how to find a complete cycle and compare the pace of the two walks." },
      ],
    },
  ],
  closing: [],
  cta: {
    label: "Watch the 60-second demonstration",
    href: "/insights/how-gaitai-compares-two-walking-videos/",
  },
  related: [
    "how-gaitai-compares-two-walking-videos",
    "inside-a-gait-comparison-what-the-footage-can-support",
  ],
};
