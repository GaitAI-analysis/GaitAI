"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./analytics.module.css";

/**
 * The interactive controls: a chip scroller and a segmented tab set.
 *
 * Both are real buttons. The chip scroller is a group of `aria-pressed`
 * toggles (multi-select) or `aria-checked` radios (single-select), so a screen
 * reader announces the state rather than just the label; the tab set is a
 * `tablist` with arrow-key movement. On a phone the chips become a horizontal
 * scroller rather than a wrapped block of forty targets.
 *
 * A chip with a zero count is rendered disabled rather than hidden, because a
 * filter vocabulary that changes shape as you use it is disorienting — and
 * because "no module in this environment does that" is itself an answer.
 */

export interface ChipOption {
  id: string;
  label: string;
  count?: number;
  /** Rendered but not selectable — nothing matches it here. */
  disabled?: boolean;
}

export function ChipScroller({
  label,
  options,
  selected,
  onSelect,
  multi = false,
  groupLabel,
  action,
}: {
  label?: string;
  options: ChipOption[];
  selected: string[];
  onSelect: (id: string) => void;
  multi?: boolean;
  /** Accessible name for the group when `label` is not enough. */
  groupLabel?: string;
  /** Right-aligned control, e.g. a "clear" button. */
  action?: ReactNode;
}) {
  return (
    <div className={styles.controlGroup}>
      {(label || action) && (
        <div className={styles.controlLabel}>
          {label && <span>{label}</span>}
          {action}
        </div>
      )}
      <div
        role={multi ? "group" : "radiogroup"}
        aria-label={groupLabel ?? label}
        className={styles.chips}
      >
        {options.map((option) => {
          const on = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              disabled={option.disabled}
              {...(multi
                ? { "aria-pressed": on }
                : { role: "radio", "aria-checked": on })}
              onClick={() => onSelect(option.id)}
              className={`${styles.chip} ${on ? styles.chipOn : ""} ${
                option.disabled ? styles.chipDisabled : ""
              }`}
            >
              {option.label}
              {typeof option.count === "number" && (
                <span className={styles.chipCount}>
                  {String(option.count).padStart(2, "0")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * True the first time a given cue is shown to this browser, and false ever
 * after. Resolved in an effect, so the server and the first client render
 * agree and the cue cannot cause a hydration mismatch.
 *
 * If storage is unavailable (private mode, storage blocked) the cue is shown
 * — once per page load rather than once per browser, which is the harmless
 * side of the trade.
 */
function useFirstVisit(key?: string) {
  const [first, setFirst] = useState(false);

  useEffect(() => {
    if (!key) return;
    const stamp = `gaitai:cue:${key}`;
    try {
      if (window.localStorage.getItem(stamp)) return;
      window.localStorage.setItem(stamp, "1");
    } catch {
      /* Storage refused — fall through and show it for this load. */
    }
    setFirst(true);
  }, [key]);

  return first;
}

/**
 * A segmented control: one of N, and unmistakably one of N.
 *
 * The states are the ones the interaction system defines, and they are
 * deliberately three distinct things rather than two:
 *
 *   DEFAULT   a defined track with a readable label — a control at rest
 *   HOVER     the segment under the pointer takes a surface and full ink
 *   SELECTED  accent tint, accent hairline and accent ink, persistent
 *
 * so a hovered segment can never be mistaken for the chosen one. Hover is
 * the enhancement; the resting track is what tells a phone user that these
 * four words are a switch and not a caption.
 *
 * `hint` is the one place instructional copy belongs on a control like this:
 * a first-time reader has no way to know that four capitalised words above a
 * data panel will change the panel. `cueKey` adds a single ring around the
 * already-selected segment on a first visit — one gesture, twice, then never
 * again, and nothing at all for a reader who asked for reduced motion.
 */
export function SegmentTabs({
  options,
  value,
  onChange,
  label,
  hint,
  cueKey,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  /** Short instruction above the control. Omit where the control is obvious. */
  hint?: string;
  /** Storage key for the one-time first-visit ring. Omit to never show one. */
  cueKey?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const firstVisit = useFirstVisit(cueKey);

  /* Roving focus: selection and focus move together, which is the expected
     behaviour for an automatically-activated tablist. Moving selection is not
     enough on its own — the newly selected tab is the only one in the tab
     order, so focus has to follow it or the keyboard user loses their place. */
  const go = (index: number) => {
    const next = (index + options.length) % options.length;
    onChange(options[next].id);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      ?.[next]?.focus();
  };

  return (
    <div className={hint ? styles.segmented : undefined}>
      {hint && (
        <p className={`ix-hint ${styles.segmentedHint}`}>
          {hint}
          <span
            aria-hidden="true"
            className={`ix-hint-mark ${firstVisit ? "ix-hint-mark--cue" : ""}`}
          >
            ↓
          </span>
        </p>
      )}
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className={styles.tabs}
      >
        {options.map((option, i) => {
          const on = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(option.id)}
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
                  go(options.length - 1);
                }
              }}
              className={`${styles.tab} ${on ? styles.tabOn : ""} ${
                on && firstVisit ? "ix-first-visit" : ""
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
