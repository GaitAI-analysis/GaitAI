"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useVisualBudget } from "@/lib/useVisualBudget";
import { MotionSignature } from "@/components/visuals/MotionSignature";
import { SceneBoundary } from "@/components/three/SceneBoundary";
import living from "./heroLiving.module.css";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * THE HOMEPAGE HERO'S BACKGROUND, AS ONE COMPONENT.
 * =============================================================================
 * This is the layer stack that has always sat behind "Intelligence in Motion."
 * — lifted out of `Hero.tsx` unchanged so that a second page can carry the
 * same visual system by rendering the same component, rather than by keeping
 * a copy of these lines that would drift. The home page renders it exactly
 * where the lines used to be; /research/talks renders it behind its own copy.
 *
 * What it is, bottom to top:
 *   hero-ambient     the midnight wash — a royal-blue ellipse behind the
 *                    title, a cyan one low-left, and a fade into the page
 *                    ground at the foot (light theme has its own version)
 *   ring-grid        the 56px grid, masked to an ellipse, at a quarter
 *   HeroScene        the WebGL walk — the gait figures, their elliptical
 *                    trajectories and signal dots in cyan / royal / violet,
 *                    masked top and bottom, at 0.29
 *   MotionSignature  the still Motion DNA that stands in for the scene when
 *                    it is off the budget or fails to mount
 *
 * THE SCENE STILL WALKS ITS SIX STAGES. The timer below advances it from
 * stage 0 to stage 5, 1.5 s a step, once the section is in view. Reduced
 * motion and the visual budget switch it off, and under either the scene is
 * never mounted in the first place — the still signature is shown instead.
 *
 * HOW TO HOST IT. Render inside a `relative overflow-hidden` section and put
 * the section's content in its own `relative z-10` wrapper: the scene layer
 * is positioned at z-0, so unpositioned copy would paint beneath it. The
 * budget hook's viewport observer is attached to the ambient layer, which
 * fills the section, so the host section needs no ref of its own.
 */
export function HeroMotionBackground({
  /**
   * How large the motion composition is drawn, relative to the home page's.
   * 1 is the home page exactly — no style attribute is emitted, so its DOM
   * is untouched. A host whose hero is shorter than the home's (Talks is
   * 576px to the home's viewport height) can ask for a little more presence
   * — the ellipses widen, the figures spread — without the wash, the grid,
   * the animation timing, the colours or the opacity changing: it is a
   * transform on the scene layer about its centre, and the layer's own
   * top-and-bottom mask goes with it, so the extra reach fades into the
   * section edges instead of cropping against them.
   */
  scale = 1,
}: {
  scale?: number;
} = {}) {
  const reduceMotion = useReducedMotion();
  const grow = scale !== 1 ? { transform: `scale(${scale})` } : undefined;
  const { ref, eligible, visible } = useVisualBudget();
  const [signatureStage, setSignatureStage] = useState(0);

  useEffect(() => {
    if (reduceMotion || !eligible || !visible || signatureStage >= 5) return;
    const timer = window.setTimeout(
      () => setSignatureStage((stage) => Math.min(stage + 1, 5)),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion, eligible, visible, signatureStage]);

  /* What every device without the scene sees: the same Motion DNA, still. */
  const staticSignature = (
    <div aria-hidden="true" className={living.fallback} style={grow}>
      <MotionSignature stage={2} />
    </div>
  );

  return (
    <>
      <div
        ref={ref as RefObject<HTMLDivElement>}
        className="hero-ambient pointer-events-none absolute inset-0 -z-10"
      />
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

      {eligible && !reduceMotion ? (
        <SceneBoundary fallback={staticSignature}>
          <div
            aria-hidden="true"
            className="hero-scene-mask pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[76%] w-full opacity-[0.29]"
            style={grow}
          >
            <HeroScene running={visible} signatureStage={signatureStage} />
          </div>
        </SceneBoundary>
      ) : (
        staticSignature
      )}
    </>
  );
}
