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
 *   ┌────────────┐ ┌────────────┐
 *   │  story 02  │ │  story 03  │      two half-width stories
 *   └────────────┘ └────────────┘
 *   ┌───────────────────────────┐
 *   │  story 04 — wide          │      picture beside copy, a different rhythm
 *   └───────────────────────────┘
 *   ┌────────────┐  New to GaitAI?
 *   │  story 05  │  the Foundations path, set directly on the page
 *   └────────────┘
 *
 * The pattern is half · half · wide, repeating. A story left alone at the
 * start of a row keeps its half width and the Foundations note takes the
 * other half — text on the page ground, not another card — so the last row
 * is composed rather than left over. Not a masonry.
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
    return { story, wide: slot === 2, lonely: last && slot === 0 };
  });
  const foundations = [...insightArticles].sort((a, b) => a.seriesStep - b.seriesStep);

  return (
    <div className={styles.composition}>
      {layout.map(({ story, wide, lonely }, index) => (
        <div key={story.id} className={`contents ${wide ? styles.wide : ""}`}>
          <InsightCard
            story={story}
            wide={wide}
            step={story.series === "GaitAI Foundations" ? story.seriesOrder : undefined}
            views={stats[story.slug]?.views}
            priority={index < 2}
          />
          {lonely && (
            <aside className={styles.foundationsNote} aria-label="GaitAI Foundations">
              <p className={styles.foundationsKicker}>New to GaitAI?</p>
              <p className={styles.foundationsTitle}>Start with the Foundations.</p>
              <p className={styles.foundationsBody}>
                Five stories in order, from a walking video to an audited multimodal claim. Each one
                can be explored as well as read.
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
          )}
        </div>
      ))}
    </div>
  );
}
