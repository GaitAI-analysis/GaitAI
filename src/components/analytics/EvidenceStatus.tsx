import Link from "next/link";
import {
  EVIDENCE_STATE_LABEL,
  evidenceStatusFor,
  type EvidenceState,
} from "@/data/evidence-status";
import styles from "./evidence-status.module.css";
import { EvidenceDetails } from "./EvidenceDetails";

/**
 * How far the evidence for one module actually goes.
 *
 * Every row's state is derived in evidence-status.ts from something already in
 * the repository — a resolved publication join, a documented specification, a
 * sample output — and the last two rows are repository-wide constants that
 * cannot be flipped by adding a page. Nothing here is asserted at the call
 * site: the component receives a product id and reads.
 *
 * TONE MATTERS. This is a transparency panel, not a warning. The established
 * rows are stated first and plainly; the unestablished rows say "not yet
 * published" and explain what that means, rather than reading as a red mark.
 * State is carried in words and in a shape — a filled square, a half square,
 * an open ring — never by colour alone.
 */

const MARK: Record<EvidenceState, string> = {
  available: styles.markOn,
  "in-development": styles.markPart,
  "not-published": styles.markOff,
  "not-claimed": styles.markOff,
};

export function EvidenceStatus({ productId }: { productId: string }) {
  const evidence = evidenceStatusFor(productId);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <h3 className={styles.title}>GaitAI Evidence Index</h3>
        <p className={styles.summary}>
          {evidence.availableCount} categories documented
        </p>
      </div>

      <p className={styles.lead}>
        What is documented for this module, and what is not. Research
        foundation is not product validation — the two are listed separately on
        purpose.
      </p>

      <dl className={styles.rows}>
        {evidence.rows.map((row) => (
          <div key={row.id} className={styles.row}>
            <dt className={styles.rowHead}>
              <span aria-hidden="true" className={`${styles.mark} ${MARK[row.state]}`} />
              <span className={styles.rowLabel}>{row.label}</span>
              <span
                className={`${styles.state} ${
                  row.state === "available" ? styles.stateOn : ""
                }`}
              >
                {EVIDENCE_STATE_LABEL[row.state]}
              </span>
            </dt>
            <dd className={styles.rowDetail}>
              {row.detail}
              <EvidenceDetails row={row} reviewedAt={evidence.reviewedAt} />
            </dd>
          </div>
        ))}
      </dl>

      <p className={styles.foot}>
        <span className={styles.reviewed}>Inventory reviewed <time dateTime={evidence.reviewedAt}>{evidence.reviewedAt}</time></span>
        <Link href="/trust" className={styles.link}>
          How GaitAI states evidence →
        </Link>
      </p>
    </div>
  );
}
