/**
 * ServerBillingProvider — the GaitAI subscription service behind the same
 * BillingProvider interface the store providers implement.
 *
 * The difference is where the truth lives. The store providers ask Google
 * Play or StoreKit on the device; this one asks the GaitAI billing Worker,
 * which holds the ledger of Razorpay subscriptions and re-derives the
 * verdict from it on every call. The device keeps only a short-lived SIGNED
 * token for offline spells, verified with the Worker's public key, and
 * nothing in AsyncStorage is ever treated as a grant.
 *
 * Purchase is a hosted checkout: the Worker creates the gateway
 * subscription and hands back a URL; the app shows it in a WebView; the
 * page verifies the signed result with the Worker; the app re-reads its
 * entitlement. Nothing about money is decided on the phone.
 */
import { BILLING_MODE, BillingApiError, billingApi, entitlementTokenStore, rememberKeys, verifyEntitlementToken, type Catalog, type Cycle, type ProductId, type ServerEntitlement, type SubscriptionView } from "@gaitai/api";
import type { Entitlement } from "@gaitai/core";
import { FREE_ENTITLEMENT, type BillingProvider, type BillingState, type StoreProduct } from "./types";

export interface ServerBillingConfig {
  product: ProductId;
  /** Resolves the signed-in account's uid, or null when signed out. */
  uid: () => Promise<string | null>;
  log?: (event: string, data?: Record<string, unknown>) => void;
}

const CYCLE_ISO: Record<Cycle, string> = { monthly: "P1M", annual: "P1Y" };

export function toServerEntitlement(e: ServerEntitlement, checkedAt = new Date().toISOString()): Entitlement {
  const expiresAt = e.until ? new Date(e.until * 1000).toISOString() : undefined;
  if (e.entitled) {
    return {
      status: "PRO",
      tier: "pro",
      source: "server",
      productId: e.subscriptionId ?? undefined,
      expiresAt,
      inGracePeriod: e.state === "grace",
      checkedAt,
      reason: e.state === "grace" ? "A renewal payment failed; access continues for a few days while it is retried." : e.state === "cancelled" ? `Cancelled. Access continues until ${expiresAt ? new Date(expiresAt).toLocaleDateString() : "the end of the paid period"}.` : `Active subscription${e.cycle ? ` (${e.cycle})` : ""}.`,
    };
  }
  const base = { tier: "free" as const, source: "server" as const, productId: e.subscriptionId ?? undefined, checkedAt };
  switch (e.state) {
    case "awaiting_payment":
      return { ...base, status: "PENDING", pending: true, reason: "A checkout was started but no payment has been confirmed yet." };
    case "pending":
      return { ...base, status: "PENDING", pending: true, reason: "The gateway is still confirming the payment." };
    case "expired":
    case "halted":
    case "cancelled":
    case "refunded":
      return { ...base, status: "EXPIRED", reason: e.state === "refunded" ? "The last payment was refunded, so access has ended." : e.state === "halted" ? "Renewal payments failed repeatedly and the subscription stopped." : e.state === "cancelled" ? "The subscription was cancelled and its paid period has ended." : "The subscription has expired." };
    default:
      return { ...base, status: "FREE", reason: "No active subscription." };
  }
}

export function toStoreProducts(catalog: Catalog, product: ProductId): StoreProduct[] {
  const p = catalog.products.find((x) => x.product === product);
  if (!p) return [];
  return p.plans.map((pl) => ({
    productId: pl.id,
    plan: pl.cycle === "annual" ? "yearly" : "monthly",
    title: `${p.name} — ${pl.label}`,
    localizedPrice: pl.amount,
    currency: catalog.currency,
    priceMicros: pl.amountPaise * 10_000,
    billingPeriod: CYCLE_ISO[pl.cycle],
    offer: pl.cycle === "annual" ? `Save ${pl.savingsPercent}% — ${pl.perMonth} per month, billed ${pl.amount} yearly` : undefined,
  }));
}

export class ServerBillingProvider implements BillingProvider {
  readonly name = "server" as const;
  readonly storeLabel = "GaitAI";
  private listeners = new Set<(s: BillingState) => void>();
  private state: BillingState = { status: "loading", products: [], entitlement: FREE_ENTITLEMENT };
  catalog: Catalog | null = null;
  me: { subscriptions: SubscriptionView[]; entitlement: ServerEntitlement | null } = { subscriptions: [], entitlement: null };

  constructor(private cfg: ServerBillingConfig) {}

  private log(event: string, data?: Record<string, unknown>) {
    this.cfg.log?.(event, data);
  }

  private set(patch: Partial<BillingState>): BillingState {
    this.state = { ...this.state, ...patch };
    for (const l of this.listeners) l(this.state);
    return this.state;
  }

  subscribe(listener: (s: BillingState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose() {
    this.listeners.clear();
  }

  async init(): Promise<BillingState> {
    await this.loadCatalog();
    return this.refresh();
  }

  private async loadCatalog() {
    try {
      this.catalog = await billingApi.catalog();
      billingApi.keys().then((k) => rememberKeys(k.keys)).catch(() => {});
      this.set({ products: toStoreProducts(this.catalog, this.cfg.product) });
    } catch (e) {
      this.log("catalog failed", { error: String(e) });
    }
  }

  /** Server verdict when online; the signed cached token when not; UNKNOWN otherwise. */
  async refresh(): Promise<BillingState> {
    const uid = await this.cfg.uid();
    if (!uid) {
      await entitlementTokenStore.set(this.cfg.product, null);
      this.me = { subscriptions: [], entitlement: null };
      return this.set({ status: this.catalog ? "ready" : "unavailable", entitlement: { ...FREE_ENTITLEMENT, reason: "Sign in to see your subscription." }, message: undefined });
    }
    if (!this.catalog) await this.loadCatalog();
    try {
      const me = await billingApi.me();
      const e = me.entitlements[this.cfg.product];
      this.me = { subscriptions: me.subscriptions.filter((s) => s.product === this.cfg.product), entitlement: e };
      await entitlementTokenStore.set(this.cfg.product, e.token);
      const ent = toServerEntitlement(e);
      this.log("entitlement", { state: e.state, entitled: e.entitled });
      return this.set({ status: ent.status === "PRO" ? "purchased" : ent.status === "PENDING" ? "pending" : ent.status === "EXPIRED" ? "expired" : "ready", entitlement: ent, message: undefined });
    } catch (err) {
      if (err instanceof BillingApiError && err.status === 401) {
        return this.set({ status: "ready", entitlement: { ...FREE_ENTITLEMENT, status: "UNKNOWN", reason: "Your session needs renewing. Sign in again." } });
      }
      // Offline: honour a cached token only if its signature verifies and it has not expired.
      const cached = await entitlementTokenStore.get(this.cfg.product);
      const claims = cached ? await verifyEntitlementToken(cached) : null;
      if (claims?.ent && claims.sub === uid && claims.prod === this.cfg.product) {
        const ent: Entitlement = { status: "PRO", tier: "pro", source: "server", productId: claims.sid ?? undefined, expiresAt: new Date(claims.until * 1000).toISOString(), checkedAt: new Date(claims.iat * 1000).toISOString(), reason: `Offline. Last confirmed by GaitAI ${new Date(claims.iat * 1000).toLocaleString()}; valid until ${new Date(claims.exp * 1000).toLocaleString()} without a connection.` };
        return this.set({ status: "grace", entitlement: ent, message: "You are offline. Your subscription was confirmed recently, so analysis continues for now." });
      }
      return this.set({ status: "ready", entitlement: { ...FREE_ENTITLEMENT, status: "UNKNOWN", reason: "GaitAI could not be reached to confirm your subscription. Features stay locked until it can be checked." }, message: "GaitAI could not be reached." });
    }
  }

  /**
   * Starts a checkout. Resolves with status "purchasing" and the hosted
   * checkout URL in `checkoutUrl`; the UI opens it and calls refresh() when
   * the page reports a result.
   */
  async purchase(productId: string): Promise<BillingState & { checkoutUrl?: string; subscriptionId?: string }> {
    const cycle: Cycle = productId.endsWith("_annual") || productId.endsWith("_yearly") ? "annual" : "monthly";
    try {
      const co = await billingApi.checkout(this.cfg.product, cycle);
      this.log("checkout created", { mode: co.mode, cycle });
      return { ...this.set({ status: "purchasing", message: undefined }), checkoutUrl: co.checkoutUrl, subscriptionId: co.subscriptionId };
    } catch (err) {
      const message = err instanceof BillingApiError ? err.message : "The checkout could not be started.";
      const code = err instanceof BillingApiError ? err.code : "error";
      this.log("checkout failed", { code });
      return this.set({ status: code === "already_subscribed" ? "purchased" : "failed", message });
    }
  }

  /** Called by the checkout screen with the page's result. */
  async completeCheckout(result: "verified" | "failed" | "cancelled" | "dismissed" | "unverified"): Promise<BillingState> {
    if (result === "verified") {
      const s = await this.refresh();
      return this.set({ ...s, message: s.entitlement.status === "PRO" ? "Payment confirmed. Your subscription is active." : "Payment received; GaitAI is confirming it." });
    }
    if (result === "failed") return this.set({ status: "failed", message: "The payment did not go through. Nothing was charged." });
    if (result === "unverified") {
      const s = await this.refresh();
      return s.entitlement.status === "PRO" ? s : this.set({ status: "pending", message: "The payment could not be verified yet. It will be confirmed automatically; check back in a minute." });
    }
    return this.set({ status: "cancelled", message: "Checkout closed. Nothing was charged." });
  }

  async restore(): Promise<BillingState> {
    const s = await this.refresh();
    return this.set({ ...s, status: s.entitlement.status === "PRO" ? "restored" : s.status, message: s.entitlement.status === "PRO" ? "Your subscription was found on this account." : (s.message ?? "No active subscription on this account.") });
  }

  async cancel(atCycleEnd = true): Promise<BillingState> {
    const sub = this.me.entitlement?.subscriptionId;
    if (!sub) return this.state;
    await billingApi.cancel(sub, atCycleEnd);
    return this.refresh();
  }

  async manage(): Promise<boolean> {
    return false; // The Profile → Manage subscription screen handles it in-app.
  }

  manageUrl(): string | null {
    return "https://gaitai.in/account/";
  }

  get mode() {
    return this.catalog?.mode ?? BILLING_MODE;
  }
}
