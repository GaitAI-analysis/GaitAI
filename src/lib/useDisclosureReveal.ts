"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * BRINGING A DISCLOSURE'S CONTENT INTO VIEW WHEN IT OPENS.
 * =============================================================================
 * A disclosure that expands downward is only half an interaction. The panel
 * unrolls below the control, the scroll position does not move, and on a long
 * section — where the control sits at the bottom of a full screen of diagram —
 * everything the reader just asked for opens underneath the fold. They click,
 * nothing appears to happen, and they have to go looking for it.
 *
 * So opening also travels: the control moves to the top of the READABLE
 * viewport, which on this site means below the fixed header and below the
 * sticky home rail, and the newly revealed content starts immediately under
 * it.
 *
 * WHERE THE OFFSET COMES FROM. Not from a number here. The caller puts
 * `scroll-margin-top` on the element in CSS — built from
 * `--site-header-height`, `--home-nav-height` and `--site-anchor-gap`, the
 * same expression `.home-section` uses — and this hook reads that computed
 * value back when it needs to know where the readable viewport begins. One
 * definition, so the scroll and the chrome cannot drift apart.
 *
 * WHY IT WAITS. The scroll runs once, after the panel's own expansion has
 * finished, rather than racing it: while the panel is still collapsed the
 * document is shorter, and the browser clamps a scroll to what the page can
 * currently reach — which lands the control short of the top on anything near
 * the end of the page. The wait is derived from the panel's own computed
 * transition (plus `transitionend`, whichever lands first), never a guessed
 * constant, so it is exactly as long as the animation actually is and zero
 * when `prefers-reduced-motion` has turned the animation off.
 *
 * CLOSING DOES NOT TRAVEL unless it has to. Collapsing removes everything
 * below the control, and if the reader had scrolled down into the panel the
 * browser clamps them to the new end of the document — which is to say, the
 * footer. So on close the control is checked, and moved only if it has been
 * carried off screen. A reader who collapses a panel they were sitting on top
 * of stays exactly where they were.
 *
 * IT NEVER TOUCHES FOCUS. The control is a button; it keeps focus through its
 * own click, which is why this works identically for a pointer, for Enter and
 * for Space.
 */

/** Milliseconds in a computed `<time>` value ("0.3s", "300ms"). */
function timeMs(value: string): number {
  const trimmed = value.trim();
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) return 0;
  return trimmed.endsWith("ms") ? parsed : parsed * 1000;
}

/** How long the element's longest transition runs, delay included. */
function transitionMs(element: HTMLElement): number {
  const style = getComputedStyle(element);
  const durations = style.transitionDuration.split(",");
  const delays = style.transitionDelay.split(",");
  let longest = 0;
  durations.forEach((duration, i) => {
    const total =
      timeMs(duration) + timeMs(delays[i % delays.length] ?? "0s");
    if (total > longest) longest = total;
  });
  return longest;
}

/** Where the readable viewport starts, per the element's own scroll margin. */
function readableTop(element: HTMLElement): number {
  const parsed = Number.parseFloat(getComputedStyle(element).scrollMarginTop);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useDisclosureReveal<
  A extends HTMLElement,
  P extends HTMLElement,
>() {
  /** The control — the element that ends up at the top of the viewport. */
  const anchorRef = useRef<A | null>(null);
  /** The panel, read for how long its expansion takes. */
  const panelRef = useRef<P | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      cleanupRef.current?.();
    },
    [],
  );

  /**
   * Call immediately after toggling, with the state being moved INTO — the
   * state variable itself is still the old one at that point.
   */
  const reveal = useCallback((willOpen: boolean) => {
    const anchor = anchorRef.current;
    if (typeof window === "undefined" || !anchor) return;

    const panel = panelRef.current;
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    /* "auto" defers to `html { scroll-behavior }`, which the reduced-motion
       block in globals.css already turns off — but this is the one place that
       would otherwise force smooth over the top of it, so it asks directly. */
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    const bring = () => anchor.scrollIntoView({ behavior, block: "start" });

    /* Whatever is still pending from a fast second click is stale. */
    window.clearTimeout(timerRef.current);
    cleanupRef.current?.();

    const act = () => {
      if (willOpen) {
        bring();
        return;
      }
      const top = anchor.getBoundingClientRect().top;
      const offScreen =
        top < readableTop(anchor) - 2 || top > window.innerHeight - 64;
      if (offScreen) bring();
    };

    const settled = () => {
      cleanupRef.current?.();
      window.clearTimeout(timerRef.current);
      requestAnimationFrame(act);
    };

    const wait = panel ? transitionMs(panel) : 0;
    if (wait <= 0) {
      requestAnimationFrame(act);
      return;
    }

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== panel) return;
      if (event.propertyName !== "grid-template-rows") return;
      settled();
    };
    panel?.addEventListener("transitionend", onEnd);
    cleanupRef.current = () => {
      panel?.removeEventListener("transitionend", onEnd);
      cleanupRef.current = undefined;
    };
    /* The safety net, in case the property name is reported differently or
       the transition is interrupted. One frame past the panel's own duration
       — derived, not guessed. */
    timerRef.current = window.setTimeout(settled, wait + 60);
  }, []);

  return { anchorRef, panelRef, reveal };
}
