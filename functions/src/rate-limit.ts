/**
 * ABUSE CONTROL
 * =============================================================================
 * The endpoint is public and it spends money on every call, so it needs a real
 * limiter rather than an in-memory counter — Cloud Run scales to many instances
 * and an in-process map is per-instance, which is no limit at all.
 *
 * State lives in Firestore under `askGaitaiRateLimits/{key}`. The key is a
 * salted SHA-256 of the caller's IP: enough to count them, not enough to
 * recover the address from the database. Documents carry a TTL field so the
 * collection self-empties.
 *
 * Two windows, because they stop different things:
 *   BURST  — 8 questions per 2 minutes, against a page hammering the endpoint.
 *   HOURLY — 40 questions per hour, against a slow drain of the API budget.
 */

import { createHash } from "node:crypto";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const COLLECTION = "askGaitaiRateLimits";

const BURST = { windowMs: 2 * 60_000, max: 8 };
const HOURLY = { windowMs: 60 * 60_000, max: 40 };

export interface RateLimitVerdict {
  allowed: boolean;
  /** Seconds until the caller may retry — sent as Retry-After. */
  retryAfter: number;
}

/**
 * Identify the caller without storing an identity.
 *
 * `x-forwarded-for` on Cloud Run is `<client>, <proxies…>`; the first entry is
 * the one to count. The salt is the Firebase project id, which is not secret
 * but does keep the digests from being a rainbow-table of IPv4 space.
 */
export function callerKey(
  forwardedFor: string | undefined,
  fallback: string | undefined,
): string {
  const ip = (forwardedFor?.split(",")[0] ?? fallback ?? "unknown").trim();
  const salt = process.env.GCLOUD_PROJECT ?? process.env.GCP_PROJECT ?? "gaitai";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

interface LimitDoc {
  burst?: number[];
  hourly?: number[];
}

/**
 * Consume one unit of quota for `key`.
 *
 * Runs as a transaction so two concurrent requests from the same caller cannot
 * both read the same pre-increment state. On a Firestore failure the request is
 * ALLOWED: a limiter outage should degrade the protection, not the site.
 */
export async function consume(key: string): Promise<RateLimitVerdict> {
  const now = Date.now();
  const ref = getFirestore().collection(COLLECTION).doc(key);

  try {
    return await getFirestore().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      const data = (snapshot.data() as LimitDoc | undefined) ?? {};

      const burst = (data.burst ?? []).filter((t) => now - t < BURST.windowMs);
      const hourly = (data.hourly ?? []).filter((t) => now - t < HOURLY.windowMs);

      if (burst.length >= BURST.max) {
        const oldest = Math.min(...burst);
        return {
          allowed: false,
          retryAfter: Math.ceil((BURST.windowMs - (now - oldest)) / 1000),
        };
      }
      if (hourly.length >= HOURLY.max) {
        const oldest = Math.min(...hourly);
        return {
          allowed: false,
          retryAfter: Math.ceil((HOURLY.windowMs - (now - oldest)) / 1000),
        };
      }

      burst.push(now);
      hourly.push(now);

      tx.set(ref, {
        burst,
        /* Bounded so one caller's document cannot grow without limit. */
        hourly: hourly.slice(-HOURLY.max),
        updatedAt: FieldValue.serverTimestamp(),
        /* Firestore TTL policy field — see docs/ask-gaitai.md. */
        expireAt: Timestamp.fromMillis(now + HOURLY.windowMs * 2),
      });

      return { allowed: true, retryAfter: 0 };
    });
  } catch {
    return { allowed: true, retryAfter: 0 };
  }
}
