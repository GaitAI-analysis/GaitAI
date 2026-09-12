import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import {
  PLATE,
  WALKER_MASK,
  WALKER_PHASE,
  plateFit,
  walkerStride,
} from "@/components/visuals/capture-plate";
import { assetPath } from "@/lib/paths";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./labs.module.css";

/**
 * PILLAR 03 — privacy-preserving gait data.
 *
 * The same captured frame, four times, with information taken away at every
 * step. The argument is subtractive, so the picture is subtractive — a
 * paragraph saying "identity is not required" is not the same argument as
 * watching identity leave the frame.
 *
 * 01 CAPTURED FRAME is a photograph. It used to be a drawn silhouette, which
 * on the one pillar whose subject is what real footage contains was a
 * mannequin standing in for footage. It is now the site's capture plate — the
 * project's own photoreal walking frame (scripts/build-capture-plate.py).
 *
 * 02, 03 AND 04 ARE DERIVED FROM 01, not drawn beside it. The silhouette is
 * the walker's foreground segmentation traced from that frame's own pixels;
 * the skeleton is that walker's joints, placed on the photograph and expressed
 * as a gait pose; the movement signal is the stride those joints imply, scaled
 * to that walker and anchored at that pelvis. Everything comes from
 * `visuals/capture-plate.ts`, so the four stages cannot drift apart: change the
 * frame and all four change with it.
 *
 * The retained-information bar is the honest part: it falls because each stage
 * carries strictly less than the one before. It is a relative shape with no
 * number on it, because this repository holds no measurement of information
 * retained. And "no person" in stage four means no image of a person — pose
 * and gait can themselves carry identity, which is the subject of the pillar
 * beside this one.
 */

const W = 760;
const H = 300;

/* Band baselines. Everything below is placed off these, so no stage's plate can
   end up inside the bar row. */
const LABEL_Y = 22;
const STAGE_Y = 38;
const PLATE_TOP = 50;
/* The plate stops here so the stage note and the bar caption keep the
   original 24 units between their baselines: the type is fixed-pixel, so at a
   phone width it is twice as tall against the viewBox, and any less collides. */
const FLOOR_Y = 206;
const NOTE_Y = FLOOR_Y + 16;
/* Above the tallest bar (40 units on a 292 base), not inside it. */
const BAR_LABEL_Y = FLOOR_Y + 40;
const BAR_BASE_Y = H - 8;

/* One plate box per stage: the column's own width, floor to just under the
   stage label. Portrait cut, `slice`, so the walker fills it. */
const PLATE_W = 104;
const PLATE_H = FLOOR_Y - PLATE_TOP;

const STAGES = [
  { key: "rgb", label: "CAPTURED FRAME", note: "APPEARANCE PRESENT", bar: 40 },
  { key: "contour", label: "APPEARANCE REMOVED", note: "SEGMENTATION MASK", bar: 26 },
  { key: "skeleton", label: "POSE SKELETON", note: "KEYPOINTS", bar: 15 },
  { key: "signal", label: "MOVEMENT SIGNAL", note: "NO IMAGE", bar: 6 },
] as const;

export function PrivacyTransformationVisual() {
  const xs = [86, 258, 430, 602];

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={styles.scene}>
      <defs>
        {xs.map((x, i) => (
          <clipPath key={i} id={`ptv-plate-${i}`}>
            <rect x={x - PLATE_W / 2} y={PLATE_TOP} width={PLATE_W} height={PLATE_H} rx={3} />
          </clipPath>
        ))}
      </defs>

      <line className={styles.sFloor} x1={24} y1={FLOOR_Y} x2={736} y2={FLOOR_Y} />

      {STAGES.map((stage, i) => {
        const box = { x: xs[i] - PLATE_W / 2, y: PLATE_TOP, w: PLATE_W, h: PLATE_H };
        const fit = plateFit("portrait", box);
        const stride = walkerStride(fit, GAIT_PHASES, 5.5);
        const ankle = smoothPath(stride.map((m) => m.pick((p) => p.nearLeg[2])));
        const wrist = smoothPath(stride.map((m) => m.pick((p) => p.nearArm[2])));

        return (
          <g key={stage.key} style={{ ["--s-i" as string]: i }}>
            <text className={styles.sLabel} x={xs[i] - 52} y={LABEL_Y}>
              {`0${i + 1}`}
            </text>
            <text className={styles.pStageLabel} x={xs[i] - 52} y={STAGE_Y}>
              {stage.label}
            </text>

            {/* The frame every stage sits in. */}
            <rect className={styles.pPlate} x={box.x} y={box.y} width={box.w} height={box.h} rx={3} />

            <g className={styles.sPose} clipPath={`url(#ptv-plate-${i})`}>
              {/* 01 · the photograph, and 02 · the same photograph, dimmed,
                  under the mask it produced. */}
              {(stage.key === "rgb" || stage.key === "contour") && (
                <image
                  href={assetPath(PLATE.portrait.src)}
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  preserveAspectRatio="xMidYMid slice"
                  className={styles.pPhoto}
                  style={stage.key === "contour" ? { opacity: 0.16 } : undefined}
                />
              )}

              {stage.key === "contour" && (
                <g transform={fit.transform}>
                  <path className={styles.pMask} d={WALKER_MASK.path} />
                </g>
              )}

              {/* 03 · the joints of that walker. The mask's edge stays as a
                  hairline, so the skeleton reads as what is left of the
                  outline rather than as a figure of its own. */}
              {stage.key === "skeleton" && (
                <>
                  <g transform={fit.transform}>
                    <path className={styles.pMaskEdge} d={WALKER_MASK.path} />
                  </g>
                  <g transform={`translate(${fit.hip[0]} ${fit.hip[1]})`}>
                    <PoseFrame
                      phase={WALKER_PHASE}
                      s={fit.poseScale}
                      classes={{
                        bone: styles.sBoneStrong,
                        boneFar: styles.sBoneFar,
                        joint: styles.sJoint,
                        head: styles.pSkeletonHead,
                      }}
                    />
                  </g>
                </>
              )}

              {/* 04 · the stride those joints imply: the walk's earlier moments
                  ghosted behind the photographed one, and the path the ankle
                  and wrist trace through them. The photographed pose is the
                  last moment, at the pelvis the photograph put it. */}
              {stage.key === "signal" && (
                <>
                  {stride.slice(0, -1).map((m, k) => (
                    <g key={k} transform={`translate(${m.x} ${m.y})`} opacity={0.18 + k * 0.08}>
                      <PoseFrame
                        phase={m.phase}
                        s={m.scale}
                        showFar={false}
                        classes={{
                          bone: styles.sBoneStrong,
                          boneFar: styles.sBoneFar,
                          joint: styles.sJointSoft,
                          head: styles.pGhostHead,
                        }}
                      />
                    </g>
                  ))}
                  <path className={styles.pTrail} d={ankle} />
                  <path className={styles.pTrail} d={wrist} style={{ opacity: 0.45 }} />
                  {stride.map((m, k) => {
                    const [tx, ty] = m.pick((p) => p.nearLeg[2]);
                    return <circle key={k} className={styles.pTrailNode} cx={tx} cy={ty} r={2} />;
                  })}
                  {[...WALKER_PHASE.nearArm, ...WALKER_PHASE.nearLeg, ...WALKER_PHASE.farLeg.slice(1)].map(
                    ([jx, jy]: Pt, k) => (
                      <circle
                        key={`j${k}`}
                        className={styles.pDot}
                        cx={fit.hip[0] + jx * fit.poseScale}
                        cy={fit.hip[1] + jy * fit.poseScale}
                        r={2}
                      />
                    ),
                  )}
                </>
              )}
            </g>

            <text className={styles.sDim} x={xs[i] - 52} y={NOTE_Y}>
              {stage.note}
            </text>

            {/* What this stage stops carrying. */}
            {i > 0 && (
              <g className={styles.pStrip}>
                <line x1={xs[i] - 96} y1={PLATE_TOP + PLATE_H / 2} x2={xs[i] - 70} y2={PLATE_TOP + PLATE_H / 2} />
                <polyline
                  points={`${xs[i] - 76},${PLATE_TOP + PLATE_H / 2 - 4} ${xs[i] - 70},${PLATE_TOP + PLATE_H / 2} ${xs[i] - 76},${PLATE_TOP + PLATE_H / 2 + 4}`}
                />
              </g>
            )}

            {/* Retained information: strictly less at every stage. */}
            <g className={styles.pBar}>
              <rect x={xs[i] - 52} y={BAR_BASE_Y - stage.bar} width={104} height={stage.bar} rx={2} />
            </g>
          </g>
        );
      })}

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
