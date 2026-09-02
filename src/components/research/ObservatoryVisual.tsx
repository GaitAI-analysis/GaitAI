import type { CSSProperties } from "react";
import { GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./observatory.module.css";

/**
 * The hero's research instrument view.
 *
 * Reads left to right as the actual chain the page is about: a captured
 * stride, the joint trajectories that stride produces, the temporal signal
 * those trajectories are sampled into, and the feature vector the signal is
 * reduced to. Every figure is one of the five canonical gait keyframes, and
 * both trajectories are traced through the wrist and ankle coordinates of
 * those same keyframes — so the curves are the data's, not a designer's.
 *
 * Nothing here asserts a measurement. The axis is labelled with dimensionless
 * sample indices (t₀…t₅) rather than a frame rate, because no capture rate is
 * published, and the feature column is a shape, not a readout.
 *
 * Server component: all motion is CSS in observatory.module.css, so the whole
 * visual honours prefers-reduced-motion in one place.
 */

const W = 760;
const H = 520;

/** Six samples across one stride: the five keyframes, then the cycle repeats. */
const SEQUENCE = [0, 1, 2, 3, 4, 0];
const FRAME_X = [96, 190, 284, 378, 472, 566];
const BASE_Y = 250;
const SCALE = 1.18;
const GROUND_Y = BASE_Y + 48 * SCALE;

const WAVE_Y = 402;
const WAVE_FROM = 56;
const WAVE_TO = 622;

const figureClasses = {
  bone: styles.bone,
  boneFar: styles.boneFar,
  joint: styles.joint,
  head: styles.head,
  contact: styles.contact,
};

/** Global position of one joint of one frame. */
const jointAt = (frameIndex: number, joint: Pt): Pt => [
  FRAME_X[frameIndex] + joint[0] * SCALE,
  BASE_Y + GAIT_PHASES[SEQUENCE[frameIndex]].lift * SCALE + joint[1] * SCALE,
];

/**
 * Sampled stride signal. Three harmonics with the trailing half-cycle damped:
 * the left/right asymmetry is what makes the trace read as gait rather than as
 * an audio waveform. Deterministic, so server and client markup match.
 */
function strideAt(x: number) {
  const t = (x - WAVE_FROM) / 118;
  const phase = t - Math.floor(t);
  const damp = phase < 0.5 ? 1 : 0.68;
  const v =
    Math.sin(t * Math.PI * 2) * 0.6 +
    Math.sin(t * Math.PI * 4 + 0.6) * 0.27 +
    Math.sin(t * Math.PI * 6) * 0.11;
  return WAVE_Y - v * 26 * damp;
}

const wavePoints: Pt[] = (() => {
  const out: Pt[] = [];
  for (let x = WAVE_FROM; x <= WAVE_TO; x += 7) out.push([x, strideAt(x)]);
  return out;
})();

/** Vertical sample ticks under the signal, at a coarser interval. */
const waveTicks = (() => {
  const out: { x: number; h: number; strong: boolean }[] = [];
  for (let i = 0; i <= 46; i += 1) {
    const x = WAVE_FROM + i * 12.3;
    const inCycle = i % 10;
    const swing = Math.abs(Math.sin((inCycle / 10) * Math.PI * 2));
    out.push({
      x: Math.round(x * 10) / 10,
      h: Math.round((4 + swing * 15) * 10) / 10,
      strong: inCycle === 0,
    });
  }
  return out;
})();

/** The feature column: a fixed 2 × 16 pattern, authored not randomised. */
const EMBED_ROWS = 16;
const EMBED = Array.from({ length: EMBED_ROWS }, (_, r) => [
  (0.25 + ((r * 7) % 11) / 14) * 0.72,
  (0.2 + ((r * 5 + 3) % 9) / 12) * 0.72,
]);

const LEGEND = [
  { label: "POSE", x: 96, drop: 176 },
  { label: "STRIDE", x: 300, drop: 300 },
  { label: "TEMPORAL", x: 470, drop: 372 },
  { label: "EMBEDDING", x: 654, drop: 168 },
];

export function ObservatoryVisual({ className }: { className?: string }) {
  const wristTrack = SEQUENCE.map((phaseIndex, i) =>
    jointAt(i, GAIT_PHASES[phaseIndex].nearArm[2]),
  );
  const ankleTrack = SEQUENCE.map((phaseIndex, i) =>
    jointAt(i, GAIT_PHASES[phaseIndex].nearLeg[2]),
  );
  const wristPath = smoothPath(wristTrack);
  const anklePath = smoothPath(ankleTrack);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      className={`${styles.obs}${className ? ` ${className}` : ""}`}
    >
      <defs>
        <linearGradient id="obs-wave" x1="0" x2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.15" />
          <stop offset="0.25" stopColor="#4FD1FF" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#2563FF" stopOpacity="0.8" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="obs-wave-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4FD1FF" stopOpacity="0.18" />
          <stop offset="1" stopColor="#4FD1FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── Coordinate ground ── */}
      <g className={styles.obsGrid}>
        {Array.from({ length: 15 }).map((_, i) => (
          <line key={`v${i}`} x1={56 + i * 40} y1={40} x2={56 + i * 40} y2={430} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1={56} y1={70 + i * 40} x2={616} y2={70 + i * 40} />
        ))}
      </g>

      {/* Axes: a left ordinate and a bottom sample axis. */}
      <line className={styles.obsAxis} x1={40} y1={40} x2={40} y2={430} />
      <line className={styles.obsAxis} x1={40} y1={430} x2={720} y2={430} />
      {FRAME_X.map((x, i) => (
        <g key={`t${i}`}>
          <line className={styles.obsTick} x1={x} y1={430} x2={x} y2={436} />
          <text className={styles.obsTickLabel} x={x} y={448} textAnchor="middle">
            t{i}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`o${i}`}
          className={styles.obsTick}
          x1={34}
          y1={80 + i * 100}
          x2={40}
          y2={80 + i * 100}
        />
      ))}

      {/* ── Legend: four labels with dashed leaders into their regions ── */}
      {LEGEND.map((item, i) => (
        <g key={item.label}>
          <text
            className={styles.obsLabel}
            x={item.x}
            y={56}
            textAnchor={i === LEGEND.length - 1 ? "end" : "start"}
          >
            {item.label}
          </text>
          <line
            className={styles.obsLabelLead}
            x1={i === LEGEND.length - 1 ? item.x - 2 : item.x + 2}
            y1={64}
            x2={i === LEGEND.length - 1 ? item.x - 2 : item.x + 2}
            y2={item.drop}
          />
        </g>
      ))}

      {/* ── Ground plane the sequence walks on ── */}
      <line
        className={styles.obsTick}
        x1={56}
        y1={GROUND_Y + 1}
        x2={622}
        y2={GROUND_Y + 1}
        strokeDasharray="2 7"
      />

      {/* ── The captured stride ── */}
      {SEQUENCE.map((phaseIndex, i) => (
        <g
          key={`f${i}`}
          className={`${styles.frame}${i === 4 ? ` ${styles.frameLead}` : ""}`}
          style={{ "--i": i } as CSSProperties}
          transform={`translate(${FRAME_X[i]} ${
            BASE_Y + GAIT_PHASES[phaseIndex].lift * SCALE
          })`}
        >
          <PoseFrame
            phase={GAIT_PHASES[phaseIndex]}
            s={SCALE}
            classes={figureClasses}
            showContacts
          />
        </g>
      ))}

      {/* ── Joint trajectories through the sequence ── */}
      <path className={styles.traj} d={wristPath} />
      <path className={styles.traj} d={anklePath} />
      <path className={styles.trajFlow} d={wristPath} pathLength={100} />
      <path
        className={styles.trajFlow}
        d={anklePath}
        pathLength={100}
        style={{ animationDelay: "3.2s" } as CSSProperties}
      />
      {wristTrack.map(([x, y], i) => (
        <circle key={`w${i}`} className={styles.trajNode} cx={x} cy={y} r={2.1} />
      ))}
      {ankleTrack.map(([x, y], i) => (
        <circle key={`a${i}`} className={styles.trajNode} cx={x} cy={y} r={2.1} />
      ))}

      {/* ── The temporal signal ── */}
      <path
        className={styles.waveFill}
        d={`${smoothPath(wavePoints)}L${WAVE_TO} ${WAVE_Y + 30}L${WAVE_FROM} ${
          WAVE_Y + 30
        }Z`}
        fill="url(#obs-wave-fill)"
      />
      {waveTicks.map((tick, i) => (
        <line
          key={`s${i}`}
          className={tick.strong ? `${styles.sample} ${styles.sampleStrong}` : styles.sample}
          x1={tick.x}
          y1={WAVE_Y - tick.h}
          x2={tick.x}
          y2={WAVE_Y + tick.h * 0.55}
        />
      ))}
      <path
        className={styles.wave}
        d={smoothPath(wavePoints)}
        stroke="url(#obs-wave)"
      />
      {[0, 1, 2].map((i) => (
        <circle
          key={`n${i}`}
          className={styles.obsNode}
          style={{ "--i": i } as CSSProperties}
          cx={140 + i * 200}
          cy={strideAt(140 + i * 200)}
          r={2.6}
        />
      ))}

      {/* ── The feature vector ── */}
      <line className={styles.embedRule} x1={648} y1={176} x2={648} y2={392} />
      {EMBED.map((row, r) =>
        row.map((value, c) => (
          <rect
            key={`e${r}-${c}`}
            className={styles.embedCell}
            style={{ "--i": r * 2 + c } as CSSProperties}
            x={660 + c * 26}
            y={180 + r * 13}
            width={22}
            height={9}
            rx={1.5}
            opacity={value}
          />
        )),
      )}
      <line className={styles.embedRule} x1={660} y1={398} x2={708} y2={398} />
    </svg>
  );
}
