import type { InsightArticle } from "../insights";

/**
 * PRIVACY BY ARCHITECTURE · 01 — Can a Skeleton Still Reveal Identity?
 *
 * Thesis: there is no single point in the chain RGB → face removed →
 * silhouette → skeleton → joint trajectories at which identity disappears.
 * Each representation removes some identifying cues and keeps others, and
 * whether what remains identifies anyone depends on storage, combination
 * with other data, persistence, purpose and deployment. The gait-recognition
 * literature is the evidence that skeletons and silhouettes carry identity;
 * the article does not overclaim anonymity anywhere.
 */
export const canASkeletonStillRevealIdentity: InsightArticle = {
  slug: "can-a-skeleton-still-reveal-identity",
  title: "Can a Skeleton Still Reveal Identity?",
  titleAccent: "Reveal Identity",
  subtitle: "There is no single point where a person disappears from the data",
  deck:
    "Strip a walking video down: remove the face, keep only the silhouette, keep only the skeleton, keep only the paths the joints trace. Each step removes something that could identify a person and keeps something that still might. Where identity actually disappears is not a property of the picture; it depends on what is stored, what it is combined with, how long it persists and what it is for.",
  postType: "essay",
  category: "Privacy by Architecture",
  topics: ["responsible-ai", "movement-intelligence", "research"],
  date: "2026-09-30",
  excerpt:
    "RGB, face removed, silhouette, skeleton, joint trajectories: each representation removes some identifying cues and keeps others. Where identity disappears depends on storage, combination, persistence and purpose — not on the picture alone.",
  question: "If the face is gone and only a skeleton remains, is anyone still identifiable?",
  ctaLabel: "Strip the frame down",
  hooks: [
    "The five kinds of identifying information a walking video carries",
    "Why the gait-recognition literature is the strongest argument for privacy engineering",
    "The six things privacy actually depends on — and representation is only one",
  ],
  openingHook:
    "Before you scroll: one frame stripped down step by step, with a ledger of what could still identify the person at each stage — and how the ledger changes when the data is kept, or joined to something else.",
  twoMinute: [
    "A walking video carries several kinds of identifying information at once: face, clothing and colour, body shape and proportions, the gait pattern itself, and the context of time and place.",
    "Removing the face removes one of them. Clothing, build and gait are untouched; on their own they narrow a person down considerably.",
    "A silhouette removes texture and colour but keeps shape and movement — the very signals a decade of gait-recognition research has learned to identify people from.",
    "A skeleton removes appearance almost entirely, but pose sequences carry identity too; the research that makes GaitAI possible is the evidence.",
    "Joint trajectories carry the least image information — and if they are stored with times and places, or matched across days, a pattern can still be re-identified.",
    "Privacy depends on representation, storage, combination, persistence, purpose and deployment together. A diagram of the pipeline is not a privacy guarantee.",
  ],
  series: "Privacy by Architecture",
  seriesStep: 1,
  seriesOrder: 1,
  seriesTitle: "Where identity does and does not disappear",
  evidenceLevel: "research-informed",
  relatedSignals: ["cap-privacy", "sig-gait-identity", "cap-biometrics"],
  memorableInteraction:
    "Strip a frame from RGB to joint trajectories and watch the identity ledger refuse to reach zero — then switch on storage and linkage and watch it climb back.",
  hero: {
    src: "/assets/images/insights/social/can-a-skeleton-still-reveal-identity.png",
    alt: "GaitAI Insights social card: a figure stripped from RGB to a skeleton to joint trajectories, with a ledger of the identity cues that remain at each step",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "identity-layers",
    alt: "A figure stripped from a full image to a silhouette to a skeleton to joint trajectories, with the identity cues that remain at each stage.",
  },
  tags: ["Privacy", "Gait Biometrics", "Data Minimisation", "Privacy by Architecture"],
  seo: {
    title: "Can a Skeleton Still Reveal Identity? Where Privacy Actually Comes From in Movement AI",
    description:
      "From RGB to face removed to silhouette to skeleton to joint trajectories, each representation removes some identifying cues and keeps others. Why privacy depends on storage, combination, persistence and purpose — not on the picture alone.",
  },
  intro: [
    {
      type: "lead",
      text: "The most common privacy claim in movement AI is a diagram. A camera on the left, a stick figure on the right, an arrow between them, and the sentence \"we only process skeletons\". The diagram is honest about the engineering. It is not, on its own, a statement about privacy — and the field that made the engineering possible is the reason why.",
    },
    {
      type: "p",
      text: "Gait recognition is the study of identifying people by how they walk. Its best-known methods work from silhouettes and from skeletons: exactly the representations the diagram offers as the point where identity is gone. That is not a contradiction to be argued away. It is the fact a privacy architecture has to be built around.",
    },
    {
      type: "note",
      text: "The hero figure is illustrative — a drawn figure and a qualitative ledger, not a measurement of anyone's re-identifiability. The evidence links at the end point at the published surveys the argument draws on. Nothing here claims that any representation is anonymous.",
    },
  ],
  sections: [
    {
      id: "what-a-camera-holds",
      number: "01",
      navLabel: "What is held",
      title: "What a walking video actually holds",
      blocks: [
        {
          type: "p",
          text: "It helps to name the kinds of identifying information a few seconds of video carries, because they are removed by different steps and they do not weigh the same.",
        },
        {
          type: "states",
          caption: "Five layers of identity in a walking video. Illustrative grouping; the boundaries are not sharp.",
          items: [
            { label: "01", name: "Face", note: "The strongest single cue, and the one most people think of as identity." },
            { label: "02", name: "Appearance", note: "Clothing, colour, hair, accessories. Weak alone; strong in combination, and stable across a day." },
            { label: "03", name: "Shape", note: "Height, build, limb proportions. Persistent across days and clothing." },
            { label: "04", name: "Gait", note: "The pattern of the walk itself — timing, rhythm, posture. The subject of an entire recognition literature." },
            { label: "05", name: "Context", note: "When and where. Two anonymous observations at the same door at the same time each morning are not anonymous for long." },
          ],
        },
        {
          type: "p",
          text: "Every stage of a privacy pipeline removes some of these and keeps others. The question is never \"is identity gone\" but \"which layers remain, and what would it take to use them\".",
        },
      ],
    },
    {
      id: "removing-the-face-is-not-anonymity",
      number: "02",
      navLabel: "Face removed",
      title: "Removing the face is not anonymity",
      blocks: [
        {
          type: "p",
          text: "Blurring or masking the face is the first thing most systems do, and it should be: it removes the most recognisable region before anything is stored. It is also the step most often mistaken for the whole job.",
        },
        {
          type: "p",
          text: "Look at what remains. The clothing is intact, and clothing is stable for a day. The build and proportions are intact, and they are stable for years. The walk is intact. In a small population — a ward, an office, a school — appearance and build alone narrow a person down to a handful, and the third Foundation's privacy figure showed exactly this: after face redaction the identity indicator barely moved.",
        },
        {
          type: "callout",
          tone: "violet",
          title: "A useful step, an incomplete claim",
          text: "Face removal reduces the most direct route to identity and should be applied at the edge. Describing the result as anonymous is an overclaim, because four of the five layers are untouched.",
        },
      ],
    },
    {
      id: "silhouettes-and-skeletons",
      number: "03",
      navLabel: "Silhouette · skeleton",
      title: "Silhouettes and skeletons carry gait — and gait carries identity",
      blocks: [
        {
          type: "p",
          text: "A silhouette discards texture and colour: no face, no clothing detail, no hair. What it keeps is the outline — shape and its movement over time. A skeleton discards even the outline, keeping a dozen joints and how they move.",
        },
        {
          type: "p",
          text: "This is where the diagram's argument is weakest, because these are the representations gait recognition was built on. Silhouette-based methods have identified people from outlines for two decades; model-based methods do it from skeletons and joint angles. The surveys in the evidence below collect hundreds of such results across clothing changes, carried objects and viewing angles. That research is what makes movement measurement possible at all — and it is also a demonstration that a skeleton is not an anonymised person.",
        },
        {
          type: "compare",
          caption: "What each representation removes and keeps. Qualitative; the strength of what remains depends on the population and the data around it.",
          columns: [
            {
              label: "Removed",
              title: "Gone by the skeleton stage",
              tone: "cyan",
              points: ["Face", "Clothing, colour, hair", "Most of the body's outline", "Background and scene"],
            },
            {
              label: "Kept",
              title: "Still present in a skeleton",
              tone: "violet",
              points: ["Limb proportions and height", "The gait pattern — timing, rhythm, posture", "Whatever context travels with the frames", "A signature that recognition methods can learn"],
            },
          ],
        },
        {
          type: "quote",
          text: "The skeleton is not where identity ends. It is where identity stops being visible to a person and starts being visible only to a model.",
        },
      ],
    },
    {
      id: "trajectories-and-the-passage-of-time",
      number: "04",
      navLabel: "Trajectories",
      title: "Trajectories, and the passage of time",
      blocks: [
        {
          type: "p",
          text: "Reduce further and only movement remains: the paths a few joints trace, or the path a person takes through a room. This is the leanest representation a movement system can work from, and it is genuinely far from an image. A single trajectory, alone, identifies almost no one.",
        },
        {
          type: "p",
          text: "The word doing the work in that sentence is **alone**. Trajectories are recorded at a time, in a place. Keep them for a week and the same route at the same hour becomes a pattern. Join them to a door-access log, a rota, a room booking, and the pattern acquires a name. Match today's rhythm against yesterday's and a system that never stored a face is re-identifying a person by their walk — which is, once again, precisely the capability the recognition literature describes.",
        },
        {
          type: "matters",
          text: "The privacy of a representation is not a property of the representation. It is a property of the representation together with how long it is kept, what it is stored next to and what it is compared against. A pipeline diagram shows none of those.",
        },
      ],
    },
    {
      id: "privacy-depends-on",
      number: "05",
      navLabel: "What it depends on",
      title: "What privacy actually depends on",
      blocks: [
        {
          type: "p",
          text: "Put the argument together and identity does not disappear at a stage; it is reduced by a set of decisions, each of which can be undone by another. Six of them decide the outcome.",
        },
        {
          type: "list",
          tone: "violet",
          items: [
            "**Representation.** What survives the transformation: a skeleton keeps less than a silhouette, a trajectory less than a skeleton. Necessary, never sufficient.",
            "**Storage.** Whether the reduced data is kept at all, for how long, and whether the original frames are kept alongside it. A skeleton next to its source video is a video.",
            "**Combination.** What the data can be joined to: identity logs, timetables, other cameras, other sensors. Linkage is how anonymous data stops being anonymous.",
            "**Persistence.** Whether observations of the same walk can be matched across days. A pattern that recurs is a signature.",
            "**Purpose.** What the model is asked to do. A system built to count people in a corridor and a system built to recognise them can consume the same skeletons.",
            "**Deployment.** Who operates it, who can query it, and what the people being observed have been told. Architecture sets the ceiling; governance decides where under it a system sits.",
          ],
        },
        {
          type: "p",
          text: "Representation is the one an engineering team controls most directly, which is why it is the one that gets drawn. The other five are where most real privacy failures happen.",
        },
      ],
    },
    {
      id: "designing-for-honest-privacy",
      number: "06",
      navLabel: "Designing honestly",
      title: "Designing for honest privacy",
      blocks: [
        {
          type: "p",
          text: "None of this argues against privacy engineering. It argues for doing all of it, and for describing it accurately.",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "**Minimise at the edge, and mean it.** Transform before storage, not after. If the raw frames are never kept, four of the five layers never enter the system.",
            "**Do not keep what the purpose does not need.** A counting system needs no trajectories from last week. Expiry is a privacy control.",
            "**Do not link by default.** Movement data joined to identity data is identity data. Linkage should be a deliberate, disclosed decision.",
            "**Say what remains.** \"We process skeletons\" is a description of the representation. \"Skeletons can carry gait identity; here is what we do about that\" is a description of the privacy.",
            "**Treat re-identification as a capability the system has, not one it lacks.** The literature says it does. Govern accordingly.",
          ],
        },
        {
          type: "p",
          text: "The third Foundation called this **privacy by architecture**: sensing and identification as separable stages, separated on purpose. This story adds the caveat that keeps the phrase honest. The separation is not a place in the pipeline where identity is gone. It is a set of decisions that keep identity from being reassembled — and every one of them has to hold.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "Can a skeleton still reveal identity? Yes — the research that makes movement intelligence possible is the proof. That is not an argument against skeleton-based systems; it is the reason their privacy has to be engineered in storage, linkage, persistence, purpose and governance, not declared by a diagram.",
    },
    {
      type: "p",
      text: "Privacy by Architecture continues with the engineering of those decisions: what a movement system should keep, for how long, and how it can show that it did.",
    },
  ],
  cta: { label: "Read GaitAI's responsible-use commitments", href: "/legal/responsible-ai" },
  related: ["movement-intelligence-without-identification", "your-walk-is-more-than-a-biometric"],
};
