import styles from "./lost-trajectory.module.css";

/**
 * The 404 / error mark: a movement trajectory that leaves the graph, then a
 * re-route back to a known node. Two variants share one drawing —
 * `lost` draws the re-route (there is a way home), `interrupted` stops at the
 * break (the reader chooses what happens next).
 *
 * Illustrative geometry only; decorative to assistive technology, which gets
 * the page copy instead.
 */
export function LostTrajectory({ variant = "lost" }: { variant?: "lost" | "interrupted" }) {
  return (
    <svg
      viewBox="0 0 560 180"
      aria-hidden="true"
      className={`${styles.drawing} ${variant === "interrupted" ? styles.interrupted : ""}`}
    >
      {/* the graph the path belonged to */}
      <g className={styles.graph}>
        <path d="M40 132H520" />
        <circle cx="96" cy="132" r="3" />
        <circle cx="228" cy="132" r="3" />
        <circle cx="360" cy="132" r="3" />
        <circle cx="492" cy="132" r="3" />
      </g>

      {/* the walk that was going somewhere */}
      <path
        className={styles.walk}
        pathLength={1}
        d="M40 132C70 132 84 96 112 96S150 128 178 128 210 92 240 92 268 118 296 110"
      />

      {/* where it left the graph */}
      <path
        className={styles.drift}
        pathLength={1}
        d="M296 110C318 104 332 78 348 58S382 30 410 26"
      />
      <circle className={styles.lost} cx="410" cy="26" r="3.2" />

      {/* the re-route */}
      {variant === "lost" && (
        <>
          <path
            className={styles.reroute}
            pathLength={1}
            d="M410 26C436 40 452 84 472 108S488 132 492 132"
          />
          <circle className={styles.home} cx="492" cy="132" r="5" />
        </>
      )}
    </svg>
  );
}
