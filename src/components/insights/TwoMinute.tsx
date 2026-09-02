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
 */
export function TwoMinute({ points }: { points: string[] }) {
  return (
    <details className={styles.summary}>
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
          The full essay follows, with the diagrams and the caveats.
        </p>
      </div>
    </details>
  );
}
