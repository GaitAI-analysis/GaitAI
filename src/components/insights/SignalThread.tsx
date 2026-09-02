"use client";

import { useEffect, useRef } from "react";
import styles from "./signal.module.css";

/**
 * THE SIGNAL — one continuous thread through the whole journal.
 *
 * This is the page's spine, and the reason it reads as a journey rather than
 * as five sections that happen to have visuals. A single path runs from the
 * opening question to the closing index, weaving left and right so it passes
 * behind each story's visual field and leaves into the next one. It draws
 * itself as the reader scrolls: the trace behind them is complete, the trace
 * ahead is a faint guide, and a single node sits at the reading position.
 *
 * HOW IT IS BUILT, AND WHY THIS WAY
 * One `<svg>` absolutely positioned over the whole journal container, with a
 * `viewBox` of 100 × 1000 and `preserveAspectRatio="none"`, so the path
 * stretches to whatever height the page turns out to be — no measurement, no
 * layout thrash, no per-section segments to keep aligned. `non-scaling-stroke`
 * keeps the line at 1.5px through that stretch, and the horizontal weave is
 * authored in percentages of the page width, so it lands in the same place
 * relative to the compositions at every viewport.
 *
 * Progress is one number. A passive scroll listener, throttled to a frame,
 * writes `--sig` (0 → 1) on the container; the drawn overlay is
 * `stroke-dashoffset: calc((1 - var(--sig)) * 1000)` against
 * `pathLength="1000"`, and the travelling node rides the same path with
 * `offset-path`. No per-element observers, no animation library, no canvas.
 *
 * At rest, and under `prefers-reduced-motion`, the whole thread is drawn: the
 * static composition is the finished picture, never a blank one.
 */

/**
 * The weave, in viewBox units (x: 0–100 across the page, y: 0–1000 down it).
 * Each control point is a story moment: the thread crosses to the side the
 * next visual field sits on, so it enters and leaves every composition.
 */
const THREAD = [
  "M 66 0", // the opening: right of the question column
  "C 66 44 46 62 44 96", // down into the walker
  "C 30 150 72 168 72 210", // 01 · signal, field right
  "C 72 258 24 276 24 320", // 02 · meaning, field left
  "C 24 366 76 384 76 430", // 03 · privacy, field right
  "C 76 470 44 486 44 520", // the first editorial pause, centre
  "C 44 562 26 580 26 626", // 04 · change, field left
  "C 26 668 60 684 60 716", // the second pause
  "C 60 760 76 778 76 836", // 05 · evidence, field right
  "C 76 892 50 912 50 1000", // the close, centre
].join(" ");

export function SignalThread() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      host.style.setProperty("--sig", "1");
      return;
    }

    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = host.getBoundingClientRect();
      /* Progress across the container, offset so the node sits a third of the
         way up the viewport — where a reader is actually looking. */
      const span = box.height - window.innerHeight * 0.34;
      const done = window.innerHeight * 0.34 - box.top;
      const p = span > 0 ? Math.min(1, Math.max(0, done / span)) : 1;
      host.style.setProperty("--sig", p.toFixed(4));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className={styles.thread}>
      <svg
        className={styles.threadSvg}
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sig-drawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={styles.threadStopCyan} />
            <stop offset="0.55" className={styles.threadStopBlue} />
            <stop offset="1" className={styles.threadStopViolet} />
          </linearGradient>
        </defs>

        {/* The path ahead: a faint guide, so the reader can see where the
            signal is going before it gets there. */}
        <path className={styles.threadGuide} d={THREAD} />

        {/* The path behind: drawn to the reading position. */}
        <path className={styles.threadDrawn} d={THREAD} pathLength={1000} />

        {/* The reading node: a short bright dash travelling the same path.
            `offset-path` on a plain element cannot follow a stretched viewBox,
            and `animateMotion` cannot be driven by a scroll variable — a
            dash offset can do both, and it is the technique the research
            hero's signal already uses. */}
        <path className={styles.threadNode} d={THREAD} pathLength={1000} />
      </svg>


    </div>
  );
}
