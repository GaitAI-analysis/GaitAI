"use client";

import type { HeroOption } from "@/data/home-hero";
import { SPARK_POINTS, type Reading } from "./useHeroTelemetry";
import styles from "./heropanels.module.css";

/**
 * THE INSIDE OF A HERO PANEL — a telemetry read-out, not a specification.
 * =============================================================================
 * A parameter row is three things stacked, never a two-column table: the label
 * in small cool grey, the reading in deep navy, and — where the metric has a
 * scale — a hairline track under both. The eye reads down the labels, and the
 * tracks give the panel its second, quieter rhythm.
 *
 * NO ICONS, anywhere in here, by instruction and because they would be the
 * only cartoon element on an otherwise photographic hero. What marks a row as
 * important is type and a warm-gold rule, not a glyph.
 *
 * ── THE PALETTE IS DELIBERATELY NARROW ────────────────────────────────────
 * Deep navy, muted slate blue, off-white, cool grey, warm gold. No electric
 * blue, no neon, no saturated cyan: the picture behind these panels already
 * carries the only blue light in the composition, and a second one competing
 * with it is what made earlier passes look like a gaming overlay. Every colour
 * here is a token in heropanels.module.css; none is written inline.
 *
 * ── THE NUMBER ROLL ───────────────────────────────────────────────────────
 * `key={reading.text}` is load-bearing. React tears down the old figure and
 * mounts a new one whenever the printed value changes, which restarts the
 * `roll` animation — so a change reads as the new value arriving from below
 * rather than the old one being overwritten in place. Rows whose value has
 * not changed this tick do not animate at all, which is what keeps six rows
 * moving independently from looking like a flicker.
 *
 * ── THE SPARKLINE ─────────────────────────────────────────────────────────
 * A polyline over the metric's own remembered samples, normalised 0–1 by the
 * hook. It is drawn in a fixed 0–1 viewBox and stretched by CSS, so it costs
 * no layout maths and no resize listener. `vector-effect` keeps the stroke a
 * true hairline through that stretch. It is decorative: the number beside it
 * is the accessible value, so the SVG is hidden from assistive technology.
 */

function Spark({ points }: { points: readonly number[] }) {
  if (points.length < 2) return <span className={styles.sparkHold} />;
  /* Oldest sample at the left; y is inverted because SVG grows downward. */
  const d = points
    .map((v, i) => `${i / (SPARK_POINTS - 1)},${1 - v}`)
    .join(" ");
  return (
    <svg
      className={styles.spark}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={d} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * SecureVision's live preview: an abstract plan view of people crossing a
 * concourse. Six marks on two lanes, each drifting at its own pace, fading in
 * and out at the edges so nothing pops. It is not a diagram of anything — it
 * is the movement itself, which is what the panel is measuring, and it is the
 * one thing that makes the security panel visibly busier than the clinical one
 * without adding a single icon.
 */
function FlowPreview() {
  return (
    <div className={styles.preview} aria-hidden="true">
      <span className={styles.previewLane} data-lane="near" />
      <span className={styles.previewLane} data-lane="far" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={styles.walker} data-walker={i} />
      ))}
    </div>
  );
}

export function HeroPanelBody({
  option,
  readings,
}: {
  option: HeroOption;
  readings: readonly Reading[];
}) {
  const layer = option.tier === "layer";
  return (
    <>
      {option.id === "securevision" ? <FlowPreview /> : null}
      <dl className={styles.metrics} data-layer={layer ? "true" : undefined}>
        {option.metrics.map((metric, i) => {
          const reading = readings[i];
          if (!reading) return null;
          return (
            <div
              key={metric.label}
              className={styles.metric}
              data-gold={reading.gold ? "true" : undefined}
              data-fixed={reading.fixed ? "true" : undefined}
            >
              <dt className={styles.label}>{metric.label}</dt>
              <dd className={styles.value}>
                <span className={styles.figure}>
                  {/* Remounts on change — see the header note on the roll.
                      The unit is a rank below the figure: it is the same word
                      on every tick, so giving it the figure's weight made the
                      number harder to find and, at "11 people/min", pushed the
                      row onto a second line. */}
                  <span key={reading.text} className={styles.roll}>
                    {reading.figure}
                    {reading.unit ? (
                      <span
                        className={styles.unit}
                        data-tight={reading.unit === "%" ? "true" : undefined}
                      >
                        {reading.unit}
                      </span>
                    ) : null}
                  </span>
                </span>
                {reading.spark.length > 0 ? <Spark points={reading.spark} /> : null}
              </dd>
              {reading.fraction !== null ? (
                <div className={styles.track} aria-hidden="true">
                  <span
                    className={styles.trackFill}
                    style={{ transform: `scaleX(${reading.fraction.toFixed(4)})` }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </dl>
    </>
  );
}
