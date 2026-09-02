import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";
import styles from "./heroField.module.css";

/**
 * The /products hero's movement-intelligence field.
 *
 * The hero's right half was empty. This fills it with the page's own argument
 * rather than with decoration: biomechanical movement on the left, the engine
 * in the middle, anonymous spatial movement on the right, and the signal
 * travelling between them —
 *
 *   cyan (captured movement) → electric blue (the engine) → violet (spatial
 *   intelligence)
 *
 * so the eye crosses the hero left to right, out of the headline and into the
 * field, and arrives at the ecosystem diagram below already knowing the shape
 * of the story.
 *
 * It is deliberately NOT that diagram. The ecosystem section states the system
 * — two labelled worlds, a labelled engine, computed geometry. This is the
 * teaser: no world circles, no engine label, no captions, everything held
 * between 0.1 and 0.35 opacity, and the composition set on a diagonal rather
 * than on the ecosystem's horizontal axis. The headline stays the loudest
 * thing in the hero.
 *
 * WHY THE LEFT EDGE IS MASKED: the field is anchored to the viewport's right
 * edge and is wide enough that on a 1280–1440px screen its left edge passes
 * behind the last lines of hero copy. A linear mask takes the first sixth of
 * the field to zero, so what sits behind text is genuinely invisible rather
 * than "faint", and text legibility never depends on the artwork's opacity.
 *
 * RESPONSIVE: the wide field is positioned absolutely into the hero's right
 * half; the compact one sits in normal flow under the copy, where nothing is
 * behind text at all. Both are gated by media queries *inside the CSS module*
 * — not with Tailwind's `hidden`/`lg:block`, which are single-class rules in
 * the global sheet that a module's own `display` rule (later sheet) would win
 * against, rendering both at once.
 */

type Variant = "wide" | "compact";

type Geometry = {
  key: string;
  w: number;
  h: number;
  /** Engine core: centre and radius. */
  c: Pt;
  r: number;
  /** Concentric processing rings, as radii. */
  rings: readonly number[];
  /** Radial sample ring: inner radius, tick count, amplitude. */
  sampleR: number;
  sampleN: number;
  sampleAmp: number;

  /* ── MobilityCare strip ── */
  /** Joint-angle band: baseline and amplitude. */
  bandY: number;
  bandAmp: number;
  /** Which canonical gait events to draw, and where. */
  walkerIdx: readonly number[];
  walkerX0: number;
  walkerStep: number;
  walkerBaseY: number;
  walkerScale: number;
  /** Cadence axis under the strip. */
  axisY: number;
  axisX0: number;
  axisX1: number;

  /* ── Capability arcs and the module nodes sitting on them ── */
  arcR: number;
  careArc: readonly [number, number];
  secureArc: readonly [number, number];
  careNodes: readonly number[];
  secureNodes: readonly number[];
  /** Module labels are dropped from the compact field: at its scale they
      would render below 4px. */
  nodeLabels: boolean;
  nodeLabelSize: number;

  /* ── SecureVision field ── */
  /** Normalized (u, v) -> absolute, as a box. */
  secBox: readonly [number, number, number, number];
  secTracks: number;
};

const WIDE: Geometry = {
  key: "w",
  w: 820,
  h: 480,
  c: [430, 235],
  r: 58,
  rings: [84, 104, 128],
  sampleR: 66,
  sampleN: 72,
  sampleAmp: 7,

  bandY: 70,
  bandAmp: 30,
  walkerIdx: [0, 2, 3, 4],
  walkerX0: 98,
  walkerStep: 66,
  walkerBaseY: 116,
  walkerScale: 0.76,
  axisY: 182,
  axisX0: 74,
  axisX1: 320,

  arcR: 155,
  careArc: [140, 194],
  secureArc: [-70, -8],
  careNodes: [150, 167, 184],
  secureNodes: [-61, -38, -15],
  nodeLabels: true,
  nodeLabelSize: 8,

  secBox: [498, 200, 800, 448],
  secTracks: 3,
};

const COMPACT: Geometry = {
  key: "c",
  w: 640,
  h: 430,
  c: [330, 200],
  r: 52,
  rings: [76, 94],
  sampleR: 58,
  sampleN: 60,
  sampleAmp: 6,

  bandY: 48,
  bandAmp: 24,
  walkerIdx: [0, 3, 4],
  walkerX0: 74,
  walkerStep: 62,
  walkerBaseY: 82,
  walkerScale: 0.7,
  axisY: 136,
  axisX0: 44,
  axisX1: 252,

  arcR: 128,
  careArc: [140, 196],
  secureArc: [-64, -10],
  careNodes: [152, 184],
  secureNodes: [-58, -18],
  nodeLabels: false,
  nodeLabelSize: 7,

  secBox: [368, 178, 634, 404],
  secTracks: 3,
};

/** The module nodes on each capability arc. Real modules, and only six: this
    is a field of intelligence nodes around the platform, not a second menu. */
const CARE_MODULES = ["WalkScan", "FallRisk", "RehabTrack"] as const;
const SECURE_MODULES = ["CrowdSense", "PrivacyGuard", "SuspiciousMotion"] as const;

/* ── Small geometry helpers ─────────────────────────────────────────────── */

const rad = (deg: number) => (deg * Math.PI) / 180;

function onCircle(c: Pt, r: number, deg: number): Pt {
  return [c[0] + Math.cos(rad(deg)) * r, c[1] + Math.sin(rad(deg)) * r];
}

function arcPath(c: Pt, r: number, a0: number, a1: number) {
  const f = (n: number) => n.toFixed(1);
  const [x0, y0] = onCircle(c, r, a0);
  const [x1, y1] = onCircle(c, r, a1);
  return `M${f(x0)} ${f(y0)} A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${f(x1)} ${f(y1)}`;
}

/** Catmull-Rom through the points, as a smooth cubic path. */
function smoothPath(pts: readonly Pt[]) {
  if (pts.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d +=
      ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Hip flexion/extension over one stride, normalized 0..1 and periodic so the
    band can be plotted continuously across the strip. Gait kinematics, not a
    decorative wave. */
function hipAngle(t: number) {
  return 0.5 + 0.42 * Math.cos(2 * Math.PI * (t - 0.04));
}

/** Where each canonical event falls in the cycle. The poses are drawn evenly
    spaced — they are a filmstrip — but they are not evenly spaced in time, and
    the band and the cadence ticks are plotted through this. */
const CYCLE_T = [0, 0.12, 0.3, 0.6, 0.8] as const;

/** One stride's worth of radial sample heights, with the trailing half of the
    cycle lower — the asymmetry that makes the ring read as gait and not as a
    level meter. Deterministic, so server and client markup agree. */
function strideHeight(i: number, amp: number) {
  const inCycle = i % 12;
  const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
  return 1.5 + swing * amp * (inCycle < 6 ? 1 : 0.6);
}

/* ── SecureVision field, in normalized (u, v) over its own box ──────────── */

type UV = readonly [number, number];

/** Trajectories following the expected flow. */
const SEC_TRACKS: readonly (readonly UV[])[] = [
  [[-1.04, -0.72], [-0.4, -0.86], [0.24, -0.68], [0.72, -0.8], [1.04, -0.74]],
  [[-1.04, -0.28], [-0.42, -0.14], [0.22, -0.3], [0.74, -0.16], [1.04, -0.24]],
  [[-1.02, 0.28], [-0.36, 0.4], [0.28, 0.26], [0.78, 0.38], [1.04, 0.3]],
];

/** A cross-flow route, so the field has a genuine crossing. */
const SEC_CROSS: readonly UV[] = [
  [-0.68, -1.02],
  [-0.5, -0.4],
  [-0.3, 0.3],
  [-0.16, 1.02],
];

/** The deviation: enters on the expected flow, then leaves it for the zone. */
const SEC_ANOMALY: readonly UV[] = [
  [-1.04, 0],
  [-0.42, 0.1],
  [0.1, -0.02],
  [0.42, 0.42],
  [0.6, 0.86],
];

/** Where it was expected to carry on. */
const SEC_GHOST: readonly UV[] = [
  [0.1, -0.02],
  [0.5, 0.06],
  [0.86, -0.04],
  [1.04, 0.02],
];

/** Restricted area, placed where no expected route runs. */
const SEC_ZONE: readonly UV[] = [
  [0.16, 0.52],
  [0.86, 0.4],
  [0.96, 0.9],
  [0.28, 1],
];

/** Sparse flow vectors, in the gaps between routes. */
const SEC_VECTORS: readonly UV[] = [
  [-0.72, -0.52],
  [0.02, -0.94],
  [0.62, -0.5],
  [-0.78, 0.66],
];

/** A walking pose from the shared canonical gait events. */
function Walker({
  phase,
  x,
  baseY,
  s,
  order,
}: {
  phase: GaitPhase;
  x: number;
  baseY: number;
  s: number;
  order: number;
}) {
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${(px * s).toFixed(1)},${(py * s).toFixed(1)}`).join(" ");
  return (
    <g
      className={styles.walker}
      transform={`translate(${x} ${(baseY + phase.lift * s).toFixed(1)})`}
      style={{ "--hf-i": order } as CSSProperties}
    >
      <polyline className={styles.boneFar} points={pts(phase.farArm)} />
      <polyline className={styles.boneFar} points={pts(phase.farLeg)} />
      <line
        className={styles.bone}
        x1={0}
        y1={0}
        x2={(1.5 * s).toFixed(1)}
        y2={(-34 * s).toFixed(1)}
      />
      <circle
        className={styles.head}
        cx={(GAIT_HEAD[0] * s).toFixed(1)}
        cy={(GAIT_HEAD[1] * s).toFixed(1)}
        r={(4.2 * s).toFixed(1)}
      />
      <polyline className={styles.bone} points={pts(phase.nearArm)} />
      <polyline className={styles.bone} points={pts(phase.nearLeg)} />
      <line
        className={styles.bone}
        x1={(phase.nearFoot[0][0] * s).toFixed(1)}
        y1={(phase.nearFoot[0][1] * s).toFixed(1)}
        x2={(phase.nearFoot[1][0] * s).toFixed(1)}
        y2={(phase.nearFoot[1][1] * s).toFixed(1)}
      />
    </g>
  );
}

function Field({ variant }: { variant: Variant }) {
  const geo = variant === "compact" ? COMPACT : WIDE;
  const k = geo.key;
  const [cx, cy] = geo.c;

  /* ── MobilityCare: the gait strip ─────────────────────────────────────── */
  const events = geo.walkerIdx.map((idx, i) => ({
    idx,
    x: geo.walkerX0 + i * geo.walkerStep,
    t: CYCLE_T[idx] ?? idx / GAIT_PHASES.length,
    phase: GAIT_PHASES[idx],
  }));
  const groundY = geo.walkerBaseY + 48 * geo.walkerScale;

  /** Stride fraction at a given x, and its inverse. The poses are evenly
      spaced along x but not in time, so everything plotted against time goes
      through this pair — which is what keeps each pose on its own phase of the
      curve above it. */
  const xToT = (x: number) => {
    let i = 0;
    while (i < events.length - 2 && x > events[i + 1].x) i++;
    const a = events[i];
    const b = events[i + 1];
    return a.t + ((x - a.x) * (b.t - a.t)) / (b.x - a.x);
  };
  const tToX = (t: number) => {
    let i = 0;
    while (i < events.length - 2 && t > events[i + 1].t) i++;
    const a = events[i];
    const b = events[i + 1];
    return a.x + ((t - a.t) * (b.x - a.x)) / (b.t - a.t);
  };

  const bandPath = smoothPath(
    Array.from({ length: 29 }, (_, i) => {
      const x = geo.axisX0 + ((geo.axisX1 - geo.axisX0) * i) / 28;
      return [x, geo.bandY - hipAngle(xToT(x)) * geo.bandAmp] as Pt;
    }),
  );
  const bandNodes = events.map((e) => ({
    x: e.x,
    y: geo.bandY - hipAngle(e.t) * geo.bandAmp,
  }));

  /** Cadence ticks: a fixed sample rate over the stride, each placed at the x
      its own moment maps to, so the spacing comes out irregular the way gait
      timing is rather than as an even comb. */
  const axisN = variant === "compact" ? 18 : 24;
  const axisT0 = xToT(geo.axisX0);
  const axisT1 = xToT(geo.axisX1);
  const axisSamples = Array.from({ length: axisN }, (_, i) => ({
    x: tToX(axisT0 + ((axisT1 - axisT0) * i) / (axisN - 1)),
    h: 2 + 1.5 * Math.abs(Math.sin(i * 1.7)),
  }));

  /* ── SecureVision: the anonymous spatial field ────────────────────────── */
  const [sx0, sy0, sx1, sy1] = geo.secBox;
  const scx = (sx0 + sx1) / 2;
  const scy = (sy0 + sy1) / 2;
  const shw = (sx1 - sx0) / 2;
  const shh = (sy1 - sy0) / 2;
  const F = ([u, v]: UV): Pt => [scx + u * shw, scy + v * shh];

  const tracks = SEC_TRACKS.slice(0, geo.secTracks).map((t) => t.map(F));
  const cross = SEC_CROSS.map(F);
  const anomaly = SEC_ANOMALY.map(F);
  const ghost = SEC_GHOST.map(F);
  const zone = SEC_ZONE.map(F);
  const deviation = ghost[0];
  const flagged = anomaly[anomaly.length - 1];

  /* ── Channels: care → core → secure ──────────────────────────────────── */
  const inA = onCircle(geo.c, geo.r + 2, 199);
  const outA = onCircle(geo.c, geo.r + 2, 17);
  const inflow = `M${geo.axisX1 - 4} ${(geo.axisY - 22).toFixed(0)} C${cx - 150} ${geo.axisY - 4} ${cx - 130} ${cy - 46} ${inA[0].toFixed(1)} ${inA[1].toFixed(1)}`;
  const outflow = `M${outA[0].toFixed(1)} ${outA[1].toFixed(1)} C${cx + 130} ${cy + 48} ${scx - shw - 30} ${scy - 30} ${(sx0 + 8).toFixed(0)} ${(scy - shh * 0.28).toFixed(0)}`;

  /* ── Capability arcs and their module nodes ──────────────────────────── */
  const careNodes = geo.careNodes.map((a, i) => ({
    at: onCircle(geo.c, geo.arcR, a),
    label: CARE_MODULES[i] ?? "",
    i,
  }));
  const secureNodes = geo.secureNodes.map((a, i) => ({
    at: onCircle(geo.c, geo.arcR, a),
    label: SECURE_MODULES[i] ?? "",
    i,
  }));

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      /* The wide field fills a box defined by both its edges, so it is aligned
         to that box's right edge: the surplus space falls on the copy's side,
         and the bleed to the viewport edge is preserved at every width. */
      preserveAspectRatio={variant === "compact" ? undefined : "xMaxYMid meet"}
      className={`${styles.svg} ${variant === "compact" ? styles.svgCompact : ""}`}
    >
      <defs>
        {/* Localized atmosphere, not a gradient blob: one soft light behind
            the core and one over each signal cluster, all under 0.1 alpha. */}
        <radialGradient id={`hf-core-${k}`}>
          <stop offset="0" stopColor="#9fd8ff" stopOpacity="0.16" />
          <stop offset="0.4" stopColor="#3b82f6" stopOpacity="0.07" />
          <stop offset="1" stopColor="#2563ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`hf-care-${k}`}>
          <stop offset="0" stopColor="#4fd1ff" stopOpacity="0.07" />
          <stop offset="1" stopColor="#4fd1ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`hf-secure-${k}`}>
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.08" />
          <stop offset="1" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>

        {/* The signal's colour transformation, along the travel. */}
        <linearGradient
          id={`hf-in-${k}`}
          gradientUnits="userSpaceOnUse"
          x1={geo.axisX1}
          y1={geo.axisY}
          x2={cx - geo.r}
          y2={cy}
        >
          <stop offset="0" className={styles.stopCare} />
          <stop offset="1" className={styles.stopEngine} />
        </linearGradient>
        <linearGradient
          id={`hf-out-${k}`}
          gradientUnits="userSpaceOnUse"
          x1={cx + geo.r}
          y1={cy}
          x2={sx0 + 40}
          y2={scy}
        >
          <stop offset="0" className={styles.stopEngine} />
          <stop offset="1" className={styles.stopSecure} />
        </linearGradient>

        {/* Depth: the grid is brightest near the core and gone by the edges,
            so it reads as a plane receding rather than as flat wallpaper. */}
        <radialGradient id={`hf-gridfade-${k}`}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`hf-gridmask-${k}`}>
          <rect
            x={0}
            y={0}
            width={geo.w}
            height={geo.h}
            fill={`url(#hf-gridfade-${k})`}
          />
        </mask>

        {/* What sits behind hero copy is taken to zero rather than made faint:
            the left sixth fades out, and so does the last tenth at the bottom,
            where the field meets the ecosystem diagram below. */}
        <linearGradient id={`hf-edge-${k}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.085" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`hf-foot-${k}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`hf-mask-${k}`}>
          <rect
            x={0}
            y={0}
            width={geo.w}
            height={geo.h}
            fill={`url(#hf-edge-${k})`}
          />
        </mask>
        <mask id={`hf-mask2-${k}`}>
          <rect
            x={0}
            y={0}
            width={geo.w}
            height={geo.h}
            fill={`url(#hf-foot-${k})`}
          />
        </mask>
      </defs>

      <g mask={`url(#hf-mask2-${k})`}>
        <g mask={`url(#hf-mask-${k})`}>
          {/* ── Atmosphere and depth ── */}
          <circle
            className={styles.coreGlow}
            cx={cx}
            cy={cy}
            r={geo.arcR * 1.5}
            fill={`url(#hf-core-${k})`}
          />
          <circle
            cx={geo.walkerX0 + geo.walkerStep}
            cy={geo.walkerBaseY + 20}
            r={geo.arcR * 0.9}
            fill={`url(#hf-care-${k})`}
          />
          <circle
            cx={scx}
            cy={scy}
            r={geo.arcR * 0.95}
            fill={`url(#hf-secure-${k})`}
          />

          <g className={styles.grid} mask={`url(#hf-gridmask-${k})`}>
            {Array.from({ length: Math.round(geo.w / 68) + 1 }, (_, i) => (
              <line
                key={`gv${i}`}
                x1={i * 68}
                y1={0}
                x2={i * 68}
                y2={geo.h}
              />
            ))}
            {Array.from({ length: Math.round(geo.h / 68) + 1 }, (_, i) => (
              <line
                key={`gh${i}`}
                x1={0}
                y1={i * 68}
                x2={geo.w}
                y2={i * 68}
              />
            ))}
          </g>

          {/* ── MOBILITYCARE: biomechanical Motion DNA ── */}
          <g className={styles.care}>
            {/* The capability arc this family's modules sit on. Inside the
                tone group, so it takes the family's colour. */}
            <path
              className={styles.arc}
              d={arcPath(geo.c, geo.arcR, geo.careArc[0], geo.careArc[1])}
            />
            {/* The joint-angle band, with each pose's own sample on it. */}
            <line
              className={styles.bandBase}
              x1={geo.axisX0}
              y1={geo.bandY}
              x2={geo.axisX1}
              y2={geo.bandY}
            />
            <path className={styles.joint} d={bandPath} />
            {bandNodes.map((n, i) => (
              <circle
                key={`bn${i}`}
                className={styles.bandNode}
                cx={n.x}
                cy={n.y.toFixed(1)}
                r={1.6}
              />
            ))}
            <line
              className={styles.ground}
              x1={geo.axisX0}
              y1={groundY}
              x2={geo.axisX1}
              y2={groundY}
            />
            {events.map((e, i) => (
              <Walker
                key={e.phase.id}
                phase={e.phase}
                x={e.x}
                baseY={geo.walkerBaseY}
                s={geo.walkerScale}
                order={i}
              />
            ))}

            {/* Cadence: the stride sampled against a clock. */}
            <line
              className={styles.axis}
              x1={geo.axisX0}
              y1={geo.axisY}
              x2={geo.axisX1}
              y2={geo.axisY}
            />
            {axisSamples.map((s, i) => (
              <line
                key={`as${i}`}
                className={styles.axisTick}
                x1={s.x.toFixed(1)}
                y1={geo.axisY}
                x2={s.x.toFixed(1)}
                y2={geo.axisY - s.h}
              />
            ))}
            {events.map((e, i) => (
              <g key={`ev${e.idx}`} style={{ "--hf-i": i } as CSSProperties}>
                <line
                  className={styles.eventStem}
                  x1={e.x}
                  y1={geo.axisY - 8}
                  x2={e.x}
                  y2={groundY + 4}
                />
                <circle
                  className={i === 0 ? styles.eventStrike : styles.eventNode}
                  cx={e.x}
                  cy={geo.axisY}
                  r={i === 0 ? 2.6 : 2}
                />
              </g>
            ))}

            {/* Module nodes on the care arc. */}
            {careNodes.map((n) => (
              <g key={n.label} style={{ "--hf-i": n.i } as CSSProperties}>
                <circle
                  className={styles.moduleNode}
                  cx={n.at[0].toFixed(1)}
                  cy={n.at[1].toFixed(1)}
                  r={2.4}
                />
                {geo.nodeLabels ? (
                  <text
                    className={styles.moduleLabel}
                    x={(n.at[0] - 8).toFixed(1)}
                    y={(n.at[1] + 3).toFixed(1)}
                    textAnchor="end"
                    style={{ fontSize: geo.nodeLabelSize } as CSSProperties}
                  >
                    {n.label}
                  </text>
                ) : null}
              </g>
            ))}
          </g>

          {/* ── SECUREVISION: anonymous spatial Motion DNA. No figure, no
                camera, no shield: trajectories, events and geometry only. ── */}
          <g className={styles.secure}>
            <path
              className={styles.arc}
              d={arcPath(geo.c, geo.arcR, geo.secureArc[0], geo.secureArc[1])}
            />
            <polygon
              className={styles.zone}
              points={zone.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}
            />
            {zone.map(([x, y], i) => (
              <g key={`zm${i}`} className={styles.zoneMark}>
                <line x1={x - 2.6} y1={y} x2={x + 2.6} y2={y} />
                <line x1={x} y1={y - 2.6} x2={x} y2={y + 2.6} />
              </g>
            ))}

            <g className={styles.vectors}>
              {SEC_VECTORS.map((p, i) => {
                const [x, y] = F(p);
                return (
                  <g key={i} transform={`rotate(${(-6 + p[1] * 12).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`}>
                    <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
                    <polyline
                      points={`${(x + 1.4).toFixed(1)},${(y - 2.4).toFixed(1)} ${(x + 5).toFixed(1)},${y.toFixed(1)} ${(x + 1.4).toFixed(1)},${(y + 2.4).toFixed(1)}`}
                    />
                  </g>
                );
              })}
            </g>

            <path className={styles.cross} d={smoothPath(cross)} />

            {tracks.map((t, i) => {
              const d = smoothPath(t);
              return (
                <g key={`t${i}`} style={{ "--hf-i": i } as CSSProperties}>
                  <path className={styles.track} d={d} />
                  <path className={styles.trackFlow} d={d} pathLength={100} />
                  <circle
                    className={styles.spatialNode}
                    cx={t[0][0].toFixed(1)}
                    cy={t[0][1].toFixed(1)}
                    r={2}
                  />
                  <circle
                    className={styles.spatialNode}
                    cx={t[t.length - 1][0].toFixed(1)}
                    cy={t[t.length - 1][1].toFixed(1)}
                    r={2}
                  />
                </g>
              );
            })}

            {/* The deviation: an ordinary approach, the continuation it was
                expected to follow, then the departure into the zone. */}
            <path className={styles.ghost} d={smoothPath(ghost)} />
            <path className={styles.anomaly} d={smoothPath(anomaly)} />
            <path
              className={styles.anomalyFlow}
              d={smoothPath(anomaly)}
              pathLength={100}
            />
            <circle
              className={styles.deviation}
              cx={deviation[0].toFixed(1)}
              cy={deviation[1].toFixed(1)}
              r={2.8}
            />
            <circle
              className={styles.alertPulse}
              cx={flagged[0].toFixed(1)}
              cy={flagged[1].toFixed(1)}
              r={4}
            />
            <circle
              className={styles.alert}
              cx={flagged[0].toFixed(1)}
              cy={flagged[1].toFixed(1)}
              r={2.4}
            />

            {/* Module nodes on the secure arc. */}
            {secureNodes.map((n) => (
              <g key={n.label} style={{ "--hf-i": n.i } as CSSProperties}>
                <circle
                  className={styles.moduleNode}
                  cx={n.at[0].toFixed(1)}
                  cy={n.at[1].toFixed(1)}
                  r={2.4}
                />
                {geo.nodeLabels ? (
                  <text
                    className={styles.moduleLabel}
                    x={(n.at[0] + 8).toFixed(1)}
                    y={(n.at[1] + 3).toFixed(1)}
                    style={{ fontSize: geo.nodeLabelSize } as CSSProperties}
                  >
                    {n.label}
                  </text>
                ) : null}
              </g>
            ))}
          </g>

          {/* ── Channels: the signal, changing colour along the travel ── */}
          <g className={styles.chIn}>
            <path className={styles.trace} d={inflow} stroke={`url(#hf-in-${k})`} />
            <path
              className={styles.traceSample}
              d={inflow}
              pathLength={100}
              stroke={`url(#hf-in-${k})`}
            />
            <path
              className={styles.traceFlowIn}
              d={inflow}
              pathLength={100}
              stroke={`url(#hf-in-${k})`}
            />
          </g>
          <g className={styles.chOut}>
            <path className={styles.trace} d={outflow} stroke={`url(#hf-out-${k})`} />
            <path
              className={styles.traceSample}
              d={outflow}
              pathLength={100}
              stroke={`url(#hf-out-${k})`}
            />
            <path
              className={styles.traceFlowOut}
              d={outflow}
              pathLength={100}
              stroke={`url(#hf-out-${k})`}
            />
          </g>

          {/* ── THE CORE ── processing rings that illuminate rather than spin,
                a radial sample ring, and one soft pulse per loop. */}
          <g>
            {geo.rings.map((rr, i) => (
              <circle
                key={rr}
                className={i === 0 ? styles.ringInner : styles.ringOuter}
                cx={cx}
                cy={cy}
                r={rr}
                style={{ "--hf-i": i } as CSSProperties}
              />
            ))}
            <g>
              {Array.from({ length: geo.sampleN }, (_, i) => {
                const a = (i / geo.sampleN) * 360 - 90;
                const h = strideHeight(i, geo.sampleAmp);
                const p0 = onCircle(geo.c, geo.sampleR, a);
                const p1 = onCircle(geo.c, geo.sampleR + h, a);
                return (
                  <line
                    key={i}
                    className={i % 12 === 0 ? styles.dnaStrong : styles.dnaTick}
                    style={{ "--hf-i": i } as CSSProperties}
                    x1={p0[0].toFixed(1)}
                    y1={p0[1].toFixed(1)}
                    x2={p1[0].toFixed(1)}
                    y2={p1[1].toFixed(1)}
                  />
                );
              })}
            </g>
            {/* No filled disc. Over the soft blue light behind it a fill read
                as a dark hole ringed by rays — a sun, which is the one thing
                this must not look like. The core is its two edges, a few
                internal processing nodes, and one pulse per loop. */}
            <circle className={styles.coreEdge} cx={cx} cy={cy} r={geo.r} />
            <circle
              className={styles.coreInner}
              cx={cx}
              cy={cy}
              r={(geo.r * 0.6).toFixed(1)}
            />
            {[
              { rx: geo.r * 0.72, ry: geo.r * 0.3, rot: -20, at: [0.12, 0.6] },
              { rx: geo.r * 0.46, ry: geo.r * 0.2, rot: 28, at: [0.4, 0.9] },
            ].map((orb, i) => (
              <g key={i} transform={`rotate(${orb.rot} ${cx} ${cy})`}>
                <ellipse
                  className={styles.orbit}
                  cx={cx}
                  cy={cy}
                  rx={orb.rx.toFixed(1)}
                  ry={orb.ry.toFixed(1)}
                />
                {orb.at.map((t, j) => (
                  <circle
                    key={j}
                    className={styles.orbitNode}
                    cx={(cx + Math.cos(t * Math.PI * 2) * orb.rx).toFixed(1)}
                    cy={(cy + Math.sin(t * Math.PI * 2) * orb.ry).toFixed(1)}
                    r={1.8}
                    style={{ "--hf-i": i * 2 + j } as CSSProperties}
                  />
                ))}
              </g>
            ))}
            <circle className={styles.corePulse} cx={cx} cy={cy} r={geo.r} />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function HeroMotionField() {
  return (
    <>
      <div className={styles.wide}>
        <Field variant="wide" />
      </div>
      <div className={styles.compact}>
        <Field variant="compact" />
      </div>
    </>
  );
}
