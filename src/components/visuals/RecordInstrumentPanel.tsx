import type { CSSProperties } from "react";

/**
 * The published record as an illuminated instrument panel.
 *
 * Each cell carries a twelve-segment dial whose lit segments ARE the count —
 * eight lit segments for eight papers, one for the granted patent. Nothing is
 * scaled, normalised or expressed as a percentage of an invented target, so
 * the dial can be read literally: it is a tally, drawn round.
 *
 * The panel itself is built from layered translucent surfaces — a rim light
 * along the top edge, a slow highlight sweeping across the face, hairline
 * dividers between cells — rather than a border and four numbers.
 */

export type RecordMetric = {
  /** Display value, e.g. "8" or "10+ yrs". */
  value: string;
  label: string;
  /** Lit segments — the actual count this metric represents (0–12). */
  lit: number;
  /** Accent per cell. */
  tone: "cyan" | "royal" | "violet" | "emerald";
};

const SEGMENTS = 12;
/** Gauge sweep: 240°, opening at the bottom. */
const START = 150;
const SWEEP = 240;

const TONE_CLASS: Record<RecordMetric["tone"], string> = {
  cyan: "res-dial res-dial--cyan",
  royal: "res-dial res-dial--royal",
  violet: "res-dial res-dial--violet",
  emerald: "res-dial res-dial--emerald",
};

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const rad = (deg * Math.PI) / 180;
  return [
    Math.round((cx + r * Math.cos(rad)) * 100) / 100,
    Math.round((cy + r * Math.sin(rad)) * 100) / 100,
  ];
};

/** Arc between two angles on a circle, drawn clockwise. */
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [sx, sy] = polar(cx, cy, r, from);
  const [ex, ey] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M${sx} ${sy}A${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

function Dial({ metric }: { metric: RecordMetric }) {
  const cx = 50;
  const cy = 50;
  const r = 37;
  const lit = Math.max(0, Math.min(SEGMENTS, metric.lit));

  return (
    <svg viewBox="0 0 100 100" className={TONE_CLASS[metric.tone]} aria-hidden="true">
      {/* Layered translucent face */}
      <circle className="res-dial-face" cx={cx} cy={cy} r={r - 7} />
      <circle className="res-dial-inner" cx={cx} cy={cy} r={r - 15} />

      {/* Full travel, then the lit share of it */}
      <path className="res-dial-track" d={arc(cx, cy, r, START, START + SWEEP)} />
      {lit > 0 && (
        <path
          className="res-dial-live"
          d={arc(cx, cy, r, START, START + (SWEEP * lit) / SEGMENTS)}
          pathLength={100}
        />
      )}

      {/* Twelve segments; the first `lit` of them are illuminated */}
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const deg = START + ((i + 0.5) * SWEEP) / SEGMENTS;
        const [x1, y1] = polar(cx, cy, r - 5.5, deg);
        const [x2, y2] = polar(cx, cy, r + 3, deg);
        return (
          <line
            key={i}
            className={i < lit ? "res-dial-seg res-dial-seg--lit" : "res-dial-seg"}
            style={{ "--res-i": i } as CSSProperties}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          />
        );
      })}

      {/* Needle to the last lit segment — the reading, drawn */}
      {lit > 0 &&
        (() => {
          const deg = START + ((lit - 0.5) * SWEEP) / SEGMENTS;
          const [nx, ny] = polar(cx, cy, r - 9, deg);
          return (
            <>
              <line className="res-dial-needle" x1={cx} y1={cy} x2={nx} y2={ny} />
              <circle className="res-dial-hub" cx={cx} cy={cy} r={2.4} />
            </>
          );
        })()}
    </svg>
  );
}

export function RecordInstrumentPanel({
  metrics,
  caption,
}: {
  metrics: readonly RecordMetric[];
  caption?: string;
}) {
  return (
    <figure className="res-panel">
      <span aria-hidden="true" className="res-panel-rim" />
      <span aria-hidden="true" className="res-panel-sweep" />
      <span aria-hidden="true" className="res-panel-grid-lines" />

      <div className="res-panel-cells">
        {metrics.map((metric, i) => (
          <div
            key={metric.label}
            className="res-cell"
            style={{ "--res-i": i } as CSSProperties}
          >
            <div className="res-cell-dial">
              <Dial metric={metric} />
              <span
                className={
                  metric.value.length > 3
                    ? "res-cell-value res-cell-value--wide stat-num"
                    : "res-cell-value stat-num"
                }
              >
                {metric.value}
              </span>
            </div>
            <div className="res-cell-label">{metric.label}</div>
          </div>
        ))}
      </div>

      {caption && <figcaption className="res-panel-caption">{caption}</figcaption>}
    </figure>
  );
}
