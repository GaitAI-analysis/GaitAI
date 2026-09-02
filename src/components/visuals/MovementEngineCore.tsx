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
 * paths carrying processing nodes, and a glowing core disc. The left world
 * shows real walking poses over a mobility signal; the right world shows
 * multiple trajectories with cross-camera correspondence links.
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

  /* ── Trajectories inside the secure world ── */
  const trajectories = [-0.62, -0.2, 0.22, 0.6].map((t, i) => {
    const [sx, sy] = secureCentre;
    const spread = geo.worldR * 0.74;
    const x0 = sx - spread;
    const x1 = sx + spread;
    const y = sy + t * geo.worldR * 0.5;
    const bow = (i % 2 === 0 ? -1 : 1) * (16 + i * 5);
    return {
      d: `M${x0} ${y} C${x0 + spread * 0.7} ${y + bow} ${x1 - spread * 0.7} ${y - bow} ${x1} ${y}`,
      nodes: [
        [x0, y],
        [sx, y + bow * 0.12],
        [x1, y],
      ] as Pt[],
    };
  });

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
      aria-label="MobilityCare and SecureVision, two product families whose movement signals feed one shared GaitAI movement intelligence engine."
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

        {trajectories.map((t, i) => (
          <g key={i} style={{ "--eng-i": i } as CSSProperties}>
            <path className={styles.path} d={t.d} />
            <path className={styles.pathFlow} d={t.d} pathLength={100} />
            {t.nodes.map(([nx, ny], j) => (
              <circle
                key={j}
                className={j === 1 ? styles.pathNodeMid : styles.pathNode}
                cx={nx}
                cy={ny}
                r={j === 1 ? 2 : 2.6}
              />
            ))}
          </g>
        ))}

        {/* Cross-camera correspondence — the same movement seen twice. */}
        {trajectories.slice(0, 3).map((t, i) => {
          const a = t.nodes[1];
          const b = trajectories[i + 1].nodes[1];
          return (
            <line
              key={`c${i}`}
              className={styles.correspondence}
              x1={a[0]}
              y1={a[1]}
              x2={b[0]}
              y2={b[1]}
            />
          );
        })}

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
