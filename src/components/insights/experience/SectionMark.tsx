import styles from "./experience.module.css";

export type SectionMotif = "wave" | "branch" | "trace" | "markers" | "streams";

/**
 * THE SECTION MARK — the small movement-inspired rule under a section title.
 *
 * It replaces a plain gradient hairline with a drawing that belongs to the
 * article's argument, one motif per essay:
 *
 *   wave      one gait cycle as a waveform          (video → intelligence)
 *   branch    a line dividing into readings          (more than a biometric)
 *   trace     a stroke fading to sample points       (without identification)
 *   markers   temporal markers along a rule          (a trend, not a number)
 *   streams   lines converging into one              (fusion)
 *
 * A server component: no JavaScript, no state. Where the browser supports
 * scroll-driven animation the stroke draws itself as the heading enters the
 * viewport; everywhere else, and under reduced motion, it is simply complete.
 */
export function SectionMark({ motif, index = 0 }: { motif: SectionMotif; index?: number }) {
  /* Slight variation between sections of the same article, so the marks read
     as a family rather than a stamp. Deterministic. */
  const v = index % 3;

  return (
    <svg
      aria-hidden="true"
      className={`${styles.root} ${styles.mark}`}
      viewBox="0 0 160 18"
      preserveAspectRatio="none"
    >
      {motif === "wave" && (
        <>
          <path
            className={`${styles.markLine} ${styles.markLineSoft}`}
            d="M0 9 H160"
          />
          <path
            pathLength={1}
            className={`${styles.markLine} ${styles.markDraw}`}
            d={
              v === 0
                ? "M0 9 C10 9 14 3 22 3 S34 15 42 15 S54 3 62 3 S74 15 82 15 S94 3 102 3 S114 15 122 15 S134 3 142 3 S154 9 160 9"
                : v === 1
                  ? "M0 9 C14 9 18 4 26 4 S38 14 46 14 S58 4 66 4 S78 14 86 14 S98 4 106 4 S118 14 126 14 S150 9 160 9"
                  : "M0 9 C8 9 12 2 20 2 S32 16 40 16 S52 2 60 2 S72 16 80 16 S92 2 100 2 S112 16 120 16 S142 9 160 9"
            }
          />
          <circle className={styles.markDot} cx={v === 0 ? 42 : v === 1 ? 46 : 40} cy={v === 2 ? 16 : 15} r={1.6} />
        </>
      )}

      {motif === "branch" && (
        <>
          <path className={`${styles.markLine} ${styles.markDraw}`} pathLength={1} d="M0 9 H70" />
          <path
            className={`${styles.markLine} ${styles.markLineSoft} ${styles.markDraw}`}
            pathLength={1}
            d="M70 9 C90 9 100 3 120 3 H160"
          />
          <path
            className={`${styles.markLine} ${styles.markLineSoft} ${styles.markDraw}`}
            pathLength={1}
            d="M70 9 C90 9 100 15 120 15 H160"
          />
          <path
            className={`${styles.markLine} ${styles.markViolet} ${styles.markDraw}`}
            pathLength={1}
            d={v === 0 ? "M70 9 H160" : v === 1 ? "M70 9 C90 9 100 3 120 3 H160" : "M70 9 C90 9 100 15 120 15 H160"}
          />
          <circle className={styles.markDot} cx={70} cy={9} r={2} />
        </>
      )}

      {motif === "trace" && (
        <>
          <path
            className={`${styles.markLine} ${styles.markViolet} ${styles.markDraw}`}
            pathLength={1}
            d="M0 12 C20 4 30 4 48 9 S70 14 84 9"
          />
          {[96, 110, 124, 138, 152].map((x, i) => (
            <circle
              key={x}
              className={i < 2 ? styles.markDot : styles.markDotSoft}
              cx={x}
              cy={9 + (i % 2 === 0 ? -2 : 2) * (v === 2 ? 1.5 : 1)}
              r={i < 2 ? 1.8 : 1.3}
            />
          ))}
        </>
      )}

      {motif === "markers" && (
        <>
          <path className={`${styles.markLine} ${styles.markLineSoft}`} d="M0 9 H160" />
          <path
            className={`${styles.markLine} ${styles.markTeal} ${styles.markDraw}`}
            pathLength={1}
            d={
              v === 0
                ? "M0 9 L32 8 L64 10 L96 7 L128 11 L160 13"
                : v === 1
                  ? "M0 9 L32 10 L64 8 L96 11 L128 9 L160 12"
                  : "M0 9 L32 9 L64 7 L96 10 L128 12 L160 14"
            }
          />
          {[0, 32, 64, 96, 128, 160].map((x, i) => (
            <line
              key={x}
              className={`${styles.markLine} ${styles.markLineSoft}`}
              x1={x}
              y1={i === 5 ? 3 : 5}
              x2={x}
              y2={i === 5 ? 15 : 13}
            />
          ))}
          <circle className={styles.markDot} cx={160} cy={v === 0 ? 13 : v === 1 ? 12 : 14} r={2} />
        </>
      )}

      {motif === "streams" && (
        <>
          <path
            className={`${styles.markLine} ${styles.markLineSoft} ${styles.markDraw}`}
            pathLength={1}
            d="M0 2 C40 2 60 9 90 9"
          />
          <path
            className={`${styles.markLine} ${styles.markLineSoft} ${styles.markDraw}`}
            pathLength={1}
            d="M0 16 C40 16 60 9 90 9"
          />
          <path
            className={`${styles.markLine} ${v === 1 ? styles.markGold : styles.markLineSoft} ${styles.markDraw}`}
            pathLength={1}
            d="M0 9 H90"
            strokeDasharray={v === 2 ? "3 3" : undefined}
          />
          <path
            className={`${styles.markLine} ${styles.markDraw}`}
            pathLength={1}
            d="M90 9 H160"
          />
          <circle className={styles.markDot} cx={90} cy={9} r={2} />
        </>
      )}
    </svg>
  );
}
