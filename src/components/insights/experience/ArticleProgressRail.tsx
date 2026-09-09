"use client";

import { useEffect, useRef, useState } from "react";
import type { InsightSection } from "@/data/insights";
import styles from "./experience.module.css";

/**
 * THE PROGRESS RAIL — a trajectory down the right edge of a wide viewport.
 *
 *   01 ─── 02 ─── ●03 ─── 04 ─── 05
 *
 * One node per section; the line fills as the reader moves through the
 * article; the current node is lit; hover or focus a node and its section
 * title appears beside it; click and the page scrolls there. It appears once
 * the article's hero has scrolled away and hides again when the article
 * ends, so it never sits over the discussion or the footer.
 *
 * It complements the in-flow "In this article" list rather than replacing
 * it: that list is for orientation before reading, this is for position
 * while reading. Only on viewports of 1280px and up — below that the top
 * progress line (with section ticks) does the same job in two pixels.
 *
 * Nothing here scroll-jacks: clicking uses the browser's own smooth scroll,
 * which `prefers-reduced-motion` already turns off in globals.css.
 */
export function ArticleProgressRail({
  sections,
  articleId,
}: {
  sections: InsightSection[];
  articleId: string;
}) {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    const headings = () =>
      sections
        .map((section) => document.getElementById(section.id))
        .filter((element): element is HTMLElement => element !== null);

    const measure = () => {
      frame.current = 0;
      const rect = article.getBoundingClientRect();
      const line = Math.max(140, window.innerHeight * 0.35);
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(total > 0 ? scrolled / total : 0);
      /* Visible from the first section heading until the article's end. */
      const list = headings();
      const firstTop = list[0]?.getBoundingClientRect().top ?? Infinity;
      setVisible(firstTop < line && rect.bottom > window.innerHeight * 0.6);
      let current = 0;
      list.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= line) current = index;
      });
      setActive(current);
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
  }, [articleId, sections]);

  if (sections.length < 2) return null;
  const nodeSpacing = 32;
  /* The fill runs to the active node, plus the fraction of the way to the
     next one, so it moves continuously rather than jumping per section. */
  const fillPx = Math.min(
    (sections.length - 1) * nodeSpacing,
    active * nodeSpacing + Math.max(0, progress * (sections.length - 1) - active) * nodeSpacing,
  );

  return (
    <nav
      aria-label="Reading position"
      className={`${styles.root} ${styles.rail} ${visible ? styles.railOn : ""}`}
    >
      <ol className={styles.railList}>
        <span aria-hidden="true" className={styles.railLine} />
        <span aria-hidden="true" className={styles.railFill} style={{ height: `${fillPx}px` }} />
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={index === active ? "true" : undefined}
              aria-label={`${section.number} ${section.title}`}
              className={`${styles.railNode} ${index === active ? styles.railNodeOn : ""} ${
                index < active ? styles.railNodeDone : ""
              }`}
            >
              <span className={styles.railTip}>
                <span className={styles.railTipIndex}>{section.number}</span>
                {section.navLabel}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
