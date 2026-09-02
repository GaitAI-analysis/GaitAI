import type { ReactNode } from "react";
import type { Vertical } from "@/data/products";
import styles from "./analytics.module.css";

/**
 * The layout atoms every analytical surface is assembled from.
 *
 * They exist so the five explorers share one chip, one stat readout, one
 * panel and one result column — and so a reader moving from /use-cases to
 * /products to /movement-lab is reading the same instrument rather than three
 * different dashboards. Nothing here holds state; each is a plain server
 * component unless the call site is already a client component.
 */

/** The family accent class for a subtree. */
export const familyClass = (family?: Vertical) =>
  family === "securevision" ? styles.famSecure : styles.famCare;

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className={styles.eyebrow}>
      <span aria-hidden="true" className={styles.eyebrowRule} />
      {children}
    </p>
  );
}

/**
 * The hairline stat row above an explorer. Values are always passed in from
 * derived counts — this component never computes or formats a claim.
 */
export function StatRow({
  stats,
}: {
  stats: { value: string; label: string }[];
}) {
  return (
    <dl className={styles.stats}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.stat}>
          <dd className={styles.statValue}>{stat.value}</dd>
          <dt className={styles.statLabel}>{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function Panel({
  title,
  meta,
  children,
  grid = false,
  className,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  /** Draw the faint measurement grid behind the panel. */
  grid?: boolean;
  className?: string;
}) {
  return (
    <div className={`${styles.panel} ${className ?? ""}`}>
      {grid && <span aria-hidden="true" className={styles.panelGrid} />}
      {(title || meta) && (
        <div className={styles.panelHead}>
          {title && <span className={styles.label}>{title}</span>}
          {meta && <span className={`${styles.label} ml-auto`}>{meta}</span>}
        </div>
      )}
      <div className={styles.panelBody}>{children}</div>
    </div>
  );
}

/** A titled column of derived items — signals, capabilities, outputs. */
export function ResultColumn({
  title,
  count,
  items,
  tone = "accent",
  empty = "Nothing documented for this combination.",
}: {
  title: string;
  count?: number;
  items: string[];
  tone?: "accent" | "mute" | "amber";
  empty?: string;
}) {
  const dotTone =
    tone === "mute" ? styles.dotMute : tone === "amber" ? styles.dotAmber : "";

  return (
    <div className={styles.column}>
      <div className={styles.columnHead}>
        <span className={styles.label}>{title}</span>
        {typeof count === "number" && (
          <span className={styles.label}>
            {String(count).padStart(2, "0")}
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <p className={`${styles.note} mt-3`}>{empty}</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item} className={styles.item}>
              <span aria-hidden="true" className={`${styles.dot} ${dotTone}`} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResultColumns({
  count = 4,
  children,
}: {
  count?: 2 | 3 | 4;
  children: ReactNode;
}) {
  const cols =
    count === 2
      ? styles.columns2
      : count === 3
        ? styles.columns3
        : `${styles.columns3} ${styles.columns4}`;
  return <div className={`${styles.columns} ${cols}`}>{children}</div>;
}

export function StepHeader({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <div className={styles.step}>
        <span className={styles.stepIndex}>{index}</span>
        <span className={styles.stepTitle}>{title}</span>
      </div>
      {hint && <p className={`${styles.note} mt-1.5`}>{hint}</p>}
    </div>
  );
}
