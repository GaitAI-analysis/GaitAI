import {
  GAIT_HEAD,
  GAIT_NECK,
  GAIT_PHASES,
  type Pt,
} from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./observatory.module.css";

/**
 * The hero, built as a motion-capture lab rather than as a heading over an
 * empty background.
 *
 * WHAT IS DRAWN, AND WHY IT IS THE HERO
 * The page's claim is a published record about human movement. So the first
 * screen shows the thing being studied, in the form the research studies it:
 * one stride sampled at six captured frames, the joint trajectories those
 * frames trace, and the temporal signal the trajectories reduce to. Read
 * left to right it says HUMAN GAIT → TEMPORAL SIGNAL → REPRESENTATION without
 * a sentence of help.
 *
 * The six frames come from `gait-phases.ts` — the same five canonical gait
 * events the rest of the site draws with, plus the next heel strike, so the
 * sequence closes a full cycle instead of stopping mid-stride. Nothing is a
 * rotated copy of one silhouette: every joint is placed from the data, which
 * is why the trajectory curves through the frames are real curves and not
 * decoration.
 *
 * COMPOSITION
 * The lab is a full-bleed layer, not a picture in a box: the frames sit in the
 * right two-thirds, the signal band runs the whole width under them, and a
 * mask fades the left edge so the headline sits on clean ground. Annotations
 * are set at the smallest legible size and the lowest legible contrast — they
 * are instrument labels, and an instrument label that shouts is a poster.
 *
 * MOTION
 * One entrance, then rest: the frames arrive in stride order, the trajectories
 * draw, the signal draws, and a single sample point travels the signal on a
 * slow loop. Nothing bobs, nothing spins, nothing follows the pointer.
 */

/* One full stride: five canonical events plus the next heel strike. */
const FRAMES = [0, 1, 2, 3, 4, 0] as const;

const W = 1440;
const H = 620;

/** Frame geometry. The baseline climbs to the right and alternates a little,
    so the frames read as captured samples rather than as a chorus line. */
const SCALE = 2.05;
const X0 = 636;
const STEP = 116;
const BASE = [506, 492, 500, 480, 488, 468] as const;

const figureClasses = {
  bone: styles.labBone,
  boneFar: styles.labBoneFar,
  joint: styles.labJoint,
  head: styles.labHead,
  contact: styles.labContact,
};

/** Absolute position of a frame's origin (pelvis). */
const originOf = (i: number): Pt => [X0 + i * STEP, BASE[i]];

/**
 * A joint's path across the six frames, in absolute coordinates. This is the
 * whole reason the frames are data rather than art: the trajectory is sampled
 * from the same keyframes the figures are drawn from, so the curve genuinely
 * passes through each pose's joint.
 */
function trajectory(pick: (i: number) => Pt): string {
  return smoothPath(
    FRAMES.map((_, i) => {
      const [ox, oy] = originOf(i);
      const [jx, jy] = pick(i);
      return [ox + jx * SCALE, oy + jy * SCALE] as Pt;
    }),
  );
}

/** Stride signal: a vertical-oscillation curve over the captured cycle. */
function strideSignal(y0: number, amp: number) {
  const pts: Pt[] = Array.from({ length: 97 }, (_, i) => {
    const t = i / 96;
    /* Two peaks per stride — one per step — with the trailing step lower, the
       asymmetry the annotation beside it names. */
    const v =
      Math.sin(t * Math.PI * 4) * (t < 0.5 ? 1 : 0.62) +
      Math.sin(t * Math.PI * 8) * 0.16;
    return [120 + t * 1200, y0 - v * amp] as Pt;
  });
  return smoothPath(pts);
}

/** Instrument annotation: a hairline leader and a label. */
function Note({
  x,
  y,
  to,
  label,
  anchor = "start",
  order = 0,
}: {
  x: number;
  y: number;
  to?: Pt;
  label: string;
  anchor?: "start" | "end" | "middle";
  order?: number;
}) {
  return (
    <g className={styles.labNote} style={{ ["--l-i" as string]: order }}>
      {to && (
        <line className={styles.labLeader} x1={x} y1={y} x2={to[0]} y2={to[1]} />
      )}
      <text className={styles.labNoteText} x={x} y={y - 6} textAnchor={anchor}>
        {label}
      </text>
    </g>
  );
}

export function ResearchHeroLab() {
  const signalY = 566;

  /* Joint picks, per frame, in the figure's local coordinates. */
  const ankle = (i: number) => GAIT_PHASES[FRAMES[i]].nearLeg[2];
  const knee = (i: number) => GAIT_PHASES[FRAMES[i]].nearLeg[1];
  const wrist = (i: number) => GAIT_PHASES[FRAMES[i]].nearArm[2];
  const head = () => GAIT_HEAD;
  const neck = () => GAIT_NECK;

  /* Heel-strike events, for the ticks that tie the signal to the frames. */
  const events = FRAMES.map((_, i) => originOf(i)[0]);

  return (
    <svg
      aria-hidden="true"
      className={styles.lab}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* The left-edge fade that keeps the headline off the figures is a CSS
            mask on the <svg> itself, not an SVG <mask> here. An SVG mask fails
            CLOSED — anything that stops it resolving hides the whole hero —
            and that is exactly what happened: the lab rendered nothing while
            the mask was in place. A CSS mask-image fails open. */}
        <linearGradient id="lab-signal" gradientUnits="userSpaceOnUse" x1="120" x2="1320">
          <stop offset="0" className={styles.labStopCyan} />
          <stop offset="0.55" className={styles.labStopBlue} />
          <stop offset="1" className={styles.labStopViolet} />
        </linearGradient>
      </defs>

      <g>
        {/* ── Surveyed ground: axis ticks and a capture floor ── */}
        <g className={styles.labGrid}>
          {Array.from({ length: 49 }, (_, i) => {
            const x = 120 + i * 25;
            return (
              <line
                key={x}
                x1={x}
                y1={H - 24}
                x2={x}
                y2={H - (i % 4 === 0 ? 34 : 29)}
              />
            );
          })}
          <line x1={120} y1={H - 24} x2={1320} y2={H - 24} />
          {[300, 380, 460].map((y) => (
            <line key={y} className={styles.labGridSoft} x1={120} y1={y} x2={1320} y2={y} />
          ))}
        </g>

        {/* ── Joint trajectories, sampled through the captured frames ── */}
        <g>
          {[
            { d: trajectory(head), i: 0 },
            { d: trajectory(neck), i: 1 },
            { d: trajectory(wrist), i: 2 },
            { d: trajectory(knee), i: 3 },
            { d: trajectory(ankle), i: 4 },
          ].map(({ d, i }) => (
            <path
              key={i}
              className={styles.labTrajPath}
              d={d}
              style={{ ["--l-i" as string]: i }}
            />
          ))}
        </g>

        {/* ── The captured frames ── */}
        {FRAMES.map((phaseIndex, i) => {
          const [ox, oy] = originOf(i);
          return (
            /* The translate lives on an OUTER group and the animation on an
               inner one. A CSS `transform` animation REPLACES an element's
               `transform` attribute rather than composing with it, so animating
               the positioned group sent all six figures to the SVG origin —
               which is exactly the bug that made this hero look empty. */
            <g key={i} transform={`translate(${ox} ${oy})`}>
              <g
                className={styles.labFrame}
                style={{ ["--l-i" as string]: i }}
              >
                <PoseFrame
                  phase={GAIT_PHASES[phaseIndex]}
                  s={SCALE}
                  classes={figureClasses}
                  showContacts
                />
                {/* Frame index, at instrument scale. */}
                <text className={styles.labFrameId} x={-4} y={70}>
                  {String(i + 1).padStart(2, "0")}
                </text>
              </g>
            </g>
          );
        })}

        {/* ── Trajectory sample nodes, on the ankle path ── */}
        <g className={styles.labTrajNodes}>
          {FRAMES.map((_, i) => {
            const [ox, oy] = originOf(i);
            const [jx, jy] = ankle(i);
            return (
              <circle
                key={i}
                cx={ox + jx * SCALE}
                cy={oy + jy * SCALE}
                r={3}
                style={{ ["--l-i" as string]: i }}
              />
            );
          })}
        </g>

        {/* ── The temporal signal the trajectories reduce to ── */}
        <g>
          <path className={styles.labSignalPath} d={strideSignal(signalY, 30)} />
          <path
            className={styles.labSignalFlow}
            d={strideSignal(signalY, 30)}
            pathLength={100}
          />
          {/* Stride events, aligned to the captured frames. */}
          {events.map((x, i) => (
            <g key={i} style={{ ["--l-i" as string]: i }}>
              <line
                className={styles.labEventStem}
                x1={x}
                y1={signalY + 34}
                x2={x}
                y2={signalY - 34}
              />
              <circle
                className={styles.labEventNode}
                cx={x}
                cy={signalY}
                r={i === 0 || i === 5 ? 3.4 : 2.2}
              />
            </g>
          ))}
        </g>

        {/* ── Instrument annotations. Deliberately near the noise floor. ── */}
        <Note
          x={X0 - 96}
          y={BASE[0] - 190}
          to={[X0 - 8, BASE[0] - 176]}
          label="POSE"
          order={0}
        />
        <Note
          x={X0 + STEP * 2 - 30}
          y={BASE[2] - 232}
          to={[X0 + STEP * 2 + 2, BASE[2] - 76]}
          label="HIP ANGLE"
          order={1}
        />
        <Note
          x={X0 + STEP * 3 + 64}
          y={BASE[3] - 34}
          to={[X0 + STEP * 3 + 24, BASE[3] - 22]}
          label="KNEE FLEXION"
          order={2}
        />
        <Note
          x={X0 + STEP * 5 + 54}
          y={BASE[5] - 206}
          label="ASYMMETRY"
          order={3}
        />
        <Note x={148} y={signalY - 52} label="STRIDE" order={4} />
        <Note x={148} y={H - 40} label="CADENCE" order={5} />
        <Note
          x={1318}
          y={signalY - 52}
          label="TEMPORAL SIGNAL"
          anchor="end"
          order={6}
        />
      </g>
    </svg>
  );
}
