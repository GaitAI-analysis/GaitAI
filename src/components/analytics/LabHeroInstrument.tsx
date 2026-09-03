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
/* 490, not 560: the pipeline rail used to occupy 508–530 below the frame and
   is now HTML underneath the drawing. The frame's corner ticks close at 470,
   so this is the composition plus its own breathing room and nothing else. */
const H = 490;

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

/**
 * THE PIPELINE RAIL — four stages, and no coordinates.
 *
 * These used to carry an `x` each (96, 226, 356, 496) and be drawn as SVG
 * `<text>` on the same baseline as a right-anchored caption at x=568. The
 * caption — "PIPELINE · 23 MODULES" — is about 114 units wide at that font
 * size and tracking, so right-anchored it ran back to x≈454 and straight
 * over the fourth label, which is centred at 496 and spans 462→530. The two
 * strings were superimposed for their whole length: read together they
 * produced the "PIPELINEINTELLIGENCE MODULES" in the bug report.
 *
 * So the rail is no longer drawn in the SVG at all. It is a CSS grid below
 * it, one column per stage, and each label is centred in its OWN column —
 * which is what makes a collision structurally impossible rather than
 * arithmetically avoided. The last column is given extra width because its
 * label is the longest, and the label is allowed to wrap onto two lines
 * rather than being shrunk to fit one.
 *
 * It also fixes the thing that made this worse at narrower widths: SVG text
 * scales with the viewBox, so a 7.5px label in a 620-unit drawing rendered at
 * 350px was on screen at about 4px. HTML type does not scale with the
 * drawing; it is 9.5px everywhere.
 */
const PIPELINE = ["Pose", "Signals", "Features", "Intelligence modules"];

/**
 * The rail, as layout rather than as drawing.
 *
 * DESKTOP — a grid, one column per stage, each label centred in its own
 * column with `text-align: center`. The track and the nodes are drawn from
 * the same grid, so a node and its label cannot drift apart: they are the
 * same column. The final column is wider (see `.rail` in the stylesheet),
 * because its label is the longest, and it wraps to two lines.
 *
 * MOBILE — the same markup, re-laid-out vertically. Four labels of this
 * length cannot share 350px of width legibly, and shrinking the type until
 * they fit is what produced 4px text before. So below 640px the grid becomes
 * one column, the track runs down the left, and each label sits beside its
 * own node. No labels ever share a line, at any width.
 */
function PipelineRail() {
  return (
    <div className={styles.rail}>
      <ol className={styles.railStages}>
        {PIPELINE.map((label, i) => {
          const last = i === PIPELINE.length - 1;
          return (
            <li key={label} className={styles.railStage}>
              {/* The connecting track is drawn by ::before/::after on this
                  item — each stage owns the line across its own column and
                  nothing else, so the segments meet on the column boundary
                  whatever the columns are worth. See .railStage::before. */}
              <span
                aria-hidden="true"
                className={last ? styles.railNodeOut : styles.railNode}
              />
              <span className={styles.railLabel}>{label}</span>
            </li>
          );
        })}
      </ol>
      <p className={styles.railCaption}>
        Pipeline · {MODULE_COUNT} modules
      </p>
    </div>
  );
}

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
    <div className={`${styles.instrumentWrap} ${className ?? ""}`}>
    <svg
      role="img"
      aria-label="An illustrative walking sequence in five gait phases, with hip, knee, ankle and centre-of-mass trajectories, an extracted knee-flexion signal, stride markers and a cadence readout, feeding a pose to signals to features to intelligence pipeline."
      viewBox={`0 0 ${W} ${H}`}
      className={styles.instrument}
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

      {/* ── Instrumentation annotations. Real constants only. ── */}
      <g className={styles.meta}>
        <text x={568} y={58} textAnchor="end">
          EXAMPLE STREAM · {SIGNAL_COUNT} SIGNALS
        </text>
        <text x={568} y={318} textAnchor="end">
          CAPABILITY LAYER · {CAPABILITY_COUNT}
        </text>
      </g>
    </svg>

      <PipelineRail />
    </div>
  );
}
