"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * AUTO-DEMONSTRATE — one shared mechanism for "this section is interactive".
 * =============================================================================
 * The site's interactive sections were all discoverable only by accident: the
 * four movement lenses, the workflow pipeline and the relationship visuals each
 * sat perfectly still until a pointer happened to land on one. A visitor who
 * never hovered never learned there was anything to hover.
 *
 * This is the fix, and it is deliberately ONE hook rather than a behaviour
 * re-invented per component. A section mounts, and the first time it is
 * genuinely on screen it steps through its own states once or twice — slowly,
 * silently, and only far enough to say "these change". Then it stops and waits.
 *
 * THE RULES IT ENFORCES, so no caller has to remember them
 *
 *   VISIBLE ONLY   Nothing runs until the section is actually in view, and it
 *                  pauses the moment it leaves. A demonstration nobody can see
 *                  is a timer burning battery.
 *   BRIEF          A fixed number of passes, then it is over for good — the
 *                  default, because a section that performs every time you
 *                  scroll past reads as decoration. `cycles: "infinite"` opts
 *                  out for the one case where the cycling IS the content: the
 *                  home page's four movement lenses exist to say "the same
 *                  signal reads four ways", and a visitor who arrives after
 *                  two passes should still be told that.
 *   YIELDS         `stop()` ends it permanently. `pause()` and `resume()` are
 *                  the reversible pair, for a caller that hands control back —
 *                  a hover that ends, a lock that is released. A caller that
 *                  only ever wants "the visitor took over" wires `stop`.
 *   REDUCED MOTION It simply never runs. `index` stays null and the caller
 *                  falls through to its own resting state, which is a complete,
 *                  readable picture — not a blank one waiting for animation.
 *
 * WHAT IT COSTS
 * One IntersectionObserver and one interval per section, both torn down on
 * unmount and the interval cleared whenever the section is off screen or the
 * demonstration is finished. No rAF loop, no listener on scroll, no layout
 * read. When it is done it holds nothing at all.
 *
 * WHAT IT IS NOT FOR
 * Decorative motion. If stepping through the states does not teach the visitor
 * something about hierarchy, relationship, progression or available action,
 * the section should stay still.
 */

export interface AutoDemonstrateOptions {
  /** How many states to step through. Below 2 the hook stays dormant. */
  steps: number;
  /** Dwell per state. Long enough to read the change, short enough to finish. */
  intervalMs?: number;
  /**
   * Complete passes before it stops for good. One pass is a demonstration;
   * anything much beyond two is a carousel.
   *
   * `"infinite"` keeps going while the section is visible and nothing has
   * paused or stopped it. Reserve it for a section where the stepping is the
   * message rather than a hint that interaction exists.
   */
  cycles?: number | "infinite";
  /** Fraction of the section that must be visible before it begins. */
  threshold?: number;
  /** Escape hatch for a caller that already knows it should not run. */
  enabled?: boolean;
}

export interface AutoDemonstrate<T extends HTMLElement> {
  /** Attach to the section being demonstrated. */
  ref: React.RefObject<T>;
  /** The state to show, or null when the demonstration is not driving. */
  index: number | null;
  /** True while it is actually stepping — for suppressing transient chrome. */
  running: boolean;
  /** End it permanently. Wire to every user interaction the section accepts. */
  stop: () => void;
  /**
   * Suspend it, reversibly, and hand `index` back to the caller's own resting
   * state. For a hover or a lock — something that will end.
   */
  pause: () => void;
  /**
   * Undo `pause`. Does nothing once `stop` has been called.
   *
   * `from` sets where it picks up, so a caller can resume at whatever the
   * visitor was last looking at rather than at wherever the cycle had wandered
   * to — which is what stops a hover ending in a jump.
   */
  resume: (from?: number) => void;
}

export function useAutoDemonstrate<T extends HTMLElement = HTMLDivElement>({
  steps,
  intervalMs = 1150,
  cycles = 1,
  threshold = 0.35,
  enabled = true,
}: AutoDemonstrateOptions): AutoDemonstrate<T> {
  const ref = useRef<T>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  /* Refs, not state: these must not re-run the effect that owns the timer. */
  const doneRef = useRef(false);
  const shownRef = useRef(0);

  /* State, not a ref: pausing has to tear the timer down, and only a
     dependency change can do that from outside the effect. */
  const [paused, setPaused] = useState(false);

  const stop = useCallback(() => {
    doneRef.current = true;
    setRunning(false);
    setIndex(null);
  }, []);

  const pause = useCallback(() => {
    setPaused(true);
    setRunning(false);
    /* Hand `index` back so the caller's own resting state shows through — a
       paused demonstration must not keep asserting a state it is not
       driving. */
    setIndex(null);
  }, []);

  const resume = useCallback((from?: number) => {
    if (doneRef.current) return;
    if (from !== undefined) shownRef.current = from;
    setPaused(false);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled || steps < 2) return;

    /* Reduced motion: never start. The caller's resting state stands on its
       own, and the section is still fully operable by hand. */
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    /* Paused by the caller. Nothing is observed and nothing ticks until
       `resume` flips this back, at which point the observer is rebuilt and
       reports the current visibility for free. */
    if (paused) return;

    let timer: number | undefined;

    const clear = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const begin = () => {
      if (doneRef.current || timer !== undefined) return;
      setRunning(true);
      /* Step immediately so entering the viewport shows a change rather than
         a second of nothing followed by one. */
      setIndex(shownRef.current % steps);
      shownRef.current += 1;

      /* "infinite" is the one case where the stepping is the content rather
         than a hint that interaction exists. */
      const limit = cycles === "infinite" ? Infinity : steps * cycles;

      timer = window.setInterval(() => {
        if (shownRef.current >= limit) {
          clear();
          doneRef.current = true;
          setRunning(false);
          /* Hand control back rather than freezing on the last state — the
             section returns to whatever it rests on and waits. */
          setIndex(null);
          return;
        }
        setIndex(shownRef.current % steps);
        shownRef.current += 1;
      }, intervalMs);
    };

    /* The off-screen pause. Separate from the caller's `pause` because this
       one must not latch: coming back into view should start it again. */
    const suspend = () => {
      clear();
      setRunning(false);
      setIndex(null);
    };

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        if (visible && !doneRef.current) begin();
        else if (!visible) suspend();
      },
      { threshold },
    );
    observer.observe(node);

    /* A visitor who turns reduced motion on mid-visit should see it stop. */
    const onPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        doneRef.current = true;
        suspend();
      }
    };
    reduced.addEventListener("change", onPreferenceChange);

    return () => {
      clear();
      observer.disconnect();
      reduced.removeEventListener("change", onPreferenceChange);
    };
  }, [steps, intervalMs, cycles, threshold, enabled, paused]);

  return { ref, index, running, stop, pause, resume };
}
