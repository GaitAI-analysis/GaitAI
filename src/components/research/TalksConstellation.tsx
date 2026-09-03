import { talkRecords, talkSpan } from "@/data/talks";
import styles from "./talks.module.css";

/**
 * THE ACTIVITY CONSTELLATION — the record itself, drawn as one faint line.
 *
 * Not generated art and not a stock abstract network: every mark on this line
 * is a real record, positioned by its own year. Where three papers land in one
 * year the marks cluster; where four years pass with nothing the line runs
 * empty. So the shape a visitor sees behind the headline is the actual density
 * of the record, and it cannot drift from it — add a talk and a node appears.
 *
 * Decorative for assistive technology (`aria-hidden`), because the same
 * information is stated in words immediately below it and read properly in the
 * timeline underneath. Static: no animation, nothing to pause, nothing that
 * needs a reduced-motion branch.
 *
 * A `viewBox` with `preserveAspectRatio="none"` lets the line stretch to any
 * width; `vector-effect="non-scaling-stroke"` keeps the hairline a hairline
 * through that stretch, and the nodes are circles sized in user units so they
 * stay round.
 */

const VIEW_W = 1000;
const VIEW_H = 64;
const BASE_Y = 40;

/** Year → x, across the full span of the record. */
const xFor = (year: number) => {
  const span = talkSpan.to - talkSpan.from || 1;
  /* Inset so the first and last nodes are not clipped by the viewBox edge. */
  return 12 + ((year - talkSpan.from) / span) * (VIEW_W - 24);
};

/** One entry per year that has records, with how many landed in it. */
const activity = (() => {
  const byYear = new Map<number, number>();
  for (const t of talkRecords) byYear.set(t.year, (byYear.get(t.year) ?? 0) + 1);
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, count]) => ({ year, count, x: xFor(year) }));
})();

/** The years printed under the line — first, last, and the busiest between. */
const labelled = (() => {
  const busiest = [...activity].sort((a, b) => b.count - a.count)[0];
  const picks = new Set([activity[0], activity[activity.length - 1], busiest]);
  return [...picks].sort((a, b) => a.year - b.year);
})();

export function TalksConstellation() {
  return (
    <svg
      aria-hidden="true"
      className={styles.constellation}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      role="presentation"
    >
      <defs>
        {/* Stop colours come from CSS classes, not from `stopColor="var(…)"`.
            A custom property in a presentation attribute does not resolve
            here, and the whole line rendered invisible — only the nodes, which
            are filled from a stylesheet rule, showed up. */}
        <linearGradient
          id="talks-constellation"
          /* USER SPACE, not the default objectBoundingBox. Every stroked
             element here is a straight line, so its bounding box has zero
             height (the baseline) or zero width (the ticks) — and a gradient
             in bounding-box units on a degenerate box paints nothing. That is
             why the nodes rendered and not one line of the constellation. In
             user space the ramp is defined once across the viewBox and every
             element samples the same one, which is also what makes the colour
             read as one continuous run of time. */
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2={VIEW_W}
          y2="0"
        >
          <stop offset="0%" className={styles.stopViolet} />
          <stop offset="55%" className={styles.stopBlue} />
          <stop offset="100%" className={styles.stopCyan} />
        </linearGradient>
      </defs>

      <line
        x1="0"
        y1={BASE_Y}
        x2={VIEW_W}
        y2={BASE_Y}
        stroke="url(#talks-constellation)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {activity.map((point) => (
        <g key={point.year}>
          {/* A year with more records gets a taller tick, so density reads
              without a legend and without inventing a value. */}
          <line
            x1={point.x}
            y1={BASE_Y}
            x2={point.x}
            y2={BASE_Y - 6 - point.count * 4}
            stroke="url(#talks-constellation)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={point.x}
            cy={BASE_Y - 6 - point.count * 4}
            r="2.5"
            className={styles.constellationNode}
          />
        </g>
      ))}

      {labelled.map((point) => (
        <text
          key={point.year}
          x={point.x}
          y={BASE_Y + 16}
          textAnchor="middle"
          className={styles.constellationYear}
        >
          {point.year}
        </text>
      ))}
    </svg>
  );
}
