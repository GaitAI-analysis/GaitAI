import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame } from "@/components/research/PoseFrame";
import scene from "./scenes.module.css";
import styles from "./signal.module.css";

/**
 * STORY 01's TRANSFORMATION — video becomes a movement signal.
 *
 * The other four stories already had a drawn visual of their own argument
 * (see StoryVisuals). This is the missing first one, and it is the page's
 * thesis in one picture: three states of the same walk, left to right —
 *
 *   frames      a captured sequence, still pixels: the body as mass, inside
 *               the frame borders a camera actually produces
 *   landmarks   the same instant with the joints found
 *   signal      the body gone, only the temporal trace it produced
 *
 * The point is the last panel: what the pipeline keeps is not a picture of a
 * person. Nothing here is a measurement — there is no axis, no unit and no
 * value anywhere in it.
 */

/* The frame is cropped to the drawing. At 520 × 300 the composition sat in
   the middle third of its column with empty bands above and below, where the
   other four story visuals fill theirs. */
const VIEW = "8 40 504 208";

const S = 1.7;
const GROUND = 212;
const FY = GROUND - 48 * S;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** A joint chain in the figure's local space, for the mass strokes. */
const chain = (list: readonly Pt[]) =>
  list.map(([x, y]) => `${r1(x * S)},${r1(y * S)}`).join(" ");

/** The trace the third panel keeps: a stride's vertical oscillation. */
const TRACE = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i += 1) {
    const t = i / 60;
    const y =
      150 +
      Math.sin(t * Math.PI * 4) * 20 +
      Math.sin(t * Math.PI * 8 + 0.6) * 6;
    pts.push(`${r1(374 + t * 128)},${r1(y)}`);
  }
  return `M ${pts.join(" L ")}`;
})();

export function SignalStage() {
  /* Heel strike, not mid-stance: stacked vertical limbs merge into one
     column once they are stroked wide, and the first panel has to read as a
     person. */
  const phase = GAIT_PHASES[0];
  const marks = [...phase.nearArm, ...phase.nearLeg];

  return (
    <svg aria-hidden="true" viewBox={VIEW} className={scene.scene}>
      {/* ── panel 1 · frames: pixels, with the body as mass ── */}
      <g>
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            className={styles.stageFrame}
            x={18 + i * 14}
            y={62 + i * 8}
            width={106}
            height={128}
            rx={3}
          />
        ))}
        <g transform={`translate(${72} ${FY})`}>
          <g className={styles.stageMass}>
            <polyline points={chain(phase.nearArm)} />
            <polyline points={chain(phase.nearLeg)} />
            <line
              x1={r1(1.5 * S)}
              y1={r1(-34 * S)}
              x2={0}
              y2={r1(2 * S)}
            />
            <circle cx={r1(2 * S)} cy={r1(-42 * S)} r={r1(6.4 * S)} />
          </g>
        </g>
        <text className={scene.scTiny} x={18} y={234}>
          FRAMES
        </text>
      </g>

      {/* ── panel 2 · landmarks: the joints found ── */}
      <g>
        <g transform={`translate(${218} ${FY})`}>
          <PoseFrame
            phase={phase}
            s={S}
            classes={{
              bone: scene.scBone,
              boneFar: scene.scBoneFar,
              joint: scene.scJoint,
              head: scene.scHead,
            }}
          />
          {marks.map(([x, y], i) => (
            <circle
              key={i}
              className={styles.stageMark}
              cx={r1(x * S)}
              cy={r1(y * S)}
              r={5.4}
            />
          ))}
        </g>
        <text className={scene.scTiny} x={196} y={234}>
          LANDMARKS
        </text>
      </g>

      {/* ── panel 3 · the signal: the body gone ── */}
      <g>
        <path className={styles.stageTrace} d={TRACE} />
        <text className={scene.scTinyAccent} x={374} y={234}>
          MOVEMENT SIGNAL
        </text>
      </g>

      {/* ── the floor, and the two transitions ── */}
      <line className={scene.scFloor} x1={18} y1={GROUND + 10} x2={502} y2={GROUND + 10} />
      {[
        [150, 300],
        [318, 366],
      ].map(([x1, x2]) => (
        <g key={x1}>
          <line className={styles.stageStep} x1={x1} y1={132} x2={x2} y2={132} />
          <path
            className={styles.stageStepHead}
            d={`M ${x2 - 6} 128 L ${x2} 132 L ${x2 - 6} 136`}
          />
        </g>
      ))}
    </svg>
  );
}
