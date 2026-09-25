import { POSE_RAIL } from "@/data/home-hero";
import styles from "./poserail.module.css";

/**
 * THE POSE-ANALYSIS RAIL — what the third panel shows instead of a card.
 * =============================================================================
 * SecureVision and MobilityCare are products, and open full cards. Pose
 * analysis is the shared analysis layer under both, and its subject is the
 * digital human in the third panel — so it does not open another white
 * rectangle over that figure. It lights up a slim, translucent rail beside
 * the human: seven readings, set in type, with the measurement shown moving
 * rather than the numbers.
 *
 * THE VALUES HOLD STILL; THE INSTRUMENTS MOVE. The founder asked for stable
 * numbers with live indicators, so every figure here is fixed text and all
 * the motion is decoration drawn around it, paced to one gait cycle:
 *
 *   102 steps/min  →  one step every 588ms, one full stride (left + right)
 *                     every 1176ms. `--stride` carries that to the CSS.
 *
 *   gait speed     a waveform scrolling under the value
 *   cadence        two footfall ticks, left then right, one per step
 *   symmetry       a left and a right bar answering each other
 *   balance        a level line with the faintest sway
 *   range          a short arc gauge whose needle follows the stride
 *
 * Everything moves only while the rail is open (the animations are keyed on
 * `[data-open="true"]` of the wrapper HeroOptions renders around this), and
 * none of it under `prefers-reduced-motion`. It is decoration to assistive
 * technology: the list itself carries the readings.
 */

function Wave() {
  /* Two identical periods side by side, translated by exactly one period and
     looped, so the scroll has no seam. */
  const period = "M0 6 C 4 6, 5 1.5, 8 1.5 S 12 10.5, 16 10.5 S 20 6, 24 6";
  return (
    <svg className={styles.wave} viewBox="0 0 24 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className={styles.waveTrack}>
        <path d={period} vectorEffect="non-scaling-stroke" />
        <path d={period} transform="translate(24 0)" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

function Instrument({ kind }: { kind: (typeof POSE_RAIL.rows)[number]["instrument"] }) {
  switch (kind) {
    case "wave":
      return <Wave />;
    case "steps":
      return (
        <span className={styles.steps} aria-hidden="true">
          <span data-foot="left" />
          <span data-foot="right" />
        </span>
      );
    case "symmetry":
      return (
        <span className={styles.symmetry} aria-hidden="true">
          <span data-side="left" />
          <span data-side="right" />
        </span>
      );
    case "level":
      return (
        <span className={styles.level} aria-hidden="true">
          <span />
        </span>
      );
    case "gauge":
      return (
        <svg className={styles.gauge} viewBox="0 0 24 13" aria-hidden="true" focusable="false">
          <path className={styles.gaugeArc} d="M2 12 A10 10 0 0 1 22 12" vectorEffect="non-scaling-stroke" />
          <line className={styles.gaugeNeedle} x1="12" y1="12" x2="12" y2="4" vectorEffect="non-scaling-stroke" />
        </svg>
      );
    default:
      return null;
  }
}

export function PoseRail({ titleId }: { titleId: string }) {
  return (
    <div className={styles.inner}>
      <p id={titleId} className={styles.title}>
        {POSE_RAIL.title}
        <span className={styles.liveDot} aria-hidden="true" />
      </p>
      <dl className={styles.rows}>
        {POSE_RAIL.rows.map((row, i) => (
          <div
            key={row.label}
            className={styles.row}
            style={{ ["--i" as string]: i }}
          >
            <dt className={styles.label}>{row.label}</dt>
            <dd className={styles.value}>
              <span>{row.value}</span>
              {row.instrument ? <Instrument kind={row.instrument} /> : null}
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.privacy}>{POSE_RAIL.privacy}</p>
    </div>
  );
}
