"use client";

import { useEffect, useRef } from "react";
import { trackInsightEvent, type InsightEventMap } from "@/lib/insight-events";

/**
 * Counts one impression when at least half of a card has been on screen.
 * Once per slug per page load; a card that scrolls past twice is one reader
 * who saw it, not two. Renders an empty, zero-height span.
 */
export function ImpressionSentinel({
  slug,
  surface,
}: {
  slug: string;
  surface: InsightEventMap["insight_impression"]["surface"];
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current?.parentElement ?? ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          trackInsightEvent("insight_impression", { article_slug: slug, surface }, { once: `${slug}:${surface}` });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [slug, surface]);

  return <span ref={ref} aria-hidden="true" hidden />;
}
