"use client";

import type { ReactNode } from "react";
import { formatCount, formatExact } from "@/lib/article-stats";
import { useArticleEngagement } from "./useArticleEngagement";
import journal from "./journal.module.css";
import styles from "./engagement.module.css";

/**
 * THE article header's metadata, in one component.
 *
 *   TECHNICAL ARTICLE · GAITAI RESEARCH · AUGUST 26, 2026 · 8 MIN READ · 1.2K VIEWS
 *   <headline, subtitle, deck and hook>
 *   ♡ 24 likes    💬 6 comments
 *
 * WHY THE HEADLINE IS A CHILD OF THIS COMPONENT. The two metadata rows sit on
 * either side of the headline, and both are driven by the same counters — so
 * either this owns the block between them, or two components each mount
 * `useArticleEngagement` for one article and the page pays for two Firestore
 * reads, two comment subscriptions and two view-write timers. The headline,
 * subtitle, deck and hook stay server-rendered and are passed straight
 * through; nothing about them becomes client state.
 *
 * ISSUE NUMBERS ARE GONE. The kicker used to open "Issue 01", counted off the
 * article's position in the Foundations reading path. GaitAI does not publish
 * numbered issues, and a reader arriving from search had no way to know that
 * "Issue 03" meant "third in a five-part series" rather than "March's
 * edition". What replaces it is what a technical blog actually credits: what
 * kind of piece this is, who wrote it, when, how long it takes and how many
 * people have read it. `seriesStep` is untouched in the record — it still
 * orders the reading path and picks the next article — it is simply no longer
 * printed as though it were an edition number.
 *
 * EVERY VALUE IS REAL. The type comes from the article's own `postType` and
 * the view count from the same Firestore document the archive cards read.
 * Nothing here is a placeholder or a plausible-looking number, which is why
 * views can be absent: if the counter cannot be read, that segment does not
 * render rather than showing a zero.
 *
 * NO READING TIME. It used to sit in this row, estimated from `readMinutes`.
 * The field stays in the record; nothing renders it, on this row or anywhere
 * else a reader can see, and `journal:doctor` fails if that changes.
 *
 * VIEWS MOVED UP, AND ARE NOT DUPLICATED. They used to sit in the row below
 * the headline with the likes and comments. They now close the kicker, where
 * the brief puts them, and the lower row keeps only the two things that are
 * controls — the like, and the link to the thread.
 */
export function ArticleMeta({
  slug,
  typeLabel,
  author,
  date,
  dateLabel,
  children,
}: {
  slug: string;
  /** "Technical Article", "Research Note", … — never an issue number. */
  typeLabel: string;
  author: string;
  /** ISO, for the <time> element. */
  date: string;
  /** The same date, spelled for a reader. */
  dateLabel: string;
  /** Headline, subtitle, deck and hook — server-rendered, passed through. */
  children: ReactNode;
}) {
  const { status, views, likes, liked, comments, likeBusy, onLike } =
    useArticleEngagement(slug);

  /* `views` of 0 is a real answer and shows as "0 views"; only "not known
     yet" and "cannot be read" suppress the segment, which is why this is an
     explicit null test and never a truthiness one. */
  const showViews = status === "ready" && views !== null;
  const showLikes = likes !== null;
  const showComments = typeof comments === "number" && comments > 0;

  return (
    <>
      <p className={journal.articleKicker}>
        <span className={journal.articleKickerCategory}>{typeLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={date}>{dateLabel}</time>

        {/* Arrives after the read resolves. The hairline below flexes, so a
            count landing late lengthens the line without moving the article. */}
        {showViews && (
          <>
            <span aria-hidden="true">·</span>
            <span
              title={formatExact(views, "view")}
              aria-label={formatExact(views, "view")}
            >
              <span aria-hidden="true">{formatCount(views, "view")}</span>
            </span>
          </>
        )}

        <span aria-hidden="true" className={journal.articleKickerRule} />
      </p>

      {children}

      {/* The two controls. Rendered only when there is something to render —
          an empty row still carries its top margin and leaves a gap in the
          header that looks like a bug rather than a failed fetch. */}
      {(showLikes || showComments) && (
        <div className={`${styles.row} mt-7`}>
          {showLikes && (
            <button
              type="button"
              onClick={onLike}
              disabled={likeBusy}
              aria-pressed={liked}
              title={formatExact(likes, "like")}
              aria-label={`${formatExact(likes, "like")} — ${
                liked ? "remove your like" : "like this article"
              }`}
              className={`${styles.stat} ${styles.like} ${liked ? styles.liked : ""}`}
            >
              <HeartMark filled={liked} />
              <span aria-hidden="true">{formatCount(likes, "like")}</span>
            </button>
          )}

          {showComments && (
            <a
              href="#discussion"
              title={formatExact(comments, "comment")}
              className={`${styles.stat} ${styles.link}`}
            >
              <CommentMark />
              <span>{formatCount(comments, "comment")}</span>
            </a>
          )}
        </div>
      )}
    </>
  );
}

/* Hairline marks at the weight of the surrounding type — this row is set in
   10.5px mono, and a filled icon at that size reads as a blob. */

function HeartMark({ filled }: { filled: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.mark}>
      <path
        d="M8 13.2S2.2 9.9 2.2 6.4a2.9 2.9 0 0 1 5.8-1 2.9 2.9 0 0 1 5.8 1c0 3.5-5.8 6.8-5.8 6.8Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.mark}>
      <path
        d="M2.4 4.1h11.2v6.4H7.2L4 13.1v-2.6H2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
