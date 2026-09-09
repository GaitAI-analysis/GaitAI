"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./journal.module.css";
import experience from "./experience/experience.module.css";

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
 *
 * SECTION TICKS. Given the section ids, the line also carries one faint tick
 * per section at the fraction of the article where its heading sits — the
 * compact, phone-sized version of the desktop progress rail. They are
 * measured once the page has laid out and again on resize.
 */
export function ReadingProgress({
  targetId,
  sectionIds = [],
}: {
  targetId: string;
  sectionIds?: string[];
}) {
  const [progress, setProgress] = useState(0);
  const [ticks, setTicks] = useState<number[]>([]);
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

    const measureTicks = () => {
      const rect = target.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0 || sectionIds.length === 0) {
        setTicks([]);
        return;
      }
      const line = Math.max(140, window.innerHeight * 0.35);
      setTicks(
        sectionIds
          .map((id) => document.getElementById(id))
          .filter((element): element is HTMLElement => element !== null)
          .map((heading) => {
            const offset = heading.getBoundingClientRect().top - rect.top - line;
            return Math.min(1, Math.max(0, offset / total));
          }),
      );
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(measure);
    };
    const onResize = () => {
      onScroll();
      measureTicks();
    };

    measure();
    measureTicks();
    const settle = window.setTimeout(measureTicks, 600);
    const ro = new ResizeObserver(() => measureTicks());
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(settle);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [targetId, sectionIds]);

  return (
    <div className={styles.progressTrack} aria-hidden="true">
      <div
        className={styles.progressBar}
        /* Only the width is inline. The reduced-motion case is handled by the
           stylesheet's media query rather than by a hook here: a hook-driven
           inline `transition: none` differed between the server render and
           the first client render under that preference, and React logged a
           hydration mismatch on every article. */
        style={{ width: `${Math.round(progress * 1000) / 10}%` }}
      />
      {ticks.map((tick, index) =>
        index === 0 ? null : (
          <span
            key={index}
            className={experience.progressTick}
            style={{ left: `${tick * 100}%` }}
          />
        ),
      )}
    </div>
  );
}
