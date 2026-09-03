"use client";

import { forwardRef, useEffect, useState } from "react";
import styles from "./assistant.module.css";

const SEEN_KEY = "gaitai:ask:seen";

/**
 * The collapsed control.
 *
 * A typographic pill, not a floating avatar: the ✦ mark and the words "Ask
 * GaitAI", on the same glass surface as the navbar's ⌘K trigger. There is no
 * face, no bubble tail and no notification dot, because none of those are true
 * — nothing is waiting for the visitor.
 *
 * THE FIRST-VISIT REVEAL
 * On a first visit the pill mounts as the mark alone and widens once, after a
 * beat, to show the label. It happens a single time per browser, it never opens
 * the panel, it never covers content, and it does not repeat or pulse. Under
 * `prefers-reduced-motion` the label is simply there from the start.
 */
export const ChatLauncher = forwardRef<
  HTMLButtonElement,
  { onOpen: () => void; hidden: boolean }
>(function ChatLauncher({ onOpen, hidden }, ref) {
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* Storage blocked: treat as seen, so the reveal never repeats. */
    }

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (seen || reduced) return;

    setRevealed(false);
    const timer = window.setTimeout(() => {
      setRevealed(true);
      try {
        window.localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* nothing to remember */
      }
    }, 1400);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={styles.launcher}
      data-revealed={revealed}
      data-hidden={hidden}
      aria-label="Ask GaitAI — your guide to movement intelligence"
      aria-haspopup="dialog"
    >
      <span aria-hidden="true" className={styles.launcherMark}>
        ✦
      </span>
      <span className={styles.launcherLabel}>Ask GaitAI</span>
    </button>
  );
});
