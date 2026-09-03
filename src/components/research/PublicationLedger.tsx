import Link from "next/link";
import styles from "./observatory.module.css";

/**
 * The published record as a ledger, not a card grid.
 *
 * An academic archive reads index → title → venue → publisher → year, and the
 * hover affordance is a hairline growing under the row rather than a card
 * lifting off the page. The granted patent is the one record with a different
 * status, so it is the one row with a different accent: a champagne index,
 * year and left rule. Nothing else on the page uses that colour.
 *
 * Rows link to each record's own page. This is a selection — the full library
 * lives on /publications, and the footer says how many records that is.
 */

export type LedgerRecord = {
  id: string;
  kind: string;
  title: string;
  venue: string;
  publisher: string;
  year: number;
};

export function PublicationLedger({
  records,
  total,
}: {
  records: LedgerRecord[];
  total: number;
}) {
  return (
    <>
      <ol className={styles.ledger}>
        {records.map((record, i) => {
          const isPatent = record.kind === "patent";
          return (
            <li
              key={record.id}
              className={`${styles.ledgerRow}${
                isPatent ? ` ${styles.ledgerPatent}` : ""
              }`}
            >
              <span aria-hidden="true" className={styles.ledgerIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Stretched over the row — see `.ledgerHit`. The link stays
                  unpositioned so its ::after resolves against the row. */}
              <Link
                href={`/publications/${record.id}/`}
                className={`${styles.ledgerHit} min-w-0`}
              >
                <span className={styles.ledgerTitle}>{record.title}</span>
              </Link>

              <span className={styles.ledgerMeta}>
                {record.venue}
                <span className={styles.ledgerPublisher}>
                  {record.publisher}
                </span>
              </span>

              <span className={styles.ledgerYear}>
                {record.year}
                <span aria-hidden="true" className={styles.ledgerArrow}>
                  ↗
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className={styles.ledgerFoot}>
        <span className="text-[12px] leading-relaxed text-soft-mute">
          Showing {records.length} of {total} records.
        </span>
        <Link
          href="/publications"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
        >
          The full research library →
        </Link>
      </div>
    </>
  );
}
