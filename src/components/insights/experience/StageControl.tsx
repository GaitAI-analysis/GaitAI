"use client";

import { useId, useRef } from "react";
import { useStageScrub } from "./useStageScrub";
import styles from "./experience.module.css";

export interface Stage {
  id: string;
  /** The name printed under the track. Short — it is set in 9px mono. */
  label: string;
  /** A longer name for the slider's aria-valuetext and the mobile readout. */
  name?: string;
}

/**
 * The stage control:
 *
 *   RAW ━━━ POSE ━━━ SKELETON ━━━ SIGNAL ━━━ INTELLIGENCE
 *                    ●
 *
 * One track that is a slider (drag, tap, arrow keys) and one row of stage
 * names that are buttons (tap to jump). The knob follows the pointer while
 * dragging and snaps on release. Below ~560px the names collapse to a single
 * readout of the current stage, because eight labels do not fit a phone.
 *
 * `labels` lets a caller show fewer names than there are stages — the hero
 * has eight stages and five printed names — by giving the index each name
 * sits on.
 */
export function StageControl({
  stages,
  value,
  onChange,
  ariaLabel,
  labels,
  hint,
  dense,
}: {
  stages: Stage[];
  value: number;
  onChange: (next: number, source: "pointer" | "keyboard" | "button") => void;
  ariaLabel: string;
  /** Indices of the stages that get a printed name. Default: all of them. */
  labels?: number[];
  /** A one-line instruction under the track, e.g. "Drag, tap or use ← →". */
  hint?: string;
  /** Collapse the label row on narrow screens. Default true above 5 stages. */
  dense?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const count = stages.length;
  const { dragging, fraction, handlers } = useStageScrub({
    count,
    value,
    onChange: (next, source) => onChange(next, source),
    trackRef,
  });
  const printed = labels ?? stages.map((_, index) => index);
  const isDense = dense ?? count > 5;
  const current = stages[value];
  const pct = (index: number) => (count > 1 ? (index / (count - 1)) * 100 : 0);

  return (
    <div className={styles.scrub}>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={count - 1}
        aria-valuenow={value}
        aria-valuetext={current?.name ?? current?.label}
        aria-describedby={hint ? `${id}-hint` : undefined}
        data-dragging={dragging ? "true" : undefined}
        className={styles.scrubTrack}
        {...handlers}
      >
        <span aria-hidden="true" className={styles.scrubLine} />
        <span
          aria-hidden="true"
          className={styles.scrubFill}
          style={{ width: `${fraction * 100}%` }}
        />
        {stages.map((stage, index) => (
          <span
            key={stage.id}
            aria-hidden="true"
            className={`${styles.scrubTick} ${index <= value ? styles.scrubTickOn : ""}`}
            style={{ left: `${pct(index)}%` }}
          />
        ))}
        <span
          aria-hidden="true"
          className={styles.scrubKnob}
          style={{ left: `${fraction * 100}%` }}
        />
      </div>

      <div
        className={`${styles.scrubLabels} ${isDense ? styles.scrubLabelsDense : ""}`}
        style={{ gridTemplateColumns: `repeat(${printed.length}, minmax(0, 1fr))` }}
      >
        {printed.map((index) => {
          const stage = stages[index];
          if (!stage) return null;
          /* A printed name lights when the current stage is at or past it but
             before the next printed name — so five names can stand for eight
             stages without a gap where nothing is lit. */
          const nextPrinted = printed.find((candidate) => candidate > index) ?? count;
          const on = value >= index && value < nextPrinted;
          return (
            <button
              key={stage.id}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => onChange(index, "button")}
              className={`${styles.scrubLabel} ${on ? styles.scrubLabelOn : ""}`}
            >
              {stage.label}
            </button>
          );
        })}
      </div>
      {isDense && (
        <p aria-hidden="true" className={styles.scrubCurrent}>
          {String(value + 1).padStart(2, "0")} · {current?.name ?? current?.label}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className={styles.scrubHint}>
          {hint}
        </p>
      )}
    </div>
  );
}
