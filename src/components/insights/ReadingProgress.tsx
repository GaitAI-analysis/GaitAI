"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import styles from "./journal.module.css";

/**
 * Reading progress — a 2px line across the top of the viewport.
 *
 * Deliberately not gamified: no percentage, no badge, no celebration at the
 * end. It exists so a reader can feel how much essay is left, which is the
 * question that decides whether they keep going.
 *
 * Measured against the article element rather than the document, so the
 * related-stories footer does not count as reading. Updates are throttled to
 * one per animation frame on a passive scroll listener, and the element is
 * aria-hidden — a screen reader gets nothing useful from a progress line, and
 * the article's own structure already conveys position.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const reduce = Boolean(useReducedMotion());
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const measure = () => {
      frame.current = 0;
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) {
        setProgress(0);
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(scrolled / total);
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div className={styles.progressTrack} aria-hidden="true">
      <div
        className={styles.progressBar}
        style={{
          width: `${Math.round(progress * 1000) / 10}%`,
          transition: reduce ? "none" : undefined,
        }}
      />
    </div>
  );
}
