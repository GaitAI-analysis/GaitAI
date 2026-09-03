"use client";

import { useEffect, useState } from "react";
import type { InsightSection } from "@/data/insights";
import styles from "./journal.module.css";

/**
 * The article's section navigator.
 *
 * Two presentations of the same list, because the two contexts want different
 * things:
 *
 *   desktop  a rail beside the column, showing every section by its short
 *            label with the current one lit, plus a hairline that fills as
 *            the reader moves through the essay
 *   mobile   a horizontal scroller under the 2-minute version, which is the
 *            only shape that fits and still says where you are
 *
 * NEITHER IS PINNED. Both sat in the viewport for the whole article — the
 * desktop rail on `site-sticky-below-header`, the mobile strip on its own
 * `position: sticky` — so a table of contents followed a reader who had
 * already used it, down eight sections of an essay. They are in normal flow
 * now: they start beside the article, they move with it, and they leave the
 * viewport and stay gone. Nothing else changes; the observer below still
 * lights the section being read for as long as the rail is on screen, and
 * the anchors keep working after it is not.
 *
 * Labels come from each section's `navLabel` — "Signal", "Pose", "Fusion" —
 * rather than its sentence-length title, which is what makes a rail readable.
 *
 * Active tracking uses IntersectionObserver against a band just under the
 * fixed header, so the highlighted entry is the section being read rather than
 * the last one scrolled past.
 */
export function SectionRail({
  sections,
  variant,
}: {
  sections: InsightSection[];
  /**
   * Which presentation to render. Each call site picks one, so the page never
   * carries two "Sections" landmarks for a screen reader to step through.
   */
  variant: "rail" | "strip";
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.id === activeId),
  );
  const filled = ((activeIndex + 1) / sections.length) * 100;

  if (variant === "strip") {
    return (
      <nav aria-label="Sections" className={styles.railMobile}>
        <div className={styles.railMobileTrack}>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={section.id === activeId ? "true" : undefined}
              className={`${styles.railMobileItem} ${
                section.id === activeId ? styles.railMobileItemActive : ""
              }`}
            >
              {section.number} · {section.navLabel}
            </a>
          ))}
        </div>
      </nav>
    );
  }

  return (
      <nav aria-label="Sections" className={styles.rail}>
        <p className={styles.railLabel}>In this article</p>
        <ol className={styles.railList}>
          {sections.map((section, i) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={section.id === activeId ? "true" : undefined}
                className={`${styles.railItem} ${
                  section.id === activeId ? styles.railItemActive : ""
                }`}
              >
                <span className={styles.railIndex}>{section.number}</span>
                <span>{section.navLabel}</span>
              </a>
            </li>
          ))}
        </ol>
        <div className={styles.railProgress} aria-hidden="true">
          <div className={styles.railProgressFill} style={{ width: `${filled}%` }} />
        </div>
      </nav>
  );
}
