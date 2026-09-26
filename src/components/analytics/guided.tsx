"use client";

import type { ReactNode } from "react";
import { EnvironmentGlyph } from "@/components/usecases/EnvironmentGlyph";
import styles from "./guided.module.css";

/**
 * The guided-selection primitives, shared by the /products product finder and
 * the /use-cases scenario explorer.
 *
 * Both pages ask the same three questions — environment, objective, available
 * capture — and both used to render them as three identical chip rows inside
 * one large bordered panel. These components replace that with a sequence:
 * open bands, a strong hierarchy per step, richer blocks for the step that
 * actually decides the other two, and a summary that hands off to the result.
 *
 * They are presentation only. Every option, count, disabled state and family
 * grouping is passed in by the configurator that owns the data.
 */

/* ── One step ─────────────────────────────────────────────────────────────── */

export function GuidedStep({
  index,
  title,
  hint,
  /** Bigger title — for the step the others depend on. */
  lead = false,
  /** Not answerable yet: reads back instead of looking broken. */
  waiting = false,
  /** Answered — the step number takes the accent. */
  done = false,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  lead?: boolean;
  waiting?: boolean;
  done?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={[
        styles.step,
        lead ? styles.stepLead : "",
        waiting ? styles.stepWaiting : "",
        done ? styles.stepDone : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.stepHead}>
        <span className={styles.stepIndex}>Step {index}</span>
        <h3 className={styles.stepTitle}>{title}</h3>
        {hint && <p className={styles.stepHint}>{hint}</p>}
      </div>
      <div className={styles.stepBody}>{children}</div>
    </section>
  );
}

export function GuidedSteps({ children }: { children: ReactNode }) {
  return <div className={styles.steps}>{children}</div>;
}

/* ── Step 1: environments, grouped by family ──────────────────────────────── */

export type EnvOption = {
  id: string;
  name: string;
  family: string;
};

/**
 * The environment picker.
 *
 * Blocks rather than pills, and grouped under a real family heading, because
 * this is the choice the other two steps depend on and it was previously the
 * flattest thing on the page: seventeen identical capsules in two rows whose
 * family labels were 9px captions.
 *
 * Each block carries the environment's own drawn glyph — the same set
 * /use-cases uses — so the options are told apart by shape as well as text.
 */
export function EnvironmentSelect({
  groups,
  selected,
  onSelect,
}: {
  groups: { family: string; label: string; options: EnvOption[] }[];
  selected?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Environment">
      {groups.map((group) => (
        <div key={group.family} className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.groupName}>{group.label}</span>
            <span aria-hidden="true" className={styles.groupRule} />
            <span className={styles.groupCount}>
              {String(group.options.length).padStart(2, "0")}
            </span>
          </div>

          <div className={styles.envGrid}>
            {group.options.map((option) => {
              const on = option.id === selected;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onSelect(option.id)}
                  className={`${styles.env} ${on ? styles.envOn : ""}`}
                >
                  <span aria-hidden="true" className={styles.envGlyph}>
                    <EnvironmentGlyph caseId={option.id} />
                  </span>
                  <span className={styles.envName}>{option.name}</span>
                  {on && (
                    <span aria-hidden="true" className={styles.envCheck}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Steps 2 and 3: option chips ──────────────────────────────────────────── */

export type GuidedOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export function OptionSelect({
  options,
  selected,
  onSelect,
  multi = false,
  groupLabel,
}: {
  options: GuidedOption[];
  selected: string[];
  onSelect: (id: string) => void;
  multi?: boolean;
  groupLabel: string;
}) {
  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={groupLabel}
      className={styles.options}
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
            className={`${styles.opt} ${on ? styles.optOn : ""} ${
              option.disabled ? styles.optOff : ""
            }`}
          >
            {on && <span aria-hidden="true" className={styles.optDot} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── The bridge from selection to result ──────────────────────────────────── */

/**
 * What the reader has chosen, restated immediately above the result.
 *
 * The result used to begin with no reference back to the selection, so a
 * configuration two scrolls down had no visible cause. This is that cause,
 * stated once: environment · objective · capture, the family it resolves to,
 * and a way out.
 */
export function SelectionSummary({
  terms,
  family,
  onReset,
  idlePlaceholder,
}: {
  /** Chosen values in sequence order. The first is set as the headline term. */
  terms: string[];
  family?: string;
  onReset?: () => void;
  /** Shown when nothing is chosen yet. */
  idlePlaceholder: string;
}) {
  const idle = terms.length === 0;

  return (
    <div
      aria-live="polite"
      className={`${styles.summary} ${idle ? styles.summaryIdle : ""}`}
    >
      <div className={styles.summaryTrail}>
        {idle ? (
          <span className={styles.summaryTerm}>{idlePlaceholder}</span>
        ) : (
          terms.map((term, i) => (
            <span key={term} className={styles.summaryItem}>
              {i > 0 && (
                <span aria-hidden="true" className={styles.summarySep}>
                  ·
                </span>
              )}
              <span
                className={i === 0 ? styles.summaryTerm : styles.summaryMinor}
              >
                {term}
              </span>
            </span>
          ))
        )}
      </div>

      <div className={styles.summaryMeta}>
        {family && <span className={styles.summaryFamily}>{family}</span>}
        {onReset && !idle && (
          <button type="button" onClick={onReset} className={styles.summaryReset}>
            Start over
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Result section break ─────────────────────────────────────────────────── */

export function ResultHeader({
  kicker,
  title,
  forLabel,
}: {
  kicker: string;
  title: string;
  /** "for Hospitals + Fall-risk indicators" — the selection, restated. */
  forLabel?: string;
}) {
  return (
    <header className={styles.resultHead}>
      <span className={styles.resultKicker}>{kicker}</span>
      <h3 className={styles.resultTitle}>
        {title}
        {forLabel && (
          <>
            {" "}
            <span className={styles.resultFor}>{forLabel}</span>
          </>
        )}
      </h3>
    </header>
  );
}

export function ResultBody({
  /** Changing this key replays the transition when the selection changes. */
  reveal,
  children,
}: {
  reveal?: string;
  children: ReactNode;
}) {
  return (
    <div key={reveal} className={styles.resultBody}>
      {children}
    </div>
  );
}

/* ── Family scope switch (/use-cases) ─────────────────────────────────────── */

/**
 * A top-level scope change, given its own band.
 *
 * It previously sat inside the control panel as a pill group between the
 * heading and the environment chips, which made a scope switch look like a
 * fourth filter. The active segment is a raised surface rather than a tint,
 * because a scope switch has to read as "you are here".
 */
export function FamilyScopeToggle({
  options,
  value,
  onChange,
  caption,
  meta,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  caption: string;
  meta?: string;
}) {
  return (
    <div className={styles.scopeBar}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={styles.scopeLabel}>{caption}</span>
        <div role="tablist" aria-label={caption} className={styles.scope}>
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
                  const dir =
                    event.key === "ArrowRight"
                      ? 1
                      : event.key === "ArrowLeft"
                        ? -1
                        : 0;
                  if (!dir) return;
                  event.preventDefault();
                  const i = options.findIndex((o) => o.id === value);
                  onChange(options[(i + dir + options.length) % options.length].id);
                }}
                className={`${styles.scopeBtn} ${on ? styles.scopeOn : ""}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      {meta && <span className={styles.scopeLabel}>{meta}</span>}
    </div>
  );
}

/* ── Two narrow steps sharing one band (/use-cases) ───────────────────────── */

export function GuidedPair({ children }: { children: ReactNode }) {
  return <div className={styles.pair}>{children}</div>;
}

export function GuidedPairStep({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.pairCol}>
      <div className={styles.pairHead}>
        <span className={styles.pairIndex}>{index}</span>
        <h3 className={styles.pairTitle}>{title}</h3>
      </div>
      {hint && <p className={styles.pairHint}>{hint}</p>}
      {children}
    </div>
  );
}
