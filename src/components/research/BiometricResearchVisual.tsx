import { GAIT_PHASES } from "@/components/visuals/gait-phases";
import { PoseFrame } from "./PoseFrame";
import styles from "./labs.module.css";

/**
 * PILLAR 01 — gait recognition & biometrics.
 *
 * The claim this pillar makes is that how a person walks is identifying. So
 * the scene shows that reduction happening: a captured stride becomes a block
 * of movement features, the block collapses to one signature, and the
 * signature is what gets matched against enrolled signatures.
 *
 *   stride  →  feature vector  →  signature  →  match
 *
 * The feature block is schematic, and has to stay obviously schematic: the
 * cells carry a dimensionless vector, never an accuracy, a score or a rate.
 * This repository holds no benchmark results, and a diagram that printed one
 * would be inventing it. The shading and the two shown values come from a
 * fixed generator so the picture is identical on every render.
 */

const W = 760;
const H = 272;

const fig = {
  bone: styles.sBone,
  boneFar: styles.sBoneFar,
  joint: styles.sJoint,
  head: styles.sHead,
};

/** Deterministic cell weight — a vector illustration, not a measurement. */
const weight = (i: number) =>
  Math.abs(Math.sin(i * 1.37 + 0.6) * 0.55 + Math.cos(i * 0.61) * 0.45);

export function BiometricResearchVisual() {
  const cols = 12;
  const rows = 3;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      className={styles.scene}
    >
      {/* ── 01 · the captured stride ── */}
      <text className={styles.sLabel} x={16} y={26}>
        CAPTURED STRIDE
      </text>
      {[0, 2, 3, 4].map((p, i) => (
        /* Translate outside, animation inside: a CSS transform animation
           replaces the transform attribute instead of composing with it. */
        <g key={p} transform={`translate(${34 + i * 44} 150)`}>
          <g className={styles.sPose} style={{ ["--s-i" as string]: i }}>
            <PoseFrame phase={GAIT_PHASES[p]} s={1.05} classes={fig} />
          </g>
        </g>
      ))}
      <line className={styles.sFloor} x1={16} y1={152} x2={190} y2={152} />

      {/* ── flow → ── */}
      <g className={styles.sFlow} style={{ ["--s-i" as string]: 0 }}>
        <line x1={200} y1={112} x2={244} y2={112} />
        <polyline points="238,108 244,112 238,116" />
      </g>

      {/* ── 02 · movement feature vector ── */}
      <text className={styles.sLabel} x={256} y={26}>
        MOVEMENT FEATURES
      </text>
      <g className={styles.sCells}>
        {Array.from({ length: cols * rows }, (_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const w = weight(i);
          return (
            <rect
              key={i}
              x={256 + c * 15}
              y={62 + r * 15}
              width={13}
              height={13}
              rx={2}
              style={{
                ["--s-w" as string]: w.toFixed(3),
                ["--s-i" as string]: i % 9,
              }}
            />
          );
        })}
      </g>
      {/* Two cells read out, so the block is legible as a vector of reals. */}
      <text className={styles.sCellValue} x={256} y={125}>
        0.73
      </text>
      <text className={styles.sCellValue} x={316} y={125}>
        0.21
      </text>
      <text className={styles.sCellValue} x={376} y={125}>
        0.84
      </text>
      <text className={styles.sCellValue} x={412} y={125}>
        …
      </text>
      <text className={styles.sDim} x={256} y={146}>
        CADENCE · SYMMETRY · VARIABILITY · POSTURE
      </text>

      <g className={styles.sFlow} style={{ ["--s-i" as string]: 1 }}>
        <line x1={446} y1={90} x2={490} y2={90} />
        <polyline points="484,86 490,90 484,94" />
      </g>

      {/* ── 03 · the signature the vector collapses to ── */}
      <text className={styles.sLabel} x={502} y={26}>
        MOVEMENT SIGNATURE
      </text>
      <g className={styles.sSignature}>
        {Array.from({ length: 26 }, (_, i) => {
          const w = weight(i * 2);
          return (
            <line
              key={i}
              x1={506 + i * 6}
              y1={90 - w * 22}
              x2={506 + i * 6}
              y2={90 + w * 22}
              style={{ ["--s-i" as string]: i % 8 }}
            />
          );
        })}
      </g>
      <line className={styles.sAxis} x1={502} y1={90} x2={664} y2={90} />

      {/* ── 04 · matched against enrolled signatures ── */}
      <g className={styles.sFlow} style={{ ["--s-i" as string]: 2 }}>
        <line x1={584} y1={140} x2={584} y2={176} />
        <polyline points="580,170 584,176 588,170" />
      </g>
      <text className={styles.sLabel} x={502} y={202}>
        RE-IDENTIFICATION
      </text>
      <g className={styles.sMatch}>
        {[0, 1, 2].map((i) => (
          <g key={i} style={{ ["--s-i" as string]: i }}>
            <circle
              className={i === 1 ? styles.sMatchHit : styles.sMatchNode}
              cx={520 + i * 54}
              cy={228}
              r={i === 1 ? 8 : 6}
            />
            {i < 2 && (
              <line
                className={styles.sMatchLink}
                x1={528 + i * 54}
                y1={228}
                x2={566 + i * 54}
                y2={228}
              />
            )}
          </g>
        ))}
      </g>
      {/* Anchored to the right edge and set on its own line under the nodes:
          left-anchored at x=640 it ran past the 760-unit viewBox, and on the
          RE-IDENTIFICATION line it collided with that label at tablet width. */}
      <text className={styles.sDim} x={744} y={258} textAnchor="end">
        SAME SIGNATURE, ANOTHER CAMERA
      </text>
    </svg>
  );
}
