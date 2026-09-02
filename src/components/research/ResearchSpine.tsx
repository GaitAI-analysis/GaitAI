import styles from "./research.module.css";

/**
 * The connector between the research-record column and the capability column.
 *
 * What it replaces: a set of bezier curves fanned from a single midpoint into
 * N endpoints, drawn inside `preserveAspectRatio="none"`. That last part was
 * the real problem — the viewBox stretched to whatever height the row
 * happened to be, so the curves sheared differently on every area and read as
 * arbitrary decoration rather than a deliberate line.
 *
 * What this is instead: a signal bus. One vertical rail carrying a slow
 * carrier dot, with one tap per capability — a node on the rail and a short
 * lead out to the card it belongs to. Built from CSS boxes, so nothing
 * distorts at any height and the hairlines stay crisp.
 *
 * It is also wired to the interaction rather than sitting beside it: the tap
 * for the selected capability lights up and the others dim, so the diagram
 * responds to the same state the cards do. Taps are evenly spaced, which is
 * honest — the graph maps research *areas* to capabilities, not individual
 * records to capabilities, so there is no per-record position to encode.
 *
 * Presentational only, and marked aria-hidden: the relationship it draws is
 * already stated in the headings and card content either side of it.
 */
export function ResearchSpine({
  count,
  activeIndex,
}: {
  /** One tap per capability. */
  count: number;
  /** Index of the selected capability, or null when none is selected. */
  activeIndex: number | null;
}) {
  if (count <= 0) return null;

  // Inset from the ends so the first and last taps sit on the lit part of the
  // rail rather than in its fade-out.
  const positions = Array.from(
    { length: count },
    (_, i) => 14 + ((i + 0.5) / count) * 72,
  );

  return (
    <div aria-hidden="true" className={styles.spine}>
      <span className={styles.spineRail} />
      <span className={styles.spineEntry} style={{ top: "14%" }} />
      <span className={styles.spinePulse} />

      {positions.map((top, i) => {
        const isActive = activeIndex === i;
        const isDimmed = activeIndex !== null && !isActive;

        return (
          <span key={i}>
            <span
              className={[
                styles.spineTap,
                isActive ? styles.spineTapActive : "",
                isDimmed ? styles.spineTapDimmed : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ top: `${top}%` }}
            />
            <span
              className={[
                styles.spineNode,
                isActive ? styles.spineNodeActive : "",
                isDimmed ? styles.spineTapDimmed : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ top: `${top}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** Stacked-layout counterpart: a short vertical lead-in between sections. */
export function ResearchSpineStacked() {
  return <div aria-hidden="true" className={styles.spineStacked} />;
}
