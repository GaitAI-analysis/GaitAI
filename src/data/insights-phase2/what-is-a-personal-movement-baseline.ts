import type { InsightArticle } from "../insights";

/**
 * INSIDE THE SIGNAL · 02 — What Is a Personal Movement Baseline?
 *
 * Thesis: a population reference answers where a person sits among
 * strangers; a personal baseline answers whether they have changed. The
 * second is built from repeated observations under comparable conditions,
 * it has a spread of its own, it can move, and it carries the capture that
 * made it. No threshold and no diagnosis appear anywhere.
 */
export const whatIsAPersonalMovementBaseline: InsightArticle = {
  slug: "what-is-a-personal-movement-baseline",
  title: "What Is a Personal Movement Baseline?",
  titleAccent: "Personal Movement Baseline",
  subtitle: "The reference that makes a change readable",
  deck:
    "Every movement measure needs something to be compared against. A population reference says where a person sits among strangers. A personal baseline — the same person, measured again and again under comparable conditions — says whether they have changed. The two can disagree about the same reading, and when they do, only one of them knows the person.",
  postType: "essay",
  category: "Inside the Signal",
  topics: ["mobility", "movement-intelligence", "research"],
  date: "2026-10-14",
  excerpt:
    "A population reference says where a person sits among strangers; a personal baseline says whether they have changed. What a baseline is made of, how many observations it needs, when it moves, and what it can and cannot say.",
  question: "Why can a reading be normal for everyone and a change for this person?",
  ctaLabel: "Build a baseline",
  hooks: [
    "The difference between a threshold and a baseline, on one axis",
    "What a baseline is actually made of — and why it has a width",
    "When the baseline itself should be allowed to move",
  ],
  openingHook:
    "Before you scroll: one movement index, one latest reading, two references — a population and a person. Bring the observations in and watch the two references disagree.",
  twoMinute: [
    "A population reference is a distribution of strangers. It says whether a reading is unusual in general, and nothing about whether it is unusual for this person.",
    "A personal baseline is the same person measured repeatedly under comparable conditions. It has a centre and a spread, because nobody walks identically twice.",
    "A baseline needs enough observations to know its own spread. Three shows a tendency; more shows what ordinary variation looks like, which is what a change has to exceed.",
    "Baselines move. Recovery, seasons, footwear and a new camera position all shift them; the system has to know whether the person or the setup changed.",
    "Capture quality travels with the baseline. Observations made from different geometry are different instruments, and cannot be pooled without saying so.",
    "A reading outside a personal baseline is context, not a finding. It is the reason for a closer look by someone qualified to take one.",
  ],
  series: "Inside the Signal",
  seriesStep: 2,
  seriesOrder: 2,
  seriesTitle: "The reference that knows the person",
  evidenceLevel: "illustrative",
  relatedSignals: ["sig-mobility-decline", "cap-temporal", "sig-rehab-progress"],
  memorableInteraction:
    "Bring one person's observations in one at a time until their own band forms — then watch the latest reading sit comfortably in the population range and outside it.",
  hero: {
    src: "/assets/images/insights/social/what-is-a-personal-movement-baseline.png",
    alt: "GaitAI Insights social card: a population distribution beside one person's repeated observations forming their own narrow band, with the same reading marked against each",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "baseline",
    alt: "A population distribution beside one person's repeated observations forming their own narrow band, with the same latest reading marked against each.",
  },
  tags: ["Personal Baseline", "Longitudinal Monitoring", "Mobility", "Inside the Signal"],
  seo: {
    title: "What Is a Personal Movement Baseline? Population Reference vs the Person's Own Pattern",
    description:
      "A population reference says where a person sits among strangers; a personal baseline says whether they have changed. What a movement baseline is made of, how many observations it needs, when it moves, and what it can and cannot say.",
  },
  intro: [
    {
      type: "lead",
      text: "Take any movement measure — cadence, symmetry, stride variability, a composite index — and ask what a single value of it means. On its own, nothing. It means something only next to a reference, and there are two very different references to choose from.",
    },
    {
      type: "p",
      text: "The fourth Foundation made the case that fall risk is a trend, not a number, and the symmetry story before this one ended on the same note: the informative reference is the person's own pattern. This story is about that reference itself. What a personal baseline is made of, how much of it you need, when it is allowed to move, and what it entitles a system to say.",
    },
    {
      type: "note",
      text: "The hero figure is illustrative: a drawn distribution and drawn observations, chosen to make the argument visible. There is no clinical threshold in this article and no value is stated as a number; the readings are phrases.",
    },
  ],
  sections: [
    {
      id: "a-threshold-answers-a-different-question",
      number: "01",
      navLabel: "Two questions",
      title: "A threshold answers a different question",
      blocks: [
        {
          type: "p",
          text: "A population reference is what most people picture when they hear \"normal range\": a distribution of many people's values, with a band across the middle that most of them fall inside. Compare one reading against it and you learn where the person sits among strangers. That is a real question, and for some purposes the right one.",
        },
        {
          type: "p",
          text: "It is not the question most movement monitoring is asking. A care team, a physiotherapist, a coach or the person themselves usually wants to know whether something has **changed** — and a population band cannot say. Two people can sit at the same point in it for opposite reasons: one has always been there, one has drifted there from somewhere else. The reading is identical; the story is not.",
        },
        {
          type: "compare",
          caption: "The same reading, two references, two answers.",
          columns: [
            {
              label: "Population",
              title: "Where among strangers",
              tone: "violet",
              points: ["Wide, because people differ", "Says whether a value is unusual in general", "Silent about direction of travel", "Available from the first observation"],
            },
            {
              label: "Personal",
              title: "Whether this person changed",
              tone: "cyan",
              points: ["Narrow, because one person is consistent", "Says whether a value is unusual for this person", "Direction of travel is the reading", "Needs several observations first"],
            },
          ],
        },
      ],
    },
    {
      id: "what-a-baseline-is-made-of",
      number: "02",
      navLabel: "Made of",
      title: "What a baseline is made of",
      blocks: [
        {
          type: "p",
          text: "A personal baseline is not a value. It is a set of observations of the same measure, from the same person, made under conditions alike enough to compare — and it has two properties, both of which matter.",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "**A centre.** Where this person's readings tend to fall. Often nowhere near the population centre, and that is not a problem; it is the point.",
            "**A spread.** How much the readings vary from one ordinary day to the next. Nobody walks identically twice, and the spread is what a change has to exceed before it counts as one.",
          ],
        },
        {
          type: "p",
          text: "The hero figure draws both. Bring the observations in one at a time and the first few form a cluster; the band drawn around them is the spread. The latest reading is then judged against that band — not against a number, and not against a population.",
        },
        {
          type: "quote",
          text: "A baseline without a spread is a threshold with a personal name on it. The spread is what makes it a baseline.",
        },
      ],
    },
    {
      id: "how-many-observations",
      number: "03",
      navLabel: "How many",
      title: "How many observations is enough",
      blocks: [
        {
          type: "p",
          text: "There is no universal number, and any story that offers one should be read carefully. What a baseline needs is enough observations to know its own spread: to have seen what an ordinary good day and an ordinary bad day look like for this person, so that a reading outside that range means something.",
        },
        {
          type: "p",
          text: "Three observations show a tendency. More show the variation around it. The figure draws its band only once three are in and keeps widening it as ordinary variation appears — because a band drawn from two very consistent days would flag the third, perfectly ordinary, day as a change.",
        },
        {
          type: "matters",
          text: "Consistency of capture matters more than the count. Five observations from the same corridor, the same camera and the same time of day form a better baseline than fifteen from wherever the person happened to be filmed. The next section is about why.",
        },
      ],
    },
    {
      id: "when-the-baseline-moves",
      number: "04",
      navLabel: "When it moves",
      title: "When the baseline itself should move",
      blocks: [
        {
          type: "p",
          text: "A baseline describes a person at a period of their life, and people change. Someone recovering from an injury has a baseline that is supposed to move; freezing it at the first week would flag every improvement as an anomaly. Someone whose walk changes with the season, with new footwear or with a new routine has a baseline that has genuinely shifted, not a change worth a closer look.",
        },
        {
          type: "states",
          caption: "Reasons a baseline moves, and what each asks of the system. Illustrative.",
          items: [
            { label: "01", name: "Recovery", note: "The centre moves on purpose. The system should track the trajectory of the baseline, not alarm on it.", ok: true },
            { label: "02", name: "Season and routine", note: "Slow drift with weather, footwear, activity. Expected; re-baselining on a schedule absorbs it." },
            { label: "03", name: "A step change", note: "A sudden, sustained shift. The reason a baseline exists — and the one case where the old baseline should be kept for comparison." },
            { label: "04", name: "A change in setup", note: "A moved camera, a new device, a different room. The baseline did not move; the instrument did. See the next section." },
          ],
        },
        {
          type: "p",
          text: "Telling these apart is not something the measure can do alone. It takes the history — how fast the centre moved and whether it stayed — and it takes a record of the conditions each observation was made under.",
        },
      ],
    },
    {
      id: "baselines-and-capture-quality",
      number: "05",
      navLabel: "Capture",
      title: "Baselines and capture quality",
      blocks: [
        {
          type: "p",
          text: "The Engineering GaitAI story on camera angle made the point that two recordings from different mounts are two instruments. For a baseline this is decisive. If the observations that built the band came from a side-on camera and today's reading came from an oblique one, the reading is outside the band because the geometry changed — not because the person did.",
        },
        {
          type: "list",
          tone: "violet",
          items: [
            "**Every observation carries its capture.** Angle, distance, lighting, occlusion, which sensor. A baseline is built only from observations whose capture is comparable, or corrected to be.",
            "**A degraded capture does not enter the baseline.** The fourth Foundation's figure showed an assessment with a degraded capture sitting in a sequence; it is shown, and it is not counted.",
            "**A change in setup resets the comparison, not the person.** When the instrument changes, the honest reading is \"not comparable yet\", and the baseline starts again alongside the old one.",
          ],
        },
        {
          type: "callout",
          tone: "cyan",
          title: "The baseline is a pair",
          text: "A set of values and the conditions they were measured under. Store one without the other and the first surprising reading cannot be interpreted.",
        },
      ],
    },
    {
      id: "what-a-baseline-can-say",
      number: "06",
      navLabel: "What it can say",
      title: "What a baseline can and cannot say",
      blocks: [
        {
          type: "p",
          text: "A reading outside a personal baseline says one thing: this person's movement, measured this way, under these conditions, is not where it usually is. That is a great deal more than a population threshold can say — and it is still not a finding.",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "**It can say** that something changed, in which measure, and roughly when.",
            "**It can say** whether the change persists across observations or was one unusual day.",
            "**It cannot say** why. Recovery, fatigue, footwear, a slope, a moved camera and a pose error all move a reading.",
            "**It cannot say** what to do. It is offered to a person who can look at the history, the capture and the person — as **decision support**.",
          ],
        },
        {
          type: "p",
          text: "That is the whole design. The population reference answers a question about everyone. The personal baseline answers a question about someone — and it can only do that if it is built carefully, allowed to move for the right reasons, and kept together with the conditions that made it.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "A personal movement baseline is the reference that turns a measurement into context. It is made of repeated observations, it has a spread, it moves for reasons that have to be told apart, and it carries its capture with it. Built that way, it can say something a population threshold never could: not whether this reading is normal, but whether it is normal for you.",
    },
    {
      type: "p",
      text: "Inside the Signal continues, one signal at a time — next, what stride variability measures and where it breaks.",
    },
  ],
  cta: { label: "See longitudinal monitoring in MobilityCare", href: "/mobilitycare" },
  related: ["fall-risk-is-a-trend-not-a-number", "what-does-gait-symmetry-actually-mean"],
};
