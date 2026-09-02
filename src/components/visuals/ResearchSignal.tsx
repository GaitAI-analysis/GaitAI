import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";

/**
 * Research → engine → capability, drawn rather than described.
 *
 * The diagram carries three zones and two kinds of line, and the distinction
 * between the two line kinds is the whole point:
 *
 *   ── solid ──   the DATA path.  Walking is captured as motion-capture poses,
 *                 sampled into a gait signal, and fed into the movement engine.
 *   ── dashed ──  the EVIDENCE path.  Each published research area sits on the
 *                 flowing signal band across the top and drops a dashed trace
 *                 into the engine: published work grounds the engine, it does
 *                 not flow through it.
 *
 * Out of the engine, solid traces fan to the capabilities the record actually
 * backs. Every label is real: research area titles and record counts come from
 * `researchAreas` (derived from publications.ts), capability titles from the
 * GaitScape graph. Nothing numeric is invented — there is no frame rate, no
 * accuracy, no latency anywhere in the drawing, because none is published.
 *
 * Geometry is deterministic (a stride function, not randomness) so server and
 * client markup match, and every animation is CSS in globals.css — this stays
 * a server component and honours prefers-reduced-motion in one place.
 */

export type ResearchSignalArea = {
  id: string;
  /** Research area title, as published. */
  title: string;
  /** Papers + patent records backing the area. */
  records: number;
};

export type ResearchSignalCapability = {
  id: string;
  title: string;
  /** Distinct records reaching this capability through its research areas. */
  records: number;
};

/** The four engine layers, in the order the pipeline runs them. */
const ENGINE_LAYERS = [
  { id: "pose", label: "Pose skeleton", motif: "skeleton" },
  { id: "features", label: "Gait features", motif: "samples" },
  { id: "models", label: "Model layer", motif: "graph" },
  { id: "edge", label: "Edge · privacy", motif: "shield" },
] as const;

type Motif = (typeof ENGINE_LAYERS)[number]["motif"];

type Geometry = {
  /** Suffix for gradient ids — two variants render at once. */
  key: string;
  w: number;
  h: number;
  band: {
    y: number;
    from: number;
    to: number;
    amp: number;
    cycle: number;
    step: number;
    /** Research-area node x positions, left to right. */
    nodeX: readonly number[];
    /** Title baseline; omitted in the compact variant, which has no room. */
    titleY?: number;
    countY: number;
    titleSize: number;
    countSize: number;
  };
  stack: {
    cx: number;
    /** Centre of the top plate. */
    cy0: number;
    gap: number;
    /** Half width / half height of each isometric plate. */
    hw: number;
    hh: number;
    /** Extrusion depth under each plate. */
    depth: number;
    labelSize: number;
  };
  capture: {
    frame: readonly [number, number, number, number];
    labelY: number;
    walkers: readonly { phase: number; x: number }[];
    s: number;
    baseY: number;
    sampleY: number;
    sampleFrom: number;
    sampleTo: number;
    sampleStep: number;
    /** Where the sampled signal leaves the capture frame. */
    exit: Pt;
    /** Which plate vertex the data path enters: "left" or "right". */
    enters: "left" | "right";
  };
  caps: {
    /** Output bus node, where capability traces originate. */
    bus: Pt;
    x: number;
    ys: readonly number[];
    labelDx: number;
    labelSize: number;
    countSize: number;
  };
  /**
   * Compact only: x of the column the evidence traces gather into before
   * turning into the stack, so they route around the capture frame instead of
   * crossing it. Undefined = converge directly (there is room on desktop).
   */
  evidenceGather?: number;
  /** Zone ruler along the bottom. */
  ruler?: {
    y: number;
    zones: readonly { label: string; from: number; to: number }[];
    size: number;
  };
};

const DESKTOP: Geometry = {
  key: "d",
  w: 1000,
  h: 470,
  band: {
    y: 70,
    from: 14,
    to: 986,
    amp: 17,
    cycle: 124,
    step: 6,
    nodeX: [128, 372, 616, 860],
    titleY: 26,
    countY: 41,
    titleSize: 11.5,
    countSize: 9,
  },
  stack: { cx: 520, cy0: 190, gap: 56, hw: 132, hh: 34, depth: 8, labelSize: 11.5 },
  capture: {
    frame: [20, 168, 318, 412],
    labelY: 188,
    walkers: [
      { phase: 0, x: 96 },
      { phase: 2, x: 196 },
    ],
    s: 0.92,
    baseY: 248,
    sampleY: 356,
    sampleFrom: 44,
    sampleTo: 298,
    sampleStep: 8.4,
    exit: [304, 356],
    enters: "left",
  },
  caps: {
    bus: [668, 302],
    x: 724,
    ys: [176, 220, 264, 308, 352, 396],
    labelDx: 15,
    labelSize: 11.5,
    countSize: 9,
  },
  ruler: {
    y: 442,
    zones: [
      { label: "Capture", from: 20, to: 318 },
      { label: "Movement engine", from: 388, to: 652 },
      { label: "Capabilities", from: 712, to: 986 },
    ],
    size: 9,
  },
};

const COMPACT: Geometry = {
  key: "c",
  w: 360,
  h: 664,
  band: {
    y: 44,
    from: 10,
    to: 350,
    amp: 12,
    cycle: 88,
    step: 5,
    nodeX: [50, 150, 250, 334],
    countY: 72,
    titleSize: 10,
    countSize: 8.5,
  },
  stack: { cx: 180, cy0: 246, gap: 52, hw: 96, hh: 26, depth: 6, labelSize: 10 },
  capture: {
    frame: [14, 84, 300, 216],
    labelY: 100,
    walkers: [
      { phase: 0, x: 70 },
      { phase: 2, x: 142 },
    ],
    s: 0.72,
    baseY: 134,
    sampleY: 196,
    sampleFrom: 26,
    sampleTo: 248,
    sampleStep: 7.4,
    exit: [252, 196],
    enters: "right",
  },
  evidenceGather: 318,
  caps: {
    bus: [180, 444],
    x: 44,
    ys: [480, 512, 544, 576, 608, 640],
    labelDx: 14,
    labelSize: 10.5,
    countSize: 8.5,
  },
};

/* ────────────────────────────── signal maths ───────────────────────────── */

/**
 * Height of the flowing research signal at x. Three harmonics with the second
 * half of each stride damped — the left/right asymmetry is what makes the
 * trace read as gait rather than as an audio waveform.
 */
function signalAt(x: number, geo: Geometry) {
  const { from, cycle, amp, y } = geo.band;
  const t = (x - from) / cycle;
  const phase = t - Math.floor(t);
  const damp = phase < 0.5 ? 1 : 0.72;
  const v =
    Math.sin(t * Math.PI * 2) * 0.62 +
    Math.sin(t * Math.PI * 4 + 0.6) * 0.28 +
    Math.sin(t * Math.PI * 6) * 0.1;
  return y - v * amp * damp;
}

/** Smooth path through the sampled signal (mid-point quadratic smoothing). */
function signalPath(geo: Geometry) {
  const { from, to, step } = geo.band;
  const pts: Pt[] = [];
  for (let x = from; x <= to; x += step) pts.push([x, signalAt(x, geo)]);
  if (pts[pts.length - 1][0] < to) pts.push([to, signalAt(to, geo)]);

  let d = `M${round(pts[0][0])} ${round(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const [cxp, cyp] = pts[i];
    const [nx, ny] = pts[i + 1];
    d += `Q${round(cxp)} ${round(cyp)} ${round((cxp + nx) / 2)} ${round((cyp + ny) / 2)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${round(last[0])} ${round(last[1])}`;
  return d;
}

const round = (n: number) => Math.round(n * 10) / 10;

/** Sampled stride bars under the capture frame. */
function captureSamples(geo: Geometry) {
  const { sampleFrom, sampleTo, sampleStep } = geo.capture;
  const out: { x: number; h: number; strong: boolean }[] = [];
  const count = Math.floor((sampleTo - sampleFrom) / sampleStep);
  for (let i = 0; i <= count; i += 1) {
    const inCycle = i % 12;
    const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
    const side = inCycle < 6 ? 1 : 0.66;
    out.push({
      x: round(sampleFrom + i * sampleStep),
      h: round(3 + swing * 16 * side + (i % 5) * 0.6),
      strong: inCycle === 0,
    });
  }
  return out;
}

/** Horizontal-then-vertical cubic between two points. */
const curveH = ([x1, y1]: Pt, [x2, y2]: Pt, bias = 0.55) => {
  const mid = x1 + (x2 - x1) * bias;
  return `M${x1} ${y1} C${round(mid)} ${y1} ${round(mid)} ${y2} ${x2} ${y2}`;
};

/**
 * Evidence route via a gather column: down the free channel on the right,
 * then in to the engine. Each trace gathers a few units apart so the four of
 * them read as a bundle rather than as one line.
 */
const gatherRoute = ([x1, y1]: Pt, gx: number, [x2, y2]: Pt) => {
  const gy = y2 - 46;
  return (
    `M${x1} ${y1}C${x1} ${round(y1 + 30)} ${gx} ${round(y1 + 10)} ${gx} ${gy}` +
    `C${gx} ${round(gy + 30)} ${round(x2 + 62)} ${round(y2 - 22)} ${x2} ${y2}`
  );
};

/** Vertical-then-horizontal cubic — used where the flow descends. */
const curveV = ([x1, y1]: Pt, [x2, y2]: Pt, bias = 0.55) => {
  const mid = y1 + (y2 - y1) * bias;
  return `M${x1} ${y1} C${x1} ${round(mid)} ${x2} ${round(mid)} ${x2} ${y2}`;
};

/* ─────────────────────────────── primitives ────────────────────────────── */

/**
 * One captured pose. Anatomy comes from the shared gait phases, so the two
 * frames are genuinely different points in a stride rather than one drawing
 * shifted sideways.
 */
function CaptureWalker({
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
    p.map(([px, py]) => `${round(px * s)},${round(py * s)}`).join(" ");
  const groundY = round((48 - phase.lift) * s);
  const spine = `M0 0 C${round(0.4 * s)} ${round(-12 * s)} ${round(0.9 * s)} ${round(
    -24 * s,
  )} ${round(1.5 * s)} ${round(-34 * s)}`;
  const joints: readonly Pt[] = [...phase.nearArm, ...phase.nearLeg];

  return (
    <g
      className="res-walker"
      transform={`translate(${x} ${round(baseY + phase.lift * s)})`}
      style={{ "--res-i": order } as CSSProperties}
    >
      {phase.contacts.map((contactX) => (
        <ellipse
          key={contactX}
          className="res-walker-contact"
          cx={round(contactX * s)}
          cy={groundY}
          rx={round(7 * s)}
          ry={round(1.6 * s)}
        />
      ))}

      <polyline className="res-bone res-bone--far" points={pts(phase.farArm)} />
      <polyline className="res-bone res-bone--far" points={pts(phase.farLeg)} />
      <line
        className="res-bone res-bone--far"
        x1={round(phase.farFoot[0][0] * s)}
        y1={round(phase.farFoot[0][1] * s)}
        x2={round(phase.farFoot[1][0] * s)}
        y2={round(phase.farFoot[1][1] * s)}
      />

      <path className="res-bone" d={spine} />
      <circle
        className="res-walker-head"
        cx={round(GAIT_HEAD[0] * s)}
        cy={round(GAIT_HEAD[1] * s)}
        r={round(4.2 * s)}
      />
      <polyline className="res-bone" points={pts(phase.nearArm)} />
      <polyline className="res-bone" points={pts(phase.nearLeg)} />
      <line
        className="res-bone"
        x1={round(phase.nearFoot[0][0] * s)}
        y1={round(phase.nearFoot[0][1] * s)}
        x2={round(phase.nearFoot[1][0] * s)}
        y2={round(phase.nearFoot[1][1] * s)}
      />

      {joints.map(([jx, jy], j) => (
        <circle
          key={`j${j}`}
          className="res-joint"
          cx={round(jx * s)}
          cy={round(jy * s)}
          r={round(1.9 * s)}
        />
      ))}
      <circle
        className="res-joint"
        cx={round(GAIT_NECK[0] * s)}
        cy={round(GAIT_NECK[1] * s)}
        r={round(1.7 * s)}
      />
    </g>
  );
}

/** What each engine plate carries, drawn at the plate's own scale. */
function PlateMotif({ motif, cx, cy, hw }: { motif: Motif; cx: number; cy: number; hw: number }) {
  const u = hw / 132; // motifs are authored against the desktop plate width

  if (motif === "skeleton") {
    // Joint / bone diagram — the plate that produces the skeleton.
    const j: Pt[] = [
      [0, -9],
      [0, -2],
      [-7, -4],
      [7, -4],
      [-5, 6],
      [5, 6],
      [-8, 13],
      [9, 12],
    ];
    const bones: [number, number][] = [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [4, 6],
      [5, 7],
    ];
    const P = (i: number): Pt => [cx + j[i][0] * 2.4 * u, cy + j[i][1] * 1.05 * u + 5 * u];
    return (
      <g className="res-motif">
        {bones.map(([a, b]) => {
          const [x1, y1] = P(a);
          const [x2, y2] = P(b);
          return (
            <line
              key={`${a}-${b}`}
              className="res-motif-bone"
              x1={round(x1)}
              y1={round(y1)}
              x2={round(x2)}
              y2={round(y2)}
            />
          );
        })}
        {j.map((_, i) => {
          const [px, py] = P(i);
          return (
            <circle
              key={i}
              className="res-motif-node"
              cx={round(px)}
              cy={round(py)}
              r={round(1.7 * u)}
            />
          );
        })}
      </g>
    );
  }

  if (motif === "samples") {
    // Extracted features — the sampled stride, at plate scale.
    const bars = 15;
    return (
      <g className="res-motif">
        {Array.from({ length: bars }).map((_, i) => {
          const swing = Math.abs(Math.sin((i / 12) * Math.PI * 2));
          const side = i % 12 < 6 ? 1 : 0.62;
          const h = (2 + swing * 8 * side) * u;
          const bx = cx + (i - (bars - 1) / 2) * 6.6 * u;
          return (
            <line
              key={i}
              className={i % 6 === 0 ? "res-motif-bar res-motif-bar--strong" : "res-motif-bar"}
              x1={round(bx)}
              y1={round(cy + 8 * u - h)}
              x2={round(bx)}
              y2={round(cy + 8 * u + h * 0.5)}
            />
          );
        })}
      </g>
    );
  }

  if (motif === "graph") {
    // Model layer — a small connected network.
    const cols = [-1, 0, 1];
    const rows = [-1, 0, 1];
    const nodes: Pt[] = [];
    for (const c of cols) for (const r of rows) nodes.push([cx + c * 22 * u, cy + 7 * u + r * 6.5 * u]);
    return (
      <g className="res-motif">
        {nodes.map(([nx, ny], i) => {
          const next = nodes[i + 3];
          if (!next) return null;
          return (
            <line
              key={`e${i}`}
              className="res-motif-edge"
              x1={round(nx)}
              y1={round(ny)}
              x2={round(next[0])}
              y2={round(next[1])}
            />
          );
        })}
        {nodes.map(([nx, ny], i) => (
          <circle
            key={i}
            className="res-motif-node"
            cx={round(nx)}
            cy={round(ny)}
            r={round(1.5 * u)}
          />
        ))}
      </g>
    );
  }

  // Edge · privacy — a hatched keep on a device outline.
  const w = 34 * u;
  const hgt = 15 * u;
  const top = cy + u;
  return (
    <g className="res-motif">
      <rect
        className="res-motif-keep"
        x={round(cx - w / 2)}
        y={round(top)}
        width={round(w)}
        height={round(hgt)}
        rx={round(3 * u)}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={i}
          className="res-motif-hatch"
          x1={round(cx - w / 2 + 3 * u + i * 6 * u)}
          y1={round(top + hgt - 1.5 * u)}
          x2={round(cx - w / 2 + 9 * u + i * 6 * u)}
          y2={round(top + 1.5 * u)}
        />
      ))}
      <path
        className="res-motif-bone"
        d={`M${round(cx - 5 * u)} ${round(top + hgt * 0.52)} a${round(5 * u)} ${round(
          5 * u,
        )} 0 0 1 ${round(10 * u)} 0`}
      />
    </g>
  );
}

/* ──────────────────────────────── diagram ──────────────────────────────── */

export function ResearchSignal({
  areas,
  capabilities,
  compact = false,
  className,
}: {
  areas: readonly ResearchSignalArea[];
  capabilities: readonly ResearchSignalCapability[];
  compact?: boolean;
  className?: string;
}) {
  const geo = compact ? COMPACT : DESKTOP;
  const k = geo.key;
  const { stack, capture, caps, band } = geo;

  const plates = ENGINE_LAYERS.map((layer, i) => ({
    ...layer,
    cy: stack.cy0 + i * stack.gap,
    order: i,
  }));
  const stackTop: Pt = [stack.cx, stack.cy0 - stack.hh];
  const stackBottom: Pt = [stack.cx, plates[plates.length - 1].cy + stack.hh];
  const stackMid = (stackTop[1] + stackBottom[1]) / 2;

  const bandNodes = areas.slice(0, band.nodeX.length).map((area, i) => ({
    ...area,
    x: band.nodeX[i],
    y: round(signalAt(band.nodeX[i], geo)),
    order: i,
  }));

  const capNodes = capabilities.slice(0, caps.ys.length).map((cap, i) => ({
    ...cap,
    x: caps.x,
    y: caps.ys[i],
    order: i,
  }));

  const entryVertex: Pt =
    capture.enters === "left"
      ? [stack.cx - stack.hw, stack.cy0]
      : [stack.cx + stack.hw, stack.cy0];

  const samples = captureSamples(geo);
  const groundY = round(capture.baseY + 48 * capture.s);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      className={`res-signal${compact ? " res-signal--compact" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      <defs>
        <linearGradient id={`res-band-${k}`} x1="0" x2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.15" />
          <stop offset="0.22" stopColor="#4FD1FF" stopOpacity="0.9" />
          <stop offset="0.62" stopColor="#2563FF" stopOpacity="0.85" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`res-band-fill-${k}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.22" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`res-plate-${k}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#2563FF" stopOpacity="0.1" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.14" />
        </linearGradient>
        {/* The plate's extrusion. Themed through CSS `stop-color`, because a
            hard obsidian wall reads as a black slab on the light theme. */}
        <linearGradient id={`res-wall-${k}`} x1="0" x2="0" y1="0" y2="1">
          <stop className="res-wall-stop-a" offset="0" />
          <stop className="res-wall-stop-b" offset="1" />
        </linearGradient>
        <linearGradient id={`res-cap-${k}`} x1="0" x2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.65" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.28" />
        </linearGradient>
        <radialGradient id={`res-core-${k}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.2" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Radial rings behind the engine — the platform's field ── */}
      <g className="res-rings">
        <ellipse
          className="res-core-glow"
          cx={stack.cx}
          cy={stackMid}
          rx={stack.hw * 2.9}
          ry={stack.hh * 3.4}
          fill={`url(#res-core-${k})`}
        />
        {[1.35, 1.9, 2.5].map((f, i) => (
          <ellipse
            key={f}
            className="res-ring"
            style={{ "--res-i": i } as CSSProperties}
            cx={stack.cx}
            cy={stackMid}
            rx={round(stack.hw * f)}
            ry={round((stackBottom[1] - stackTop[1]) * 0.5 * (0.62 + f * 0.22))}
          />
        ))}
      </g>

      {/* ══ 1 · The flowing research signal, with the record sitting on it ══ */}
      <g className="res-band">
        <path
          className="res-band-fill"
          d={`${signalPath(geo)}L${band.to} ${band.y + band.amp + 16}L${band.from} ${
            band.y + band.amp + 16
          }Z`}
          fill={`url(#res-band-fill-${k})`}
        />
        <path className="res-trace" d={signalPath(geo)} stroke={`url(#res-band-${k})`} />
        {/* pathLength normalises the sweep, so one set of keyframes drives the
            dash flow regardless of the trace's real length. */}
        <path className="res-trace-flow" d={signalPath(geo)} pathLength={100} />
      </g>

      {bandNodes.map((node) => (
        <g
          key={node.id}
          className="res-record"
          style={{ "--res-i": node.order } as CSSProperties}
        >
          {band.titleY !== undefined && (
            <>
              <text
                className="res-label"
                x={node.x}
                y={band.titleY}
                fontSize={band.titleSize}
                textAnchor="middle"
              >
                {node.title}
              </text>
              <text
                className="res-mono"
                x={node.x}
                y={band.countY}
                fontSize={band.countSize}
                textAnchor="middle"
              >
                {node.records} {node.records === 1 ? "record" : "records"}
              </text>
              <line
                className="res-record-tick"
                x1={node.x}
                y1={band.countY + 7}
                x2={node.x}
                y2={round(node.y - 12)}
              />
            </>
          )}
          {band.titleY === undefined && (
            <text
              className="res-mono"
              x={node.x}
              y={band.countY}
              fontSize={band.countSize}
              textAnchor="middle"
            >
              {node.records}
            </text>
          )}
          <circle className="res-record-halo" cx={node.x} cy={node.y} r={13} />
          <circle className="res-record-ring" cx={node.x} cy={node.y} r={6.5} />
          <circle className="res-record-dot" cx={node.x} cy={node.y} r={2.4} />
        </g>
      ))}

      {/* Dashed evidence traces: published work grounding the engine. */}
      {bandNodes.map((node) => (
        <path
          key={`ev-${node.id}`}
          className="res-evidence"
          style={{ "--res-i": node.order } as CSSProperties}
          d={
            geo.evidenceGather === undefined
              ? curveV([node.x, round(node.y + 13)], stackTop, 0.62)
              : gatherRoute(
                  [node.x, round(node.y + 13)],
                  geo.evidenceGather + node.order * 5,
                  stackTop,
                )
          }
          pathLength={100}
        />
      ))}

      {/* ══ 2 · Capture — the data path's origin ══ */}
      <g className="res-capture">
        <rect
          className="res-frame"
          x={capture.frame[0]}
          y={capture.frame[1]}
          width={capture.frame[2] - capture.frame[0]}
          height={capture.frame[3] - capture.frame[1]}
          rx={10}
        />
        {/* Corner crop marks — instrument, not decoration. */}
        {(
          [
            [capture.frame[0], capture.frame[1], 1, 1],
            [capture.frame[2], capture.frame[1], -1, 1],
            [capture.frame[0], capture.frame[3], 1, -1],
            [capture.frame[2], capture.frame[3], -1, -1],
          ] as const
        ).map(([cxp, cyp, sx, sy], i) => (
          <path
            key={i}
            className="res-crop"
            d={`M${cxp + sx * 2} ${cyp + sy * 14}L${cxp + sx * 2} ${cyp + sy * 2}L${
              cxp + sx * 14
            } ${cyp + sy * 2}`}
          />
        ))}
        <text
          className="res-mono"
          x={capture.frame[0] + 14}
          y={capture.labelY}
          fontSize={geo.band.countSize}
        >
          CAPTURE · POSE
        </text>
        {/* Slow capture sweep — travels the frame height, set as a CSS var so
            the keyframes stay geometry-agnostic. */}
        <line
          className="res-scan"
          style={
            { "--res-scan-run": `${capture.frame[3] - capture.frame[1] - 4}px` } as CSSProperties
          }
          x1={capture.frame[0] + 1}
          y1={capture.frame[1] + 2}
          x2={capture.frame[2] - 1}
          y2={capture.frame[1] + 2}
        />

        <line
          className="res-ground"
          x1={capture.frame[0] + 16}
          y1={groundY + 1}
          x2={capture.frame[2] - 16}
          y2={groundY + 1}
        />
        {capture.walkers.map((walker, i) => (
          <CaptureWalker
            key={GAIT_PHASES[walker.phase].id}
            phase={GAIT_PHASES[walker.phase]}
            x={walker.x}
            baseY={capture.baseY}
            s={capture.s}
            order={i}
          />
        ))}

        {/* Sampled stride signal. */}
        {samples.map((sample, i) => (
          <line
            key={i}
            className={sample.strong ? "res-sample res-sample--strong" : "res-sample"}
            x1={sample.x}
            y1={round(capture.sampleY - sample.h)}
            x2={sample.x}
            y2={round(capture.sampleY + sample.h * 0.5)}
          />
        ))}
        <line
          className="res-baseline"
          x1={capture.sampleFrom - 6}
          y1={capture.sampleY}
          x2={capture.exit[0]}
          y2={capture.sampleY}
        />
      </g>

      {/* Solid data path: capture → engine. */}
      <path className="res-data" d={curveH(capture.exit, entryVertex, 0.7)} />
      <path
        className="res-data-flow"
        d={curveH(capture.exit, entryVertex, 0.7)}
        pathLength={100}
      />

      {/* ══ 3 · The layered movement engine ══ */}
      <g className="res-stack">
        {plates.map((plate) => {
          const { cx } = stack;
          const { hw, hh, depth } = stack;
          const cy = plate.cy;
          const diamond = `M${cx - hw} ${cy}L${cx} ${cy - hh}L${cx + hw} ${cy}L${cx} ${cy + hh}Z`;
          const wall = `M${cx - hw} ${cy}L${cx} ${cy + hh}L${cx + hw} ${cy}L${cx + hw} ${
            cy + depth
          }L${cx} ${cy + hh + depth}L${cx - hw} ${cy + depth}Z`;
          return (
            <g
              key={plate.id}
              className="res-plate"
              style={{ "--res-i": plate.order } as CSSProperties}
            >
              <path className="res-plate-wall" d={wall} fill={`url(#res-wall-${k})`} />
              <path className="res-plate-face" d={diamond} fill={`url(#res-plate-${k})`} />
              <path className="res-plate-rim" d={diamond} />
              <text
                className="res-plate-label"
                x={cx}
                y={cy - hh * 0.34}
                fontSize={stack.labelSize}
                textAnchor="middle"
              >
                {plate.label}
              </text>
              <text
                className="res-mono res-plate-index"
                x={cx - hw + 18}
                y={cy + 3}
                fontSize={geo.band.countSize}
              >
                {String(plate.order + 1).padStart(2, "0")}
              </text>
              <PlateMotif motif={plate.motif} cx={cx} cy={cy} hw={hw} />
            </g>
          );
        })}

        {/* Axis through the stack, with the signal descending it. */}
        <line
          className="res-axis"
          x1={stack.cx}
          y1={stackTop[1]}
          x2={stack.cx}
          y2={stackBottom[1]}
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            className="res-axis-dot"
            style={
              {
                "--res-i": i,
                "--res-axis-run": `${round(stackBottom[1] - stackTop[1])}px`,
              } as CSSProperties
            }
            cx={stack.cx}
            cy={stackTop[1]}
            r={2.4}
          />
        ))}
      </g>

      {/* ══ 4 · Engine → capability the record actually backs ══ */}
      <g className="res-bus">
        <line
          className="res-bus-link"
          x1={stack.cx + (compact ? 0 : stack.hw)}
          y1={compact ? stackBottom[1] : stack.cy0 + stack.gap * 2}
          x2={caps.bus[0]}
          y2={caps.bus[1]}
        />
        <circle className="res-bus-halo" cx={caps.bus[0]} cy={caps.bus[1]} r={11} />
        <circle className="res-bus-ring" cx={caps.bus[0]} cy={caps.bus[1]} r={5.5} />
        <circle className="res-bus-dot" cx={caps.bus[0]} cy={caps.bus[1]} r={2.2} />
      </g>

      {capNodes.map((cap) => {
        const target: Pt = [cap.x + (compact ? 8 : -8), cap.y];
        const d = compact
          ? curveV(caps.bus, target, 0.55)
          : curveH(caps.bus, target, 0.62);
        return (
          <g
            key={cap.id}
            className="res-cap"
            style={{ "--res-i": cap.order } as CSSProperties}
          >
            <path className="res-cap-trace" d={d} stroke={`url(#res-cap-${k})`} />
            <path className="res-cap-flow" d={d} pathLength={100} />
            <circle className="res-cap-halo" cx={cap.x} cy={cap.y} r={8.5} />
            <circle className="res-cap-node" cx={cap.x} cy={cap.y} r={3.2} />
            <text
              className="res-label"
              x={cap.x + caps.labelDx}
              y={cap.y + 3.6}
              fontSize={caps.labelSize}
            >
              {cap.title}
              <tspan className="res-mono res-cap-count" fontSize={caps.countSize}>
                {"  "}
                {cap.records}
              </tspan>
            </text>
          </g>
        );
      })}

      {/* ── Zone ruler ── */}
      {geo.ruler && (
        <g className="res-ruler">
          {geo.ruler.zones.map((zone) => (
            <g key={zone.label}>
              <line
                className="res-ruler-line"
                x1={zone.from}
                y1={geo.ruler!.y}
                x2={zone.to}
                y2={geo.ruler!.y}
              />
              <line
                className="res-ruler-tick"
                x1={zone.from}
                y1={geo.ruler!.y - 4}
                x2={zone.from}
                y2={geo.ruler!.y + 4}
              />
              <line
                className="res-ruler-tick"
                x1={zone.to}
                y1={geo.ruler!.y - 4}
                x2={zone.to}
                y2={geo.ruler!.y + 4}
              />
              <text
                className="res-mono"
                x={(zone.from + zone.to) / 2}
                y={geo.ruler!.y + 17}
                fontSize={geo.ruler!.size}
                textAnchor="middle"
              >
                {zone.label.toUpperCase()}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
