/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { assetPath } from "@/lib/paths";
import { isSafeMediaUrl } from "@/lib/media";
import {
  formatPublicationDate,
  publicationTypeLabel,
  topicLabel,
  type PublicationStory,
} from "@/lib/publication";
import { formatCount } from "@/lib/article-stats";
import { JournalCover } from "./JournalCover";
import journal from "./journal.module.css";
import styles from "./publication.module.css";

const TOPIC_CLASS: Record<string, string> = {
  "movement-intelligence": journal.tMovement,
  "responsible-ai": journal.tResponsible,
  mobility: journal.tMobility,
  research: journal.tResearch,
};

export function PublicationCard({
  story,
  featured = false,
  priority = false,
  views,
}: {
  story: PublicationStory;
  featured?: boolean;
  priority?: boolean;
  views?: number;
}) {
  const topic = story.topics[0];
  const artwork = story.coverArtwork;
  const validImage = artwork.kind === "image" && isSafeMediaUrl(artwork.src);

  return (
    <article
      className={`${journal.card} journal-card ${
        featured ? journal.cardFull : journal.cardTall
      } ${TOPIC_CLASS[topic] ?? journal.tResearch}`}
    >
      <span aria-hidden="true" className={journal.cardAccent} />
      <div className={journal.cardMedia}>
        {artwork.kind === "concept" ? (
          <>
            <JournalCover concept={artwork.concept} />
            <span className="sr-only">{artwork.alt}</span>
          </>
        ) : validImage ? (
          <img
            src={assetPath(artwork.src)}
            alt={artwork.alt}
            width={artwork.width}
            height={artwork.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            sizes={featured ? "(min-width: 900px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
            className={styles.coverImage}
          />
        ) : (
          <div className={styles.coverFallback} aria-hidden="true">
            <span className={styles.signalLine} />
            <span className={styles.signalDot} />
          </div>
        )}
        <span aria-hidden="true" className={journal.cardMediaScrim} />
      </div>

      <div className={journal.cardBody}>
        <div className={journal.cardMeta}>
          <time className={journal.cardCategory} dateTime={story.date}>
            {formatPublicationDate(story.date)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{topic ? topicLabel(topic) : publicationTypeLabel(story.type)}</span>
          {typeof views === "number" && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatCount(views, "view")}</span>
            </>
          )}
        </div>

        <h3 className={journal.cardTitle}>
          <Link href={story.href} className={journal.cardLink}>
            {story.title}
          </Link>
        </h3>
        <p className={journal.cardByline}>{story.author}</p>
        <p className={journal.cardExcerpt}>{story.description}</p>
        <span className={journal.cardCta}>
          Read the story
          <span aria-hidden="true" className={journal.cardCtaArrow}>→</span>
        </span>
      </div>
    </article>
  );
}

