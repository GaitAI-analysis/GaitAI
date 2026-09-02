import { GAIT_PHASES, GAIT_NECK, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./labs.module.css";

/**
 * PILLAR 02 — pose-based gait analysis.
 *
 * A biomechanics read-out: one figure at capture scale with its measured
 * joints called out and their rotation arcs drawn, and beside it the curves
 * those joints produce over a stride. That is what "pose-based" means — the
 * measurement is taken off the skeleton, not off the pixels.
 *
 * The joint markers are the real keyframe coordinates, and both curves are the
 * same periodic functions the products page plots, so the figure and the
 * graphs describe one stride rather than being drawn to look related.
 */

const W = 760;
const H = 250;

const fig = {
  bone: styles.sBoneStrong,
  boneFar: styles.sBoneFar,
  joint: styles.sJointSoft,
  head: styles.sHead,
};

/** Hip flexion/extension: one cycle per stride. */
const hip = (t: number) => 0.5 + 0.42 * Math.cos(2 * Math.PI * (t - 0.04));

/** Knee flexion: the small loading response, then the large swing peak. */
const knee = (t: number) => {
  const tw = t - Math.floor(t);
  const bump = (c: number, w: number) =>
    [-1, 0, 1].reduce((s, k) => s + Math.exp(-(((tw - c - k) / w) ** 2)), 0);
  return 0.06 + 0.24 * bump(0.14, 0.09) + 0.9 * bump(0.73, 0.12);
};

/** A plotted channel: axis, curve and its own scale ticks. */
function Channel({
  x,
  y,
  w,
  h,
  fn,
  label,
  order,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fn: (t: number) => number;
  label: string;
  order: number;
}) {
  const pts: Pt[] = Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    return [x + t * w, y + h - fn(t) * h] as Pt;
  });
  return (
    <g style={{ ["--s-i" as string]: order }}>
      <text className={styles.sLabel} x={x} y={y - 8}>
        {label}
      </text>
      <line className={styles.sAxis} x1={x} y1={y + h} x2={x + w} y2={y + h} />
      <line className={styles.sAxis} x1={x} y1={y} x2={x} y2={y + h} />
      {[0, 0.5, 1].map((f) => (
        <line
          key={f}
          className={styles.sAxis}
          x1={x}
          y1={y + h - f * h}
          x2={x + 4}
          y2={y + h - f * h}
        />
      ))}
      <path className={styles.sCurve} d={smoothPath(pts)} />
    </g>
  );
}

/** A rotation arc at a joint, showing the range the joint moves through. */
function JointArc({
  at,
  r,
  from,
  to,
}: {
  at: Pt;
  r: number;
  from: number;
  to: number;
}) {
  const p = (a: number): Pt => [
    at[0] + Math.cos(a) * r,
    at[1] + Math.sin(a) * r,
  ];
  const [x0, y0] = p(from);
  const [x1, y1] = p(to);
  return (
    <path
      className={styles.sArc}
      d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(
        1,
      )} ${y1.toFixed(1)}`}
    />
  );
}

export function PoseBiomechanicsVisual() {
  const phase = GAIT_PHASES[3]; // toe-off: every measured joint is open
  const s = 1.95;
  const ox = 128;
  const oy = 178;

  /* The measured joints, in absolute coordinates. */
  const abs = ([jx, jy]: Pt): Pt => [ox + jx * s, oy + jy * s];
  const shoulder = abs(phase.nearArm[0]);
  const hipJ = abs(phase.nearLeg[0]);
  const kneeJ = abs(phase.nearLeg[1]);
  const ankleJ = abs(phase.nearLeg[2]);
  const neck = abs(GAIT_NECK);

  const callouts: { at: Pt; label: string; dx: number; dy: number }[] = [
    { at: shoulder, label: "SHOULDER", dx: -104, dy: -6 },
    { at: hipJ, label: "HIP", dx: -58, dy: -2 },
    { at: kneeJ, label: "KNEE", dx: -62, dy: 4 },
    { at: ankleJ, label: "ANKLE", dx: -68, dy: 10 },
  ];

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={styles.scene}>
      {/* ── The measured figure ── */}
      <text className={styles.sLabel} x={16} y={26}>
        POSE KEYPOINTS
      </text>

      <g className={styles.sPose} style={{ ["--s-i" as string]: 0 }}>
        <g transform={`translate(${ox} ${oy})`}>
          <PoseFrame phase={phase} s={s} classes={fig} showContacts />
        </g>

        {/* Rotation arcs at the joints the pillar measures. */}
        <JointArc at={hipJ} r={26} from={-0.5} to={0.9} />
        <JointArc at={kneeJ} r={20} from={-1.1} to={0.5} />
        <JointArc at={ankleJ} r={15} from={-1.5} to={0.1} />
        <JointArc at={shoulder} r={22} from={0.2} to={1.7} />

        {/* Called-out keypoints. */}
        {[shoulder, hipJ, kneeJ, ankleJ, neck].map(([cx, cy], i) => (
          <circle
            key={i}
            className={styles.sKeypoint}
            cx={cx}
            cy={cy}
            r={4}
            style={{ ["--s-i" as string]: i }}
          />
        ))}
        {callouts.map((c, i) => (
          <g key={c.label} style={{ ["--s-i" as string]: i }}>
            <line
              className={styles.sLeader}
              x1={c.at[0] + c.dx + 44}
              y1={c.at[1] + c.dy}
              x2={c.at[0] - 5}
              y2={c.at[1]}
            />
            <text
              className={styles.sCallout}
              x={c.at[0] + c.dx}
              y={c.at[1] + c.dy + 3}
            >
              {c.label}
            </text>
          </g>
        ))}
      </g>

      <line className={styles.sFloor} x1={16} y1={226} x2={252} y2={226} />

      {/* ── The curves those joints trace over one stride ── */}
      <Channel x={330} y={44} w={190} h={54} fn={knee} label="KNEE FLEXION" order={1} />
      <Channel x={330} y={148} w={190} h={54} fn={hip} label="HIP ANGLE" order={2} />

      {/* ── Stride and cadence, off the same cycle ── */}
      <text className={styles.sLabel} x={566} y={36}>
        STRIDE EVENTS
      </text>
      <g className={styles.sEvents} style={{ ["--s-i" as string]: 3 }}>
        <line className={styles.sAxis} x1={566} y1={92} x2={740} y2={92} />
        {Array.from({ length: 22 }, (_, i) => (
          <line
            key={i}
            className={styles.sTick}
            x1={568 + i * 8}
            y1={92}
            x2={568 + i * 8}
            y2={92 - (i % 7 === 0 ? 16 : 5)}
          />
        ))}
        {[0, 7, 14, 21].map((i) => (
          <circle
            key={i}
            className={styles.sEventNode}
            cx={568 + i * 8}
            cy={92}
            r={2.6}
          />
        ))}
      </g>
      <text className={styles.sDim} x={566} y={116}>
        HEEL STRIKE INTERVALS
      </text>

      <text className={styles.sLabel} x={566} y={162}>
        DERIVED
      </text>
      {["STRIDE LENGTH", "CADENCE", "ASYMMETRY", "WALKING SPEED"].map((k, i) => (
        <g key={k} style={{ ["--s-i" as string]: i }}>
          <text className={styles.sDerived} x={566} y={186 + i * 17}>
            {k}
          </text>
          <line
            className={styles.sDerivedRule}
            x1={670}
            y1={182 + i * 17}
            x2={740}
            y2={182 + i * 17}
          />
        </g>
      ))}
    </svg>
  );
}
