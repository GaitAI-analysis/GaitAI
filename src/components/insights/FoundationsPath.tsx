import Link from "next/link";
import styles from "./landing.module.css";

/**
 * GaitAI Foundations — the five essays as one intentional collection.
 *
 * Read as five separate posts they are five separate posts. Read in order they
 * are an argument: what movement is, what it means beyond identity, what a
 * system needs to know, why change matters more than a reading, and how much
 * evidence to demand before believing any of it. The path says so.
 *
 * Each step carries its own name from the article's `seriesTitle`, so the
 * collection is described by the essays rather than by a label written over
 * them. The whole step is a link, the numbers are the spine, and the rule
 * between them is the reading order.
 */

export type PathStep = {
  slug: string;
  step: number;
  theme: string;
  seriesTitle: string;
  title: string;
  readMinutes: number;
};

export function FoundationsPath({ steps }: { steps: PathStep[] }) {
  const total = steps.reduce((sum, s) => sum + s.readMinutes, 0);

  return (
    <div className={styles.path}>
      <div className={styles.pathHead}>
        <p className={styles.pathKicker}>
          <span aria-hidden="true" className={styles.pathKickerRule} />
          GaitAI Foundations
        </p>
        <h2 className={styles.pathTitle}>
          A five-part introduction to movement intelligence.
        </h2>
        <p className={styles.pathNote}>
          Read in order it is one argument, from what a camera sees to what the
          evidence supports · about {total} minutes end to end.
        </p>
      </div>

      <ol className={styles.pathList}>
        {steps.map((step, i) => (
          <li key={step.slug} className={styles.pathItem}>
            <Link href={`/insights/${step.slug}/`} className={styles.pathStep}>
              <span className={styles.pathStepTop}>
                <span className={styles.pathStepNo}>
                  {String(step.step).padStart(2, "0")}
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden="true" className={styles.pathStepRule} />
                )}
              </span>

              <span className={styles.pathStepTheme}>{step.theme}</span>
              <span className={styles.pathStepName}>{step.seriesTitle}</span>
              <span className={styles.pathStepTitle}>{step.title}</span>
              <span className={styles.pathStepTime}>{step.readMinutes} min</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
