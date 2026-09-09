"use client";

import { useEffect, useRef, useState } from "react";
import { GAIT_PHASES, type GaitPhase, type Pt } from "@/components/visuals/gait-phases";

/**
 * Walking, for the interactive figures.
 *
 * The five canonical gait events in `gait-phases.ts` are the project's own
 * keyframes. `phaseAt(t)` interpolates between them so a figure can WALK
 * rather than flick through five stills — every joint moves along the line
 * between two real poses, so no frame is invented. `useWalkCycle` advances t
 * only while the figure is active (on screen, tab visible, motion allowed)
 * and hands back a continuous phase.
 */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const lerp3 = (
  a: readonly [Pt, Pt, Pt],
  b: readonly [Pt, Pt, Pt],
  t: number,
): readonly [Pt, Pt, Pt] => [lerpPt(a[0], b[0], t), lerpPt(a[1], b[1], t), lerpPt(a[2], b[2], t)];
const lerp2 = (a: readonly [Pt, Pt], b: readonly [Pt, Pt], t: number): readonly [Pt, Pt] => [
  lerpPt(a[0], b[0], t),
  lerpPt(a[1], b[1], t),
];

/** A pose at continuous cycle position `t` in [0, 1). */
export function phaseAt(t: number): GaitPhase {
  const n = GAIT_PHASES.length;
  const scaled = ((t % 1) + 1) % 1 * n;
  const i = Math.floor(scaled) % n;
  const j = (i + 1) % n;
  const f = scaled - Math.floor(scaled);
  const a = GAIT_PHASES[i];
  const b = GAIT_PHASES[j];
  return {
    id: `${a.id}-${b.id}`,
    lift: lerp(a.lift, b.lift, f),
    nearArm: lerp3(a.nearArm, b.nearArm, f),
    farArm: lerp3(a.farArm, b.farArm, f),
    nearLeg: lerp3(a.nearLeg, b.nearLeg, f),
    farLeg: lerp3(a.farLeg, b.farLeg, f),
    nearFoot: lerp2(a.nearFoot, b.nearFoot, f),
    farFoot: lerp2(a.farFoot, b.farFoot, f),
    contacts: f < 0.5 ? a.contacts : b.contacts,
  };
}

/**
 * Advance a walk cycle while `active`, THEN SETTLE. Returns t in [0, 1).
 *
 * A figure that walks forever is a screensaver. The walker moves for
 * `runMs` after it comes into view and after every `kick` (a stage change,
 * a chosen branch), then finishes its stride and rests at `start` — heel
 * strike, the most legible pose — until the reader touches it again. One
 * stride takes `strideMs`; the default is a comfortable walking pace.
 */
export function useWalkCycle(
  active: boolean,
  strideMs = 1400,
  start = 0.1,
  kick: unknown = null,
  runMs = 4200,
): number {
  const [t, setT] = useState(start);
  const last = useRef<number | null>(null);
  const value = useRef(start);
  const until = useRef(0);
  const [running, setRunning] = useState(false);

  /* Every kick, and every arrival on screen, buys another run. */
  useEffect(() => {
    if (!active) return;
    until.current = performance.now() + runMs;
    setRunning(true);
  }, [active, kick, runMs]);

  useEffect(() => {
    if (!active || !running) {
      last.current = null;
      return;
    }
    let frame = 0;
    const tick = (now: number) => {
      if (last.current !== null) {
        const prev = value.current;
        const next = (prev + (now - last.current) / strideMs) % 1;
        /* Time is up: keep walking until the stride reaches its resting pose,
           then stop there, so the figure never freezes mid-swing. */
        if (now > until.current) {
          const wrapped = next < prev;
          const crossed = wrapped ? start >= prev || start <= next : prev <= start && next >= start;
          if (crossed) {
            value.current = start;
            setT(start);
            setRunning(false);
            return;
          }
        }
        value.current = next;
        setT(next);
      }
      last.current = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, running, start, strideMs]);

  return t;
}

/** A gait-shaped waveform: two rises per stride, one per step. */
export function gaitWave(
  x0: number,
  x1: number,
  y0: number,
  amp: number,
  cycles = 2,
  phase = 0,
  samples = 40,
): Pt[] {
  return Array.from({ length: samples }, (_, i) => {
    const u = i / (samples - 1);
    const s = Math.sin(u * Math.PI * 2 * cycles + phase);
    /* Sharpen the peaks a little so it reads as a step, not a sine. */
    const shaped = Math.sign(s) * Math.pow(Math.abs(s), 0.8);
    return [x0 + u * (x1 - x0), y0 - shaped * amp];
  });
}

/** Deterministic pseudo-noise in [-1, 1] — the same on the server and the client. */
export function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

export const GAIT_EVENT_NAMES = ["Heel strike", "Loading", "Mid-stance", "Toe-off", "Swing"] as const;
