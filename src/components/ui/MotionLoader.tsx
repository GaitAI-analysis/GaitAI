import styles from "./motion-loader.module.css";

/**
 * The one loading mark used across GaitAI: a single gait-cycle line drawing
 * itself, then a quiet temporal pulse. No spinner, no dots, no percentage.
 *
 * It is a status region, so assistive technology hears the label once; the
 * drawing itself is decorative. Reduced motion shows the completed line.
 */
export function MotionLoader({
  label = "Loading",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${styles.loader} ${compact ? styles.compact : ""}`}
    >
      <svg viewBox="0 0 240 48" aria-hidden="true" className={styles.drawing}>
        <path className={styles.base} d="M8 30H232" />
        <path
          className={styles.cycle}
          pathLength={1}
          d="M8 30C24 30 30 12 46 12S66 34 82 34 102 14 118 14 138 34 154 34 174 12 190 12 216 30 232 30"
        />
        <circle className={styles.node} cx="118" cy="14" r="2.6" />
      </svg>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
