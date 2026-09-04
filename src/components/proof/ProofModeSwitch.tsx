"use client";

import { useRef } from "react";
import {
  PROOF_MODE_HINT,
  PROOF_MODE_LABEL,
  type ProofMode,
} from "@/data/provenance";
import { useProofMode } from "./ProofModeProvider";
import styles from "./proof.module.css";

/**
 * EXPLORE | EVIDENCE.
 *
 * A two-option tablist with the roving-focus and arrow-key behaviour the rest
 * of the site's segmented controls use, so it is the same control a reader has
 * already met on the product pages and in the analytical surfaces rather than
 * a new one.
 *
 * WHERE IT LIVES. In the footer, on every page — which is the only placement
 * that satisfies both halves of the brief. The mode is global, so the control
 * has to be reachable from wherever a reader happens to be when the marks
 * appear; and it has to be subtle, so it cannot take space in the header. A
 * reader who arrives on an `?evidence=1` link must be able to find the switch
 * that turns it off, from any page, and the footer is where site-wide
 * preferences already live.
 *
 * Product detail pages mount a second copy inline, beside the executive /
 * technical toggle, because that is the page where the question is asked most
 * and scrolling to the footer to ask it is a poor answer. One state, two
 * mount points.
 *
 * THE HINT IS SHOWN ONLY WHEN THE MODE IS ON. Off, the control is two words
 * and needs no explanation; on, a reader is looking at marks that were not
 * there a moment ago and deserves one line saying what they are.
 */

const OPTIONS: ProofMode[] = ["explore", "evidence"];

export function ProofModeSwitch({
  /** Suppress the explanatory line — for the footer, where space is tight. */
  quiet = false,
  className,
}: {
  quiet?: boolean;
  className?: string;
}) {
  const { mode, setMode } = useProofMode();
  const listRef = useRef<HTMLDivElement>(null);

  /* Selection and focus move together: the selected tab is the only one in
     the tab order, so focus has to follow it or a keyboard user loses their
     place. Same rule as SegmentTabs. */
  const go = (index: number) => {
    const next = (index + OPTIONS.length) % OPTIONS.length;
    setMode(OPTIONS[next]);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      ?.[next]?.focus();
  };

  return (
    <div className={`${styles.switch} ${className ?? ""}`}>
      <div className={styles.switchRow}>
        <span id="proof-mode-label" className={styles.switchLabel}>
          View
        </span>
        <div
          ref={listRef}
          role="tablist"
          aria-labelledby="proof-mode-label"
          className={styles.track}
        >
          {OPTIONS.map((option, i) => {
            const on = option === mode;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setMode(option)}
                onKeyDown={(event) => {
                  const key = event.key;
                  if (key === "ArrowRight" || key === "ArrowDown") {
                    event.preventDefault();
                    go(i + 1);
                  } else if (key === "ArrowLeft" || key === "ArrowUp") {
                    event.preventDefault();
                    go(i - 1);
                  } else if (key === "Home") {
                    event.preventDefault();
                    go(0);
                  } else if (key === "End") {
                    event.preventDefault();
                    go(OPTIONS.length - 1);
                  }
                }}
                className={`${styles.segment} ${on ? styles.segmentOn : ""}`}
              >
                {PROOF_MODE_LABEL[option]}
              </button>
            );
          })}
        </div>
      </div>

      {!quiet && mode === "evidence" && (
        <p className={styles.hint}>{PROOF_MODE_HINT}</p>
      )}
    </div>
  );
}
