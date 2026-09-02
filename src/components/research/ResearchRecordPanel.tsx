import styles from "./research.module.css";

export type RecordCell = {
  /** Display value, e.g. "8" or "10+ yrs". */
  value: string;
  label: string;
  /**
   * Lit segments — the actual count this cell represents. Nothing is scaled
   * or expressed as a share of an invented target, so the bar reads as a
   * tally. Values above the segment count simply fill it.
   */
  lit: number;
  tone: "cyan" | "royal" | "violet" | "emerald";
};

const SEGMENTS = 10;

/** Brand tokens, so both themes follow without a second palette here. */
const TONE: Record<RecordCell["tone"], string> = {
  cyan: "var(--cyan)",
  royal: "var(--royal)",
  violet: "var(--violet)",
  emerald: "#10b981",
};

/**
 * The published record as one wide glass instrument face.
 *
 * Replaces a four-cell bordered strip of plain numbers. The panel is built
 * from layered translucent surfaces with a rim light along the top edge and
 * hairline dividers between cells, and each cell carries a segment bar whose
 * lit count is the figure itself — eight segments for eight papers, one for
 * the granted patent. A reader can check the bar against the numeral.
 *
 * Server component: all motion and layering is CSS in research.module.css.
 */
export function ResearchRecordPanel({ cells }: { cells: RecordCell[] }) {
  return (
    <div className={styles.panel}>
      <div className={styles.recordGrid}>
        {cells.map((cell) => {
          const lit = Math.max(0, Math.min(SEGMENTS, cell.lit));

          return (
            <div
              key={cell.label}
              className={styles.recordCell}
              style={{ ["--accent" as string]: TONE[cell.tone] }}
            >
              <div
                className={`${styles.recordValue} font-display text-[2.125rem] font-semibold leading-none sm:text-[2.5rem]`}
              >
                {cell.value}
              </div>
              <div
                className={`${styles.recordLabel} mt-2.5 text-[11px] font-medium uppercase tracking-[0.16em]`}
              >
                {cell.label}
              </div>
              <div aria-hidden="true" className={styles.segments}>
                {Array.from({ length: SEGMENTS }, (_, i) => (
                  <span
                    key={i}
                    className={`${styles.segment} ${
                      i < lit ? styles.segmentLit : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
