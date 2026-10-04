/**
 * Time-domain gait metrics from 2D pose landmarks.
 *
 * Input: one PoseLandmarker result per sampled instant (33 landmarks, image
 * fractions, visibility). Output: metrics that need no spatial calibration:
 * cadence, step-time balance, step-time variability, stride regularity and
 * trunk sway, plus a quality report. Nothing here is a score, a range or a
 * diagnosis, and nothing here needs to know how far the camera was.
 *
 * Foot contacts are detected from each ankle's vertical trajectory: in image
 * space y grows downwards, so a contact is a local maximum of ankle y that
 * also coincides with the ankle's forward velocity reversing (the foot stops
 * moving forward while planted). Both cues are required, which rejects the
 * bounce a swinging foot shows at mid-swing.
 */

export interface Landmark { x: number; y: number; z: number; visibility: number }
export interface PoseInstant { t: number; landmarks: Landmark[] | null }

export const LM = {
  nose: 0, lShoulder: 11, rShoulder: 12, lHip: 23, rHip: 24,
  lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28, lHeel: 29, rHeel: 30, lToe: 31, rToe: 32,
} as const;

export interface GaitMetricsResult {
  cadenceSpm: number | null;
  stepTimeBalancePct: number | null;
  stepTimeCvPct: number | null;
  strideRegularity: number | null;
  trunkSwayPct: number | null;
  leftStepMs: number | null;
  rightStepMs: number | null;
  contacts: { t: number; side: "L" | "R" }[];
  ankleSeries: { t: number; left: number | null; right: number | null }[];
  swaySeries: { t: number; v: number }[];
  view: "side-view" | "front-view" | "unknown-view";
  quality: {
    frames: number; withSubject: number; sampleFps: number; duration: number;
    meanVisibility: number; lowVisibility: boolean; short: boolean;
  };
}

const vis = (l: Landmark | undefined) => (l ? l.visibility : 0);
const mid = (a: Landmark, b: Landmark) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function smooth(xs: (number | null)[], w = 2): (number | null)[] {
  return xs.map((_, i) => {
    let s = 0, n = 0;
    for (let k = -w; k <= w; k++) { const v = xs[i + k]; if (v != null) { s += v; n++; } }
    return n ? s / n : null;
  });
}

/** Local maxima of y (foot low in frame) where x-velocity changes sign or is near zero. */
function contactsFor(ts: number[], ys: (number | null)[], xs: (number | null)[], minGap: number): number[] {
  const sy = smooth(ys), sx = smooth(xs);
  const out: number[] = [];
  for (let i = 2; i < sy.length - 2; i++) {
    const y = sy[i]; if (y == null) continue;
    const a = sy[i - 1], b = sy[i + 1], a2 = sy[i - 2], b2 = sy[i + 2];
    if (a == null || b == null || a2 == null || b2 == null) continue;
    if (!(y >= a && y >= b && y >= a2 && y >= b2)) continue;
    const vxA = (sx[i] ?? 0) - (sx[i - 1] ?? 0), vxB = (sx[i + 1] ?? 0) - (sx[i] ?? 0);
    const stalled = Math.abs(vxA) < 0.004 || Math.abs(vxB) < 0.004 || vxA * vxB <= 0;
    if (!stalled) continue;
    if (out.length && ts[i] - out[out.length - 1] < minGap) continue;
    out.push(ts[i]);
  }
  return out;
}

/** Indices of local extrema of a (lightly smoothed) series, at least `minGap` seconds apart. */
function extrema(ts: number[], xs: (number | null)[], kind: "max" | "min", minGap: number): number[] {
  const s = smooth(xs, 1);
  const better = (a: number, b: number) => (kind === "max" ? a >= b : a <= b);
  const out: number[] = [];
  for (let i = 2; i < s.length - 2; i++) {
    const v = s[i]; if (v == null) continue;
    const nb = [s[i - 1], s[i + 1], s[i - 2], s[i + 2]];
    if (nb.some((n) => n == null)) continue;
    if (!nb.every((n) => better(v, n as number))) continue;
    if (out.length && ts[i] - ts[out[out.length - 1]] < minGap) continue;
    out.push(i);
  }
  return out;
}

/**
 * Heel strikes from kinematics (after Zeni et al. 2008): a foot strikes the
 * ground at the instant its ankle is furthest ahead of the hips along the
 * walking direction. The offset is relative to the body, so it holds when the
 * camera pans or tracks the walker, where ankle-height or velocity cues fail.
 *
 * Walking direction comes from the gait cycle itself: after a heel strike the
 * foot is planted for the long stance phase (about 60% of the stride) while the
 * offset shrinks; after toe-off it swings forward quickly (about 40%). The
 * extremum type followed by the longer segment is therefore the heel strike.
 * Returns null when the offset barely moves (front view) or the clip is too
 * short to decide, so the caller can fall back to the height-based detector.
 */
function heelStrikes(ts: number[], dL: (number | null)[], dR: (number | null)[], hipX: number[], torso: number, minGap: number): { left: number[]; right: number[] } | null {
  const vals = [...dL, ...dR].filter((v): v is number => v != null);
  if (vals.length < 8) return null;
  const span = Math.max(...vals) - Math.min(...vals);
  if (!(torso > 0) || span < 0.35 * torso) return null; // feet hardly pass the hips: not a side view
  const sides = [dL, dR].map((d) => ({ max: extrema(ts, d, "max", minGap), min: extrema(ts, d, "min", minGap) }));
  // Segment durations pooled over both feet: max→next min vs min→next max.
  let maxToMin: number[] = [], minToMax: number[] = [];
  for (const s of sides) {
    for (const m of s.max) { const n = s.min.find((k) => k > m); if (n != null) maxToMin.push(ts[n] - ts[m]); }
    for (const m of s.min) { const n = s.max.find((k) => k > m); if (n != null) minToMax.push(ts[n] - ts[m]); }
  }
  let strikesAreMax: boolean;
  if (maxToMin.length >= 2 && minToMax.length >= 2) strikesAreMax = stats(maxToMin).mean > stats(minToMax).mean;
  else {
    // Too few cycles for the asymmetry rule: use the hips' net drift across the frame (fixed camera).
    const drift = hipX.length > 1 ? hipX[hipX.length - 1] - hipX[0] : 0;
    if (Math.abs(drift) < 0.05) return null;
    strikesAreMax = drift > 0;
  }
  const pickSide = (s: { max: number[]; min: number[] }) => (strikesAreMax ? s.max : s.min).map((i) => ts[i]);
  const left = pickSide(sides[0]), right = pickSide(sides[1]);
  if (left.length + right.length < 4) return null;
  return { left, right };
}

function stats(xs: number[]) {
  const n = xs.length; if (!n) return { mean: NaN, sd: NaN };
  const mean = xs.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(xs.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, n - 1));
  return { mean, sd };
}

/** Normalised autocorrelation of a series at lag k. */
function autocorr(v: number[], k: number): number {
  const { mean } = stats(v); let num = 0, den = 0;
  for (let i = 0; i < v.length; i++) { den += (v[i] - mean) ** 2; if (i + k < v.length) num += (v[i] - mean) * (v[i + k] - mean); }
  return den ? num / den : 0;
}

export function computeGait(instants: PoseInstant[]): GaitMetricsResult {
  const withSubject = instants.filter((s) => s.landmarks && s.landmarks.length >= 33);
  const duration = instants.length ? instants[instants.length - 1].t - instants[0].t : 0;
  const sampleFps = instants.length > 1 ? (instants.length - 1) / Math.max(duration, 1e-6) : 0;
  const ts = withSubject.map((s) => s.t);
  const L = withSubject.map((s) => s.landmarks!);
  const visAll = L.flatMap((lm) => [vis(lm[LM.lAnkle]), vis(lm[LM.rAnkle]), vis(lm[LM.lHip]), vis(lm[LM.rHip])]);
  const meanVisibility = visAll.length ? visAll.reduce((a, b) => a + b, 0) / visAll.length : 0;

  // View: shoulder width relative to torso height. Side view → narrow shoulders.
  const ratios = L.map((lm) => {
    const sw = Math.abs(lm[LM.lShoulder].x - lm[LM.rShoulder].x);
    const th = Math.abs(mid(lm[LM.lShoulder], lm[LM.rShoulder]).y - mid(lm[LM.lHip], lm[LM.rHip]).y);
    return th > 0 ? sw / th : NaN;
  }).filter((r) => Number.isFinite(r));
  const ratio = ratios.length ? stats(ratios).mean : NaN;
  const view: GaitMetricsResult["view"] = !Number.isFinite(ratio) ? "unknown-view" : ratio < 0.45 ? "side-view" : ratio > 0.7 ? "front-view" : "unknown-view";

  const pick = (i: number) => L.map((lm) => (vis(lm[i]) >= 0.5 ? lm[i] : null));
  const lA = pick(LM.lAnkle), rA = pick(LM.rAnkle);
  const minGap = 0.3; // no two contacts of one foot within 300 ms
  const hipX = L.map((lm) => mid(lm[LM.lHip], lm[LM.rHip]).x);
  const torso = stats(L.map((lm) => Math.abs(mid(lm[LM.lShoulder], lm[LM.rShoulder]).y - mid(lm[LM.lHip], lm[LM.rHip]).y))).mean;
  // Primary: heel strikes from the ankle's horizontal offset to the hips (camera-motion invariant).
  const kinematic = heelStrikes(ts, lA.map((l, i) => (l ? l.x - hipX[i] : null)), rA.map((l, i) => (l ? l.x - hipX[i] : null)), hipX, torso, minGap * 2);
  // Fallback: ankle height peaks with the forward-velocity reversal (needs a fixed camera; weaker from the front).
  const lC = kinematic ? kinematic.left : contactsFor(ts, lA.map((l) => l?.y ?? null), lA.map((l) => l?.x ?? null), minGap * 2);
  const rC = kinematic ? kinematic.right : contactsFor(ts, rA.map((l) => l?.y ?? null), rA.map((l) => l?.x ?? null), minGap * 2);
  const contacts = [...lC.map((t) => ({ t, side: "L" as const })), ...rC.map((t) => ({ t, side: "R" as const }))].sort((a, b) => a.t - b.t);

  // Step times: consecutive contacts of alternating feet.
  const stepTimes: { ms: number; side: "L" | "R" }[] = [];
  for (let i = 1; i < contacts.length; i++) {
    const a = contacts[i - 1], b = contacts[i];
    if (a.side === b.side) continue;
    const ms = (b.t - a.t) * 1000;
    if (ms >= 250 && ms <= 1200) stepTimes.push({ ms, side: b.side });
  }
  const steps = stepTimes.map((s) => s.ms);
  const left = stepTimes.filter((s) => s.side === "L").map((s) => s.ms);
  const right = stepTimes.filter((s) => s.side === "R").map((s) => s.ms);
  const enough = steps.length >= 4;
  const { mean: meanStep, sd: sdStep } = stats(steps);
  const cadenceSpm = enough ? Math.round(60000 / meanStep) : null;
  const stepTimeCvPct = enough ? +((sdStep / meanStep) * 100).toFixed(1) : null;
  const leftStepMs = left.length ? Math.round(stats(left).mean) : null;
  const rightStepMs = right.length ? Math.round(stats(right).mean) : null;
  const stepTimeBalancePct = leftStepMs && rightStepMs
    ? +((1 - Math.abs(leftStepMs - rightStepMs) / Math.max(leftStepMs, rightStepMs)) * 100).toFixed(0)
    : null;

  // Stride regularity: autocorrelation of the vertical hip-midpoint series at one stride lag.
  const hipY = L.map((lm) => mid(lm[LM.lHip], lm[LM.rHip]).y);
  let strideRegularity: number | null = null;
  if (enough && hipY.length > 8 && sampleFps > 0) {
    const lag = Math.round((2 * meanStep / 1000) * sampleFps);
    if (lag > 0 && lag < hipY.length / 2) strideRegularity = +Math.max(0, Math.min(1, autocorr(hipY, lag))).toFixed(2);
  }

  // Trunk sway: lateral movement of the shoulder midpoint relative to the hip midpoint, as % of hip width.
  const swaySeries: { t: number; v: number }[] = [];
  L.forEach((lm, i) => {
    const hw = Math.abs(lm[LM.lHip].x - lm[LM.rHip].x);
    if (hw < 0.02) return;
    const dx = mid(lm[LM.lShoulder], lm[LM.rShoulder]).x - mid(lm[LM.lHip], lm[LM.rHip]).x;
    swaySeries.push({ t: ts[i], v: (dx / hw) * 100 });
  });
  const trunkSwayPct = swaySeries.length > 5 ? +stats(swaySeries.map((s) => s.v)).sd.toFixed(1) : null;

  const ankleSeries = withSubject.map((s, i) => ({ t: s.t, left: lA[i]?.y ?? null, right: rA[i]?.y ?? null }));

  return {
    cadenceSpm, stepTimeBalancePct, stepTimeCvPct, strideRegularity, trunkSwayPct, leftStepMs, rightStepMs,
    contacts, ankleSeries, swaySeries, view,
    quality: {
      frames: instants.length, withSubject: withSubject.length, sampleFps: +sampleFps.toFixed(1), duration: +duration.toFixed(1),
      meanVisibility: +meanVisibility.toFixed(2), lowVisibility: meanVisibility < 0.6, short: duration < 6,
    },
  };
}
