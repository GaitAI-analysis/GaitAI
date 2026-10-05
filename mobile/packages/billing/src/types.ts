/**
 * Billing types shared by the Google Play provider and the development
 * entitlement. Prices come from the store's product metadata; nothing in this
 * package hardcodes a public price, currency or billing period.
 */
import type { Entitlement } from "@gaitai/core";

/** Play Console product IDs. Each is a subscription with one base plan per period. */
export const SUBSCRIPTIONS = {
  mobilitycare: { monthly: "mobilitycare_pro_monthly", yearly: "mobilitycare_pro_yearly" },
  securevision: { monthly: "securevision_pro_monthly", yearly: "securevision_pro_yearly" },
} as const;

export type Plan = "monthly" | "yearly";

export interface StoreProduct {
  productId: string;
  plan: Plan;
  /** Store title for the subscription. */
  title: string;
  /** Localised recurring price string from the store, e.g. "₹499.00". Never hardcoded. */
  localizedPrice: string;
  /** ISO 4217 code from the store. */
  currency: string;
  /** Recurring price in micro-units from the store (for comparisons only, never for display). */
  priceMicros: number;
  /** Recurring billing period from the store as ISO 8601, e.g. "P1M", "P1Y". */
  billingPeriod: string;
  /** Free-trial or introductory-price sentence derived from the store's pricing phases, when offered. */
  offer?: string;
  /** Play offer token to purchase this plan with; absent when the store returned no offer. */
  offerToken?: string;
  basePlanId?: string;
}

export type BillingStatus =
  | "unavailable" | "loading" | "ready" | "purchasing" | "pending"
  | "purchased" | "cancelled" | "failed" | "restored" | "expired" | "grace";

export interface BillingState {
  status: BillingStatus;
  products: StoreProduct[];
  entitlement: Entitlement;
  /** Human-readable explanation for unavailable/failed/pending/restored. */
  message?: string;
}

export interface BillingProvider {
  readonly name: "play" | "dev";
  init(): Promise<BillingState>;
  purchase(productId: string): Promise<BillingState>;
  restore(): Promise<BillingState>;
  /** Re-read the entitlement (e.g. on app foreground). */
  refresh(): Promise<BillingState>;
  /** Pushes states that arrive outside a call, e.g. a pending purchase that clears. */
  subscribe(listener: (s: BillingState) => void): () => void;
  /** Opens the store's subscription management UI. Resolves false when it could not. */
  manage(): Promise<boolean>;
  manageUrl(): string | null;
  dispose(): void;
}

export const FREE_ENTITLEMENT: Entitlement = { status: "FREE", tier: "free", source: "none" };

/** "P1M" → "month", "P1Y" → "year", "P7D" → "7 days", "P3M" → "3 months". */
export function periodLabel(iso?: string): string {
  if (!iso) return "period";
  const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(iso);
  if (!m) return iso;
  const [y, mo, w, d] = m.slice(1).map((v) => (v ? Number(v) : 0));
  const [name, n] = y ? ["year", y] : mo ? ["month", mo] : w ? ["week", w] : ["day", d];
  return n === 1 ? String(name) : `${n} ${name}s`;
}

/** "P1M" × 3 → "3 months"; "P7D" × 1 → "7 days". */
export function spanLabel(iso: string, cycles: number): string {
  if (cycles <= 1) return periodLabel(iso);
  const one = periodLabel(iso);
  return /^\d/.test(one) ? `${cycles} × ${one}` : `${cycles} ${one}s`;
}

/** Whole-percent saving of the yearly plan against twelve monthly payments, from store prices. Null when not comparable. */
export function yearlySavingsPercent(monthly?: StoreProduct, yearly?: StoreProduct): number | null {
  if (!monthly || !yearly || monthly.currency !== yearly.currency) return null;
  if (monthly.billingPeriod !== "P1M" || yearly.billingPeriod !== "P1Y") return null;
  if (!(monthly.priceMicros > 0) || !(yearly.priceMicros > 0)) return null;
  const pct = Math.round((1 - yearly.priceMicros / (monthly.priceMicros * 12)) * 100);
  return pct > 0 ? pct : null;
}

/** Copy for the Profile card and the paywall, by entitlement status. */
export function describeEntitlement(e: Entitlement): { title: string; body: string } {
  switch (e.status) {
    case "PRO":
      return e.source === "dev"
        ? { title: "GaitAI Pro · development entitlement", body: "Development entitlement. Not a purchase; never present in release builds." }
        : { title: "GaitAI Pro", body: e.reason ?? "Active through Google Play." };
    case "PENDING":
      return { title: "Pro purchase pending", body: e.reason ?? "Google Play is still confirming the payment. Pro unlocks automatically once it clears." };
    case "EXPIRED":
      return { title: "Pro has ended", body: e.reason ?? "This subscription is no longer active. Resubscribe from the paywall or Google Play to continue." };
    case "UNKNOWN":
      return { title: "Subscription not verified", body: e.reason ?? "Google Play could not be reached to confirm a subscription. Pro stays locked until it can be checked." };
    default:
      return { title: "Free", body: "Cadence and step-time balance are included. Pro adds the full analysis." };
  }
}
