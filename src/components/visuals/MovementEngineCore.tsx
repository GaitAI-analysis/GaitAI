import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";
import styles from "./engine.module.css";

/**
 * The product ecosystem: two worlds feeding one engine.
 *
 *   MobilityCare  →  GaitAI Movement Intelligence Engine  →  SecureVision
 *
 * The centre is the focal point and is built as an actual instrument: a
 * counter-rotating dashed ring, a segmented tick ring, a radial Motion DNA
 * arc whose sample heights come from a stride function, two inclined orbit
 * paths carrying processing nodes, and a glowing core disc.
 *
 * The two worlds are deliberately different visual languages, and that
 * contrast carries the meaning:
 *
 *   MobilityCare — human gait. Real walking poses over a stride signal.
 *   SecureVision — anonymous spatial movement intelligence. A plan-view
 *     field of tracked paths, density contours, restricted-zone geometry and
 *     one flagged deviation. No people, no figures, no cameras: SecureVision
 *     is what movement analytics look like when nobody is identified.
 *
 * RESPONSIVE: the wide and stacked compositions are gated by media queries
 * *inside the CSS module*. They are deliberately NOT gated with Tailwind's
 * `hidden`/`sm:block` — those are single-class rules in the global sheet, the
 * module's own `display` rule is a single-class rule in a later sheet, and the
 * later one wins. That is what previously rendered both variants at once.
 */

type Variant = "wide" | "stacked";

/** Which world the reader is pointing at, if any. */
export type EngineFocus = "care" | "secure" | "engine" | null;

type Geometry = {
  key: string;
  w: number;
  h: number;
  /** Engine centre and core radius. */
  c: Pt;
  r: number;
  /** World centre (care family) and field radius. */
  world: Pt;
  worldR: number;
  /** Label baselines for the care world. */
  careLines: readonly [number, number, number];
  secureLines: readonly [number, number, number];
  /** Core text baselines. */
  coreLines: readonly [number, number, number, number];
  coreBrandSize: number;
  coreTitleSize: number;
  worldLabelSize: number;
  /** Walker scale and layout inside the care world. */
  walkerScale: number;
  walkerSpacing: number;
  stacked: boolean;
};

const WIDE: Geometry = {
  key: "w",
  w: 1240,
  h: 540,
  c: [620, 258],
  r: 116,
  world: [214, 258],
  worldR: 152,
  careLines: [92, 116, 134],
  secureLines: [92, 116, 134],
  coreLines: [228, 254, 276, 298],
  coreBrandSize: 11,
  coreTitleSize: 19,
  worldLabelSize: 21,
  walkerScale: 1.05,
  walkerSpacing: 74,
  stacked: false,
};

const STACKED: Geometry = {
  key: "s",
  w: 420,
  h: 940,
  c: [210, 470],
  r: 104,
  world: [210, 158],
  worldR: 132,
  careLines: [40, 62, 79],
  secureLines: [40, 62, 79],
  coreLines: [442, 466, 487, 508],
  coreBrandSize: 11,
  coreTitleSize: 18,
  worldLabelSize: 20,
  walkerScale: 0.92,
  walkerSpacing: 62,
  stacked: true,
};

/* ── Motion DNA: one stride, sampled ───────────────────────────────────────
   Twelve samples per gait cycle with the trailing half of the cycle lower.
   That left/right asymmetry is what makes the arc read as gait rather than as
   an equalizer. Deterministic, so server and client markup agree. */
function strideHeight(i: number, amplitude: number) {
  const inCycle = i % 12;
  const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
  const side = inCycle < 6 ? 1 : 0.62;
  return 2 + swing * amplitude * side;
}

/* ── SecureVision: an anonymous spatial movement field ─────────────────────
   No people, no skeletons, no figures, no cameras — the contrast with the
   MobilityCare side is the point. MobilityCare is human gait; SecureVision is
   a plan view of movement through a space: surveyed ground, density contours
   where flow concentrates, a restricted-area polygon, tracked paths that
   follow the expected flow, and one path that deviates into the zone.

   Tracks are declared as points in a normalized (u, v) field where u and v run
   -1..1 across the world. Declaring them as points rather than as hand-written
   Bézier strings is what lets the route intersections below be *computed* from
   the real geometry instead of eyeballed, so they stay correct at both the
   wide and the stacked size. */
type UV = readonly [number, number];

/* Paths following the expected flow. Individually varied — four identical
   bows is what made the previous version read as an audio waveform.

   Endpoints stop at |u| = 0.93 rather than 1. At 1 they land within a couple
   of pixels of the clip circle, which sliced the entry and exit event nodes
   into half-discs against the boundary. */
const SECURE_TRACKS: readonly (readonly UV[])[] = [
  [[-0.93, -0.58], [-0.5, -0.7], [0.05, -0.5], [0.58, -0.6], [0.93, -0.72]],
  [[-0.93, -0.05], [-0.46, 0.11], [0.1, -0.03], [0.6, 0.13], [0.93, 0.05]],
  [[-0.93, 0.6], [-0.44, 0.47], [0.12, 0.6], [0.62, 0.49], [0.93, 0.6]],
];

/** A cross-flow route, so the field has genuine crossings to mark. */
const SECURE_CROSS: readonly UV[] = [
  [-0.72, -0.92],
  [-0.3, -0.34],
  [0.08, 0.22],
  [0.46, 0.78],
];

/** The anomaly: enters on the expected flow, then veers into the zone. */
const SECURE_ANOMALY: readonly UV[] = [
  [-0.93, 0.24],
  [-0.52, 0.3],
  [-0.08, 0.36],
  [0.24, 0.6],
  [0.5, 0.78],
];

/** Where that path was expected to continue — drawn as a faint ghost so the
    deviation is legible as a deviation, not just as another line. */
const SECURE_EXPECTED: readonly UV[] = [
  [-0.08, 0.36],
  [0.34, 0.29],
  [0.72, 0.34],
  [0.93, 0.27],
];

/** Restricted-area perimeter. */
const SECURE_ZONE: readonly UV[] = [
  [0.1, 0.44],
  [0.78, 0.3],
  [0.9, 0.84],
  [0.16, 0.92],
];

/** Sparse flow vectors: position plus the local flow direction, in degrees. */
const SECURE_VECTORS: readonly UV[] = [
  [-0.66, -0.3],
  [-0.16, -0.78],
  [0.3, -0.26],
  [-0.62, 0.26],
  [0.72, -0.02],
  [-0.2, 0.76],
];

/** Catmull-Rom through the points, emitted as a smooth cubic path. */
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

/** Where segments ab and cd cross, or null. */
function segHit(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a[0] + t * rx, a[1] + t * ry];
}

/** Every crossing between two polylines. */
function polyHits(p: readonly Pt[], q: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    for (let j = 0; j < q.length - 1; j++) {
      const h = segHit(p[i], p[i + 1], q[j], q[j + 1]);
      if (h) out.push(h);
    }
  }
  return out;
}

/** A closed density isoline. The radius is perturbed deterministically so it
    reads as a contour rather than as a target ring or a radar sweep. */
function contour(cx: number, cy: number, rx: number, ry: number) {
  const pts: Pt[] = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const k = 1 + 0.17 * Math.sin(3 * a + 0.7) + 0.09 * Math.cos(2 * a - 0.3);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  return `${smoothPath([...pts, pts[0], pts[1]])} Z`;
}

/** A walking pose, drawn from the shared canonical gait events. */
function Walker({
  phase,
  prev,
  x,
  baseY,
  s,
  order,
}: {
  phase: GaitPhase;
  prev: GaitPhase;
  x: number;
  baseY: number;
  s: number;
  order: number;
}) {
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${px * s},${py * s}`).join(" ");
  const originY = baseY + phase.lift * s;

  return (
    <g
      className={styles.walker}
      transform={`translate(${x} ${originY})`}
      style={{ "--eng-i": order } as CSSProperties}
    >
      <g className={styles.walkerGhost}>
        <polyline points={pts(prev.nearLeg)} />
        <polyline points={pts(prev.nearArm)} />
      </g>
      <polyline className={styles.boneFar} points={pts(phase.farArm)} />
      <polyline className={styles.boneFar} points={pts(phase.farLeg)} />
      <path
        className={styles.bone}
        d={`M0 0 C${0.4 * s} ${-12 * s} ${0.9 * s} ${-24 * s} ${1.5 * s} ${-34 * s}`}
      />
      <circle
        className={styles.head}
        cx={GAIT_HEAD[0] * s}
        cy={GAIT_HEAD[1] * s}
        r={4.2 * s}
      />
      <polyline className={styles.bone} points={pts(phase.nearArm)} />
      <polyline className={styles.bone} points={pts(phase.nearLeg)} />
      <line
        className={styles.bone}
        x1={phase.nearFoot[0][0] * s}
        y1={phase.nearFoot[0][1] * s}
        x2={phase.nearFoot[1][0] * s}
        y2={phase.nearFoot[1][1] * s}
      />
      {[...phase.nearArm, ...phase.nearLeg, GAIT_NECK].map(([jx, jy], j) => (
        <circle
          key={j}
          className={styles.joint}
          cx={jx * s}
          cy={jy * s}
          r={1.9 * s}
        />
      ))}
    </g>
  );
}

export function MovementEngineCore({
  variant = "wide",
  focus = null,
  onFocus,
  className,
}: {
  variant?: Variant;
  focus?: EngineFocus;
  onFocus?: (focus: EngineFocus) => void;
  className?: string;
}) {
  const geo = variant === "stacked" ? STACKED : WIDE;
  const k = geo.key;
  const [cx, cy] = geo.c;
  const { r } = geo;

  const careCentre = geo.world;
  const secureCentre: Pt = geo.stacked
    ? [geo.world[0], 2 * cy - geo.world[1]]
    : [2 * cx - geo.world[0], geo.world[1]];

  /* ── Walking sequence inside the care world ── */
  const walkerIdx = geo.stacked ? [0, 2, 4] : [0, 2, 3, 4];
  const walkerBaseY = careCentre[1] - 6;
  const walkerX0 =
    careCentre[0] - ((walkerIdx.length - 1) * geo.walkerSpacing) / 2;

  /* ── The spatial movement field inside the secure world ──
     Normalized field coords -> absolute. The field is slightly wider than it
     is tall so the flow reads as directional; everything is clipped to the
     world circle, so no track can escape the disc at either size. */
  const fw = geo.worldR * 0.84;
  const fh = geo.worldR * 0.66;
  const F = ([u, v]: UV): Pt => [
    secureCentre[0] + u * fw,
    secureCentre[1] + v * fh,
  ];

  const tracks = SECURE_TRACKS.map((t) => t.map(F));
  const crossRoute = SECURE_CROSS.map(F);
  const anomaly = SECURE_ANOMALY.map(F);
  const expected = SECURE_EXPECTED.map(F);
  const zone = SECURE_ZONE.map(F);

  /* Real crossings, computed from the polylines above. */
  const junctions = [
    ...tracks.flatMap((t) => polyHits(t, crossRoute)),
    ...polyHits(anomaly, crossRoute),
  ];

  /* The deviation point is where the ghost continuation begins. */
  const deviation = expected[0];
  const flagged = anomaly[anomaly.length - 1];

  /* ── Flow traces: care -> engine -> secure ── */
  const inflow = [-0.42, 0, 0.42].map((t) => {
    if (geo.stacked) {
      const x = cx + t * 74;
      return `M${careCentre[0] + t * 74} ${careCentre[1] + geo.worldR} C${x} ${careCentre[1] + geo.worldR + 60} ${x} ${cy - r - 60} ${x} ${cy - r}`;
    }
    const y = cy + t * 74;
    return `M${careCentre[0] + geo.worldR} ${careCentre[1] + t * 74} C${careCentre[0] + geo.worldR + 70} ${y} ${cx - r - 70} ${y} ${cx - r} ${y}`;
  });

  const outflow = [-0.42, 0, 0.42].map((t) => {
    if (geo.stacked) {
      const x = cx + t * 74;
      return `M${x} ${cy + r} C${x} ${cy + r + 60} ${x} ${secureCentre[1] - geo.worldR - 60} ${secureCentre[0] + t * 74} ${secureCentre[1] - geo.worldR}`;
    }
    const y = cy + t * 74;
    return `M${cx + r} ${y} C${cx + r + 70} ${y} ${secureCentre[0] - geo.worldR - 70} ${secureCentre[1] + t * 74} ${secureCentre[0] - geo.worldR} ${secureCentre[1] + t * 74}`;
  });

  const worldLabel = (
    centre: Pt,
    lines: readonly [number, number, number],
    title: string,
    a: string,
    b: string,
    below: boolean,
  ) => {
    const [wx, wy] = centre;
    const base = below ? wy + geo.worldR + 34 : wy - geo.worldR - 46;
    const offs = below
      ? [0, 22, 39]
      : [lines[0] - lines[0], lines[1] - lines[0], lines[2] - lines[0]];
    return (
      <g>
        <text
          className={styles.worldLabel}
          x={wx}
          y={base + offs[0]}
          style={{ fontSize: geo.worldLabelSize } as CSSProperties}
        >
          {title}
        </text>
        <text className={styles.worldSub} x={wx} y={base + offs[1]}>
          {a}
        </text>
        <text className={styles.worldSub} x={wx} y={base + offs[2]}>
          {b}
        </text>
      </g>
    );
  };

  return (
    <svg
      role="img"
      aria-label="Two product families feeding one shared GaitAI movement intelligence engine: MobilityCare, shown as a human walking sequence over a stride signal, and SecureVision, shown as an abstract plan view of movement paths, density contours and a restricted zone with one flagged deviation."
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      data-focus={focus ?? "none"}
      className={`${styles.engine} ${
        geo.stacked ? styles.stackedOnly : styles.wideOnly
      } ${className ?? ""}`}
    >
      <defs>
        <radialGradient id={`eng-core-${k}`}>
          <stop offset="0" stopColor="#BFE9FF" stopOpacity="0.42" />
          <stop offset="0.5" stopColor="#4FD1FF" stopOpacity="0.14" />
          <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`eng-care-${k}`}>
          <stop offset="0.4" stopColor="#4FD1FF" stopOpacity="0.05" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`eng-secure-${k}`}>
          <stop offset="0.4" stopColor="#8B5CF6" stopOpacity="0.06" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
        </radialGradient>
        {/* The movement field is bounded by the world disc, so a track can
            never escape it at either composition size. */}
        <clipPath id={`eng-secure-clip-${k}`}>
          <circle
            cx={secureCentre[0]}
            cy={secureCentre[1]}
            r={geo.worldR - 1}
          />
        </clipPath>
      </defs>

      {/* ═══ MOBILITYCARE WORLD ═══ */}
      <g
        className={`${styles.world} ${styles.care}`}
        onMouseEnter={onFocus ? () => onFocus("care") : undefined}
        onMouseLeave={onFocus ? () => onFocus(null) : undefined}
      >
        <circle
          cx={careCentre[0]}
          cy={careCentre[1]}
          r={geo.worldR}
          fill={`url(#eng-care-${k})`}
        />
        <circle
          className={styles.worldRing}
          cx={careCentre[0]}
          cy={careCentre[1]}
          r={geo.worldR}
        />

        {/* Ground the walkers stand on. */}
        <line
          className={styles.ground}
          x1={careCentre[0] - geo.worldR * 0.82}
          y1={walkerBaseY + 48 * geo.walkerScale}
          x2={careCentre[0] + geo.worldR * 0.82}
          y2={walkerBaseY + 48 * geo.walkerScale}
        />

        {walkerIdx.map((idx, i) => (
          <Walker
            key={GAIT_PHASES[idx].id}
            phase={GAIT_PHASES[idx]}
            prev={GAIT_PHASES[(idx + GAIT_PHASES.length - 1) % GAIT_PHASES.length]}
            x={walkerX0 + i * geo.walkerSpacing}
            baseY={walkerBaseY}
            s={geo.walkerScale}
            order={i}
          />
        ))}

        {/* Mobility signal — stride sampling under the sequence. */}
        <g className={styles.mobilitySignal}>
          {Array.from({ length: 34 }, (_, i) => {
            const x =
              careCentre[0] - geo.worldR * 0.78 + (i * geo.worldR * 1.56) / 33;
            const h = strideHeight(i, 13);
            const y = walkerBaseY + 48 * geo.walkerScale + 30;
            return (
              <line
                key={i}
                className={i % 12 === 0 ? styles.sampleStrong : styles.sample}
                x1={x}
                y1={y - h}
                x2={x}
                y2={y + h * 0.5}
              />
            );
          })}
        </g>

        {worldLabel(
          careCentre,
          geo.careLines,
          "MobilityCare",
          "Movement intelligence",
          "for mobility & health",
          false,
        )}
      </g>

      {/* ═══ SECUREVISION WORLD ═══ */}
      <g
        className={`${styles.world} ${styles.secure}`}
        onMouseEnter={onFocus ? () => onFocus("secure") : undefined}
        onMouseLeave={onFocus ? () => onFocus(null) : undefined}
      >
        <circle
          cx={secureCentre[0]}
          cy={secureCentre[1]}
          r={geo.worldR}
          fill={`url(#eng-secure-${k})`}
        />
        <circle
          className={styles.worldRing}
          cx={secureCentre[0]}
          cy={secureCentre[1]}
          r={geo.worldR}
        />

        {/* Everything in the field is clipped to the world disc. */}
        <g clipPath={`url(#eng-secure-clip-${k})`}>
          {/* Surveyed ground — a faint plan grid, not a decorative pattern. */}
          <g className={styles.secGrid}>
            {[-0.66, -0.33, 0, 0.33, 0.66].map((u) => (
              <line
                key={`v${u}`}
                x1={F([u, -1])[0]}
                y1={F([u, -1])[1]}
                x2={F([u, 1])[0]}
                y2={F([u, 1])[1]}
              />
            ))}
            {[-0.6, -0.2, 0.2, 0.6].map((v) => (
              <line
                key={`h${v}`}
                x1={F([-1, v])[0]}
                y1={F([-1, v])[1]}
                x2={F([1, v])[0]}
                y2={F([1, v])[1]}
              />
            ))}
          </g>

          {/* Density contours where the flow concentrates. */}
          <g className={styles.secDensity}>
            {[1, 0.66, 0.36].map((s, i) => {
              const [dx, dy] = F([-0.42, -0.2]);
              return (
                <path
                  key={i}
                  className={styles.secContour}
                  d={contour(dx, dy, fw * 0.3 * s, fh * 0.34 * s)}
                />
              );
            })}
          </g>

          {/* Restricted-area perimeter, with survey marks at its vertices. */}
          <polygon
            className={styles.secZone}
            points={zone.map(([x, y]) => `${x},${y}`).join(" ")}
          />
          {zone.map(([x, y], i) => (
            <g key={`zm${i}`} className={styles.secZoneMark}>
              <line x1={x - 3.5} y1={y} x2={x + 3.5} y2={y} />
              <line x1={x} y1={y - 3.5} x2={x} y2={y + 3.5} />
            </g>
          ))}

          {/* Flow vectors — direction of the expected field. */}
          <g className={styles.secVectors}>
            {SECURE_VECTORS.map((p, i) => {
              const [x, y] = F(p);
              const ang = -7 + p[1] * 15;
              return (
                <g key={i} transform={`rotate(${ang.toFixed(1)} ${x} ${y})`}>
                  <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
                  <polyline
                    points={`${x + 1.6},${y - 2.6} ${x + 5},${y} ${x + 1.6},${y + 2.6}`}
                  />
                </g>
              );
            })}
          </g>

          {/* Tracked paths following the expected flow. */}
          {tracks.map((t, i) => {
            const d = smoothPath(t);
            return (
              <g key={`t${i}`} style={{ "--eng-i": i } as CSSProperties}>
                <path className={styles.secTrack} d={d} />
                <path className={styles.secTrackFlow} d={d} pathLength={100} />
              </g>
            );
          })}

          {/* Cross-flow route. */}
          <path className={styles.secCross} d={smoothPath(crossRoute)} />

          {/* Route intersections, at the computed crossings. */}
          {junctions.map(([x, y], i) => (
            <circle
              key={`j${i}`}
              className={styles.secJunction}
              cx={x}
              cy={y}
              r={3.4}
            />
          ))}

          {/* Anonymous event nodes at every track entry and exit. */}
          {tracks.map((t, i) => (
            <g key={`n${i}`}>
              <circle
                className={styles.secNode}
                cx={t[0][0]}
                cy={t[0][1]}
                r={2.4}
              />
              <circle
                className={styles.secNode}
                cx={t[t.length - 1][0]}
                cy={t[t.length - 1][1]}
                r={2.4}
              />
            </g>
          ))}

          {/* The anomaly: expected continuation as a ghost, actual path
              highlighted, deviation point and flagged event marked. */}
          <path className={styles.secGhost} d={smoothPath(expected)} />
          <path className={styles.secAnomaly} d={smoothPath(anomaly)} />
          <path
            className={styles.secAnomalyFlow}
            d={smoothPath(anomaly)}
            pathLength={100}
          />
          <circle
            className={styles.secDeviation}
            cx={deviation[0]}
            cy={deviation[1]}
            r={3.2}
          />
          <circle
            className={styles.secAlertPulse}
            cx={flagged[0]}
            cy={flagged[1]}
            r={5}
          />
          <circle
            className={styles.secAlert}
            cx={flagged[0]}
            cy={flagged[1]}
            r={3}
          />
        </g>

        {worldLabel(
          secureCentre,
          geo.secureLines,
          "SecureVision",
          "Movement intelligence",
          "for safety & security",
          geo.stacked,
        )}
      </g>

      {/* ═══ FLOW: care → engine → secure ═══ */}
      <g className={styles.care}>
        {inflow.map((d, i) => (
          <g key={i} style={{ "--eng-i": i } as CSSProperties}>
            <path className={styles.trace} d={d} />
            <path className={styles.traceIn} d={d} pathLength={100} />
          </g>
        ))}
      </g>
      <g className={styles.secure}>
        {outflow.map((d, i) => (
          <g key={i} style={{ "--eng-i": i } as CSSProperties}>
            <path className={styles.trace} d={d} />
            <path className={styles.traceOut} d={d} pathLength={100} />
          </g>
        ))}
      </g>

      {/* ═══ THE ENGINE ═══ */}
      <g
        className={styles.core}
        onMouseEnter={onFocus ? () => onFocus("engine") : undefined}
        onMouseLeave={onFocus ? () => onFocus(null) : undefined}
      >
        <circle
          className={styles.coreGlow}
          cx={cx}
          cy={cy}
          r={r * 1.85}
          fill={`url(#eng-core-${k})`}
        />

        {/* Outer counter-rotating dashed ring. */}
        <circle className={styles.ringSpin} cx={cx} cy={cy} r={r + 58} />
        {/* Second ring, opposite direction. */}
        <circle className={styles.ringSpinBack} cx={cx} cy={cy} r={r + 44} />

        {/* Segmented radial ticks. */}
        <g className={styles.ticks}>
          {Array.from({ length: 72 }, (_, i) => {
            const a = (i / 72) * Math.PI * 2;
            const r0 = r + 24;
            const r1 = r0 + (i % 6 === 0 ? 11 : 5);
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * r0}
                y1={cy + Math.sin(a) * r0}
                x2={cx + Math.cos(a) * r1}
                y2={cy + Math.sin(a) * r1}
              />
            );
          })}
        </g>

        {/* Motion DNA, wrapped around the core: the stride signal the engine
            is processing, drawn radially instead of as a detached strip. */}
        <g className={styles.dna}>
          {Array.from({ length: 96 }, (_, i) => {
            const a = (i / 96) * Math.PI * 2 - Math.PI / 2;
            const h = strideHeight(i, 15);
            const r0 = r + 6;
            return (
              <line
                key={i}
                className={i % 12 === 0 ? styles.dnaStrong : styles.dnaTick}
                x1={cx + Math.cos(a) * r0}
                y1={cy + Math.sin(a) * r0}
                x2={cx + Math.cos(a) * (r0 + h)}
                y2={cy + Math.sin(a) * (r0 + h)}
              />
            );
          })}
        </g>

        {/* Inclined internal orbits carrying processing nodes. */}
        {/* Processing nodes sit on the orbits rather than travelling them:
            SMIL <animateMotion> ignores prefers-reduced-motion, and the core
            already carries the rings, the DNA rotation and the pulse. */}
        {[
          { rx: r * 0.74, ry: r * 0.3, rot: -18, at: [0.15, 0.62] },
          { rx: r * 0.56, ry: r * 0.24, rot: 26, at: [0.4, 0.88] },
        ].map((o, i) => (
          <g key={i} transform={`rotate(${o.rot} ${cx} ${cy})`}>
            <ellipse className={styles.orbit} cx={cx} cy={cy} rx={o.rx} ry={o.ry} />
            {o.at.map((t, j) => {
              const a = t * Math.PI * 2;
              return (
                <circle
                  key={j}
                  className={styles.orbitNode}
                  cx={cx + Math.cos(a) * o.rx}
                  cy={cy + Math.sin(a) * o.ry}
                  r={2.4}
                  style={{ "--eng-i": i * 2 + j } as CSSProperties}
                />
              );
            })}
          </g>
        ))}

        <circle className={styles.coreDisc} cx={cx} cy={cy} r={r} />
        <circle className={styles.coreEdge} cx={cx} cy={cy} r={r} />
        <circle className={styles.corePulse} cx={cx} cy={cy} r={r} />

        <text
          className={styles.coreBrand}
          x={cx}
          y={geo.coreLines[0]}
          style={{ fontSize: geo.coreBrandSize } as CSSProperties}
        >
          GaitAI
        </text>
        {["Movement", "Intelligence", "Engine"].map((word, i) => (
          <text
            key={word}
            className={styles.coreTitle}
            x={cx}
            y={geo.coreLines[i + 1]}
            style={{ fontSize: geo.coreTitleSize } as CSSProperties}
          >
            {word}
          </text>
        ))}
      </g>
    </svg>
  );
}
