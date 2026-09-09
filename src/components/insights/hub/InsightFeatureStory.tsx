"use client";

import Link from "next/link";
import { getInsightBySlug, readingMinutes } from "@/data/insights";
import { formatPublicationDate, topicLabel, type PublicationStory } from "@/lib/publication";
import { formatCount } from "@/lib/article-stats";
import { markNextStoryVia, trackInsightEvent } from "@/lib/insight-events";
import { seriesMark } from "@/data/insight-series";
import journal from "../journal.module.css";
import { CardInteraction } from "./CardInteraction";
import { ImpressionSentinel } from "../experience/ImpressionSentinel";
import { usePhysicalCard } from "./InsightCard";
import styles from "./hub.module.css";

const TOPIC_CLASS: Record<string, string> = {
  "movement-intelligence": journal.tMovement,
  "responsible-ai": journal.tResponsible,
  mobility: journal.tMobility,
  research: journal.tResearch,
};

/**
 * THE COVER — an editorial cover, not a dashboard tile.
 *
 *   ┌──────────────────────────────┬────────────────────────┐
 *   │                              │  FOUNDATIONS 01 · 8 MIN│
 *   │   the interaction, large     │  From Walking Video    │
 *   │   human → pose → skeleton →  │  to Movement           │
 *   │   trajectory → signal →      │  Intelligence          │
 *   │   intelligence               │  the question          │
 *   │                              │  one-line teaser       │
 *   │                              │  Explore story →       │
 *   └──────────────────────────────┴────────────────────────┘
 *
 * Roughly 58/42. The headline dominates; the question and one line of
 * teaser support it; reading time sits beside the Foundations number, and
 * the date, topic and views sit last and small. No "COVER STORY · DATE ·
 * CATEGORY · VIEWS" row competing with the title — the "Cover story" label
 * lives above the card, once.
 */
export function InsightFeatureStory({ story, views }: { story: PublicationStory; views?: number }) {
  const { ref, pointer, handlers } = usePhysicalCard();
  const article = getInsightBySlug(story.slug);
  const topic = story.topics[0];
  const artwork = story.coverArtwork;
  const mark = seriesMark(story.series, story.seriesOrder);

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      {...handlers}
      data-pointer={pointer ? "true" : undefined}
      className={`${journal.card} journal-card ${journal.cardFull} ${styles.feature} ${
        TOPIC_CLASS[topic] ?? journal.tResearch
      } ${styles.physical}`}
    >
      <span aria-hidden="true" className={journal.cardAccent} />
      <span aria-hidden="true" className={styles.edgeLight} />
      <span aria-hidden="true" className={styles.hairline} />
      <ImpressionSentinel slug={story.slug} surface="cover" />

      <div className={`${journal.cardMedia} ${styles.featureMedia}`}>
        {artwork.kind === "concept" && (
          <>
            <CardInteraction concept={artwork.concept} slug={story.slug} large />
            <span className="sr-only">{artwork.alt}</span>
          </>
        )}
      </div>

      <div className={`${journal.cardBody} ${styles.featureBody} ${styles.depth}`}>
        <p className={styles.featureRow}>
          {mark && (
            <span className={styles.featureStep}>
              {mark.label} {mark.number}
            </span>
          )}
          {article && <span className={styles.featureRead}>{readingMinutes(article)} min read</span>}
        </p>

        <h3 className={`${journal.cardTitle} ${styles.featureTitle}`}>
          <Link
            href={story.href}
            className={journal.cardLink}
            onClick={() => {
              markNextStoryVia("cover");
              trackInsightEvent("cover_story_open", { article_slug: story.slug });
            }}
          >
            {story.title}
          </Link>
        </h3>

        {article?.question && <p className={styles.featureQuestion}>{article.question}</p>}
        <p className={styles.featureTeaser}>{story.description}</p>

        <span className={`${journal.cardCta} ${styles.featureCta}`}>
          Explore story
          <span aria-hidden="true" className={journal.cardCtaArrow}>
            →
          </span>
        </span>

        <p className={styles.quietMeta}>
          <time dateTime={story.date}>{formatPublicationDate(story.date)}</time>
          <span aria-hidden="true"> · </span>
          <span>{topic ? topicLabel(topic) : story.type}</span>
          {typeof views === "number" && (
            <>
              <span aria-hidden="true"> · </span>
              <span>{formatCount(views, "view")}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
