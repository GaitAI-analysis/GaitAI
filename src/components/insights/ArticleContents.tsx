"use client";

import { useEffect, useState } from "react";
import type { InsightSection } from "@/data/insights";

/**
 * "On this page" — a sticky, subdued contents rail for the article template.
 *
 * Active-section tracking uses IntersectionObserver against a band just below
 * the fixed header, so the highlighted entry matches what the reader is
 * actually looking at rather than what has merely scrolled past.
 */
export function ArticleContents({ sections }: { sections: InsightSection[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

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
      // Narrow band under the header: a section counts as "current" only while
      // its heading sits in the upper third of the viewport.
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="site-sticky-below-header">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
        On this page
      </p>
      <ul className="mt-5 space-y-1">
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`group flex gap-3 rounded-lg py-1.5 pl-3 pr-2 text-[0.8125rem] leading-snug transition-colors duration-300 ${
                  isActive
                    ? "text-soft-white"
                    : "text-soft-mute hover:text-soft-gray"
                }`}
              >
                <span
                  className={`font-mono text-[11px] tabular-nums transition-colors duration-300 ${
                    isActive ? "text-cyan-300" : "text-soft-mute/55"
                  }`}
                >
                  {section.number}
                </span>
                <span className="line-clamp-2">{section.title}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
