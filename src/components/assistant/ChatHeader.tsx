"use client";

import { ASSISTANT_TAGLINE } from "./config";
import styles from "./assistant.module.css";

/**
 * The panel's identity line.
 *
 * Typographic, matching the site's other chrome: a mono, letter-spaced name,
 * the tagline beneath it, and two quiet controls. "New conversation" is
 * deliberately understated — it is a recovery, not a feature — and is hidden
 * entirely until there is something to clear.
 */
export function ChatHeader({
  onReset,
  onClose,
  canReset,
  titleId,
}: {
  onReset: () => void;
  onClose: () => void;
  canReset: boolean;
  titleId: string;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <p className={styles.name} id={titleId}>
          <span aria-hidden="true" className={styles.mark}>
            ✦
          </span>
          Ask GaitAI
        </p>
        <p className={styles.tagline}>{ASSISTANT_TAGLINE}</p>
      </div>

      <div className={styles.headerControls}>
        {canReset && (
          <button type="button" onClick={onReset} className={styles.quietButton}>
            New conversation
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close Ask GaitAI"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </header>
  );
}
