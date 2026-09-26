"use client";

import { useEffect } from "react";

/**
 * THE POINTER HIGHLIGHT — light mode's fourth interaction signal.
 *
 * A soft radial highlight follows the pointer across a premium card. The
 * drawing is entirely CSS (light-theme.css reads `--lx` / `--ly` in the
 * card's ::before layer); this component only writes those two numbers.
 *
 * One delegated `pointermove` listener on the document, passive, and it
 * returns immediately unless the page is in light mode and the pointer is
 * over one of the clickable surfaces interactions.css defines. Coarse
 * pointers never fire it — a phone has no hover, so the spot would only
 * ever appear where a thumb last landed. Nothing here renders, nothing
 * re-renders, and removing the component removes the effect and nothing
 * else.
 */
const SURFACES = ".card-surface, .card-link, .flagship-panel";

export function LightPointerSpot() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    let last: HTMLElement | null = null;

    const onMove = (event: PointerEvent) => {
      if (!document.documentElement.classList.contains("light")) return;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(SURFACES)
          : null;
      if (last && last !== target) {
        last.style.removeProperty("--lx");
        last.style.removeProperty("--ly");
      }
      last = target;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty("--lx", `${x.toFixed(1)}%`);
      target.style.setProperty("--ly", `${y.toFixed(1)}%`);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return null;
}
