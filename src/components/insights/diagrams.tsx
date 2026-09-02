import { GAIT_PHASES, GAIT_HEAD, GAIT_NECK, type Pt } from "@/components/visuals/gait-phases";
import styles from "./journal.module.css";

/**
 * In-article diagrams — the visual breaks that carry an argument.
 *
 * Each one draws something the surrounding prose has just claimed, so it
 * clarifies rather than decorates: a real stride for the section about
 * temporal features, the five capture conditions for the section about signal
 * quality, a baseline-to-change track for the section about trajectories.
 *
 * The walking figures come from `gait-phases.ts` — the same five canonical
 * gait events the rest of the site draws from — so the article's stride is
 * the platform's stride, not an illustration of one.
 *
 * All server components. No animation: these sit inside body copy, where
 * movement would compete with reading.
 */

const r1 = (n: number) => Math.round(n * 10) / 10;

function Figure({ phase, s }: { phase: (typeof GAIT_PHASES)[number]; s: number }) {
  const pts = (list: readonly Pt[]) =>
    list.map(([x, y]) => `${r1(x * s)},${r1(y * s)}`).join(" ");
  const spine = `M0 0 C${r1(0.4 * s)} ${r1(-12 * s)} ${r1(0.9 * s)} ${r1(-24 * s)} ${r1(
    1.5 * s,
  )} ${r1(-34 * s)}`;
  const joints: readonly Pt[] = [...phase.nearArm, ...phase.nearLeg];
  return (
    <>
      <polyline className={`${styles.dBone} ${styles.dBoneFar}`} points={pts(phase.farArm)} />
      <polyline className={`${styles.dBone} ${styles.dBoneFar}`} points={pts(phase.farLeg)} />
      <line
        className={`${styles.dBone} ${styles.dBoneFar}`}
        x1={r1(phase.farFoot[0][0] * s)}
        y1={r1(phase.farFoot[0][1] * s)}
        x2={r1(phase.farFoot[1][0] * s)}
        y2={r1(phase.farFoot[1][1] * s)}
      />
      <path className={styles.dBone} d={spine} />
      <circle
        className={styles.dHead}
        cx={r1(GAIT_HEAD[0] * s)}
        cy={r1(GAIT_HEAD[1] * s)}
        r={r1(4.3 * s)}
      />
      <polyline className={styles.dBone} points={pts(phase.nearArm)} />
      <polyline className={styles.dBone} points={pts(phase.nearLeg)} />
      <line
        className={styles.dBone}
        x1={r1(phase.nearFoot[0][0] * s)}
        y1={r1(phase.nearFoot[0][1] * s)}
        x2={r1(phase.nearFoot[1][0] * s)}
        y2={r1(phase.nearFoot[1][1] * s)}
      />
      {joints.map(([jx, jy], i) => (
        <circle key={i} className={styles.dJoint} cx={r1(jx * s)} cy={r1(jy * s)} r={r1(1.8 * s)} />
      ))}
      <circle
        className={styles.dJoint}
        cx={r1(GAIT_NECK[0] * s)}
        cy={r1(GAIT_NECK[1] * s)}
        r={r1(1.6 * s)}
      />
    </>
  );
}

/** One stride: five gait events on a ground line, with the phase names. */
export function GaitCycleDiagram({ caption }: { caption?: string }) {
  const scale = 1.05;
  const xs = [64, 168, 272, 376, 480];
  const baseY = 118;
  const groundY = baseY + 48 * scale;
  const names = ["Heel strike", "Loading", "Mid-stance", "Toe-off", "Swing"];
  const stance = [0, 1, 2, 3];

  return (
    <figure className={`${styles.figure} ${styles.figureWide}`}>
      <svg viewBox="0 0 560 210" className={styles.diagram} aria-hidden="true">
        <line className={styles.dDash} x1={28} y1={groundY + 1} x2={532} y2={groundY + 1} />

        {/* Stance and swing spans, named where the section names them. */}
        <line
          className={styles.dLineAccent}
          x1={xs[0]}
          y1={groundY + 22}
          x2={xs[3]}
          y2={groundY + 22}
        />
        <line className={styles.dLine} x1={xs[3]} y1={groundY + 22} x2={xs[4] + 26} y2={groundY + 22} />
        <text className={styles.dLabel} x={(xs[0] + xs[3]) / 2} y={groundY + 38} textAnchor="middle">
          Stance
        </text>
        <text className={styles.dLabel} x={xs[4] + 4} y={groundY + 38} textAnchor="middle">
          Swing
        </text>

        {xs.map((x, i) => (
          <g key={i} className={stance.includes(i) ? styles.dPhaseOn : styles.dPhase}>
            <g className={styles.dFigure} transform={`translate(${x} ${baseY + GAIT_PHASES[i].lift * scale})`}>
              <Figure phase={GAIT_PHASES[i]} s={scale} />
            </g>
            <line className={styles.dDash} x1={x} y1={groundY + 6} x2={x} y2={groundY + 18} />
            <text className={styles.dLabel} x={x} y={46} textAnchor="middle">
              {String(i + 1).padStart(2, "0")}
            </text>
            <text className={`${styles.dLabel} ${styles.dLabelInk}`} x={x} y={62} textAnchor="middle">
              {names[i]}
            </text>
          </g>
        ))}
      </svg>
      {caption && <figcaption className={styles.figureCaption}>{caption}</figcaption>}
    </figure>
  );
}

/** The five capture conditions, as a strip of states rather than prose. */
export function StateStrip({
  items,
  caption,
}: {
  items: Array<{ label: string; name: string; note: string; ok?: boolean }>;
  caption?: string;
}) {
  return (
    <figure className={`${styles.figure} ${styles.figureWide}`}>
      <div className={styles.states}>
        {items.map((item) => (
          <div
            key={item.name}
            className={`${styles.state} ${item.ok ? styles.stateOk : styles.stateBad}`}
          >
            <span className={styles.stateLabel}>{item.label}</span>
            <span className={styles.stateName}>{item.name}</span>
            <span className={styles.stateNote}>{item.note}</span>
          </div>
        ))}
      </div>
      {caption && <figcaption className={styles.figureCaption}>{caption}</figcaption>}
    </figure>
  );
}

/**
 * Baseline → repeated assessments → change.
 *
 * The track is a gentle decline because the section is about noticing a
 * direction of travel; the numbers are deliberately absent, because none is
 * published. The shape is the argument, not a measurement.
 */
export function TrendTrack({
  points,
  caption,
}: {
  points: string[];
  caption?: string;
}) {
  const W = 560;
  const H = 180;
  const left = 56;
  const right = W - 40;
  const step = (right - left) / (points.length - 1);
  // A shallow decline with one recovery step, so the track reads as a real
  // trajectory rather than a straight line.
  const offsets = [0, 10, 26, 20, 44];
  const y = (i: number) => 62 + (offsets[i % offsets.length] ?? 0);

  const path = points
    .map((_, i) => `${i === 0 ? "M" : "L"}${r1(left + i * step)} ${r1(y(i))}`)
    .join(" ");

  return (
    <figure className={`${styles.figure} ${styles.figureWide}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.diagram} aria-hidden="true">
        {/* The baseline the later readings are read against. */}
        <line className={styles.dDash} x1={left} y1={y(0)} x2={right} y2={y(0)} />
        <text className={styles.dLabel} x={left} y={y(0) - 12}>
          Individual baseline
        </text>

        <path className={styles.dLineAccent} d={path} />

        {points.map((label, i) => (
          <g key={label}>
            <line
              className={styles.dDash}
              x1={r1(left + i * step)}
              y1={r1(y(i)) + 8}
              x2={r1(left + i * step)}
              y2={H - 38}
            />
            <circle
              className={i === points.length - 1 ? styles.dNode : styles.dNode}
              cx={r1(left + i * step)}
              cy={r1(y(i))}
              r={5}
            />
            <circle className={styles.dDot} cx={r1(left + i * step)} cy={r1(y(i))} r={2} />
            <text
              className={`${styles.dLabel} ${i === points.length - 1 ? styles.dLabelInk : ""}`}
              x={r1(left + i * step)}
              y={H - 22}
              textAnchor="middle"
            >
              {label}
            </text>
          </g>
        ))}
      </svg>
      {caption && <figcaption className={styles.figureCaption}>{caption}</figcaption>}
    </figure>
  );
}
