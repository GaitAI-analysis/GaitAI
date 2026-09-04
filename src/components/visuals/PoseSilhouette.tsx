import { GAIT_HEAD, type GaitPhase, type Pt } from "./gait-phases";

/**
 * The body mass over a pose — what a person sees, as opposed to what a model
 * reads.
 *
 * `PoseFrame` draws the SKELETON from the shared gait keyframes. This draws
 * the same keyframes as a figure: a tapered torso polygon, thick round-capped
 * limbs and a head disc. The two are anatomically identical by construction,
 * which is the entire point — any surface that shows a human view and an AI
 * view of "the same walk" has to be able to prove it is the same walk, and it
 * can, because both views read one array.
 *
 * WHY THIS IS A SHARED PRIMITIVE. The geometry was written once inside the
 * research privacy pillar, and then wanted by the Movement X-Ray and by the
 * SecureVision privacy lens. Three copies of a torso polygon is three chances
 * for the human view and the AI view to drift apart, which would make the
 * comparison a lie. So the geometry lives here and the CALLER OWNS THE COLOUR,
 * exactly as `PoseFrame` does it — each section's CSS module stays in charge
 * of its own palette and motion, and this file has no opinion about either.
 *
 * Fat strokes over a skeleton read as a smear rather than as a person, and the
 * whole contrast depends on the human view actually looking human, so the
 * torso is a real polygon and the limbs are separately weighted (legs heavier
 * than arms).
 */

export type SilhouetteClasses = {
  /** The wrapper — where fill/stroke colour and opacity belong. */
  group: string;
  torso: string;
  limb: string;
  limbLeg: string;
  head: string;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function PoseSilhouette({
  phase,
  s,
  classes,
  /** Draw the far-side arm and leg behind the torso. */
  showFar = true,
}: {
  phase: GaitPhase;
  /** Figure scale; the local box is roughly 90 units tall at s = 1. */
  s: number;
  classes: SilhouetteClasses;
  showFar?: boolean;
}) {
  const pts = (list: readonly Pt[]) =>
    list.map(([x, y]) => `${r1(x * s)},${r1(y * s)}`).join(" ");

  /* Shoulder and hip lines, in the same local frame the keyframes use: the
     torso has to meet the arms at the shoulder and the legs at the pelvis, or
     the figure comes apart at exactly the joints the AI view highlights. */
  const shoulder = r1(-34 * s);
  const hip = r1(-14 * s);
  const torso = [
    `${r1(-7.5 * s)},${shoulder}`,
    `${r1(9 * s)},${shoulder}`,
    `${r1(6 * s)},${hip}`,
    `${r1(-5 * s)},${hip}`,
  ].join(" ");

  return (
    <g className={classes.group}>
      {showFar && (
        <>
          <polyline className={classes.limb} points={pts(phase.farArm)} />
          <polyline className={classes.limbLeg} points={pts(phase.farLeg)} />
        </>
      )}
      <polygon className={classes.torso} points={torso} />
      <polyline className={classes.limbLeg} points={pts(phase.nearLeg)} />
      <polyline className={classes.limb} points={pts(phase.nearArm)} />
      <circle
        className={classes.head}
        cx={r1(GAIT_HEAD[0] * s)}
        cy={r1(GAIT_HEAD[1] * s)}
        r={r1(6.4 * s)}
      />
    </g>
  );
}
