"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import { assetPath } from "@/lib/paths";
import { isSafeMediaUrl } from "@/lib/media";
import {
  formatPublicationDate,
  publicationTypeLabel,
  topicLabel,
  type PublicationMatch,
  type PublicationStory,
} from "@/lib/publication";
import { formatCount } from "@/lib/article-stats";
import { getInsightBySlug, readingMinutes } from "@/data/insights";
import { JournalCover } from "../JournalCover";
import journal from "../journal.module.css";
import publication from "../publication.module.css";
import { CardInteraction } from "./CardInteraction";
import styles from "./hub.module.css";

const TOPIC_CLASS: Record<string, string> = {
  "movement-intelligence": journal.tMovement,
  "responsible-ai": journal.tResponsible,
  mobility: journal.tMobility,
  research: journal.tResearch,
};

/**
 * One story on the hub — a physical, touchable card whose picture is a tiny
 * version of the article's idea.
 *
 * Built on the journal's existing card (ground, accent, meta, headline,
 * byline, excerpt, cue) so it stays the same object as the cards on the
 * archive and topic pages. What it adds:
 *
 *   · the pointer's position drives a border light and a very mild tilt
 *     (≤1.6°), and the card presses under a finger — see hub.module.css
 *   · editorial stories carry their mini interaction in the media slot,
 *     above the stretched link, so a finger on the picture explores and a
 *     finger on the words navigates
 *   · a search hit says WHERE it matched, and a section hit links to the
 *     section itself
 *
 * Newsroom stories (Firestore posts) keep their image; nothing pretends to be
 * interactive when it is not.
 */
export function usePhysicalCard() {
  const ref = useRef<HTMLElement>(null);
  const [pointer, setPointer] = useState(false);
  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = ref.current;
    if (!element || event.pointerType !== "mouse") return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--mx", String((event.clientX - rect.left) / rect.width));
    element.style.setProperty("--my", String((event.clientY - rect.top) / rect.height));
  }, []);
  return {
    ref,
    pointer,
    handlers: {
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === "mouse") setPointer(true);
      },
      onPointerLeave: () => {
        setPointer(false);
        const element = ref.current;
        element?.style.setProperty("--mx", "0.5");
        element?.style.setProperty("--my", "0.5");
      },
      onPointerMove,
    },
  };
}

export function highlight(text: string, query: string): ReactNode {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return text;
  const at = text.toLocaleLowerCase().indexOf(q);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className={styles.matchMark}>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

export function MatchLine({ match, story, query }: { match: PublicationMatch; story: PublicationStory; query: string }) {
  if (match.where === "title") return null;
  const where =
    match.where === "section"
      ? "In section"
      : match.where === "summary"
        ? "Summary"
        : match.where === "topic"
          ? "Topic"
          : match.where === "tag"
            ? "Tag"
            : match.where === "type"
              ? "Type"
              : match.where === "series"
                ? "Reading path"
                : "Author";
  return (
    <p className={styles.match}>
      <span className={styles.matchWhere}>{where}</span>
      {match.section ? (
        <Link href={`${story.href}#${match.section.id}`} className={styles.matchSection}>
          {highlight(match.section.title, query)}
        </Link>
      ) : (
        <span>{highlight(match.snippet, query)}</span>
      )}
    </p>
  );
}

export function InsightCard({
  story,
  step,
  views,
  match,
  query = "",
  wide = false,
  priority = false,
  preview = false,
}: {
  story: PublicationStory;
  /** Foundations position, printed as a small editorial number. */
  step?: number;
  views?: number;
  match?: PublicationMatch | null;
  query?: string;
  wide?: boolean;
  priority?: boolean;
  /** The Foundations explorer's preview: tighter body, a clearer call to action. */
  preview?: boolean;
}) {
  const { ref, pointer, handlers } = usePhysicalCard();
  const topic = story.topics[0];
  const artwork = story.coverArtwork;
  const validImage = artwork.kind === "image" && isSafeMediaUrl(artwork.src);
  const article = story.source === "editorial" ? getInsightBySlug(story.slug) : undefined;

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      {...handlers}
      data-pointer={pointer ? "true" : undefined}
      className={`${journal.card} journal-card ${wide ? journal.cardWide : journal.cardTall} ${
        TOPIC_CLASS[topic] ?? journal.tResearch
      } ${styles.physical} ${wide ? styles.wide : ""} ${preview ? styles.previewCard : ""}`}
    >
      <span aria-hidden="true" className={journal.cardAccent} />
      <span aria-hidden="true" className={styles.edgeLight} />
      <span aria-hidden="true" className={styles.hairline} />

      <div className={journal.cardMedia}>
        {artwork.kind === "concept" ? (
          <>
            <CardInteraction concept={artwork.concept} slug={story.slug} />
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
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={publication.coverImage}
          />
        ) : (
          <div className={publication.coverFallback} aria-hidden="true">
            <span className={publication.signalLine} />
            <span className={publication.signalDot} />
          </div>
        )}
        {typeof step === "number" && (
          <span aria-hidden="true" className={styles.step}>
            Foundations <b>{String(step).padStart(2, "0")}</b>
          </span>
        )}
        {artwork.kind !== "concept" && <span aria-hidden="true" className={journal.cardMediaScrim} />}
      </div>

      <div className={`${journal.cardBody} ${styles.depth}`}>
        {/* Headline first. The date, topic and views follow the excerpt in a
            quiet line — metadata is the last thing a reader needs, not the
            first thing they see. */}
        <h3 className={journal.cardTitle}>
          <Link href={story.href} className={journal.cardLink}>
            {query ? highlight(story.title, query) : story.title}
          </Link>
        </h3>
        {match && match.where !== "title" ? (
          <MatchLine match={match} story={story} query={query} />
        ) : (
          <p className={journal.cardExcerpt}>{story.description}</p>
        )}
        <p className={styles.cardMetaQuiet}>
          <time dateTime={story.date}>{formatPublicationDate(story.date)}</time>
          <span aria-hidden="true"> · </span>
          <span>{topic ? topicLabel(topic) : publicationTypeLabel(story.type)}</span>
          {article && (
            <>
              <span aria-hidden="true"> · </span>
              <span>{readingMinutes(article)} min read</span>
            </>
          )}
          {typeof views === "number" && (
            <>
              <span aria-hidden="true"> · </span>
              <span>{formatCount(views, "view")}</span>
            </>
          )}
        </p>
        <span className={journal.cardCta}>
          Read the story
          <span aria-hidden="true" className={journal.cardCtaArrow}>
            →
          </span>
        </span>
      </div>
    </article>
  );
}

/** The drawn cover, kept for places that want the still picture. */
export function StillCover({ story }: { story: PublicationStory }) {
  const artwork = story.coverArtwork;
  if (artwork.kind !== "concept") return null;
  return <JournalCover concept={artwork.concept} />;
}
