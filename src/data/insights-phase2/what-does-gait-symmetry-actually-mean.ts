import type { InsightArticle } from "../insights";

/**
 * INSIDE THE SIGNAL · 01 — What Does Gait Symmetry Actually Mean?
 *
 * Thesis: symmetry is not one number but a family of comparisons between the
 * left and right sides of a gait cycle — in timing, in duration, in space —
 * and what an asymmetry means depends on which comparison moved, against
 * whose baseline, under which capture. Educational; no threshold, no
 * diagnosis, no index value stated anywhere.
 */
export const whatDoesGaitSymmetryActuallyMean: InsightArticle = {
  slug: "what-does-gait-symmetry-actually-mean",
  title: "What Does Gait Symmetry Actually Mean?",
  titleAccent: "Symmetry",
  subtitle: "Left against right, in time and in space — and why one number is never the whole answer",
  deck:
    "Symmetry is one of the most quoted movement measures and one of the least examined. It compares the left side of a walk with the right — but a walk has several things that can be compared, they can disagree, and nobody is perfectly symmetric to begin with. This is what the measure is, what moves it, and what it can and cannot say.",
  postType: "essay",
  category: "Inside the Signal",
  topics: ["movement-intelligence", "mobility", "research"],
  date: "2026-09-16",
  excerpt:
    "Symmetry compares the left side of a walk with the right — but stance, swing and step timing can each be asymmetric on their own, nobody is perfectly symmetric, and what a change means depends on the baseline it is read against.",
  question: "When a system says a walk is asymmetric, what exactly has it compared?",
  ctaLabel: "Compare left with right",
  hooks: [
    "The three things a symmetry measure can compare, and why they can disagree",
    "Why a perfectly symmetric walk is not the reference",
    "What moves the measure without the person changing at all",
  ],
  openingHook:
    "Before you scroll: two gait cycles, left and right, drawn as time. Drag one side away from the other and watch what the word asymmetric starts to mean.",
  twoMinute: [
    "A gait cycle is one stride: stance, when the foot is on the ground, and swing, when it is not. Symmetry compares the left cycle with the right.",
    "There is not one symmetry. Stance duration, swing duration, step timing and step length can each be compared, and they can move independently.",
    "Nobody is perfectly symmetric. Healthy walking carries a small, stable asymmetry, so the reference is a person's own pattern, not a mirror.",
    "Surface, footwear, a carried bag, walking speed, fatigue, camera viewpoint and pose error all move a symmetry measure without the person changing.",
    "The useful reading is a change against the same person's baseline, with capture quality attached — not a single value against a population cut-off.",
    "Symmetry is decision support: a reason to look closer, never a finding on its own.",
  ],
  series: "Inside the Signal",
  seriesStep: 1,
  seriesOrder: 1,
  seriesTitle: "What symmetry compares",
  evidenceLevel: "illustrative",
  relatedSignals: ["sig-step-symmetry", "sig-cadence", "cap-gait"],
  memorableInteraction:
    "Drag the right gait cycle out of step with the left and feel three different asymmetries — stance, swing, timing — appear one at a time.",
  hero: {
    src: "/assets/images/insights/social/what-does-gait-symmetry-actually-mean.png",
    alt: "GaitAI Insights social card: two gait cycles, left and right, drawn as bars of stance and swing, drifting out of alignment",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "symmetry",
    alt: "Two gait cycles, left and right, drawn as bars of stance and swing, with the right side drifting out of alignment.",
  },
  tags: ["Gait Symmetry", "Gait Cycle", "Movement Intelligence", "Inside the Signal"],
  seo: {
    title: "What Does Gait Symmetry Actually Mean? Left, Right, and Why One Number Is Never Enough",
    description:
      "Gait symmetry compares the left and right sides of a walk in timing, duration and space. What the measure is, why nobody is perfectly symmetric, what moves it, and what it can and cannot say.",
  },
  intro: [
    {
      type: "lead",
      text: "Ask what a movement system measures and symmetry is one of the first answers. It sounds simple: does the left side move like the right? It is also one of the least examined measures in the field, because the simple question hides three harder ones — symmetric in what, compared with whom, and measured how well.",
    },
    {
      type: "p",
      text: "This story takes the measure apart. Not to argue against it — symmetry is genuinely informative — but so that when a system reports an asymmetry, a reader knows what has actually been compared and what has not.",
    },
    {
      type: "note",
      text: "The figures are illustrative: the gait cycles are drawn to make each kind of asymmetry visible and carry no measured values. Nothing here is a clinical threshold, and nothing here diagnoses anything.",
    },
  ],
  sections: [
    {
      id: "two-legs-one-cycle",
      number: "01",
      navLabel: "The cycle",
      title: "Two legs, one cycle",
      blocks: [
        {
          type: "p",
          text: "A gait cycle is one stride of one leg: from the moment its heel strikes the ground to the moment the same heel strikes again. Inside that cycle the leg is either on the ground — **stance** — or moving through the air — **swing**. In ordinary walking stance takes the larger share, and for a short period both feet are down at once.",
        },
        { type: "gaitcycle", caption: "One stride, drawn from GaitAI's own gait keyframes: heel strike, loading, mid-stance, toe-off, swing." },
        {
          type: "p",
          text: "The other leg runs the same cycle, offset by roughly half a cycle. Symmetry is a comparison between the two: how alike are the left cycle and the right? That framing already contains the first surprise. The two cycles are drawn on the same clock, so they can differ in **how long** each phase lasts, in **when** each begins, and in **how far** the body travels during it — and those are three different comparisons.",
        },
      ],
    },
    {
      id: "what-symmetry-measures",
      number: "02",
      navLabel: "Three comparisons",
      title: "What a symmetry measure actually compares",
      blocks: [
        {
          type: "p",
          text: "The hero figure above lets you move each comparison on its own. Choose **stance duration** and one foot stays on the ground longer than the other. Choose **swing duration** and one leg spends longer in the air. Choose **step timing** and the right heel strikes early or late, so steps are no longer evenly spaced even if every phase has the same length.",
        },
        {
          type: "compare",
          caption: "Three families of symmetry, each answering a different question.",
          columns: [
            {
              label: "Temporal",
              title: "How long, and when",
              tone: "cyan",
              points: [
                "Stance time, swing time, double-support time — left against right",
                "Step time: the interval between one heel strike and the next",
                "Readable from a side view and from a wearable's timing signal",
              ],
            },
            {
              label: "Spatial",
              title: "How far",
              tone: "violet",
              points: [
                "Step length and stride length, left against right",
                "Foot placement relative to the body's path",
                "Sensitive to camera geometry, which the next story in Engineering GaitAI takes up",
              ],
            },
          ],
        },
        {
          type: "p",
          text: "Because these are different comparisons, they can disagree. A person who protects one leg may spend less time on it — a temporal asymmetry — while keeping step lengths even. Another may take a shorter step with one leg at a normal rhythm. A single reported \"symmetry\" hides which of these happened, and the interpretation is different for each.",
        },
        {
          type: "callout",
          tone: "violet",
          title: "Ratio, difference, index",
          text: "Even within one comparison there are several ways to turn two durations into one number — a ratio, a difference, a normalised index. They behave differently at the extremes and they are not interchangeable. A system should say which it uses; a reader should ask.",
        },
      ],
    },
    {
      id: "why-nobody-is-perfectly-symmetric",
      number: "03",
      navLabel: "The reference",
      title: "Why nobody is perfectly symmetric",
      blocks: [
        {
          type: "p",
          text: "If the reference were a mirror, everyone would fail it. Healthy walking carries a small asymmetry — most people have a preferred leg for propulsion and another for support, the way they have a preferred hand — and that asymmetry is remarkably stable from day to day for the same person.",
        },
        {
          type: "quote",
          text: "The informative reference is not symmetry. It is this person's own asymmetry, and whether it has moved.",
        },
        {
          type: "p",
          text: "This is the same argument the fourth Foundation makes for fall risk, arriving from a different direction. A symmetry value compared against a population cut-off tells you where a person sits among strangers. The same value compared against that person's own earlier walks tells you whether something changed — which is usually the question that was being asked.",
        },
        {
          type: "matters",
          text: "A measure whose healthy value is \"a little asymmetric, and stable\" cannot be read as a pass/fail test. It has to be read as a trajectory, which means repeated measurement under comparable conditions — and conditions, it turns out, move the measure a great deal.",
        },
      ],
    },
    {
      id: "what-can-make-it-move",
      number: "04",
      navLabel: "What moves it",
      title: "What can make it move",
      blocks: [
        {
          type: "p",
          text: "A change in symmetry is a change in the comparison between two cycles. The person is one thing that can move it. Here are the others, and every one of them has produced a convincing asymmetry in a recording of someone who was walking exactly as they always do.",
        },
        {
          type: "states",
          caption: "Things that change a symmetry reading without changing the person. Illustrative list; the size of each effect depends on the setup.",
          items: [
            { label: "01", name: "Surface", note: "A slope, a kerb, a turn in the corridor. One leg does more work for a few strides." },
            { label: "02", name: "Footwear", note: "A stiff shoe, a heel, a slipper. Stance and push-off change on one side more than the other." },
            { label: "03", name: "Carried load", note: "A bag on one shoulder shifts the body's mass; the free side compensates." },
            { label: "04", name: "Speed and fatigue", note: "Faster walks are more symmetric for some people and less for others; tired walks drift." },
            { label: "05", name: "Camera viewpoint", note: "A camera off the walking axis foreshortens one side's step length. A spatial asymmetry that is in the geometry, not the gait." },
            { label: "06", name: "Pose error", note: "A misplaced ankle or a left/right swap inverts or invents an asymmetry for a span of frames — the previous story in AI Under Stress." },
          ],
        },
        {
          type: "p",
          text: "None of these is exotic. They are what a corridor, a care home or a sports hall looks like on a normal day. A system that reports symmetry without recording the conditions it was measured under is reporting a number it cannot interpret.",
        },
      ],
    },
    {
      id: "reading-a-change",
      number: "05",
      navLabel: "Reading a change",
      title: "Reading a change, not a number",
      blocks: [
        {
          type: "p",
          text: "Put the pieces together and a defensible reading of symmetry has four parts. Which comparison moved — stance, swing, timing, length — because they mean different things. How far it moved from this person's own baseline, because the population is the wrong reference. Whether the capture supports the comparison at all, because a foreshortened view or a filled-in joint can manufacture the whole effect. And whether it persists across walks, because a single asymmetric recording is one observation.",
        },
        {
          type: "flow",
          layout: "row",
          steps: ["Which comparison", "Against whose baseline", "Under what capture", "Across how many walks"],
          caption: "The four questions a symmetry reading has to answer before it means anything.",
        },
        {
          type: "p",
          text: "This is why, in a movement-intelligence system, symmetry does not arrive alone. It arrives with the cadence and stride variability of the same walk, the capture-quality judgement made before any number was computed, and the history it is being compared against. The signal is only as informative as the context that travels with it.",
        },
      ],
    },
    {
      id: "what-symmetry-can-and-cannot-say",
      number: "06",
      navLabel: "What it can say",
      title: "What symmetry can and cannot say",
      blocks: [
        {
          type: "list",
          tone: "cyan",
          items: [
            "**It can say** that one side of a walk is behaving differently from the other, in a named way, compared with the same person's earlier walks.",
            "**It can say** that the difference appeared after a change in conditions — or did not, which is the more interesting case.",
            "**It cannot say** why. A protective pattern, a stiff shoe, a slope and a pose error can all produce the same number.",
            "**It cannot say** that anything is wrong. It says that something is worth a closer look by someone qualified to take one.",
          ],
        },
        {
          type: "p",
          text: "That last line is not a disclaimer bolted on at the end; it is the design. A symmetry measure that knows what it compared, what it was compared against and how well it was captured is a good instrument. Read as a verdict, the same measure is a source of confident mistakes. The word **decision support** is the difference between the two.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "Symmetry is the most quoted movement measure because the idea is so clear: left should look like right. The measure earns its place when the idea is made precise — which comparison, whose baseline, what capture, how many walks — and loses it the moment a single number is asked to stand for all four.",
    },
    {
      type: "p",
      text: "Inside the Signal continues with the reference that makes a change readable at all: what a personal movement baseline is, and how it differs from a population threshold.",
    },
  ],
  cta: { label: "Explore symmetry in the Movement Intelligence Lab", href: "/movement-lab" },
  related: ["fall-risk-is-a-trend-not-a-number", "when-pose-estimation-lies"],
};
