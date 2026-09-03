"use client";

import { useMemo } from "react";
import {
  BONES,
  LM,
  TRACKED,
  primaryPose,
  type Landmark,
  type PoseResult,
} from "./usePoseAnalysis";
import styles from "./analyzer.module.css";

/**
 * WHAT GAITAI SEES — the movement abstraction, beside the original frame.
 *
 * Everything drawn here is the model's own output for the instant the video is
 * sitting on: the skeleton from the 33 detected landmarks, the four instants
 * before it as fading history, and each tracked joint's real path across the
 * whole clip. Scrubbing the video moves all of it, because all of it is
 * indexed by time.
 *
 * The figure is drawn as a biomechanics readout rather than a stick man:
 * hairline bones, open keypoints at the joints the analysis actually uses,
 * heavier marks on the ankles and hips that the derived features come from, a
 * body-centre cross at the hip midpoint, and trajectory arcs behind it all.
 *
 * Low-confidence landmarks are dropped rather than drawn at a guess — a bone
 * to a keypoint the model is unsure of is a bone in the wrong place.
 */

const VIS_FLOOR = 0.5;
/** How many earlier instants trail the current one. */
const GHOSTS = 4;

/** The joints that carry a heavier mark: the ones features come from. */
const KEY_JOINTS = new Set<number>([
  LM.lHip,
  LM.rHip,
  LM.lKnee,
  LM.rKnee,
  LM.lAnkle,
  LM.rAnkle,
]);

/** Joints worth showing at all — the face landmarks are noise here. */
const SHOWN = new Set<number>([
  LM.lShoulder,
  LM.rShoulder,
  LM.lElbow,
  LM.rElbow,
  LM.lWrist,
  LM.rWrist,
  LM.lHip,
  LM.rHip,
  LM.lKnee,
  LM.rKnee,
  LM.lAnkle,
  LM.rAnkle,
  LM.lToe,
  LM.rToe,
]);

function Skeleton({
  pose,
  w,
  h,
  variant,
  order = 0,
}: {
  pose: Landmark[];
  w: number;
  h: number;
  variant: "current" | "ghost" | "other";
  order?: number;
}) {
  const px = (l: Landmark) => [l.x * w, l.y * h] as const;
  const cls =
    variant === "current"
      ? styles.psBone
      : variant === "ghost"
        ? styles.psBoneGhost
        : styles.psBoneOther;

  return (
    <g style={variant === "ghost" ? { ["--g" as string]: order } : undefined}>
      {BONES.map(([a, b], i) => {
        const la = pose[a];
        const lb = pose[b];
        if (!la || !lb) return null;
        if (la.visibility < VIS_FLOOR || lb.visibility < VIS_FLOOR) return null;
        const [x1, y1] = px(la);
        const [x2, y2] = px(lb);
        return (
          <line key={i} className={cls} x1={x1} y1={y1} x2={x2} y2={y2} />
        );
      })}

      {variant === "current" &&
        pose.map((l, i) => {
          if (!SHOWN.has(i) || l.visibility < VIS_FLOOR) return null;
          const [x, y] = px(l);
          return (
            <circle
              key={i}
              className={KEY_JOINTS.has(i) ? styles.psKeyJoint : styles.psJoint}
              cx={x}
              cy={y}
              r={KEY_JOINTS.has(i) ? 5 : 3.4}
            />
          );
        })}
    </g>
  );
}

export function PoseStage({
  result,
  time,
}: {
  result: PoseResult;
  time: number;
}) {
  const w = 1000;
  const h = Math.round((result.height / result.width) * 1000);

  /** The sampled instant nearest the video's position. */
  const index = useMemo(() => {
    let best = 0;
    let bestD = Infinity;
    result.samples.forEach((s, i) => {
      const d = Math.abs(s.t - time);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }, [result.samples, time]);

  const sample = result.samples[index];
  const current = sample ? primaryPose(sample) : null;

  /** Each tracked joint's path across the clip, from the primary pose. */
  const paths = useMemo(
    () =>
      TRACKED.map((joint) => {
        const pts: string[] = [];
        for (const s of result.samples) {
          const pose = primaryPose(s);
          const l = pose?.[joint.index];
          if (l && l.visibility >= VIS_FLOOR) {
            pts.push(`${(l.x * w).toFixed(1)},${(l.y * h).toFixed(1)}`);
          }
        }
        return { key: joint.key, points: pts.join(" ") };
      }).filter((p) => p.points.length > 0),
    [result.samples, h],
  );

  const hipCentre = (() => {
    if (!current) return null;
    const lh = current[LM.lHip];
    const rh = current[LM.rHip];
    if (!lh || !rh || lh.visibility < VIS_FLOOR || rh.visibility < VIS_FLOOR) {
      return null;
    }
    return [((lh.x + rh.x) / 2) * w, ((lh.y + rh.y) / 2) * h] as const;
  })();

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={styles.psStage}
      role="img"
      aria-label={
        current
          ? `Movement abstraction at ${time.toFixed(1)} seconds: a detected body skeleton with ${paths.length} joint paths traced across the clip.`
          : `Movement abstraction at ${time.toFixed(1)} seconds: no body detected at this instant; the motion field is shown instead.`
      }
    >
      {/* Surveyed ground, so the figure has a frame to move in. */}
      <g className={styles.psGrid}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={`v${f}`} x1={w * f} y1={0} x2={w * f} y2={h} />
        ))}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={`h${f}`} x1={0} y1={h * f} x2={w} y2={h * f} />
        ))}
      </g>

      {/* Joint paths across the whole clip: the accumulated trajectories. */}
      {paths.map((p, i) => (
        <polyline
          key={p.key}
          className={styles.psPath}
          points={p.points}
          style={{ ["--g" as string]: i }}
        />
      ))}

      {/* The instants just before this one, fading back. */}
      {Array.from({ length: GHOSTS }, (_, k) => index - (GHOSTS - k))
        .filter((i) => i >= 0)
        .map((i, k) => {
          const pose = primaryPose(result.samples[i]);
          if (!pose) return null;
          return (
            <Skeleton
              key={i}
              pose={pose}
              w={w}
              h={h}
              variant="ghost"
              order={GHOSTS - k}
            />
          );
        })}

      {/* Anyone else in frame, at lower weight — present, not the subject. */}
      {sample?.poses
        .filter((pose) => pose !== current)
        .map((pose, i) => (
          <Skeleton key={`o${i}`} pose={pose} w={w} h={h} variant="other" />
        ))}

      {/* The subject. */}
      {current && <Skeleton pose={current} w={w} h={h} variant="current" />}

      {/* Body centre — the point the drift and direction come from. */}
      {hipCentre && (
        <g className={styles.psCentre}>
          <line
            x1={hipCentre[0] - 12}
            y1={hipCentre[1]}
            x2={hipCentre[0] + 12}
            y2={hipCentre[1]}
          />
          <line
            x1={hipCentre[0]}
            y1={hipCentre[1] - 12}
            x2={hipCentre[0]}
            y2={hipCentre[1] + 12}
          />
          <circle cx={hipCentre[0]} cy={hipCentre[1]} r={16} />
        </g>
      )}

      {/* With no pose at this instant, the motion centroid is what there is. */}
      {!current && sample && (
        <g className={styles.psField}>
          <circle cx={sample.cx * w} cy={sample.cy * h} r={26} />
          <circle cx={sample.cx * w} cy={sample.cy * h} r={4} />
        </g>
      )}
    </svg>
  );
}
