"use client";

import { useEffect } from "react";
import {
  clearInsightContext,
  recordFoundationOpened,
  setInsightContext,
  takeNextStoryVia,
  trackInsightEvent,
} from "@/lib/insight-events";

/**
 * The article's analytics context, mounted once by the page.
 *
 *   · sets the public context every later event on this page carries — the
 *     slug and the series — and clears it on unmount
 *   · emits `insight_open` once per page load
 *   · for a Foundation, records which steps this SESSION has opened and, when
 *     an earlier step was opened before this one, emits
 *     `foundation_progressed` with how the reader arrived (the bridge, the
 *     hub selector, the series shelf, a related row, or directly). That is
 *     the whole of the reading-path funnel: anonymous, session-scoped, and
 *     never joined to anything.
 *
 * Renders nothing.
 */
export function ArticleAnalytics({
  slug,
  series,
  seriesOrder,
  foundations,
}: {
  slug: string;
  series: string;
  seriesOrder?: number;
  /** Whether this article is on the Foundations reading path. */
  foundations: boolean;
}) {
  useEffect(() => {
    setInsightContext({ article_slug: slug, series });
    const via = takeNextStoryVia();
    trackInsightEvent(
      "insight_open",
      { article_slug: slug, series, ...(typeof seriesOrder === "number" ? { series_order: seriesOrder } : {}) },
      { once: slug },
    );
    if (foundations && typeof seriesOrder === "number") {
      const opened = recordFoundationOpened(seriesOrder);
      const earlier = opened.filter((order) => order < seriesOrder);
      if (earlier.length > 0) {
        trackInsightEvent(
          "foundation_progressed",
          { article_slug: slug, series_order: seriesOrder, from_order: Math.max(...earlier), via },
          { once: `${slug}:${seriesOrder}`, session: true },
        );
      }
    }
    return () => clearInsightContext();
  }, [foundations, series, seriesOrder, slug]);

  return null;
}
