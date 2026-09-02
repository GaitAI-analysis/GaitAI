import type { CSSProperties } from "react";

/**
 * "One platform. Two worlds." — the hub the environment rails hang off.
 *
 * The core is a stack of radial rings (a slowly counter-rotating dashed ring,
 * a tick ring, a translucent disc) with the platform statement set inside it.
 * Two trunk branches leave the disc at its lower shoulders and sweep outward
 * and down: cyan/teal to MobilityCare on the left, royal/violet to
 * SecureVision on the right. Each trunk ends in a glowing entry node exactly
 * where its column's rail begins, so the panels below are visibly hanging off
 * the hub rather than merely sitting under it. Three shorter branches per side
 * fan between the trunk and the hub and fade out — the environments the trunk
 * carries that the teaser doesn't name.
 *
 * Every path is built from a point list through one Catmull-Rom smoother, so
 * the right-hand family is the left one mirrored (x → w − x) and the two sides
 * cannot drift apart. All motion is CSS, in globals.css.
 */

type Pt = readonly [number, number];

type Geometry = {
  key: string;
  w: number;
  h: number;
  /** Hub centre and disc radius. */
  c: Pt;
  r: number;
  ringGap: number;
  tickCount: number;
  /** Title / subtitle / mono baselines. */
  lines: readonly [number, number, number];
  titleSize: number;
  monoSize: number;
  /** Left-family branches, outermost (the trunk) first. */
  branches: readonly Pt[][];
  /** Count label position, left family. */
  countAt: Pt;
};

const round = (n: number) => Math.round(n * 10) / 10;

/** Smooth path through a point list (Catmull-Rom → cubic Bézier). */
function smooth(pts: readonly Pt[]) {
  if (pts.length < 2) return "";
  let d = `M${round(pts[0][0])} ${round(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(
      p2[0],
    )} ${round(p2[1])}`;
  }
  return d;
}

const mirror = (pts: readonly Pt[], w: number): Pt[] => pts.map(([x, y]) => [w - x, y]);

const DESKTOP: Geometry = {
  key: "d",
  w: 1000,
  h: 320,
  c: [500, 116],
  r: 64,
  ringGap: 9,
  tickCount: 28,
  lines: [98, 120, 142],
  titleSize: 14,
  monoSize: 8.5,
  branches: [
    // The trunk, ending exactly on the column's rail (x = 0 → container edge).
    [
      [455, 161],
      [400, 196],
      [330, 222],
      [240, 248],
      [120, 276],
      [0, 292],
    ],
    // Three shorter branches: one above the trunk, one along it, one dropping
    // below it — the fan reads as a family rather than as a frayed cable.
    [
      [455, 161],
      [408, 200],
      [340, 214],
      [262, 226],
    ],
    [
      [455, 161],
      [414, 190],
      [372, 200],
      [330, 208],
    ],
    [
      [455, 161],
      [432, 204],
      [418, 238],
      [402, 266],
    ],
  ],
  countAt: [22, 264],
};

const COMPACT: Geometry = {
  key: "c",
  w: 360,
  h: 262,
  c: [180, 96],
  r: 58,
  ringGap: 8,
  tickCount: 22,
  lines: [84, 103, 124],
  titleSize: 12.5,
  monoSize: 7.5,
  branches: [
    [
      [139, 137],
      [116, 166],
      [92, 188],
      [58, 212],
      [24, 232],
      [0, 240],
    ],
    [
      [139, 137],
      [118, 160],
      [96, 170],
      [74, 178],
    ],
    [
      [139, 137],
      [128, 168],
      [120, 192],
      [112, 214],
    ],
  ],
  countAt: [22, 252],
};

/** Full class names, written out — Tailwind drops @layer rules it can't find. */
const FAMILY_CLASS = {
  care: "env-family env-family--care",
  secure: "env-family env-family--secure",
} as const;

function Family({
  side,
  geo,
  count,
}: {
  side: "care" | "secure";
  geo: Geometry;
  count: number;
}) {
  const isCare = side === "care";
  const branches = geo.branches.map((pts) => (isCare ? pts : mirror(pts, geo.w)));
  const [countX, countY] = isCare
    ? geo.countAt
    : ([geo.w - geo.countAt[0], geo.countAt[1]] as const);
  const trunk = branches[0];
  const entry = trunk[trunk.length - 1];
  const port = trunk[0];

  return (
    <g className={FAMILY_CLASS[side]}>
      {/* Inside the family group, so `currentColor` is this family's accent —
          which the light theme re-points in one place. */}
      <linearGradient
        id={`env-trunk-${side}-${geo.key}`}
        x1={isCare ? "1" : "0"}
        x2={isCare ? "0" : "1"}
      >
        <stop offset="0" stopColor="currentColor" stopOpacity="0.9" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
      </linearGradient>
      {/* The fan keeps a faint tail so its tip node never reads as a detached
          dot. */}
      <linearGradient
        id={`env-fan-${side}-${geo.key}`}
        x1={isCare ? "1" : "0"}
        x2={isCare ? "0" : "1"}
      >
        <stop offset="0" stopColor="currentColor" stopOpacity="0.6" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.22" />
      </linearGradient>

      {/* Port on the hub shoulder this family leaves from. */}
      <circle className="env-port" cx={port[0]} cy={port[1]} r={4.4} />
      <circle className="env-port-dot" cx={port[0]} cy={port[1]} r={1.7} />

      {branches.map((pts, i) => {
        const d = smooth(pts);
        const tip = pts[pts.length - 1];
        const isTrunk = i === 0;
        return (
          <g key={i} style={{ "--env-i": i } as CSSProperties}>
            <path
              className={isTrunk ? "env-trace env-trace--trunk" : "env-trace"}
              d={d}
              stroke={`url(#${
                isTrunk ? `env-trunk-${side}-${geo.key}` : `env-fan-${side}-${geo.key}`
              })`}
            />
            {/* pathLength normalises the sweep so one keyframe set drives every
                branch regardless of its real length. */}
            <path
              className={isTrunk ? "env-flow env-flow--trunk" : "env-flow"}
              d={d}
              pathLength={100}
            />
            {!isTrunk && <circle className="env-tip" cx={tip[0]} cy={tip[1]} r={2.2} />}
          </g>
        );
      })}

      {/* Entry node — where the column's rail starts. */}
      <circle className="env-entry-halo" cx={entry[0]} cy={entry[1]} r={12} />
      <circle className="env-entry-ring" cx={entry[0]} cy={entry[1]} r={6} />
      <circle className="env-entry-dot" cx={entry[0]} cy={entry[1]} r={2.4} />

      <text
        className="env-mono env-count"
        x={countX}
        y={countY}
        fontSize={geo.monoSize}
        textAnchor={isCare ? "start" : "end"}
      >
        {count} ENVIRONMENTS
      </text>
    </g>
  );
}

export function PlatformHub({
  careCount,
  secureCount,
  total,
  compact = false,
  className,
}: {
  careCount: number;
  secureCount: number;
  total: number;
  compact?: boolean;
  className?: string;
}) {
  const geo = compact ? COMPACT : DESKTOP;
  const k = geo.key;
  const [cx, cy] = geo.c;
  const { r, ringGap } = geo;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      className={`env-hub${compact ? " env-hub--compact" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <defs>
        <radialGradient id={`env-halo-${k}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.22" />
          <stop offset="0.55" stopColor="#2563FF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`env-disc-${k}`} cx="50%" cy="18%" r="80%">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.16" />
          <stop offset="0.6" stopColor="#2563FF" stopOpacity="0.08" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.1" />
        </radialGradient>
        <linearGradient id={`env-hub-text-${k}`} x1="0" x2="1">
          <stop offset="0" stopColor="#4FD1FF" />
          <stop offset="0.55" stopColor="#8FAFFF" />
          <stop offset="1" stopColor="#BD96F6" />
        </linearGradient>
      </defs>

      {/* ── Field ── */}
      <circle
        className="env-halo"
        cx={cx}
        cy={cy}
        r={r * 2.4}
        fill={`url(#env-halo-${k})`}
      />

      {/* Tick ring */}
      <g className="env-ticks">
        {Array.from({ length: geo.tickCount }).map((_, i) => {
          const deg = (i / geo.tickCount) * 360;
          const rad = (deg * Math.PI) / 180;
          const inner = r + ringGap * 2.6;
          const outer = inner + (i % 7 === 0 ? 9 : 5);
          return (
            <line
              key={i}
              className={i % 7 === 0 ? "env-tick env-tick--major" : "env-tick"}
              x1={round(cx + inner * Math.cos(rad))}
              y1={round(cy + inner * Math.sin(rad))}
              x2={round(cx + outer * Math.cos(rad))}
              y2={round(cy + outer * Math.sin(rad))}
            />
          );
        })}
      </g>

      {/* Rings — the outer one counter-rotates, slowly. */}
      <circle className="env-ring-spin" cx={cx} cy={cy} r={r + ringGap * 1.6} />
      <circle className="env-ring" cx={cx} cy={cy} r={r + ringGap * 0.75} />

      {/* Layered translucent core */}
      <circle className="env-disc" cx={cx} cy={cy} r={r} fill={`url(#env-disc-${k})`} />
      <circle className="env-disc-rim" cx={cx} cy={cy} r={r} />
      <circle className="env-disc-inner" cx={cx} cy={cy} r={r - 10} />

      <text
        className="env-hub-title"
        x={cx}
        y={geo.lines[0]}
        fontSize={geo.titleSize}
        textAnchor="middle"
      >
        One platform.
      </text>
      <text
        className="env-hub-title"
        x={cx}
        y={geo.lines[1]}
        fontSize={geo.titleSize}
        textAnchor="middle"
        fill={`url(#env-hub-text-${k})`}
      >
        Two worlds.
      </text>
      <text
        className="env-mono"
        x={cx}
        y={geo.lines[2]}
        fontSize={geo.monoSize}
        textAnchor="middle"
      >
        {total} ENVIRONMENTS
      </text>

      {/* ── The two families ── */}
      <Family side="care" geo={geo} count={careCount} />
      <Family side="secure" geo={geo} count={secureCount} />
    </svg>
  );
}
