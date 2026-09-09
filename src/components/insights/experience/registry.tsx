"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { FigureKey, FigureState } from "@/data/insight-experiences";

/**
 * The figure registry: a FigureKey from `data/insight-experiences.ts` to the
 * component that draws it.
 *
 * Every figure is a separate chunk (`next/dynamic`), so an article downloads
 * only the interactions it uses, and the article text never waits on them.
 * Heroes still render on the server so the first paint has the drawing.
 *
 * A figure takes `presentation` when it is being shown as a Visual Story
 * moment: a fixed state, no controls, no share button.
 */
export interface FigureProps {
  articleSlug: string;
  presentation?: FigureState;
}

const FIGURES: Record<FigureKey, ComponentType<FigureProps>> = {
  "video-to-intelligence": dynamic(
    () => import("./figures/VideoToIntelligence").then((m) => m.VideoToIntelligence),
  ),
  "one-frame-hold": dynamic(() => import("./figures/OneFrameHold").then((m) => m.OneFrameHold)),
  "signal-quality": dynamic(() =>
    import("./figures/SignalQualityLab").then((m) => m.SignalQualityLab),
  ),
  "motion-dna-branches": dynamic(() =>
    import("./figures/MotionDNABranches").then((m) => m.MotionDNABranches),
  ),
  "privacy-transform": dynamic(() =>
    import("./figures/PrivacyTransform").then((m) => m.PrivacyTransform),
  ),
  "privacy-pipeline": dynamic(() =>
    import("./figures/PrivacyPipeline").then((m) => m.PrivacyPipeline),
  ),
  "longitudinal-trend": dynamic(() =>
    import("./figures/LongitudinalTrend").then((m) => m.LongitudinalTrend),
  ),
  "fusion-experiment": dynamic(() =>
    import("./figures/FusionExperiment").then((m) => m.FusionExperiment),
  ),
  "five-questions": dynamic(() => import("./figures/FiveQuestions").then((m) => m.FiveQuestions)),
  /* ── the recurring series ── */
  "pose-error-explorer": dynamic(() =>
    import("./figures/PoseErrorExplorer").then((m) => m.PoseErrorExplorer),
  ),
};

export function Figure({
  figure,
  articleSlug,
  presentation,
}: {
  figure: FigureKey;
  articleSlug: string;
  presentation?: FigureState;
}) {
  const Component = FIGURES[figure];
  if (!Component) return null;
  return <Component articleSlug={articleSlug} presentation={presentation} />;
}
