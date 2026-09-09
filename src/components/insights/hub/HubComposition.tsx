"use client";

import type { PublicationStory } from "@/lib/publication";
import type { ArticleStats } from "@/lib/article-stats";
import { InsightCard } from "./InsightCard";
import { FoundationsExplorer } from "./FoundationsExplorer";
import styles from "./hub.module.css";

/**
 * The editorial composition under the cover story.
 *
 *   ┌──────────────────┐ ┌──────────┐
 *   │  story 02        │ │ story 03 │      a larger story beside a compact one
 *   └──────────────────┘ └──────────┘
 *   ┌───────────────────────────────┐
 *   │  story 04 — wide              │      picture beside copy, a different rhythm
 *   └───────────────────────────────┘
 *   Foundations index    ┌──────────────────┐
 *   01 02 03 04 05 ───▶  │  selected story  │      the interactive table of contents
 *                        └──────────────────┘
 *
 * The rhythm is a pair, then a spread, repeating — and the pair is
 * ASYMMETRIC: three fifths beside two fifths, reversed on the next pair. The
 * row a story would be left alone in becomes the Foundations explorer: the
 * five essays as an index on the left, and the selected one — that lone
 * story by default — previewed on the right with its own interaction. Not a
 * masonry.
 */
export function HubComposition({
  stories,
  foundations,
  stats,
}: {
  stories: PublicationStory[];
  /** Every Foundation, in reading order — the explorer previews from these. */
  foundations: PublicationStory[];
  stats: Record<string, ArticleStats>;
}) {
  const layout = stories.map((story, index) => {
    const slot = index % 3;
    const pair = Math.floor(index / 3);
    const last = index === stories.length - 1;
    const wide = slot === 2;
    /* First pair: major · minor. Second pair: minor · major. */
    const major = !wide && (pair % 2 === 0 ? slot === 0 : slot === 1);
    return { story, wide, major, lonely: last && slot === 0 };
  });
  const lone = layout.find((item) => item.lonely)?.story;
  const explorerDefault =
    lone && foundations.some((story) => story.id === lone.id)
      ? lone.slug
      : foundations[foundations.length - 1]?.slug;

  return (
    <div className={styles.composition}>
      {layout.map(({ story, wide, major, lonely }, index) =>
        lonely && explorerDefault === story.slug ? null : (
          <div key={story.id} className={wide ? styles.wide : major ? styles.spanMajor : styles.spanMinor}>
            <InsightCard
              story={story}
              wide={wide}
              step={story.series === "GaitAI Foundations" ? story.seriesOrder : undefined}
              views={stats[story.slug]?.views}
              priority={index < 2}
            />
          </div>
        ),
      )}
      {foundations.length > 0 && (
        <div className={styles.wide}>
          <FoundationsExplorer foundations={foundations} stats={stats} initialSlug={explorerDefault} />
        </div>
      )}
    </div>
  );
}
