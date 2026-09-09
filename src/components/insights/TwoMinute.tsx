"use client";

import type { SyntheticEvent } from "react";
import styles from "./journal.module.css";

/**
 * The 2-minute version.
 *
 * A reader who is not sure they have eight minutes gets the argument in four
 * to six lines, and can then decide. The full essay stays exactly where it
 * was: nothing is hidden behind this, and the summary is closed by default so
 * it never displaces the opening of the article.
 *
 * Built on `<details>`/`<summary>`, so it works with no JavaScript, is
 * keyboard-operable for free, and announces its own expanded state.
 *
 * It can also be CONTROLLED: the reading-mode control above the article
 * ("Essentials · 2 min") opens and closes the same element, so there is one
 * summary on the page rather than two copies of the points. When `open` is
 * not passed the element behaves exactly as it always has.
 */
export function TwoMinute({
  points,
  open,
  onToggle,
}: {
  points: string[];
  open?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  const controlled = typeof open === "boolean";
  return (
    <details
      className={styles.summary}
      open={controlled ? open : undefined}
      onToggle={
        onToggle
          ? (event: SyntheticEvent<HTMLDetailsElement>) => {
              const next = event.currentTarget.open;
              /* The browser fires `toggle` for a PROGRAMMATIC change of the
                 `open` attribute too. When React has just set `open` to
                 match the mode, the DOM already agrees with the prop and this
                 is not the reader's doing — report only a genuine disagreement,
                 or opening the Visual Story (which closes this) would be
                 undone by its own side effect. */
              if (controlled && next === open) return;
              onToggle(next);
            }
          : undefined
      }
    >
      <summary className={styles.summaryToggle}>
        <span>Short on time? Read the 2-minute version</span>
        <span aria-hidden="true" className={styles.summaryChevron}>
          ▾
        </span>
      </summary>
      <div className={styles.summaryBody}>
        <ol className={styles.summaryList}>
          {points.map((point, i) => (
            <li key={i} className={styles.summaryItem}>
              <span aria-hidden="true" className={styles.summaryIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ol>
        <p className={styles.summaryNote}>
          The full article follows, with the diagrams and the caveats.
        </p>
      </div>
    </details>
  );
}
