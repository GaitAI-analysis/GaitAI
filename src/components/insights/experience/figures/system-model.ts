/**
 * The system-chain model shared by the article hero, the hub card and the
 * social card: six links between a camera and the person who acts, what
 * each one's failure does to the outcome, and what the model experiences
 * while it happens (usually nothing).
 *
 * CONCEPTUAL. Kinds of failure and their consequences as states — never a
 * rate, an uptime or a latency figure.
 */

export type ChainComponent = "camera" | "inference" | "network" | "alert" | "interface" | "operator";
export const CHAIN: ChainComponent[] = ["camera", "inference", "network", "alert", "interface", "operator"];

export const COMPONENT_LABEL: Record<ChainComponent, string> = {
  camera: "Camera",
  inference: "Inference",
  network: "Network",
  alert: "Alert",
  interface: "Interface",
  operator: "Operator",
};

export const FAILURE: Record<ChainComponent, { name: string; how: string; modelSees: string }> = {
  camera: {
    name: "Frozen feed",
    how: "The camera keeps sending the same frame, or none.",
    modelSees: "A perfectly stationary person — inferred correctly from a frozen frame.",
  },
  inference: {
    name: "Saturated queue",
    how: "Frames arrive faster than the device can process them.",
    modelSees: "Every result it produces is correct; it produces them late, and skips some.",
  },
  network: {
    name: "Partition",
    how: "Results leave the device and never reach the server.",
    modelSees: "Nothing. Its outputs are correct and go nowhere.",
  },
  alert: {
    name: "Swallowed or doubled",
    how: "A deduplication rule eats a real event, or a retry sends it twice.",
    modelSees: "Nothing. The event it flagged is stuck in a queue.",
  },
  interface: {
    name: "Buried",
    how: "The alert lands below the fold of a list nobody scrolls, in a colour that means nothing.",
    modelSees: "Nothing. The alert arrived; no one is looking at it.",
  },
  operator: {
    name: "Alarm fatigue",
    how: "The tenth alert of the shift is dismissed without being read.",
    modelSees: "Nothing. It was right about the tenth.",
  },
};

export type Outcome =
  | "in-time"
  | "silent"
  | "late"
  | "never-arrives"
  | "doubled-or-swallowed"
  | "buried"
  | "dismissed";

export const OUTCOME_LABEL: Record<Outcome, string> = {
  "in-time": "Alert in time, seen, acted on",
  silent: "Silence — an absence mistaken for calm",
  late: "Alert arrives after the window",
  "never-arrives": "Alert never arrives",
  "doubled-or-swallowed": "Alert arrives twice, or not at all",
  buried: "Alert arrives and is not seen",
  dismissed: "Alert seen and dismissed unread",
};

const OUTCOME_FOR: Record<ChainComponent, Outcome> = {
  camera: "silent",
  inference: "late",
  network: "never-arrives",
  alert: "doubled-or-swallowed",
  interface: "buried",
  operator: "dismissed",
};

/** The upstream-most failure decides what reaches the person. */
export function outcomeFor(failed: ReadonlySet<ChainComponent>): { outcome: Outcome; at: ChainComponent | null } {
  for (const component of CHAIN) {
    if (failed.has(component)) return { outcome: OUTCOME_FOR[component], at: component };
  }
  return { outcome: "in-time", at: null };
}

export const isChainComponent = (value: unknown): value is ChainComponent =>
  typeof value === "string" && (CHAIN as string[]).includes(value);
