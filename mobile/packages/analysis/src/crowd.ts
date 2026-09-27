/**
 * People-in-frame counting and zone occupancy from object detections.
 *
 * Input: per sampled frame, the `person` boxes an object detector returned
 * (fractions of the frame). Counting needs no tracking. Zone entries, exits
 * and dwell use a nearest-centroid tracker across consecutive frames; those
 * are estimates and are labelled as such wherever they are shown.
 */

export interface Box { x: number; y: number; w: number; h: number; score: number }
export interface DetectionFrame { t: number; boxes: Box[] }
export interface Point { x: number; y: number }

export interface CrowdResult {
  current: number; average: number; peak: number; peakAt: number;
  series: { t: number; v: number }[];
  quality: { frames: number; sampleFps: number; duration: number; meanScore: number; dense: boolean; small: boolean };
}

export function computeCrowd(frames: DetectionFrame[]): CrowdResult {
  const counts = frames.map((f) => f.boxes.length);
  const duration = frames.length ? frames[frames.length - 1].t - frames[0].t : 0;
  const scores = frames.flatMap((f) => f.boxes.map((b) => b.score));
  const areas = frames.flatMap((f) => f.boxes.map((b) => b.w * b.h));
  const peak = counts.length ? Math.max(...counts) : 0;
  const peakAt = counts.length ? frames[counts.indexOf(peak)].t : 0;
  return {
    current: counts.length ? counts[counts.length - 1] : 0,
    average: counts.length ? +(counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) : 0,
    peak, peakAt,
    series: frames.map((f) => ({ t: f.t, v: f.boxes.length })),
    quality: {
      frames: frames.length,
      sampleFps: frames.length > 1 ? +((frames.length - 1) / Math.max(duration, 1e-6)).toFixed(1) : 0,
      duration: +duration.toFixed(1),
      meanScore: scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0,
      dense: peak >= 12,
      small: areas.length > 0 && areas.reduce((a, b) => a + b, 0) / areas.length < 0.004,
    },
  };
}

/** Ray-casting point-in-polygon on frame fractions. */
export function inPolygon(p: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export interface ZoneEvent { t: number; type: "entry" | "exit"; trackId: number }
export interface ZoneResult {
  entries: number; exits: number; currentOccupancy: number; peakOccupancy: number;
  occupancySeries: { t: number; v: number }[];
  events: ZoneEvent[];
  dwellSeconds: number[];
  meanDwellSeconds: number | null;
}

interface Track { id: number; cx: number; cy: number; inside: boolean; enteredAt: number | null; lastSeen: number }

/** Foot point (bottom-centre of the box) decides zone membership. */
export function computeZone(frames: DetectionFrame[], polygon: Point[]): ZoneResult {
  const tracks: Track[] = []; let nextId = 1;
  const events: ZoneEvent[] = []; const dwell: number[] = [];
  const occupancySeries: { t: number; v: number }[] = [];
  const maxJump = 0.12; // frame fraction a person may move between samples

  for (const f of frames) {
    const pts = f.boxes.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h }));
    const used = new Set<number>();
    const matched: Track[] = [];
    for (const p of pts) {
      let best: Track | null = null, bestD = maxJump;
      for (const tr of tracks) {
        if (used.has(tr.id)) continue;
        const d = Math.hypot(tr.cx - p.x, tr.cy - p.y);
        if (d < bestD) { bestD = d; best = tr; }
      }
      const inside = inPolygon(p, polygon);
      if (best) {
        used.add(best.id);
        if (inside && !best.inside) { events.push({ t: f.t, type: "entry", trackId: best.id }); best.enteredAt = f.t; }
        if (!inside && best.inside) { events.push({ t: f.t, type: "exit", trackId: best.id }); if (best.enteredAt != null) dwell.push(f.t - best.enteredAt); best.enteredAt = null; }
        best.cx = p.x; best.cy = p.y; best.inside = inside; best.lastSeen = f.t; matched.push(best);
      } else {
        const tr: Track = { id: nextId++, cx: p.x, cy: p.y, inside, enteredAt: inside ? f.t : null, lastSeen: f.t };
        if (inside) events.push({ t: f.t, type: "entry", trackId: tr.id });
        tracks.push(tr); used.add(tr.id); matched.push(tr);
      }
    }
    // Drop tracks unseen for 1.5 s; a track that vanishes inside the zone counts as an exit.
    for (let i = tracks.length - 1; i >= 0; i--) {
      const tr = tracks[i];
      if (f.t - tr.lastSeen > 1.5) {
        if (tr.inside) { events.push({ t: tr.lastSeen, type: "exit", trackId: tr.id }); if (tr.enteredAt != null) dwell.push(tr.lastSeen - tr.enteredAt); }
        tracks.splice(i, 1);
      }
    }
    occupancySeries.push({ t: f.t, v: tracks.filter((tr) => tr.inside && f.t - tr.lastSeen <= 1.5).length });
  }
  const entries = events.filter((e) => e.type === "entry").length;
  const exits = events.filter((e) => e.type === "exit").length;
  const occ = occupancySeries.map((s) => s.v);
  return {
    entries, exits,
    currentOccupancy: occ.length ? occ[occ.length - 1] : 0,
    peakOccupancy: occ.length ? Math.max(...occ) : 0,
    occupancySeries, events, dwellSeconds: dwell.map((d) => +d.toFixed(1)),
    meanDwellSeconds: dwell.length ? +(dwell.reduce((a, b) => a + b, 0) / dwell.length).toFixed(1) : null,
  };
}
