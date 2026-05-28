"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Cinematic page transition.
 *
 * - The OUTGOING route glides off to the right.
 * - The INCOMING route glides in from the left.
 * - Both happen simultaneously (overlap), via AnimatePresence `popLayout`,
 *   so the user perceives a single continuous slide rather than two
 *   sequential beats.
 * - A delicate brand-gradient sweep is layered above the content for an
 *   extra "premium reveal" beat — disabled for users with prefers-reduced-motion.
 *
 * Pure transform + opacity + filter animation = GPU-friendly and silky smooth.
 */

const EASE_EXPO = [0.83, 0, 0.17, 1] as const;
const EASE_QUART = [0.22, 1, 0.36, 1] as const;
const DURATION = 0.85;

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  // ------------------------------------------------------------------
  // Reduced motion → cross-fade only, no slide. Respect user setting.
  // ------------------------------------------------------------------
  if (reduce) {
    return (
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "linear" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Full motion — slide + blur + sweep.
  // overflow-x-clip keeps the off-screen frames from triggering horizontal scroll.
  // ------------------------------------------------------------------
  return (
    <div className="relative overflow-x-clip">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          initial={{
            x: "-100%",
            opacity: 0.4,
            filter: "blur(14px)",
            scale: 0.985,
          }}
          animate={{
            x: "0%",
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
          }}
          exit={{
            x: "100%",
            opacity: 0.4,
            filter: "blur(14px)",
            scale: 0.985,
          }}
          transition={{
            x: { duration: DURATION, ease: EASE_EXPO },
            scale: { duration: DURATION, ease: EASE_EXPO },
            filter: { duration: DURATION * 0.7, ease: EASE_QUART },
            opacity: { duration: DURATION * 0.7, ease: EASE_QUART },
          }}
          style={{ willChange: "transform, opacity, filter" }}
          className="relative"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Decorative brand-gradient sweep that streaks across during navigation */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`sweep-${pathname}`}
          aria-hidden
          initial={{ x: "-120%", opacity: 0 }}
          animate={{
            x: "120%",
            opacity: [0, 0.9, 0.9, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            x: { duration: DURATION + 0.1, ease: EASE_EXPO },
            opacity: {
              duration: DURATION + 0.1,
              times: [0, 0.2, 0.8, 1],
              ease: "easeOut",
            },
          }}
          className="pointer-events-none fixed inset-y-0 left-0 z-[90] w-[55vw] mix-blend-screen"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(79,209,255,0.0) 10%, rgba(37,99,255,0.18) 45%, rgba(124,58,237,0.22) 55%, rgba(79,209,255,0.0) 90%, transparent 100%)",
            filter: "blur(40px)",
          }}
        />
      </AnimatePresence>

      {/* Hairline gradient leading edge — the "spine" of the wipe */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`edge-${pathname}`}
          aria-hidden
          initial={{ x: "-10%", opacity: 0 }}
          animate={{ x: "110vw", opacity: [0, 1, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{
            x: { duration: DURATION + 0.1, ease: EASE_EXPO },
            opacity: {
              duration: DURATION + 0.1,
              times: [0, 0.15, 0.7, 1],
              ease: "easeOut",
            },
          }}
          className="pointer-events-none fixed inset-y-0 left-0 z-[91] w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(79,209,255,0.9) 30%, rgba(124,58,237,0.9) 70%, transparent 100%)",
            boxShadow:
              "0 0 24px 2px rgba(79,209,255,0.6), 0 0 48px 6px rgba(37,99,255,0.4)",
          }}
        />
      </AnimatePresence>
    </div>
  );
}
