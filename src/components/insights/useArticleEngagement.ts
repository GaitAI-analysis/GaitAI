"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchArticleStats,
  hasLiked,
  registerView,
  toggleLike,
} from "@/lib/article-stats";

/**
 * One article's real engagement: views, likes and approved comments.
 *
 * THE BUG THIS HOOK EXISTS TO FIX. The article page used to read its view
 * count from inside the code path that *writes* one, so the number was only
 * ever fetched after a 1.2s dwell timer, after a visibility check, after the
 * write, and never at all when `navigator.webdriver` was set. Reading and
 * counting are different jobs with different rules, and the count must appear
 * for every reader whether or not this particular visit adds to it — a reader
 * returning to an article in the same session was contributing nothing and
 * therefore, under the old wiring, saw nothing.
 *
 * So this hook does the two things separately:
 *
 *   READ  · immediately on mount, unconditionally. One document.
 *   WRITE · once per article per browser session, and only after the guards
 *           below agree that a person is actually reading the page.
 *
 * WHAT GUARDS A WRITE. Nothing here tracks anybody; each guard is a cheap
 * local check:
 *
 *   1. It runs in a client effect, so Next's prefetch — which fetches the RSC
 *      payload without running effects — cannot count a view for a page
 *      nobody opened.
 *   2. The tab must be visible, so an article middle-clicked into a
 *      background tab counts when it is read, not when it is queued.
 *   3. A dwell of DWELL_MS, which loses instant bounces, redirects and the
 *      crawlers that do run JS.
 *   4. `navigator.webdriver` is skipped, which covers headless automation and
 *      this repo's own screenshot tooling.
 *   5. `registerView` then applies the per-session key and the per-page-load
 *      set, so re-renders, remounts, Fast Refresh, a stats refresh and a
 *      second visit in the same session all add nothing.
 *
 * WHY THE DISPLAYED NUMBER IS BUMPED LOCALLY. When a write succeeds the hook
 * adds 1 to what it already read instead of re-reading the document: the
 * reader's own view is the one increment it can account for exactly, and a
 * second read would cost a round trip to learn something already known.
 *
 * STATUS, NOT ZERO. `status` is "loading" until the read resolves, then
 * "ready" or "unavailable". Callers render a placeholder while loading and
 * nothing at all when unavailable, so "0 views" is only ever shown when the
 * number really is nought.
 */

/** Long enough to lose a bounce, short enough to count a real reader. */
const DWELL_MS = 1200;

export type EngagementStatus = "loading" | "ready" | "unavailable";

export interface ArticleEngagement {
  status: EngagementStatus;
  views: number | null;
  likes: number | null;
  liked: boolean;
  /** Approved, publicly visible comments only. `undefined` until known. */
  comments: number | undefined;
  likeBusy: boolean;
  onLike: () => void;
}

export function useArticleEngagement(slug: string): ArticleEngagement {
  const [status, setStatus] = useState<EngagementStatus>("loading");
  const [views, setViews] = useState<number | null>(null);
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<number | undefined>();
  const [likeBusy, setLikeBusy] = useState(false);

  /* ── READ ── immediately, and independently of any write. */
  useEffect(() => {
    let alive = true;
    (async () => {
      const stats = await fetchArticleStats(slug);
      if (!alive) return;
      if (!stats) {
        /* Firestore unreachable, unconfigured, or the rules deny the read.
           No number is known and none is invented. */
        setStatus("unavailable");
        return;
      }
      setViews(stats.views);
      setLikes(stats.likes);
      setLiked(hasLiked(slug));
      setStatus("ready");
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  /* ── WRITE ── one view per article per session, under the five guards. */
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const count = async () => {
      const applied = await registerView(slug);
      if (!alive || applied === 0) return;
      /* Show the reader the number they are part of, without a second read.
         If the first read has not landed yet it will, and it will already
         include this write. */
      setViews((current) => (current === null ? current : current + applied));
    };

    const startWhenVisible = () => {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", startWhenVisible);
      timer = setTimeout(() => {
        if (alive) void count();
      }, DWELL_MS);
    };

    startWhenVisible();
    if (document.visibilityState !== "visible") {
      document.addEventListener("visibilitychange", startWhenVisible);
    }

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", startWhenVisible);
    };
  }, [slug]);

  /* ── APPROVED COMMENTS ── the same live subscription the thread below the
     article renders from, filtered to `hidden == false`, so the count and the
     thread can never disagree and nothing awaiting moderation is counted. */
  useEffect(() => {
    let alive = true;
    let stop: (() => void) | undefined;
    (async () => {
      try {
        const { subscribeApprovedComments } = await import(
          "@/lib/comments/service"
        );
        stop = subscribeApprovedComments(slug, (list) => {
          if (alive) setComments(list.length);
        });
      } catch {
        /* No Firestore — the comment count simply never appears. */
      }
    })();
    return () => {
      alive = false;
      stop?.();
    };
  }, [slug]);

  const onLike = useCallback(() => {
    if (likeBusy || likes === null) return;
    setLikeBusy(true);

    const next = !liked;
    setLiked(next);
    setLikes((current) => (current === null ? current : current + (next ? 1 : -1)));

    void (async () => {
      const applied = await toggleLike(slug, next);
      if (applied === 0) {
        /* Refused — put the optimistic change back. */
        setLiked(!next);
        setLikes((current) =>
          current === null ? current : current - (next ? 1 : -1),
        );
      }
      setLikeBusy(false);
    })();
  }, [likeBusy, liked, likes, slug]);

  return { status, views, likes, liked, comments, likeBusy, onLike };
}
