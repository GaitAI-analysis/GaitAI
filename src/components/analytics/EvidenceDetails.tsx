import Link from "next/link";
import { EVIDENCE_STATE_LABEL, type EvidenceRow } from "@/data/evidence-status";
import styles from "./evidence-status.module.css";

/** An optional, keyboard-accessible evidence layer. No modal or client bundle. */
export function EvidenceDetails({ row, reviewedAt }: { row: EvidenceRow; reviewedAt: string }) {
  return (
    <details className={styles.disclosure}>
      <summary className={styles.disclosureTrigger}>
        View evidence<span className="sr-only"> for {row.label}</span>
      </summary>
      <div className={styles.disclosureBody}>
        <p><strong>Claim / capability:</strong> {row.detail}</p>
        <p><strong>Status:</strong> {EVIDENCE_STATE_LABEL[row.state]}</p>
        <p><strong>Applicability:</strong> {row.applicability}</p>
        <p><strong>Limitation:</strong> {row.limitation}</p>
        {row.sources.length > 0 ? (
          <ul className={styles.sources}>
            {row.sources.map((source) => (
              <li key={source.href}>
                <span className={styles.sourceKind}>{source.kind === "context" ? "Context · not validation evidence" : source.kind}</span>
                <Link className={styles.sourceLink} href={source.href}>{source.label}</Link>
              </li>
            ))}
          </ul>
        ) : <p>No supporting source is published for this status.</p>}
        <p>Inventory reviewed <time dateTime={reviewedAt}>{reviewedAt}</time>.</p>
      </div>
    </details>
  );
}
