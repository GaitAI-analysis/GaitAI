"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
/** Fold → compress → dock. Must match the keyframes in the stylesheet. */
const CLOSE_MS = 780;
const OPEN_MS = 560;
/**
 * An extremely restrained stagger, left to right, so the three panels read
 * as one coordinated movement rather than three animations that happen to
 * overlap. Pose analysis, the quieter of the three, leaves last.
 */
const INTRO_STAGGER: Record<HeroOptionId, number> = {
  securevision: 0,
  mobilitycare: 55,
  pose: 110,
};
const INTRO_FOLD_MS = CLOSE_MS + INTRO_STAGGER.pose;

/**
 * Measure the real distance from a panel to its own pill and hand it to CSS.
 *
 * This is the whole trick. The keyframes describe the SHAPE of the movement —
 * retract, fold, compress, dock — but not where it goes; where it goes is
 * read off the live DOM every time the animation starts, so the panel docks
 * into its own control at 1920, on a laptop, on a tablet and on a phone
 * without a single hard-coded offset, and it survives the panel becoming a
 * bottom sheet below 1600px.
 *
 * The fold is anchored to the panel's top edge at the pill's horizontal
 * centre. That point is both the hinge the panel folds toward and the point
 * that lands on the pill, which is what ties the two halves of the motion
 * together: scaling about it maps the panel's rectangle exactly onto the
 * pill's, so the final frame is the pill's own geometry rather than an
 * approximation of it.
 */
function measureDock(panel: HTMLElement, pill: HTMLElement) {
  const p = panel.getBoundingClientRect();
  const b = pill.getBoundingClientRect();
  if (!p.width || !p.height || !b.width || !b.height) {
    panel.dataset.dock = "off";
    return;
  }
  const fx = Math.min(
    Math.max((b.left + b.width / 2 - p.left) / p.width, 0),
    1,
  );
  const dx = b.left + fx * b.width - (p.left + fx * p.width);
  const dy = b.top - p.top;
  // If the pill has been scrolled far out of the panel's world, flying the
  // whole way would be a journey, not a gesture. Fall back to the plain fade.
  if (Math.abs(dy) > window.innerHeight * 1.6) {
    panel.dataset.dock = "off";
    return;
  }
  delete panel.dataset.dock;
  panel.style.setProperty("--dock-x", `${dx.toFixed(1)}px`);
  panel.style.setProperty("--dock-y", `${dy.toFixed(1)}px`);
  panel.style.setProperty("--dock-sx", (b.width / p.width).toFixed(4));
  panel.style.setProperty("--dock-sy", (b.height / p.height).toFixed(4));
  panel.style.setProperty("--fold-x", `${(fx * 100).toFixed(2)}%`);
}

type IntroPhase = "off" | "show" | "fold";

/**
 * Module scope on purpose: once per page load. Deliberately NOT set in the
 * effect's cleanup, so React's development double-mount does not swallow the
 * introduction before anyone sees it.
 */
let introSpent = false;
export function HeroOptions() {
  const [open, setOpen] = useState<HeroOptionId | null>(null);
  /**
   * Panels that are on their way back into their pill. They stay mounted and
   * visible for the whole 780ms, which is the point: the collapse is the
   * interaction, not the absence of one.
   */
  const [closing, setClosing] = useState<readonly HeroOptionId[]>([]);
  const [intro, setIntro] = useState<IntroPhase>("off");
  const buttons = useRef<
    Partial<Record<HeroOptionId, HTMLButtonElement | null>>
  >({});
  const panels = useRef<Partial<Record<HeroOptionId, HTMLDivElement | null>>>(
    {},
  );
  const timers = useRef<number[]>([]);

  /* The readings only move while a panel is actually on screen — one open, or
     the introduction showing all three. See useHeroTelemetry. */
  const readings = useHeroTelemetry(open !== null || intro !== "off");

  /**
   * Start a panel moving, having first measured where its pill actually is.
   * The measurement happens before the state change, while the panel still
   * has its resting geometry: a closed panel is `visibility: hidden`, which
   * keeps its layout, so the rectangle it is about to occupy can be read
   * before it is shown.
   */
  const arm = useCallback((id: HeroOptionId) => {
    const panel = panels.current[id];
    const pill = buttons.current[id];
    if (!panel || !pill) return;
    measureDock(panel, pill);
    panel.dataset.animating = "true";
  }, []);

  const beginOpen = useCallback(
    (id: HeroOptionId) => {
      setOpen((current) => {
        if (current && current !== id) {
          arm(current);
          setClosing((list) =>
            list.includes(current) ? list : [...list, current],
          );
        }
        return id;
      });
      setClosing((list) => list.filter((x) => x !== id));
      arm(id);
    },
    [arm],
  );

  const beginClose = useCallback(
    (id: HeroOptionId | null) => {
      if (!id) return;
      arm(id);
      setClosing((list) => (list.includes(id) ? list : [...list, id]));
      setOpen((current) => (current === id ? null : current));
      // animationend normally ends it. This is the belt: if the animation
      // never fires one — interrupted, or the panel is display:none in dark
      // — the panel would sit there visible and its Close button would stay
      // in the tab order. It must go hidden either way.
      timers.current.push(
        window.setTimeout(() => {
          setClosing((list) => list.filter((x) => x !== id));
          const panel = panels.current[id];
          if (panel) delete panel.dataset.animating;
        }, CLOSE_MS + 140),
      );
      // The pill takes the panel back: a hair of compression as it arrives,
      // and a thread of warm gold along its edge. Both wait for the docking
      // stage — the delay lives in the stylesheet.
      const pill = buttons.current[id];
      if (pill) {
        pill.dataset.absorb = "true";
        timers.current.push(
          window.setTimeout(() => {
            delete pill.dataset.absorb;
          }, CLOSE_MS + 60),
        );
      }
    },
    [arm],
  );

  /** A panel leaves the accessibility tree only once it has finished. */
  const settle = useCallback((id: HeroOptionId) => {
    setClosing((list) => list.filter((x) => x !== id));
    const panel = panels.current[id];
    if (panel) delete panel.dataset.animating;
  }, []);

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
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      // The night picture has no painted pills to fold back into.
      document.documentElement.classList.contains("dark")
    ) {
      introSpent = true;
      return;
    }

    const run = () => {
      setIntro("show");
      timers.current.push(
        window.setTimeout(() => {
          // Measure all three against their own pills before any of them
          // moves, so the stagger is the only thing separating them.
          for (const option of HERO_OPTIONS) {
            const panel = panels.current[option.id];
            const pill = buttons.current[option.id];
            if (!panel || !pill) continue;
            measureDock(panel, pill);
            panel.style.setProperty(
              "--intro-delay",
              `${INTRO_STAGGER[option.id]}ms`,
            );
            panel.dataset.animating = "true";
          }
          setIntro("fold");
          timers.current.push(
            window.setTimeout(() => {
              introSpent = true;
              setIntro("off");
              for (const option of HERO_OPTIONS) {
                const panel = panels.current[option.id];
                if (panel) delete panel.dataset.animating;
              }
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
      if (onVisible)
        document.removeEventListener("visibilitychange", onVisible);
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
      beginClose(open);
      button?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.("[data-hero-option]")) beginClose(open);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, beginClose]);

  return (
    <>
      {HERO_OPTIONS.map((option) => {
        const [left, top, , height] = option.pill;
        const expanded = open === option.id;
        const folding = closing.includes(option.id);
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
              style={
                {
                  left: `${left * 100}%`,
                  /* The vertical centre of the pill that used to be painted
                     here. The button sizes itself to its own words now, and
                     the stylesheet hangs it from this line, so a smaller pill
                     still sits exactly where the artwork put the old one. */
                  "--pill-cy": `${(top + height / 2) * 100}%`,
                } as CSSProperties
              }
              aria-label={`${option.label} — ${expanded ? "hide" : "show"} details`}
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() =>
                expanded ? beginClose(option.id) : beginOpen(option.id)
              }
            >
              <span className={styles.pillLabel}>{option.label}</span>
              <svg
                className={styles.pillArrow}
                viewBox="0 0 8 12"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M1.6 1.2 6.4 6l-4.8 4.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={`${panelId}-title`}
              data-hero-option=""
              data-option={option.id}
              ref={(el) => {
                panels.current[option.id] = el;
              }}
              data-open={expanded}
              data-closing={folding ? "true" : undefined}
              data-intro={intro === "off" ? undefined : intro}
              aria-hidden={
                (intro !== "off" && !expanded) || folding ? true : undefined
              }
              className={`${styles.panel} ${option.tier === "layer" ? styles.layer : ""}`}
              onAnimationEnd={(event) => {
                // Only the panel's own animation, not a child's.
                if (event.target !== event.currentTarget) return;
                if (folding) settle(option.id);
                else if (expanded) delete event.currentTarget.dataset.animating;
              }}
            >
              {/* The content retracts before the shell folds: the readings
                  draw in and settle a few pixels toward the pill while the
                  card is still its full size, so the panel looks like it is
                  putting itself away rather than being switched off. */}
              <div className={styles.panelContent}>
                <p id={`${panelId}-title`} className={styles.panelTitle}>
                  {option.label}
                </p>
                <HeroPanelBody option={option} readings={readings[option.id]} />
                {option.footnote ? (
                  <p className={styles.footnote}>{option.footnote}</p>
                ) : null}
              </div>
              {/* Outside the retracting wrapper on purpose: on the sheet
                  layout it is positioned against the panel, and a
                  transformed wrapper would become its containing block and
                  jog it sideways the moment the fold began. */}
              <button
                type="button"
                className={styles.close}
                onClick={() => beginClose(option.id)}
              >
                Close
              </button>
            </div>
          </div>
        );
      })}
      {/* The bottom sheet's backdrop (narrow screens only; hidden by CSS on
          the wide layout). Pressing it is a press outside, so it closes. */}
      <div
        aria-hidden="true"
        className={styles.scrim}
        data-open={open !== null}
      />
    </>
  );
}
