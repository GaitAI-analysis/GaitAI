import styles from "./labs.module.css";

/**
 * PILLAR 04 — edge gait analytics.
 *
 * A pipeline that runs where the camera is: capture, pose, features, a
 * compact model, the device, the result. Packets travel the line so the scene
 * reads as inference happening rather than as six labelled boxes.
 *
 * The granted patent is attached to the two stages it actually covers — the
 * optimised model and the device it runs on — as a single restrained champagne
 * milestone. It is the only warm colour in the scene, and it is a marker on a
 * segment rather than a badge on the whole diagram, because the patent is
 * about running covariate-robust gait analysis on constrained hardware, not
 * about the pipeline as a whole.
 */

const W = 760;
const H = 250;

const STAGES = [
  { label: "CAMERA", detail: "On-site capture" },
  { label: "POSE STREAM", detail: "Keypoints per frame" },
  { label: "FEATURES", detail: "Gait descriptors" },
  { label: "COMPACT MODEL", detail: "Optimised for the device" },
  { label: "EDGE DEVICE", detail: "Inference on site" },
  { label: "INSIGHT", detail: "Result, not footage" },
] as const;

/** The device glyph for each stage, drawn rather than iconographic. */
function Glyph({ i }: { i: number }) {
  if (i === 0)
    return (
      <>
        <rect x={-11} y={-7} width={17} height={14} rx={2.5} />
        <polyline points="6,-3 12,-7 12,7 6,3" />
      </>
    );
  if (i === 1)
    return (
      <>
        <circle cx={0} cy={-7} r={2.6} />
        <line x1={0} y1={-4} x2={0} y2={3} />
        <line x1={-5} y1={8} x2={0} y2={3} />
        <line x1={5} y1={8} x2={0} y2={3} />
        <line x1={-5} y1={-1} x2={5} y2={-1} />
      </>
    );
  if (i === 2)
    return (
      <>
        {[-8, -4, 0, 4, 8].map((x, k) => (
          <line key={x} x1={x} y1={7} x2={x} y2={7 - [5, 10, 6, 12, 8][k]} />
        ))}
      </>
    );
  if (i === 3)
    return (
      <>
        <rect x={-9} y={-9} width={18} height={18} rx={2} />
        {[-4, 0, 4].map((a) =>
          [-4, 0, 4].map((b) => <circle key={`${a}${b}`} cx={a} cy={b} r={1.1} />),
        )}
      </>
    );
  if (i === 4)
    return (
      <>
        <rect x={-10} y={-8} width={20} height={16} rx={2.5} />
        {[-11, 11].map((x) => (
          <line key={x} x1={x} y1={-4} x2={x} y2={4} />
        ))}
        <circle cx={0} cy={0} r={3} />
      </>
    );
  return (
    <>
      <rect x={-10} y={-8} width={20} height={16} rx={2} />
      <line x1={-5} y1={-2} x2={5} y2={-2} />
      <line x1={-5} y1={3} x2={1} y2={3} />
    </>
  );
}

export function EdgeInferenceVisual() {
  const y = 116;
  const x0 = 62;
  const step = 128;
  const xOf = (i: number) => x0 + i * step;

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} className={styles.scene}>
      <text className={styles.sLabel} x={16} y={26}>
        ON-DEVICE INFERENCE PIPELINE
      </text>

      {/* ── The line, and the packets travelling it ── */}
      <line
        className={styles.eRail}
        x1={xOf(0)}
        y1={y}
        x2={xOf(STAGES.length - 1)}
        y2={y}
      />
      {[0, 1, 2].map((k) => (
        <circle
          key={k}
          className={styles.ePacket}
          cx={xOf(0)}
          cy={y}
          r={3}
          style={{ ["--e-k" as string]: k }}
        />
      ))}

      {/* ── Stages ── */}
      {STAGES.map((s, i) => (
        <g key={s.label} style={{ ["--s-i" as string]: i }}>
          <circle className={styles.eNodeRing} cx={xOf(i)} cy={y} r={21} />
          <circle className={styles.eNodeDisc} cx={xOf(i)} cy={y} r={21} />
          <g className={styles.eGlyph} transform={`translate(${xOf(i)} ${y})`}>
            <Glyph i={i} />
          </g>
          <text className={styles.eStage} x={xOf(i)} y={y + 44} textAnchor="middle">
            {s.label}
          </text>
          <text className={styles.eDetail} x={xOf(i)} y={y + 60} textAnchor="middle">
            {s.detail}
          </text>
        </g>
      ))}

      {/* ── The granted patent, on the segment it covers ── */}
      <g className={styles.ePatent}>
        <path
          className={styles.ePatentSpan}
          d={`M${xOf(3)} ${y - 34} L${xOf(3)} ${y - 52} L${xOf(4)} ${y - 52} L${xOf(4)} ${y - 34}`}
        />
        <circle className={styles.ePatentNode} cx={(xOf(3) + xOf(4)) / 2} cy={y - 52} r={4} />
        <text
          className={styles.ePatentLabel}
          x={(xOf(3) + xOf(4)) / 2}
          y={y - 64}
          textAnchor="middle"
        >
          GRANTED PATENT 402202
        </text>
      </g>

      {/* ── What never leaves the site ── */}
      <g className={styles.eHeld}>
        <line x1={xOf(0) - 22} y1={y + 84} x2={xOf(4) + 22} y2={y + 84} />
        <text className={styles.sDim} x={xOf(0) - 22} y={y + 102}>
          PROCESSING STAYS ON SITE
        </text>
        <text
          className={styles.sDim}
          x={xOf(5) + 22}
          y={y + 102}
          textAnchor="end"
        >
          RESULT LEAVES, FOOTAGE NEED NOT
        </text>
      </g>
    </svg>
  );
}
