/**
 * Billing: Google Play Billing behind one interface, with a clearly marked
 * development entitlement that can never be mistaken for a purchase.
 *
 * States the app has to render (all of them reachable through `BillingState`):
 * unavailable, loading, ready, purchasing, pending, purchased, cancelled,
 * failed, restored, expired, grace. Prices come from the store's product
 * metadata; nothing here hardcodes a public price.
 */
import type { Entitlement } from "@gaitai/core";

export const SUBSCRIPTIONS = {
  mobilitycare: { monthly: "mobilitycare_pro_monthly", yearly: "mobilitycare_pro_yearly" },
  securevision: { monthly: "securevision_pro_monthly", yearly: "securevision_pro_yearly" },
} as const;

export type Plan = "monthly" | "yearly";

export interface StoreProduct {
  productId: string;
  plan: Plan;
  /** Localised price string from the store, e.g. "₹499.00". Never hardcoded. */
  localizedPrice: string;
  currency: string;
  /** Free-trial or intro offer text from the store, when configured. */
  offer?: string;
}

export type BillingStatus =
  | "unavailable" | "loading" | "ready" | "purchasing" | "pending"
  | "purchased" | "cancelled" | "failed" | "restored" | "expired" | "grace";

export interface BillingState {
  status: BillingStatus;
  products: StoreProduct[];
  entitlement: Entitlement;
  /** Human-readable reason for unavailable/failed. */
  message?: string;
}

export interface BillingProvider {
  readonly name: "play" | "dev";
  init(): Promise<BillingState>;
  purchase(productId: string): Promise<BillingState>;
  restore(): Promise<BillingState>;
  /** Re-read the entitlement (e.g. on app foreground). */
  refresh(): Promise<BillingState>;
  manageUrl(): string | null;
}

const FREE: Entitlement = { tier: "free", source: "none" };

/**
 * Google Play provider. This build declares the interface and the state
 * machine but does not link the Play Billing client yet: that library is
 * added when the apps enter Internal Testing and the founder has created the
 * subscription products in Play Console. Until then the provider reports
 * `unavailable` with an explanation, and the UI shows that state honestly.
 */
export class PlayBillingProvider implements BillingProvider {
  readonly name = "play" as const;
  constructor(private readonly productIds: { monthly: string; yearly: string }) {}
  async init(): Promise<BillingState> {
    return { status: "unavailable", products: [], entitlement: FREE,
      message: "Google Play subscriptions are not configured for this build yet. Purchases will be available once the app is in Play Internal Testing." };
  }
  async purchase(): Promise<BillingState> { return this.init(); }
  async restore(): Promise<BillingState> { return this.init(); }
  async refresh(): Promise<BillingState> { return this.init(); }
  manageUrl(): string | null { return `https://play.google.com/store/account/subscriptions?sku=${this.productIds.monthly}`; }
}

/**
 * Development entitlement. Compiled only into development builds (the app
 * checks `__DEV__` before constructing it). It shows no prices, performs no
 * purchase and labels itself everywhere as a DEV entitlement.
 */
export class DevEntitlementProvider implements BillingProvider {
  readonly name = "dev" as const;
  private pro = false;
  constructor(private readonly persist: { get(): Promise<boolean>; set(v: boolean): Promise<void> }) {}
  private state(): BillingState {
    return {
      status: this.pro ? "purchased" : "ready",
      products: [],
      entitlement: this.pro ? { tier: "pro", source: "dev", productId: "dev_entitlement" } : FREE,
      message: "DEVELOPMENT ENTITLEMENT — not a purchase. Toggle from Profile → Developer.",
    };
  }
  async init() { this.pro = await this.persist.get(); return this.state(); }
  async purchase() { this.pro = true; await this.persist.set(true); return this.state(); }
  async restore() { return this.init(); }
  async refresh() { return this.init(); }
  async revoke() { this.pro = false; await this.persist.set(false); return this.state(); }
  manageUrl() { return null; }
}

export function isPro(e: Entitlement): boolean {
  if (e.tier !== "pro") return false;
  if (e.expiresAt && new Date(e.expiresAt).getTime() < Date.now() && !e.inGracePeriod) return false;
  return true;
}
