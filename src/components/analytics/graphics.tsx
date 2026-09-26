import { GAIT_HEAD, GAIT_NECK, GAIT_PHASES, type Pt } from "@/components/visuals/gait-phases";
import styles from "./analytics.module.css";

/**
 * The analytical graphics kit: SignalMetric, MiniTrendChart,
 * FeatureDistribution, GaitCycleTimeline, TrajectoryCanvas, RiskIndicator.
 *
 * Every one of them is SVG or CSS — no chart library, nothing to defer, and
 * they render identically on the server and the client because none of them
 * uses randomness. Where a shape is needed, it is generated from a
 * deterministic function of its inputs, so a screenshot taken twice is the
 * same screenshot.
 *
 * THE RULE THESE COMPONENTS ENFORCE
 * Any component that can display a number takes an `illustrative` flag, and when
 * it is set the number is rendered with its own caption saying so. The lab is
 * a technology demonstration: none of its readings come from a real capture,
 * a real person or a real deployment, and a convincing dashboard without that
 * label would be a fabricated result. Components used for repository-derived
 * *counts* (how many modules, how many papers) never set it, because those
 * are facts.
 */

// ============================================================================
// SignalMetric — one reading, with its unit, note and optional shape
// ============================================================================

export function SignalMetric({
  label,
  value,
  unit,
  note,
  illustrative = false,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  /** Set for any illustrative reading. Renders the example-value caption. */
  illustrative?: boolean;
  /** An optional sparkline or distribution under the value. */
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <p className={styles.metricValue}>
        {value}
        {unit && <span className={styles.metricUnit}>{unit}</span>}
      </p>
      {children}
      {note && <p className={styles.metricNote}>{note}</p>}
      {illustrative && (
        <p className={styles.metricNote}>Example value</p>
      )}
    </div>
  );
}

// ============================================================================
// MiniTrendChart — a sequence's shape, with no axis values
// ============================================================================

/** Catmull-Rom → cubic Bézier, so a short series reads as a smooth trace. */
function smooth(points: Pt[]): string {
  if (points.length < 2) return "";
  const d: string[] = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d.push(
      `C ${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`,
    );
  }
  return d.join(" ");
}

const r = (n: number) => Math.round(n * 100) / 100;

export function MiniTrendChart({
  series,
  width = 160,
  height = 40,
  fill = false,
  tone = "accent",
  baseline = false,
  summary,
}: {
  /** Values in any range — normalised internally. */
  series: number[];
  width?: number;
  height?: number;
  fill?: boolean;
  tone?: "accent" | "amber" | "mute";
  /** Draw a dashed line at the first value — "change from baseline". */
  baseline?: boolean;
  /** Sentence read by a screen reader in place of the shape. */
  summary?: string;
}) {
  if (series.length < 2) return null;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const step = width / (series.length - 1);
  const pad = 4;
  const points: Pt[] = series.map((value, i) => [
    r(i * step),
    r(pad + (1 - (value - min) / span) * (height - pad * 2)),
  ]);
  const path = smooth(points);

  const traceTone =
    tone === "amber"
      ? `${styles.gTrace} ${styles.gTraceAmber}`
      : tone === "mute"
        ? styles.gTraceMute
        : styles.gTrace;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={styles.metricChart}
      role={summary ? "img" : undefined}
      aria-label={summary}
      aria-hidden={summary ? undefined : true}
    >
      {baseline && (
        <line
          className={styles.gDash}
          x1={0}
          y1={points[0][1]}
          x2={width}
          y2={points[0][1]}
        />
      )}
      {fill && (
        <path
          className={styles.gFill}
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
        />
      )}
      <path className={traceTone} d={path} />
      <circle
        className={tone === "amber" ? styles.gDotAmber : styles.gDot}
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={2.2}
      />
    </svg>
  );
}

// ============================================================================
// FeatureDistribution — where a value sits in a spread of observations
// ============================================================================

export function FeatureDistribution({
  bins,
  markerIndex,
  summary,
}: {
  /** Relative bar heights, 0–1. */
  bins: number[];
  /** Which bin the current reading falls in. */
  markerIndex: number;
  summary?: string;
}) {
  return (
    <div
      className={styles.dist}
      role={summary ? "img" : undefined}
      aria-label={summary}
      aria-hidden={summary ? undefined : true}
    >
      {bins.map((height, i) => (
        <span
          key={i}
          className={`${styles.distBar} ${
            i === markerIndex ? styles.distBarOn : ""
          }`}
          style={{ height: `${Math.max(6, height * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// GaitCycleTimeline — the five canonical events of one stride
// ============================================================================

const PHASE_LABELS = ["Heel strike", "Loading", "Mid-stance", "Toe-off", "Swing"];

function Figure({ index, scale }: { index: number; scale: number }) {
  const phase = GAIT_PHASES[index];
  const pts = (list: readonly Pt[]) =>
    list.map(([x, y]) => `${r(x * scale)},${r(y * scale)}`).join(" ");
  const hip = phase.nearLeg[0];
  const spine = `M ${r(GAIT_NECK[0] * scale)} ${r(GAIT_NECK[1] * scale)} L ${r(
    hip[0] * scale,
  )} ${r(hip[1] * scale)}`;

  return (
    <g>
      {/* Far side first, dimmer, so the near limbs read in front. */}
      <polyline className={`${styles.gBone} ${styles.gBoneMute}`} points={pts(phase.farArm)} />
      <polyline className={`${styles.gBone} ${styles.gBoneMute}`} points={pts(phase.farLeg)} />
      <polyline className={`${styles.gBone} ${styles.gBoneMute}`} points={pts(phase.farFoot)} />
      <path className={styles.gBone} d={spine} />
      <circle
        className={styles.gNode}
        cx={r(GAIT_HEAD[0] * scale)}
        cy={r(GAIT_HEAD[1] * scale)}
        r={r(3.1 * scale)}
      />
      <polyline className={styles.gBone} points={pts(phase.nearArm)} />
      <polyline className={styles.gBone} points={pts(phase.nearLeg)} />
      <polyline className={styles.gBone} points={pts(phase.nearFoot)} />
      {[phase.nearLeg[0], phase.nearLeg[1], phase.nearLeg[2]].map(([jx, jy], i) => (
        <circle key={i} className={styles.gJoint} cx={r(jx * scale)} cy={r(jy * scale)} r={r(1.6 * scale)} />
      ))}
    </g>
  );
}

export function GaitCycleTimeline({
  activeIndex,
  onSelect,
}: {
  /** Which event is lit; the others are drawn at reduced opacity. */
  activeIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const scale = 1.5;
  const width = 560;
  const height = 190;
  const groundY = 150;
  const step = width / 5;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} aria-hidden="true">
        <line className={styles.gDash} x1={16} y1={groundY + 1} x2={width - 16} y2={groundY + 1} />
        {/* Stance spans the first four events, swing the last — the split the
            temporal features are computed over. */}
        <line className={styles.gLine} x1={step * 0.5} y1={groundY + 20} x2={step * 3.5} y2={groundY + 20} />
        <line className={styles.gTraceMute} x1={step * 3.5} y1={groundY + 20} x2={step * 4.5} y2={groundY + 20} />
        <text className={styles.gText} x={step * 2} y={groundY + 36} textAnchor="middle">
          Stance
        </text>
        <text className={styles.gText} x={step * 4} y={groundY + 36} textAnchor="middle">
          Swing
        </text>

        {GAIT_PHASES.map((phase, i) => {
          const x = step * (i + 0.5);
          const on = activeIndex === undefined || activeIndex === i;
          return (
            <g key={i} opacity={on ? 1 : 0.32}>
              <g transform={`translate(${r(x - 22)} ${r(groundY - 74 + phase.lift * scale)})`}>
                <Figure index={i} scale={scale} />
              </g>
              <line className={styles.gDash} x1={x} y1={groundY + 4} x2={x} y2={groundY + 14} />
              <text
                className={`${styles.gText} ${on ? styles.gTextInk : ""}`}
                x={x}
                y={24}
                textAnchor="middle"
              >
                {String(i + 1).padStart(2, "0")}
              </text>
            </g>
          );
        })}
      </svg>

      {/* The events as real buttons under the drawing, so the timeline is
          operable without hovering an SVG group.

          The hint earns its place: a row of five numbered event names under a
          stick-figure drawing gives a reader no reason to think the drawing
          answers to it. One line, once, above the controls — and only when
          the timeline is actually operable, because a call site that passes no
          `onSelect` renders it as a read-only drawing. */}
      {onSelect && (
        <p className="ix-hint mb-2 mt-1">Select an event to hold the stride there</p>
      )}
      <div className={styles.chips}>
        {PHASE_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled={!onSelect}
            aria-pressed={activeIndex === i}
            onClick={() => onSelect?.(i)}
            className={`${styles.chip} ${activeIndex === i ? styles.chipOn : ""}`}
          >
            {String(i + 1).padStart(2, "0")} {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TrajectoryCanvas — paths, zones and density over a plan view
// ============================================================================

export interface TrajectoryPath {
  id: string;
  /** Plan-view points in a 0–100 space. */
  points: Pt[];
  /** Marks a path as the one a candidate event was surfaced from. */
  candidate?: boolean;
}

export interface TrajectoryZone {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function TrajectoryCanvas({
  paths,
  zones,
  layers,
  summary,
}: {
  paths: TrajectoryPath[];
  zones: TrajectoryZone[];
  layers: {
    trajectories: boolean;
    density: boolean;
    flow: boolean;
    zones: boolean;
    candidates: boolean;
    privacy: boolean;
  };
  summary: string;
}) {
  /**
   * A 560 × 320 coordinate space rather than a 0–100 one, so the shared 8px
   * label size lands at the right scale — in a 100-unit viewBox the same CSS
   * rule renders zone names the height of the plan view.
   */
  const W = 560;
  const H = 320;
  const sx = (x: number) => r((x / 100) * W);
  const sy = (y: number) => r((y / 100) * H);

  /**
   * Density is drawn as translucent cells over a coarse grid, weighted by how
   * many path points fall in each. It counts the drawn paths — a property of
   * this illustration, not a measurement of a real space.
   */
  const cols = 14;
  const rows = 8;
  const cells = (() => {
    const grid = new Array(cols * rows).fill(0);
    for (const path of paths) {
      for (const [x, y] of path.points) {
        const cx = Math.min(cols - 1, Math.max(0, Math.floor((x / 100) * cols)));
        const cy = Math.min(rows - 1, Math.max(0, Math.floor((y / 100) * rows)));
        grid[cy * cols + cx] += 1;
      }
    }
    const max = Math.max(1, ...grid);
    return grid.map((count, i) => ({
      x: (i % cols) * (W / cols),
      y: Math.floor(i / cols) * (H / rows),
      weight: count / max,
    }));
  })();

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={styles.svg}
      role="img"
      aria-label={summary}
    >
      {/* Plan-view grid: the space, not a sci-fi backdrop. */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <line
          key={`v${i}`}
          className={styles.gGrid}
          x1={r((i * W) / cols)}
          y1={0}
          x2={r((i * W) / cols)}
          y2={H}
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <line
          key={`h${i}`}
          className={styles.gGrid}
          x1={0}
          y1={r((i * H) / rows)}
          x2={W}
          y2={r((i * H) / rows)}
        />
      ))}

      {layers.density &&
        cells
          .filter((cell) => cell.weight > 0.08)
          .map((cell, i) => (
            <rect
              key={`d${i}`}
              className={styles.gDensity}
              x={r(cell.x)}
              y={r(cell.y)}
              width={r(W / cols)}
              height={r(H / rows)}
              fill="currentColor"
              opacity={r(0.05 + cell.weight * 0.2)}
            />
          ))}

      {layers.zones &&
        zones.map((zone) => (
          <g key={zone.id}>
            <rect
              className={styles.gZone}
              x={sx(zone.x)}
              y={sy(zone.y)}
              width={sx(zone.w)}
              height={sy(zone.h)}
              rx={3}
            />
            <text
              className={styles.gText}
              x={sx(zone.x) + 6}
              y={sy(zone.y) + 14}
            >
              {zone.label}
            </text>
          </g>
        ))}

      {layers.trajectories &&
        paths.map((path) => {
          const scaled: Pt[] = path.points.map(([x, y]) => [sx(x), sy(y)]);
          const isCandidate = path.candidate && layers.candidates;
          return (
            <path
              key={path.id}
              className={
                isCandidate
                  ? `${styles.gTrace} ${styles.gTraceAmber}`
                  : styles.gTrace
              }
              strokeWidth={isCandidate ? 1.6 : 1}
              opacity={layers.privacy ? 0.6 : 0.92}
              d={smooth(scaled)}
            />
          );
        })}

      {/* Flow direction: one arrow head per path, on its last segment. */}
      {layers.flow &&
        paths.map((path) => {
          const pts = path.points;
          const [x1, y1] = pts[pts.length - 2];
          const [x2, y2] = pts[pts.length - 1];
          const angle =
            (Math.atan2(sy(y2) - sy(y1), sx(x2) - sx(x1)) * 180) / Math.PI;
          return (
            <g
              key={`f${path.id}`}
              transform={`translate(${sx(x2)} ${sy(y2)}) rotate(${r(angle)})`}
            >
              <path className={styles.gTrace} d="M -7 -4 L 0 0 L -7 4" />
            </g>
          );
        })}

      {/* Candidate events sit on the path they were surfaced from. */}
      {layers.candidates &&
        paths
          .filter((path) => path.candidate)
          .map((path) => {
            const mid = path.points[Math.floor(path.points.length / 2)];
            return (
              <circle
                key={`c${path.id}`}
                className={styles.gDotAmber}
                cx={sx(mid[0])}
                cy={sy(mid[1])}
                r={3.4}
              />
            );
          })}
    </svg>
  );
}

// ============================================================================
// RiskIndicator — three bands, one lit, and never a number
// ============================================================================

export function RiskIndicator({
  level,
  label,
  note,
}: {
  level: "low" | "medium" | "high";
  label: string;
  note?: string;
}) {
  const index = level === "low" ? 0 : level === "medium" ? 1 : 2;
  const tone =
    level === "low"
      ? styles.riskBandOn
      : level === "medium"
        ? styles.riskBandOnMid
        : styles.riskBandOnHigh;

  return (
    <div className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <p className={`${styles.metricValue} capitalize`}>{level}</p>
      <div className={`${styles.risk} mt-2.5`} role="img" aria-label={`${label}: ${level}`}>
        {[0, 1, 2].map((band) => (
          <span
            key={band}
            className={`${styles.riskBand} ${band === index ? tone : ""}`}
          />
        ))}
      </div>
      {note && <p className={styles.metricNote}>{note}</p>}
    </div>
  );
}
