import styles from "./observatory.module.css";

/**
 * The four method commitments as a manifesto, not a card grid.
 *
 * Each commitment steps further across a twelve-column grid than the one
 * above it, with its index set very faint and very large behind the text and
 * alternating sides. The result reads as a document rather than a feature
 * list, which is the point: these are practice and architecture statements,
 * not product benefits.
 *
 * Copy is unchanged, including the fourth commitment's promise that each
 * product's technical view carries its own limitations.
 */

const principles = [
  {
    title: "Traceable to a signal",
    desc: "Every score is built from named movement features — cadence, symmetry, variability, trajectory — so a reviewer can see what moved the number.",
  },
  {
    title: "Peer-reviewed foundations",
    desc: "Recognition, pose and privacy components come from work published with Springer, Elsevier and Wiley · IET; the edge pipeline is covered by a granted patent.",
  },
  {
    title: "Framed as decision support",
    desc: "Outputs are assessment, screening and monitoring. No product diagnoses — the design constraint, not a disclaimer added afterwards.",
  },
  {
    title: "Stated limitations",
    desc: "Each product's technical view lists what constrains capture quality, what the model does not infer, and where human review is required.",
  },
];

export function ResearchManifesto() {
  return (
    <ol className={styles.manifesto}>
      {principles.map((principle, i) => (
        <li key={principle.title} className={styles.mItem}>
          <span aria-hidden="true" className={styles.mIndex}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className={styles.mBody}>
            <span className={styles.mNumber}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className={styles.mTitle}>{principle.title}</h3>
            <span aria-hidden="true" className={styles.mRule} />
            <p className={styles.mDesc}>{principle.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
