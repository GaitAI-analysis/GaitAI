"use client";

import type { HeroOption } from "@/data/home-hero";
import { assetPath } from "@/lib/paths";
import type { Reading } from "./useHeroTelemetry";
import styles from "./heropanels.module.css";

/**
 * THE INSIDE OF A HERO PANEL — a technical annotation, not a product card.
 * =============================================================================
 * The founder rejected the card concept outright (2026-09-26): the expanded
 * state is a ~220px label floating beside the scene, written in the same
 * small technical type as the read-out chips already in the hero
 * (HeroSignals). A title, a one-line descriptor, SecureVision's preview
 * frame as a small 16:9 strip (restored on the founder's correction the
 * same day: smaller, never removed), then five or six "label  value" rows.
 * No display-size numbers, no tracks, no sparklines, no icons.
 *
 * The values are still LIVE (useHeroTelemetry): readings walk, states
 * settle, and `key={reading.text}` on the roll span remounts a figure when
 * it changes so the new value arrives from below. Rows that did not change
 * do not animate.
 *
 * What the annotation shows is presentation, so it lives here rather than in
 * src/data/home-hero.ts (which another session owns): which of the data
 * file's metrics appear, in what order, under which short label, and a
 * shorter unit or value where the full one would not fit a 220px line.
 * The palette is navy / cool grey / warm gold; no electric blue.
 */

type Row = {
  /** The metric's label in home-hero.ts. */
  readonly metric: string;
  /** What the annotation calls it. */
  readonly label: string;
  /** A shorter unit than the data file's ("people/min" → "/min"). */
  readonly unit?: string;
  /** A shorter word for a fixed value ("None detected" → "None"). */
  readonly value?: string;
};

const CATEGORY: Record<string, string> = {
  securevision: "Privacy-aware spatial intelligence",
  mobilitycare: "Clinical movement intelligence",
};

const ROWS: Record<string, readonly Row[]> = {
  securevision: [
    { metric: "Pedestrian flow", label: "Pedestrian flow", unit: "/min" },
    { metric: "Crowd flow", label: "Crowd flow" },
    { metric: "Anomaly status", label: "Anomaly", value: "None" },
    { metric: "Privacy mode", label: "Privacy" },
    { metric: "Identity matching", label: "Identity" },
  ],
  mobilitycare: [
    { metric: "Mobility score", label: "Mobility", unit: "/100" },
    { metric: "Gait speed", label: "Gait speed" },
    { metric: "Fall risk", label: "Fall risk" },
    { metric: "Step symmetry", label: "Symmetry" },
    { metric: "Balance stability", label: "Balance" },
    { metric: "Recovery progress", label: "Recovery" },
  ],
};

/**
 * SecureVision's preview: the founder's own aerial frame of four tracked
 * pedestrians (public/images/hero/securevision-preview.png, 225x150, its
 * overlay already pulled onto the panel palette by scripts/hero-preview/).
 * Cropped to 16:9 by CSS, about 110px tall at the annotation's width.
 * Decorative: the rows say everything it shows.
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

export function HeroPanelBody({
  option,
  readings,
}: {
  option: HeroOption;
  readings: readonly Reading[];
}) {
  const rows = (ROWS[option.id] ?? [])
    .map((row) => {
      const i = option.metrics.findIndex((m) => m.label === row.metric);
      return { row, reading: i >= 0 ? readings[i] : undefined };
    })
    .filter((r) => r.reading);

  return (
    <div className={styles.body}>
      <p className={styles.category}>{CATEGORY[option.id]}</p>
      {option.id === "securevision" ? <FlowPreview /> : null}
      <dl className={styles.rows}>
        {rows.map(({ row, reading }) => {
          const unit = row.unit ?? reading!.unit;
          return (
            <div
              key={row.metric}
              className={styles.row}
              data-gold={reading!.gold ? "true" : undefined}
            >
              <dt className={styles.label}>{row.label}</dt>
              <dd className={styles.value}>
                {/* Remounts on change — see the header note on the roll. */}
                <span key={reading!.text} className={styles.roll}>
                  {row.value ?? reading!.figure}
                  {unit ? (
                    <span
                      className={styles.unit}
                      data-tight={
                        unit === "%" || unit.startsWith("/") ? "true" : undefined
                      }
                    >
                      {unit}
                    </span>
                  ) : null}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
