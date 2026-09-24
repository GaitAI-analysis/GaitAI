"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
 *
 * THE INTRODUCTION.
 * -----------------------------------------------------------------------------
 * On the first load all three panels are already open, hold for a moment, then
 * fold back into their pills. It is there so a first-time visitor learns what
 * the three pills contain without having to guess and click, and it costs the
 * hero nothing afterwards: what is left is the clean picture.
 *
 * It runs once per page load, not once per mount — `introSpent` is module
 * scope, so a soft navigation back to the homepage finds it spent while a
 * refresh gets a fresh module and a fresh introduction. Scrolling, re-entering
 * the viewport and opening panels by hand never restart it. The first real
 * press or keystroke ends it early and is honoured normally.
 *
 * Two conditions skip it outright and land straight on the clean hero:
 * `prefers-reduced-motion`, and any width below 1600px — below that every
 * panel is the same fixed bottom sheet at `left: 50%`, so three open at once
 * would be three sheets stacked in one place rather than three answers.
 *
 * While it plays the panels are decoration: `aria-hidden`, with the buttons
 * still reporting `aria-expanded="false"`, so assistive technology is not told
 * that three regions opened and closed inside a second. Nothing inside a panel
 * is focusable at this width — `.close` only exists on the bottom-sheet
 * layout — so there is nothing to trap.
 */

/** How long all three stay open, and how long the fold back takes. */
const INTRO_HOLD_MS = 400;
const INTRO_FOLD_MS = 620;

type IntroPhase = "off" | "show" | "fold";

/**
 * Module scope on purpose: once per page load. Deliberately NOT set in the
 * effect's cleanup, so React's development double-mount does not swallow the
 * introduction before anyone sees it.
 */
let introSpent = false;
export function HeroOptions() {
  const [open, setOpen] = useState<HeroOptionId | null>(null);
  const [intro, setIntro] = useState<IntroPhase>("off");
  const buttons = useRef<Partial<Record<HeroOptionId, HTMLButtonElement | null>>>({});
  const timers = useRef<number[]>([]);

  /* The readings only move while a panel is actually on screen — one open, or
     the introduction showing all three. See useHeroTelemetry. */
  const readings = useHeroTelemetry(open !== null || intro !== "off");

  const endIntro = useCallback(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    introSpent = true;
    setIntro("off");
  }, []);

  useEffect(() => {
    if (introSpent) return;
    // Both checks are read once, on load: this is an entrance, not a
    // responsive behaviour, and it should not start halfway through a resize.
    if (
      !window.matchMedia("(min-width: 1600px)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      introSpent = true;
      return;
    }

    const run = () => {
      setIntro("show");
      timers.current.push(
        window.setTimeout(() => {
          setIntro("fold");
          timers.current.push(
            window.setTimeout(() => {
              introSpent = true;
              setIntro("off");
            }, INTRO_FOLD_MS),
          );
        }, INTRO_HOLD_MS),
      );
    };

    // A tab opened in the background still gets its introduction, when it is
    // actually looked at rather than while it is hidden.
    let onVisible: (() => void) | undefined;
    if (document.visibilityState === "visible") {
      run();
    } else {
      onVisible = () => {
        if (document.visibilityState !== "visible") return;
        document.removeEventListener("visibilitychange", onVisible!);
        onVisible = undefined;
        run();
      };
      document.addEventListener("visibilitychange", onVisible);
    }

    return () => {
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, []);

  // Any real press or keystroke ends the introduction early. Capture phase, so
  // a press on a pill ends it and still opens that pill's panel.
  useEffect(() => {
    if (intro === "off") return;
    const stop = () => endIntro();
    document.addEventListener("pointerdown", stop, true);
    document.addEventListener("keydown", stop, true);
    return () => {
      document.removeEventListener("pointerdown", stop, true);
      document.removeEventListener("keydown", stop, true);
    };
  }, [intro, endIntro]);

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
              data-intro={intro === "off" ? undefined : intro}
              aria-hidden={intro !== "off" && !expanded ? true : undefined}
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
