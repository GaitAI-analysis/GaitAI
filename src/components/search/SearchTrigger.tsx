"use client";

import { useEffect, useState } from "react";
import { SEARCH_EVENT } from "./IntelligenceSearch";
import styles from "./search.module.css";

/**
 * The navbar's affordance for the Cmd/Ctrl + K palette.
 *
 * A keyboard-only feature nobody can discover is a feature nobody uses, so
 * the shortcut gets a visible home. Typographic rather than a magnifier
 * glyph — the site is deliberately moving away from decorative icons, and the
 * key cap says what to press more precisely than an icon would.
 *
 * It opens the palette through a custom event rather than lifted state, so the
 * navbar does not have to own or re-render with the palette.
 *
 * The modifier label is resolved after mount: rendering ⌘ during SSR would
 * show the wrong key to every Windows and Linux visitor until hydration.
 */
export function SearchTrigger() {
  const [mac, setMac] = useState<boolean | null>(null);

  useEffect(() => {
    setMac(/mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent));
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(SEARCH_EVENT))}
      aria-label="Search GaitAI products, capabilities, environments and research"
      title="Search GaitAI"
      className={styles.trigger}
    >
      <span className={styles.triggerLabel}>Search</span>
      <kbd className={styles.triggerKey}>
        {/* Until the platform is known, show the neutral form. */}
        {mac === null ? "K" : mac ? "⌘K" : "Ctrl K"}
      </kbd>
    </button>
  );
}
