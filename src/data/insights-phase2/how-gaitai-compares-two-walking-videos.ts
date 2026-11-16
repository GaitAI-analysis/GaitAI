import type { InsightArticle } from "../insights";
import { CONTACT_FORM_HREF } from "../contact";

/**
 * FORENSICSEARCH DEMONSTRATIONS · 02 — How GaitAI Compares Two Walking Videos
 *
 * The flagship of the series and the cover story of the Blog: the 60-second
 * demonstration, written up in plain English for a reader meeting GaitAI for
 * the first time. The story follows the film's own order — two street
 * recordings, one question, the white shoe and the gait cycle, the joints and
 * the outline, the counted cycles, the averaged silhouette, the cadence, the
 * withheld measurement — and ends where the film ends: the conclusion must
 * follow the evidence.
 *
 * Film: GaitAI_ForensicSearch_Flagship_60s_Polished_20261115.mp4 (60.0 s),
 * re-encoded for the web as /assets/videos/insights/forensicsearch/flagship.mp4
 * with the cut's own English captions. Every value in this story — two and
 * five cycles, 99.2 and 96.4 steps per minute, the withheld step-time
 * asymmetry — is one the film shows on screen, from a single demonstration
 * analysis of two short clips. None is a performance claim.
 */
export const howGaitaiComparesTwoWalkingVideos: InsightArticle = {
  slug: "how-gaitai-compares-two-walking-videos",
  title: "How GaitAI Compares Two Walking Videos",
  titleAccent: "Two Walking Videos",
  subtitle: "The 60-second demonstration, explained in plain English",
  deck:
    "Two street recordings from two cameras. One person in each, walking past. One question: could this be the same person? In sixty seconds the demonstration film goes from the clips to the movement features a reviewer can examine, counts what can be counted, measures what can be measured, and declines to report one number the footage cannot support. This is the story of that minute.",
  postType: "essay",
  category: "ForensicSearch",
  topics: ["movement-intelligence", "responsible-ai"],
  date: "2026-11-16",
  featured: true,
  excerpt:
    "Two street recordings, one question, sixty seconds. How the demonstration film gets from two clips to a comparison a reviewer can examine — the gait cycle, the joints and the outline, two counts, two cadences and one measurement the software withholds.",
  question: "Two cameras each caught someone walking past. What can be compared, and what cannot?",
  ctaLabel: "Watch the demonstration",
  hooks: [
    "How a walk is cut into cycles, and why the film counts them before it measures anything",
    "What the two cadences in the film do and do not tell you",
    "Why the software withholds a measurement instead of reporting it, and why that is the point",
  ],
  openingHook:
    "Before you scroll: the whole demonstration is one minute long. Watch it once straight through; the story below then walks the same minute at reading pace.",
  twoMinute: [
    "The film starts with two street recordings — Recording A from a street corner, Recording B from a terrace street — and one question: could this be the same person?",
    "It finds the repeat first. Watch the white shoe: it lands, and when the same foot returns to the ground one complete gait cycle has passed. Recording A contains two complete cycles; Recording B contains five.",
    "Two readings of each walk follow. Pose estimation follows the joints frame by frame; silhouette extraction separates the walker's outline from the scene. The outlines, aligned across the cycle and averaged, become a gait energy image.",
    "Cadence is measured: 99.2 steps per minute in Recording A, 96.4 in Recording B. A similar pace is one observation, not a match.",
    "One measurement is withheld. Step-time asymmetry for Recording B is not reported because the left and right leg labels are not consistent, so the software says so instead of guessing.",
    "The film ends on its own rule: the conclusion must follow the evidence. The measurements are for a reviewer to examine; no identity conclusion is made.",
  ],
  series: "ForensicSearch Demonstrations",
  seriesStep: 2,
  seriesOrder: 2,
  seriesTitle: "The 60-second demonstration",
  evidenceLevel: "illustrative",
  relatedSignals: ["cap-gait", "cap-pose", "sig-cadence", "sig-step-symmetry"],
  memorableInteraction:
    "Editorial: the thing to remember is the white shoe — watch it land and return, and you have seen the gait cycle every measurement in the film is built on.",
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
    title: "How GaitAI Compares Two Walking Videos: The 60-Second Demonstration",
    description:
      "Two street recordings, one question. The 60-second ForensicSearch demonstration explained in plain English: gait cycles, pose and silhouette, cadence, a withheld measurement, and a conclusion that follows the evidence.",
  },
  intro: [
    {
      type: "lead",
      text: "If you watch one thing on this site, make it the minute below. It is a demonstration of how GaitAI compares two walking recordings so that a human reviewer can examine the result — not a promise about who the two walkers are. Press play, and then read on; the story follows the film in order.",
    },
    {
      type: "video",
      src: "/assets/videos/insights/forensicsearch/flagship.mp4",
      poster: "/assets/images/insights/video/forensicsearch-flagship-poster.jpg",
      captions: "/assets/videos/insights/forensicsearch/flagship.en.vtt",
      title: "How GaitAI compares two walking videos — the 60-second demonstration",
      duration: "1:00",
      caption:
        "Two street recordings, one question, and the measurements a reviewer can examine. Film 2 of 3 in the ForensicSearch series.",
      width: 1920,
      height: 1080,
    },
    {
      type: "p",
      text: "The film has a simple shape. It shows two clips and asks one question. It finds the repeating unit of a walk, reads each walk two ways, counts and measures what the footage supports, withholds what it does not, and ends with a rule about conclusions. Each of those is a section below.",
    },
    {
      type: "note",
      text: "Every number in this story appears on screen in the film and comes from a single demonstration analysis of two short clips. None is a claim about how the product performs. For what the live product does, see the [ForensicSearch product page](/securevision/forensicsearch/).",
    },
  ],
  sections: [
    {
      id: "two-clips-one-question",
      number: "01",
      navLabel: "Two clips",
      title: "Two clips, one question",
      blocks: [
        {
          type: "p",
          text: "After the corridor opening, the film cuts to the street. Recording A is a street corner: a person in a light top and dark trousers walks past, left to right, in front of a traffic light. Recording B is a terrace street: a person walks past, right to left, in front of a row of doors and railings. Both are side views. Both are a few seconds long. Neither shows a usable face, and the film does not look for one.",
        },
        {
          type: "p",
          text: "The caption asks the only question the film will ask: could this be the same person? Notice the phrasing. Not \"is this the same person\" — \"could this be\". Everything that follows is in service of giving a reviewer something to examine while thinking about that question, and the film never answers it on their behalf.",
        },
        {
          type: "flow",
          layout: "row",
          steps: ["Two recordings", "One gait cycle", "Joints and outline", "Counts and measures", "What is withheld", "Review"],
          caption: "The film's shape, in six steps. The last is a person's, not the software's.",
        },
      ],
    },
    {
      id: "the-white-shoe",
      number: "02",
      navLabel: "The cycle",
      title: "Finding the repeat: watch the white shoe",
      blocks: [
        {
          type: "p",
          text: "The film's first move is not a measurement. It is a close replay at half speed with one instruction: watch the white shoe. The shoe lands. The other foot passes it and lands. Then the white shoe returns to the ground. The caption names what you have just seen — that is one complete gait cycle — and marks the two moments that bound it: first contact, and the same foot returning.",
        },
        {
          type: "p",
          text: "This matters because a walk is only measurable as a repeat. Steps per minute, the evenness of left and right, the shape of the body across a stride: each is a property of the cycle, and each needs more than one cycle to be worth stating. So before the film measures anything, it counts. **Recording A contains two complete cycles. Recording B contains five.** Two cycles is enough to begin from and not a lot; five is a more comfortable basis. The film puts both numbers on screen beside the silhouettes, and a reviewer sees at once that the two recordings do not offer the same amount of walk.",
        },
        {
          type: "matters",
          text: "Walking-cycle coverage is the first thing a reviewer should know about a clip, because every later measurement is averaged over the cycles it contains. The film shows the count before it shows a single measurement, and so does the product's own report.",
        },
      ],
    },
    {
      id: "joints-and-outline",
      number: "03",
      navLabel: "Two readings",
      title: "From pixels to movement features",
      blocks: [
        {
          type: "p",
          text: "With the cycle found, the film reads each walk two ways. The first is **pose estimation**: a set of joints — hips, knees, ankles, shoulders — located in every frame and followed through the clip, so the walk becomes moving geometry. The caption calls this movement, frame by frame. The second is **silhouette extraction**: the walker's outline lifted away from the street, the doors and the traffic light, so the walk becomes a changing white shape against nothing.",
        },
        {
          type: "p",
          text: "Then the film does something with the outlines that is worth watching twice. The silhouettes from one recording are aligned so that corresponding moments of the cycle sit on top of each other, and averaged. The result is a single soft image — the **gait energy image** — in which the parts of the frame the body occupies most often are brightest. The head and trunk, which barely move across a cycle, are solid; the legs, which sweep through the cycle, fade into a blur that records where they have been. The film shows one for each recording, Recording A in white and Recording B in teal, and captions it a walk, accumulated.",
        },
        {
          type: "p",
          text: "Finally, a number. **Cadence** is steps per minute, read from the rhythm of the footfalls. The film shows 99.2 steps per minute in Recording A and 96.4 in Recording B. Two numbers, close together. The temptation is to read them as a match. The film does not, and the next section is about why.",
        },
      ],
    },
    {
      id: "the-withheld-measurement",
      number: "04",
      navLabel: "Withheld",
      title: "A measurement the software declines to give",
      blocks: [
        {
          type: "p",
          text: "After the cadences, the film shows a card for Recording B with one word set large: withheld. The measurement is step-time asymmetry — how evenly the time between footfalls is shared between the left and right steps — and the reason is printed under it: left and right labels are inconsistent.",
        },
        {
          type: "p",
          text: "Here is what that means. To say anything about left against right, the software has to know, at every step, which foot is which. In a side view the two legs cross each other constantly, and a pose model can swap its left and right labels as they do. In Recording B the labels did not alternate reliably from step to step. An asymmetry computed on top of that would be a number with no footing — and so the software reports that it cannot support the measurement, rather than reporting a measurement it cannot support.",
        },
        {
          type: "callout",
          tone: "violet",
          title: "Why a withheld number is the point",
          text: "A system that always produces a value hides its own uncertainty inside the value. A system that withholds tells the reviewer exactly where the footage ran out. The second is harder to build and more useful to have, and the film puts it on screen deliberately, between the cadences and the ending.",
        },
      ],
    },
    {
      id: "what-the-footage-supports",
      number: "05",
      navLabel: "The ending",
      title: "What the footage supports, and how the film ends",
      blocks: [
        {
          type: "p",
          text: "So what can a reviewer take from the minute? That the two recordings each show a side view of a walk; that one contains two complete cycles and the other five; that the two walks have averaged outlines they can look at side by side; that the two cadences are close; and that for one recording the left-right measurements are not available. That is a real set of observations. It is also, plainly, not an identification, and the film says why in its last ten seconds.",
        },
        {
          type: "quote",
          text: "The conclusion must follow the evidence.",
        },
        {
          type: "p",
          text: "The film returns to the corridor it opened in, the man still walking away, and prints that line over him. Then the brand, and an invitation to request a demonstration. There is no verdict card, no score, no statement about whether A and B are the same person. The measurements are evidence to examine. Who examines them, and what they conclude, is the reviewer's job — which is the only ending a demonstration like this should have.",
        },
        {
          type: "p",
          text: "In the live product that reviewer is an authorized investigator working inside a case: footage is indexed by movement, candidate segments are ranked for review, every query is audited, and nothing enters a review pack without human confirmation. The [ForensicSearch product page](/securevision/forensicsearch/) describes that workflow. The film shows the comparison at its centre.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "One minute, two clips, one question — and an answer that is a set of observations rather than a name. The film counts before it measures, measures only what the footage supports, withholds what it does not, and leaves the conclusion to a person. If you remember one image from it, make it the white shoe landing and returning: everything else in the minute is built on that cycle.",
    },
    {
      type: "p",
      text: "To see how each step is done — how cycles are aligned, how the gait energy image is formed, and exactly why unstable left–right tracking withholds a measurement — continue to the technical walkthrough, [Inside a Gait Comparison: What the Footage Can Support](/insights/inside-a-gait-comparison-what-the-footage-can-support/). If you arrived here first, the series opens with the eight-second film in [What Can a Walk Reveal?](/insights/what-can-a-walk-reveal/). To see the comparison on your own footage, request a demonstration below.",
    },
  ],
  cta: { label: "Request a Demo", href: CONTACT_FORM_HREF },
  related: [
    "inside-a-gait-comparison-what-the-footage-can-support",
    "what-can-a-walk-reveal",
  ],
};
