"use client";

import type { ReactNode } from "react";
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

export function SegmentTabs({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const move = (direction: 1 | -1) => {
    const index = options.findIndex((option) => option.id === value);
    const next = (index + direction + options.length) % options.length;
    onChange(options[next].id);
  };

  return (
    <div role="tablist" aria-label={label} className={styles.tabs}>
      {options.map((option) => {
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
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(-1);
              }
            }}
            className={`${styles.tab} ${on ? styles.tabOn : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
