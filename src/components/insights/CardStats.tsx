"use client";

import { useEffect, useState } from "react";
import {
  fetchAllArticleStatsCached,
  formatCount,
  formatExact,
  type ArticleStats,
} from "@/lib/article-stats";

/**
 * A card's own counters, for the cards that have no stats hook above them.
 *
 * The archive listing reads every article's counters once and hands each card
 * its numbers as props — it needs them anyway, to offer "Most viewed". The two
 * cards at the foot of an article have no such parent, and without this they
 * were the one place in the journal where the same card component showed no
 * view count. Same collection, same cached read, same formatter: there is one
 * source of these numbers and no second copy of them.
 *
 * It renders the separator with the number, so an unknown count leaves no
 * stray "·" behind — and nothing at all renders until the read resolves.
 */
export function CardStats({ slug }: { slug: string }) {
  const [stats, setStats] = useState<ArticleStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await fetchAllArticleStatsCached();
      if (!alive) return;
      /* A slug missing from the map has no document yet, which is a real
         answer: nobody has read it. An unreachable Firestore returns an empty
         map too, so the distinction that matters — "no data" — is carried by
         `null` from a failed read only. */
      setStats(all[slug] ?? { views: 0, likes: 0 });
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (!stats) return null;

  return (
    <>
      <span aria-hidden="true">·</span>
      <span title={formatExact(stats.views, "view")}>
        {formatCount(stats.views, "view")}
      </span>
      {stats.likes > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span title={formatExact(stats.likes, "like")}>
            {formatCount(stats.likes, "like")}
          </span>
        </>
      )}
    </>
  );
}
