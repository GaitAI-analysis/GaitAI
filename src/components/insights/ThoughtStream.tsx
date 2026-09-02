"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { assetPath } from "@/lib/paths";
import styles from "./landing.module.css";

/**
 * What we're thinking about — the journal's signature interaction.
 *
 * The five essays are introduced by the five questions they answer, not by
 * five headlines. A reader scanning headlines is browsing a catalogue; a
 * reader scanning questions is deciding which one is theirs. Every question
 * here is the article's own `question` field, so nothing is written for the
 * index that the essay does not go on to answer.
 *
 * Pointing at a question brings up that story: its artwork, its category, its
 * length and its own call to action. One at a time, so the section stays a
 * sequence of ideas rather than a wall of previews.
 *
 * ACCESSIBILITY
 * Hover is not the only way in. Each row is a real link, so the keyboard walks
 * the same path and `focus` drives the same state; and because every row
 * carries its own title, category and read time in the DOM, nothing is
 * available only on hover — the stage is an enlargement, not the sole source.
 * The first story is active on load, so the section is never blank.
 */

export type StreamItem = {
  slug: string;
  step: number;
  question: string;
  title: string;
  category: string;
  readMinutes: number;
  ctaLabel: string;
  hero: { src: string; alt: string };
};

export function ThoughtStream({ items }: { items: StreamItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  return (
    <div className={styles.stream}>
      <ol className={styles.streamList}>
        {items.map((item, i) => (
          <li key={item.slug}>
            <Link
              href={`/insights/${item.slug}/`}
              className={`${styles.streamRow} ${
                i === active ? styles.streamRowOn : ""
              }`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              aria-label={`${item.question} — ${item.title}, ${item.category}, ${item.readMinutes} minute read`}
            >
              <span className={styles.streamIndex}>
                {String(item.step).padStart(2, "0")}
              </span>

              <span className={styles.streamMain}>
                <span className={styles.streamQuestion}>{item.question}</span>

                {/* Present for every row, not just the active one: a reader on
                    a keyboard or a phone gets the same information. */}
                <span className={styles.streamMeta}>
                  <span className={styles.streamTitle}>{item.title}</span>
                  <span aria-hidden="true" className={styles.streamDot}>
                    ·
                  </span>
                  <span>{item.category}</span>
                  <span aria-hidden="true" className={styles.streamDot}>
                    ·
                  </span>
                  <span>{item.readMinutes} min</span>
                </span>
              </span>

              <span aria-hidden="true" className={styles.streamGo}>
                {item.ctaLabel}
                <span className={styles.streamGoArrow}>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* The stage. Decorative by design: everything on it is already in the
          row above, so it carries no information of its own. */}
      <div aria-hidden="true" className={styles.streamStage}>
        {items.map((item, i) => (
          <div
            key={item.slug}
            className={`${styles.streamShot} ${
              i === active ? styles.streamShotOn : ""
            }`}
          >
            <Image
              src={assetPath(item.hero.src)}
              alt=""
              fill
              sizes="(min-width: 1100px) 44vw, 100vw"
              className={styles.streamImg}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
        <span className={styles.streamStageEdge} />
        <span className={styles.streamStageIssue}>
          Issue {String(current.step).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
