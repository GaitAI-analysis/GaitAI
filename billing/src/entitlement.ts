/**
 * THE ENTITLEMENT RULE — the only place that decides whether an account may
 * use a product. Derived from the ledger, never from the device.
 *
 *   active         paid for the current period → entitled until current_end,
 *                  plus RENEWAL_GRACE so a late renewal webhook does not
 *                  interrupt a paying customer.
 *   authenticated  first payment authorised, cycle about to start → entitled
 *                  until charge_at (or current_end) plus grace.
 *   pending        a renewal failed and the gateway is retrying → entitled
 *                  for PENDING_GRACE after current_end, then locked.
 *   halted         retries exhausted → not entitled.
 *   cancelled      → entitled only until the end of the period already paid
 *                  (cancel at cycle end); an immediate cancel has no future
 *                  period and is therefore locked.
 *   completed / expired / created → not entitled.
 *   refunded_at    set when the latest payment was refunded → not entitled,
 *                  whatever the status says.
 *
 * Each product is judged on its own subscriptions. Nothing in here looks at
 * the other product, so a MobilityCare plan can never unlock SecureVision.
 */
import type { Product } from "./catalog";
import type { Config } from "./env";
import type { SubscriptionRow } from "./db";
import { importEd25519Private, signJwtEd25519 } from "./crypto";

export type EntitlementState = "active" | "grace" | "pending" | "cancelled" | "expired" | "halted" | "refunded" | "none" | "awaiting_payment";

export interface Entitlement {
  product: Product;
  entitled: boolean;
  state: EntitlementState;
  /** Unix seconds until which access is granted (null when not entitled). */
  until: number | null;
  /** The subscription this verdict comes from, if any. */
  subscriptionId: string | null;
  cycle: SubscriptionRow["cycle"] | null;
  renewsAt: number | null;
  cancelAtCycleEnd: boolean;
  reason: string;
}

export function evaluateSubscription(sub: SubscriptionRow, config: Config, now: number): Entitlement {
  const base = {
    product: sub.product,
    subscriptionId: sub.id,
    cycle: sub.cycle,
    renewsAt: sub.charge_at,
    cancelAtCycleEnd: sub.cancel_at_cycle_end === 1,
  };
  const none = (state: EntitlementState, reason: string): Entitlement => ({ ...base, entitled: false, state, until: null, reason });
  const yes = (state: EntitlementState, until: number, reason: string): Entitlement =>
    until > now ? { ...base, entitled: true, state, until, reason } : none("expired", `${reason}; period ended`);

  if (sub.refunded_at) return none("refunded", "the latest payment was refunded");
  switch (sub.status) {
    case "active": {
      const end = sub.current_end ?? sub.charge_at;
      if (!end) return yes("active", now + config.renewalGraceSeconds, "active, period end unknown");
      return yes("active", end + config.renewalGraceSeconds, "paid for the current period");
    }
    case "authenticated": {
      const end = sub.current_end ?? sub.charge_at ?? now;
      return yes("active", end + config.renewalGraceSeconds, "first payment authorised");
    }
    case "pending": {
      const end = sub.current_end ?? now;
      return yes("grace", end + config.pendingGraceSeconds, "renewal failed, gateway retrying");
    }
    case "cancelled": {
      // Cancelled at cycle end: the gateway ends it when the paid period ends
      // (ended_at ≈ current_end). Cancelled immediately: ended_at is now.
      const until = sub.ended_at ?? sub.current_end;
      if (until && until > now) return yes("cancelled", until, "cancelled; access until the paid period ends");
      return none("cancelled", "cancelled");
    }
    case "halted":
      return none("halted", "renewal retries exhausted");
    case "completed":
      return none("expired", "all billing cycles completed");
    case "expired":
      return none("expired", "authorisation window expired");
    case "created":
    default:
      return none("awaiting_payment", "checkout not completed");
  }
}

/** The best verdict across every subscription an account holds for a product. */
export function evaluateProduct(product: Product, subs: SubscriptionRow[], config: Config, now: number): Entitlement {
  const mine = subs.filter((s) => s.product === product);
  if (!mine.length) return { product, entitled: false, state: "none", until: null, subscriptionId: null, cycle: null, renewsAt: null, cancelAtCycleEnd: false, reason: "no subscription" };
  const verdicts = mine.map((s) => evaluateSubscription(s, config, now));
  const entitled = verdicts.filter((v) => v.entitled).sort((a, b) => (b.until ?? 0) - (a.until ?? 0));
  if (entitled.length) return entitled[0];
  // Not entitled: report the most recent subscription's state so the UI can explain.
  const rank: Record<EntitlementState, number> = { active: 0, grace: 0, cancelled: 1, pending: 1, awaiting_payment: 2, halted: 3, refunded: 3, expired: 4, none: 5 };
  return verdicts.sort((a, b) => rank[a.state] - rank[b.state])[0];
}

/* ── Signed entitlement token (offline cache for the app) ───────────────── */

export async function issueEntitlementToken(env: { ENTITLEMENT_PRIVATE_JWK?: string }, config: Config, uid: string, e: Entitlement, now: number): Promise<string | null> {
  if (!env.ENTITLEMENT_PRIVATE_JWK || !e.entitled || !e.until) return null;
  const key = await importEd25519Private(env.ENTITLEMENT_PRIVATE_JWK);
  const kid = (JSON.parse(env.ENTITLEMENT_PRIVATE_JWK) as { kid?: string }).kid ?? "ent";
  const exp = Math.min(e.until, now + config.entitlementTokenSeconds);
  return signJwtEd25519(key, kid, {
    iss: "gaitai-billing",
    sub: uid,
    prod: e.product,
    ent: true,
    state: e.state,
    until: e.until,
    sid: e.subscriptionId,
    iat: now,
    exp,
  });
}

export async function issueAnalysisGrant(env: { ENTITLEMENT_PRIVATE_JWK?: string }, config: Config, uid: string, product: Product, kind: string, now: number): Promise<string | null> {
  if (!env.ENTITLEMENT_PRIVATE_JWK) return null;
  const key = await importEd25519Private(env.ENTITLEMENT_PRIVATE_JWK);
  const kid = (JSON.parse(env.ENTITLEMENT_PRIVATE_JWK) as { kid?: string }).kid ?? "ent";
  return signJwtEd25519(key, kid, { iss: "gaitai-billing", sub: uid, prod: product, kind, typ: "grant", iat: now, exp: now + config.analysisGrantSeconds });
}
