/**
 * ABUSE CONTROL
 * =============================================================================
 * The endpoint is public and it spends money on every model call, so it needs
 * a real limiter rather than an in-memory counter — Cloud Run scales to many
 * instances and an in-process map is per-instance, which is no limit at all.
 *
 * State lives in Firestore, written by the Admin SDK (which bypasses the
 * client security rules; no client can read or write these collections):
 *
 *   askGaitaiRateLimits/{key}   per caller. The key is a salted SHA-256 of the
 *                               caller's IP: enough to count them, not enough
 *                               to recover the address from the database.
 *   askGaitaiBudget/{yyyy-mm-dd} one counter for the whole site per UTC day.
 *
 * Both carry an `expireAt` field for a Firestore TTL policy, so the
 * collections self-empty. Enable it once in the console:
 *   Firestore → Time-to-live → askGaitaiRateLimits.expireAt, askGaitaiBudget.expireAt
 *
 * THREE LIMITS, because they stop different things:
 *   BURST   8 questions per 2 minutes per caller — a page hammering the endpoint
 *   HOURLY  40 questions per hour per caller — a slow drain by one visitor
 *   DAILY   a site-wide ceiling on model calls per day — a distributed drain,
 *           or a bug in the client asking in a loop. Configured by the
 *           ASK_DAILY_BUDGET parameter; when it is hit the function answers
 *           503 and every browser falls back to the extractive answer, so the
 *           assistant keeps working while the bill stops growing.
 *
 * FAIL-OPEN, DELIBERATELY. On a Firestore failure the request is ALLOWED: a
 * limiter outage should degrade the protection, not the site. The provider's
 * own credit ceiling is the backstop behind this one.
 */

import { createHash } from "node:crypto";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

const CALLERS = "askGaitaiRateLimits";
const BUDGET = "askGaitaiBudget";

const BURST = { windowMs: 2 * 60_000, max: 8 };
const HOURLY = { windowMs: 60 * 60_000, max: 40 };

export interface LimitDecision {
  allowed: boolean;
  /** Seconds until the caller may try again; 0 when allowed. */
  retryAfter: number;
}

/**
 * Identify the caller without storing an identity.
 *
 * `x-forwarded-for` on Cloud Run is `<client>, <proxies…>`; the first entry is
 * the one to count. The salt is the project id, which is not secret but does
 * keep the digests from being a rainbow table of IPv4 space.
 */
export function callerKey(forwardedFor: string | string[] | undefined, fallback: string | undefined): string {
  const header = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const ip = (header?.split(",")[0] ?? fallback ?? "unknown").trim();
  const salt = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? "gaitai";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Consume one unit of the caller's quota.
 *
 * A transaction, so two concurrent requests from the same caller cannot both
 * read the same pre-increment state.
 */
export async function consumeCaller(key: string): Promise<LimitDecision> {
  const now = Date.now();
  const db = getFirestore();
  const ref = db.collection(CALLERS).doc(key);

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const data = (snapshot.data() ?? {}) as { burst?: number[]; hourly?: number[] };
      const burst = (data.burst ?? []).filter((t) => now - t < BURST.windowMs);
      const hourly = (data.hourly ?? []).filter((t) => now - t < HOURLY.windowMs);

      if (burst.length >= BURST.max) {
        const oldest = Math.min(...burst);
        return { allowed: false, retryAfter: Math.ceil((BURST.windowMs - (now - oldest)) / 1000) };
      }
      if (hourly.length >= HOURLY.max) {
        const oldest = Math.min(...hourly);
        return { allowed: false, retryAfter: Math.ceil((HOURLY.windowMs - (now - oldest)) / 1000) };
      }

      burst.push(now);
      hourly.push(now);
      tx.set(ref, {
        burst,
        /* Bounded so one caller's document cannot grow without limit. */
        hourly: hourly.slice(-HOURLY.max),
        updatedAt: FieldValue.serverTimestamp(),
        expireAt: Timestamp.fromMillis(now + HOURLY.windowMs * 2),
      });
      return { allowed: true, retryAfter: 0 };
    });
  } catch {
    return { allowed: true, retryAfter: 0 };
  }
}

/** The UTC day, as the budget document's id. */
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Consume one model call from the site-wide daily budget.
 *
 * Counted only for calls that will actually reach the provider: a question
 * retrieval refuses locally never gets here.
 */
export async function consumeBudget(dailyMax: number): Promise<LimitDecision> {
  if (!Number.isFinite(dailyMax) || dailyMax <= 0) return { allowed: true, retryAfter: 0 };

  const db = getFirestore();
  const id = today();
  const ref = db.collection(BUDGET).doc(id);

  try {
    return await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const count = Number((snapshot.data() as { count?: number } | undefined)?.count ?? 0);
      if (count >= dailyMax) {
        const midnight = new Date(`${id}T00:00:00.000Z`).getTime() + 86_400_000;
        return { allowed: false, retryAfter: Math.max(60, Math.ceil((midnight - Date.now()) / 1000)) };
      }
      tx.set(
        ref,
        {
          count: count + 1,
          updatedAt: FieldValue.serverTimestamp(),
          expireAt: Timestamp.fromMillis(Date.now() + 3 * 86_400_000),
        },
        { merge: true },
      );
      return { allowed: true, retryAfter: 0 };
    });
  } catch {
    return { allowed: true, retryAfter: 0 };
  }
}
