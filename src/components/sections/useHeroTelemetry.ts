"use client";

import { useEffect, useRef, useState } from "react";
import {
  HERO_OPTIONS,
  type HeroMetric,
  type HeroOptionId,
} from "@/data/home-hero";

/**
 * THE HERO PANELS' LIVE READINGS — a measurement that keeps measuring.
 * =============================================================================
 * The three panels used to be static text: the same "0.78 m/s" whether you
 * looked for a second or a minute. That reads as a specification sheet, which
 * is the opposite of the claim the hero makes — that GaitAI is watching the
 * people in the picture walk, continuously.
 *
 * So the numbers move. Not as decoration and not at random: each reading is a
 * BOUNDED RANDOM WALK with a pull back towards its resting value, so a figure
 * wanders inside a clinically plausible band and always returns to the number
 * the founder approved rather than drifting off it. Gait speed breathes
 * between 0.74 and 0.86 m/s around 0.78; it never prints 0.31, and it never
 * jumps from one end of its range to the other in one step, because a single
 * tick can only move it by `step`.
 *
 * ── WHY A TIMEOUT CHAIN AND NOT AN INTERVAL ───────────────────────────────
 * Each tick schedules the next one at a fresh 700–1200 ms. A fixed interval
 * has a rhythm, and a rhythm is a thing the eye locks onto and then reads as a
 * loop; an irregular cadence reads as arrival. It also means the whole panel
 * does not update in one synchronised flash — see `phase` below.
 *
 * ── SERVER AND FIRST PAINT ────────────────────────────────────────────────
 * The first value of every reading is its resting value, on the server and on
 * the first client render alike, so the markup matches and hydration is
 * silent. Nothing moves until an effect has run.
 *
 * ── WHEN IT RUNS ──────────────────────────────────────────────────────────
 * Only while something is actually on screen to see: a panel is open, or the
 * one-time introduction is showing all three. A hidden tab stops it, because
 * a tab nobody is looking at should not be waking a timer to animate numbers.
 * `prefers-reduced-motion` never starts it at all — the panels then hold the
 * approved resting values, which are the honest static version of the same
 * information.
 */

/** The slowest and fastest a single reading re-reads itself. */
const TICK_MIN_MS = 700;
const TICK_MAX_MS = 1200;

/** How many samples a sparkline remembers. */
export const SPARK_POINTS = 14;

export interface Reading {
  /** The whole reading, number and unit — the accessible value, and the key
      the number roll is remounted on. */
  readonly text: string;
  /** Just the figure: "0.80", "Stable", "Authorised". */
  readonly figure: string;
  /** The unit, set apart so it can take its own smaller rank. Null when the
      reading is a word rather than a measurement. */
  readonly unit: string | null;
  /** 0–1 along the metric's own scale, for a track. `null` when it has none. */
  readonly fraction: number | null;
  /** Recent samples, oldest first, normalised 0–1. Empty unless `spark`. */
  readonly spark: readonly number[];
  /** True for a value that is a guarantee rather than a measurement. */
  readonly fixed: boolean;
  /** Warm-gold treatment: an active assurance (privacy, authorisation). */
  readonly gold: boolean;
}

type Live = {
  value: number;
  history: number[];
  /** Index into the metric's own state list. */
  state: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* A percent sign sets tight against its figure; every other unit is a word
   and takes a space. "95 %" is a typesetting error, "95 m/s" is not. */
function join(figure: string, unit?: string) {
  if (!unit) return figure;
  return unit === "%" ? `${figure}%` : `${figure} ${unit}`;
}

function seed(metric: HeroMetric): Live {
  if (metric.kind === "reading") {
    return { value: metric.base, history: [metric.base], state: 0 };
  }
  return { value: 0, history: [], state: 0 };
}

/**
 * One step of the walk. The pull term is what keeps this clinical: without it
 * a random walk is free to wander to an edge and sit there, which would print
 * a gait speed of 0.86 m/s for a minute and quietly stop being true.
 */
function step(metric: Extract<HeroMetric, { kind: "reading" }>, live: Live) {
  const pull = (metric.base - live.value) * 0.28 + (metric.trend ?? 0);
  const next = live.value + pull + rand(-metric.step, metric.step);
  live.value = Math.min(metric.max, Math.max(metric.min, next));
  live.history.push(live.value);
  if (live.history.length > SPARK_POINTS) live.history.shift();
}

function read(metric: HeroMetric, live: Live): Reading {
  if (metric.kind === "fixed") {
    return {
      text: metric.value,
      figure: metric.value,
      unit: null,
      fraction: null,
      spark: [],
      fixed: true,
      gold: metric.tone === "gold",
    };
  }
  if (metric.kind === "state") {
    const word = metric.states[live.state] ?? metric.states[0];
    return {
      text: word,
      figure: word,
      unit: null,
      fraction: null,
      spark: [],
      fixed: false,
      gold: metric.tone === "gold",
    };
  }
  const [lo, hi] = metric.scale ?? [metric.min, metric.max];
  const span = hi - lo || 1;
  const figure = live.value.toFixed(metric.decimals);
  return {
    text: join(figure, metric.unit),
    figure,
    unit: metric.unit ?? null,
    fraction: metric.scale ? Math.min(1, Math.max(0, (live.value - lo) / span)) : null,
    spark: metric.spark
      ? live.history.map((v) =>
          Math.min(1, Math.max(0, (v - metric.min) / (metric.max - metric.min || 1))),
        )
      : [],
    fixed: false,
    gold: false,
  };
}

export type TelemetryFrame = Readonly<Record<HeroOptionId, readonly Reading[]>>;

function frame(lives: Map<string, Live>): TelemetryFrame {
  const out = {} as Record<HeroOptionId, readonly Reading[]>;
  for (const option of HERO_OPTIONS) {
    out[option.id] = option.metrics.map((metric, i) =>
      read(metric, lives.get(`${option.id}:${i}`)!),
    );
  }
  return out;
}

function seedAll() {
  const lives = new Map<string, Live>();
  for (const option of HERO_OPTIONS) {
    option.metrics.forEach((metric, i) =>
      lives.set(`${option.id}:${i}`, seed(metric)),
    );
  }
  return lives;
}

/**
 * @param active Whether any panel is on screen. Readings freeze when not.
 */
export function useHeroTelemetry(active: boolean): TelemetryFrame {
  const lives = useRef<Map<string, Live>>();
  if (!lives.current) lives.current = seedAll();

  const [current, setCurrent] = useState<TelemetryFrame>(() => frame(lives.current!));

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    let stopped = false;

    /* Each metric keeps its own clock. One shared tick would move every row in
       the panel on the same frame, which looks like a page refresh; staggered
       clocks look like six instruments reporting independently. */
    const schedule = (key: string, metric: HeroMetric) => {
      if (stopped || metric.kind === "fixed") return;
      timers.push(
        window.setTimeout(() => {
          if (stopped) return;
          const live = lives.current!.get(key)!;
          if (metric.kind === "reading") {
            step(metric, live);
          } else {
            /* States settle back to the calm word far more often than they
               leave it, so "Normal" is the resting reading and "Moderate" is
               an occasional, brief observation. */
            live.state =
              Math.random() < metric.settle
                ? 0
                : Math.floor(rand(0, metric.states.length));
          }
          setCurrent(frame(lives.current!));
          schedule(key, metric);
        }, rand(TICK_MIN_MS, TICK_MAX_MS)),
      );
    };

    const start = () => {
      for (const option of HERO_OPTIONS) {
        option.metrics.forEach((metric, i) =>
          schedule(`${option.id}:${i}`, metric),
        );
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (timers.length === 0) start();
      } else {
        timers.forEach(window.clearTimeout);
        timers.length = 0;
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      timers.forEach(window.clearTimeout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);

  return current;
}
