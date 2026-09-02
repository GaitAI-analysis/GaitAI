import styles from "./analytics.module.css";

/**
 * "Why was this surfaced?" — the panel that makes explainability something
 * the site demonstrates rather than claims.
 *
 * Three parts, in this order and never fewer:
 *
 *   factors    the contributing signals, each with the direction it moved.
 *              Direction only — never a weight, a coefficient or a
 *              contribution percentage, none of which this repository has.
 *   used for   what the output is for. Always a review or screening step
 *              with a human in it.
 *   not        what it is NOT. This half is the point: an indicator that
 *              names its own boundary cannot be read as a prediction, and
 *              both labs are demonstrations rather than instruments.
 *
 * The two-column boundary is deliberately symmetrical so neither half reads
 * as a footnote.
 */

export interface ExplainFactor {
  label: string;
  /** Which way the contributing signal moved. */
  direction: "up" | "down" | "flat";
}

export function ExplainabilityPanel({
  question,
  factors,
  usedForLabel = "Used for",
  usedFor,
  notLabel = "Not",
  not,
  footnote,
}: {
  question: string;
  factors: ExplainFactor[];
  usedForLabel?: string;
  usedFor: string[];
  notLabel?: string;
  not: string[];
  footnote?: string;
}) {
  return (
    <section className={styles.explain} aria-label={question}>
      <header className={styles.explainHead}>
        <span className={styles.label}>Explainability</span>
        <h4 className={styles.explainTitle}>{question}</h4>
      </header>

      <ul className={styles.factors}>
        {factors.map((factor) => (
          <li key={factor.label} className={styles.factor}>
            <span>{factor.label}</span>
            <span
              className={`${styles.factorTrend} ${
                factor.direction === "down" ? styles.factorTrendDown : ""
              }`}
            >
              {factor.direction === "up"
                ? "↑ higher"
                : factor.direction === "down"
                  ? "↓ lower"
                  : "— steady"}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.boundary}>
        <div className={styles.boundaryCell}>
          <span className={styles.label}>{usedForLabel}</span>
          <ul className={`${styles.list} ${styles.boundaryUsed}`}>
            {usedFor.map((item) => (
              <li key={item} className={styles.item}>
                <span aria-hidden="true" className={styles.dot} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.boundaryCell}>
          <span className={styles.label}>{notLabel}</span>
          <ul className={`${styles.list} ${styles.boundaryNot}`}>
            {not.map((item) => (
              <li key={item} className={styles.item}>
                <span aria-hidden="true" className={`${styles.dot} ${styles.dotMute}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {footnote && (
        <p className={`${styles.note} px-[1.05rem] py-3 border-t border-white/[0.06]`}>
          {footnote}
        </p>
      )}
    </section>
  );
}
