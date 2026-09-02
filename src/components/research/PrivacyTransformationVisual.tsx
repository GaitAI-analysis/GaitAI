import { GAIT_PHASES, GAIT_HEAD, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./labs.module.css";

/**
 * PILLAR 03 — privacy-preserving gait data.
 *
 * The same captured person, four times, with information taken away at every
 * step: a solid body, then its outline only, then the skeleton, then nothing
 * but joints and the path they trace. The argument is subtractive, so the
 * picture is subtractive — a paragraph saying "identity is not required" is not
 * the same argument as watching identity leave the frame.
 *
 * The body is built as a real silhouette — head, tapered torso, thick limbs —
 * rather than as fat strokes over the skeleton, which read as a blob rather
 * than as a person and so lost the whole contrast the sequence depends on.
 * Its limbs are still the shared keyframe coordinates, so the four stages are
 * unmistakably one person: nothing changes across the sequence except how much
 * of them is kept.
 *
 * The retained-information bar is the honest part: it falls because each stage
 * carries strictly less than the one before. It is a relative shape with no
 * number on it, because this repository holds no measurement of information
 * retained.
 */

const W = 760;
const H = 300;

const PHASE = GAIT_PHASES[2]; // mid-stance: the most legible silhouette
const S = 1.25;

/* Band baselines. Everything below is placed off these, so no stage's legs can
   end up inside the bar row. */
const LABEL_Y = 22;
const STAGE_Y = 38;
const FIG_Y = 152;
const FLOOR_Y = FIG_Y + 48 * S + 2;
const NOTE_Y = FLOOR_Y + 20;
const BAR_LABEL_Y = FLOOR_Y + 44;
const BAR_BASE_Y = H - 8;

const STAGES = [
  { key: "rgb", label: "CAPTURED FRAME", note: "APPEARANCE PRESENT", bar: 40 },
  { key: "contour", label: "APPEARANCE REMOVED", note: "OUTLINE ONLY", bar: 26 },
  { key: "skeleton", label: "POSE SKELETON", note: "KEYPOINTS", bar: 15 },
  { key: "signal", label: "MOVEMENT SIGNAL", note: "NO PERSON", bar: 6 },
] as const;

const p2 = (list: readonly Pt[]) =>
  list.map(([x, y]) => `${(x * S).toFixed(1)},${(y * S).toFixed(1)}`).join(" ");

/**
 * A human silhouette over the pose. The torso is a tapered polygon and the
 * limbs are thick round-capped strokes on the keyframe coordinates, so the
 * shape is a body rather than a smear.
 */
function Body({ variant }: { variant: "solid" | "outline" }) {
  const solid = variant === "solid";
  const shoulder = -34 * S;
  const hip = -14 * S;
  const torso = [
    `${(-7.5 * S).toFixed(1)},${shoulder.toFixed(1)}`,
    `${(9 * S).toFixed(1)},${shoulder.toFixed(1)}`,
    `${(6 * S).toFixed(1)},${hip.toFixed(1)}`,
    `${(-5 * S).toFixed(1)},${hip.toFixed(1)}`,
  ].join(" ");

  return (
    <g className={solid ? styles.pBody : styles.pBodyOutline}>
      <polyline className={styles.pLimb} points={p2(PHASE.farArm)} />
      <polyline className={styles.pLimbLeg} points={p2(PHASE.farLeg)} />
      <polygon className={styles.pTorso} points={torso} />
      <polyline className={styles.pLimbLeg} points={p2(PHASE.nearLeg)} />
      <polyline className={styles.pLimb} points={p2(PHASE.nearArm)} />
      <circle
        className={styles.pHeadMass}
        cx={GAIT_HEAD[0] * S}
        cy={GAIT_HEAD[1] * S}
        r={6.4 * S}
      />
    </g>
  );
}

export function PrivacyTransformationVisual() {
  const xs = [86, 258, 430, 602];

  /* Stage four: the joints alone, plus the path the ankle traces through the
     stride — the only thing left once the person is gone. */
  const joints: readonly Pt[] = [
    ...PHASE.nearArm,
    ...PHASE.nearLeg,
    GAIT_HEAD,
  ];
  /* The ankle's path across the whole stride. In the last stage this is the
     dominant mark, not the dots: once the person is gone, the trajectory IS
     the remaining signal, and it has to look like the subject of the frame
     rather than a hairline under a scatter. */
  const trail: Pt[] = GAIT_PHASES.map((phase, i) => {
    const [ax, ay] = phase.nearLeg[2];
    return [(i - 2) * 15 + ax * 0.5, ay * S * 0.55 - 6] as Pt;
  });

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={styles.scene}>
      <line className={styles.sFloor} x1={24} y1={FLOOR_Y} x2={736} y2={FLOOR_Y} />

      {STAGES.map((stage, i) => (
        <g key={stage.key} style={{ ["--s-i" as string]: i }}>
          <text className={styles.sLabel} x={xs[i] - 52} y={LABEL_Y}>
            {`0${i + 1}`}
          </text>
          <text className={styles.pStageLabel} x={xs[i] - 52} y={STAGE_Y}>
            {stage.label}
          </text>

          {/* Translate outside, animation inside: a CSS transform animation
              replaces the transform attribute instead of composing with it. */}
          <g transform={`translate(${xs[i]} ${FIG_Y})`}>
            <g className={styles.sPose}>
              {stage.key === "rgb" && <Body variant="solid" />}
              {stage.key === "contour" && <Body variant="outline" />}
              {stage.key === "skeleton" && (
                <PoseFrame
                  phase={PHASE}
                  s={S}
                  classes={{
                    bone: styles.sBoneStrong,
                    boneFar: styles.sBoneFar,
                    joint: styles.sJoint,
                    head: styles.pSkeletonHead,
                  }}
                />
              )}
              {stage.key === "signal" && (
                <>
                  {joints.map(([jx, jy], j) => (
                    <circle
                      key={j}
                      className={styles.pDot}
                      cx={jx * S}
                      cy={jy * S}
                      r={2.2}
                    />
                  ))}
                  <path className={styles.pTrail} d={smoothPath(trail)} />
                  {trail.map(([tx, ty], j) => (
                    <circle
                      key={`t${j}`}
                      className={styles.pTrailNode}
                      cx={tx}
                      cy={ty}
                      r={2}
                    />
                  ))}
                </>
              )}
            </g>
          </g>

          <text className={styles.sDim} x={xs[i] - 52} y={NOTE_Y}>
            {stage.note}
          </text>

          {/* What this stage stops carrying. */}
          {i > 0 && (
            <g className={styles.pStrip}>
              <line x1={xs[i] - 96} y1={FIG_Y - 34} x2={xs[i] - 70} y2={FIG_Y - 34} />
              <polyline
                points={`${xs[i] - 76},${FIG_Y - 38} ${xs[i] - 70},${FIG_Y - 34} ${xs[i] - 76},${FIG_Y - 30}`}
              />
            </g>
          )}

          {/* Retained information: strictly less at every stage. */}
          <g className={styles.pBar}>
            <rect
              x={xs[i] - 52}
              y={BAR_BASE_Y - stage.bar}
              width={104}
              height={stage.bar}
              rx={2}
            />
          </g>
        </g>
      ))}

      <text className={styles.sLabel} x={24} y={BAR_LABEL_Y}>
        RETAINED INFORMATION
      </text>
      <text className={styles.pClosing} x={736} y={BAR_LABEL_Y} textAnchor="end">
        ANALYTICS RUN ON THE LAST FRAME
      </text>
      <line className={styles.sAxis} x1={24} y1={BAR_BASE_Y} x2={736} y2={BAR_BASE_Y} />
    </svg>
  );
}
