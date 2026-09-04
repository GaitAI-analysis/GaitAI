/**
 * The motion system, for components that animate in JavaScript.
 *
 * The canonical definition of these bands — the four durations, the two
 * easing curves, and the reasoning for each — lives in `globals.css` under
 * "THE MOTION SYSTEM". This module is the same vocabulary in seconds, for
 * framer-motion, which takes numbers rather than CSS variables.
 *
 * WHY A SECOND COPY EXISTS. It should not, ideally, and CSS is the source of
 * truth: anything that can animate through `var(--motion-ui)` should, because
 * those variables collapse under `prefers-reduced-motion` by themselves.
 * framer-motion cannot read them — a `transition` prop needs a resolved
 * number at render time — so components driven by it were each choosing their
 * own (0.25, 0.3, 0.35, 0.4, 0.45 all appear in the tree). Two agreeing
 * definitions beat thirty disagreeing ones.
 *
 * WHICH MEANS: keep the numbers here identical to the CSS. If a band changes,
 * change both.
 *
 * REDUCED MOTION IS NOT AUTOMATIC HERE. The CSS tokens collapse themselves;
 * these constants cannot. A component using them must consult framer-motion's
 * `useReducedMotion()` and skip or shorten its animation — `MOTION_NONE`
 * below is the standard "arrive, don't travel" transition for that branch.
 */

/** Seconds, matching `--motion-*` in globals.css. */
export const MOTION = {
  /** ~120ms — press settles, focus rings, colour swaps. Feels instant. */
  fast: 0.12,
  /** ~220ms — the default. Hover, chips, filters, disclosure. */
  ui: 0.22,
  /** ~380ms — content arriving: sections, drawers, route transitions. */
  editorial: 0.38,
  /** 800ms — signature motion only. The product speaking. */
  signal: 0.8,
  /** 1600ms — the ceiling for a travelling signal. Nothing may exceed it. */
  signalSlow: 1.6,
} as const;

/** Decelerating. Anything entering, or responding to input. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Symmetric. A loop that travels and returns — a sweep, a pulse. */
export const EASE_INOUT = [0.4, 0, 0.2, 1] as const;

/**
 * The standard transitions, so a component names an intent instead of
 * assembling a duration and a curve each time.
 */
export const transitions = {
  fast: { duration: MOTION.fast, ease: EASE_OUT },
  ui: { duration: MOTION.ui, ease: EASE_OUT },
  editorial: { duration: MOTION.editorial, ease: EASE_OUT },
  signal: { duration: MOTION.signal, ease: EASE_INOUT },
} as const;

/**
 * What to pass when the visitor has asked for reduced motion.
 *
 * Not `duration: 0`: framer-motion still needs to reach the animate state,
 * and a zero-length tween can drop the completion callback that sequenced
 * components rely on. One millisecond arrives in the same frame and still
 * fires `onAnimationComplete`.
 */
export const MOTION_NONE = { duration: 0.001 } as const;
