import type { InsightArticle } from "../insights";

/**
 * ENGINEERING GAITAI · 02 — A Good Model Can Still Be a Bad System
 *
 * Thesis: model quality is one component of system reliability. Between a
 * camera and the person who acts on an alert there are half a dozen stages
 * that can fail — and most of them fail without the model noticing. No
 * uptime, latency or accuracy figure is stated anywhere; the failures are
 * described as kinds, and the hero labels itself illustrative.
 */
export const aGoodModelCanStillBeABadSystem: InsightArticle = {
  slug: "a-good-model-can-still-be-a-bad-system",
  title: "A Good Model Can Still Be a Bad System",
  titleAccent: "Bad System",
  subtitle: "Everything between the camera and the person who acts",
  deck:
    "A movement model can be right on every frame and the system built around it can still fail the person it was meant to help. Cameras drop frames, inference queues fill, networks stall, alerts arrive late or twice, dashboards hide the one that matters, and a tired operator dismisses the tenth false alarm of the shift. Model quality is one link in that chain. This is about the others.",
  postType: "engineering",
  category: "Engineering GaitAI",
  topics: ["engineering", "movement-intelligence"],
  date: "2026-10-07",
  excerpt:
    "A model can be right on every frame while the system around it fails: dropped frames, stalled inference, a network that swallows an alert, an interface that hides it, a person who has stopped trusting it. Model quality is one link in the chain.",
  question: "If the model is right, why did the alert never arrive?",
  ctaLabel: "Break the chain",
  hooks: [
    "The six places a movement system fails that have nothing to do with the model",
    "Why a late alert and a false alert are different engineering problems",
    "What reliability means when the last component is a person",
  ],
  openingHook:
    "Before you scroll: a chain from camera to operator that you can break at any link — and a model that stays right the whole time.",
  twoMinute: [
    "A deployed movement system is a chain: capture, inference, transport, alerting, interface, human review. The model is one link.",
    "Each link fails in its own way — a frozen camera, a saturated inference queue, a network partition, an alert that arrives twice or never, a dashboard that buries it, an operator who has learned to ignore it.",
    "Most of these failures are invisible to the model. It keeps producing correct outputs for the frames it receives; the frames, or the outputs, simply stop going anywhere useful.",
    "Late is a failure mode of its own. A correct alert that arrives after the moment it was for has the cost of a missed one and the cost of a false one.",
    "Reliability has to be designed end to end: heartbeats, known-unknown states, idempotent alerts, honest interfaces, and a human workload the system does not exhaust.",
    "The measure of a system is not the model's score. It is whether the right person saw the right thing in time — and knew when they could not.",
  ],
  series: "Engineering GaitAI",
  seriesStep: 2,
  seriesOrder: 2,
  seriesTitle: "The chain around the model",
  evidenceLevel: "conceptual",
  relatedSignals: ["cap-edge", "out-realtime", "cap-explain"],
  memorableInteraction:
    "Break the camera, the network, the alert or the operator one at a time and watch the model stay right while the system fails.",
  hero: {
    src: "/assets/images/insights/social/a-good-model-can-still-be-a-bad-system.png",
    alt: "GaitAI Insights social card: a chain from camera to model to network to alert to operator, with the network link broken while the model stays green",
    width: 1200,
    height: 630,
  },
  cover: {
    concept: "system-chain",
    alt: "A chain of components from camera to operator, with one link broken while the model's link stays sound.",
  },
  tags: ["Reliability", "Deployment", "Systems Engineering", "Engineering GaitAI"],
  seo: {
    title: "A Good Model Can Still Be a Bad System: Reliability Beyond the Model",
    description:
      "Between a camera and the person who acts on an alert are six stages that can fail without the model noticing. How capture, inference, transport, alerting, interface and human review each break, and what end-to-end reliability requires.",
  },
  intro: [
    {
      type: "lead",
      text: "Most of the writing about movement AI, including a good deal of this journal, is about the model: what it sees, where it fails, what it should and should not claim. That is right, and it is not enough. A model does not help anyone. A system does — and the system is everything between the lens and the person who decides what to do.",
    },
    {
      type: "p",
      text: "This story follows that chain link by link. It is not a catalogue of things that go wrong for its own sake; it is an argument that reliability is a property of the whole, that most of the whole is not the model, and that a system has to be honest about its own state in exactly the way the earlier stories asked a model to be honest about its measurements.",
    },
    {
      type: "note",
      text: "The hero figure is a conceptual demonstration. It shows kinds of failure and their consequences as states, not as rates; no uptime, latency or accuracy figure appears anywhere in this article, and none should be inferred.",
    },
  ],
  sections: [
    {
      id: "the-chain",
      number: "01",
      navLabel: "The chain",
      title: "The chain",
      blocks: [
        {
          type: "flow",
          layout: "row",
          steps: ["Camera", "Inference", "Network", "Alert", "Interface", "Operator"],
          caption: "Six links between a movement and a decision. The model lives inside the second.",
        },
        {
          type: "p",
          text: "Every deployed movement system has some version of this chain. A camera or sensor captures; a model, on a device or a server, infers; a network carries the result; an alerting layer decides what is worth someone's attention; an interface shows it; a person reads it and acts, or does not. The names vary, the order sometimes does, but the shape is constant.",
        },
        {
          type: "p",
          text: "The model's quality — everything the first Foundation and the AI Under Stress stories are about — decides how good the second link is. It says nothing about the other five. A system is only as reliable as the weakest of the six, and the weakest is rarely the one with the research literature behind it.",
        },
      ],
    },
    {
      id: "how-each-link-fails",
      number: "02",
      navLabel: "Failures",
      title: "How each link fails, and what the model sees",
      blocks: [
        {
          type: "p",
          text: "The hero figure lets you break each link in turn. The right-hand column is the important one: what the model experiences while the system fails around it. In most cases, nothing.",
        },
        {
          type: "states",
          caption: "A failure per link, and the model's view of it. Conceptual — kinds of failure, not frequencies.",
          items: [
            { label: "01", name: "Camera", note: "A frozen frame, a smeared lens, a lost feed. The model receives fewer frames, or the same frame, and infers on what arrives." },
            { label: "02", name: "Inference", note: "A saturated queue, a throttled device, a stale model. Results arrive late or are skipped; the ones that arrive are correct." },
            { label: "03", name: "Network", note: "A partition, a retry storm, a buffer that fills and drops. Correct results leave the device and never arrive." },
            { label: "04", name: "Alert", note: "A threshold that fires twice, a deduplication that swallows a real event, a message queued behind a backlog." },
            { label: "05", name: "Interface", note: "The right alert on the wrong screen, in a colour that means nothing, below the fold of a list nobody scrolls." },
            { label: "06", name: "Operator", note: "The tenth alert of a shift dismissed without being read, because the first nine were wrong. The model was right about the tenth." },
          ],
        },
        {
          type: "quote",
          text: "In five of the six failures, the model's outputs were correct. In all six, the person who needed them did not get them in time.",
        },
      ],
    },
    {
      id: "late-is-its-own-failure",
      number: "03",
      navLabel: "Latency",
      title: "Late is its own failure",
      blocks: [
        {
          type: "p",
          text: "Model evaluation asks whether an output is right. Systems have a second axis: when. A movement event — a fall, a stop, a change in gait that a clinician wanted to know about — has a window in which knowing about it is useful. An alert that arrives after the window is not a late success. It is a miss that also costs someone's attention.",
        },
        {
          type: "compare",
          caption: "Two alerts, one correct model.",
          columns: [
            {
              label: "In time",
              title: "The alert does its job",
              tone: "cyan",
              points: ["Arrives inside the window it was for", "Costs one look", "Builds trust when it is right"],
            },
            {
              label: "Late",
              title: "The alert costs twice",
              tone: "violet",
              points: ["The event has already resolved, well or badly", "Costs a look and a dismissal", "Teaches the operator that alerts arrive after the fact"],
            },
          ],
        },
        {
          type: "p",
          text: "Latency accumulates along the chain: capture, inference, transport, queueing, rendering, noticing. Each stage adds a little; several add a lot under load, which is exactly when the events being watched for are most likely. A system that reports its own end-to-end delay, and knows when it has exceeded the window, is doing something the model cannot do for it.",
        },
      ],
    },
    {
      id: "known-unknowns",
      number: "04",
      navLabel: "Known unknowns",
      title: "The system has to know when it does not know",
      blocks: [
        {
          type: "p",
          text: "The fifth Foundation drew a line between a missing input and a silently corrupted one: the first is a routing problem the system can see, the second a detection problem it may not. The same line runs through the whole chain. A camera that reports \"no frames for thirty seconds\" is a known unknown. A camera that keeps sending the same frozen frame is a silent one — and the model will infer a perfectly stationary person from it, correctly.",
        },
        {
          type: "list",
          tone: "violet",
          items: [
            "**Heartbeats, not silence.** Every link should say \"I am here and this is my state\" on a schedule, so that silence means failure rather than calm.",
            "**Staleness is a state.** A result older than its window should be shown as stale, not as current. Age is data.",
            "**Duplicates are failures too.** An alert delivered twice is not twice as safe; it is a sign the transport does not know what it delivered, and it costs attention.",
            "**Degraded is a mode.** A system that has lost a camera should say so and keep running on what remains, rather than either stopping or pretending.",
          ],
        },
        {
          type: "matters",
          text: "The stories before this one asked the model to withhold a measurement it could not support. This one asks the system to do the same about itself: to surface its own gaps as gaps, so that an absence of alerts is never mistaken for an absence of events.",
        },
      ],
    },
    {
      id: "the-last-link-is-a-person",
      number: "05",
      navLabel: "The person",
      title: "The last link is a person",
      blocks: [
        {
          type: "p",
          text: "Everything upstream exists so that a person can decide something. That person is a component with its own failure modes, and they are not moral failings: attention is finite, trust is earned and lost by experience, and a screen full of alerts that are usually wrong trains anyone to stop reading it. This is the oldest finding in alarm design, and movement AI is not exempt from it.",
        },
        {
          type: "p",
          text: "It follows that the number of alerts a system emits is a reliability decision, not just a sensitivity setting. A model tuned to miss nothing will, through the operator, end up missing a great deal. The **decision support** framing the Foundations insisted on is partly about this: the output is offered to a person to review, so the system has to be designed around what a person can actually review.",
        },
        {
          type: "callout",
          tone: "cyan",
          title: "Design the workload, not just the model",
          text: "How many alerts an hour; how they are ranked; what one look tells the operator; how a dismissal is recorded and learned from; what happens on the night shift. None of these is in the model's evaluation, and all of them decide whether the model's correctness reaches anyone.",
        },
      ],
    },
    {
      id: "what-reliability-means",
      number: "06",
      navLabel: "Reliability",
      title: "What reliability means here",
      blocks: [
        {
          type: "p",
          text: "Reliability for a movement system is not the model's score and not the servers' uptime. It is a chain of properties, each of which has to hold:",
        },
        {
          type: "list",
          tone: "cyan",
          items: [
            "The capture is present and the system knows when it is not.",
            "The inference is current and the system knows when it is stale.",
            "The transport delivers once and the system knows what it delivered.",
            "The alert is in time and the system knows the window.",
            "The interface shows the right thing first.",
            "The person has a workload they can carry, and reasons to trust what they see.",
          ],
        },
        {
          type: "p",
          text: "A good model is the part of this that gets published. A good system is the part that gets deployed. GaitAI's own position is that the second is the product — and that it should be described, tested and reported as a chain, because that is what fails.",
        },
      ],
    },
  ],
  closing: [
    {
      type: "p",
      text: "A model that is right on every frame is necessary and not remotely sufficient. The frames have to arrive, the results have to travel, the alert has to land in time on a screen someone is looking at, and that someone has to have been given reason to believe it. Every one of those is engineering, and every one of them fails quietly.",
    },
    {
      type: "p",
      text: "Engineering GaitAI continues with the hardest version of this chain — the one that has to run in real time, where every link's latency is a link in its own right.",
    },
  ],
  cta: { label: "See how GaitAI deploys", href: "/products" },
  related: ["camera-angle-changes-what-ai-sees", "when-fusion-looks-better-than-it-is"],
};
