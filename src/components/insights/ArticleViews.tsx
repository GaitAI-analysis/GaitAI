"use client";

import { useEffect, useState } from "react";
import {
  fetchArticleStats,
  formatExact,
  registerView,
} from "@/lib/article-stats";
import styles from "./engagement.module.css";

/**
 * The view count, inline in the article's own metadata row:
 *
 *   ISSUE 01 · GAITAI RESEARCH · AUGUST 26, 2026 · 1,248 VIEWS
 *
 * It is a span, not a card — it inherits the kicker's type, colour and
 * separators, so it reads as one more piece of that row rather than as a
 * widget dropped into it.
 *
 * WHEN A VIEW IS ACTUALLY COUNTED. Four guards, all cheap and none of them
 * tracking anybody:
 *
 *   1. It is a client effect. Next's prefetch fetches the RSC payload without
 *      running effects, so a prefetched article cannot count itself — the
 *      reader has to genuinely open the page.
 *   2. The tab must be visible. A middle-click that opens an article in a
 *      background tab does not count until it is actually looked at, and the
 *      listener is removed the moment it counts once.
 *   3. A dwell of DWELL_MS. An instant bounce, a redirect and most crawlers
 *      that do execute JS are gone before the timer fires.
 *   4. `navigator.webdriver` is skipped entirely, which covers headless
 *      automation and the site's own screenshot tooling.
 *
 * Then `registerView` applies the per-session and per-page-load guards, so
 * re-renders, remounts and repeat visits in one session add nothing.
 *
 * It renders nothing until a real number is known, and nothing at zero — a
 * zero while somebody is demonstrably reading the page would be false.
 */

/** Long enough to lose a bounce, short enough that a real reader is counted. */
const DWELL_MS = 1200;

export function ArticleViews({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    /* Automation — including this repo's own headless screenshots — never
       counts. Cheap, and it is a browser-provided flag, not a fingerprint. */
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const count = async () => {
      await registerView(slug);
      const stats = await fetchArticleStats(slug);
      if (alive && stats) setViews(stats.views);
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
    /* The slug is the page's identity and does not change within a visit. */
  }, [slug]);

  if (views === null || views === 0) return null;

  return (
    <>
      <span aria-hidden="true">·</span>
      <span className={styles.inlineStat}>
        <EyeMark />
        {formatExact(views, "view")}
      </span>
    </>
  );
}

function EyeMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={styles.inlineMark}>
      <path
        d="M1.6 8S4 4.2 8 4.2 14.4 8 14.4 8 12 11.8 8 11.8 1.6 8 1.6 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="1.7" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
