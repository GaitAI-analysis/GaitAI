// ============================================================================
// MOBILITY TIME MACHINE — FIVE SESSIONS, ALL OF THEM INVENTED
// ----------------------------------------------------------------------------
// One module's output is a snapshot. The thing MobilityCare is actually built
// around is the comparison BETWEEN snapshots, and no static page shows that: a
// reader sees one report and has to take on trust that repeated capture tells
// a different story. This file is five illustrative sessions so they can scrub
// through it and watch the story assemble.
//
// EVERY NUMBER HERE IS INVENTED, on the same terms as sample-outputs.ts:
//
//   · values are round (88, not 87.6), so they read as illustration
//   · there is no composite "mobility score". A single trending number is
//     exactly what looks like a clinical instrument, and none is published.
//     The trajectory is DERIVED from the three signals at render time and
//     stated in words, so a reader can see what it is made of
//   · no thresholds, no categories, no normal ranges, no diagnosis. A signal
//     is only ever described relative to this person's own first capture —
//     "more even than at baseline", never "closer to normal" — because no
//     normal range is published and implying one would be the fake clinical
//     claim this whole instrument is designed not to make
//   · time is measured in weeks FROM BASELINE, not in dates, because a
//     calendar would imply a real record
//
// AND THE TRACK IS NOT A CLEAN LINE. Symmetry stalls at session 04 while
// cadence keeps climbing. That is the point of the instrument rather than a
// flaw in the example: it is what a longitudinal record is FOR, and five
// monotonically improving bars would teach the opposite lesson while looking
// more impressive. The stall is called out in that session's note.
//
// The signal NAMES are not invented — symmetry, cadence and movement
// variability are documented outputs of the modules named at the bottom.
// ============================================================================

import { productById } from "@/data/products";

/** Which way a signal has to move for the change to read as an improvement. */
export type TrendDirection = "up" | "down";

export interface TimeMachineSignal {
  id: string;
  label: string;
  unit: string;
  /** What it measures. Plain language, no diagnostic framing. */
  hint: string;
  /** The direction that reads as "improving" for this signal. */
  better: TrendDirection;
  /**
   * How to describe movement in each direction, in this signal's own terms.
   *
   * These exist so the instrument never says "toward the baseline range",
   * which sounds like a return to a published normal range and there is no
   * such range here. The baseline is only this person's first capture, so the
   * honest phrasing is comparative — "more even than at baseline" — and it has
   * to be specific to the signal, because "higher" means better for cadence
   * and worse for variability.
   */
  towardWord: string;
  awayWord: string;
  /** Axis bounds, so the five stops share one scale and the track is honest. */
  floor: number;
  ceiling: number;
}

export const timeMachineSignals: TimeMachineSignal[] = [
  {
    id: "symmetry",
    label: "Symmetry",
    unit: "%",
    hint: "Left/right agreement on step timing. Higher is more even.",
    better: "up",
    towardWord: "more even",
    awayWord: "less even",
    floor: 70,
    ceiling: 100,
  },
  {
    id: "cadence",
    label: "Cadence",
    unit: "steps/min",
    hint: "Steps per minute at a self-selected pace.",
    better: "up",
    towardWord: "faster",
    awayWord: "slower",
    floor: 80,
    ceiling: 120,
  },
  {
    id: "variability",
    label: "Movement variability",
    unit: "%",
    hint: "How much step-to-step timing changes within one walk. Lower is steadier.",
    better: "down",
    towardWord: "steadier",
    awayWord: "less steady",
    floor: 0,
    ceiling: 20,
  },
];

export interface TimeMachineSession {
  id: string;
  /** "Baseline", "Session 02", … — the scrubber's stops. */
  label: string;
  /** Weeks after baseline. Relative on purpose: no invented dates. */
  week: number;
  /** One reading per signal id. */
  values: Record<string, number>;
  /**
   * What changed, in trend language. Never a conclusion about the person, a
   * recovery verdict or a recommendation — those belong to a clinician, and
   * this is a demonstration.
   */
  note: string;
}

export const timeMachineSessions: TimeMachineSession[] = [
  {
    id: "baseline",
    label: "Baseline",
    week: 0,
    values: { symmetry: 82, cadence: 96, variability: 14 },
    note: "The first capture. On its own it establishes a reference and says nothing about direction — there is nothing yet to compare it with.",
  },
  {
    id: "session-02",
    label: "Session 02",
    week: 2,
    values: { symmetry: 85, cadence: 101, variability: 12 },
    note: "All three signals have moved away from the baseline reading in the same direction. Two weeks is one interval, so this is the first hint of a trend rather than a trend.",
  },
  {
    id: "session-03",
    label: "Session 03",
    week: 4,
    values: { symmetry: 88, cadence: 106, variability: 10 },
    note: "A second interval in the same direction. A consistent capture protocol is what makes these comparable — a different camera distance would move these numbers on its own.",
  },
  {
    id: "session-04",
    label: "Session 04",
    week: 7,
    values: { symmetry: 88, cadence: 109, variability: 10 },
    note: "Cadence keeps rising while symmetry and variability hold flat. A single-session report cannot show this, and one composite figure would average it away — which is why the signals are read apart.",
  },
  {
    id: "session-05",
    label: "Session 05",
    week: 10,
    values: { symmetry: 91, cadence: 112, variability: 8 },
    note: "Symmetry resumes moving after the flat interval. Which of the two intervals matters more is a clinical question, and not one this demonstration answers.",
  },
];

/** The boundary this instrument always carries. */
export const TIME_MACHINE_BOUNDARY =
  "Five illustrative sessions with invented readings, shown to demonstrate what a longitudinal record looks like. No assessment, study or patient record is involved, and nothing here is a clinical measure.";

export const TIME_MACHINE_TITLE = "Mobility Time Machine";
export const TIME_MACHINE_STRAP = "One walk is a snapshot. Five is a trajectory.";

// ── Derived readings ────────────────────────────────────────────────────────
// Everything below is computed from the table above. Nothing is stored twice,
// so a figure on screen cannot disagree with the session it came from.

/** Change from the baseline reading, for one signal at one session. */
export const deltaFromBaseline = (
  session: TimeMachineSession,
  signal: TimeMachineSignal,
) => session.values[signal.id] - timeMachineSessions[0].values[signal.id];

/** Which way this signal has moved since baseline: toward, away, or flat. */
export type SignalMovement = "toward" | "away" | "flat";

export const movementSinceBaseline = (
  session: TimeMachineSession,
  signal: TimeMachineSignal,
): SignalMovement => {
  const delta = deltaFromBaseline(session, signal);
  if (delta === 0) return "flat";
  const improving = signal.better === "up" ? delta > 0 : delta < 0;
  return improving ? "toward" : "away";
};

/**
 * That movement as a phrase, in the signal's own terms — "6 points more even
 * than at baseline", never "6 points closer to normal". Returned as parts so
 * the caller decides the typography.
 */
export const movementPhrase = (
  session: TimeMachineSession,
  signal: TimeMachineSignal,
) => {
  const delta = deltaFromBaseline(session, signal);
  const movement = movementSinceBaseline(session, signal);
  if (movement === "flat") {
    return { movement, text: "Unchanged since baseline" };
  }
  const word = movement === "toward" ? signal.towardWord : signal.awayWord;
  const magnitude = Math.abs(delta);
  const unit = signal.unit === "%" ? "points" : signal.unit;
  return {
    movement,
    text: `${magnitude} ${unit} ${word} than at baseline`,
  };
};

/** Signed change since the previous session, or undefined at baseline. */
export const deltaFromPrevious = (index: number, signal: TimeMachineSignal) => {
  if (index <= 0) return undefined;
  return (
    timeMachineSessions[index].values[signal.id] -
    timeMachineSessions[index - 1].values[signal.id]
  );
};

/**
 * MOBILITY TRAJECTORY, in words.
 *
 * The brief asked for a trajectory reading, and this is deliberately not a
 * number: one figure that climbs over five sessions is indistinguishable from
 * a clinical score, and GaitAI publishes none. So the trajectory is a count of
 * how many of the three signals have moved toward this person's own baseline
 * range, phrased as a direction, with the count kept visible so a reader can
 * see exactly what it is made of.
 */
export const mobilityTrajectory = (index: number) => {
  const total = timeMachineSignals.length;
  if (index <= 0) {
    return {
      headline: "No trajectory yet",
      detail: "A trajectory needs at least two comparable captures.",
      toward: 0,
      away: 0,
      flat: 0,
      total,
    };
  }
  const session = timeMachineSessions[index];
  const states = timeMachineSignals.map((signal) =>
    movementSinceBaseline(session, signal),
  );
  const toward = states.filter((state) => state === "toward").length;
  const away = states.filter((state) => state === "away").length;
  const flat = states.filter((state) => state === "flat").length;

  const headline =
    away > 0
      ? "Signals moving in different directions"
      : toward === total
        ? "All signals moving the same way"
        : "Some signals moving, some holding";

  const detail =
    away > 0
      ? `${toward} of ${total} signals have moved in the expected direction since baseline and ${away} in the opposite one.`
      : toward === total
        ? `All ${total} signals have moved in the same direction since the first capture.`
        : `${toward} of ${total} signals have moved since baseline; ${flat} ${
            flat === 1 ? "is" : "are"
          } unchanged.`;

  return { headline, detail, toward, away, flat, total };
};

// ── What reads this, and what each one is for ───────────────────────────────
// Module ids, so labels and links come from the product records rather than
// being retyped here. Each line states that module's documented role in a
// repeated-capture workflow — no capability is claimed that its own record
// does not already state.

export interface TimeMachineRole {
  productId: string;
  role: string;
}

export const timeMachineRoles: TimeMachineRole[] = [
  {
    productId: "walkscan",
    role: "Captures each session — one walking video becomes one set of readings.",
  },
  {
    productId: "rehabtrack",
    role: "Aligns repeated sessions into a single record and computes the change between them.",
  },
  {
    productId: "fallrisk",
    role: "Reads the trend against the person's own baseline rather than against a population.",
  },
  {
    productId: "watchcare",
    role: "Fills the weeks between sessions with wearable-derived activity, where a camera is not present.",
  },
];

/** Resolved for rendering — drops any module id that no longer exists. */
export const timeMachineModules = timeMachineRoles.flatMap((entry) => {
  const product = productById(entry.productId);
  return product ? [{ ...entry, product }] : [];
});
