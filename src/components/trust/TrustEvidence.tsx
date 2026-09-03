import styles from "./trust.module.css";

/**
 * The Trust Center's figure strip.
 *
 * Every value is passed in already derived from publications.ts, products.ts
 * or evidence-status.ts — this component formats, it never counts. That
 * matters here more than anywhere else on the site: a trust page that quotes a
 * figure its own data cannot support is worse than one that quotes none.
 *
 * The last cell is deliberately a zero. "Modules with product-specific
 * validation — none" belongs beside the positive counts rather than in a
 * footnote, because a reviewer reading the first three numbers should meet the
 * fourth in the same glance.
 */
export function TrustEvidence({
  records,
  papers,
  patentNumber,
  areas,
  modules,
  withFoundation,
}: {
  records: number;
  papers: number;
  patentNumber: string;
  areas: number;
  modules: number;
  withFoundation: number;
}) {
  const cells = [
    {
      value: `${records}`,
      label: "Research records",
      note: `${papers} peer-reviewed papers · patent ${patentNumber}`,
    },
    {
      value: `${areas}`,
      label: "Research areas",
      note: "Each mapped to the capabilities it informs",
    },
    {
      value: `${withFoundation}/${modules}`,
      label: "Modules with a research foundation",
      note: "A published record informs a capability they are built on",
    },
    {
      value: "0",
      label: "Product-specific validation studies",
      note: "None published. Research foundation is not product validation.",
    },
  ];

  return (
    <dl className={styles.figures}>
      {cells.map((cell) => (
        <div key={cell.label} className={styles.figure}>
          <dd className={styles.figureValue}>{cell.value}</dd>
          <dt className={styles.figureLabel}>{cell.label}</dt>
          <dd className={styles.figureNote}>{cell.note}</dd>
        </div>
      ))}
    </dl>
  );
}
