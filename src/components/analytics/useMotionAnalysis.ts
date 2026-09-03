"use client";

import { useCallback, useRef, useState } from "react";

/**
 * REAL motion analysis of a video, in the browser.
 *
 * WHY THIS AND NOT A MODEL CALL
 * This site is a static export: `next.config.mjs` sets `output: "export"`, so
 * there are no API routes and no server to run inference on, and the project
 * has no ML dependency (no TF.js, no MediaPipe, no ONNX). There is therefore
 * no endpoint that could analyse an uploaded clip, and inventing gait numbers
 * to fill the gap is the one thing a demo like this must never do.
 *
 * So this computes what a browser genuinely can, from the frames themselves:
 * frame differencing on a small offscreen canvas. Everything it reports is
 * measured from the reader's own video.
 *
 *   energy     mean absolute luminance change between consecutive samples —
 *              a real temporal movement trace
 *   centroid   the centre of mass of that change — a real body-centre
 *              trajectory, and only ever a coordinate
 *   bounds     the moving region, as a fraction of frame width/height
 *
 * WHAT IT DOES NOT DO, AND MUST NOT CLAIM
 * There is no pose model here. No joints are located, so no joint angle, no
 * left/right symmetry, no per-limb stride timing and nothing clinical can be
 * derived — those need the real pipeline. Cadence is estimated by
 * autocorrelation of the energy trace and is labelled as an estimate
 * everywhere it appears.
 *
 * The file never leaves the device: it is read through `URL.createObjectURL`
 * and drawn to a canvas. Nothing is uploaded, stored or transmitted, which is
 * why the UI is allowed to say so.
 */

/** One sampled instant of the clip. */
export type MotionSample = {
  /** Seconds into the clip. */
  t: number;
  /** Mean absolute luminance change since the previous sample, 0..1. */
  energy: number;
  /** Centre of changed pixels, normalised 0..1 across the frame. */
  cx: number;
  cy: number;
};

export type MotionResult = {
  duration: number;
  width: number;
  height: number;
  /** How many instants were sampled (one fewer difference than samples). */
  sampled: number;
  samples: MotionSample[];
  /** Peak energy across the clip, for scaling the trace. */
  peakEnergy: number;
  /** Mean energy — the headline "is there movement here" number. */
  meanEnergy: number;
  /** True when mean energy clears the noise floor. */
  motionDetected: boolean;
  /** Net centroid drift across the clip, normalised. */
  driftX: number;
  driftY: number;
  /** Dominant direction of travel, or "in place". */
  direction: "left" | "right" | "up" | "down" | "in place";
  /**
   * Estimated dominant period of the energy trace, in seconds, or null when
   * no periodicity clears the confidence floor. Steps per minute is derived
   * from this and is an ESTIMATE — see the note above.
   */
  periodSeconds: number | null;
  /** Local energy maxima: candidate movement events. */
  events: number[];
  /** Direction reversals in the centroid path. */
  reversals: number;
};

export type Stage = {
  id: string;
  label: string;
};

/** The stages this analysis actually performs, in order. */
export const STAGES: Stage[] = [
  { id: "decode", label: "Video decoded in the browser" },
  { id: "sample", label: "Frames sampled" },
  { id: "diff", label: "Motion field computed" },
  { id: "temporal", label: "Temporal signal built" },
  { id: "derive", label: "Movement features derived" },
];

export type Phase = "idle" | "running" | "ready" | "error";

const MAX_SAMPLES = 48;
const CANVAS_W = 160;
/**
 * Below this mean luminance change the clip is treated as having no usable
 * movement, and the UI says so rather than reporting a signal.
 *
 * CALIBRATION IS OUTSTANDING. These are first-principles defaults, not
 * measured ones: a subject crossing part of the frame changes only a small
 * share of pixels and compression softens every edge, so the floor has to sit
 * low — but low enough to catch a real walk without promoting compression
 * noise on a static shot to "movement" is a judgement that needs real footage
 * to settle. It could not be settled here: headless Chromium advances
 * `currentTime` while handing `drawImage` the same decoded frame, so every
 * difference measures zero and no threshold can be told apart from any other.
 * Worth one pass in a real browser against a genuine walking clip.
 */
const NOISE_FLOOR = 0.002;
/** Per-pixel luminance change that counts as motion, 0..255. */
const PIXEL_THRESHOLD = 12;

/**
 * How long playback may fail to ADVANCE before the run is abandoned.
 *
 * This is a stall guard, not a deadline. An earlier version capped total wall
 * time, which punishes a slow-but-working decoder for being slow and says
 * "took too long" about a run that was progressing fine. What actually
 * constitutes stuck is `currentTime` not moving, so that is what is measured.
 */
const STALL_MS = 8000;

/** Minimum gap between samples, so a 60fps rAF does not sample every frame. */
const SAMPLE_GAP = 0.07;

/** Dominant period of a signal, by autocorrelation. Null when unconvincing. */
function dominantPeriod(values: number[], dt: number): number | null {
  const n = values.length;
  if (n < 12) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const centred = values.map((v) => v - mean);
  const denom = centred.reduce((a, b) => a + b * b, 0);
  if (denom <= 0) return null;

  let bestLag = 0;
  let bestScore = 0;
  /* Lags of 2..n/2 samples: shorter than two samples is not a cycle we
     sampled, longer than half the clip is not a repetition we saw twice. */
  for (let lag = 2; lag < Math.floor(n / 2); lag += 1) {
    let sum = 0;
    for (let i = 0; i + lag < n; i += 1) sum += centred[i] * centred[i + lag];
    const score = sum / denom;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  /* A weak peak means "no periodicity we can stand behind", and the UI says
     so rather than printing a number. */
  if (bestLag === 0 || bestScore < 0.2) return null;
  return bestLag * dt;
}

/** Local maxima above a fraction of the peak: candidate movement events. */
function findEvents(samples: MotionSample[], peak: number): number[] {
  const out: number[] = [];
  const floor = peak * 0.45;
  for (let i = 1; i < samples.length - 1; i += 1) {
    const e = samples[i].energy;
    if (e > floor && e >= samples[i - 1].energy && e > samples[i + 1].energy) {
      out.push(samples[i].t);
    }
  }
  return out;
}

export function useMotionAnalysis() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIndex, setStageIndex] = useState(-1);
  /** Fraction of the clip analysed so far — real progress, not a guess. */
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MotionResult | null>(null);
  const abort = useRef(false);

  const reset = useCallback(() => {
    abort.current = true;
    setPhase("idle");
    setStageIndex(-1);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  /**
   * Analyses an already-loaded <video>. The caller owns the element and its
   * object URL, so this never creates or leaks one.
   */
  const analyse = useCallback(async (video: HTMLVideoElement) => {
    abort.current = false;
    setError(null);
    setResult(null);
    setPhase("running");
    setStageIndex(0);
    setProgress(0);

    try {
      const startedAt = Date.now();
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error("no-duration");
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) throw new Error("no-frames");

      const cw = CANVAS_W;
      const ch = Math.max(2, Math.round((vh / vw) * CANVAS_W));
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("no-canvas");

      setStageIndex(1);

      const samples: MotionSample[] = [];
      let previous: Uint8ClampedArray | null = null;

      /**
       * Sampling happens DURING PLAYBACK, not by seeking.
       *
       * The first version seeked to N timestamps and drew each frame. That is
       * fewer samples for the same coverage, but it depends on the browser
       * firing `seeked` for the file's codec — which is exactly the part that
       * cannot be relied on, and a clip that opens but will not seek left the
       * run stuck until its timeout. Playing the clip once and reading frames
       * as they arrive needs no seeking at all, gives the reader real progress
       * to watch, and ends on an event the element always emits.
       */
      /* A timer, not requestAnimationFrame. This samples on a time grid
         rather than painting, and rAF is throttled or starved outright in a
         background tab — which would silently stop the analysis. */
      await new Promise<void>((resolve, reject) => {
        let timer = 0;
        let lastAt = -1;
        /* Stall detection: the last time playback position actually moved. */
        let lastT = -1;
        let lastAdvance = Date.now();

        const finish = () => {
          window.clearInterval(timer);
          video.removeEventListener("ended", onEnd);
          video.removeEventListener("error", onErr);
          video.pause();
          resolve();
        };
        const onEnd = () => finish();
        const onErr = () => {
          window.clearInterval(timer);
          video.removeEventListener("ended", onEnd);
          video.removeEventListener("error", onErr);
          reject(new Error("load-failed"));
        };

        const tick = () => {
          if (abort.current) return finish();

          const t = video.currentTime;
          if (t > lastT + 0.001) {
            lastT = t;
            lastAdvance = Date.now();
          } else if (Date.now() - lastAdvance > STALL_MS) {
            window.clearInterval(timer);
            video.removeEventListener("ended", onEnd);
            video.removeEventListener("error", onErr);
            video.pause();
            reject(new Error("stalled"));
            return;
          }

          if (t - lastAt >= SAMPLE_GAP && samples.length < MAX_SAMPLES) {
            lastAt = t;
            ctx.drawImage(video, 0, 0, cw, ch);
            const frame = ctx.getImageData(0, 0, cw, ch).data;

            /* Luminance only: colour says nothing about movement here. */
            const luma = new Uint8ClampedArray(cw * ch);
            for (let q = 0, i = 0; i < frame.length; i += 4, q += 1) {
              luma[q] =
                (frame[i] * 299 + frame[i + 1] * 587 + frame[i + 2] * 114) / 1000;
            }

            if (previous) {
              let changed = 0;
              let sumX = 0;
              let sumY = 0;
              let total = 0;
              for (let q = 0; q < luma.length; q += 1) {
                const d = Math.abs(luma[q] - previous[q]);
                total += d;
                if (d > PIXEL_THRESHOLD) {
                  changed += 1;
                  sumX += q % cw;
                  sumY += Math.floor(q / cw);
                }
              }
              samples.push({
                t,
                energy: total / (luma.length * 255),
                cx: changed ? sumX / changed / cw : 0.5,
                cy: changed ? sumY / changed / ch : 0.5,
              });
            }
            previous = luma;

            setProgress(Math.min(1, t / duration));
            if (samples.length > 2) setStageIndex(2);
          }

          if (video.ended || t >= duration - 0.02) finish();
        };

        video.addEventListener("ended", onEnd);
        video.addEventListener("error", onErr);
        video.currentTime = 0;
        video.muted = true;
        void video
          .play()
          .then(() => {
            timer = window.setInterval(tick, 50);
          })
          .catch(() => reject(new Error("play-blocked")));
      });

      if (abort.current) return;
      if (samples.length < 4) throw new Error("too-short");

      setStageIndex(3);

      /* Playback sampling does not land on a fixed grid the way seeking did,
         so the interval the autocorrelation needs is measured from the
         timestamps that actually came back. */
      const meanDt =
        samples.length > 1
          ? (samples[samples.length - 1].t - samples[0].t) / (samples.length - 1)
          : 0;

      const energies = samples.map((s) => s.energy);
      const peakEnergy = Math.max(...energies);
      const meanEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
      const motionDetected = meanEnergy >= NOISE_FLOOR;

      setStageIndex(4);

      /* Direction from the centroid's net drift, but only where there was
         movement to have a centroid at all. */
      const first = samples[0];
      const last = samples[samples.length - 1];
      const driftX = motionDetected ? last.cx - first.cx : 0;
      const driftY = motionDetected ? last.cy - first.cy : 0;
      const absX = Math.abs(driftX);
      const absY = Math.abs(driftY);
      let direction: MotionResult["direction"] = "in place";
      if (motionDetected && Math.max(absX, absY) > 0.08) {
        direction =
          absX >= absY
            ? driftX > 0
              ? "right"
              : "left"
            : driftY > 0
              ? "down"
              : "up";
      }

      /* Reversals in horizontal travel — a path that turns back on itself. */
      let reversals = 0;
      let sign = 0;
      for (let i = 1; i < samples.length; i += 1) {
        const d = samples[i].cx - samples[i - 1].cx;
        if (Math.abs(d) < 0.01) continue;
        const s = d > 0 ? 1 : -1;
        if (sign !== 0 && s !== sign) reversals += 1;
        sign = s;
      }

      setResult({
        duration,
        width: vw,
        height: vh,
        sampled: samples.length,
        samples,
        peakEnergy,
        meanEnergy,
        motionDetected,
        driftX,
        driftY,
        direction,
        periodSeconds: motionDetected ? dominantPeriod(energies, meanDt) : null,
        events: motionDetected ? findEvents(samples, peakEnergy) : [],
        reversals,
      });
      setPhase("ready");
    } catch (e) {
      const code = e instanceof Error ? e.message : "failed";
      setError(code);
      setPhase("error");
    }
  }, []);

  return { phase, stageIndex, progress, error, result, analyse, reset };
}
