/**
 * The gait-symmetry model shared by the article hero, the hub card and the
 * social card: one gait cycle for each leg, as stance and swing, and how a
 * chosen kind of asymmetry reshapes the right side against the left.
 *
 * ILLUSTRATIVE. The proportions are drawn to make an idea visible — that
 * stance, swing and step timing can each be asymmetric on their own — not
 * measured from anyone, and no ratio or index value is exposed as a number.
 */

export type SymmetryParameter = "stance" | "swing" | "timing";
/** −3 … +3: negative favours the left side, positive the right; 0 is symmetric. */
export type SymmetryLevel = -3 | -2 | -1 | 0 | 1 | 2 | 3;

export const SYMMETRY_LEVELS: SymmetryLevel[] = [-3, -2, -1, 0, 1, 2, 3];

export interface CycleSide {
  /** Where this side's heel strike falls in the shared cycle, 0–1. */
  start: number;
  /** Stance share of the side's own cycle, 0–1. */
  stance: number;
}

export interface SymmetryState {
  left: CycleSide;
  right: CycleSide;
  /** The qualitative reading — the only "value" a reader sees. */
  reading: "symmetrical" | "mildly-asymmetrical" | "asymmetrical" | "clearly-asymmetrical";
}

export const READING_LABEL: Record<SymmetryState["reading"], string> = {
  symmetrical: "Symmetrical",
  "mildly-asymmetrical": "Mildly asymmetrical",
  asymmetrical: "Asymmetrical",
  "clearly-asymmetrical": "Clearly asymmetrical",
};

/* A typical walking cycle spends about three fifths of its time in stance;
   the right heel strikes half a cycle after the left. Drawn, not measured. */
const BASE_STANCE = 0.6;
const BASE_OFFSET = 0.5;

export function symmetryState(parameter: SymmetryParameter, level: SymmetryLevel): SymmetryState {
  const magnitude = Math.abs(level);
  const sign = Math.sign(level);
  const left: CycleSide = { start: 0, stance: BASE_STANCE };
  const right: CycleSide = { start: BASE_OFFSET, stance: BASE_STANCE };
  const step = 0.045 * magnitude;
  switch (parameter) {
    case "stance":
      /* One side stands longer: its stance grows and the other's shrinks. */
      right.stance = BASE_STANCE + sign * step;
      left.stance = BASE_STANCE - sign * step;
      break;
    case "swing":
      /* One side swings longer: its stance share shrinks, the other's grows. */
      right.stance = BASE_STANCE - sign * step;
      left.stance = BASE_STANCE + sign * step;
      break;
    case "timing":
      /* Steps are no longer evenly spaced: the right heel strikes early or late. */
      right.start = BASE_OFFSET + sign * 0.035 * magnitude;
      break;
  }
  const reading: SymmetryState["reading"] =
    magnitude === 0 ? "symmetrical" : magnitude === 1 ? "mildly-asymmetrical" : magnitude === 2 ? "asymmetrical" : "clearly-asymmetrical";
  return { left, right, reading };
}

export const PARAMETER_LABEL: Record<SymmetryParameter, string> = {
  stance: "Stance duration",
  swing: "Swing duration",
  timing: "Step timing",
};

export const isSymmetryParameter = (value: unknown): value is SymmetryParameter =>
  value === "stance" || value === "swing" || value === "timing";
export const isSymmetryLevel = (value: unknown): value is SymmetryLevel =>
  typeof value === "number" && Number.isInteger(value) && value >= -3 && value <= 3;
