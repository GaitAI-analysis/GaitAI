"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Page transition — a short cross-fade, and nothing else.
 *
 * THE FLASH THIS COMPONENT USED TO CAUSE, and why it is gone rather than
 * hidden. Navigation ran a wipe: the outgoing route slid to `x: 100%` behind a
 * 14px blur while TWO fixed overlays crossed the viewport above it —
 *
 *   - a 55vw band at `mix-blend-screen`, filled with a cyan-into-blue-into-
 *     violet gradient and blurred 40px, travelling -120% → 120% and peaking at
 *     0.9 opacity;
 *   - a 1px leading edge carrying `0 0 24px 2px` cyan and `0 0 48px 6px` blue
 *     glow, travelling -10% → 110vw.
 *
 * Both were `fixed inset-y-0` at `z-40`, so every route change dragged a bright
 * light band across the header, the hero and anything else on screen. The two
 * elements are DELETED, along with the slide, the blur and the scale — there is
 * no overlay left to leak through a stacking context, and nothing is being held
 * back by an overflow rule or a z-index.
 *
 * What replaces it is the fade the reduced-motion branch already used, now the
 * only path: 200ms of opacity on the outgoing route, then the incoming one.
 * Nothing moves, nothing glows, and nothing is layered over the page.
 *
 * `initial={false}` stays on the child, and it is load-bearing rather than
 * decorative. A framer-motion `initial` state is written into the SERVER-
 * rendered markup, so `initial={{ opacity: 0 }}` here would ship every route
 * invisible until hydration and delay the largest contentful paint. Starting AT
 * the animate state means the server-rendered page paints as itself, and the
 * transition is carried entirely by `exit`, which only runs on a real
 * navigation.
 */

/* 200ms — inside the 150–250ms a route change is allowed to spend, and short
   enough that a fast navigation is not left waiting on it. */
const FADE = 0.2;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    /* `overflow-x-clip` stays. Nothing slides off-screen any more, so it is no
       longer here for the transition's sake — it is load-bearing for pages
       whose own content overflows, and dropping it would put a horizontal
       scrollbar on the site as an unrelated side effect. */
    <div className="relative overflow-x-clip">
      {/* `mode="wait"` so the two routes never overlap: the incoming one starts
          at full opacity (see `initial={false}` above), and overlapping it with
          the outgoing route would show two pages at once. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : FADE, ease: "linear" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
