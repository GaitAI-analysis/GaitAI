"use client";

import { useEffect, useState } from "react";

/**
 * Real comment counts for a set of article slugs.
 *
 * ONE query, not one per article. Comments live in a single flat Firestore
 * collection keyed by `postId`, so the whole visible set is fetched once and
 * grouped here — five articles cost one read-set, and adding articles does not
 * add queries.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It never invents a number. Before the
 * fetch resolves, and if it fails, every count is `undefined` and the caller
 * renders nothing at all rather than a zero or a placeholder — a comment count
 * that is really a loading state is a false statement about a real record. A
 * genuine zero (article exists, no comments yet) also renders nothing, because
 * "0 comments" is noise on every card in a young journal.
 *
 * Firebase is imported dynamically so the archive page costs no Firebase bytes
 * until this hook runs, and the whole thing degrades to "no counts" if
 * Firestore is unreachable or unconfigured.
 */
export function useCommentCounts(slugs: readonly string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  /* The slug set only changes when the article records do, so the join keeps
     this to one effect run per real change rather than one per render. */
  const key = slugs.join("|");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [{ collection, getDocs, query, where }, { db }] = await Promise.all([
          import("firebase/firestore"),
          import("@/lib/firebase"),
        ]);

        const snap = await getDocs(
          query(collection(db, "comments"), where("hidden", "==", false)),
        );

        if (!alive) return;

        const tally: Record<string, number> = {};
        snap.forEach((doc) => {
          const postId = (doc.data() as { postId?: unknown }).postId;
          if (typeof postId === "string") {
            tally[postId] = (tally[postId] ?? 0) + 1;
          }
        });
        setCounts(tally);
      } catch {
        /* Unreachable or unconfigured Firestore leaves the counts empty, and
           the cards simply show no comment metadata. */
        if (alive) setCounts({});
      }
    })();

    return () => {
      alive = false;
    };
  }, [key]);

  return counts;
}
