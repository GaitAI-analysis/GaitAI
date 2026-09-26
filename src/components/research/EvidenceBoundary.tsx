import { Check } from "lucide-react";
import styles from "./boundary.module.css";

/**
 * Research foundation ≠ product validation.
 *
 * This is the most important sentence on the page and it was buried: stated
 * once as a footnote, then repeated verbatim under all four pillars in the
 * evidence explorer, where four identical paragraphs made it read as
 * boilerplate rather than as the page's one act of scientific candour.
 *
 * It is now the whole section, as two zones either side of a boundary. Left is
 * what the published record establishes — filled marks, cool cyan. Right is
 * what it does not, and what a product would need instead — open marks, muted
 * amber. Not red: nothing here is a failure, and colouring an honest
 * limitation as an error would misstate it as badly as hiding it.
 *
 * Both lists restate what the repository already documents. The right-hand
 * list in particular adds no claim — it names the evidence classes that are
 * absent, which is exactly why they are listed.
 */

const ESTABLISHED = [
  {
    term: "Peer-reviewed research",
    detail: "Published with Springer, Elsevier and Wiley · IET.",
  },
  {
    term: "A granted patent",
    detail: "Patent 402202, covering the edge-analytics pipeline.",
  },
  {
    term: "Capability traceability",
    detail: "Each capability maps back to the records behind it.",
  },
  {
    term: "Methodological foundation",
    detail: "The methods the platform's movement layer is built on.",
  },
] as const;

const REQUIRED = [
  {
    term: "Clinical validation",
    detail: "Per product, per intended use, against a clinical reference.",
  },
  {
    term: "Sensitivity & specificity",
    detail: "No accuracy or error-rate figures are established here.",
  },
  {
    term: "Multi-site datasets",
    detail: "Evidence that a result holds beyond one setting.",
  },
  {
    term: "Named deployment evidence",
    detail: "Documented outcomes from a specific deployment.",
  },
] as const;

export function EvidenceBoundary() {
  return (
    <div className={styles.boundary}>
      {/* ── The statement, as the section's own axis ── */}
      <div className={styles.axis}>
        <span className={styles.axisTermLeft}>Research foundation</span>
        <span aria-hidden="true" className={styles.axisRuleLeft} />
        <span className={styles.axisSign}>≠</span>
        <span aria-hidden="true" className={styles.axisRuleRight} />
        <span className={styles.axisTermRight}>Product validation</span>
      </div>

      <div className={styles.zones}>
        {/* ── Established ── */}
        <section className={`${styles.zone} ${styles.zoneEstablished}`}>
          <header className={styles.zoneHead}>
            <span className={styles.zoneLabel}>Established</span>
            <span className={styles.zoneNote}>
              What the published record carries
            </span>
          </header>
          <ul className={styles.list}>
            {ESTABLISHED.map((item, i) => (
              <li
                key={item.term}
                className={styles.item}
                style={{ ["--b-i" as string]: i }}
              >
                <span aria-hidden="true" className={styles.markDone}>
                  <Check className="h-3 w-3" />
                </span>
                <span className="min-w-0">
                  <span className={styles.itemTerm}>{item.term}</span>
                  <span className={styles.itemDetail}>{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Requires product-specific validation ── */}
        <section className={`${styles.zone} ${styles.zoneRequired}`}>
          <header className={styles.zoneHead}>
            <span className={styles.zoneLabel}>
              Requires product-specific validation
            </span>
            <span className={styles.zoneNote}>
              Carried out per product and per deployment
            </span>
          </header>
          <ul className={styles.list}>
            {REQUIRED.map((item, i) => (
              <li
                key={item.term}
                className={styles.item}
                style={{ ["--b-i" as string]: i }}
              >
                <span aria-hidden="true" className={styles.markOpen} />
                <span className="min-w-0">
                  <span className={styles.itemTerm}>{item.term}</span>
                  <span className={styles.itemDetail}>{item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className={styles.foot}>
        Research establishes the methodological foundation. Product-specific
        validation establishes fitness for a particular use — a separate step,
        carried out per product and per deployment.
      </p>
    </div>
  );
}
