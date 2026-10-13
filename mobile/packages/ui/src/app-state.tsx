/**
 * App-wide state: account, entitlement (billing), profile, sessions, demo
 * mode, and the analysis engine with its lifecycle status. One provider per
 * app; screens use the hooks.
 *
 * WHO DECIDES WHAT IS UNLOCKED. On Android the ServerBillingProvider asks
 * the GaitAI billing Worker, which re-derives the verdict from its ledger of
 * Razorpay subscriptions on every call; `authorizeAnalysis()` asks it again,
 * per analysis, for a signed grant. The phone keeps a short-lived signed
 * token for offline spells and nothing else. On iOS the StoreKit provider
 * remains (Apple requires it for digital subscriptions).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState as RNAppState, Linking, Platform } from "react-native";
import { analytics, devStore, entitlementStore, gate, isEntitled, profileStore, sessionStore, type AnalysisSession, type Entitlement, type EntitlementStatus, type ProductId, type ResultView, type UserProfile } from "@gaitai/core";
import { FREE_ENTITLEMENT, ServerBillingProvider, StoreBillingProvider, SUBSCRIPTIONS, type BillingProvider, type BillingState } from "@gaitai/billing";
import { auth, billingApi, BillingApiError, type AuthUser } from "@gaitai/api";
import { productMeta } from "@gaitai/design-system";
import { AnalysisEngine, diag, type EngineHandle, type EngineStatus } from "@gaitai/analysis";

export type CheckoutResult = "verified" | "failed" | "cancelled" | "dismissed" | "unverified";

export interface AuthApi {
  user: AuthUser | null;
  /** False until the stored session has been read. */
  ready: boolean;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendVerification(): Promise<void>;
  refreshUser(): Promise<AuthUser | null>;
  resetPassword(email: string): Promise<void>;
  /** Cancels subscriptions, anonymises the GaitAI record, deletes the Firebase account and wipes this phone. */
  deleteAccount(): Promise<void>;
}

interface AppState {
  product: ProductId;
  profile: UserProfile | null;
  updateProfile(patch: Partial<UserProfile>): Promise<void>;
  sessions: AnalysisSession[];
  reloadSessions(): Promise<void>;
  saveSession(s: AnalysisSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  view(s: AnalysisSession): ResultView;
  auth: AuthApi;
  /** Whether this build requires an account (Android: yes; iOS keeps StoreKit without one). */
  accountRequired: boolean;
  billing: BillingState;
  billingProvider: BillingProvider;
  /** Starts a checkout; resolves with the hosted checkout URL to open, or null when the state explains why not. */
  startCheckout(planId: string): Promise<string | null>;
  /** Called by the checkout screen with the hosted page's result. */
  completeCheckout(result: CheckoutResult): Promise<BillingState>;
  purchase(productId: string): Promise<BillingState>;
  restore(): Promise<BillingState>;
  /** Re-reads plans and the entitlement (also runs on every app foreground). */
  refreshBilling(): Promise<BillingState>;
  /** Cancels the current subscription at the end of the paid period (Android) or opens the store's management UI (iOS). */
  cancelSubscription(atCycleEnd?: boolean): Promise<BillingState>;
  manageSubscription(): Promise<void>;
  /**
   * Asks GaitAI for a per-analysis grant before any analysis starts. Resolves
   * true when granted (or when offline with a still-valid signed token), false
   * when the server says no — the caller then shows the subscription screen.
   */
  authorizeAnalysis(kind: string): Promise<boolean>;
  entitlement: Entitlement;
  entitlementStatus: EntitlementStatus;
  /** True only for a PRO verdict; the same rule gate() applies to premium values. */
  isPro: boolean;
  /** The server provider, when this build uses it (for Manage subscription details). */
  server: ServerBillingProvider | null;
  demoMode: boolean;
  setDemoMode(v: boolean): Promise<void>;
  engine: React.RefObject<EngineHandle | null>;
  engineStatus: EngineStatus;
  engineReady: boolean;
  retryEngine(): Promise<void>;
  loading: boolean;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
};

const INITIAL_ENGINE: EngineStatus = { state: "UNINITIALIZED", detail: "Not started", error: null, attempt: 0, since: Date.now(), warmed: [] };
const ACCOUNT_REQUIRED = Platform.OS !== "ios";

export function AppProvider({ product, children }: { product: ProductId; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [demoMode, setDemo] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [billing, setBilling] = useState<BillingState>({ status: "loading", products: [], entitlement: FREE_ENTITLEMENT });
  const [loading, setLoading] = useState(true);
  const engine = useRef<EngineHandle | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(INITIAL_ENGINE);

  const billingProvider = useMemo<BillingProvider>(() => {
    if (!ACCOUNT_REQUIRED) {
      return new StoreBillingProvider({ packageName: productMeta[product].packageId, productIds: SUBSCRIPTIONS[product], persist: entitlementStore, log: (event, data) => diag.log(`billing: ${event}`, data) });
    }
    return new ServerBillingProvider({ product, uid: async () => (await auth.current())?.uid ?? null, log: (event, data) => diag.log(`billing: ${event}`, data as Record<string, string | number | boolean>) });
  }, [product]);
  const server = billingProvider instanceof ServerBillingProvider ? billingProvider : null;

  // Account session: read once, then follow changes (sign-in, sign-out, token loss).
  useEffect(() => {
    let alive = true;
    auth.current().then((u) => { if (alive) { setUser(u); setAuthReady(true); } });
    const off = auth.subscribe((u) => { setUser(u); billingProvider.refresh().then(setBilling).catch(() => {}); });
    return () => { alive = false; off(); };
  }, [billingProvider]);

  useEffect(() => {
    const off = billingProvider.subscribe(setBilling);
    return () => { off(); billingProvider.dispose(); };
  }, [billingProvider]);

  // Re-check the entitlement whenever the app comes back to the foreground.
  useEffect(() => {
    const sub = RNAppState.addEventListener("change", (s) => { if (s === "active") { billingProvider.refresh().then(setBilling).catch(() => {}); auth.refreshUser().catch(() => {}); } });
    return () => sub.remove();
  }, [billingProvider]);

  const reloadSessions = useCallback(async () => {
    const demo = __DEV__ ? await devStore.demoMode.get() : false;
    setSessions(await sessionStore.list(demo));
  }, []);

  useEffect(() => {
    (async () => {
      const [p, d, b] = await Promise.all([profileStore.get(), __DEV__ ? devStore.demoMode.get() : Promise.resolve(false), billingProvider.init()]);
      setProfile(p); setDemo(d); setBilling(b);
      setSessions(await sessionStore.list(d));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [billingProvider]);

  const retryEngine = useCallback(async () => {
    const h = engine.current;
    if (!h) throw new Error("The analysis engine is not mounted.");
    await h.retry();
  }, []);

  const authApi = useMemo<AuthApi>(() => ({
    user,
    ready: authReady,
    async signIn(email, password) { const u = await auth.signIn(email, password); await analytics.track("product_opened", { product, signedIn: true }); return u; },
    async signUp(email, password) { return auth.signUp(email, password); },
    async signOut() { await auth.signOut(); await entitlementStore.clear().catch(() => {}); },
    sendVerification: () => auth.sendVerification(),
    refreshUser: () => auth.refreshUser(),
    resetPassword: (email) => auth.sendPasswordReset(email),
    async deleteAccount() {
      try { await billingApi.deleteAccount(); } catch (e) { if (!(e instanceof BillingApiError && e.status === 401)) throw e; }
      await auth.deleteAccount();
      await profileStore.deleteAccount();
      setSessions([]);
      setProfile(await profileStore.get());
    },
  }), [user, authReady, product]);

  const value = useMemo<AppState>(() => ({
    product, profile, sessions, billing, billingProvider, demoMode, engine, engineStatus, loading, retryEngine, server,
    auth: authApi,
    accountRequired: ACCOUNT_REQUIRED,
    engineReady: engineStatus.state === "READY" || engineStatus.state === "ANALYZING",
    entitlement: billing.entitlement,
    entitlementStatus: billing.entitlement.status,
    isPro: isEntitled(billing.entitlement),
    async updateProfile(patch) { setProfile(await profileStore.update(patch)); },
    reloadSessions,
    async saveSession(s) { await sessionStore.save(s); await reloadSessions(); },
    async deleteSession(id) { await sessionStore.remove(id); await analytics.track("session_deleted", { product }); await reloadSessions(); },
    view: (s) => gate(s, billing.entitlement),
    async startCheckout(planId) {
      await analytics.track("purchase_started", { product, id: planId });
      const b = (await billingProvider.purchase(planId)) as BillingState & { checkoutUrl?: string };
      setBilling(b);
      if (b.status === "failed") await analytics.track("purchase_failed", { product });
      return b.checkoutUrl ?? null;
    },
    async completeCheckout(result) {
      if (!server) return billing;
      const b = await server.completeCheckout(result);
      setBilling(b);
      if (result === "verified" && b.entitlement.status === "PRO") await analytics.track("purchase_completed", { product, source: "server" });
      else if (result === "failed") await analytics.track("purchase_failed", { product });
      else if (result === "cancelled" || result === "dismissed") await analytics.track("purchase_cancelled", { product });
      else if (result === "unverified") await analytics.track("purchase_pending", { product });
      return b;
    },
    async purchase(id) {
      // Store providers (iOS) complete the purchase inside this call; the server provider starts a checkout instead.
      await analytics.track("purchase_started", { product, id });
      const b = await billingProvider.purchase(id);
      setBilling(b);
      return b;
    },
    async restore() { const b = await billingProvider.restore(); setBilling(b); await analytics.track("restore_completed", { product, status: b.status }); return b; },
    async refreshBilling() { const b = await billingProvider.refresh(); setBilling(b); return b; },
    async cancelSubscription(atCycleEnd = true) {
      if (server) { const b = await server.cancel(atCycleEnd); setBilling(b); return b; }
      await billingProvider.manage();
      return billing;
    },
    async manageSubscription() {
      const opened = await billingProvider.manage();
      if (!opened) { const u = billingProvider.manageUrl(); if (u) await Linking.openURL(u); }
    },
    async authorizeAnalysis(kind) {
      if (!ACCOUNT_REQUIRED) return isEntitled(billing.entitlement);
      try {
        const g = await billingApi.analysisGrant(product, kind);
        diag.log("analysis grant", { kind, granted: !!g.grant });
        return true;
      } catch (e) {
        if (e instanceof BillingApiError && e.status === 402) {
          const b = await billingProvider.refresh().catch(() => billing);
          setBilling(b);
          return false;
        }
        if (e instanceof BillingApiError && e.status === 401) {
          setBilling(await billingProvider.refresh().catch(() => billing));
          return false;
        }
        // Offline: the signed token the provider verified is the only thing that can say yes.
        const b = await billingProvider.refresh().catch(() => billing);
        setBilling(b);
        if (b.status === "grace" && isEntitled(b.entitlement)) return true;
        Alert.alert("GaitAI could not be reached", "Your subscription has to be confirmed before an analysis can start. Check your connection and try again.");
        return false;
      }
    },
    async setDemoMode(v) { if (!__DEV__) return; await devStore.demoMode.set(v); setDemo(v); setSessions(await sessionStore.list(v)); },
  }), [product, profile, sessions, billing, billingProvider, server, authApi, demoMode, engineStatus, loading, reloadSessions, retryEngine]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnalysisEngine ref={engine} product={product} onStatus={setEngineStatus} />
    </Ctx.Provider>
  );
}
