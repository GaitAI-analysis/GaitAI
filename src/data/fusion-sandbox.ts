// ============================================================================
// FUSION SANDBOX — WHAT A MISSING INPUT COSTS, AND WHAT A CORRUPTED ONE COSTS
// ----------------------------------------------------------------------------
// A fusion diagram with four arrows going into a box teaches nothing, because
// every such diagram in every deck shows all four arrows working. The
// interesting states are the other two, and they are not symmetric:
//
//   A MISSING INPUT IS A KNOWN UNKNOWN. Its channels stop being derivable.
//   Coverage drops, the gap is visible, and a system can say what it can no
//   longer answer.
//
//   A CORRUPTED INPUT IS AN UNKNOWN UNKNOWN. Its channels still arrive. The
//   output still renders, at the same size, with the same confident layout,
//   and nothing about it says it is wrong. That is strictly the more dangerous
//   failure, and it is the one every architecture diagram hides.
//
// Teaching that distinction is the entire purpose of this file.
//
// WHAT IT DOES NOT CONTAIN
//
//   · NO ACCURACY, no benchmark, no "fusion improves X by Y%". None is
//     published, and a sandbox that rewarded the reader with a rising number
//     for switching inputs on would be a fabricated result — and would also
//     teach the opposite of the lesson above, since the corrupted state would
//     then look better than the missing one
//   · NO CLAIM THAT ANY PRODUCT IMPLEMENTS EXACTLY THIS. It is an
//     architectural illustration of how multi-input reading degrades. Which
//     modules read which inputs is documented per module, on the module pages
//   · The channel NAMES are not invented — they are the movement-signal nodes
//     from the GaitScape graph, referenced by id, so a renamed signal cannot
//     leave a stale label behind here
//
// Which inputs contribute which channels IS an editorial mapping, and the one
// thing this file asserts. It is deliberately coarse: a channel is listed
// under an input when that input can carry it at all, not weighted by how
// well, because a weight would be the invented benchmark this file refuses.
// ============================================================================

import { gaitscapeNodes } from "@/data/gaitscape/graph";

/** The three states an input can be in. */
export type InputState = "available" | "missing" | "corrupted";

export const INPUT_STATES: { id: InputState; label: string }[] = [
  { id: "available", label: "Available" },
  { id: "missing", label: "Missing" },
  { id: "corrupted", label: "Corrupted" },
];

export interface FusionInput {
  id: string;
  label: string;
  /** What the reader would actually have. One line. */
  note: string;
  /**
   * What "corrupted" concretely means for THIS input — the specific quiet
   * failure. Generic wording ("bad data") is what lets a reader believe a
   * corrupted input announces itself; these do not announce themselves.
   */
  corruption: string;
  /** Movement-signal node ids from the graph. */
  channels: string[];
}

export const fusionInputs: FusionInput[] = [
  {
    id: "video",
    label: "Video",
    note: "A camera view of the person or the space.",
    corruption:
      "Rolling shutter, a dropped frame rate or heavy compression. Frames still arrive and still decode, so timing derived from them is wrong by an amount nothing reports.",
    channels: [
      "sig-cadence",
      "sig-walking-speed",
      "sig-step-symmetry",
      "sig-posture",
      "sig-balance",
      "sig-crowd-flow",
    ],
  },
  {
    id: "pose",
    label: "Pose",
    note: "Body landmarks, per frame, rather than pixels.",
    corruption:
      "Landmarks swapped left for right, or a limb tracked onto a passer-by. The skeleton is complete and plausible, and a symmetry reading computed from it is confidently wrong.",
    channels: [
      "sig-step-symmetry",
      "sig-posture",
      "sig-balance",
      "sig-stride-variability",
      "sig-cadence",
      "sig-tremor-neuro",
    ],
  },
  {
    id: "wearable",
    label: "Wearable",
    note: "Smartwatch or IMU signals from the person.",
    corruption:
      "A loose strap, or a device worn on the other wrist than the one it is configured for. The series is continuous and well-formed, and its rhythm belongs to a different limb.",
    channels: [
      "sig-cadence",
      "sig-stride-variability",
      "sig-mobility-decline",
      "sig-balance",
    ],
  },
  {
    id: "trajectory",
    label: "Trajectory",
    note: "Where movement goes through the space over time.",
    corruption:
      "Two people's paths joined into one at a crossing. Every path is continuous and none is flagged, and the dwell time now describes nobody.",
    channels: [
      "sig-trajectory",
      "sig-crowd-flow",
      "sig-behaviour",
      "sig-walking-speed",
    ],
  },
];

/** Channel titles, resolved from the graph so a rename cannot strand one. */
const signalTitles = new Map(
  gaitscapeNodes
    .filter((node) => node.type === "signal")
    .map((node) => [node.id, node.title]),
);

export const channelTitle = (id: string) => signalTitles.get(id) ?? id;

/** Every channel any input contributes, in a stable order. */
export const fusionChannels = Array.from(
  new Set(fusionInputs.flatMap((input) => input.channels)),
);

/** Any channel id that no longer exists in the graph — the validator's hook. */
export const unknownFusionChannels = fusionChannels.filter(
  (id) => !signalTitles.has(id),
);

// ── Derived evidence state ──────────────────────────────────────────────────
// All of it computed. There is no stored "result" for any combination of
// input states, so the sandbox cannot show a reading that its own inputs do
// not support.

/**
 * What can be said about one channel, given the current input states.
 *
 * `contaminated` is the case worth the extra state: the channel still has a
 * healthy contributor, so it arrives and looks normal, but a corrupted
 * contributor is being fused into it as well. Nothing about the output marks
 * it. Collapsing this into "available" would remove the lesson; collapsing it
 * into "unavailable" would be false, because a value really is produced.
 */
export type ChannelState =
  | "available"
  | "contaminated"
  | "unverified"
  | "unavailable";

export const channelState = (
  channelId: string,
  states: Record<string, InputState>,
): ChannelState => {
  const contributors = fusionInputs.filter((input) =>
    input.channels.includes(channelId),
  );
  const healthy = contributors.filter(
    (input) => states[input.id] === "available",
  ).length;
  const corrupt = contributors.filter(
    (input) => states[input.id] === "corrupted",
  ).length;

  if (healthy > 0 && corrupt > 0) return "contaminated";
  if (healthy > 0) return "available";
  if (corrupt > 0) return "unverified";
  return "unavailable";
};

export const CHANNEL_STATE_LABEL: Record<ChannelState, string> = {
  available: "Derivable",
  contaminated: "Derived, contaminated",
  unverified: "Derived, unverifiable",
  unavailable: "Not derivable",
};

export const CHANNEL_STATE_NOTE: Record<ChannelState, string> = {
  available: "At least one healthy input carries this.",
  contaminated:
    "A healthy input and a corrupted one are both fused into this. A value is produced and nothing marks it.",
  unverified:
    "Only a corrupted input carries this. A value is produced and there is no basis for trusting it.",
  unavailable: "Every input that carries this is missing. Nothing is produced.",
};

/**
 * The headline for the whole fusion state.
 *
 * The ordering matters and is the argument: ANY corruption outranks any amount
 * of missing data, because missing data is visible in the output and corrupted
 * data is not.
 */
export const fusionVerdict = (states: Record<string, InputState>) => {
  const values = fusionInputs.map((input) => states[input.id]);
  const missing = values.filter((state) => state === "missing").length;
  const corrupted = values.filter((state) => state === "corrupted").length;
  const available = values.filter((state) => state === "available").length;

  const channelStates = fusionChannels.map((id) => channelState(id, states));
  const counts = {
    available: channelStates.filter((s) => s === "available").length,
    contaminated: channelStates.filter((s) => s === "contaminated").length,
    unverified: channelStates.filter((s) => s === "unverified").length,
    unavailable: channelStates.filter((s) => s === "unavailable").length,
  };

  if (available === 0 && corrupted === 0) {
    return {
      tone: "none" as const,
      headline: "Nothing to fuse",
      detail:
        "Every input is missing. No channel is derivable, and that is at least unambiguous — the system can state exactly what it cannot answer.",
      counts,
    };
  }

  if (corrupted > 0) {
    return {
      tone: "corrupted" as const,
      headline: "Output unchanged. Validity unknown.",
      detail:
        `${corrupted} of ${fusionInputs.length} inputs are corrupted. Notice what did NOT happen: no gap opened, no channel disappeared, and the read-out is the same size and shape as it was. A corrupted input is more dangerous than a missing one precisely because nothing about the output tells you it is there.`,
      counts,
    };
  }

  if (missing > 0) {
    return {
      tone: "missing" as const,
      headline: "Reduced coverage, and the gap is visible",
      detail:
        `${missing} of ${fusionInputs.length} inputs are missing. ${
          counts.unavailable === 0
            ? "Every channel is still carried by another input, so coverage holds — which is what fusing more than one source is for."
            : `${counts.unavailable} ${
                counts.unavailable === 1 ? "channel is" : "channels are"
              } no longer derivable.`
        } A missing input is a known unknown: the system can say what it stopped being able to answer.`,
      counts,
    };
  }

  return {
    tone: "complete" as const,
    headline: "All inputs healthy",
    detail:
      "Every channel has at least one healthy contributor. This is the state every fusion diagram shows, and the one that teaches least — switch an input to Missing, then to Corrupted, and compare what happens to the read-out.",
    counts,
  };
};

export const FUSION_TITLE = "Fusion Sandbox";
export const FUSION_STRAP =
  "A missing input is a known unknown. A corrupted one is not.";

export const FUSION_BOUNDARY =
  "An illustrative architecture sandbox. It shows how multi-input reading degrades, not how any specific module is implemented, and it reports no accuracy, benchmark or performance figure — none is published, and a number that improved as you switched inputs on would teach the opposite of the point.";
