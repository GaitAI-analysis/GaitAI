/**
 * Google Play Billing through expo-iap (Play Billing Library via OpenIAP).
 *
 * What this provider does on a release build installed from Google Play:
 *   connect → fetch the two subscription products → read the account's
 *   purchases → acknowledge anything Play has not acknowledged → derive the
 *   entitlement verdict (FREE / PRO / EXPIRED / PENDING / UNKNOWN) → persist it.
 * Purchases run through Play's own sheet; the result arrives on the purchase
 * listeners (purchased, pending, cancelled, failed) and the flow promise
 * resolves with the new BillingState. Restore re-queries Play; refresh runs on
 * every app foreground. Every price, currency, billing period and offer shown
 * in the UI comes from the ProductDetails Play returns — nothing is hardcoded.
 *
 * Verification is client-side (Play's own purchase state) for Internal Testing.
 * Production adds server-side verification with Real-time Developer
 * Notifications and the Play Developer API; the state machine does not change.
 */
import { Platform } from "react-native";
import {
  ErrorCode,
  deepLinkToSubscriptions,
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  getUserFriendlyErrorMessage,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type ProductSubscription,
  type ProductSubscriptionAndroid,
  type Purchase,
  type PurchaseAndroid,
  type SubscriptionOffer,
} from "expo-iap";
import type { Entitlement } from "@gaitai/core";
import { FREE_ENTITLEMENT, periodLabel, spanLabel, type BillingProvider, type BillingState, type BillingStatus, type Plan, type StoreProduct } from "./types";

/** Errors after which one reconnect is attempted before giving up. */
const RECONNECT_CODES = new Set<string>([ErrorCode.ServiceDisconnected, ErrorCode.NotPrepared, ErrorCode.InitConnection, ErrorCode.ConnectionClosed, ErrorCode.ServiceTimeout]);
/** Errors that mean this device cannot bill through Play at all. */
const UNAVAILABLE_CODES = new Set<string>([ErrorCode.BillingUnavailable, ErrorCode.IapNotAvailable, ErrorCode.FeatureNotSupported]);
/** How long a store-confirmed PRO keeps unlocking when Play cannot be reached. */
export const OFFLINE_GRACE_MS = 72 * 3_600_000;
/** A purchase sheet left open longer than this is treated as failed, so the UI never spins forever. */
const PURCHASE_FLOW_TIMEOUT_MS = 10 * 60_000;

export interface PlayBillingConfig {
  /** Android application id, for the subscription-management deep link. */
  packageName: string;
  productIds: { monthly: string; yearly: string };
  /** Where the last verdict is kept between launches. */
  persist: { get(): Promise<Entitlement | null>; set(e: Entitlement): Promise<void> };
  /** Diagnostics sink (event names and codes only; never tokens or prices). */
  log?: (event: string, data?: Record<string, string | number | boolean | null>) => void;
}

/** The purchase-error listener and the error-mapping utility use slightly different PurchaseError shapes; this covers both. */
type ErrLike = { code?: string; message?: string; responseCode?: number | null; productId?: string | null };
const codeOf = (e: unknown): string => (e && typeof e === "object" && typeof (e as ErrLike).code === "string" ? (e as ErrLike).code! : "unknown");
const messageOf = (e: unknown): string => (e instanceof Error ? e.message : (e as ErrLike | undefined)?.message) || String(e);

export class PlayBillingProvider implements BillingProvider {
  readonly name = "play" as const;
  private connected = false;
  private listening = false;
  private subs: { remove(): void }[] = [];
  private state: BillingState = { status: "loading", products: [], entitlement: FREE_ENTITLEMENT };
  private lastKnown: Entitlement | null = null;
  private offerTokens = new Map<string, string>();
  private flow: { productId: string; resolve: (s: BillingState) => void; timer: ReturnType<typeof setTimeout> } | null = null;
  private listeners = new Set<(s: BillingState) => void>();

  constructor(private readonly cfg: PlayBillingConfig) {}

  private get skus() { return [this.cfg.productIds.monthly, this.cfg.productIds.yearly]; }
  private log(event: string, data?: Record<string, string | number | boolean | null>) { this.cfg.log?.(event, data); }
  private set(patch: Partial<BillingState>): BillingState {
    this.state = { ...this.state, message: undefined, ...patch };
    this.listeners.forEach((l) => l(this.state));
    return this.state;
  }
  subscribe(l: (s: BillingState) => void) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }

  // ── Connection ───────────────────────────────────────────────────────────
  private connecting: Promise<void> | null = null;
  /** Idempotent: concurrent callers (init and a foreground refresh) share one initConnection. */
  private connect(): Promise<void> {
    if (this.connected) return Promise.resolve();
    if (this.connecting) return this.connecting;
    this.connecting = (async () => {
      if (Platform.OS !== "android") throw Object.assign(new Error("Google Play Billing is only available on Android."), { code: ErrorCode.IapNotAvailable });
      await initConnection();
      this.connected = true;
      this.attachListeners();
      this.log("billing connected");
    })().finally(() => { this.connecting = null; });
    return this.connecting;
  }
  /** Runs fn; on a connection-class error reconnects once and runs it again. */
  private async withReconnect<T>(fn: () => Promise<T>): Promise<T> {
    try { await this.connect(); return await fn(); }
    catch (e) {
      if (!RECONNECT_CODES.has(codeOf(e))) throw e;
      this.log("billing reconnecting", { code: codeOf(e) });
      this.connected = false;
      await this.connect();
      return await fn();
    }
  }
  private unavailableMessage(e: unknown): string {
    const code = codeOf(e);
    if (UNAVAILABLE_CODES.has(code)) return "Google Play Billing is not available on this device. Sign in to the Play Store with the Google account that installed the app, then try again.";
    if (code === ErrorCode.NetworkError) return "No connection to Google Play. Check your network and try again.";
    return `Could not connect to Google Play (${code}). ${messageOf(e)}`;
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  async init(): Promise<BillingState> {
    this.lastKnown = await this.cfg.persist.get().catch(() => null);
    this.set({ status: "loading", entitlement: this.offlineEntitlement() });
    try { await this.connect(); }
    catch (e) {
      this.log("billing unavailable", { code: codeOf(e) });
      return this.set({ status: "unavailable", products: [], entitlement: this.offlineEntitlement(), message: this.unavailableMessage(e) });
    }
    let products: StoreProduct[] = [];
    let message: string | undefined;
    try { products = await this.loadProducts(); }
    catch (e) { this.log("products failed", { code: codeOf(e) }); message = `Google Play did not return the subscription plans (${codeOf(e)}). ${messageOf(e)}`; }
    if (!message && products.length === 0) message = "Google Play returned no subscription plans for this app. They appear once the subscriptions are active in Play Console and this build was installed from Google Play.";
    const entitlement = await this.syncEntitlement().catch((e) => { this.log("entitlement sync failed", { code: codeOf(e) }); return this.offlineEntitlement(); });
    const status: BillingStatus = entitlement.status === "PENDING" ? "pending" : products.length === 0 ? "unavailable" : entitlement.status === "PRO" ? "purchased" : "ready";
    return this.set({ status, products, entitlement, message });
  }

  // ── Products ─────────────────────────────────────────────────────────────
  private async loadProducts(): Promise<StoreProduct[]> {
    const list = (await this.withReconnect(() => fetchProducts({ skus: this.skus, type: "subs" }))) as ProductSubscription[] | null;
    const out: StoreProduct[] = [];
    this.offerTokens.clear();
    for (const p of list ?? []) {
      if (p.platform !== "android") continue;
      const sp = toStoreProduct(p, this.cfg.productIds);
      if (!sp) { this.log("product skipped", { id: p.id, status: p.productStatusAndroid ?? null }); continue; }
      if (sp.offerToken) this.offerTokens.set(sp.productId, sp.offerToken);
      out.push(sp);
    }
    this.log("products loaded", { count: out.length });
    return out;
  }

  // ── Entitlement ──────────────────────────────────────────────────────────
  /** Verdict when Play cannot be asked: a recent PRO holds for OFFLINE_GRACE_MS, anything else is UNKNOWN. */
  private offlineEntitlement(): Entitlement {
    const k = this.lastKnown;
    if (k?.status === "PRO" && k.source === "play-billing" && k.checkedAt && Date.now() - Date.parse(k.checkedAt) < OFFLINE_GRACE_MS) {
      return { ...k, reason: `Confirmed by Google Play on ${new Date(k.checkedAt).toLocaleString()}; could not re-check yet.` };
    }
    if (k?.status === "PENDING") return k;
    return { status: "UNKNOWN", tier: "free", source: k?.source ?? "none", productId: k?.productId, checkedAt: k?.checkedAt, reason: "Google Play could not be reached to confirm a subscription." };
  }

  /** Reads Play's purchases for this account, acknowledges where needed, derives and persists the verdict. */
  private async syncEntitlement(): Promise<Entitlement> {
    const purchases = (await this.withReconnect(() => getAvailablePurchases({ includeSuspendedAndroid: true }))) as Purchase[];
    const ours = purchases.filter((p) => this.skus.includes(p.productId)) as PurchaseAndroid[];
    const now = new Date().toISOString();
    const active = ours.find((p) => p.purchaseState === "purchased" && !p.isSuspendedAndroid);
    const pending = ours.find((p) => p.purchaseState === "pending");
    const suspended = ours.find((p) => p.isSuspendedAndroid);
    let ent: Entitlement;
    if (active) {
      await this.acknowledge(active);
      ent = {
        status: "PRO", tier: "pro", source: "play-billing", productId: active.productId, checkedAt: now,
        reason: active.autoRenewingAndroid === false ? "Cancelled on Google Play. Pro stays active until the end of the paid period." : "Active. Renews through Google Play.",
      };
    } else if (pending) {
      ent = { status: "PENDING", tier: "free", source: "play-billing", productId: pending.productId, pending: true, checkedAt: now, reason: "Google Play is still confirming the payment. Pro unlocks automatically once it clears." };
    } else if (suspended) {
      ent = { status: "EXPIRED", tier: "free", source: "play-billing", productId: suspended.productId, checkedAt: now, reason: "Google Play paused this subscription because a payment failed. Fix the payment method in Google Play to continue." };
    } else if (this.lastKnown && this.lastKnown.source === "play-billing" && this.lastKnown.status !== "FREE") {
      ent = { status: "EXPIRED", tier: "free", source: "play-billing", productId: this.lastKnown.productId, checkedAt: now, reason: "This subscription has ended. Resubscribe from the paywall or Google Play to continue." };
    } else {
      ent = { ...FREE_ENTITLEMENT, checkedAt: now };
    }
    this.lastKnown = ent;
    await this.cfg.persist.set(ent).catch(() => {});
    this.log("entitlement", { status: ent.status, productId: ent.productId ?? null });
    return ent;
  }

  /** Play refunds unacknowledged subscriptions after three days; acknowledge as soon as it is granted. */
  private async acknowledge(p: PurchaseAndroid): Promise<void> {
    if (p.isAcknowledgedAndroid) return;
    try { await finishTransaction({ purchase: p, isConsumable: false }); this.log("purchase acknowledged", { productId: p.productId }); }
    catch (e) { this.log("acknowledge failed", { code: codeOf(e) }); }
  }

  // ── Purchase flow ────────────────────────────────────────────────────────
  private attachListeners() {
    if (this.listening) return;
    this.listening = true;
    this.subs.push(purchaseUpdatedListener((p) => { this.onPurchase(p).catch((e) => this.log("purchase handler failed", { code: codeOf(e) })); }));
    this.subs.push(purchaseErrorListener((e) => this.onPurchaseError(e)));
  }
  private async onPurchase(p: Purchase) {
    if (!this.skus.includes(p.productId)) return;
    const a = p as PurchaseAndroid;
    this.log("purchase update", { productId: a.productId, state: a.purchaseState, acknowledged: a.isAcknowledgedAndroid ?? null });
    if (a.purchaseState === "purchased") await this.acknowledge(a);
    const entitlement = await this.syncEntitlement();
    const status: BillingStatus = entitlement.status === "PRO" ? "purchased" : entitlement.status === "PENDING" ? "pending" : "ready";
    const message = entitlement.status === "PENDING" ? "Google Play is confirming your payment. Pro unlocks automatically when it clears; you can leave this screen." : undefined;
    this.finishFlow(this.set({ status, entitlement, message }));
  }
  private onPurchaseError(e: ErrLike) {
    const code = codeOf(e);
    this.log("purchase error", { code, responseCode: e.responseCode ?? null });
    if (code === ErrorCode.UserCancelled) { this.finishFlow(this.set({ status: "cancelled", message: "Purchase cancelled. Nothing was charged." })); return; }
    if (code === ErrorCode.DeferredPayment || code === ErrorCode.Pending) { this.finishFlow(this.set({ status: "pending", message: "Google Play is confirming your payment. Pro unlocks automatically when it clears." })); return; }
    if (code === ErrorCode.AlreadyOwned) {
      this.refresh()
        .then((s) => this.finishFlow(this.set({ status: s.entitlement.status === "PRO" ? "restored" : s.status, message: "This Google account already has GaitAI Pro; it has been restored." })))
        .catch(() => this.finishFlow(this.state));
      return;
    }
    const friendly = getUserFriendlyErrorMessage(e as Parameters<typeof getUserFriendlyErrorMessage>[0]);
    this.finishFlow(this.set({ status: "failed", message: `${friendly} Nothing was charged.` }));
  }
  private finishFlow(s: BillingState) {
    const f = this.flow; if (!f) return;
    this.flow = null; clearTimeout(f.timer); f.resolve(s);
  }

  async purchase(productId: string): Promise<BillingState> {
    if (!this.skus.includes(productId)) return this.set({ status: "failed", message: "Unknown plan." });
    if (this.flow) return this.state; // one Play sheet at a time
    try { await this.connect(); } catch (e) { return this.set({ status: "unavailable", message: this.unavailableMessage(e) }); }
    if (!this.offerTokens.has(productId)) { try { const products = await this.loadProducts(); this.set({ products }); } catch { /* reported just below */ } }
    const offerToken = this.offerTokens.get(productId);
    if (!offerToken) return this.set({ status: "failed", message: "Google Play has no purchasable offer for this plan right now." });
    this.set({ status: "purchasing" });
    this.log("purchase requested", { productId });
    return new Promise<BillingState>((resolve) => {
      const timer = setTimeout(() => this.finishFlow(this.set({ status: "failed", message: "Google Play did not respond. Nothing was charged; try again." })), PURCHASE_FLOW_TIMEOUT_MS);
      this.flow = { productId, resolve, timer };
      // Event-based: the outcome arrives on the purchase listeners above, never from this promise.
      requestPurchase({ type: "subs", request: { google: { skus: [productId], subscriptionOffers: [{ sku: productId, offerToken }] } } })
        .catch((e) => this.onPurchaseError({ code: codeOf(e), message: messageOf(e), productId }));
    });
  }

  // ── Restore / refresh / manage ───────────────────────────────────────────
  async restore(): Promise<BillingState> {
    try {
      await this.withReconnect(() => restorePurchases());
      const entitlement = await this.syncEntitlement();
      const pro = entitlement.status === "PRO";
      return this.set({
        status: pro ? "restored" : entitlement.status === "PENDING" ? "pending" : this.state.products.length ? "ready" : "unavailable",
        entitlement,
        message: pro ? "GaitAI Pro restored from your Google Play account." : entitlement.status === "PENDING" ? "A purchase is still pending with Google Play." : "No active GaitAI Pro subscription was found for this Google account.",
      });
    } catch (e) {
      this.log("restore failed", { code: codeOf(e) });
      return this.set({ status: this.state.products.length ? "failed" : "unavailable", message: this.unavailableMessage(e) });
    }
  }

  async refresh(): Promise<BillingState> {
    try {
      if (this.state.products.length === 0) { const products = await this.loadProducts().catch(() => [] as StoreProduct[]); if (products.length) this.set({ products }); }
      const entitlement = await this.syncEntitlement();
      if (this.flow) return this.set({ entitlement, status: this.state.status, message: this.state.message }); // a sheet is open; its listener decides the status
      const status: BillingStatus = entitlement.status === "PENDING" ? "pending" : entitlement.status === "PRO" ? "purchased" : this.state.products.length ? "ready" : "unavailable";
      return this.set({ status, entitlement, message: this.state.products.length ? undefined : this.state.message });
    } catch (e) {
      this.log("refresh failed", { code: codeOf(e) });
      if (this.state.status === "unavailable") return this.state;
      return this.set({ status: this.state.status, entitlement: this.offlineEntitlement(), message: this.state.message });
    }
  }

  async manage(): Promise<boolean> {
    try { await deepLinkToSubscriptions({ skuAndroid: this.lastKnown?.productId ?? this.cfg.productIds.monthly, packageNameAndroid: this.cfg.packageName }); return true; }
    catch (e) { this.log("manage deep link failed", { code: codeOf(e) }); return false; }
  }
  manageUrl(): string | null {
    return `https://play.google.com/store/account/subscriptions?sku=${this.lastKnown?.productId ?? this.cfg.productIds.monthly}&package=${this.cfg.packageName}`;
  }

  dispose() {
    this.subs.forEach((s) => s.remove()); this.subs = []; this.listening = false;
    this.finishFlow(this.state);
    this.listeners.clear();
    if (this.connected) { this.connected = false; endConnection().catch(() => {}); }
  }
}

// ── Product mapping ────────────────────────────────────────────────────────
/** Prefers an offer with an introductory phase (Play only returns offers this account is eligible for), else the plain base plan. */
function pickOffer(offers: SubscriptionOffer[]): SubscriptionOffer | undefined {
  const phases = (o: SubscriptionOffer) => o.pricingPhasesAndroid?.pricingPhaseList.length ?? 0;
  return offers.find((o) => phases(o) > 1) ?? offers.find((o) => phases(o) === 1) ?? offers[0];
}

/** Builds a StoreProduct from Play's ProductDetails. Returns null rather than inventing a price when Play gave none. */
export function toStoreProduct(p: ProductSubscriptionAndroid, ids: { monthly: string; yearly: string }): StoreProduct | null {
  const plan: Plan | null = p.id === ids.monthly ? "monthly" : p.id === ids.yearly ? "yearly" : null;
  if (!plan) return null;
  if (p.productStatusAndroid && p.productStatusAndroid !== "ok") return null;
  const offer = pickOffer(p.subscriptionOffers ?? []);
  const phases = offer?.pricingPhasesAndroid?.pricingPhaseList ?? [];
  // recurrenceMode 1 = INFINITE_RECURRING: the price that repeats after any trial or intro phase.
  const recurring = phases.find((ph) => ph.recurrenceMode === 1) ?? phases[phases.length - 1];
  if (!recurring) return null;
  const intro = phases.length > 1 && phases[0] !== recurring ? phases[0] : undefined;
  let offerText: string | undefined;
  if (intro) {
    const span = spanLabel(intro.billingPeriod, intro.billingCycleCount);
    const then = `then ${recurring.formattedPrice} / ${periodLabel(recurring.billingPeriod)}`;
    offerText = Number(intro.priceAmountMicros) === 0 ? `${span} free, ${then}` : `${intro.formattedPrice} for the first ${span}, ${then}`;
  }
  return {
    productId: p.id, plan, title: p.title,
    localizedPrice: recurring.formattedPrice, currency: recurring.priceCurrencyCode, priceMicros: Number(recurring.priceAmountMicros),
    billingPeriod: recurring.billingPeriod, offer: offerText,
    offerToken: offer?.offerTokenAndroid ?? undefined, basePlanId: offer?.basePlanIdAndroid ?? undefined,
  };
}
