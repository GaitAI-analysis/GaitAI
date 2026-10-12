/**
 * Shared geometry for the Wiki's technical diagrams.
 *
 * Every diagram is authored as data (nodes, groups, connectors) in SVG user
 * units and rendered on the server, so the published page carries plain SVG:
 * sharp at every zoom level, themeable through CSS custom properties, and
 * verifiable by `scripts/check-wiki-diagrams.ts`, which replays this same
 * geometry to prove that connectors touch the boxes they claim to connect and
 * that no label is wider than the box that holds it.
 */
export type Side = "top" | "right" | "bottom" | "left";
export interface Pt { x: number; y: number }
export interface Box { x: number; y: number; w: number; h: number }

export const anchor = (box: Box, side: Side, at = 0): Pt => {
  switch (side) {
    case "top": return { x: box.x + box.w / 2 + at * box.w, y: box.y };
    case "bottom": return { x: box.x + box.w / 2 + at * box.w, y: box.y + box.h };
    case "left": return { x: box.x, y: box.y + box.h / 2 + at * box.h };
    case "right": return { x: box.x + box.w, y: box.y + box.h / 2 + at * box.h };
  }
};

const horizontal = (side: Side) => side === "left" || side === "right";

/** Orthogonal route between two anchors: one or two right-angle bends, or explicit waypoints. */
export function route(a: Pt, sa: Side, b: Pt, sb: Side, via?: number, points?: Pt[]): Pt[] {
  if (points?.length) return [a, ...points, b];
  if (horizontal(sa)) {
    if (horizontal(sb)) {
      if (Math.abs(a.y - b.y) < 0.5) return [a, b];
      const x = via ?? (a.x + b.x) / 2;
      return [a, { x, y: a.y }, { x, y: b.y }, b];
    }
    return Math.abs(a.x - b.x) < 0.5 ? [a, b] : [a, { x: b.x, y: a.y }, b];
  }
  if (!horizontal(sb)) {
    if (Math.abs(a.x - b.x) < 0.5) return [a, b];
    const y = via ?? (a.y + b.y) / 2;
    return [a, { x: a.x, y }, { x: b.x, y }, b];
  }
  return Math.abs(a.y - b.y) < 0.5 ? [a, b] : [a, { x: a.x, y: b.y }, b];
}

export const pathOf = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${round(p.x)} ${round(p.y)}`).join(" ");
const round = (n: number) => Math.round(n * 100) / 100;

/** Point at fraction `t` of the polyline length, plus the orientation of that segment. */
export function along(pts: Pt[], t: number): { p: Pt; vertical: boolean } {
  const lengths = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = lengths.reduce((n, l) => n + l, 0);
  let remaining = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const f = lengths[i] ? remaining / lengths[i] : 0;
      const p = { x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f };
      return { p, vertical: Math.abs(pts[i + 1].x - pts[i].x) < 0.5 };
    }
    remaining -= lengths[i];
  }
  return { p: pts[0], vertical: false };
}

/** Fraction of the polyline length at which the longest segment's midpoint sits. */
export function longestSegmentMid(pts: Pt[]): number {
  const lengths = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const total = lengths.reduce((n, l) => n + l, 0) || 1;
  let best = 0;
  lengths.forEach((l, i) => { if (l > lengths[best]) best = i; });
  const before = lengths.slice(0, best).reduce((n, l) => n + l, 0);
  return (before + lengths[best] / 2) / total;
}

/**
 * Conservative text-width estimate for Georama at a given size (user units).
 * Georama is slightly wider than Inter; the per-glyph classes below err on the
 * wide side so a label that passes the check also fits in the browser.
 */
export function textWidth(text: string, size: number, weight = 500): number {
  let units = 0;
  for (const ch of text) {
    if (" ".includes(ch)) units += 0.28;
    else if ("iljtfI.,;:'|!".includes(ch)) units += 0.32;
    else if ("mwMW".includes(ch)) units += 0.9;
    else if (ch >= "A" && ch <= "Z") units += 0.68;
    else if (ch >= "0" && ch <= "9") units += 0.58;
    else if ("r".includes(ch)) units += 0.4;
    else if ("()[]{}-_/".includes(ch)) units += 0.38;
    else units += 0.56;
  }
  return units * size * (weight >= 600 ? 1.06 : 1);
}

export const lines = (text?: string) => (text ? text.split("\n") : []);
