"use client";

/**
 * ASK GAITAI USAGE COUNTERS — five integers per page type, and nothing else.
 *
 *   assistantStats/{pageType} → { opens, questions, prompts, links, updatedAt }
 *
 * WHAT IS COUNTED
 *   opens      the launcher was pressed
 *   questions  a question was submitted
 *   prompts    a suggested prompt was chosen rather than typed
 *   links      a source, inline link or CTA in an answer was followed
 *
 * WHAT IS NOT, AND CANNOT BE
 * No question text. No answer text. No thread. No identifier of any kind — no
 * IP, no cookie, no fingerprint, no session id. The document key is the PAGE
 * TYPE the assistant was used on ("product", "gaitscape", "research", …), which
 * is a closed set of sixteen values from `page-context.ts` and says nothing
 * about a person. That is a deliberate ceiling: the brief asks for privacy-
 * conscious analytics and warns against storing sensitive free text, so the
 * design makes storing it impossible rather than merely discouraged. If a
 * question ever needs to be read, it will be because someone chose to add that
 * on purpose, with its own disclosure — not because this file quietly allowed
 * it.
 *
 * WHY FIRESTORE COUNTERS. The site is a static export with no server, and the
 * journal already writes view and like counters this way. Reusing that shape
 * means no second analytics stack, no third-party script, nothing to consent
 * to, and no bytes on the critical path.
 *
 * HOW A WRITE IS MADE SAFE. `firestore.rules` allows exactly one counter to
 * move by exactly +1 per write, on a document whose id is one of the sixteen
 * known page types. A hostile client cannot set a counter to an arbitrary
 * value; it can only ask for "one more" and be told yes. Reads are admin-only,
 * because unlike the journal's view count these numbers are not published.
 *
 * DEDUPLICATION. `opens` is counted once per page type per browser session,
 * which is the question worth answering ("where do people reach for this?")
 * rather than "how many times did someone toggle the panel". Questions,
 * prompts and links are counted every time, because each is a distinct act.
 *
 * DEGRADATION. Every call swallows its own failure. Firebase unconfigured,
 * blocked, offline or rule-denied all resolve to nothing happening — the
 * assistant never surfaces an analytics error to a visitor, and never waits
 * on one.
 */

const COLLECTION = "assistantStats";

/** Mirrors PageType in components/assistant/page-context.ts. */
const KNOWN_PAGE_TYPES = new Set([
  "home",
  "product",
  "family",
  "products",
  "use-case",
  "use-cases",
  "publication",
  "publications",
  "insight",
  "insights",
  "research",
  "gaitscape",
  "movement-lab",
  "trust",
  "legal",
  "other",
]);

export type AssistantMetric = "opens" | "questions" | "prompts" | "links";

const METRICS: AssistantMetric[] = ["opens", "questions", "prompts", "links"];

/** Page types whose `opens` this browser session has already counted. */
const openedThisSession = new Set<string>();

/**
 * Raise one counter by one.
 *
 * Fire-and-forget on purpose: nothing in the assistant's behaviour depends on
 * the result, so the call is never awaited on a path a visitor is waiting on.
 */
export function recordAssistantEvent(
  metric: AssistantMetric,
  pageType: string,
): void {
  /* An unknown page type would create an unbounded set of documents, and the
     rules refuse it anyway — fold it into "other" rather than dropping the
     signal. */
  const bucket = KNOWN_PAGE_TYPES.has(pageType) ? pageType : "other";

  if (metric === "opens") {
    const key = `gaitai:ask:opened:${bucket}`;
    if (openedThisSession.has(bucket)) return;
    try {
      if (window.sessionStorage.getItem(key) === "1") {
        openedThisSession.add(bucket);
        return;
      }
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* Storage blocked. The module-level set still stops repeats this load. */
    }
    openedThisSession.add(bucket);
  }

  void (async () => {
    try {
      /* Both imports are dynamic, so the Firestore SDK is fetched only when an
         event is actually recorded — the launcher costs nothing. */
      const [fs, { db }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase"),
      ]);

      /* Every counter is written on the first touch — the absent ones as
         increment(0) — so the fields exist and the rules can compare deltas on
         every subsequent write, exactly as articleStats does. */
      const payload: Record<string, unknown> = {
        updatedAt: fs.serverTimestamp(),
      };
      for (const name of METRICS) {
        payload[name] = fs.increment(name === metric ? 1 : 0);
      }

      await fs.setDoc(fs.doc(db, COLLECTION, bucket), payload, {
        merge: true,
      });
    } catch {
      /* Unconfigured, offline, blocked or denied: the assistant does not care. */
    }
  })();
}
