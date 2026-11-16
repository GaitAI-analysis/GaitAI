import type { InsightArticle } from "../insights";
import { CONTACT_FORM_HREF } from "../contact";

/**
 * FORENSICSEARCH DEMONSTRATIONS · 03 — Inside a Gait Comparison
 *
 * The technical walkthrough. The same two street recordings as the 60-second
 * film, taken slowly: how a walk is cut into cycles and the cycles aligned by
 * phase rather than by camera time; how the aligned silhouettes average into
 * a gait energy image and what that image does and does not describe; what
 * cadence is one observation of; and exactly why unstable left–right leg
 * labels make the software withhold step-time asymmetry and the side-specific
 * joint curves for Recording B.
 *
 * Film: GaitAI_ForensicSearch_Technical_107p53s_Polished_20261115.mp4
 * (107.5 s, 1:48), re-encoded for the web as
 * /assets/videos/insights/forensicsearch/technical.mp4 with the cut's own
 * English captions. Every example and value here is one the film shows, from a
 * single demonstration analysis of two short clips. None is a performance
 * claim; the live product is described only through its product page.
 */
export const insideAGaitComparison: InsightArticle = {
  slug: "inside-a-gait-comparison-what-the-footage-can-support",
  title: "Inside a Gait Comparison: What the Footage Can Support",
  titleAccent: "What the Footage Can Support",
  subtitle: "The technical walkthrough of the two-recording demonstration",
  deck:
    "The 60-second film showed what a comparison of two walking recordings produces. This one shows how. In just under two minutes the technical walkthrough takes the same two street clips through gait-cycle detection, phase alignment, silhouette averaging and cadence — and then stops, on purpose, at the measurement the footage cannot carry. This story explains each step, in the film's own order and with the film's own values.",
  postType: "essay",
  category: "ForensicSearch",
  topics: ["movement-intelligence", "responsible-ai"],
  date: "2026-11-16",
  excerpt:
    "How two walks are aligned by phase rather than by time, how a gait energy image summarises silhouettes across a cycle, what cadence is one observation of, and why inconsistent left–right leg labels make the software withhold a measurement. The technical walkthrough, explained.",
  question: "Once two walks are found in two clips, how exactly are they lined up, summarised and compared — and where does the footage stop supporting a number?",
  ctaLabel: "Watch the walkthrough",
  hooks: [
    "Why aligned moments in two walks are phases of movement, not simultaneous camera times",
    "How a gait energy image is formed, and what its bright and blurred regions mean",
    "The precise reason step-time asymmetry and side-specific joint curves are withheld for Recording B",
  ],
  openingHook:
    "Before you scroll: the film below runs a little under two minutes and shows every step of the comparison on screen. The sections follow it in order, so you can read with it paused at each stage.",
  twoMinute: [
    "A walk is measurable because it repeats. The software finds the repeating unit — one foot landing, the other landing, the first returning — and counts complete cycles: two in Recording A, five in Recording B.",
    "Gait phase alignment lines the two walks up by where they are in the cycle, so that corresponding moments sit side by side. These are phases of movement, not the same instants of camera time.",
    "The gait energy image averages the aligned silhouettes of one recording. Bright where the body is most often, blurred where the legs sweep. It describes movement across frames, not identity.",
    "Cadence is steps per minute: 99.2 in Recording A, 96.4 in Recording B. A similar pace is only one observation, and many walks share it.",
    "In Recording B the pose model's left and right leg labels are inconsistent. Step-time asymmetry depends on knowing which foot is which, so it is withheld, and so are the side-specific joint curves.",
    "What remains is evidence to examine. The demonstration records no identity conclusion; the conclusion must follow the evidence, and the reviewer draws it.",
  ],
  series: "ForensicSearch Demonstrations",
  seriesStep: 3,
  seriesOrder: 3,
  seriesTitle: "The technical walkthrough",
  evidenceLevel: "illustrative",
  relatedSignals: ["cap-gait", "cap-pose", "cap-temporal", "sig-cadence", "sig-step-symmetry"],
  memorableInteraction:
    "Editorial: the thing to remember is the alignment slider in the film — two silhouettes moving through the same phase of the cycle together, even though the clips were never recorded at the same time.",
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
      "The ForensicSearch technical walkthrough explained: gait-cycle alignment by phase, how a gait energy image summarises silhouettes, what cadence shows, and why unstable left–right leg tracking makes the software withhold a measurement.",
  },
  intro: [
    {
      type: "lead",
      text: "The [60-second demonstration](/insights/how-gaitai-compares-two-walking-videos/) showed the outputs of a gait comparison. This film shows the work. Same two street recordings, same question, but taken at the pace of someone who wants to see each step done and to know, at each step, what the footage is and is not able to support.",
    },
    {
      type: "video",
      src: "/assets/videos/insights/forensicsearch/technical.mp4",
      poster: "/assets/images/insights/video/forensicsearch-technical-poster.jpg",
      captions: "/assets/videos/insights/forensicsearch/technical.en.vtt",
      title: "Inside a gait comparison — the technical walkthrough",
      duration: "1:48",
      caption:
        "Gait cycles, phase alignment, the gait energy image, cadence, and a withheld measurement. Film 3 of 3 in the ForensicSearch series.",
      width: 1920,
      height: 1080,
    },
    {
      type: "p",
      text: "Five things happen in the film, and they are the five sections below: the walks are cut into cycles; the cycles are aligned by phase; the aligned silhouettes are averaged into a gait energy image; cadence is measured and put in its place; and one measurement is withheld for a reason the film states exactly. A sixth section says what all this leaves for the person reviewing it.",
    },
    {
      type: "note",
      text: "Every value in this story is one the film shows on screen, from a single demonstration analysis of two short clips. None is a performance claim. For what the live product does, see the [ForensicSearch product page](/securevision/forensicsearch/).",
    },
  ],
  sections: [
    {
      id: "two-recordings-two-viewpoints",
      number: "01",
      navLabel: "Two views",
      title: "Two recordings, two viewpoints",
      blocks: [
        {
          type: "p",
          text: "Recording A is a street corner; the walker crosses the frame from left to right. Recording B is a terrace street; the walker crosses from right to left. Both are side views, which is the view in which leg movement is clearest and in which, as the last section will show, left and right are hardest to keep apart. When the film later places the two walks side by side it shows them facing the same way, so that a reviewer compares movement rather than direction of travel.",
        },
        {
          type: "p",
          text: "The film repeats the 60-second cut's close replay — watch the white shoe; it lands; the same foot returns — because everything downstream depends on it. A gait cycle runs from one foot's first contact to that same foot's next first contact. Within it the other foot has landed once. The caption puts it in six words: one foot, one complete cycle.",
        },
      ],
    },
    {
      id: "gait-cycle-alignment",
      number: "02",
      navLabel: "Alignment",
      title: "Gait-cycle alignment: phases, not timestamps",
      blocks: [
        {
          type: "p",
          text: "Gait cycle analysis, the film says, finds repeating movement. Once the cycles are found they are counted — **two complete cycles in Recording A, five in Recording B** — and the film draws the count as a row of short bars under each silhouette so the difference in coverage is visible at a glance. Then comes the step that makes comparison possible at all.",
        },
        {
          type: "p",
          text: "The two clips were recorded at different times, by different cameras, at different walking speeds. Frame 40 of one has no relationship to frame 40 of the other. So the software does not align them by time. It aligns them by **phase**: how far through its own cycle each walk is at a given moment. First contact lines up with first contact; the mid-swing of one walk lines up with the mid-swing of the other. The film shows this as a slider that runs from the start of the cycle to its end, with the two silhouettes — A in white, B in teal — moving through the same phase together.",
        },
        {
          type: "quote",
          text: "These are phases of movement, not simultaneous camera times.",
        },
        {
          type: "p",
          text: "That caption is the most important sentence in the film for anyone who will read a comparison report. Two silhouettes shown side by side are not two frames that happened at once. They are two walks resampled onto a common cycle, so that like is compared with like. The alignment is what lets the next step — averaging — mean anything.",
        },
      ],
    },
    {
      id: "the-gait-energy-image",
      number: "03",
      navLabel: "Energy image",
      title: "The gait energy image: a walk, accumulated",
      blocks: [
        {
          type: "p",
          text: "Silhouette extraction separates the walker from the scene, frame by frame, and the film shows the result as a white figure against darkness whose outline changes as the body moves. On its own a stack of such outlines is hard to compare. The **gait energy image** solves this by averaging them. Every aligned silhouette from a recording is laid over the others and the pixel values are averaged, so that each point in the image records how often, across the cycle, the body occupied it.",
        },
        {
          type: "p",
          text: "The film shows the construction directly: a row of aligned silhouettes on the left, and on the right the soft image they add up to, captioned average occupancy. Reading it is intuitive once you know the rule. **Brighter areas are occupied more often.** The head and torso move little across a cycle, so they are bright and sharp. The arms and especially the legs sweep through the cycle, so they fade into a blur that records the envelope of their movement. Two walks with different rhythms or different limb excursions leave differently shaped blurs.",
        },
        {
          type: "callout",
          tone: "cyan",
          title: "What the image describes",
          text: "The film states it plainly: the gait energy image describes movement across frames, not identity. It is a compact summary of how a body moved through one walking cycle in one recording. Placed beside another, it gives a reviewer two movement summaries to compare. It does not, by itself, say whether they came from the same person — and the film does not pretend otherwise.",
        },
      ],
    },
    {
      id: "cadence",
      number: "04",
      navLabel: "Cadence",
      title: "Cadence: one observation",
      blocks: [
        {
          type: "p",
          text: "Cadence measures steps per minute. The film reads it from the rhythm of footfalls and shows the two values large: **99.2 steps per minute in Recording A, 96.4 in Recording B**, each above a small tick-strip of the steps it was counted from. The two walks are close in pace, and the film immediately qualifies what that means.",
        },
        {
          type: "p",
          text: "A similar pace is only one observation. Walking cadence varies with mood, footwear, surface, hurry and company, and a great many people walk at a little under a hundred steps a minute. Two close cadences are consistent with the same person; they are also consistent with two different people who happened to be walking at an ordinary pace. A reviewer records the observation and gives it the weight one observation deserves, no more.",
        },
        {
          type: "matters",
          text: "A single agreeing measurement feels like confirmation. The film puts the caveat on screen in the same breath as the numbers so that the feeling never gets ahead of the evidence.",
        },
      ],
    },
    {
      id: "why-a-measurement-is-withheld",
      number: "05",
      navLabel: "Withheld",
      title: "Why unstable left–right tracking withholds a measurement",
      blocks: [
        {
          type: "p",
          text: "The film then shows a card for Recording B: step-time asymmetry, **withheld**, with the reason beneath — left and right labels are inconsistent — and, a moment later, a second line: the software also withholds the side-specific joint curves. This is the part of the walkthrough most worth understanding, because it is where the footage runs out and the software says so.",
        },
        {
          type: "p",
          text: "Step-time asymmetry compares the time between footfalls on the left with the time between footfalls on the right. It is a left-versus-right measurement, so it is only as good as the software's knowledge of which foot is which at every step. That knowledge comes from the pose model's leg labels. In a side view the two legs pass in front of and behind each other every stride, and a pose model can hand the left label to the right leg and back again as they cross. The film describes exactly this for Recording B: the left and right labels do not alternate reliably from one step event to the next.",
        },
        {
          type: "list",
          tone: "violet",
          items: [
            "**What is withheld.** Step-time asymmetry for Recording B, and the per-side joint-angle curves across the cycle that would have been drawn for its left and right legs.",
            "**Why.** Each of these needs a trustworthy left/right assignment at every step. Inconsistent labels would make the asymmetry an artefact of labelling rather than a property of the walk.",
            "**What is kept.** Measurements that do not depend on side — cycle count, cadence, the gait energy image — remain, because the labelling problem does not touch them.",
          ],
        },
        {
          type: "p",
          text: "The alternative would have been to compute the asymmetry anyway and print a number. The number would have looked exactly like a real one. Withholding costs the reviewer a value and gives them something better: a precise statement of where this footage stops being able to support a claim.",
        },
      ],
    },
    {
      id: "what-remains-for-the-reviewer",
      number: "06",
      navLabel: "For review",
      title: "What this leaves for the reviewer",
      blocks: [
        {
          type: "p",
          text: "The film closes the way the 60-second cut does, on the corridor and the line the whole series turns on: the measurements remain evidence to examine; a walk can leave a trace; the conclusion must follow the evidence. The demonstration records no identity conclusion. It hands a reviewer two cycle counts, two cadences with a caveat, two gait energy images aligned by phase, and an explicit account of which left-right measurements are unavailable and why.",
        },
        {
          type: "compare",
          caption: "What the footage in the demonstration supports, and what it does not.",
          columns: [
            {
              label: "Supported",
              title: "Observations a reviewer can examine",
              tone: "cyan",
              points: [
                "Two complete cycles in A, five in B",
                "Phase-aligned silhouettes, side by side",
                "A gait energy image for each recording",
                "Cadence of 99.2 and 96.4 steps per minute",
              ],
            },
            {
              label: "Not supported",
              title: "Where the footage stops",
              tone: "violet",
              points: [
                "Step-time asymmetry for Recording B",
                "Side-specific joint curves for Recording B",
                "Any statement that A and B are the same person",
              ],
            },
          ],
        },
        {
          type: "p",
          text: "In the live product this review happens inside a case. Footage is indexed by movement so authorized investigators can narrow hours of multi-camera video; candidate segments are ranked for review; every query is logged; and nothing enters a review pack without human confirmation. The [ForensicSearch product page](/securevision/forensicsearch/) describes that workflow and its limits. The walkthrough shows the comparison that sits inside it, one step at a time.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "Alignment by phase rather than by time, a summary image that records occupancy rather than appearance, a cadence read as one observation, and a measurement withheld because the footage could not carry it. That is a gait comparison from the inside, and the thing to notice is how much of it is about restraint: lining up only what corresponds, summarising only what repeats, and reporting only what the recording supports.",
    },
    {
      type: "p",
      text: "If you came here from the technical end, the plain-English version is [How GaitAI Compares Two Walking Videos](/insights/how-gaitai-compares-two-walking-videos/), and the series opens with [What Can a Walk Reveal?](/insights/what-can-a-walk-reveal/). To see the comparison run on footage of your own, request a demonstration below.",
    },
  ],
  cta: { label: "Request a Demo", href: CONTACT_FORM_HREF },
  related: [
    "how-gaitai-compares-two-walking-videos",
    "what-can-a-walk-reveal",
  ],
};
