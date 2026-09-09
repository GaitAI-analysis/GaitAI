"use client";

import type { PublicationStory } from "@/lib/publication";
import type { ArticleStats } from "@/lib/article-stats";
import { InsightCard } from "./InsightCard";
import styles from "./hub.module.css";

/**
 * The editorial composition under the cover story.
 *
 *   ┌────────────┐ ┌────────────┐
 *   │  story     │ │  story     │      two half-width stories
 *   └────────────┘ └────────────┘
 *   ┌───────────────────────────┐
 *   │  wide story               │      one story across the row, picture
 *   └───────────────────────────┘      beside copy — a different rhythm
 *   ┌────────────┐ ┌────────────┐
 *   │  story     │ │  story     │
 *   └────────────┘ └────────────┘
 *
 * The pattern is half · half · wide, repeating, so any count reads as
 * intended: a lone final story goes wide rather than stranding itself in
 * one column. Not a masonry — every row is decided.
 */
export function HubComposition({
  stories,
  stats,
}: {
  stories: PublicationStory[];
  stats: Record<string, ArticleStats>;
}) {
  const layout = stories.map((story, index) => {
    const slot = index % 3;
    const last = index === stories.length - 1;
    /* A leftover third story in a row of halves goes wide too. */
    const wide = slot === 2 || (last && slot === 0);
    return { story, wide };
  });

  return (
    <div className={styles.composition}>
      {layout.map(({ story, wide }, index) => (
        <InsightCard
          key={story.id}
          story={story}
          wide={wide}
          step={story.series === "GaitAI Foundations" ? story.seriesOrder : undefined}
          views={stats[story.slug]?.views}
          priority={index < 2}
        />
      ))}
    </div>
  );
}
