"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

// Dynamically imported with ssr:false — same pattern as the homepage Hero.
// Uses the MobilityCare-dedicated scene (frozen pre-animation copy), NOT the
// animated Home HeroScene, so Home hero changes never propagate here.
const HeroScene = dynamic(() => import("@/components/three/MobilityHeroScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * The MobilityCare hero background, extracted verbatim so other pages
 * (e.g. /research/) can reuse the exact same visual system: ambient
 * gradient wash, ring grid, and the animated gait skeleton scene.
 * Rendered inside a `relative overflow-hidden` hero section; the section's
 * content must sit in its own `relative z-10` wrapper.
 */
export function MovementHeroBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      {/* ── background layers — identical to homepage Hero.tsx ── */}
      <div className="hero-ambient pointer-events-none absolute inset-0 -z-10" />
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-20" />

      {/* Animated gait skeleton scene — gated on reduced-motion, same as home */}
      {!reduceMotion && (
        <div
          aria-hidden="true"
          className="hero-scene-mask pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[76%] w-full opacity-20 sm:opacity-30"
        >
          <HeroScene />
        </div>
      )}
    </>
  );
}
