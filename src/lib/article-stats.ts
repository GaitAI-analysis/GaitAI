"use client";

/**
 * Article engagement counters — real views and likes, in Firestore.
 *
 *   articleStats/{slug} → { views: number, likes: number, updatedAt }
 *
 * WHY THIS SHAPE. It reuses the Firestore instance the comment system already
 * configures, so no second analytics stack is introduced, and it keeps stats
 * out of `data/insights.ts` entirely: article records stay static and
 * versioned, counters stay dynamic. Nothing is duplicated between the two.
 *
 * HOW A WRITE IS MADE SAFE. The client can only ever ask for a single-step
 * change, and `firestore.rules` enforces it: one write may move `views` by +1
 * or `likes` by ±1, never both, never more, and no other field may appear. A
 * hostile client cannot set views to a million; it can only call the same +1
 * repeatedly, which is inherent to any counter a static site can write to and
 * is the trade the brief's "privacy-conscious deduplication" accepts.
 *
 * HOW REPEAT VIEWS ARE PREVENTED. `sessionStorage` holds one key per slug, so
 * a view is registered once per article per browser session — not per render,
 * not per metadata fetch, not when the tab regains visibility, and not when
 * React remounts the component. The increment is fired from an effect that is
 * guarded by that key *before* the network call, and by a module-level set as
 * well, so even two components mounting in the same tick raise one write.
 *
 * PRIVACY. No IP address, no fingerprint, no identifier of any kind is stored
 * or sent. The deduplication key lives only in the reader's own browser and
 * says nothing except "this browser already counted this slug". The document
 * holds two integers and a timestamp; it cannot be traced to a person.
 *
 * DEGRADATION. Every function swallows its own failure. If Firebase is
 * unconfigured, blocked or offline, reads return nothing and writes are
 * dropped, and every surface renders no counters rather than a zero or a
 * placeholder — the difference between "no data" and "0 views" matters. It is
 * swallowed for the READER, not for the developer: each distinct failure is
 * printed once per page load with the fix in the hint (see reportOnce).
 */

import { fbFail } from "@/lib/firebase-logger";

export type ArticleStats = { views: number; likes: number };

const COLLECTION = "articleStats";

/**
 * Failures here are swallowed by design — a counter that cannot be read must
 * not break an article — but swallowing them SILENTLY is how this feature sat
 * broken in production without anyone noticing: the rules granting access to
 * `articleStats` were written in the same commit as the feature and never
 * published, so every read and every write returned `permission-denied` and
 * every surface simply showed nothing.
 *
 * So each distinct failure is now reported once per page load through the
 * project's existing Firebase logger, whose hint for `permission-denied` is
 * exactly the fix: publish `firestore.rules`. Once per operation, so a page
 * with several cards does not print the same line five times.
 */
const reported = new Set<string>();

function reportOnce(step: string, err: unknown) {
  if (reported.has(step)) return;
  reported.add(step);
  fbFail(`articleStats · ${step}`, err);
}

const viewedKey = (slug: string) => `gaitai:viewed:${slug}`;
export const likedKey = (slug: string) => `gaitai:liked:${slug}`;

/** Slugs this page load has already counted, so two mounts raise one write. */
const countedThisLoad = new Set<string>();

async function firestore() {
  const [fs, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("@/lib/firebase"),
  ]);
  return { fs, db };
}

/** Every slug's counters, in one read rather than one per article. */
export async function fetchAllArticleStats(): Promise<Record<string, ArticleStats>> {
  try {
    const { fs, db } = await firestore();
    const snap = await fs.getDocs(fs.collection(db, COLLECTION));
    const out: Record<string, ArticleStats> = {};
    snap.forEach((doc) => {
      const data = doc.data() as { views?: unknown; likes?: unknown };
      out[doc.id] = {
        views: typeof data.views === "number" ? data.views : 0,
        likes: typeof data.likes === "number" ? data.likes : 0,
      };
    });
    return out;
  } catch (err) {
    reportOnce("read all", err);
    return {};
  }
}

/**
 * The same read, shared. Several cards on one page each need the whole map,
 * so the first caller's promise is remembered and the rest await it — one
 * network read per page load however many cards ask. Not a long-lived cache:
 * it lives as long as the page does, and a reload gets fresh numbers.
 */
let allStatsPromise: Promise<Record<string, ArticleStats>> | null = null;

export function fetchAllArticleStatsCached() {
  allStatsPromise ??= fetchAllArticleStats();
  return allStatsPromise;
}

export async function fetchArticleStats(slug: string): Promise<ArticleStats | null> {
  try {
    const { fs, db } = await firestore();
    const snap = await fs.getDoc(fs.doc(db, COLLECTION, slug));
    if (!snap.exists()) return { views: 0, likes: 0 };
    const data = snap.data() as { views?: unknown; likes?: unknown };
    return {
      views: typeof data.views === "number" ? data.views : 0,
      likes: typeof data.likes === "number" ? data.likes : 0,
    };
  } catch (err) {
    reportOnce("read one", err);
    return null;
  }
}

/** True when this browser session has already counted a view for `slug`. */
export function alreadyViewed(slug: string): boolean {
  if (countedThisLoad.has(slug)) return true;
  try {
    return sessionStorage.getItem(viewedKey(slug)) === "1";
  } catch {
    /* Storage blocked (private mode, cookie policy). Fall back to the
       per-load set: one view per page load rather than none. */
    return false;
  }
}

/**
 * Register one view. Returns the increment that was applied — 1 when a write
 * was made, 0 when this session had already counted it or the write failed —
 * so the caller can show the number the reader actually contributed to without
 * a second read.
 */
export async function registerView(slug: string): Promise<0 | 1> {
  if (alreadyViewed(slug)) return 0;

  /* Claim it before awaiting anything: two mounts in one tick must not both
     get past this line. This is per page load only — the durable marker is
     written below, and only if the write actually lands. */
  countedThisLoad.add(slug);

  try {
    const { fs, db } = await firestore();
    await fs.setDoc(
      fs.doc(db, COLLECTION, slug),
      {
        views: fs.increment(1),
        /* Written as increment(0) so the field exists after a first write and
           the rules can compare deltas on every subsequent one. */
        likes: fs.increment(0),
        updatedAt: fs.serverTimestamp(),
      },
      { merge: true },
    );

    /* AFTER the write, never before.
       `gaitai:viewed:<slug>` means "this browser has a view recorded for this
       article", and it used to be set before the request went out — so any
       failed write left the session permanently marked and the article stuck
       on whatever it first read. That is not hypothetical: when the counter
       documents were deleted after testing, browsers that had already been
       marked could never write again and sat on "0 views" for the life of the
       session. Setting it here keeps one view per session per article while
       making a failure retryable on the next page load. */
    try {
      sessionStorage.setItem(viewedKey(slug), "1");
    } catch {
      /* Storage blocked. `countedThisLoad` still holds for this page load, so
         the write is not repeated here; the next load may count again, which
         is the honest outcome when a browser refuses to remember anything. */
    }
    return 1;
  } catch (err) {
    /* Nothing was recorded, so nothing should look as though it was. Release
       the per-load claim: a later attempt in this same load can still
       succeed, and it cannot double-count because the write did not happen. */
    countedThisLoad.delete(slug);
    reportOnce("count a view", err);
    return 0;
  }
}

export function hasLiked(slug: string): boolean {
  try {
    return localStorage.getItem(likedKey(slug)) === "1";
  } catch {
    return false;
  }
}

/**
 * Like or unlike. One like per browser, held in `localStorage` so it survives
 * a session, and a single ±1 step so the rules accept it. Returns the applied
 * delta, or 0 if the write failed.
 */
export async function toggleLike(slug: string, next: boolean): Promise<-1 | 0 | 1> {
  const delta = next ? 1 : -1;
  try {
    const { fs, db } = await firestore();
    await fs.setDoc(
      fs.doc(db, COLLECTION, slug),
      {
        likes: fs.increment(delta),
        views: fs.increment(0),
        updatedAt: fs.serverTimestamp(),
      },
      { merge: true },
    );
    try {
      if (next) localStorage.setItem(likedKey(slug), "1");
      else localStorage.removeItem(likedKey(slug));
    } catch {
      /* The count is stored; only this browser's memory of it is lost. */
    }
    return delta;
  } catch (err) {
    reportOnce("record a like", err);
    return 0;
  }
}

/**
 * The exact count with thousands separators — "1,248 views" — for the article's
 * own metadata row, where there is room for the real number and rounding a
 * figure the reader is part of would be a small lie.
 */
export function formatExact(n: number, singular: string, plural = `${singular}s`) {
  return `${n.toLocaleString("en-US")} ${n === 1 ? singular : plural}`;
}

/**
 * Editorial count formatting: "1 view", "24 views", "1.2K views".
 * Thousands are shown to one decimal, and a trailing ".0" is dropped so 12000
 * reads "12K" rather than "12.0K".
 */
export function formatCount(n: number, singular: string, plural = `${singular}s`) {
  const noun = n === 1 ? singular : plural;
  if (n < 1000) return `${n} ${noun}`;
  if (n < 1_000_000) {
    const k = (n / 1000).toFixed(1).replace(/\.0$/, "");
    return `${k}K ${noun}`;
  }
  const m = (n / 1_000_000).toFixed(1).replace(/\.0$/, "");
  return `${m}M ${noun}`;
}
