import type { InsightArticle } from "../insights";

/**
 * FORENSICSEARCH DEMONSTRATIONS · 01 — What Can a Walk Reveal?
 *
 * The opening of a three-film series. An eight-and-a-half-second hallway
 * shot — a man walking away from the camera, face never shown — and the one
 * question it leaves behind. The story introduces the series, says what the
 * films are (demonstrations of movement comparison for human review) and
 * what they are not (an identification), and hands over to the 60-second
 * demonstration.
 *
 * Film: GaitAI_ForensicSearch_Opening_8p5s.mp4 (8.5 s), re-encoded for the
 * web as /assets/videos/insights/forensicsearch/opening.mp4. The captions are
 * the cut's own two English cues. No value in this story is a performance
 * claim; the live product is described only through its product page.
 */
export const whatCanAWalkReveal: InsightArticle = {
  slug: "what-can-a-walk-reveal",
  title: "What Can a Walk Reveal?",
  titleAccent: "Walk Reveal?",
  subtitle: "An eight-second opening, and the question behind a three-film series",
  deck:
    "A corridor, a man walking away from the camera, and no face at any point. The camera has kept almost nothing an identity check would want — and yet it has kept something. This opening film asks what that something is, and the two films that follow it show how two walking recordings are compared for a human reviewer to examine.",
  postType: "essay",
  category: "ForensicSearch",
  topics: ["movement-intelligence", "responsible-ai"],
  date: "2026-11-16",
  excerpt:
    "A camera films someone walking away and never shows a face. What is left to observe? The opening film of the ForensicSearch series, and a short guide to the two demonstrations that follow it.",
  question: "When a recording shows a walk but no face, what is actually left to look at?",
  ctaLabel: "Watch the opening",
  hooks: [
    "What a walking recording keeps when it keeps no facial detail",
    "Why a sequence of frames shows something a single frame cannot",
    "What the three ForensicSearch films are, in viewing order, and what they are not",
  ],
  openingHook:
    "Before you scroll: eight and a half seconds of a man walking down a corridor, filmed from behind. Watch it once, then ask yourself what you could say about him.",
  twoMinute: [
    "The opening film shows a walk with no usable face. What remains is movement: the rhythm of the steps, the swing of the arms, the way the weight moves from one foot to the other.",
    "Movement lives in the sequence, not in any one frame. A frame shows a posture; the frames together show a gait — and gait repeats, which is what makes it measurable.",
    "The series has three films, best watched in order: this opening, a 60-second demonstration that compares two street recordings, and a technical walkthrough of the same comparison.",
    "Every film is a demonstration of movement comparison for human review. None of them identifies anyone, and the values they show come from one demonstration analysis, not from a claim about the product's performance.",
    "The next film is the one to watch first if you have only a minute: two clips, one question, and a conclusion that has to follow the evidence.",
  ],
  series: "ForensicSearch Demonstrations",
  seriesStep: 1,
  seriesOrder: 1,
  seriesTitle: "What a walk shows",
  evidenceLevel: "illustrative",
  relatedSignals: ["cap-gait", "cap-pose", "sig-cadence"],
  memorableInteraction:
    "Editorial: this story is watched rather than played — an eight-second film with no face in it, and the question of what you could still say about the person.",
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
      "A camera films a man walking away and never shows his face. What remains observable? The opening of GaitAI's three-film ForensicSearch series on comparing two walking recordings for human review.",
  },
  intro: [
    {
      type: "lead",
      text: "Most of what people expect a security camera to deliver is a face. The opening film of this series offers none. A man in a dark jacket walks away down a bright corridor, the camera stays behind him, and after eight and a half seconds a question appears beside him and the film ends.",
    },
    {
      type: "video",
      src: "/assets/videos/insights/forensicsearch/opening.mp4",
      poster: "/assets/images/insights/video/forensicsearch-opening-poster.jpg",
      captions: "/assets/videos/insights/forensicsearch/opening.en.vtt",
      title: "What can a walk reveal? — the opening film",
      duration: "0:08",
      caption:
        "The opening of the ForensicSearch series. A corridor, a man walking away, and no face at any point. Film 1 of 3.",
      width: 1920,
      height: 1080,
    },
    {
      type: "p",
      text: "This story is the introduction to the series that film opens. It is short on purpose. It says what the camera has kept when it has kept no facial detail, why that is more than it first appears, and what the two longer films that follow will show. If you have a minute rather than ten, skip to the [60-second demonstration](/insights/how-gaitai-compares-two-walking-videos/) and come back.",
    },
    {
      type: "note",
      text: "The three films are demonstrations of movement comparison for human review. They identify no one, and the measurements they show come from one demonstration analysis of two short street recordings. For what the live product does, see the [ForensicSearch product page](/securevision/forensicsearch/).",
    },
  ],
  sections: [
    {
      id: "what-the-camera-kept",
      number: "01",
      navLabel: "What remains",
      title: "What the camera kept",
      blocks: [
        {
          type: "p",
          text: "Look at the still above once more. There is no face, and there will not be one. The clothing is dark and unremarkable. The corridor could be any office building in any city. If the question were \"who is this?\", the honest answer from this footage alone is that nothing here says.",
        },
        {
          type: "p",
          text: "And yet the recording is not empty. Over eight seconds the man takes roughly a dozen steps, and every one of them is visible from the hips down. His right foot lands, his left foot lands, his right foot lands again. His arms swing in time with the opposite leg. His head stays level while his weight transfers from one side to the other. None of this is a face, and all of it is information.",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "**Rhythm.** The steps arrive at a pace, and that pace can be counted.",
            "**Repetition.** After two steps the same foot is back where it started. The walk is made of cycles.",
            "**Shape in motion.** The outline of the body changes in a pattern as the legs scissor and the arms swing, and the pattern recurs with every cycle.",
          ],
        },
        {
          type: "matters",
          text: "A walk recorded from behind, at a distance, in ordinary light, still carries a measurable pattern of movement. That is the premise the whole series rests on, and the opening film states it as a question rather than a claim.",
        },
      ],
    },
    {
      id: "a-sequence-not-a-frame",
      number: "02",
      navLabel: "The sequence",
      title: "Movement is a sequence, not a frame",
      blocks: [
        {
          type: "p",
          text: "Pause the film on any single frame and the information above disappears. One frame shows a posture: a man mid-stride, one foot forward. It does not show how fast he walks, whether his steps are even, or how his outline changes over a cycle. Those exist only across frames. The first of the GaitAI Foundations, [From Walking Video to Movement Intelligence](/insights/from-walking-video-to-movement-intelligence/), makes this point at length; the opening film makes it in eight seconds by refusing to cut away.",
        },
        {
          type: "p",
          text: "Two different readings of the sequence appear in the films that follow. One follows the joints — hips, knees, ankles — through each frame and reads the walk as moving geometry. The other separates the walker's outline from the scene, frame by frame, and reads the walk as a changing shape. They are complementary: the joints give timing, the outline gives form. Both begin with the same thing the corridor shot already shows, a body repeating a movement over time.",
        },
        {
          type: "gaitcycle",
          caption:
            "One gait cycle: a foot lands, the other foot lands, and the first foot lands again. The repeat is what makes a walk measurable, and the films count repeats before they measure anything.",
        },
      ],
    },
    {
      id: "the-series",
      number: "03",
      navLabel: "The series",
      title: "What the series will show",
      blocks: [
        {
          type: "p",
          text: "The opening is one of three films, and they are meant to be watched in order. Each one takes the question a step further, and each is embedded in its own story on this site with the film's own captions.",
        },
        {
          type: "states",
          caption: "The three films, in viewing order.",
          items: [
            {
              label: "01",
              name: "What can a walk reveal?",
              note: "This film. Eight and a half seconds, a corridor, a question. The series' premise, stated without a claim.",
              ok: true,
            },
            {
              label: "02",
              name: "How GaitAI compares two walking videos",
              note: "Sixty seconds. Two street recordings, one question — could this be the same person? — and a walk from the clips to the measurements a reviewer can examine, including one the software declines to give.",
              ok: true,
            },
            {
              label: "03",
              name: "Inside a gait comparison",
              note: "A technical walkthrough of the same comparison: gait-cycle alignment, the gait energy image, cadence, and why unstable left–right tracking withholds a measurement.",
              ok: true,
            },
          ],
        },
        {
          type: "p",
          text: "The 60-second film is the centre of the series and the best place to start if you are new to GaitAI. It is written up in plain English in [How GaitAI Compares Two Walking Videos](/insights/how-gaitai-compares-two-walking-videos/). The technical walkthrough, [Inside a Gait Comparison](/insights/inside-a-gait-comparison-what-the-footage-can-support/), is for readers who want to know how each step is done and where it stops.",
        },
      ],
    },
    {
      id: "what-this-is-not",
      number: "04",
      navLabel: "Not identity",
      title: "What this is not",
      blocks: [
        {
          type: "p",
          text: "It would be easy to read \"what can a walk reveal?\" as a promise that a walk reveals a person. The films are careful not to say so, and this series is careful to repeat the point. A walk can leave a trace. The trace is movement — a rhythm, a cycle, a changing outline — and movement can be measured and compared. Whether two traces belong to one person is a different question, and it is a question for a human reviewer with the measurements in front of them, not for the software.",
        },
        {
          type: "compare",
          caption: "Two questions that look alike and are not.",
          columns: [
            {
              label: "The films ask",
              title: "What can be observed, and how does it compare?",
              tone: "cyan",
              points: [
                "How many complete walking cycles each recording contains",
                "How fast each walk is, in steps per minute",
                "What the averaged outline of each walk looks like",
                "Which measurements the footage cannot support",
              ],
            },
            {
              label: "The films do not answer",
              title: "Who is this?",
              tone: "violet",
              points: [
                "No face is used, and none is shown in the opening",
                "No identity conclusion appears in any of the three films",
                "A similar pace is one observation, not a match",
              ],
            },
          ],
        },
        {
          type: "p",
          text: "For what the live product does — indexing recorded footage by movement so authorized investigators can narrow hours of multi-camera video to ranked candidate segments, with every query audited and human confirmation required before anything enters a review pack — the [ForensicSearch product page](/securevision/forensicsearch/) is the reference. The films illustrate the comparison at the heart of that workflow; the product page describes the workflow.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "So: what can a walk reveal? The opening film declines to answer, and that is the right instinct. What it shows is that a camera which has kept no face has still kept a pattern — and that the pattern is worth looking at carefully, with the right tools, before anyone says what it means.",
    },
    {
      type: "p",
      text: "The next film does the looking. Two street recordings, sixty seconds, and a conclusion that has to follow the evidence.",
    },
  ],
  cta: {
    label: "Watch the 60-second demonstration",
    href: "/insights/how-gaitai-compares-two-walking-videos/",
  },
  related: [
    "how-gaitai-compares-two-walking-videos",
    "inside-a-gait-comparison-what-the-footage-can-support",
  ],
};
