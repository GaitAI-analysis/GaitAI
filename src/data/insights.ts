/**
 * GaitAI Insights — the editorial layer.
 *
 * Long-form essays and research notes are authored here as structured content
 * rather than free-form markdown, so every article renders through one shared
 * template with consistent typography, section numbering, diagrams and pull
 * quotes. Firestore remains the source of truth for newsroom-style posts (see
 * `lib/posts.ts`); this file holds the lab's own editorial record, which is
 * versioned with the codebase and statically rendered.
 *
 * LANGUAGE RULE: nothing here may assert clinical validation, regulatory
 * clearance, diagnostic performance or deployment scale. Articles describe how
 * movement is measured and interpreted — measurements and decision support,
 * never diagnoses.
 */

export type InsightTopic =
  | "movement-intelligence"
  | "responsible-ai"
  | "mobility"
  | "research";

export const TOPIC_FILTERS: Array<{ key: InsightTopic | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "movement-intelligence", label: "Movement Intelligence" },
  { key: "responsible-ai", label: "Responsible AI" },
  { key: "mobility", label: "Mobility" },
  { key: "research", label: "Research" },
];

/** Inline text supports **bold** and [label](/href). */
export type InsightBlock =
  /** Opening paragraph, set larger than body copy. */
  | { type: "lead"; text: string }
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; items: string[]; tone?: "cyan" | "violet" }
  /** Pull quote — breaks slightly wider than the body column. */
  | { type: "quote"; text: string }
  | { type: "callout"; tone: "cyan" | "violet"; title: string; text: string }
  /** Small stepped diagram: a chain of stages joined by arrows. */
  | { type: "flow"; steps: string[]; caption?: string; layout?: "stack" | "row" }
  /** Two-way contrast panel. */
  | {
      type: "compare";
      caption?: string;
      columns: Array<{
        label: string;
        title: string;
        points: string[];
        tone?: "cyan" | "violet";
      }>;
    }
  /** Scope or caveat line, set quietly. */
  | { type: "note"; text: string };

export interface InsightSection {
  /** Anchor id — also used by the on-this-page navigation. */
  id: string;
  number: string;
  /** Optional label above the section title (e.g. "Question 1"). */
  kicker?: string;
  title: string;
  blocks: InsightBlock[];
}

export interface InsightArticle {
  slug: string;
  /** Display headline. */
  title: string;
  /** Trailing fragment of `title` rendered in the brand gradient. */
  titleAccent: string;
  /** Second line of the headline, where the title carries one. */
  subtitle?: string;
  /** Standfirst under the headline. */
  deck: string;
  /** Editorial category label. */
  category: string;
  /** Filter buckets this article belongs to. */
  topics: InsightTopic[];
  /** ISO date. */
  date: string;
  readMinutes: number;
  excerpt: string;
  hero: { src: string; alt: string; width: number; height: number };
  tags: string[];
  seo: { title: string; description: string };
  intro: InsightBlock[];
  sections: InsightSection[];
  closing: InsightBlock[];
  cta: { label: string; href: string };
  /** Slugs of the two articles offered at the foot of the page. */
  related: [string, string];
}

export const INSIGHTS_AUTHOR = "GaitAI Research";
export const INSIGHTS_PUBLISHER = "GaitAI";

export const insightArticles: InsightArticle[] = [
  /* ══════════════════════════════════════════════════════════════════════
     01 — Technical Essay
     ══════════════════════════════════════════════════════════════════════ */
  {
    slug: "from-walking-video-to-movement-intelligence",
    title: "From Walking Video to Movement Intelligence",
    titleAccent: "Movement Intelligence",
    subtitle: "What actually happens inside GaitAI",
    deck:
      "Capture, pose estimation, gait features, sensor fusion, quality control and output — the sequence of transformations that turns an ordinary walking sequence into something a clinician, researcher or operator can act on.",
    category: "Technical Essay",
    topics: ["movement-intelligence", "research"],
    date: "2026-08-26",
    readMinutes: 8,
    excerpt:
      "A walking video looks simple. Turning it into reliable movement intelligence is not. Inside the pipeline from capture and pose estimation to gait features, sensor fusion and actionable outputs.",
    hero: {
      src: "/assets/images/insights/01-walking-video-to-movement-intelligence.jpg",
      alt: "Smartphone video, CCTV and wearable signals converging into a holographic walking figure and gait measurement readouts",
      width: 1672,
      height: 941,
    },
    tags: ["Movement Intelligence", "Gait AI", "Pose Estimation", "Sensor Fusion"],
    seo: {
      title:
        "From Walking Video to Movement Intelligence: What Actually Happens Inside GaitAI",
      description:
        "A walk-through of the GaitAI pipeline — capture, pose estimation, temporal gait features, sensor fusion, signal-quality control, and the step from measurement to decision support.",
    },
    intro: [
      { type: "lead", text: "A walking video looks simple." },
      {
        type: "p",
        text: "A person crosses a room. A camera records the movement. To the human eye it is immediately recognizable as walking — and immediately interpretable. We read effort, hesitation and confidence from a gait without consciously measuring anything.",
      },
      {
        type: "p",
        text: "For an AI system, useful movement intelligence does not exist in the pixels automatically. It has to be constructed.",
      },
      {
        type: "p",
        text: "The journey from an ordinary walking sequence to an interpretable movement signal runs through a series of transformations: capture, pose estimation, temporal analysis, feature extraction, multimodal reasoning, quality control, and finally a form of output that a clinician, researcher or operator can actually use.",
      },
      { type: "p", text: "This is the pipeline behind GaitAI." },
    ],
    sections: [
      {
        id: "movement-begins-as-a-signal",
        number: "01",
        title: "Movement begins as a signal",
        blocks: [
          {
            type: "p",
            text: "Before anything can be measured, movement has to be observed. The observation itself is a design decision — what is recorded, from where, and for how long shapes everything downstream.",
          },
          {
            type: "p",
            text: "Depending on the deployment, the input to a movement-intelligence system may be any of the following:",
          },
          {
            type: "list",
            items: [
              "**A short walking video** — a few seconds of natural walking, captured on request",
              "**A smartphone camera** — the most widely available capture device there is",
              "**A fixed camera or CCTV stream** — where the setting and its governance make that appropriate",
              "**A smartwatch or wrist-worn wearable** — continuous, low-friction, already on the person",
              "**IMU and other compatible sensor streams** — accelerometer, gyroscope and related channels",
            ],
          },
          {
            type: "callout",
            tone: "cyan",
            title: "Not every application uses every input",
            text: "Different GaitAI applications do not necessarily require every modality. Some are built on vision alone. Some are built on wearables alone. Some combine several. The right input set is the one the task actually needs — not the largest one available.",
          },
        ],
      },
      {
        id: "from-pixels-to-pose",
        number: "02",
        title: "From pixels to pose",
        blocks: [
          {
            type: "p",
            text: "Raw RGB frames are not a usable representation of movement. They carry an enormous amount of information that has nothing to do with how a person walks: clothing, lighting, background, camera noise. The first substantive transformation strips that away.",
          },
          {
            type: "flow",
            steps: [
              "Frames",
              "Person detection & tracking",
              "Body landmarks",
              "Temporal pose sequence",
            ],
            caption: "The vision front-end reduces appearance to geometry.",
          },
          {
            type: "p",
            text: "Pose estimation reduces each frame to a small set of anatomical landmarks — points whose positions can be compared across frames and across people:",
          },
          {
            type: "list",
            items: [
              "Shoulders",
              "Hips",
              "Knees",
              "Ankles",
              "Elbows and wrists",
              "Head and neck reference points",
            ],
          },
          { type: "h3", text: "Why the temporal sequence matters" },
          {
            type: "p",
            text: "A single frame gives a posture. Gait is not a posture — it is a rhythm. Step timing, the alternation between left and right, the fraction of the cycle spent with both feet grounded, the smoothness of a swing: none of these exist in one frame. They exist only in the relationship between frames.",
          },
          {
            type: "quote",
            text: "A single frame shows a posture. Only a sequence shows a gait.",
          },
          {
            type: "p",
            text: "This is also why tracking matters as much as detection. Landmarks are only comparable over time if the system knows they belong to the same person throughout the sequence.",
          },
        ],
      },
      {
        id: "skeleton-is-not-gait-intelligence",
        number: "03",
        title: "A skeleton is still not gait intelligence",
        blocks: [
          {
            type: "p",
            text: "A temporal pose sequence is geometry, not insight. The next transformation converts that geometry into gait-related descriptors — quantities describing how the walking is organized rather than where the joints happened to be.",
          },
          {
            type: "list",
            tone: "violet",
            items: [
              "**Cadence** — steps per unit time",
              "**Step timing** — the duration and consistency of individual steps",
              "**Stride rhythm** — the regularity of the full gait cycle",
              "**Left/right symmetry** — how closely the two sides mirror each other",
              "**Movement variability** — how much the pattern fluctuates from cycle to cycle",
              "**Posture** — trunk orientation and its stability through the cycle",
              "**Joint trajectories** — the paths described by individual joints",
              "**Walking speed**, where the capture geometry makes it recoverable",
              "**Balance-related proxies** — derived indicators associated with stability",
            ],
          },
          {
            type: "callout",
            tone: "violet",
            title: "Measurements, not diagnoses",
            text: "Every quantity above is a description of movement. None is a medical finding. A gait descriptor can indicate that walking has changed; it cannot, on its own, say why. Keeping that boundary explicit is part of the engineering, not a disclaimer bolted on afterwards.",
          },
        ],
      },
      {
        id: "why-fusion-matters",
        number: "04",
        title: "Why fusion matters",
        blocks: [
          {
            type: "p",
            text: "Different sensors see different aspects of the same movement, and none of them sees all of it.",
          },
          {
            type: "compare",
            caption: "Complementary evidence — each strong where the other is weak.",
            columns: [
              {
                label: "Vision",
                title: "Spatial structure",
                tone: "cyan",
                points: [
                  "Body geometry and joint relationships",
                  "Step length and spatial symmetry",
                  "Posture through the gait cycle",
                  "Degrades under occlusion and poor framing",
                ],
              },
              {
                label: "Wearable / IMU",
                title: "Inertial dynamics",
                tone: "violet",
                points: [
                  "Acceleration and rotation at the sensor site",
                  "Fine-grained step timing",
                  "Continuous, viewpoint-independent capture",
                  "Limited view of whole-body geometry",
                ],
              },
            ],
          },
          {
            type: "p",
            text: "Fusion is the mechanism for combining those views. It is also the part of a multimodal system easiest to get wrong, because adding a modality always adds parameters, and adding parameters usually moves a benchmark number.",
          },
          {
            type: "quote",
            text: "Fusion should not mean “more data is automatically better.” It should mean different evidence is combined when it improves the task.",
          },
          {
            type: "p",
            text: "That distinction is worth testing rather than assuming. We return to it in [When Fusion Looks Better Than It Is](/insights/when-fusion-looks-better-than-it-is/), which sets out the questions a multimodal result should be able to survive.",
          },
        ],
      },
      {
        id: "quality-before-intelligence",
        number: "05",
        title: "Quality before intelligence",
        blocks: [
          {
            type: "p",
            text: "Real captures are not clean. A movement-intelligence system that assumes otherwise will produce its most confident outputs on exactly the observations that deserve the least confidence.",
          },
          { type: "p", text: "The failure modes are mundane and frequent:" },
          {
            type: "list",
            items: [
              "**Occlusion** — furniture, other people, or the person's own body hiding key landmarks",
              "**Incomplete body visibility** — feet or head outside the frame for part of the walk",
              "**Poor camera placement** — an angle that collapses the movement being measured",
              "**Low-quality signal** — motion blur, low light, heavy compression, dropped frames",
              "**A missing modality** — one expected stream simply not present",
              "**A corrupted stream** — data that arrives, but damaged",
              "**Very short recordings** — too few gait cycles to establish a rhythm at all",
            ],
          },
          {
            type: "p",
            text: "A responsible system therefore needs a second capability alongside measurement: the ability to recognize when the evidence is not good enough to measure from. That means scoring signal quality explicitly, flagging degraded captures, attenuating confidence, and declining to emit a result where the input does not support one.",
          },
          {
            type: "callout",
            tone: "cyan",
            title: "An honest gap beats a confident artefact",
            text: "“We could not measure this reliably” is a genuinely useful output. A precise-looking number derived from a two-second, half-occluded capture is not — it is noise wearing the costume of a measurement.",
          },
        ],
      },
      {
        id: "from-metric-to-decision-support",
        number: "06",
        title: "From metric to decision support",
        blocks: [
          {
            type: "p",
            text: "Even a clean, well-measured gait feature is not yet intelligence. A number on its own has no reference point.",
          },
          { type: "quote", text: "Measurement is not the same thing as intelligence." },
          {
            type: "p",
            text: "What makes a measurement interpretable is context — a baseline to compare it against, a history to place it in, and a presentation that reaches the right person in a usable form.",
          },
          {
            type: "flow",
            steps: [
              "Stride variability",
              "Comparison with baseline",
              "Longitudinal change",
              "Interpretable mobility insight",
              "Report · dashboard · alert",
            ],
            caption:
              "The same feature, moved through context until it can support a decision.",
          },
          {
            type: "p",
            text: "The value sits in the middle of that chain, not at either end. Why the longitudinal step matters so much is the subject of [A Fall-Risk Score Is Not Enough](/insights/fall-risk-is-a-trend-not-a-number/).",
          },
        ],
      },
      {
        id: "one-engine-different-outcomes",
        number: "07",
        title: "One engine, different outcomes",
        blocks: [
          {
            type: "p",
            text: "Capture, pose, gait features, fusion and quality control are shared. What changes between applications is the interpretation layer that sits on top of them.",
          },
          {
            type: "flow",
            layout: "row",
            steps: [
              "Movement input",
              "Shared intelligence layer",
              "MobilityCare · SecureVision",
            ],
            caption: "One engine; the downstream question decides what the output means.",
          },
          {
            type: "p",
            text: "In a clinical or care setting, a change in stride variability is read against a person's own movement history and surfaced for review — the framing behind [MobilityCare](/mobilitycare). In a safety or spatial-analytics setting, the same underlying movement processing supports a different question about events and flow in a monitored space — the framing behind [SecureVision](/securevision).",
          },
          {
            type: "p",
            text: "The measurements can be identical. The interpretation, the governance and the output are not, and treating them as interchangeable is how movement systems drift outside their intended purpose. The [product family](/products) and the [use cases](/use-cases) set out where each interpretation applies.",
          },
        ],
      },
    ],
    closing: [
      { type: "p", text: "Movement is the input." },
      {
        type: "quote",
        text: "The real intelligence lies in what happens between observation and action.",
      },
    ],
    cta: { label: "Explore the GaitAI engine", href: "/products" },
    related: [
      "your-walk-is-more-than-a-biometric",
      "movement-intelligence-without-identification",
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════
     02 — Research Note
     ══════════════════════════════════════════════════════════════════════ */
  {
    slug: "your-walk-is-more-than-a-biometric",
    title: "Your Walk Is More Than a Biometric",
    titleAccent: "More Than a Biometric",
    deck:
      "Gait research has often been framed around identity. Human movement also carries information about mobility, recovery, functional change, risk and safety context — and the framing decides what a system gets built to find.",
    category: "Research Note",
    topics: ["movement-intelligence", "mobility", "research"],
    date: "2026-08-19",
    readMinutes: 6,
    excerpt:
      "Gait has often been studied as a biometric signature. But human movement can carry information about mobility, recovery, functional change, risk and safety context as well.",
    hero: {
      src: "/assets/images/insights/02-walk-more-than-biometric.jpg",
      alt: "A holographic walking figure surrounded by panels for identity, health, joint analysis and spatial safety context",
      width: 1672,
      height: 941,
    },
    tags: ["Gait Biometrics", "Movement Intelligence", "Mobility", "Research"],
    seo: {
      title: "Your Walk Is More Than a Biometric",
      description:
        "Identity is only one way to read human movement. A research note on gait as a signal for mobility, recovery, movement-risk screening and spatial safety context.",
    },
    intro: [
      {
        type: "lead",
        text: "For years, gait research has often been framed around one compelling question: can the way a person walks help identify them?",
      },
      {
        type: "p",
        text: "It is a meaningful research direction, and a well-studied one. But identity is only one way of interpreting human movement — and framing the field around it quietly narrows what gets built.",
      },
      { type: "p", text: "A walk is also a dynamic physical signal." },
      {
        type: "p",
        text: "Depending on the application and the information available, that signal can help characterize mobility, recovery, movement quality, functional change and safety context. Below are five readings of the same underlying observation.",
      },
    ],
    sections: [
      {
        id: "identity",
        number: "01",
        title: "Identity",
        blocks: [
          {
            type: "p",
            text: "Gait has been studied as a behavioral biometric: a pattern arising from how an individual's body organizes movement, rather than from a static physical feature.",
          },
          {
            type: "list",
            items: [
              "**Non-contact by nature** — it can be observed at a distance, without cooperation from the subject",
              "**Rooted in temporal dynamics** — the signal lives in body motion over time, not in a still image",
              "**Aspires to appearance independence** — the research goal is a representation that survives changes of clothing, viewpoint and lighting",
            ],
          },
          {
            type: "note",
            text: "Those are research properties, not guarantees. Gait-based identification remains sensitive to viewpoint, footwear, walking surface, load, speed and health state, and nothing here should be read as a claim of reliable recognition in unconstrained conditions.",
          },
          {
            type: "p",
            text: "GaitAI's peer-reviewed work in this area is listed in the [publications library](/publications).",
          },
        ],
      },
      {
        id: "mobility",
        number: "02",
        title: "Mobility",
        blocks: [
          {
            type: "p",
            text: "The same observation, read functionally rather than as a signature, describes how well someone is moving right now.",
          },
          {
            type: "list",
            tone: "violet",
            items: [
              "Walking speed",
              "Cadence",
              "Left/right symmetry",
              "Stride characteristics",
              "Cycle-to-cycle variability",
              "Stability-related measures",
            ],
          },
          {
            type: "p",
            text: "These are quantitative descriptions of movement quality. They say nothing about who the person is — and for a mobility question, they do not need to.",
          },
        ],
      },
      {
        id: "recovery",
        number: "03",
        title: "Recovery",
        blocks: [
          {
            type: "p",
            text: "Read across time rather than at a single moment, movement becomes a record of change.",
          },
          {
            type: "flow",
            steps: ["Baseline", "Intervention", "Follow-up", "Change"],
            caption:
              "The comparison, not the individual measurement, carries the information.",
          },
          {
            type: "p",
            text: "This longitudinal reading is relevant wherever movement is expected to change over a known period:",
          },
          {
            type: "list",
            items: [
              "**Rehabilitation** — tracking movement quality alongside a programme of care",
              "**Post-operative movement** — observing how gait reorganizes after a procedure",
              "**Sports recovery** — following return-to-activity progression in a training context",
            ],
          },
          {
            type: "note",
            text: "Movement analysis supports these processes with objective measurements. It does not replace clinical assessment, and the interpretation of any change remains with the qualified professional involved.",
          },
        ],
      },
      {
        id: "risk",
        number: "04",
        title: "Risk",
        blocks: [
          {
            type: "p",
            text: "Because movement patterns can shift before a person notices any difficulty, they may contribute to screening — surfacing individuals whose movement warrants a closer look.",
          },
          {
            type: "callout",
            tone: "cyan",
            title: "What a movement-risk indicator is not",
            text: "A movement-risk indicator is not a prediction that a particular person will experience a specific event. It is a signal that movement has changed, or differs from an expected pattern, in a way that may deserve review.",
          },
          {
            type: "p",
            text: "That distinction is not a matter of phrasing. It determines how an output should be presented, who should act on it, and what an appropriate response looks like.",
          },
        ],
      },
      {
        id: "safety-and-spatial-intelligence",
        number: "05",
        title: "Safety and spatial intelligence",
        blocks: [
          {
            type: "p",
            text: "At the level of a space rather than a person, movement carries a different class of information again:",
          },
          {
            type: "list",
            items: [
              "Fall events",
              "Unusual movement events",
              "Crowd flow",
              "Queue dynamics",
              "Movement in restricted areas",
              "Movement anomalies relative to a normal pattern of use",
            ],
          },
          {
            type: "p",
            text: "Most of these are questions about motion in a space, not about individuals — which is precisely why they can often be answered without identification at all. That argument is developed in [Can AI Understand Movement Without Identifying the Person?](/insights/movement-intelligence-without-identification/).",
          },
          {
            type: "note",
            text: "Applications of this kind belong inside an explicit governance framework covering purpose, authorization, retention and access. Our position is set out in the [responsible AI policy](/legal/responsible-ai).",
          },
        ],
      },
      {
        id: "the-important-shift",
        number: "06",
        title: "The important shift",
        blocks: [
          {
            type: "compare",
            columns: [
              {
                label: "Older framing",
                title: "Identity first",
                tone: "violet",
                points: ["Who is this person?"],
              },
              {
                label: "Movement intelligence",
                title: "Function first",
                tone: "cyan",
                points: [
                  "How is this person moving?",
                  "How is that movement changing?",
                  "What clinical or operational context does that change support?",
                ],
              },
            ],
          },
          {
            type: "p",
            text: "The second framing is not a softer version of the first. It asks for different measurements, different validation and different governance — and it makes a far wider set of problems tractable without needing to know who anyone is. The [research programme](/research) behind it spans gait recognition, pose estimation, sensor fusion and privacy-aware analysis.",
          },
        ],
      },
    ],
    closing: [
      { type: "p", text: "A step is not just motion." },
      { type: "quote", text: "It is information in motion." },
    ],
    cta: { label: "Explore GaitAI Research", href: "/research" },
    related: [
      "from-walking-video-to-movement-intelligence",
      "fall-risk-is-a-trend-not-a-number",
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════
     03 — Responsible AI
     ══════════════════════════════════════════════════════════════════════ */
  {
    slug: "movement-intelligence-without-identification",
    title: "Can AI Understand Movement Without Identifying the Person?",
    titleAccent: "Without Identifying the Person?",
    deck:
      "Many movement-intelligence tasks do not inherently require identity. A privacy-aware architecture starts by asking what information the task actually needs — and then declines to retain the rest.",
    category: "Responsible AI",
    topics: ["responsible-ai", "movement-intelligence"],
    date: "2026-08-12",
    readMinutes: 7,
    excerpt:
      "Many movement-intelligence tasks do not inherently require identity. A privacy-aware architecture starts by asking what information the task actually needs.",
    hero: {
      src: "/assets/images/insights/03-privacy-aware-movement-intelligence.jpg",
      alt: "A CCTV feed passing through a privacy transformation into an anonymous skeletal movement representation and analytics panels",
      width: 1672,
      height: 941,
    },
    tags: ["Responsible AI", "Privacy", "Computer Vision", "SecureVision"],
    seo: {
      title: "Can AI Understand Movement Without Identifying the Person?",
      description:
        "Privacy-aware movement intelligence: separating sensing from identification, data minimization by architecture, and where identity legitimately belongs.",
    },
    intro: [
      {
        type: "lead",
        text: "Computer vision has historically been rewarded for seeing more.",
      },
      {
        type: "p",
        text: "Higher-resolution images. More visual detail. Longer retention. More identifiers. Each of those has been treated, at various points, as an unambiguous improvement.",
      },
      {
        type: "p",
        text: "Privacy-aware movement intelligence begins with a different question:",
      },
      { type: "quote", text: "What is the minimum information required to solve the task?" },
      {
        type: "p",
        text: "It is a design question before it is a compliance question, and answering it honestly changes the architecture rather than the wording of a policy page.",
      },
    ],
    sections: [
      {
        id: "identity-is-not-always-the-objective",
        number: "01",
        title: "Identity is not always the objective",
        blocks: [
          {
            type: "p",
            text: "A surprising share of movement-analytics problems turn out to be questions about motion in a space rather than questions about people:",
          },
          {
            type: "list",
            items: [
              "**Crowd-density estimation** does not inherently require anyone's name",
              "**Queue analysis** does not inherently require face recognition",
              "**Fall-event detection** does not inherently require persistent identity",
              "**Movement-flow analytics** generally require motion patterns, not personal identity",
            ],
          },
          {
            type: "p",
            text: "Where identity is not required by the task, collecting it is not a bonus. It is an unnecessary liability attached to a system that would work without it.",
          },
        ],
      },
      {
        id: "separate-sensing-from-identification",
        number: "02",
        title: "Separate sensing from identification",
        blocks: [
          {
            type: "p",
            text: "The practical move is to place a deliberate transformation between the sensor and everything that follows it, so the analytics layer never receives identifying detail in the first place.",
          },
          {
            type: "flow",
            steps: [
              "Raw sensing",
              "Privacy transformation",
              "Pose / movement representation",
              "Analysis",
              "Minimized output",
            ],
            caption: "Identifying detail is removed early — not filtered out at the end.",
          },
          {
            type: "p",
            text: "Depending on what the deployment permits and what the task requires, that transformation can draw on:",
          },
          {
            type: "list",
            tone: "violet",
            items: [
              "**Face blurring or redaction** at or near the point of capture",
              "**Skeletal representation** — retaining geometry while discarding appearance",
              "**Anonymized identifiers** in place of any personal reference",
              "**Short-lived track identifiers** that maintain continuity within a sequence, then expire",
              "**Aggregated metrics** where only counts, flows or rates leave the system",
            ],
          },
          {
            type: "note",
            text: "Each of these is appropriate in some contexts and not in others. The point is not that a single technique solves privacy — it is that the choice belongs in the architecture, and should be made explicitly, for a stated purpose.",
          },
        ],
      },
      {
        id: "privacy-by-architecture",
        number: "03",
        title: "Privacy by architecture",
        blocks: [
          {
            type: "p",
            text: "Privacy properties that depend on operator discipline tend not to survive contact with production. Properties enforced by the structure of the system are more durable. The principles we design against:",
          },
          {
            type: "list",
            items: [
              "**Data minimization** — capture and retain only what the task requires",
              "**Purpose limitation** — a system built for one question should not quietly answer others",
              "**Configurable retention** — retention as an explicit, reviewable setting, not an accident of storage",
              "**Access control** — who can see what, enforced rather than assumed",
              "**Auditability** — a record of what was accessed, and by whom",
              "**Role separation** — operating a system and re-identifying individuals are different privileges",
            ],
          },
          {
            type: "callout",
            tone: "cyan",
            title: "Design principles, not certifications",
            text: "These are the principles our architecture is designed around. They are engineering commitments — nothing here should be read as a claim of regulatory certification or third-party accreditation. Where a deployment carries formal obligations, those are established with the deploying organization for its own jurisdiction and setting.",
          },
        ],
      },
      {
        id: "when-identity-may-legitimately-matter",
        number: "04",
        title: "When identity may legitimately matter",
        blocks: [
          {
            type: "p",
            text: "It would be dishonest to argue that identification should never exist. Access control, authorized investigation and consented clinical records are real requirements, and pretending otherwise simply pushes them into tools with weaker safeguards.",
          },
          {
            type: "p",
            text: "The argument is narrower and firmer: identification is a distinct capability with distinct obligations. Where an application genuinely requires it, it should carry:",
          },
          {
            type: "list",
            tone: "violet",
            items: [
              "**A legitimate, stated purpose** — documented before deployment, not inferred afterwards",
              "**Explicit governance** — a named owner and a defined review process",
              "**Appropriate authorization** — for the specific setting and jurisdiction",
              "**Stronger access controls** than the surrounding analytics",
              "**Stricter retention** — shorter, enforced and auditable",
            ],
          },
          {
            type: "p",
            text: "The mistake is not building identification. The mistake is building it by default, into systems whose actual task never asked for it.",
          },
        ],
      },
      {
        id: "more-privacy-does-not-mean-less-intelligence",
        number: "05",
        title: "More privacy does not have to mean less intelligence",
        blocks: [
          {
            type: "p",
            text: "The assumed trade-off — that protecting privacy necessarily costs analytical power — holds far less often than it is invoked.",
          },
          {
            type: "compare",
            caption:
              "For a large class of movement tasks, the left column is the whole requirement.",
            columns: [
              {
                label: "Often sufficient",
                title: "Movement representations",
                tone: "cyan",
                points: [
                  "Pose and joint geometry",
                  "Trajectory through a space",
                  "Motion dynamics over time",
                  "Aggregated flow and density",
                ],
              },
              {
                label: "Rarely required",
                title: "Full visual identity",
                tone: "violet",
                points: [
                  "Recognizable facial imagery",
                  "Persistent personal identifiers",
                  "Long-lived raw video retention",
                ],
              },
            ],
          },
          {
            type: "p",
            text: "A fall event has a movement signature. A queue has a flow signature. A crowd has a density signature. None of those signatures is made sharper by knowing a name. The [PrivacyGuard](/securevision/privacyguard) capability within [SecureVision](/securevision) exists to make that separation a configuration rather than a promise.",
          },
        ],
      },
    ],
    closing: [
      { type: "p", text: "Privacy-aware AI is not AI that sees less intelligently." },
      { type: "quote", text: "It is AI designed to retain only what the task actually needs." },
    ],
    cta: { label: "Explore SecureVision", href: "/securevision" },
    related: [
      "when-fusion-looks-better-than-it-is",
      "from-walking-video-to-movement-intelligence",
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════
     04 — Clinical Movement Intelligence
     ══════════════════════════════════════════════════════════════════════ */
  {
    slug: "fall-risk-is-a-trend-not-a-number",
    title: "A Fall-Risk Score Is Not Enough",
    titleAccent: "Is Not Enough",
    subtitle: "Why mobility must be measured over time",
    deck:
      "A single assessment describes how someone moves today. Longitudinal movement analysis asks the more useful question — how is that movement changing, relative to this person's own history?",
    category: "Clinical Movement Intelligence",
    topics: ["mobility", "movement-intelligence"],
    date: "2026-08-05",
    readMinutes: 6,
    excerpt:
      "A single assessment tells us how someone moves today. Longitudinal movement analysis asks the more useful question: how is that movement changing?",
    hero: {
      src: "/assets/images/insights/04-longitudinal-fall-risk.jpg",
      alt: "Five repeated walking assessments numbered 01 to 05 plotted along a timeline showing a longitudinal mobility trend",
      width: 1672,
      height: 941,
    },
    tags: ["Mobility", "Fall Risk", "Longitudinal Monitoring", "MobilityCare"],
    seo: {
      title: "A Fall-Risk Score Is Not Enough: Why Mobility Must Be Measured Over Time",
      description:
        "Why a single mobility score loses context, how individual baselines and longitudinal movement trends change the question, and what a movement-risk indicator can and cannot mean.",
    },
    intro: [
      {
        type: "lead",
        text: "A single mobility assessment answers one question: how is this person moving today?",
      },
      {
        type: "p",
        text: "Longitudinal movement analysis asks a different one: how is this person's movement changing?",
      },
      { type: "p", text: "That difference matters more than it first appears." },
    ],
    sections: [
      {
        id: "one-number-loses-context",
        number: "01",
        title: "One number loses context",
        blocks: [
          {
            type: "p",
            text: "A score is a snapshot. It compresses a complex, time-varying pattern into a single value at a single moment — and in doing so it discards the dimension that often carries the most information.",
          },
          {
            type: "compare",
            caption:
              "Illustrative only — a conceptual contrast, not a clinical threshold or case description.",
            columns: [
              {
                label: "Person A",
                title: "Stable",
                tone: "cyan",
                points: [
                  "Repeated assessments stay within a similar range",
                  "Variation looks like ordinary day-to-day noise",
                  "The direction of travel is flat",
                ],
              },
              {
                label: "Person B",
                title: "Declining",
                tone: "violet",
                points: [
                  "Each assessment sits slightly below the last",
                  "The change is small at every individual step",
                  "The direction of travel is consistent",
                ],
              },
            ],
          },
          {
            type: "p",
            text: "On any one day, these two people can produce the same score. Read as single numbers they look identical. Read as sequences they are telling completely different stories — and only one of them warrants attention.",
          },
          {
            type: "quote",
            text: "Two people can share a score and have entirely different trajectories.",
          },
        ],
      },
      {
        id: "individual-baseline-matters",
        number: "02",
        title: "Individual baseline matters",
        blocks: [
          {
            type: "p",
            text: "Population norms are useful. They give a reference for what typical movement looks like across a group, and they are often the only reference available at a first encounter.",
          },
          {
            type: "p",
            text: "But people differ enormously in their normal movement, for reasons that have nothing to do with risk: height, footwear, habitual pace, prior injury, occupation, terrain. Someone can sit outside a population norm permanently and be entirely stable, while someone comfortably inside it can be moving away from their own established pattern.",
          },
          {
            type: "callout",
            tone: "cyan",
            title: "The most informative comparison is often self-referential",
            text: "Longitudinal monitoring makes it possible to compare a person with their own prior movement, not only with a population distribution. Deviation from personal baseline is harder to explain away than deviation from an average.",
          },
        ],
      },
      {
        id: "which-signals-can-change",
        number: "03",
        title: "Which signals can change?",
        blocks: [
          {
            type: "p",
            text: "Longitudinal analysis is only as good as the stability of what it tracks. The gait descriptors that repay repeated measurement include:",
          },
          {
            type: "list",
            tone: "violet",
            items: [
              "Walking speed",
              "Cadence",
              "Stride variability",
              "Left/right asymmetry",
              "Posture through the gait cycle",
              "Balance-related indicators",
              "Change in the temporal structure of the gait pattern",
            ],
          },
          {
            type: "p",
            text: "How these are derived from a walking observation is described in [From Walking Video to Movement Intelligence](/insights/from-walking-video-to-movement-intelligence/).",
          },
        ],
      },
      {
        id: "trend-plus-context",
        number: "04",
        title: "Trend + context",
        blocks: [
          {
            type: "p",
            text: "A worsening feature should not automatically trigger a medical conclusion. A trend is evidence that something changed; it is not evidence of why.",
          },
          {
            type: "p",
            text: "Any of the following can move a movement feature without indicating clinical deterioration:",
          },
          {
            type: "list",
            items: [
              "**Temporary fatigue** — time of day, sleep, recent exertion",
              "**Injury** — including minor, unrelated and self-limiting ones",
              "**Rehabilitation** — where change is the intended outcome",
              "**Environment** — surface, footwear, available walking distance",
              "**Measurement quality** — a degraded capture producing a degraded feature",
              "**Device or camera differences** — a change of instrument, not of person",
            ],
          },
          {
            type: "note",
            text: "This is why capture conditions belong in the record alongside the measurement. A trend computed across inconsistent instruments and settings is not a trend in the person — it may simply be a trend in the measurement setup.",
          },
        ],
      },
      {
        id: "decision-support-not-prediction",
        number: "05",
        title: "Decision support, not deterministic prediction",
        blocks: [
          {
            type: "callout",
            tone: "violet",
            title: "The distinction that governs everything else",
            text: "A mobility-risk indicator should not be interpreted as a prediction that a specific person will fall at a specific time. Its value is in helping surface movement changes that may deserve review.",
          },
          {
            type: "p",
            text: "Framed that way the output has a clear and modest job: direct limited professional attention toward the people whose movement has changed. It orders a queue for review. It does not make a determination, and it does not replace the judgment of the clinician or care team who does.",
          },
        ],
      },
      {
        id: "from-assessment-to-trajectory",
        number: "06",
        title: "From assessment to trajectory",
        blocks: [
          {
            type: "flow",
            steps: [
              "Baseline",
              "Follow-up 1",
              "Follow-up 2",
              "Follow-up 3",
              "Trend",
              "Review",
            ],
            caption: "Each assessment is a data point. The sequence is the finding.",
          },
          {
            type: "p",
            text: "This is the shape [FallRisk](/mobilitycare/fallrisk) is built around, and the reason repeated, consistent capture matters more than any single high-effort assessment. The wider [MobilityCare](/mobilitycare) family applies the same longitudinal logic across rehabilitation, post-operative movement and elderly care.",
          },
        ],
      },
    ],
    closing: [
      { type: "p", text: "The most meaningful movement score may not be today's number." },
      { type: "quote", text: "It may be the direction in which that number is moving." },
    ],
    cta: { label: "Explore FallRisk", href: "/mobilitycare/fallrisk" },
    related: [
      "your-walk-is-more-than-a-biometric",
      "from-walking-video-to-movement-intelligence",
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════
     05 — Research Note
     ══════════════════════════════════════════════════════════════════════ */
  {
    slug: "when-fusion-looks-better-than-it-is",
    title: "When Fusion Looks Better Than It Is",
    titleAccent: "Better Than It Is",
    subtitle: "Five questions to ask before trusting a multimodal AI model",
    deck:
      "More modalities and more elaborate fusion do not automatically mean better evidence. Five questions that separate a genuinely convincing multimodal result from a well-decorated benchmark number.",
    category: "Research Note",
    topics: ["research", "responsible-ai"],
    date: "2026-07-29",
    readMinutes: 9,
    excerpt:
      "More modalities and more complex fusion do not automatically mean better evidence. Five questions that expose whether a multimodal result is genuinely convincing.",
    hero: {
      src: "/assets/images/insights/05-multimodal-fusion-evidence-audit.jpg",
      alt: "Multiple sensor inputs feeding a central fusion model, with missing-data and corruption warnings, attribution audit and statistical validation outputs",
      width: 1672,
      height: 941,
    },
    tags: ["Multimodal AI", "Sensor Fusion", "Model Evaluation", "Research"],
    seo: {
      title:
        "When Fusion Looks Better Than It Is: Five Questions to Ask Before Trusting a Multimodal AI Model",
      description:
        "Benchmark saturation, missing-modality robustness, silent sensor corruption, explanation faithfulness and statistical rigour — five tests a multimodal AI result should survive.",
    },
    intro: [
      { type: "lead", text: "Multimodal AI has an intuitive promise." },
      {
        type: "flow",
        layout: "row",
        steps: [
          "More sensors",
          "More signals",
          "More sophisticated fusion",
          "Better intelligence",
        ],
        caption: "The intuition — persuasive, and sometimes correct.",
      },
      { type: "p", text: "Sometimes that is exactly what happens." },
      {
        type: "p",
        text: "But a higher benchmark score does not, by itself, demonstrate that the fusion mechanism is responsible for the gain, that it is robust, or that it is useful outside the evaluation. Extra modalities bring extra parameters, extra tuning and extra opportunities for a number to move for reasons unrelated to the idea being tested.",
      },
      {
        type: "p",
        text: "Before trusting a multimodal result — including our own — these are the questions we think it should survive.",
      },
    ],
    sections: [
      {
        id: "is-the-benchmark-too-easy",
        number: "01",
        kicker: "Question 1",
        title: "Is the benchmark already too easy?",
        blocks: [
          {
            type: "p",
            text: "Some benchmarks are effectively solved. When a classical, well-tuned baseline already sits close to ceiling, the remaining headroom is too small to distinguish an architectural contribution from ordinary tuning variance.",
          },
          {
            type: "compare",
            columns: [
              {
                label: "Saturated",
                title: "Little to learn",
                tone: "violet",
                points: [
                  "A simple baseline is already near-perfect",
                  "Remaining headroom sits inside run-to-run noise",
                  "A small gain establishes almost nothing about the architecture",
                ],
              },
              {
                label: "Informative",
                title: "Room to discriminate",
                tone: "cyan",
                points: [
                  "Baselines leave substantial headroom",
                  "Improvements exceed seed variance",
                  "The task exercises the mechanism being claimed",
                ],
              },
            ],
          },
          {
            type: "p",
            text: "This is the strongest argument for reporting simple baselines prominently rather than burying them. A well-implemented classical method is not an embarrassment in a results table — it is the reference that gives every other row its meaning.",
          },
        ],
      },
      {
        id: "what-happens-when-a-modality-disappears",
        number: "02",
        kicker: "Question 2",
        title: "What happens when one modality disappears?",
        blocks: [
          {
            type: "p",
            text: "Full-input evaluation describes the best case. Deployments rarely operate in the best case: a camera is obstructed, a wearable is not worn, a stream drops.",
          },
          {
            type: "p",
            text: "A multimodal claim should therefore be evaluated under systematic input removal, not only with everything present:",
          },
          {
            type: "list",
            items: [
              "RGB + Audio + Pose + Trajectory — the complete set",
              "RGB + Audio + Pose",
              "RGB + Pose",
              "Audio + Pose",
              "Pose only",
              "…and every other subset the deployment could realistically encounter",
            ],
          },
          {
            type: "p",
            text: "What that reveals is whether the model has learned to combine evidence or merely to depend on it. A system that collapses when one stream is absent has not fused those modalities so much as chained them.",
          },
          {
            type: "quote",
            text: "Robustness to missing inputs is not an edge case. In deployment, it is most of the cases.",
          },
        ],
      },
      {
        id: "missing-or-silently-corrupted",
        number: "03",
        kicker: "Question 3",
        title: "Is the modality missing — or silently corrupted?",
        blocks: [
          {
            type: "p",
            text: "These are routinely conflated, and they are not the same technical problem at all.",
          },
          {
            type: "compare",
            columns: [
              {
                label: "Known missing",
                title: "Absence the system can see",
                tone: "cyan",
                points: [
                  "The sensor is unavailable",
                  "The system knows the stream is absent",
                  "A mask or availability signal is present",
                  "The model can route around the gap",
                ],
              },
              {
                label: "Silent corruption",
                title: "Presence the system trusts",
                tone: "violet",
                points: [
                  "The sensor reports as available",
                  "The evidence it supplies is damaged",
                  "Nothing marks the stream as unreliable",
                  "The model may weight it as if it were sound",
                ],
              },
            ],
          },
          {
            type: "p",
            text: "Known absence is a routing problem: the architecture needs a defined behaviour for an input that is not there. Silent corruption is a detection problem: nothing in the input announces itself as wrong, so the system must estimate the reliability of evidence it has already accepted.",
          },
          {
            type: "callout",
            tone: "violet",
            title: "Why the distinction is not academic",
            text: "A model evaluated only under clean removal can appear robust while remaining fully exposed to degraded-but-present inputs — which, in real deployments, are considerably more common than clean absence. It is the same concern that makes signal-quality scoring a first-class stage in a movement pipeline rather than an afterthought.",
          },
        ],
      },
      {
        id: "does-the-explanation-reflect-the-model",
        number: "04",
        kicker: "Question 4",
        title: "Does the explanation reflect the actual model?",
        blocks: [
          {
            type: "p",
            text: "Attribution methods produce explanations that are easy to read and easy to believe. Plausibility, however, is not faithfulness. An explanation can look entirely sensible to a domain expert while bearing little relationship to what the model actually computed.",
          },
          { type: "p", text: "Useful interrogations of an attribution claim:" },
          {
            type: "list",
            items: [
              "**Does the explanation change when the modality set changes?** An attribution indifferent to its inputs is describing something other than this model.",
              "**Is the ranking stable?** Across seeds, across runs, across comparable configurations.",
              "**Does it depend on learned behaviour?** Or would an untrained network produce a similar-looking map?",
              "**Does it survive sanity checks?** Parameter-randomization and data-randomization tests exist precisely for this.",
            ],
          },
          { type: "quote", text: "A plausible explanation is not necessarily a faithful one." },
        ],
      },
      {
        id: "statistically-and-operationally-meaningful",
        number: "05",
        kicker: "Question 5",
        title: "Is the improvement statistically AND operationally meaningful?",
        blocks: [
          {
            type: "p",
            text: "The last question is the least glamorous and the most frequently skipped. A single-run improvement on a single split is a starting point for an investigation, not a result.",
          },
          {
            type: "list",
            tone: "violet",
            items: [
              "Does the gain hold **across random seeds**?",
              "Does it hold **against simple, well-tuned baselines**?",
              "Does it hold **under matched compute** and comparable parameter budgets?",
              "Does it hold **under missing inputs**?",
              "Does it hold **under corrupted inputs**?",
              "Is it computed over the **correct independent evaluation unit** — subject or session, rather than individual frames from the same recording?",
              "Is it reported **with confidence intervals**, not as a bare point estimate?",
            ],
          },
          {
            type: "p",
            text: "The evaluation-unit question deserves particular attention in movement research. Frames drawn from one walking sequence are not independent observations; treating them as if they were inflates apparent sample size and shrinks apparent uncertainty, often dramatically.",
          },
        ],
      },
      {
        id: "the-bigger-lesson",
        number: "06",
        title: "The bigger lesson",
        blocks: [
          {
            type: "p",
            text: "None of these questions is hostile to multimodal work. We build multimodal systems; the questions exist because we would rather find the weakness ourselves than ship it.",
          },
          {
            type: "quote",
            text: "The goal is not to make fusion look impressive. The goal is to determine which evidence actually supports the model.",
          },
          {
            type: "p",
            text: "That standard is what the [research programme](/research) is organized around, and what the peer-reviewed record in the [publications library](/publications) is meant to expose to scrutiny.",
          },
        ],
      },
    ],
    closing: [
      { type: "p", text: "The question is not whether fusion can produce a better number." },
      {
        type: "quote",
        text: "The question is whether the evidence justifies believing the number.",
      },
    ],
    cta: { label: "Explore GaitAI Research", href: "/research" },
    related: [
      "from-walking-video-to-movement-intelligence",
      "movement-intelligence-without-identification",
    ],
  },
];

/** Newest first — the landing page features `[0]`. */
export const insightsByDate = [...insightArticles].sort(
  (a, b) => Date.parse(b.date) - Date.parse(a.date),
);

export function getInsightBySlug(slug: string): InsightArticle | undefined {
  return insightArticles.find((article) => article.slug === slug);
}

/** Routes carry a trailing slash — `trailingSlash: true` in next.config.mjs. */
export function insightHref(slug: string): string {
  return `/insights/${slug}/`;
}

export function formatInsightDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
