"use client";

import { useEffect, useState } from "react";
import { fetchAllArticleStats, type ArticleStats } from "@/lib/article-stats";

/**
 * Every article's real view and like counters, in one Firestore read.
 *
 * One read for the whole archive rather than one per card: the collection is
 * one small document per slug, so adding articles adds no queries.
 *
 * `loaded` is what the listing gates its "Most viewed" option on. It only goes
 * true when the read actually resolved — if Firestore is unreachable the map
 * stays empty and `loaded` stays false, so no popularity ordering is offered
 * over data that is not there.
 */
export function useArticleStats() {
  const [stats, setStats] = useState<Record<string, ArticleStats>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const all = await fetchAllArticleStats();
      if (!alive) return;
      setStats(all);
      /* An empty map from a successful read is still a real answer — every
         article is simply at zero — but there is nothing to sort by, so the
         Most viewed option stays hidden until at least one counter exists. */
      setLoaded(Object.keys(all).length > 0);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { stats, loaded };
}
