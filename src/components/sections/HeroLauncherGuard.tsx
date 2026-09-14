"use client";

import { useEffect } from "react";

/**
 * THE HERO'S SAFE ZONE FOR THE FLOATING LAUNCHER.
 *
 * Ask GaitAI floats in the bottom-right corner of every route. The hero
 * already keeps that corner clear at rest on a normal screen: its height is
 * capped by the room under the navbar minus a reserve for the launcher, so
 * the pill floats over the hand-off gap below the picture. But a short
 * browser window on a laptop (1366×657 is a real one) runs the hero into its
 * content floor — the least height that keeps the headline and the pills in
 * frame — and then the picture reaches past the launcher's corner. In dark
 * mode the SecureVision copy reaches to ~90% of the width, and the launcher's
 * label ("✦ Ask GaitAI", ~115px) can touch its last word.
 *
 * So the hero measures. On load, scroll and resize it takes the SecureVision
 * link's box, widens it to cover the eyebrow and the two lines above the pill
 * (the copy sits in a fixed relation to the pill in both artworks), and asks
 * whether the launcher's corner — its would-be EXPANDED box, computed from
 * the launcher's own offsets rather than read from it, so collapsing it can
 * never flip the answer back — intersects that zone. While it does, the
 * document carries `data-hero-guard="true"`, and the launcher's stylesheet
 * folds the label away, leaving the ✦ mark: 50px wide, which clears the copy
 * at every width the desktop layout serves. Scroll past the hero, or widen
 * the window, and the label returns.
 *
 * Nothing here touches the artwork or the layout; it is one attribute on
 * <html>, set from geometry, removed on unmount.
 */

/* The launcher's geometry, mirrored from assistant.module.css: offset
   clamp(1rem, 2.5vw, 1.75rem) from the right and bottom edges; the expanded
   pill is ~115×41px. Rounded up so the zone errs on the side of clearance. */
const LAUNCHER_WIDTH = 124;
const LAUNCHER_HEIGHT = 46;
const MARGIN = 8;

/* The copy above the pill, as multiples of the pill's own box: the eyebrow
   sits about 1.8–1.9 pill-heights above the pill, and the longest line
   ("Privacy-aware intelligence.") ends about 1.2 pill-widths from its left
   edge, in both themes. */
const COPY_WIDTH_FACTOR = 1.3;
const COPY_ABOVE_FACTOR = 2.1;

function launcherOffset(viewportWidth: number) {
  return Math.min(28, Math.max(16, viewportWidth * 0.025));
}

export function HeroLauncherGuard() {
  useEffect(() => {
    const root = document.documentElement;
    const link = document.querySelector<HTMLAnchorElement>(
      '#platform a[data-cta="securevision"]',
    );
    if (!link) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const r = link.getBoundingClientRect();
      const zone = {
        left: r.left - MARGIN,
        top: r.top - r.height * COPY_ABOVE_FACTOR - MARGIN,
        right: r.left + r.width * COPY_WIDTH_FACTOR + MARGIN,
        bottom: r.bottom + MARGIN,
      };
      const off = launcherOffset(W);
      const launcher = {
        left: W - off - LAUNCHER_WIDTH,
        top: H - off - LAUNCHER_HEIGHT,
        right: W - off,
        bottom: H - off,
      };
      const hit =
        zone.left < launcher.right &&
        zone.right > launcher.left &&
        zone.top < launcher.bottom &&
        zone.bottom > launcher.top;
      if (hit) root.dataset.heroGuard = "true";
      else delete root.dataset.heroGuard;
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.heroGuard;
    };
  }, []);

  return null;
}
