"use client";

import styles from "./assistant.module.css";

/**
 * Starters and follow-ups.
 *
 * The same control in two places: the opening state (page-aware starters) and
 * under an answer ("Ask next"). Both are real questions the corpus can answer —
 * the follow-ups are derived server-side from the records that were actually
 * retrieved, so a suggestion can never point at something GaitAI has no record
 * of.
 */
export function QuickPrompts({
  label,
  prompts,
  disabled,
  onPick,
}: {
  label?: string;
  prompts: string[];
  disabled?: boolean;
  onPick: (prompt: string) => void;
}) {
  if (!prompts.length) return null;

  return (
    <div className={styles.prompts}>
      {label && <p className={styles.microLabel}>{label}</p>}
      <div className={styles.promptRow}>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onPick(prompt)}
            className={styles.prompt}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
