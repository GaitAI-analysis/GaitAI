import type { CSSProperties } from "react";
import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type GaitPhase,
  type Pt,
} from "@/components/visuals/gait-phases";
import { CAPABILITY_COUNT, MODULE_COUNT, SIGNAL_COUNT } from "@/data/analytics";
import styles from "./labHero.module.css";

/**
 * The instrument in the Movement Studio hero (/movement-lab).
 *
 * The hero was a single left column, so the right half of the page was empty
 * at desktop width and the lab read as a text landing page. This fills it with
 * the thing the page is actually about, drawn rather than photographed:
 *
 *   a walking sequence  →  joint trajectories  →  extracted signals
 *                       →  the pipeline that turns them into an output
 *
 * NOT IN A CARD, on purpose. There is no panel, no border box and no surface
 * behind it: a faint measurement grid, corner ticks and a baseline rule, and
 * the figures sit directly on the hero's own background as if projected into
 * it. A bordered rectangle here would have read as one more UI card on a page
 * that already has several.
 *
 * POSES ARE THE CANONICAL ONES. `GAIT_PHASES` is the same five-phase cycle the
 * rest of the site draws with — heel strike, loading, mid-stance, toe-off,
 * swing — so the sequence is biomechanically ordered rather than five copies
 * of a stick figure at different x positions. The centre pose is the subject;
 * the ones either side fall away in opacity, which is what makes the group
 * read as one person over time instead of a crowd.
 *
 * EVERY NUMBER IS REAL. The annotations read MODULE_COUNT, CAPABILITY_COUNT
 * and SIGNAL_COUNT from `data/analytics.ts` — the same constants the stat row
 * beside it renders. There is no invented reading anywhere in this drawing:
 * no accuracy, no latency, no score. The one output it names is the count of
 * signals in the platform's own vocabulary.
 */

const W = 620;
const H = 560;

/* ── The walking sequence ── */
const SEQ_Y = 236;
const SEQ_X0 = 96;
const SEQ_STEP = 86;
/** Centre pose is the subject; opacity falls away either side. */
const SEQ = [0, 1, 2, 3, 4];
const SEQ_OPACITY = [0.22, 0.55, 1, 0.55, 0.22];
const SEQ_SCALE = 1.55;

function Pose({
  phase,
  x,
  opacity,
  lead,
  outer = false,
}: {
  phase: GaitPhase;
  x: number;
  opacity: number;
  lead: boolean;
  /** Dropped on small screens — see the media query in labHero.module.css. */
  outer?: boolean;
}) {
  const s = SEQ_SCALE;
  const pts = (p: readonly Pt[]) =>
    p.map(([px, py]) => `${px * s},${py * s}`).join(" ");

  return (
    <g
      transform={`translate(${x} ${SEQ_Y + phase.lift * s})`}
      style={{ opacity } as CSSProperties}
      className={`${lead ? styles.poseLead : styles.pose}${
        outer ? ` ${styles.poseOuter}` : ""
      }`}
    >
      <polyline className={styles.boneFar} points={pts(phase.farArm)} />
      <polyline className={styles.boneFar} points={pts(phase.farLeg)} />
      <path
        className={styles.bone}
        d={`M0 0 C${0.4 * s} ${-12 * s} ${0.9 * s} ${-24 * s} ${1.5 * s} ${-34 * s}`}
      />
      {/* No face, no fill — a pose graph, not a person. */}
      <circle
        className={styles.head}
        cx={GAIT_HEAD[0] * s}
        cy={GAIT_HEAD[1] * s}
        r={4.4 * s}
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
      {[...phase.nearArm, ...phase.nearLeg, GAIT_NECK].map(([jx, jy], i) => (
        <circle
          key={i}
          className={lead ? styles.jointLead : styles.joint}
          cx={jx * s}
          cy={jy * s}
          r={lead ? 2.4 : 1.9}
        />
      ))}
    </g>
  );
}

/** A joint's path across the sequence, sampled from the same phase data. */
function trajectory(pick: (phase: GaitPhase) => Pt) {
  return SEQ.map((index, i) => {
    const phase = GAIT_PHASES[index];
    const [jx, jy] = pick(phase);
    return [
      SEQ_X0 + i * SEQ_STEP + jx * SEQ_SCALE,
      SEQ_Y + phase.lift * SEQ_SCALE + jy * SEQ_SCALE,
    ] as Pt;
  });
}

/** Catmull-Rom through sampled points — a measured path, not a drawn curve. */
function smooth(points: readonly Pt[]) {
  if (points.length < 2) return "";
  const f = (n: number) => n.toFixed(1);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d +=
      ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)}` +
      ` ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/* Knee flexion over one cycle — the loading-response dip and the swing peak,
   the same two features the engine diagram plots. Not a sine wave. */
function kneeFlexion(t: number) {
  const w = t - Math.floor(t);
  const bump = (c: number, width: number) =>
    [-1, 0, 1].reduce(
      (sum, k) => sum + Math.exp(-(((w - c - k) / width) ** 2)),
      0,
    );
  return 0.06 + 0.26 * bump(0.14, 0.09) + 0.92 * bump(0.73, 0.12);
}

const PIPELINE = [
  { label: "Pose", x: 96 },
  { label: "Signals", x: 226 },
  { label: "Features", x: 356 },
  { label: "Intelligence", x: 496 },
];

export function LabHeroInstrument({ className }: { className?: string }) {
  const hip = trajectory((p) => p.nearLeg[0]);
  const knee = trajectory((p) => p.nearLeg[1]);
  const ankle = trajectory((p) => p.nearLeg[2]);
  /* Centre of mass, approximated at the neck — one path, clearly labelled as
     an approximation rather than presented as a measured quantity. */
  const com = trajectory(() => GAIT_NECK);

  const kneeCurve = Array.from({ length: 64 }, (_, i) => {
    const t = i / 63;
    return `${(96 + t * 424).toFixed(1)},${(392 - kneeFlexion(t * 2) * 26).toFixed(1)}`;
  }).join(" ");

  return (
    <svg
      role="img"
      aria-label="A synthetic walking sequence in five gait phases, with hip, knee, ankle and centre-of-mass trajectories, an extracted knee-flexion signal, stride markers and a cadence readout, feeding a pose to signals to features to intelligence pipeline."
      viewBox={`0 0 ${W} ${H}`}
      className={`${styles.instrument} ${className ?? ""}`}
    >
      {/* ── Measurement ground ── */}
      <g className={styles.grid}>
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={40 + i * 48} y1={70} x2={40 + i * 48} y2={470} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={40} y1={70 + i * 50} x2={568} y2={70 + i * 50} />
        ))}
      </g>

      {/* Corner ticks: a frame without a box. */}
      <g className={styles.ticks}>
        {[
          [40, 70, 1, 1],
          [568, 70, -1, 1],
          [40, 470, 1, -1],
          [568, 470, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <path
            key={i}
            d={`M${x} ${y + sy * 14} L${x} ${y} L${x + sx * 14} ${y}`}
          />
        ))}
      </g>

      {/* ── Stage 1 · human movement ── */}
      <text className={styles.stageLabel} x={40} y={58}>
        01 · Human movement
      </text>

      {/* The floor the sequence walks on. */}
      <line className={styles.ground} x1={56} y1={262} x2={568} y2={262} />

      {/* ── Stage 2 · joint trajectories, behind the figures ── */}
      <g className={styles.trails}>
        <path className={styles.trailCom} d={smooth(com)} />
        <path className={styles.trailHip} d={smooth(hip)} />
        <path className={styles.trailKnee} d={smooth(knee)} />
        <path className={styles.trailAnkle} d={smooth(ankle)} />
      </g>

      {SEQ.map((phaseIndex, i) => (
        <Pose
          key={phaseIndex}
          phase={GAIT_PHASES[phaseIndex]}
          x={SEQ_X0 + i * SEQ_STEP}
          opacity={SEQ_OPACITY[i]}
          lead={i === 2}
          outer={i === 0 || i === 4}
        />
      ))}

      {/* Trajectory labels, at the end of each path. */}
      <g className={styles.trailLabels}>
        <text x={ankle[4][0] + 8} y={ankle[4][1] + 4}>ANKLE</text>
        <text x={knee[4][0] + 8} y={knee[4][1] + 4}>KNEE</text>
        <text x={hip[4][0] + 8} y={hip[4][1] + 4}>HIP</text>
        <text x={com[4][0] + 8} y={com[4][1] - 4}>COM ≈</text>
      </g>

      {/* ── Stage 3 · extracted signals ── */}
      <text className={styles.stageLabel} x={40} y={318}>
        02 · Extracted signals
      </text>

      <text className={styles.signalName} x={40} y={344}>
        KNEE FLEXION
      </text>
      <line className={styles.axis} x1={96} y1={392} x2={520} y2={392} />
      <polyline className={styles.wave} points={kneeCurve} />

      <text className={styles.signalName} x={40} y={422}>
        STRIDE
      </text>
      <line className={styles.axis} x1={96} y1={422} x2={520} y2={422} />
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          className={styles.strideMark}
          cx={118 + i * 134}
          cy={422}
          r={3.2}
        />
      ))}

      <text className={`${styles.signalName} ${styles.smallHide}`} x={40} y={454}>
        CADENCE
      </text>
      <g className={`${styles.cadence} ${styles.smallHide}`}>
        {Array.from({ length: 30 }, (_, i) => {
          const h = 3 + 11 * Math.abs(Math.sin((i / 30) * Math.PI * 4));
          return (
            <line
              key={i}
              x1={96 + i * 14.2}
              y1={454}
              x2={96 + i * 14.2}
              y2={454 - h}
            />
          );
        })}
      </g>

      {/* ── Stage 4 · the pipeline ── */}
      <line className={styles.pipeRail} x1={96} y1={508} x2={496} y2={508} />
      {PIPELINE.map((stage, i) => (
        <g key={stage.label}>
          <circle
            className={i === PIPELINE.length - 1 ? styles.pipeNodeOut : styles.pipeNode}
            cx={stage.x}
            cy={508}
            r={i === PIPELINE.length - 1 ? 5 : 3.6}
          />
          <text className={styles.pipeLabel} x={stage.x} y={530}>
            {stage.label}
          </text>
        </g>
      ))}
      {/* One pulse, travelling the rail once per cycle. */}
      <circle className={styles.pulse} cx={96} cy={508} r={3.4} />

      {/* ── Instrumentation annotations. Real constants only. ── */}
      <g className={styles.meta}>
        <text x={568} y={58} textAnchor="end">
          SYNTHETIC STREAM · {SIGNAL_COUNT} SIGNALS
        </text>
        <text x={568} y={318} textAnchor="end">
          CAPABILITY LAYER · {CAPABILITY_COUNT}
        </text>
        <text x={568} y={530} textAnchor="end">
          PIPELINE · {MODULE_COUNT} MODULES
        </text>
      </g>
    </svg>
  );
}
