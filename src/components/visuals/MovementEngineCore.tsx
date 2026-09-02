import type { CSSProperties } from "react";
import styles from "./engine.module.css";

/**
 * "One engine. Two product worlds." — the ecosystem core for /products/.
 *
 * Three overlapping fields: a cyan MobilityCare lobe, a violet SecureVision
 * lobe, and between them a layered radial core — a slowly counter-rotating
 * dashed ring, a tick ring, and a glowing disc carrying the engine's name.
 * Traces run inward from each lobe into the core, each carrying a travelling
 * sample, so the composition reads as two worlds feeding one engine rather
 * than as three decorative circles.
 *
 * Geometry is mirrored about the core (x -> w - x), so the two sides cannot
 * drift apart. All motion is CSS and stops under prefers-reduced-motion.
 */

type Pt = readonly [number, number];

type Geometry = {
  key: string;
  w: number;
  h: number;
  /** Core centre and disc radius. */
  c: Pt;
  r: number;
  /** Lobe centre (left family) and radius. */
  lobe: Pt;
  lobeR: number;
  /** Baselines for the lobe label block, left family. */
  lobeLines: readonly [number, number, number];
  /** Baselines inside the core disc. */
  coreLines: readonly [number, number, number, number];
  /** Inward traces, left family — each a start point on the lobe side. */
  traces: readonly Pt[];
  /** Gait sample strip under the composition. */
  sampleY: number;
  sampleFrom: number;
  sampleTo: number;
  vertical: boolean;
};

const DESKTOP: Geometry = {
  key: "d",
  w: 900,
  h: 350,
  c: [450, 168],
  r: 84,
  lobe: [268, 168],
  lobeR: 116,
  lobeLines: [156, 180, 194],
  coreLines: [146, 166, 182, 198],
  traces: [
    [352, 132],
    [352, 168],
    [352, 204],
  ],
  sampleY: 300,
  sampleFrom: 150,
  sampleTo: 750,
  vertical: false,
};

/** Mobile stacks the two worlds above and below the core so labels stay legible. */
const COMPACT: Geometry = {
  key: "c",
  w: 360,
  h: 520,
  c: [180, 260],
  r: 74,
  lobe: [180, 96],
  lobeR: 84,
  lobeLines: [84, 106, 120],
  coreLines: [238, 258, 274, 290],
  traces: [
    [148, 176],
    [180, 176],
    [212, 176],
  ],
  sampleY: 476,
  sampleFrom: 40,
  sampleTo: 320,
  vertical: true,
};

/**
 * Sampled stride strip. Twelve samples per cycle with the trailing half of the
 * cycle lower — the left/right asymmetry is what makes this read as gait
 * rather than as a waveform. Deterministic, so SSR and client agree.
 */
function strideSamples(geo: Geometry) {
  const out: Array<{ x: number; h: number; strong: boolean }> = [];
  const step = 9;
  const count = Math.floor((geo.sampleTo - geo.sampleFrom) / step);
  for (let i = 0; i <= count; i += 1) {
    const inCycle = i % 12;
    const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
    const side = inCycle < 6 ? 1 : 0.66;
    out.push({
      x: geo.sampleFrom + i * step,
      h: Math.round((3 + swing * 16 * side) * 10) / 10,
      strong: inCycle === 0,
    });
  }
  return out;
}

/** Mirror a left-family point about the core axis. */
function mirror(geo: Geometry, [x, y]: Pt): Pt {
  return geo.vertical ? [x, 2 * geo.c[1] - y] : [2 * geo.c[0] - x, y];
}

export function MovementEngineCore({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const geo = compact ? COMPACT : DESKTOP;
  const k = geo.key;
  const [cx, cy] = geo.c;
  const samples = strideSamples(geo);

  const sides = [
    {
      id: "care",
      tone: styles.care,
      label: "MobilityCare",
      lines: ["Movement intelligence", "for mobility & health"],
      centre: geo.lobe,
      traces: geo.traces,
    },
    {
      id: "secure",
      tone: styles.secure,
      label: "SecureVision",
      lines: ["Movement intelligence", "for safety & security"],
      centre: mirror(geo, geo.lobe),
      traces: geo.traces.map((p) => mirror(geo, p)),
    },
  ] as const;

  return (
    <svg
      role="img"
      aria-label="Two product families — MobilityCare and SecureVision — feeding one shared GaitAI movement intelligence engine."
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      className={`${styles.engine} ${className ?? ""}`}
    >
      <defs>
        <radialGradient id={`eng-core-${k}`}>
          <stop offset="0" stopColor="#BFE9FF" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#4FD1FF" stopOpacity="0.18" />
          <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`eng-care-${k}`}>
          <stop offset="0.55" stopColor="#4FD1FF" stopOpacity="0" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id={`eng-secure-${k}`}>
          <stop offset="0.55" stopColor="#7C3AED" stopOpacity="0" />
          <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.12" />
        </radialGradient>
      </defs>

      {/* ── The two worlds ── */}
      {sides.map((side) => {
        const [lx, ly] = side.centre;
        const lines = geo.vertical && side.id === "secure"
          ? geo.lobeLines.map((y) => 2 * cy - y)
          : geo.lobeLines;
        return (
          <g key={side.id} className={side.tone}>
            <circle
              className={styles.lobeFill}
              cx={lx}
              cy={ly}
              r={geo.lobeR}
              fill={`url(#eng-${side.id}-${k})`}
            />
            <circle className={styles.lobeRing} cx={lx} cy={ly} r={geo.lobeR} />
            <text className={styles.lobeLabel} x={lx} y={lines[0]}>
              {side.label}
            </text>
            <text className={styles.lobeSub} x={lx} y={lines[1]}>
              {side.lines[0]}
            </text>
            <text className={styles.lobeSub} x={lx} y={lines[2]}>
              {side.lines[1]}
            </text>

            {/* Traces running inward into the core. */}
            {side.traces.map(([sx, sy], i) => {
              const midX = (sx + cx) / 2;
              const midY = (sy + cy) / 2;
              const d = geo.vertical
                ? `M${sx} ${sy} C${sx} ${midY} ${cx} ${midY} ${cx} ${sy > cy ? cy + geo.r : cy - geo.r}`
                : `M${sx} ${sy} C${midX} ${sy} ${midX} ${cy} ${sx > cx ? cx + geo.r : cx - geo.r} ${cy}`;
              return (
                <g key={i} style={{ "--eng-i": i } as CSSProperties}>
                  <path className={styles.trace} d={d} />
                  <path className={styles.traceFlow} d={d} pathLength={100} />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── The engine ── */}
      <g className={styles.core}>
        <circle
          className={styles.coreGlow}
          cx={cx}
          cy={cy}
          r={geo.r * 1.75}
          fill={`url(#eng-core-${k})`}
        />
        <circle className={styles.coreSpin} cx={cx} cy={cy} r={geo.r + 22} />
        <g className={styles.coreTicks}>
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const r0 = geo.r + 9;
            const r1 = r0 + (i % 4 === 0 ? 7 : 3.5);
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
        <circle className={styles.coreDisc} cx={cx} cy={cy} r={geo.r} />
        <circle className={styles.coreEdge} cx={cx} cy={cy} r={geo.r} />

        <text className={styles.coreBrand} x={cx} y={geo.coreLines[0]}>
          GaitAI
        </text>
        <text className={styles.coreTitle} x={cx} y={geo.coreLines[1]}>
          Movement
        </text>
        <text className={styles.coreTitle} x={cx} y={geo.coreLines[2]}>
          Intelligence
        </text>
        <text className={styles.coreTitle} x={cx} y={geo.coreLines[3]}>
          Engine
        </text>
      </g>

      {/* ── Sampled stride strip ── */}
      <g className={styles.samples}>
        {samples.map((s, i) => (
          <line
            key={i}
            className={s.strong ? styles.sampleStrong : styles.sample}
            x1={s.x}
            y1={geo.sampleY - s.h}
            x2={s.x}
            y2={geo.sampleY + s.h * 0.5}
          />
        ))}
      </g>
    </svg>
  );
}
