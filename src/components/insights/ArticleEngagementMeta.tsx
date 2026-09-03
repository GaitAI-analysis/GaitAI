"use client";

import { formatCount, formatExact } from "@/lib/article-stats";
import { useArticleEngagement } from "./useArticleEngagement";
import styles from "./engagement.module.css";

/**
 * THE journal metadata row. One component, used by every article page, so
 * views, likes, comments, formatting, icons and accessibility cannot drift
 * apart between one essay and the next:
 *
 *   1.2K views    ♡ 24 likes    💬 6 comments
 *
 * VIEWS ARE TEXT, WITH NO GLYPH. They had a hairline eye beside them; the
 * count is metadata a reader skims past, and a pictogram on it made it look
 * like a control next to two things that are. The like and the comment link
 * keep their marks because they ARE controls.
 *
 * It replaces two components that split this job — an inline view count in
 * the kicker and a separate likes/comments row under the headline — which is
 * how the page ended up formatting the same number two different ways
 * ("1,248 views" here, "1.2K views" on the card for the same article).
 * `formatCount` is now the only formatter on any reader-facing surface;
 * `formatExact` survives as the accessible label, so a screen reader and a
 * hover title still get the unrounded figure.
 *
 * IT IS METADATA, NOT AN ENGAGEMENT BAR. 10.5px mono at the weight of the
 * kicker above it, no pills, no boxes, no counters in circles, and one colour
 * — the like, once it is the reader's own. The like is the only control; the
 * comment count is a link to the thread; views are text.
 *
 * WHAT IT SHOWS, AND WHEN:
 *
 *   views     · always, once known, including a genuine 0. Before then a
 *               placeholder of the same height holds the line, so the number
 *               arriving does not move the article.
 *   likes     · once known. Real writes only, so if the counter cannot be
 *               read there is no number to invent.
 *   comments  · only above zero, and only approved ones. "0 comments" on
 *               every essay in a young journal is noise, not information.
 *
 * If the counters cannot be read at all — Firestore unreachable, or its rules
 * not deployed — the row renders nothing rather than a zero, a dash or a
 * spinner. The difference between "no data" and "none" matters here.
 *
 * "NOTHING" HAS TO MEAN NO ELEMENT, NOT AN EMPTY ONE. On the live site with
 * the articleStats rules undeployed, this resolved to status "unavailable"
 * with a real comment count of 0 — which cleared the old early return, and
 * then rendered no view, no like and no comment. What reached the page was
 * `<div class="engagement_row mt-7"></div>`: an empty box still carrying its
 * 28px top margin, so the header held a gap where the counters should be and
 * gave no hint that a fetch had failed. The three flags below decide what
 * will render BEFORE the wrapper is committed to.
 */
export function ArticleEngagementMeta({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const { status, views, likes, liked, comments, likeBusy, onLike } =
    useArticleEngagement(slug);

  /* Explicit, and never a truthiness test on a number: `views` of 0 is a real
     answer and must show as "0 views", so the test is `!== null`. */
  const showViews = status === "loading" || views !== null;
  const showLikes = likes !== null;
  const showComments = typeof comments === "number" && comments > 0;

  if (!showViews && !showLikes && !showComments) return null;

  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      {/* ── Views ── mandatory: every article shows its own count. */}
      {status === "loading" ? (
        <span className={styles.stat} aria-hidden="true">
          <span className={styles.skeleton} />
        </span>
      ) : (
        views !== null && (
          <span
            className={styles.stat}
            title={formatExact(views, "view")}
            aria-label={formatExact(views, "view")}
          >
            <span aria-hidden="true">{formatCount(views, "view")}</span>
          </span>
        )
      )}

      {/* ── Likes ── the row's only control. */}
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

      {/* ── Approved comments ── */}
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
