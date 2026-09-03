"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchArticleStats,
  formatCount,
  hasLiked,
  toggleLike,
} from "@/lib/article-stats";
import styles from "./engagement.module.css";

/**
 * The article page's engagement actions: likes and comments, both real.
 *
 *   24 likes    6 comments
 *
 * The view count is NOT here — it belongs in the article's metadata row and
 * ArticleViews renders it there, inline with the issue, author and date. This
 * component carries the two things a reader can act on.
 *
 * A COUNTER APPEARS ONLY WHEN ITS NUMBER IS KNOWN. Until the read resolves —
 * and for good if Firestore is unreachable — nothing renders in its place: no
 * zero, no skeleton, no dash. "0 views" on an article somebody is reading
 * would be false, and a placeholder number would be worse.
 *
 * THE LIKE IS A REAL WRITE. One like per browser, remembered in localStorage,
 * applied as a ±1 step that `firestore.rules` bounds. The button is optimistic
 * because the number it shows is the reader's own action, and it rolls back if
 * the write is refused.
 */
export function ArticleEngagement({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const [likes, setLikes] = useState<number | null>(null);
  /** Live approved comments on this slug — the same records the thread below
      renders, so the count and the thread can never disagree. */
  const [commentCount, setCommentCount] = useState<number | undefined>();
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      /* The view is registered by ArticleViews in the metadata row; this
         component only needs the like count. */
      const stats = await fetchArticleStats(slug);
      if (!alive || !stats) return;
      setLikes(stats.likes);
      setLiked(hasLiked(slug));
    })();

    /* The comment count comes from the live subscription the discussion
       already uses, so posting a comment updates this line immediately. */
    let stop: (() => void) | undefined;
    (async () => {
      try {
        const { subscribeApprovedComments } = await import(
          "@/lib/comments/service"
        );
        stop = subscribeApprovedComments(slug, (comments) => {
          if (alive) setCommentCount(comments.length);
        });
      } catch {
        /* No Firestore — the comment count simply never appears. */
      }
    })();

    return () => {
      alive = false;
      stop?.();
    };
    /* Slug is the identity of the page; it does not change within a visit. */
  }, [slug]);

  const onLike = useCallback(async () => {
    if (busy || likes === null) return;
    setBusy(true);

    const next = !liked;
    setLiked(next);
    setLikes((current) => (current === null ? current : current + (next ? 1 : -1)));

    const applied = await toggleLike(slug, next);
    if (applied === 0) {
      /* Refused — put the optimistic change back. */
      setLiked(!next);
      setLikes((current) => (current === null ? current : current - (next ? 1 : -1)));
    }
    setBusy(false);
  }, [busy, liked, likes, slug]);

  const nothingKnown = likes === null && typeof commentCount !== "number";
  if (nothingKnown) return null;

  return (
    <div className={`${styles.row} ${className ?? ""}`}>
      {likes !== null && (
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          className={`${styles.stat} ${styles.like} ${liked ? styles.liked : ""}`}
        >
          <HeartMark filled={liked} />
          {formatCount(likes, "like")}
        </button>
      )}

      {typeof commentCount === "number" && commentCount > 0 && (
        <a href="#discussion" className={`${styles.stat} ${styles.link}`}>
          {formatCount(commentCount, "comment")}
        </a>
      )}
    </div>
  );
}

/* Hairline mark at the weight of the surrounding type — the journal's metadata
   is set in 10px mono, and a filled icon at that size reads as a blob. */

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
