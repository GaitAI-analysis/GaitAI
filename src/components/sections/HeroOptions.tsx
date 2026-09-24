"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_OPTIONS, type HeroOptionId } from "@/data/home-hero";
import { HeroPanelBody } from "./HeroPanelBody";
import { useHeroTelemetry } from "./useHeroTelemetry";
import styles from "./homehero.module.css";

/**
 * THE THREE PAINTED OPTIONS, MADE INTERACTIVE.
 * =============================================================================
 * The hero picture already shows three pills — SecureVision, MobilityCare,
 * Pose analysis. They are not redrawn: each gets a transparent button laid
 * exactly over its painted pill (boxes in `HERO_OPTIONS`, as fractions of the
 * image), so what the visitor clicks is the artwork itself.
 *
 * Nothing is visible until a pill is pressed. Then one frosted panel opens —
 * beside its pill on wide screens, as a bottom sheet below 1600px, where
 * there is no room beside the pills without covering the people. One panel
 * at a time: pressing another pill switches, pressing the same pill again,
 * Escape, or any press outside the pills and panels closes it.
 *
 * It is a disclosure, not a modal: each button carries `aria-expanded` and
 * `aria-controls`, focus stays where the visitor put it, and each panel sits
 * straight after its button in the DOM so Tab walks into the open panel.
 * Closed panels are `visibility: hidden`, so they are out of the tab order
 * and the accessibility tree while still animating out.
 */
export function HeroOptions() {
  const [open, setOpen] = useState<HeroOptionId | null>(null);
  const buttons = useRef<Partial<Record<HeroOptionId, HTMLButtonElement | null>>>({});

  /* The readings only move while a panel is actually on screen — there is
     nothing to animate for a closed panel. See useHeroTelemetry. */
  const readings = useHeroTelemetry(open !== null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const button = buttons.current[open];
      setOpen(null);
      button?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-hero-option]")) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      {HERO_OPTIONS.map((option) => {
        const [left, top, width, height] = option.pill;
        const expanded = open === option.id;
        const panelId = `hero-option-${option.id}`;
        return (
          <div key={option.id} className={styles.option}>
            <button
              ref={(el) => {
                buttons.current[option.id] = el;
              }}
              type="button"
              data-hero-option=""
              className={styles.hotspot}
              style={{
                left: `${left * 100}%`,
                top: `${top * 100}%`,
                width: `${width * 100}%`,
                height: `${height * 100}%`,
              }}
              aria-label={`${option.label} — ${expanded ? "hide" : "show"} details`}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpen((current) => (current === option.id ? null : option.id))}
            />
            <div
              id={panelId}
              role="region"
              aria-labelledby={`${panelId}-title`}
              data-hero-option=""
              data-option={option.id}
              data-open={expanded}
              className={`${styles.panel} ${option.tier === "layer" ? styles.layer : ""}`}
            >
              <p id={`${panelId}-title`} className={styles.panelTitle}>
                {option.label}
              </p>
              <HeroPanelBody option={option} readings={readings[option.id]} />
              {option.footnote ? <p className={styles.footnote}>{option.footnote}</p> : null}
              <button type="button" className={styles.close} onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        );
      })}
      {/* The bottom sheet's backdrop (narrow screens only; hidden by CSS on
          the wide layout). Pressing it is a press outside, so it closes. */}
      <div aria-hidden="true" className={styles.scrim} data-open={open !== null} />
    </>
  );
}
