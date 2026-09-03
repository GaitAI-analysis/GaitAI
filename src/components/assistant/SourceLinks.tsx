"use client";

import Link from "next/link";
import type { SourceLink } from "./use-assistant";
import styles from "./assistant.module.css";

/**
 * The verification row under a grounded answer.
 *
 * Real internal routes with their record kind — never a citation id, never a
 * numeric marker in the prose. One to three, because the point is to give the
 * reader somewhere to go, not to prove the retrieval worked.
 */
export function SourceLinks({
  sources,
  onNavigate,
}: {
  sources: SourceLink[];
  onNavigate?: (url: string) => void;
}) {
  if (!sources.length) return null;

  return (
    <div className={styles.sources}>
      <p className={styles.microLabel}>Sources</p>
      <ul className={styles.sourceList}>
        {sources.map((source) => (
          <li key={source.url}>
            <Link
              href={source.url}
              className={styles.sourceLink}
              onClick={() => onNavigate?.(source.url)}
            >
              <span className={styles.sourceTitle}>{source.title}</span>
              <span className={styles.sourceKind}>{source.kind}</span>
              <span aria-hidden="true" className={styles.sourceArrow}>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
