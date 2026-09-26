import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";

/**
 * Investors — the movement-to-scale signal.
 *
 * Reads left to right as one idea: walking is captured as motion-capture
 * frames, sampled into a temporal gait signal, gathered at a convergence node,
 * and fanned out along three traces toward the three investment dimensions on
 * the right. It shares the Motion DNA vocabulary of the Mission/Vision section
 * — real gait poses, sampled signal, glowing nodes — without repeating its
 * composition.
 *
 * Everything is deterministic: sample heights come from a stride function, not
 * from randomness, so server and client markup match. All motion is CSS, so
 * this stays a server component and honours prefers-reduced-motion in one
 * place (globals.css).
 */

type Geometry = {
  w: number;
  h: number;
  /** Figure scale. */
  s: number;
  frames: readonly number[];
  spacing: number;
  x0: number;
  baseY: number;
  /** Left/right bounds of the sampled signal. */
  sampleFrom: number;
  sampleTo: number;
  sampleStep: number;
  baselineY: number;
  node: Pt;
  /** Where each branch trace leaves the frame, top to bottom. */
  exits: readonly Pt[];
};

const DESKTOP: Geometry = {
  w: 600,
  h: 300,
  s: 0.92,
  frames: [0, 1, 2, 3, 4],
  spacing: 74,
  x0: 40,
  baseY: 86,
  sampleFrom: 14,
  sampleTo: 440,
  sampleStep: 8.6,
  baselineY: 216,
  node: [466, 200],
  exits: [
    [594, 84],
    [594, 198],
    [594, 284],
  ],
};

const COMPACT: Geometry = {
  w: 340,
  h: 250,
  s: 0.8,
  frames: [0, 2, 4],
  spacing: 64,
  x0: 34,
  baseY: 70,
  sampleFrom: 12,
  sampleTo: 250,
  sampleStep: 8,
  baselineY: 176,
  node: [274, 166],
  exits: [
    [336, 96],
    [336, 176],
    [336, 244],
  ],
};

/** Accent per branch, matching the three cards. */
const BRANCH_TONES = ["cyan", "royal", "violet"] as const;

type Tone = (typeof BRANCH_TONES)[number];

/**
 * Full class names, written out. Tailwind scans source for literal class
 * strings and drops any @layer components rule it cannot find, so building
 * these by interpolation (`inv-branch--${tone}`) silently loses the accent
 * colours at build time.
 */
const FRAME_CLASS: Record<Tone, string> = {
  cyan: "inv-mocap-frame inv-mocap-frame--cyan",
  royal: "inv-mocap-frame inv-mocap-frame--royal",
  violet: "inv-mocap-frame inv-mocap-frame--violet",
};

const BRANCH_CLASS: Record<Tone, string> = {
  cyan: "inv-branch inv-branch--cyan",
  royal: "inv-branch inv-branch--royal",
  violet: "inv-branch inv-branch--violet",
};

const BRANCH_STOP: Record<Tone, string> = {
  cyan: "#4FD1FF",
  royal: "#2563FF",
  violet: "#7C3AED",
};

/** Which accent each captured pose carries, left to right. */
const FRAME_TONES: readonly Tone[] = ["cyan", "cyan", "royal", "royal", "violet"];

/**
 * Sampled stride signal. Twelve samples per gait cycle with the second half of
 * the cycle deliberately shorter — the left/right asymmetry is what makes this
 * read as gait rather than as an audio waveform. Heel-strike samples are
 * emphasized.
 */
function strideSamples(geo: Geometry) {
  const out: Array<{ x: number; h: number; strong: boolean }> = [];
  const count = Math.floor((geo.sampleTo - geo.sampleFrom) / geo.sampleStep);
  for (let i = 0; i <= count; i += 1) {
    const inCycle = i % 12;
    const swing = Math.abs(Math.sin((inCycle / 12) * Math.PI * 2));
    // Contralateral step amplitude — the trailing half-cycle is lower.
    const side = inCycle < 6 ? 1 : 0.68;
    const h = 3.5 + swing * 19 * side + (i % 5) * 0.75;
    out.push({
      x: geo.sampleFrom + i * geo.sampleStep,
      h: Math.round(h * 10) / 10,
      strong: inCycle === 0,
    });
  }
  return out;
}

function MocapFrame({
  phase,
  prevPhase,
  x,
  baseY,
  s,
  order,
  tone,
}: {
  phase: GaitPhase;
  prevPhase: GaitPhase;
  x: number;
  baseY: number;
  s: number;
  order: number;
  tone: Tone;
}) {
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${px * s},${py * s}`).join(" ");
  const groundY = (48 - phase.lift) * s;
  const originY = baseY + phase.lift * s;
  const spine = `M0 0 C${0.4 * s} ${-12 * s} ${0.9 * s} ${-24 * s} ${1.5 * s} ${-34 * s}`;

  const nearJoints: readonly Pt[] = [...phase.nearArm, ...phase.nearLeg];

  /* Temporal ghosting: the previous captured pose, held faintly behind this
     one so the sequence reads as sampled motion rather than as separate
     drawings. */
  const ghost = (
    <g className="inv-mocap-ghost">
      <polyline points={pts(prevPhase.nearArm)} />
      <polyline points={pts(prevPhase.nearLeg)} />
      <polyline points={pts(prevPhase.farLeg)} />
    </g>
  );

  return (
    <g
      className={FRAME_CLASS[tone]}
      transform={`translate(${x} ${originY})`}
      style={{ "--inv-i": order } as CSSProperties}
    >
      {phase.contacts.map((contactX) => (
        <ellipse
          key={contactX}
          className="inv-mocap-contact"
          cx={contactX * s}
          cy={groundY}
          rx={7 * s}
          ry={1.6 * s}
        />
      ))}

      {ghost}

      <polyline
        className="inv-mocap-bone inv-mocap-bone--far"
        points={pts(phase.farArm)}
      />
      <polyline
        className="inv-mocap-bone inv-mocap-bone--far"
        points={pts(phase.farLeg)}
      />
      <line
        className="inv-mocap-bone inv-mocap-bone--far"
        x1={phase.farFoot[0][0] * s}
        y1={phase.farFoot[0][1] * s}
        x2={phase.farFoot[1][0] * s}
        y2={phase.farFoot[1][1] * s}
      />

      <path className="inv-mocap-bone" d={spine} />
      <circle
        className="inv-mocap-head"
        cx={GAIT_HEAD[0] * s}
        cy={GAIT_HEAD[1] * s}
        r={4.2 * s}
      />

      <polyline className="inv-mocap-bone" points={pts(phase.nearArm)} />
      <polyline className="inv-mocap-bone" points={pts(phase.nearLeg)} />
      <line
        className="inv-mocap-bone"
        x1={phase.nearFoot[0][0] * s}
        y1={phase.nearFoot[0][1] * s}
        x2={phase.nearFoot[1][0] * s}
        y2={phase.nearFoot[1][1] * s}
      />

      {nearJoints.map(([jx, jy], j) => (
        <circle
          key={`n${j}`}
          className="inv-mocap-joint"
          cx={jx * s}
          cy={jy * s}
          r={1.9 * s}
        />
      ))}
      <circle
        className="inv-mocap-joint"
        cx={GAIT_NECK[0] * s}
        cy={GAIT_NECK[1] * s}
        r={1.7 * s}
      />
    </g>
  );
}

export function InvestorSignal({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const geo = compact ? COMPACT : DESKTOP;
  const samples = strideSamples(geo);
  const groundY = geo.baseY + 48 * geo.s;
  const xs = geo.frames.map((_, i) => geo.x0 + i * geo.spacing);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${geo.w} ${geo.h}`}
      className={`inv-signal${compact ? " inv-signal--compact" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={{ "--inv-n": geo.frames.length } as CSSProperties}
    >
      <defs>
        <linearGradient id={`inv-base-${compact ? "c" : "d"}`} x1="0" x2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0" />
          <stop offset="0.18" stopColor="#4FD1FF" stopOpacity="0.55" />
          <stop offset="0.72" stopColor="#2563FF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.5" />
        </linearGradient>
        {BRANCH_TONES.map((tone) => (
          <linearGradient
            key={tone}
            id={`inv-branch-${tone}-${compact ? "c" : "d"}`}
            x1="0"
            x2="1"
          >
            <stop offset="0" stopColor={BRANCH_STOP[tone]} stopOpacity="0.65" />
            <stop offset="1" stopColor={BRANCH_STOP[tone]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* ── Ground plane the figures walk on ── */}
      <line
        className="inv-ground"
        x1={geo.x0 - 30}
        y1={groundY + 1}
        x2={geo.sampleTo}
        y2={groundY + 1}
      />

      {/* ── Walking motion-capture sequence ── */}
      {geo.frames.map((phaseIndex, i) => (
        <MocapFrame
          key={GAIT_PHASES[phaseIndex].id}
          phase={GAIT_PHASES[phaseIndex]}
          prevPhase={
            GAIT_PHASES[(phaseIndex - 1 + GAIT_PHASES.length) % GAIT_PHASES.length]
          }
          x={xs[i]}
          baseY={geo.baseY}
          s={geo.s}
          order={i}
          tone={FRAME_TONES[phaseIndex]}
        />
      ))}

      {/* ── Per-frame temporal samples dropping toward the signal ── */}
      <g className="inv-drop">
        {xs.map((fx, i) =>
          [-9, 0, 9].map((dx, k) => (
            <line
              key={`${i}-${k}`}
              className="inv-drop-tick"
              style={{ "--inv-i": i } as CSSProperties}
              x1={fx + dx}
              y1={groundY + 12}
              x2={fx + dx}
              y2={groundY + 12 + 7 + ((i * 5 + k * 7) % 11)}
            />
          )),
        )}
      </g>

      {/* ── Sampled gait signal ── */}
      <g className="inv-wave">
        {samples.map((sample, i) => (
          <line
            key={i}
            className={`inv-sample${sample.strong ? " inv-sample--strong" : ""}`}
            style={{ "--inv-s": i } as CSSProperties}
            x1={sample.x}
            y1={geo.baselineY - sample.h}
            x2={sample.x}
            y2={geo.baselineY + sample.h * 0.52}
          />
        ))}
      </g>

      <line
        className="inv-baseline"
        x1={geo.sampleFrom - 6}
        y1={geo.baselineY}
        x2={geo.node[0]}
        y2={geo.baselineY}
        stroke={`url(#inv-base-${compact ? "c" : "d"})`}
      />

      {/* Data travelling along the baseline into the convergence node. */}
      {!compact &&
        [0, 1, 2].map((k) => (
          <circle
            key={k}
            className="inv-traveler"
            style={
              {
                "--inv-t": k,
                // SVG user units; the CSS translate carries the dot from the
                // first sample to the convergence node.
                "--inv-travel": `${geo.node[0] - geo.sampleFrom}px`,
              } as CSSProperties
            }
            cx={geo.sampleFrom}
            cy={geo.baselineY}
            r={2.4}
          />
        ))}

      {/* ── Convergence: one platform ── */}
      <g className="inv-core" transform={`translate(${geo.node[0]} ${geo.node[1]})`}>
        <circle className="inv-core-halo" r={compact ? 13 : 16} />
        {/* The single champagne note in the signal: the point where measured
            movement becomes something a platform can be built and funded on. */}
        <circle className="inv-core-crown" r={compact ? 10.5 : 12.5} />
        <circle className="inv-core-ring" r={compact ? 7 : 8.5} />
        <circle className="inv-core-dot" r={compact ? 2.6 : 3} />
      </g>
      <line
        className="inv-core-link"
        x1={geo.node[0]}
        y1={geo.baselineY}
        x2={geo.node[0]}
        y2={geo.node[1]}
      />

      {/* ── Three branches: one platform → three investment dimensions ── */}
      {geo.exits.map(([ex, ey], i) => {
        const [nx, ny] = geo.node;
        const midX = nx + (ex - nx) * 0.55;
        const d = `M${nx} ${ny} C${midX} ${ny} ${midX} ${ey} ${ex} ${ey}`;
        return (
          <g
            key={BRANCH_TONES[i]}
            className={BRANCH_CLASS[BRANCH_TONES[i]]}
            style={{ "--inv-b": i } as CSSProperties}
          >
            <path
              className="inv-branch-trace"
              d={d}
              stroke={`url(#inv-branch-${BRANCH_TONES[i]}-${compact ? "c" : "d"})`}
            />
            {/* pathLength normalizes the dash sweep, so the same keyframes
                drive every branch regardless of its actual curve length. */}
            <path className="inv-branch-flow" d={d} pathLength={100} />
            <circle className="inv-branch-node" cx={ex - 6} cy={ey} r={2.6} />
          </g>
        );
      })}
    </svg>
  );
}
