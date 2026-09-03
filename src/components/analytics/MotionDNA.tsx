"use client";

import { useMemo } from "react";
import { LM, primaryPose, type PoseResult } from "./usePoseAnalysis";
import styles from "./analyzer.module.css";

/**
 * MOTION DNA — the clip's movement written as a stack of temporal channels.
 *
 * Every channel here is a real series pulled out of the analysis: the vertical
 * travel of the hip midpoint, each ankle's rise and fall, each wrist's swing
 * measured against the body centre, the horizontal path of the body through
 * frame, and the measured motion energy between instants. Nothing is
 * synthesised — there is no sine wave anywhere in this file, and a channel the
 * model could not see is dropped rather than drawn.
 *
 * Each channel is normalised into its own band, so channels of very different
 * amplitude stay legible side by side. That means the bands show SHAPE over
 * time, not magnitude against each other; the readouts elsewhere carry the
 * numbers.
 */

const W = 1000;
const GUTTER = 168;
const PAD_T = 24;
const BAND = 44;
const GAP = 17;
const FLAT = 1e-6;

export type Channel = {
  key: string;
  label: string;
  /** What the series physically is, for the disclosure text. */
  note: string;
  /** One value per sampled instant, or null where the joint was unseen. */
  values: (number | null)[];
  /** Higher values sit higher in the band when false. */
  invert?: boolean;
};

/** Pull every channel that this clip actually supports. */
export function motionChannels(result: PoseResult): Channel[] {
  const { samples } = result;
  const at = (index: number, axis: "x" | "y") =>
    samples.map((s) => {
      const pose = primaryPose(s);
      const l = pose?.[index];
      return l && l.visibility >= 0.5 ? l[axis] : null;
    });

  const hipY = samples.map((s) => {
    const pose = primaryPose(s);
    const lh = pose?.[LM.lHip];
    const rh = pose?.[LM.rHip];
    if (!lh || !rh || lh.visibility < 0.5 || rh.visibility < 0.5) return null;
    return (lh.y + rh.y) / 2;
  });
  const hipX = samples.map((s) => {
    const pose = primaryPose(s);
    const lh = pose?.[LM.lHip];
    const rh = pose?.[LM.rHip];
    if (!lh || !rh || lh.visibility < 0.5 || rh.visibility < 0.5) return null;
    return (lh.x + rh.x) / 2;
  });

  /* Wrist swing is only meaningful relative to the body, not the frame: a
     camera pan would otherwise read as arm movement. */
  const swing = (index: number) => {
    const wx = at(index, "x");
    return wx.map((v, i) => (v === null || hipX[i] === null ? null : v - hipX[i]!));
  };

  const candidates: Channel[] = [
    {
      key: "hip",
      label: "Body centre · vertical",
      note: "Hip midpoint height, per sampled instant. The rise and fall of the trunk.",
      values: hipY,
      invert: true,
    },
    {
      key: "lAnkle",
      label: "Left ankle · vertical",
      note: "Left ankle height. Peaks are the foot at its highest point in the clip.",
      values: at(LM.lAnkle, "y"),
      invert: true,
    },
    {
      key: "rAnkle",
      label: "Right ankle · vertical",
      note: "Right ankle height, on the same footing as the left for comparison.",
      values: at(LM.rAnkle, "y"),
      invert: true,
    },
    {
      key: "lWrist",
      label: "Left wrist · swing",
      note: "Left wrist offset from the body centre, so camera movement is not read as arm swing.",
      values: swing(LM.lWrist),
    },
    {
      key: "rWrist",
      label: "Right wrist · swing",
      note: "Right wrist offset from the body centre.",
      values: swing(LM.rWrist),
    },
    {
      key: "path",
      label: "Travel · horizontal",
      note: "The body centre's position across frame, left to right.",
      values: hipX,
    },
    {
      key: "energy",
      label: "Motion energy",
      note: "Mean luminance change between consecutive sampled instants — measured from the pixels, with or without a person in frame.",
      values: samples.map((s) => s.energy),
    },
  ];

  /* A channel needs enough seen instants, and some actual variation, to say
     anything. A flat line dressed up as a signal is noise with a label. */
  return candidates.filter((c) => {
    const seen = c.values.filter((v): v is number => v !== null);
    if (seen.length < Math.max(6, c.values.length * 0.4)) return false;
    return Math.max(...seen) - Math.min(...seen) > FLAT;
  });
}

function band(
  values: (number | null)[],
  top: number,
  invert: boolean,
): { line: string; area: string } {
  const seen = values.filter((v): v is number => v !== null);
  const min = Math.min(...seen);
  const max = Math.max(...seen);
  const span = max - min || 1;
  const inner = W - GUTTER;
  const bottom = top + BAND;

  const y = (v: number) => {
    const norm = (v - min) / span;
    const up = invert ? 1 - norm : norm;
    return bottom - up * BAND;
  };
  const x = (i: number) =>
    GUTTER + (values.length > 1 ? (i / (values.length - 1)) * inner : inner / 2);

  /* Runs are broken where the joint was unseen, so a gap stays a gap. */
  let line = "";
  let area = "";
  let open = false;
  values.forEach((v, i) => {
    if (v === null) {
      if (open) {
        area += ` L ${x(i - 1).toFixed(1)} ${bottom.toFixed(1)} Z`;
        open = false;
      }
      return;
    }
    const px = x(i).toFixed(1);
    const py = y(v).toFixed(1);
    if (!open) {
      line += `${line ? " " : ""}M ${px} ${py}`;
      area += `${area ? " " : ""}M ${px} ${bottom.toFixed(1)} L ${px} ${py}`;
      open = true;
    } else {
      line += ` L ${px} ${py}`;
      area += ` L ${px} ${py}`;
    }
  });
  if (open) {
    area += ` L ${x(values.length - 1).toFixed(1)} ${bottom.toFixed(1)} Z`;
  }
  return { line, area };
}

export function MotionDNA({
  result,
  channels,
  time,
  onSeek,
}: {
  result: PoseResult;
  channels: Channel[];
  time: number;
  onSeek?: (t: number) => void;
}) {
  const height = PAD_T * 2 + channels.length * (BAND + GAP) - GAP;

  const bands = useMemo(
    () =>
      channels.map((c, i) => ({
        ...c,
        top: PAD_T + i * (BAND + GAP),
        ...band(c.values, PAD_T + i * (BAND + GAP), c.invert ?? false),
      })),
    [channels],
  );

  const span = result.duration || 1;
  const cursorX = GUTTER + Math.min(1, Math.max(0, time / span)) * (W - GUTTER);

  const seek = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!onSeek) return;
    const box = event.currentTarget.getBoundingClientRect();
    const frac = (event.clientX - box.left) / box.width;
    const inner = (frac * W - GUTTER) / (W - GUTTER);
    onSeek(Math.min(1, Math.max(0, inner)) * span);
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      className={styles.dnaChart}
      onClick={seek}
      role="img"
      aria-label={`Motion DNA: ${channels.length} temporal channels derived from the clip — ${channels
        .map((c) => c.label)
        .join(", ")}. Cursor at ${time.toFixed(1)} seconds.`}
    >
      {bands.map((b, i) => (
        <g key={b.key} style={{ ["--g" as string]: i }}>
          <line
            className={styles.dnaBase}
            x1={GUTTER}
            y1={b.top + BAND}
            x2={W}
            y2={b.top + BAND}
          />
          <path className={styles.dnaArea} d={b.area} />
          <path className={styles.dnaLine} d={b.line} />
          <text className={styles.dnaLabel} x={0} y={b.top + BAND - 12}>
            {b.label}
          </text>
        </g>
      ))}

      <line
        className={styles.dnaCursor}
        x1={cursorX}
        y1={PAD_T - 10}
        x2={cursorX}
        y2={height - PAD_T + 6}
      />
    </svg>
  );
}
