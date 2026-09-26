"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import {
  markNextStoryVia,
  trackInsightEvent,
  type InsightEventMap,
  type InsightEventName,
  type NextStoryVia,
} from "@/lib/insight-events";

/**
 * A link that records where a reader went. Server components (the article
 * page, the discovery tail, the doors at the foot of an essay) cannot attach
 * handlers, so they render this instead of `Link` and pass the event as data.
 *
 * Only public identifiers travel: the article slug, a destination slug or
 * node id, a series word. When the event is `next_story_clicked` the `via`
 * is also remembered for one navigation, so the next article can attribute
 * its `insight_open` to the bridge, the series shelf or the related rows.
 */
export function TrackedLink<N extends InsightEventName>({
  event,
  props,
  children,
  ...rest
}: ComponentProps<typeof Link> & {
  event: N;
  props: InsightEventMap[N];
}) {
  return (
    <Link
      {...rest}
      onClick={(clickEvent) => {
        rest.onClick?.(clickEvent);
        if (event === "next_story_clicked") {
          const via = (props as InsightEventMap["next_story_clicked"]).via as NextStoryVia;
          markNextStoryVia(via);
        }
        trackInsightEvent(event, props);
      }}
    >
      {children}
    </Link>
  );
}
