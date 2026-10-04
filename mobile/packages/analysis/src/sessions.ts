/**
 * Turns engine output into AnalysisSessions: the metric split (free vs
 * premium) lives here, at the data layer, next to the quality report and the
 * plain-language summary. Descriptions say how each value was measured.
 */
import { makeId, type AnalysisSession, type Metric, type QualityFlag, type QualityReport } from "@gaitai/core";
import { computeGait, type GaitMetricsResult, type PoseInstant } from "./gait";
import { computeCrowd, computeZone, type DetectionFrame, type Point } from "./crowd";
import type { EngineMeta } from "./engine";

const conf = (q: { lowVisibility?: boolean; short?: boolean; dense?: boolean; small?: boolean }, base = 0.85) =>
  +(base - (q.lowVisibility ? 0.25 : 0) - (q.short ? 0.15 : 0) - (q.dense ? 0.25 : 0) - (q.small ? 0.15 : 0)).toFixed(2);

function baseSession(p: Pick<AnalysisSession, "userId" | "product" | "analysisProduct" | "inputType" | "media" | "demo">, meta: EngineMeta): AnalysisSession {
  return {
    id: makeId("s"), createdAt: new Date().toISOString(), status: "complete", progress: 1,
    modelVersion: `${meta.runtime}/${meta.model}`, engine: "on-device-webengine",
    freeMetrics: [], premiumMetrics: [], summary: "",
    quality: { flags: [], framesAnalysed: meta.frames, framesWithSubject: 0, sampleFps: meta.fps, durationSeconds: +meta.duration.toFixed(1), notes: [] },
    ...p,
  };
}

export function buildWalkScanSession(instants: PoseInstant[], meta: EngineMeta, ctx: Pick<AnalysisSession, "userId" | "inputType" | "media" | "demo">, previous?: AnalysisSession): AnalysisSession {
  const g = computeGait(instants);
  const s = baseSession({ ...ctx, product: "mobilitycare", analysisProduct: "walkscan" }, meta);
  const flags: QualityFlag[] = [g.view];
  if (g.quality.withSubject === 0) flags.push("no-subject-frames");
  else if (g.quality.withSubject < g.quality.frames * 0.7) flags.push("multiple-subjects");
  else flags.push("single-subject");
  if (g.quality.lowVisibility) flags.push("low-visibility");
  if (g.quality.short) flags.push("short-clip");
  if (g.quality.sampleFps < 8) flags.push("low-fps");
  if (ctx.demo) flags.push("demo-data");
  const c = conf(g.quality);
  const notes = [
    `Body landmarks were found in ${g.quality.withSubject} of ${g.quality.frames} sampled frames (${g.quality.sampleFps} per second).`,
    g.view === "side-view" ? "Side view: step timing is most reliable from this angle." : g.view === "front-view" ? "Front view: timing is usable; left/right comparison is less certain from the front." : "The camera angle could not be classified; left/right comparison may be less certain.",
    "All values are 2D time-domain estimates from one camera. No distances or speeds are computed.",
  ];
  if (g.quality.lowVisibility) notes.push("Ankles were often hard to see. Better light or a fuller view improves reliability.");
  if (g.quality.short) notes.push("Clips under 6 seconds give few steps; aim for 10–20 seconds.");
  s.quality = { ...s.quality, flags, framesWithSubject: g.quality.withSubject, notes };

  const prev = (id: string) => previous?.freeMetrics.concat(previous.premiumMetrics).find((m) => m.id === id);
  const trend = (id: string, v: number | null): Metric["trend"] | undefined => {
    const p = prev(id); if (!p || v == null || typeof p.value !== "number") return undefined;
    const d = +(v - p.value).toFixed(1); return { delta: d, from: previous!.createdAt, direction: d > 0 ? "up" : d < 0 ? "down" : "flat" };
  };
  const m = (id: string, label: string, value: number | null, unit: string | undefined, description: string, category: Metric["category"], isPremium: boolean, series?: Metric["series"]): Metric =>
    ({ id, label, value, unit, description, category, confidence: value == null ? 0 : c, isPremium, trend: trend(id, value), series });

  s.freeMetrics = [
    m("cadence", "Cadence", g.cadenceSpm, "steps/min", "Steps per minute, from the time between detected foot contacts.", "rhythm", false),
    m("stepBalance", "Step-time balance", g.stepTimeBalancePct, "%", "How close left and right step durations are; 100% means equal timing. Not a spatial symmetry score.", "balance", false),
  ];
  s.premiumMetrics = [
    m("stepCv", "Step-time variability", g.stepTimeCvPct, "% CV", "Spread of step durations relative to their mean; lower means more even steps.", "variability", true),
    m("regularity", "Stride regularity", g.strideRegularity, undefined, "How closely each stride repeats the last, from the hip's vertical rhythm (0–1).", "rhythm", true),
    m("sway", "Trunk sway", g.trunkSwayPct, "% hip width", "Side-to-side movement of the shoulders relative to the hips, as a share of hip width.", "stability", true, g.swaySeries),
    m("leftStep", "Left step time", g.leftStepMs, "ms", "Mean duration of steps ending on the left foot.", "balance", true),
    m("rightStep", "Right step time", g.rightStepMs, "ms", "Mean duration of steps ending on the right foot.", "balance", true),
    { id: "contacts", label: "Contact timeline", value: g.contacts.length, unit: "contacts", description: "Every detected foot contact, by side and time, over the clip.", category: "rhythm", confidence: c, isPremium: true,
      series: g.contacts.map((k) => ({ t: k.t, v: k.side === "L" ? 1 : 2 })) },
  ];
  s.summary = g.cadenceSpm == null
    ? "Not enough clear steps were detected to measure timing. Try a longer clip with the whole body in view."
    : `${g.cadenceSpm} steps per minute with ${g.stepTimeBalancePct ?? "—"}% step-time balance over ${g.quality.duration}s.`;
  return s;
}

export function buildRehabSession(baseline: AnalysisSession, latest: AnalysisSession, ctx: Pick<AnalysisSession, "userId" | "demo">): AnalysisSession {
  const meta: EngineMeta = { runtime: latest.modelVersion.split("/")[0], model: "comparison", width: 0, height: 0, duration: 0, frames: 0, fps: 0, withSubject: 0 };
  const s = baseSession({ ...ctx, product: "mobilitycare", analysisProduct: "rehabtrack", inputType: "sessions", media: null }, meta);
  s.sourceSessionIds = [baseline.id, latest.id];
  const all = (x: AnalysisSession) => [...x.freeMetrics, ...x.premiumMetrics];
  const diff = (id: string, label: string, isPremium: boolean): Metric | null => {
    const a = all(baseline).find((m) => m.id === id), b = all(latest).find((m) => m.id === id);
    if (!a || !b || typeof a.value !== "number" || typeof b.value !== "number") return null;
    const d = +(b.value - a.value).toFixed(1);
    return { id: `d_${id}`, label, value: d, unit: b.unit, description: `${b.label}: ${a.value}${b.unit ? " " + b.unit : ""} at baseline, ${b.value}${b.unit ? " " + b.unit : ""} now.`, category: b.category, confidence: Math.min(a.confidence, b.confidence), isPremium, trend: { delta: d, from: baseline.createdAt, direction: d > 0 ? "up" : d < 0 ? "down" : "flat" } };
  };
  s.freeMetrics = [diff("cadence", "Cadence change", false), diff("stepBalance", "Balance change", false)].filter(Boolean) as Metric[];
  s.premiumMetrics = [diff("stepCv", "Variability change", true), diff("regularity", "Regularity change", true), diff("sway", "Trunk sway change", true), diff("leftStep", "Left step change", true), diff("rightStep", "Right step change", true)].filter(Boolean) as Metric[];
  s.quality = { flags: [...new Set([...baseline.quality.flags, ...latest.quality.flags])], framesAnalysed: 0, framesWithSubject: 0, sampleFps: 0, durationSeconds: 0,
    notes: ["Changes are differences between two of your own scans. Camera angle and lighting differences between the two clips affect them.", ...(ctx.demo ? ["Demo data."] : [])] };
  const cad = s.freeMetrics.find((m) => m.id === "d_cadence");
  const cadDelta = typeof cad?.value === "number" ? cad.value : null;
  s.summary = cadDelta != null ? `Cadence ${cadDelta > 0 ? "up" : cadDelta < 0 ? "down" : "unchanged"} ${Math.abs(cadDelta)} steps/min since your baseline.` : "The two scans could not be compared on cadence.";
  return s;
}

export function buildCrowdSession(frames: DetectionFrame[], meta: EngineMeta, ctx: Pick<AnalysisSession, "userId" | "inputType" | "media" | "demo">): AnalysisSession {
  const r = computeCrowd(frames);
  const s = baseSession({ ...ctx, product: "securevision", analysisProduct: "crowdsense" }, meta);
  const flags: QualityFlag[] = [];
  if (r.quality.dense) flags.push("dense-scene"); if (r.quality.small) flags.push("small-subjects"); if (ctx.demo) flags.push("demo-data");
  const c = conf(r.quality);
  s.quality = { ...s.quality, flags, framesWithSubject: frames.filter((f) => f.boxes.length).length, notes: [
    `A general-purpose person detector counted people it could see in ${frames.length} sampled frames.`,
    "Counts are people visible to the detector, not a crowd-density estimate; heavy occlusion lowers them.",
    ...(r.quality.dense ? ["Dense scene: expect undercounting where people overlap."] : []),
    ...(r.quality.small ? ["People appear small in frame; a closer or higher-resolution view improves detection."] : []),
  ] };
  const m = (id: string, label: string, value: number | null, unit: string | undefined, description: string, category: Metric["category"], isPremium: boolean, series?: Metric["series"]): Metric =>
    ({ id, label, value, unit, description, category, confidence: c, isPremium, series });
  s.freeMetrics = [
    m("current", "Current count", r.current, "people", "People visible in the last sampled frame.", "count", false),
    m("average", "Average count", r.average, "people", "Mean people visible per sampled frame.", "count", false),
    m("peak", "Peak count", r.peak, "people", `Most people visible at once, at ${r.peakAt.toFixed(1)}s.`, "count", false),
  ];
  s.premiumMetrics = [
    m("density", "Density timeline", r.peak, "people", "People visible in every sampled frame, over time.", "count", true, r.series),
    m("meanScore", "Detection confidence", r.quality.meanScore, undefined, "Mean detector confidence for the boxes counted (0–1).", "quality", true),
  ];
  s.summary = `${r.average} people on average, peaking at ${r.peak}, over ${r.quality.duration}s.`;
  return s;
}

export function buildZoneSession(frames: DetectionFrame[], meta: EngineMeta, zone: { name: string; points: Point[] }, ctx: Pick<AnalysisSession, "userId" | "inputType" | "media" | "demo">): AnalysisSession {
  const r = computeZone(frames, zone.points);
  const crowd = computeCrowd(frames);
  const s = baseSession({ ...ctx, product: "securevision", analysisProduct: "zone" }, meta);
  s.zone = zone;
  const flags: QualityFlag[] = []; if (crowd.quality.dense) flags.push("dense-scene"); if (ctx.demo) flags.push("demo-data");
  const c = conf(crowd.quality, 0.75);
  s.quality = { ...s.quality, flags, framesWithSubject: frames.filter((f) => f.boxes.length).length, notes: [
    "Zone membership uses each detection's foot point. Entries, exits and dwell come from frame-to-frame tracking and are estimates.",
    "A person hidden for more than 1.5 s is treated as having left and re-entered.",
  ] };
  const m = (id: string, label: string, value: number | null, unit: string | undefined, description: string, category: Metric["category"], isPremium: boolean, series?: Metric["series"]): Metric =>
    ({ id, label, value, unit, description, category, confidence: c, isPremium, series });
  s.freeMetrics = [
    m("entries", "Total entries", r.entries, "entries", `Times a tracked person crossed into “${zone.name}” (estimate).`, "flow", false),
    m("occupancy", "Current occupancy", r.currentOccupancy, "people", "People inside the zone in the last sampled frame.", "occupancy", false),
  ];
  s.premiumMetrics = [
    m("events", "Event list", r.events.length, "events", "Every entry and exit with its timestamp.", "flow", true, r.events.map((e) => ({ t: e.t, v: e.type === "entry" ? 1 : -1 }))),
    m("occSeries", "Occupancy timeline", r.peakOccupancy, "people", "People inside the zone in each sampled frame.", "occupancy", true, r.occupancySeries),
    m("dwell", "Mean dwell", r.meanDwellSeconds, "s", `Average time a tracked person stayed in the zone (${r.dwellSeconds.length} completed visits).`, "occupancy", true, r.dwellSeconds.map((d, i) => ({ t: i, v: d }))),
    m("exits", "Total exits", r.exits, "exits", "Times a tracked person crossed out of the zone (estimate).", "flow", true),
  ];
  s.summary = `${r.entries} entries into “${zone.name}”, ${r.currentOccupancy} inside at the end, peak ${r.peakOccupancy}.`;
  return s;
}

/** DEVELOPMENT ONLY: synthetic frames so the whole UX can be exercised without a video. Never call from production code paths. */
export function demoPoseInstants(seconds = 12, fps = 10): PoseInstant[] {
  const out: PoseInstant[] = [];
  const stepT = 0.55; // 109 spm
  for (let i = 0; i < seconds * fps; i++) {
    const t = i / fps; const ph = (t / (2 * stepT)) * 2 * Math.PI;
    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }));
    const set = (k: number, x: number, y: number) => { lm[k] = { x, y, z: 0, visibility: 0.9 }; };
    set(11, 0.48, 0.30); set(12, 0.52, 0.30); set(23, 0.485 + 0.01 * Math.sin(ph), 0.52); set(24, 0.515 + 0.01 * Math.sin(ph), 0.52);
    set(27, 0.5 + 0.12 * Math.sin(ph), 0.86 + 0.04 * Math.max(0, Math.cos(ph))); set(28, 0.5 - 0.12 * Math.sin(ph), 0.86 + 0.04 * Math.max(0, -Math.cos(ph)));
    out.push({ t, landmarks: lm });
  }
  return out;
}
export function demoDetectionFrames(seconds = 15, fps = 5): DetectionFrame[] {
  const out: DetectionFrame[] = [];
  for (let i = 0; i < seconds * fps; i++) {
    const t = i / fps; const n = 3 + Math.round(2 * Math.sin(t / 3) + 2);
    out.push({ t, boxes: Array.from({ length: n }, (_, k) => ({ x: 0.1 + ((k * 0.17 + t * 0.03) % 0.75), y: 0.35 + 0.05 * k, w: 0.08, h: 0.28, score: 0.7 })) });
  }
  return out;
}
export const gaitOf = computeGait;
export type { GaitMetricsResult };
