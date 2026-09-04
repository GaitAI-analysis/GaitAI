"use client";

import {
  PROVENANCE_LABEL,
  PROVENANCE_MEANING,
  sortProvenance,
  type ProvenanceKind,
} from "@/data/provenance";
import { useProofMode } from "./ProofModeProvider";
import styles from "./proof.module.css";

/**
 * What one part of a page is based on. Renders NOTHING outside evidence mode.
 *
 * THAT IS THE WHOLE DESIGN. The brief's constraint — "keep it subtle, do not
 * plaster evidence badges across every screen" — is not satisfiable by making
 * a badge quieter, because a permanent badge on every section is noise however
 * quiet it is. It is satisfied by the marks not being there at all until
 * someone asks the question. In explore mode this component returns null and
 * costs one context read.
 *
 * WHY THE MEANING IS PRINTED, NOT HOVERED. "Capability informed by research"
 * is a phrase a reader can easily take as "clinically validated". A label that
 * has to be hovered to be understood has not communicated, and on a phone it
 * cannot be hovered at all — so the meaning is a line of real text under the
 * label. `compact` drops it for the few places with no room, and there it
 * becomes the accessible name instead of disappearing.
 *
 * ONLY TWO KINDS TAKE A COLOUR: the strongest basis and the missing one, which
 * are the two a reader most needs to tell apart at a glance. Colouring all
 * seven would build a key nobody asked to learn.
 */

const STRONG: ProvenanceKind[] = ["published-research", "granted-patent"];
const WEAK: ProvenanceKind[] = ["synthetic-data", "validation-not-published"];

export function ProvenanceMark({
  kind,
  kinds,
  compact = false,
  inline = false,
  className,
}: {
  /** A single kind. Convenience for the common case. */
  kind?: ProvenanceKind;
  /** Several, shown strongest-first. Ignored when `kind` is given. */
  kinds?: readonly ProvenanceKind[];
  /** Label only. The meaning becomes the accessible name. */
  compact?: boolean;
  /** Sit in a row of controls rather than under a heading. */
  inline?: boolean;
  className?: string;
}) {
  const { evidence } = useProofMode();
  if (!evidence) return null;

  const list = sortProvenance(kind ? [kind] : (kinds ?? []));
  if (list.length === 0) return null;

  const marks = list.map((item) => (
    <span
      key={item}
      className={`${styles.mark} ${inline ? styles.markInline : ""} ${
        STRONG.includes(item)
          ? styles.markStrong
          : WEAK.includes(item)
            ? styles.markWeak
            : ""
      }`}
      /* The meaning is the accessible name when it is not printed; when it IS
         printed, both lines are read and a title would say it a third time. */
      title={compact ? PROVENANCE_MEANING[item] : undefined}
    >
      <span className={styles.markLabel}>
        {PROVENANCE_LABEL[item]}
        {compact && (
          <span className="sr-only"> — {PROVENANCE_MEANING[item]}</span>
        )}
      </span>
      {!compact && (
        <span className={styles.markMeaning}>{PROVENANCE_MEANING[item]}</span>
      )}
    </span>
  ));

  if (list.length === 1) {
    return className ? (
      <span className={className}>{marks}</span>
    ) : (
      <>{marks}</>
    );
  }

  return (
    <span className={`${styles.stack} ${className ?? ""}`}>{marks}</span>
  );
}
