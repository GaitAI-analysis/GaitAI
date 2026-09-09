"use client";

import Link from "next/link";
import { insightArticles, insightHref } from "@/data/insights";
import type { PublicationStory } from "@/lib/publication";
import type { ArticleStats } from "@/lib/article-stats";
import { InsightCard } from "./InsightCard";
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
 *   Foundations note    ┌──────────────────┐
 *   set on the page     │  story 05        │
 *                       └──────────────────┘
 *
 * The rhythm is a pair, then a spread, repeating — and the pair is
 * ASYMMETRIC: three fifths beside two fifths, reversed on the next pair. A
 * story left alone at the start of a row keeps its width and the Foundations
 * note takes the rest — text on the page ground, not another card — so the
 * last row is composed rather than left over. Not a masonry.
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
    const pair = Math.floor(index / 3);
    const last = index === stories.length - 1;
    const wide = slot === 2;
    /* First pair: major · minor. Second pair: minor · major. */
    const major = !wide && (pair % 2 === 0 ? slot === 0 : slot === 1);
    return { story, wide, major, lonely: last && slot === 0 };
  });
  const foundations = [...insightArticles].sort((a, b) => a.seriesStep - b.seriesStep);

  return (
    <div className={styles.composition}>
      {layout.map(({ story, wide, major, lonely }, index) => (
        <div key={story.id} className="contents">
          {lonely && !major && <FoundationsNote foundations={foundations} className={styles.spanMajor} />}
          <div className={wide ? styles.wide : major ? styles.spanMajor : styles.spanMinor}>
            <InsightCard
              story={story}
              wide={wide}
              step={story.series === "GaitAI Foundations" ? story.seriesOrder : undefined}
              views={stats[story.slug]?.views}
              priority={index < 2}
            />
          </div>
          {lonely && major && <FoundationsNote foundations={foundations} className={styles.spanMinor} />}
        </div>
      ))}
    </div>
  );
}

/**
 * The Foundations introduction: one sentence on what the five essays are,
 * the five titles in order, and the door into the path. Type on the page
 * ground, deliberately not a card.
 */
function FoundationsNote({
  foundations,
  className,
}: {
  foundations: typeof insightArticles;
  className: string;
}) {
  return (
    <aside className={`${styles.foundationsNote} ${className}`} aria-label="GaitAI Foundations">
      <p className={styles.foundationsKicker}>Foundations</p>
      <p className={styles.foundationsTitle}>
        Five interactive essays on how human movement becomes machine-readable intelligence.
      </p>
      <p className={styles.foundationsBody}>
        Read them in order, from a walking video to an audited multimodal claim — or start anywhere.
        Each one can be explored as well as read.
      </p>
      <ol className={styles.foundationsList}>
        {foundations.map((article) => (
          <li key={article.slug}>
            <Link href={insightHref(article.slug)} className={styles.foundationsItem}>
              <span className={styles.foundationsIndex}>{String(article.seriesStep).padStart(2, "0")}</span>
              <span>{article.seriesTitle}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link href="/insights/start-here" className={styles.foundationsCta}>
        Begin the path <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
