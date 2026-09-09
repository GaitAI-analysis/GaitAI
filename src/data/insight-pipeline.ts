/**
 * THE EDITORIAL PIPELINE — stories that exist as intentions, not pages.
 *
 * This is the journal's only drafts mechanism, and it is deliberately DATA
 * ONLY. Nothing here is routed, rendered, indexed or listed on the site; an
 * entry becomes an article only when a full record is written into
 * `data/insights.ts` (and an experience into `data/insight-experiences.ts`)
 * and passes scripts/test-insight-content.ts. Until then it is a thesis, a
 * series and, where one is already clear, the one thing a reader should
 * remember doing — the editorial rule every major story is held to.
 *
 * The admin Insights Analytics view lists these so the next story is chosen
 * against what readers actually did with the last ones. See
 * docs/insights-editorial-system.md for the cadence.
 */

import type { InsightSeriesId } from "./insight-series";

export interface PipelineEntry {
  /** Working title. */
  title: string;
  series: InsightSeriesId;
  /** One sentence: the claim the piece would make. */
  thesis: string;
  /** What a reader would remember DOING — or "editorial" if none is warranted. */
  memory: string;
  status: "idea" | "drafting";
}

export const INSIGHT_PIPELINE: PipelineEntry[] = [
  {
    title: "What Happens When a Person Disappears Behind Someone Else?",
    series: "ai-under-stress",
    thesis:
      "Occlusion by another body is not a missing frame; it is a period in which the tracker must decide whom it is following, and the decision can be silently wrong.",
    memory: "Scrub through an occlusion and watch the track identity hold — or swap.",
    status: "idea",
  },
  {
    title: "Why More Data Doesn't Always Mean Better AI",
    series: "research-to-reality",
    thesis:
      "Adding recordings that share the same capture conditions adds confidence without adding coverage; the gap a model fails in is usually the one the data never saw.",
    memory: "editorial",
    status: "idea",
  },
  {
    title: "Why Real-Time AI Is Harder Than a Demo",
    series: "engineering-gaitai",
    thesis:
      "A demo controls the input, the timing and the audience; a live system controls none of them, and most of its engineering is about the three it does not control.",
    memory: "Turn a demo into a live stream and watch the latency and the dropped frames appear.",
    status: "idea",
  },
  {
    title: "What Does a Fall Look Like Before the Fall?",
    series: "movement-stories",
    thesis:
      "A fall is an event; the movement changes that precede one are a trend — and the two are read from different kinds of data over different spans of time.",
    memory: "editorial",
    status: "idea",
  },
  {
    title: "What Happens When Half the Body Is Occluded?",
    series: "ai-under-stress",
    thesis:
      "Pose estimators will still return a full skeleton when half of it is hidden; the question is which half is estimated and which is invented.",
    memory: "Slide a wall across a walker and watch which joints keep their confidence.",
    status: "idea",
  },
  {
    title: "Why Cropped Feet Break More Than the Image",
    series: "engineering-gaitai",
    thesis:
      "The feet carry the gait events — heel strike and toe-off — so a frame that crops them loses the timing that every temporal gait measure is built on.",
    memory: "Crop the frame and watch the cadence estimate lose its anchors.",
    status: "idea",
  },
];
