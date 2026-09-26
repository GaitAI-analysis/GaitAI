"use client";

import { useEffect, useState } from "react";
import styles from "./signal.module.css";

/**
 * THE STORY INDEX — five marks on the page's edge.
 *
 * Deliberately not a sticky sidebar: five numbers, a hairline each, and a
 * micro-label that appears only for the story you are in. It answers "where
 * am I in this" and nothing else.
 *
 * Real links to real section anchors, so it works with the keyboard and
 * without JavaScript; the highlight is the only part that needs the
 * observer. Hidden below the two-column layout, where the page is a single
 * vertical thread and an edge rail would just be furniture.
 */

export interface IndexEntry {
  id: string;
  step: number;
  label: string;
}

export function StoryIndex({ entries }: { entries: IndexEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id ?? "");

  useEffect(() => {
    const nodes = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((node): node is HTMLElement => node !== null);
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      /* A band across the middle of the viewport: the story a reader is
         actually looking at, not the last one whose top edge went past. */
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <nav className={styles.rail} aria-label="Stories in this series">
      <ol className={styles.railList}>
        {entries.map((entry) => {
          const on = entry.id === active;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={on ? "true" : undefined}
                className={`${styles.railItem} ${on ? styles.railItemOn : ""}`}
              >
                <span className={styles.railNo}>
                  {String(entry.step).padStart(2, "0")}
                </span>
                <span aria-hidden="true" className={styles.railTick} />
                <span className={styles.railLabel}>{entry.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
