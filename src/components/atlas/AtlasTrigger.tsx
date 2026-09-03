"use client";

import { ATLAS_EVENT } from "./atlas-event";
import styles from "./atlas.module.css";

/**
 * The navbar's way into the Atlas: one 32px glyph beside Search.
 *
 * Not another nav tab — the brief is explicit that the header cannot grow,
 * and a seventh label would push the six that name the site's actual sections.
 * Two ways in, one map: this glyph, and the location strip's own Atlas button.
 * Both fire the same event, so the navbar never owns the overlay.
 */
export function AtlasTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(ATLAS_EVENT))}
      aria-label="Open the GaitAI Atlas — the whole site as a map"
      title="GaitAI Atlas"
      className={`${styles.scope} ${styles.navTrigger}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        className={styles.navGlyph}
      >
        <path d="M3.4 3.6h2.8M6.2 3.6v8.8H3.4" strokeLinecap="round" />
        <path d="M6.2 8h3.2" strokeLinecap="round" />
        <circle cx="12.1" cy="3.6" r="1.5" />
        <circle cx="12.1" cy="8" r="1.5" />
        <circle cx="12.1" cy="12.4" r="1.5" />
      </svg>
    </button>
  );
}

/**
 * The same event, as a text button — for the one place that has earned a
 * sentence rather than a glyph.
 *
 * GaitScape and the Atlas answer different questions ("how does the
 * intelligence connect?" against "where am I on the website?"), and each is
 * the natural next question from the other, so they link both ways. This is
 * the GaitScape side of that pair.
 */
export function AtlasLink({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(ATLAS_EVENT))}
      className="btn-ghost"
    >
      {children}
    </button>
  );
}
