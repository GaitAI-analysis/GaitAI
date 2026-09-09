"use client";

import Link from "next/link";
import { getInsightBySlug } from "@/data/insights";
import { formatPublicationDate, topicLabel, type PublicationStory } from "@/lib/publication";
import { formatCount } from "@/lib/article-stats";
import journal from "../journal.module.css";
import { CardInteraction } from "./CardInteraction";
import { usePhysicalCard } from "./InsightCard";
import styles from "./hub.module.css";

const TOPIC_CLASS: Record<string, string> = {
  "movement-intelligence": journal.tMovement,
  "responsible-ai": journal.tResponsible,
  mobility: journal.tMobility,
  research: journal.tResearch,
};

/**
 * THE COVER STORY — one dominant piece with its interaction at full size.
 *
 * The interactive picture takes the larger share of the width; beside it the
 * story's question, headline, deck and the three "you'll learn" hooks that a
 * listing card has no room for. The whole surface lifts and lights like every
 * other card; the picture is explorable in place.
 */
export function InsightFeatureStory({ story, views }: { story: PublicationStory; views?: number }) {
  const { ref, pointer, handlers } = usePhysicalCard();
  const article = getInsightBySlug(story.slug);
  const topic = story.topics[0];
  const artwork = story.coverArtwork;

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

      <div className={`${journal.cardMedia} ${styles.featureMedia}`}>
        {artwork.kind === "concept" && (
          <>
            <CardInteraction concept={artwork.concept} slug={story.slug} large />
            <span className="sr-only">{artwork.alt}</span>
          </>
        )}
        {typeof story.seriesOrder === "number" && (
          <span aria-hidden="true" className={styles.step}>
            Foundations <b>{String(story.seriesOrder).padStart(2, "0")}</b>
          </span>
        )}
      </div>

      <div className={`${journal.cardBody} ${styles.featureBody} ${styles.depth}`}>
        <p className={styles.featureKicker}>
          <span className={styles.featureStep}>Cover story</span>
          <span aria-hidden="true">·</span>
          <time dateTime={story.date}>{formatPublicationDate(story.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{topic ? topicLabel(topic) : story.type}</span>
          {typeof views === "number" && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatCount(views, "view")}</span>
            </>
          )}
        </p>

        <h3 className={journal.cardTitle}>
          <Link href={story.href} className={journal.cardLink}>
            {story.title}
          </Link>
        </h3>
        <p className={journal.cardByline}>{story.author}</p>

        {article?.question && <p className={styles.featureQuestion}>{article.question}</p>}
        <p className={journal.cardExcerpt}>{story.description}</p>

        {article && article.hooks.length > 0 && (
          <ul className={styles.featureHooks}>
            {article.hooks.slice(0, 3).map((hook) => (
              <li key={hook} className={styles.featureHook}>
                <span aria-hidden="true" className={styles.featureHookMark} />
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        )}

        <span className={journal.cardCta}>
          {article?.ctaLabel ?? "Read the story"}
          <span aria-hidden="true" className={journal.cardCtaArrow}>
            →
          </span>
        </span>
      </div>
    </article>
  );
}
