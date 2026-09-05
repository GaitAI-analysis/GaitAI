/**
 * ABUSE CONTROL — one small Durable Object, no Firebase, no third service.
 * =============================================================================
 * The endpoint is public and every accepted call spends money at the provider,
 * so it needs a real limiter rather than an in-memory counter — a Worker runs
 * in many isolates across many locations, and a per-isolate map is no limit at
 * all. A single Durable Object is the Cloudflare-native answer: one instance
 * (`idFromName("global")`), strongly consistent, SQLite-backed, and available
 * on the Workers Free plan.
 *
 * THREE LIMITS, because they stop different things:
 *   BURST   ASK_BURST_MAX per caller per 2 minutes — a page hammering the endpoint
 *   HOURLY  ASK_HOURLY_MAX per caller per hour     — a slow drain by one visitor
 *   DAILY   ASK_DAILY_BUDGET model calls per UTC day, site-wide — a distributed
 *           drain, or a bug in the client asking in a loop. Past it the Worker
 *           answers 503 and every browser falls back to its extractive answer,
 *           so the assistant keeps working while the bill stops growing.
 *
 * WHAT IS STORED, AND FOR HOW LONG. Per caller: a list of timestamps under a
 * key that is a salted SHA-256 of the connecting IP AND the UTC day, so the
 * identifier rotates daily and cannot be joined across days. Site-wide: one
 * integer per day. No question text, no route, no user agent, nothing else.
 * An alarm prunes callers with no request in the last hour and days older than
 * yesterday, so the object holds at most a day of activity.
 *
 * WHAT THIS DOES NOT DO — said plainly, so nobody assumes it:
 *   · it is not a WAF. Cloudflare's zone-level rate-limiting rules (one rule is
 *     included on the Free plan once ask.gaitai.in is a Cloudflare zone) can
 *     drop floods before they reach the Worker at all, and are the right place
 *     for a request-per-second ceiling. This object meters ACCEPTED requests.
 *   · it does not stop a distributed attacker from spending the daily budget.
 *     It stops them from spending more than the daily budget.
 *   · fail-open: if the object is unreachable the request is allowed. A
 *     limiter outage should degrade the protection, not the site. The
 *     provider's own credit ceiling is the backstop behind this one.
 */

import { DurableObject } from "cloudflare:workers";
import type { AskEnv } from "./env";

export interface GuardLimits {
  burstMax: number;
  hourlyMax: number;
  dailyBudget: number;
}

export interface GuardDecision {
  allowed: boolean;
  reason?: "burst" | "hourly" | "budget";
  /** Seconds until the caller may try again; 0 when allowed. */
  retryAfter: number;
}

const BURST_MS = 2 * 60_000;
const HOURLY_MS = 60 * 60_000;
const PRUNE_EVERY_MS = 6 * 60 * 60_000;

const day = (now: number) => new Date(now).toISOString().slice(0, 10);

export class AskGuard extends DurableObject<AskEnv> {
  /** Consume one unit for `caller`. One transaction, so concurrent requests
   *  from the same caller cannot both read the same pre-increment state. */
  async consume(caller: string, limits: GuardLimits): Promise<GuardDecision> {
    const now = Date.now();
    const callerKey = `c:${caller}`;
    const dayKey = `d:${day(now)}`;

    const stamps = ((await this.ctx.storage.get<number[]>(callerKey)) ?? []).filter(
      (t) => now - t < HOURLY_MS,
    );
    const burst = stamps.filter((t) => now - t < BURST_MS);

    if (limits.burstMax > 0 && burst.length >= limits.burstMax) {
      return {
        allowed: false,
        reason: "burst",
        retryAfter: Math.max(1, Math.ceil((BURST_MS - (now - Math.min(...burst))) / 1000)),
      };
    }
    if (limits.hourlyMax > 0 && stamps.length >= limits.hourlyMax) {
      return {
        allowed: false,
        reason: "hourly",
        retryAfter: Math.max(1, Math.ceil((HOURLY_MS - (now - Math.min(...stamps))) / 1000)),
      };
    }

    const count = (await this.ctx.storage.get<number>(dayKey)) ?? 0;
    if (limits.dailyBudget > 0 && count >= limits.dailyBudget) {
      const midnight = new Date(`${day(now)}T00:00:00.000Z`).getTime() + 86_400_000;
      return {
        allowed: false,
        reason: "budget",
        retryAfter: Math.max(60, Math.ceil((midnight - now) / 1000)),
      };
    }

    stamps.push(now);
    await this.ctx.storage.put({
      [callerKey]: stamps.slice(-Math.max(limits.hourlyMax, 1)),
      [dayKey]: count + 1,
    });

    if ((await this.ctx.storage.getAlarm()) === null) {
      await this.ctx.storage.setAlarm(now + PRUNE_EVERY_MS);
    }
    return { allowed: true, retryAfter: 0 };
  }

  /** Housekeeping: forget callers idle for an hour and days before yesterday. */
  async alarm(): Promise<void> {
    const now = Date.now();
    const keep = new Set([day(now), day(now - 86_400_000)]);
    const stale: string[] = [];

    const callers = await this.ctx.storage.list<number[]>({ prefix: "c:" });
    for (const [key, stamps] of callers) {
      if (!stamps.some((t) => now - t < HOURLY_MS)) stale.push(key);
    }
    const days = await this.ctx.storage.list<number>({ prefix: "d:" });
    for (const key of days.keys()) {
      if (!keep.has(key.slice(2))) stale.push(key);
    }
    if (stale.length) await this.ctx.storage.delete(stale);

    await this.ctx.storage.setAlarm(now + PRUNE_EVERY_MS);
  }
}

/**
 * Identify the caller without storing an identity: SHA-256 of the connecting
 * IP, the UTC day and a salt, truncated. Rotates daily by construction.
 */
export async function callerKey(request: Request, salt = "gaitai-ask"): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const bytes = new TextEncoder().encode(`${salt}:${day(Date.now())}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Ask the guard; on any failure, allow. */
export async function consume(
  env: AskEnv,
  caller: string,
  limits: GuardLimits,
): Promise<GuardDecision> {
  if (!env.ASK_GUARD) return { allowed: true, retryAfter: 0 };
  try {
    const stub = env.ASK_GUARD.get(env.ASK_GUARD.idFromName("global"));
    return await stub.consume(caller, limits);
  } catch {
    return { allowed: true, retryAfter: 0 };
  }
}
