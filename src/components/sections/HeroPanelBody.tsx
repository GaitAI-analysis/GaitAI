"use client";

import type { HeroOption } from "@/data/home-hero";
import { assetPath } from "@/lib/paths";
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
 * SecureVision's preview: the founder's own frame, at the top of the panel.
 *
 * This used to be an abstract plan view — six marks drifting along two lanes.
 * The founder supplied a real one (2026-09-24) and asked for it exactly as
 * saved, so the drawing is gone and the photograph is here instead: an aerial
 * of a crossing with four pedestrians tracked.
 *
 * THE FRAME IS THEIRS; THE OVERLAY IS NOT. The reference draws its detection
 * boxes in a saturated electric blue, which is the one colour this hero does
 * not use. The photograph is untouched and nothing has been redrawn, but the
 * overlay has been pulled onto the panel's own slate and periwinkle, so it
 * belongs to the same palette as the rows beneath it. See
 * scripts/hero-preview/.
 *
 * Decorative: everything it shows is stated in the rows below, so repeating
 * it to a screen reader would be noise.
 */
function FlowPreview() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export; pre-sized
    <img
      className={styles.preview}
      src={assetPath("/images/hero/securevision-preview.png")}
      alt=""
      aria-hidden="true"
      width={225}
      height={150}
      decoding="async"
      loading="lazy"
    />
  );
}

/**
 * A category line under the title. Small, quiet, and the thing that tells
 * you in three words what kind of card this is before you read a number.
 * It lives here rather than in the data file because it is presentation —
 * and because another session owns that file tonight.
 */
const CATEGORY: Record<string, string> = {
  securevision: "Privacy-aware spatial intelligence",
  mobilitycare: "Clinical movement intelligence",
  pose: "Shared analysis layer",
};

/**
 * The one or two readings each card leads with. Everything else falls into
 * the grid below at a smaller rank.
 *
 * Pose analysis leads with nothing on purpose: it is the layer underneath
 * the two products rather than a third product, and a card with no hero
 * block reads as quieter than one with a large number at the top, without
 * needing a single smaller font size to say so.
 */
const LEAD: Record<string, readonly string[]> = {
  securevision: ["Pedestrian flow"],
  mobilitycare: ["Mobility score", "Gait speed"],
  pose: [],
};

export function HeroPanelBody({
  option,
  readings,
}: {
  option: HeroOption;
  readings: readonly Reading[];
}) {
  const layer = option.tier === "layer";
  const lead = LEAD[option.id] ?? [];
  const rows = option.metrics
    .map((metric, i) => ({ metric, reading: readings[i] }))
    .filter((r) => r.reading);
  const leading = rows.filter((r) => lead.includes(r.metric.label));
  const rest = rows.filter((r) => !lead.includes(r.metric.label));

  return (
    <>
      <p className={styles.category}>{CATEGORY[option.id]}</p>

      {option.id === "securevision" ? <FlowPreview /> : null}

      {/* THE LEAD. One or two readings at display size, so the card answers
          "what is this" before it answers "what are the numbers". */}
      {leading.length > 0 ? (
        <dl className={styles.lead} data-count={leading.length}>
          {leading.map(({ metric, reading }) => (
            <div key={metric.label} className={styles.leadItem}>
              <dt className={styles.leadLabel}>{metric.label}</dt>
              <dd className={styles.leadValue}>
                <span key={reading!.text} className={styles.roll}>
                  {reading!.figure}
                  {reading!.unit ? (
                    <span
                      className={styles.leadUnit}
                      data-tight={reading!.unit === "%" ? "true" : undefined}
                    >
                      {reading!.unit}
                    </span>
                  ) : null}
                </span>
                {reading!.spark.length > 0 ? (
                  <Spark points={reading!.spark} />
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* THE SUPPORTING GRID. Two columns, label above value, hairlines
          between rows rather than boxes around them. */}
      <dl className={styles.metrics} data-layer={layer ? "true" : undefined}>
        {rest.map(({ metric, reading }) => (
          <div
            key={metric.label}
            className={styles.metric}
            data-gold={reading!.gold ? "true" : undefined}
            data-fixed={reading!.fixed ? "true" : undefined}
          >
            <dt className={styles.label}>{metric.label}</dt>
            <dd className={styles.value}>
              <span className={styles.figure}>
                {/* Remounts on change — see the header note on the roll. */}
                <span key={reading!.text} className={styles.roll}>
                  {reading!.figure}
                  {reading!.unit ? (
                    <span
                      className={styles.unit}
                      data-tight={reading!.unit === "%" ? "true" : undefined}
                    >
                      {reading!.unit}
                    </span>
                  ) : null}
                </span>
              </span>
              {reading!.spark.length > 0 ? (
                <Spark points={reading!.spark} />
              ) : null}
            </dd>
            {reading!.fraction !== null ? (
              <div className={styles.track} aria-hidden="true">
                <span
                  className={styles.trackFill}
                  style={{
                    transform: `scaleX(${reading!.fraction.toFixed(4)})`,
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </dl>
    </>
  );
}
