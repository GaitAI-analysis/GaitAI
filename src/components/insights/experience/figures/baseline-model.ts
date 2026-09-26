/**
 * The personal-baseline model shared by the article hero, the hub card and the
 * social card: a population distribution of a unitless movement index, one
 * person's repeated observations of the same index over time, and how the
 * same latest reading is judged against each reference.
 *
 * ILLUSTRATIVE. The positions are drawn to make the argument visible — that a
 * reading can sit comfortably inside a population range and clearly outside
 * a person's own — and no value is exposed as a number anywhere.
 */

export type BaselineMode = "population" | "personal";

/** The population: a smooth curve over a unitless axis 0–1, and its reference range. */
export const POPULATION = { centre: 0.48, spread: 0.16, range: [0.28, 0.72] as const };

/** One person's observations, oldest first, as positions on the same axis. The
    early ones sit close together above the population centre; the latest two
    drift down — still well inside the population range. */
export const OBSERVATIONS = [0.63, 0.61, 0.64, 0.62, 0.63, 0.61, 0.55, 0.52] as const;
export const MAX_OBSERVATIONS = OBSERVATIONS.length;

/** The personal band, from the observations shown so far (all but the latest). */
export function personalBand(shown: number): { low: number; high: number } | null {
  const history = OBSERVATIONS.slice(0, Math.max(0, shown - 1));
  if (history.length < 3) return null;
  const low = Math.min(...history);
  const high = Math.max(...history);
  const pad = 0.012;
  return { low: low - pad, high: high + pad };
}

export type Reading = "no-baseline-yet" | "within-population" | "within-own" | "outside-own" | "outside-population";

export const READING_LABEL: Record<Reading, string> = {
  "no-baseline-yet": "Not enough observations for a baseline",
  "within-population": "Within the population range",
  "within-own": "Within this person's own baseline",
  "outside-own": "Outside this person's own baseline",
  "outside-population": "Outside the population range",
};

export function readingFor(mode: BaselineMode, shown: number): Reading {
  const latest = OBSERVATIONS[Math.max(0, Math.min(MAX_OBSERVATIONS, shown) - 1)];
  if (mode === "population") {
    return latest >= POPULATION.range[0] && latest <= POPULATION.range[1] ? "within-population" : "outside-population";
  }
  const band = personalBand(shown);
  if (!band) return "no-baseline-yet";
  return latest >= band.low && latest <= band.high ? "within-own" : "outside-own";
}

/** A bell-shaped curve over the axis, as points for a smooth path. */
export function populationCurve(samples = 40): Array<[number, number]> {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const x = i / samples;
    const z = (x - POPULATION.centre) / POPULATION.spread;
    return [x, Math.exp(-0.5 * z * z)];
  });
}

export const isBaselineMode = (value: unknown): value is BaselineMode => value === "population" || value === "personal";
