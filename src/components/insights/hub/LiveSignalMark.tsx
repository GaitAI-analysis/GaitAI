"use client";

import { useFigureActive } from "../experience/useFigureActive";
import styles from "./hub.module.css";

/**
 * The journal's identity mark: one gait cycle, drawn as the vertical
 * oscillation of the pelvis over a stride, with a signal travelling along it.
 *
 * It is the one thing near the masthead that moves, and it moves only while
 * on screen and never under reduced motion. The waveform is the platform's
 * own shape — two rises per stride, one per step — not a decorative sine.
 */
export function LiveSignalMark() {
  const { ref, active } = useFigureActive<HTMLSpanElement>();
  return (
    <span ref={ref} className="inline-block align-middle">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 18"
        className={styles.signal}
        data-active={active ? "true" : "false"}
      >
        <path className={styles.signalBase} d="M0 12 H64" />
        <path
          className={styles.signalPath}
          d="M0 12 C4 12 6 5 10 5 S16 13 20 13 S26 4 30 4 S36 13 40 13 S46 5 50 5 S56 12 60 12 H64"
        />
        <circle className={styles.signalDot} cx="30" cy="4" r="1.4" />
      </svg>
    </span>
  );
}
