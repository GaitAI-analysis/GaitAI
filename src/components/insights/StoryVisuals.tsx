import { GAIT_PHASES, GAIT_HEAD, type Pt } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "@/components/research/PoseFrame";
import styles from "./landing.module.css";

/**
 * One bespoke visual per story — four different pictures of four different
 * arguments, so the stories cannot read as four instances of a card.
 *
 * Each one is the essay's own thesis, drawn:
 *
 *   identity   a walk read five different ways at once — the point of
 *              "your walk is more than a biometric"
 *   privacy    a capture losing appearance until only movement is left
 *   trajectory one score is a dot; three are a direction
 *   fusion     four streams converging on a question mark, not an answer
 *
 * All four share one instrument language (hairlines, mono labels, cyan with a
 * single accent where the argument turns) and all four draw the body from the
 * shared gait keyframes, so the set reads as one publication.
 *
 * No numbers here are measurements. The trajectory scene is the one place
 * figures appear, and they are the essay's own illustrative scores.
 */

const VB = "0 0 520 300";

/* ═══ 02 · Your walk is more than a biometric ═════════════════════════════ */

const READINGS = [
  { label: "IDENTITY", a: -90 },
  { label: "HEALTH", a: -18 },
  { label: "RECOVERY", a: 54 },
  { label: "SAFETY", a: 126 },
  { label: "MOBILITY", a: 198 },
] as const;

export function IdentityFieldVisual() {
  const cx = 260;
  const cy = 152;
  const r = 104;

  return (
    <svg aria-hidden="true" viewBox={VB} className={styles.scene}>
      {/* The same walk at the centre; five readings taken off it. */}
      <g transform={`translate(${cx} ${cy + 30})`}>
        <g className={styles.scPose}>
          <PoseFrame
            phase={GAIT_PHASES[2]}
            s={2.15}
            classes={{
              bone: styles.scBone,
              boneFar: styles.scBoneFar,
              joint: styles.scJoint,
              head: styles.scHead,
            }}
          />
        </g>
      </g>

      {READINGS.map((reading, i) => {
        const rad = (reading.a * Math.PI) / 180;
        const x1 = cx + Math.cos(rad) * 42;
        const y1 = cy + Math.sin(rad) * 42;
        const x2 = cx + Math.cos(rad) * (r - 22);
        const y2 = cy + Math.sin(rad) * (r - 22);
        const lx = cx + Math.cos(rad) * r;
        const ly = cy + Math.sin(rad) * r;
        const anchor =
          Math.abs(Math.cos(rad)) < 0.3
            ? "middle"
            : Math.cos(rad) > 0
              ? "start"
              : "end";
        return (
          <g key={reading.label} style={{ ["--sc-i" as string]: i }}>
            <line className={styles.scRay} x1={x1} y1={y1} x2={x2} y2={y2} />
            <circle className={styles.scRayNode} cx={x2} cy={y2} r={2.6} />
            <text
              className={styles.scLabel}
              x={lx}
              y={ly + 3}
              textAnchor={anchor}
            >
              {reading.label}
            </text>
          </g>
        );
      })}

      {/* Clear of the figure's feet: at y=288 it sat across the legs. */}
      <text className={styles.scCaptionAccent} x={30} y={292}>
        ONE SIGNAL · FIVE READINGS
      </text>
    </svg>
  );
}

/* ═══ 03 · Movement intelligence without identification ══════════════════ */

const P_STAGES = ["CAPTURE", "PRIVACY LAYER", "SKELETON", "MOVEMENT"] as const;

export function PrivacyLayersVisual() {
  const S = 1.5;
  const phase = GAIT_PHASES[2];
  const xs = [72, 214, 348, 470];
  /* PoseFrame puts the PELVIS at the origin and the ground ~48 local units
     below it, so the floor line goes at the feet, not at the translate. */
  const baseY = 148;
  const floorY = baseY + 48 * 1.5 + 2;

  const limbs = (list: readonly Pt[]) =>
    list.map(([x, y]) => `${(x * S).toFixed(1)},${(y * S).toFixed(1)}`).join(" ");

  /* A tapered torso, so the first two stages read as a body. Thick limb
     strokes on their own read as a smear — and a smear losing definition is
     not the same picture as a person losing their appearance. */
  const torso = [
    [-7.5, -34],
    [9, -34],
    [6, -14],
    [-5, -14],
  ]
    .map(([x, y]) => `${(x * S).toFixed(1)},${(y * S).toFixed(1)}`)
    .join(" ");

  return (
    <svg aria-hidden="true" viewBox={VB} className={styles.scene}>
      <line className={styles.scFloor} x1={30} y1={floorY} x2={496} y2={floorY} />

      {P_STAGES.map((label, i) => (
        <g key={label} style={{ ["--sc-i" as string]: i }}>
          <text className={styles.scLabel} x={xs[i]} y={40} textAnchor="middle">
            {label}
          </text>

          <g transform={`translate(${xs[i]} ${baseY})`}>
            <g className={styles.scPose}>
              {(i === 0 || i === 1) && (
                <g className={i === 0 ? styles.scMass : styles.scMassFade}>
                  <polyline className={styles.scLimb} points={limbs(phase.farArm)} />
                  <polyline className={styles.scLimbLeg} points={limbs(phase.farLeg)} />
                  <polygon className={styles.scTorso} points={torso} />
                  <polyline className={styles.scLimbLeg} points={limbs(phase.nearLeg)} />
                  <polyline className={styles.scLimb} points={limbs(phase.nearArm)} />
                  <circle
                    className={styles.scMassHead}
                    cx={GAIT_HEAD[0] * S}
                    cy={GAIT_HEAD[1] * S}
                    r={6.4 * S}
                  />
                </g>
              )}
              {i === 2 && (
                <PoseFrame
                  phase={phase}
                  s={S}
                  classes={{
                    bone: styles.scBone,
                    boneFar: styles.scBoneFar,
                    joint: styles.scJoint,
                    head: styles.scHeadOpen,
                  }}
                />
              )}
              {i === 3 && (
                <>
                  {[...phase.nearArm, ...phase.nearLeg].map(([x, y], j) => (
                    <circle
                      key={j}
                      className={styles.scDot}
                      cx={x * S}
                      cy={y * S}
                      r={2.2}
                    />
                  ))}
                  <path
                    className={styles.scTrail}
                    d={smoothPath(
                      GAIT_PHASES.map((p, k) => {
                        const [ax, ay] = p.nearLeg[2];
                        return [(k - 2) * 9 + ax * 0.4, ay * S * 0.6 - 8] as Pt;
                      }),
                    )}
                  />
                </>
              )}
            </g>
          </g>

          {/* The privacy layer is where the appearance stops travelling. */}
          {i === 1 && (
            <g className={styles.scGate}>
              <line x1={xs[i] - 52} y1={54} x2={xs[i] - 52} y2={floorY - 4} />
            </g>
          )}
        </g>
      ))}

      <text className={styles.scCaption} x={30} y={262}>
        APPEARANCE STOPS HERE
      </text>
      <text className={styles.scCaptionAccent} x={496} y={262} textAnchor="end">
        THE TASK CONTINUES
      </text>
    </svg>
  );
}

/* ═══ 04 · A fall-risk score is not enough ═══════════════════════════════ */

/** The essay's own illustrative sequence: one score, then its direction. */
const TREND = [
  { label: "TODAY", v: 86 },
  { label: "WEEK 4", v: 81 },
  { label: "WEEK 8", v: 74 },
] as const;

export function TrajectoryVisual() {
  const x0 = 74;
  const x1 = 452;
  const step = (x1 - x0) / (TREND.length - 1);
  const yFor = (v: number) => 214 - ((v - 68) / 24) * 104;

  const pts: Pt[] = TREND.map((t, i) => [x0 + i * step, yFor(t.v)]);

  return (
    <svg aria-hidden="true" viewBox={VB} className={styles.scene}>
      <text className={styles.scLabel} x={30} y={34}>
        THE SAME PERSON, THREE ASSESSMENTS
      </text>

      {/* A single score would be one of these dots. */}
      <g className={styles.scGhost}>
        <line x1={x0} y1={214} x2={x1} y2={214} />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={x0}
            y1={214 - i * 26}
            x2={x1}
            y2={214 - i * 26}
            className={styles.scGridLine}
          />
        ))}
      </g>

      <path className={styles.scTrend} d={smoothPath(pts)} />

      {TREND.map((t, i) => (
        <g key={t.label} style={{ ["--sc-i" as string]: i }}>
          <line
            className={styles.scStem}
            x1={pts[i][0]}
            y1={pts[i][1]}
            x2={pts[i][0]}
            y2={214}
          />
          <circle
            className={i === 0 ? styles.scTrendNodeLead : styles.scTrendNode}
            cx={pts[i][0]}
            cy={pts[i][1]}
            r={i === 0 ? 7 : 5.5}
          />
          <text
            className={styles.scScore}
            x={pts[i][0]}
            y={pts[i][1] - 18}
            textAnchor="middle"
          >
            {t.v}
          </text>
          <text
            className={styles.scLabel}
            x={pts[i][0]}
            y={236}
            textAnchor="middle"
          >
            {t.label}
          </text>
        </g>
      ))}

      {/* What a single reading cannot carry. */}
      <g className={styles.scDelta}>
        <line x1={x0} y1={266} x2={x1} y2={266} />
        <polyline points={`${x1 - 8},262 ${x1},266 ${x1 - 8},270`} />
      </g>
      <text className={styles.scCaptionAccent} x={260} y={288} textAnchor="middle">
        THE DIRECTION IS THE FINDING
      </text>
    </svg>
  );
}

/* ═══ 05 · When fusion looks better than it is ════════════════════════════ */

const STREAMS = [
  { label: "VIDEO", state: "ok" },
  { label: "AUDIO", state: "missing" },
  { label: "POSE", state: "ok" },
  { label: "TRACK", state: "corrupt" },
] as const;

export function FusionVisual() {
  const xIn = 92;
  const xJoin = 300;
  const xOut = 448;
  const ys = [76, 128, 180, 232];
  const yc = 154;

  return (
    <svg aria-hidden="true" viewBox={VB} className={styles.scene}>
      <text className={styles.scLabel} x={30} y={40}>
        FOUR STREAMS
      </text>
      <text className={styles.scLabel} x={490} y={40} textAnchor="end">
        ONE NUMBER
      </text>

      {STREAMS.map((s, i) => (
        <g key={s.label} style={{ ["--sc-i" as string]: i }}>
          <text className={styles.scStream} x={30} y={ys[i] + 4}>
            {s.label}
          </text>
          <path
            className={
              s.state === "ok" ? styles.scWire : styles.scWireWeak
            }
            d={`M${xIn} ${ys[i]} C${(xIn + xJoin) / 2} ${ys[i]} ${(xIn + xJoin) / 2} ${yc} ${xJoin} ${yc}`}
          />
          {/* Missing announces itself. Corrupt does not — which is the essay. */}
          {s.state === "missing" && (
            <g className={styles.scMissing}>
              <line x1={xIn + 26} y1={ys[i] - 6} x2={xIn + 38} y2={ys[i] + 6} />
              <line x1={xIn + 38} y1={ys[i] - 6} x2={xIn + 26} y2={ys[i] + 6} />
              <text className={styles.scTiny} x={xIn + 48} y={ys[i] + 4}>
                MISSING · KNOWN
              </text>
            </g>
          )}
          {s.state === "corrupt" && (
            <g className={styles.scCorrupt}>
              <circle cx={xIn + 32} cy={ys[i]} r={5} />
              <text className={styles.scTinyAccent} x={xIn + 48} y={ys[i] + 4}>
                CORRUPT · UNFLAGGED
              </text>
            </g>
          )}
        </g>
      ))}

      <circle className={styles.scJoin} cx={xJoin} cy={yc} r={13} />
      <text className={styles.scTiny} x={xJoin} y={yc + 34} textAnchor="middle">
        FUSION
      </text>

      <line className={styles.scWire} x1={xJoin + 13} y1={yc} x2={xOut - 16} y2={yc} />
      <text className={styles.scQuestion} x={xOut + 6} y={yc + 12} textAnchor="middle">
        ?
      </text>

      <text className={styles.scCaptionAccent} x={490} y={288} textAnchor="end">
        DOES THE EVIDENCE JUSTIFY IT
      </text>
    </svg>
  );
}
