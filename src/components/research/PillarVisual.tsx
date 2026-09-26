import { GAIT_PHASES } from "@/components/visuals/gait-phases";
import { PoseFrame, smoothPath } from "./PoseFrame";
import styles from "./observatory.module.css";

/**
 * One scientific visual per research pillar — four different pictures of four
 * different methods, not one icon set.
 *
 *   biometrics  several strides reduced to a feature block, then to a single
 *               identity signature
 *   pose        one skeleton, its joint trajectory and the temporal curve the
 *               trajectory becomes
 *   privacy     a captured figure with the head abstracted away inside a
 *               dashed retention boundary, leaving a skeleton
 *   edge        camera → signal → compact model → device
 *
 * All four are authored in the same 112 × 44 frame so they can sit in the
 * pillar index at 34px and in a heading at 200px and still read. The walking
 * figures come from the shared gait keyframes, so they are the same anatomy as
 * the hero.
 */

export type PillarKind = "biometrics" | "pose" | "privacy" | "edge";

const figureClasses = {
  bone: styles.pvLine,
  boneFar: styles.pvLineFaint,
  joint: styles.pvDot,
  head: styles.pvLine,
};

export function PillarVisual({
  kind,
  className,
}: {
  kind: PillarKind;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 112 44"
      className={`${styles.pv}${className ? ` ${className}` : ""}`}
    >
      {kind === "biometrics" && <Biometrics />}
      {kind === "pose" && <Pose />}
      {kind === "privacy" && <Privacy />}
      {kind === "edge" && <Edge />}
    </svg>
  );
}

/** 01 — strides → feature block → identity signature. */
function Biometrics() {
  return (
    <>
      {[0, 2, 4].map((phase, i) => (
        <g key={phase} transform={`translate(${10 + i * 14} 30)`}>
          <PoseFrame
            phase={GAIT_PHASES[phase]}
            s={0.3}
            classes={figureClasses}
            showFar={false}
          />
        </g>
      ))}
      <line className={styles.pvDash} x1={50} y1={22} x2={62} y2={22} />
      {[0, 1, 2, 3].map((r) =>
        [0, 1].map((c) => (
          <rect
            key={`${r}${c}`}
            className={c === r % 2 ? styles.pvDot : styles.pvDotSoft}
            x={66 + c * 7}
            y={12 + r * 6}
            width={5.5}
            height={4}
            rx={0.8}
          />
        )),
      )}
      <line className={styles.pvDash} x1={82} y1={22} x2={92} y2={22} />
      <circle className={styles.pvSurface} cx={100} cy={22} r={9} />
      <circle className={styles.pvLine} cx={100} cy={22} r={6} fill="none" />
      <circle className={styles.pvDot} cx={100} cy={22} r={2} />
    </>
  );
}

/** 02 — skeleton → joint trajectory → temporal curve. */
function Pose() {
  const track = [0, 1, 2, 3, 4].map((phase, i) => {
    const wrist = GAIT_PHASES[phase].nearArm[2];
    return [16 + i * 2.4 + wrist[0] * 0.28, 30 + wrist[1] * 0.28] as const;
  });
  return (
    <>
      <g transform="translate(20 32)">
        <PoseFrame phase={GAIT_PHASES[0]} s={0.42} classes={figureClasses} />
      </g>
      <path className={styles.pvDash} d={smoothPath(track)} />
      {track.map(([x, y], i) => (
        <circle key={i} className={styles.pvDotSoft} cx={x} cy={y} r={1.1} />
      ))}
      <line className={styles.pvDash} x1={44} y1={22} x2={54} y2={22} />
      <path
        className={styles.pvLine}
        d="M58 26 C64 12 70 34 76 20 C82 8 88 28 94 22 L104 22"
      />
      <circle className={styles.pvDot} cx={104} cy={22} r={1.6} />
    </>
  );
}

/** 03 — capture → abstraction → skeleton inside a retention boundary. */
function Privacy() {
  return (
    <>
      <rect
        className={styles.pvDash}
        x={4}
        y={6}
        width={44}
        height={32}
        rx={3}
      />
      <g transform="translate(24 32)">
        <PoseFrame phase={GAIT_PHASES[2]} s={0.42} classes={figureClasses} />
      </g>
      {/* The head is abstracted rather than drawn. */}
      <rect className={styles.pvSurface} x={21} y={9.5} width={7} height={7} rx={1.2} />
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          className={styles.pvDash}
          x1={21}
          y1={11 + i * 2.2}
          x2={28}
          y2={9.5 + i * 2.2}
        />
      ))}
      <line className={styles.pvDash} x1={52} y1={22} x2={62} y2={22} />
      <g transform="translate(78 32)">
        <PoseFrame
          phase={GAIT_PHASES[2]}
          s={0.42}
          classes={figureClasses}
          showFar={false}
        />
      </g>
      <line className={styles.pvLine} x1={94} y1={12} x2={94} y2={32} />
      <line className={styles.pvLine} x1={100} y1={16} x2={100} y2={32} />
      <line className={styles.pvLine} x1={106} y1={20} x2={106} y2={32} />
    </>
  );
}

/** 04 — camera → pose signal → compact model → edge device. */
function Edge() {
  return (
    <>
      <path className={styles.pvLine} d="M6 16 H20 V28 H6 Z" />
      <path className={styles.pvLine} d="M20 20 L26 16 V28 L20 24 Z" />
      <circle className={styles.pvDot} cx={13} cy={22} r={1.6} />
      <path className={styles.pvDash} d="M28 22 C34 14 38 30 44 22" />
      <g transform="translate(52 32)">
        <PoseFrame
          phase={GAIT_PHASES[4]}
          s={0.32}
          classes={figureClasses}
          showFar={false}
        />
      </g>
      <line className={styles.pvDash} x1={62} y1={22} x2={70} y2={22} />
      <rect className={styles.pvSurface} x={72} y={13} width={18} height={18} rx={2} />
      <rect className={styles.pvLine} x={72} y={13} width={18} height={18} rx={2} fill="none" />
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          className={styles.pvLine}
          x1={90}
          y1={17 + i * 5}
          x2={94}
          y2={17 + i * 5}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <line
          key={`l${i}`}
          className={styles.pvLine}
          x1={68}
          y1={17 + i * 5}
          x2={72}
          y2={17 + i * 5}
        />
      ))}
      <rect
        className={styles.pvLine}
        x={98}
        y={9}
        width={10}
        height={26}
        rx={2}
        fill="none"
      />
      <line className={styles.pvLine} x1={101} y1={31} x2={105} y2={31} />
    </>
  );
}
