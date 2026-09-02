import styles from "./observatory.module.css";

/**
 * The evidence boundary — the page's most important section, so it is the one
 * that looks unlike every other.
 *
 * A single restrained panel with one champagne hairline along its top edge,
 * holding both halves of the same statement: what the record establishes, and
 * what it does not. Keeping them in one frame is what makes the section
 * honest — a reader cannot take the first half without meeting the second.
 *
 * Every row of both halves is the wording the page already carried: the three
 * evidence-status rows (research foundation, capability traceability,
 * product-specific validation) and the four boundary items. Two mark shapes,
 * filled and dashed, so state is never carried by colour alone, and each row
 * states its status in words.
 */

export type BoundaryProps = {
  papers: number;
  patentNumber: string;
};

const NOT_ESTABLISHED = [
  "Product-specific clinical validation",
  "Published sensitivity, specificity or accuracy benchmarks",
  "A public proprietary or multi-site dataset",
  "Named production deployment evidence",
];

export function EvidenceBoundary({ papers, patentNumber }: BoundaryProps) {
  const established = [
    {
      label: "Research foundation",
      state: "Published / granted",
      detail: `${papers} peer-reviewed papers and granted patent ${patentNumber}.`,
    },
    {
      label: "Capability traceability",
      state: "Documented",
      detail:
        "Each capability is mapped to the research area that informed it, and to the products that draw on that capability.",
    },
  ];

  return (
    <div className={styles.boundary}>
      <div className="min-w-0">
        <span className={styles.boundaryEyebrow}>
          <span aria-hidden="true" className={styles.boundaryEyebrowRule} />
          Current evidence boundary
        </span>
        <h2 className="mt-6 font-display text-[1.75rem] leading-[1.15] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.125rem]">
          What has not yet been{" "}
          <span className={styles.heroSpectrum}>established publicly.</span>
        </h2>
        <p className="mt-5 max-w-prose text-[13.5px] leading-relaxed text-soft-gray">
          The papers and the patent establish the underlying research record.
          Product-specific performance requires separate validation for its
          intended use. These are validation gaps to be addressed through future
          independent studies and collaborations.
        </p>
      </div>

      <div className="min-w-0">
        <div className={styles.boundaryGroup}>
          <div className={styles.boundaryGroupLabel}>
            <span>Established</span>
            <span>{established.length}</span>
          </div>
          <dl>
            {established.map((row) => (
              <div key={row.label} className={styles.bRow}>
                <span
                  aria-hidden="true"
                  className={`${styles.bMark} ${styles.bMarkDone}`}
                />
                <div className="min-w-0">
                  <dt className={styles.bRowLabel}>
                    {row.label}
                    <span
                      className={`${styles.bRowState} ${styles.bRowStateDone}`}
                    >
                      {row.state}
                    </span>
                  </dt>
                  <dd className={styles.bRowDetail}>{row.detail}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.boundaryGroup}>
          <div className={styles.boundaryGroupLabel}>
            <span>Not yet established</span>
            <span>{NOT_ESTABLISHED.length + 1}</span>
          </div>
          <dl>
            <div className={styles.bRow}>
              <span
                aria-hidden="true"
                className={`${styles.bMark} ${styles.bMarkOpen}`}
              />
              <div className="min-w-0">
                <dt className={styles.bRowLabel}>
                  Product-specific validation
                  <span
                    className={`${styles.bRowState} ${styles.bRowStateOpen}`}
                  >
                    Not yet published
                  </span>
                </dt>
                <dd className={styles.bRowDetail}>
                  No study in this record evaluates a GaitAI product&apos;s
                  output for a particular intended use.
                </dd>
              </div>
            </div>
            {NOT_ESTABLISHED.map((item) => (
              <div key={item} className={styles.bRow}>
                <span
                  aria-hidden="true"
                  className={`${styles.bMark} ${styles.bMarkOpen}`}
                />
                <div className="min-w-0">
                  <dt className={styles.bRowLabel}>
                    {item}
                    <span
                      className={`${styles.bRowState} ${styles.bRowStateOpen}`}
                    >
                      Not yet established
                    </span>
                  </dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
