"use client";

import { useCallback, useRef, useState } from "react";
import { assetPath } from "@/lib/paths";

/**
 * REAL pose analysis of a video, in the browser.
 *
 * WHAT RUNS, AND WHERE
 * MediaPipe Tasks Vision `PoseLandmarker` (BlazePose, 33 landmarks), pinned at
 * @mediapipe/tasks-vision 1.0.1, running entirely client-side. The model
 * weights (`pose_landmarker_lite`, 5.5 MB) are served from this site's own
 * origin; the WASM runtime is loaded from a pinned CDN on first use. Both are
 * fetched only when a reader actually starts an analysis — nothing about it is
 * in the page's initial bundle.
 *
 * The video itself is never uploaded. It is read through `URL.createObjectURL`
 * and handed to the model frame by frame inside the tab.
 *
 * WHY NOT A SERVER MODEL
 * There is none to call. `next.config.mjs` sets `output: "export"`, so this
 * site has no API routes and no server. Client-side inference is not a
 * fallback here, it is the only honest way to actually analyse a reader's clip.
 *
 * WHAT IS DERIVED, AND WHAT IS NOT
 * Everything reported is computed from the landmarks the model returns, or
 * from frame differencing alongside them:
 *
 *   landmarks        33 points per detected person, per sampled instant
 *   trajectories     each tracked joint's real path over the clip
 *   body centre      hip midpoint, per instant
 *   motion energy    mean luminance change between instants
 *   frame-wide change  share of pixels changing, which separates a moving
 *                    camera from a fixed one
 *   oscillation      dominant period of the hip's vertical movement, by
 *                    autocorrelation — an ESTIMATE, and labelled as one
 *   L/R ankle range  vertical travel of each ankle, compared
 *
 * NOT derived, and therefore never shown: how many people are in frame (see
 * below), cadence, stride length, walking speed, gait symmetry as a score,
 * fall risk, or any clinical measure. Those
 * need calibration, scale and a validated pipeline, none of which exists in a
 * browser tab. A real trajectory is worth more than a fabricated score.
 */

/*
 * ON PEOPLE COUNTING, AND WHY THERE IS NONE
 * `pose_landmarker_lite` returns ONE subject per frame. Asking for four
 * (`numPoses: 4`) changes nothing: on a rendered test image holding three
 * large, clearly separated figures it still returned a single pose, and on
 * real crowd footage it returned one pose in twelve consecutive frames. So
 * this reports no head count, no occupancy and no "several people detected"
 * guidance — the model cannot support any of it, and a count that is always
 * one dressed up as a measurement would be a fabrication.
 */

/* ── BlazePose 33-point topology ──────────────────────────────────────────── */

export const LM = {
  nose: 0,
  lShoulder: 11,
  rShoulder: 12,
  lElbow: 13,
  rElbow: 14,
  lWrist: 15,
  rWrist: 16,
  lHip: 23,
  rHip: 24,
  lKnee: 25,
  rKnee: 26,
  lAnkle: 27,
  rAnkle: 28,
  lHeel: 29,
  rHeel: 30,
  lToe: 31,
  rToe: 32,
} as const;

/** Bones to draw. Torso first, then limbs, so the figure reads as a body. */
export const BONES: ReadonlyArray<readonly [number, number]> = [
  [LM.lShoulder, LM.rShoulder],
  [LM.lShoulder, LM.lHip],
  [LM.rShoulder, LM.rHip],
  [LM.lHip, LM.rHip],
  [LM.lShoulder, LM.lElbow],
  [LM.lElbow, LM.lWrist],
  [LM.rShoulder, LM.rElbow],
  [LM.rElbow, LM.rWrist],
  [LM.lHip, LM.lKnee],
  [LM.lKnee, LM.lAnkle],
  [LM.lAnkle, LM.lToe],
  [LM.rHip, LM.rKnee],
  [LM.rKnee, LM.rAnkle],
  [LM.rAnkle, LM.rToe],
];

/** Joints whose paths are worth tracing. */
export const TRACKED = [
  { key: "lWrist", index: LM.lWrist, label: "Left wrist" },
  { key: "rWrist", index: LM.rWrist, label: "Right wrist" },
  { key: "lKnee", index: LM.lKnee, label: "Left knee" },
  { key: "rKnee", index: LM.rKnee, label: "Right knee" },
  { key: "lAnkle", index: LM.lAnkle, label: "Left ankle" },
  { key: "rAnkle", index: LM.rAnkle, label: "Right ankle" },
] as const;

export type Landmark = { x: number; y: number; z: number; visibility: number };

export type PoseSample = {
  /** Seconds into the clip. */
  t: number;
  /** Landmarks per detected person; empty when none was found. */
  poses: Landmark[][];
  /** Mean absolute luminance change since the previous instant, 0..1. */
  energy: number;
  /** Share of pixels that changed beyond the threshold, 0..1. */
  changed: number;
  /** Centre of changed pixels, normalised — works with or without a person. */
  cx: number;
  cy: number;
};

export type Suitability = "single-person" | "no-person" | "intermittent";

export type PoseResult = {
  duration: number;
  width: number;
  height: number;
  samples: PoseSample[];
  /** Instants where a pose was found. */
  posedSamples: number;
  suitability: Suitability;
  /** Mean share of pixels changing between instants. */
  meanChanged: number;
  /**
   * True when most of the frame changes between instants — which usually means
   * the camera moved rather than the subject. Measured, not guessed: a pan
   * across a still image reads 12.6% and a full-frame animation 7.7%, while
   * three clips shot from a fixed viewpoint read 0.18%, 0.59% and 4.6%.
   */
  frameWideChange: boolean;
  peakEnergy: number;
  meanEnergy: number;
  motionDetected: boolean;
  /** Net travel of the body centre (or motion centroid), normalised. */
  driftX: number;
  driftY: number;
  direction: "left" | "right" | "up" | "down" | "in place";
  /** Dominant period of the hip's vertical movement, seconds. Null if unclear. */
  oscillationSeconds: number | null;
  /** Vertical travel of each ankle, normalised to frame height. */
  ankleRange: { left: number; right: number } | null;
  /** Direction reversals in the horizontal path. */
  reversals: number;
};

export type Stage = { id: string; label: string };

/** The stages this analysis actually performs, in order. */
export const STAGES: Stage[] = [
  { id: "runtime", label: "Pose runtime loaded" },
  { id: "decode", label: "Video decoded in the browser" },
  { id: "pose", label: "Body landmarks detected" },
  { id: "motion", label: "Motion field measured" },
  { id: "temporal", label: "Temporal signals built" },
  { id: "features", label: "Movement features derived" },
];

export type Phase = "idle" | "running" | "ready" | "error";

const RUNTIME_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1";
const MODEL_PATH = "/assets/models/pose_landmarker_lite.task";

const MAX_SAMPLES = 64;
const SAMPLE_GAP = 0.09;
const CANVAS_W = 192;
/**
 * Below this mean luminance change the clip is treated as having no usable
 * movement. Measured, not guessed: the walking sample clip in this repository
 * reads a mean of 0.00397 with a per-pixel threshold of 12/255, so a floor of
 * 0.002 clears real movement while a static shot stays under it. An earlier
 * floor of 0.004 sat just above that clip and reported "no movement" on
 * footage that plainly contains a walking figure.
 */
const NOISE_FLOOR = 0.002;
const PIXEL_THRESHOLD = 12;
/**
 * Above this share of changed pixels, the change is frame-wide rather than
 * local to a subject. Measured across five clips: a pan over a still image
 * 12.6%, a full-frame animation 7.7%, and fixed-viewpoint footage 4.6%, 0.59%
 * and 0.18%.
 */
const FRAME_WIDE = 0.06;
/** Landmarks below this confidence are ignored when deriving features. */
const VIS_FLOOR = 0.5;
/** Playback must advance within this window or the run is abandoned. */
const STALL_MS = 8000;

/* The landmarker is expensive to build, so it is created once per session. */
let landmarkerPromise: Promise<PoseLandmarkerLike> | null = null;

type PoseLandmarkerLike = {
  detectForVideo: (
    video: HTMLVideoElement,
    timestampMs: number,
  ) => { landmarks?: Landmark[][] };
};

async function getLandmarker(): Promise<PoseLandmarkerLike> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      /* Imported at use time, not at module scope: the runtime is several
         hundred kilobytes of JS plus a WASM binary, and a reader who never
         analyses a clip should never download either. */
      const vision = await import(
        /* webpackIgnore: true */ `${RUNTIME_CDN}/vision_bundle.mjs`
      );
      const fileset = await vision.FilesetResolver.forVisionTasks(
        `${RUNTIME_CDN}/wasm`,
      );
      return (await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: assetPath(MODEL_PATH) },
        runningMode: "VIDEO",
        /* One is what this model returns; see the note above. */
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })) as PoseLandmarkerLike;
    })().catch((e) => {
      landmarkerPromise = null;
      throw e;
    });
  }
  return landmarkerPromise;
}

/**
 * Dominant period of a signal, by autocorrelation. Null when unconvincing.
 *
 * The search is bounded to periods a moving human body can plausibly have,
 * 0.3 s to 2 s. Without that bound the strongest correlation is often the
 * shortest lag the sampling allows — which reported a 0.25 s "cycle", i.e.
 * 240 a minute, on footage that had no rhythm in it at all. A bound is
 * honest here in a way a raw argmax is not: outside it, the answer is "no
 * periodicity worth standing behind", which is what the UI then says.
 */
const MIN_PERIOD = 0.3;
const MAX_PERIOD = 2;

function dominantPeriod(values: number[], dt: number): number | null {
  const n = values.length;
  if (n < 12 || dt <= 0) return null;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const centred = values.map((v) => v - mean);
  const denom = centred.reduce((a, b) => a + b * b, 0);
  if (denom <= 0) return null;

  const minLag = Math.max(2, Math.ceil(MIN_PERIOD / dt));
  const maxLag = Math.min(Math.floor(n / 2), Math.floor(MAX_PERIOD / dt));
  if (maxLag <= minLag) return null;

  let bestLag = 0;
  let bestScore = 0;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    for (let i = 0; i + lag < n; i += 1) sum += centred[i] * centred[i + lag];
    const score = sum / denom;
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  /* A weak peak means "no periodicity worth standing behind", and the UI says
     that rather than printing a number. */
  if (bestLag === 0 || bestScore < 0.25) return null;
  return bestLag * dt;
}

/** The most visible pose in an instant — the subject, when there are several. */
export function primaryPose(sample: PoseSample): Landmark[] | null {
  if (!sample.poses.length) return null;
  return sample.poses.reduce((best, pose) => {
    const score = (p: Landmark[]) =>
      p.reduce((a, l) => a + (l.visibility ?? 0), 0);
    return score(pose) > score(best) ? pose : best;
  }, sample.poses[0]);
}

export function usePoseAnalysis() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIndex, setStageIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PoseResult | null>(null);
  const abort = useRef(false);

  const reset = useCallback(() => {
    abort.current = true;
    setPhase("idle");
    setStageIndex(-1);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const analyse = useCallback(async (video: HTMLVideoElement) => {
    abort.current = false;
    setError(null);
    setResult(null);
    setPhase("running");
    setStageIndex(0);
    setProgress(0);

    try {
      let landmarker: PoseLandmarkerLike;
      try {
        landmarker = await getLandmarker();
      } catch {
        throw new Error("runtime-failed");
      }
      if (abort.current) return;
      setStageIndex(1);

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

      setStageIndex(2);

      const samples: PoseSample[] = [];
      let previous: Uint8ClampedArray | null = null;
      /* detectForVideo requires strictly increasing timestamps. */
      let lastStamp = -1;

      /**
       * Sampling happens DURING PLAYBACK rather than by seeking. Seeking
       * depends on the browser firing `seeked` for the file's codec, and a
       * clip that opens but will not seek leaves the run stuck; playing once
       * and reading frames as they arrive ends on an event the element always
       * emits. A timer drives it, not requestAnimationFrame, which is starved
       * in a background tab.
       */
      await new Promise<void>((resolve, reject) => {
        let timer = 0;
        let lastAt = -1;
        let lastT = -1;
        let lastAdvance = Date.now();

        const stop = () => {
          window.clearInterval(timer);
          video.removeEventListener("ended", onEnd);
          video.removeEventListener("error", onErr);
          video.pause();
        };
        const onEnd = () => {
          stop();
          resolve();
        };
        const onErr = () => {
          stop();
          reject(new Error("load-failed"));
        };

        const tick = () => {
          if (abort.current) {
            stop();
            return resolve();
          }

          const t = video.currentTime;
          if (t > lastT + 0.001) {
            lastT = t;
            lastAdvance = Date.now();
          } else if (Date.now() - lastAdvance > STALL_MS) {
            stop();
            return reject(new Error("stalled"));
          }

          if (t - lastAt >= SAMPLE_GAP && samples.length < MAX_SAMPLES) {
            lastAt = t;

            /* Pose first, from the element itself at full resolution. */
            let poses: Landmark[][] = [];
            const stamp = Math.max(lastStamp + 1, Math.round(t * 1000));
            lastStamp = stamp;
            try {
              const out = landmarker.detectForVideo(video, stamp);
              poses = (out.landmarks ?? []).map((pose) =>
                pose.map((l) => ({
                  x: l.x,
                  y: l.y,
                  z: l.z ?? 0,
                  visibility: l.visibility ?? 0,
                })),
              );
            } catch {
              /* One failed frame must not end the run; the sample simply
                 carries no pose and the motion field still works. */
              poses = [];
            }

            /* Motion field alongside it: this is what still yields a signal on
               footage with no person in it at all. */
            ctx.drawImage(video, 0, 0, cw, ch);
            const frame = ctx.getImageData(0, 0, cw, ch).data;
            const luma = new Uint8ClampedArray(cw * ch);
            for (let q = 0, i = 0; i < frame.length; i += 4, q += 1) {
              luma[q] =
                (frame[i] * 299 + frame[i + 1] * 587 + frame[i + 2] * 114) / 1000;
            }

            let energy = 0;
            let cx = 0.5;
            let cy = 0.5;
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
              energy = total / (luma.length * 255);
              if (changed) {
                cx = sumX / changed / cw;
                cy = sumY / changed / ch;
              }
              samples.push({
                t,
                poses,
                energy,
                changed: changed / luma.length,
                cx,
                cy,
              });
            }
            previous = luma;

            setProgress(Math.min(1, t / duration));
            if (samples.length > 2) setStageIndex(3);
          }

          if (video.ended || t >= duration - 0.02) onEnd();
        };

        video.addEventListener("ended", onEnd);
        video.addEventListener("error", onErr);
        video.currentTime = 0;
        video.muted = true;
        void video
          .play()
          .then(() => {
            timer = window.setInterval(tick, 45);
          })
          .catch(() => reject(new Error("play-blocked")));
      });

      if (abort.current) return;
      if (samples.length < 4) throw new Error("too-short");

      setStageIndex(4);

      const meanDt =
        samples.length > 1
          ? (samples[samples.length - 1].t - samples[0].t) / (samples.length - 1)
          : 0;

      const energies = samples.map((s) => s.energy);
      const peakEnergy = Math.max(...energies);
      const meanEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;
      const motionDetected = meanEnergy >= NOISE_FLOOR;

      /* ── Is this clip suited to body-level work ── */
      const posedSamples = samples.filter((s) => s.poses.length > 0).length;
      const posedShare = posedSamples / samples.length;
      let suitability: Suitability;
      if (posedSamples === 0) suitability = "no-person";
      else if (posedShare < 0.6) suitability = "intermittent";
      else suitability = "single-person";

      /* How much of the frame is moving — a fixed camera watching one subject
         changes a small share of pixels; a pan changes nearly all of them. */
      const meanChanged =
        samples.reduce((a, s) => a + s.changed, 0) / samples.length;
      const frameWideChange = meanChanged >= FRAME_WIDE;

      setStageIndex(5);

      /* ── Body-centre path: hip midpoint where a pose exists, motion
            centroid where it does not, so the path is continuous either way ── */
      const centres = samples.map((s) => {
        const pose = primaryPose(s);
        if (pose) {
          const lh = pose[LM.lHip];
          const rh = pose[LM.rHip];
          if (
            lh &&
            rh &&
            lh.visibility > VIS_FLOOR &&
            rh.visibility > VIS_FLOOR
          ) {
            return { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2, posed: true };
          }
        }
        return { x: s.cx, y: s.cy, posed: false };
      });

      const first = centres[0];
      const last = centres[centres.length - 1];
      const driftX = motionDetected ? last.x - first.x : 0;
      const driftY = motionDetected ? last.y - first.y : 0;
      const absX = Math.abs(driftX);
      const absY = Math.abs(driftY);
      let direction: PoseResult["direction"] = "in place";
      if (motionDetected && Math.max(absX, absY) > 0.06) {
        direction =
          absX >= absY
            ? driftX > 0
              ? "right"
              : "left"
            : driftY > 0
              ? "down"
              : "up";
      }

      let reversals = 0;
      let sign = 0;
      for (let i = 1; i < centres.length; i += 1) {
        const d = centres[i].x - centres[i - 1].x;
        if (Math.abs(d) < 0.008) continue;
        const s = d > 0 ? 1 : -1;
        if (sign !== 0 && s !== sign) reversals += 1;
        sign = s;
      }

      /* ── Hip vertical oscillation: a real periodicity of the tracked body,
            deliberately NOT called cadence — that would be an inference this
            cannot make without scale and a validated gait model ── */
      const hipY = centres.filter((c) => c.posed).map((c) => c.y);
      const oscillationSeconds =
        hipY.length >= 12 ? dominantPeriod(hipY, meanDt) : null;

      /* ── Left/right ankle vertical travel, compared. A measured range of
            tracked landmarks, not a symmetry score ── */
      const ankleTravel = (index: number) => {
        const ys: number[] = [];
        for (const s of samples) {
          const pose = primaryPose(s);
          const l = pose?.[index];
          if (l && l.visibility > VIS_FLOOR) ys.push(l.y);
        }
        if (ys.length < 6) return null;
        return Math.max(...ys) - Math.min(...ys);
      };
      const leftRange = ankleTravel(LM.lAnkle);
      const rightRange = ankleTravel(LM.rAnkle);
      const ankleRange =
        leftRange !== null && rightRange !== null
          ? { left: leftRange, right: rightRange }
          : null;

      setResult({
        duration,
        width: vw,
        height: vh,
        samples,
        posedSamples,
        suitability,
        meanChanged,
        frameWideChange,
        peakEnergy,
        meanEnergy,
        motionDetected,
        driftX,
        driftY,
        direction,
        oscillationSeconds,
        ankleRange,
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
