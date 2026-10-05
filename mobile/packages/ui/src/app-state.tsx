/**
 * App-wide state: profile, sessions, entitlement (billing), demo mode, and
 * the analysis engine with its lifecycle status. One provider per app; screens
 * use the hooks.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState as RNAppState, Linking } from "react-native";
import { analytics, devStore, entitlementStore, gate, isEntitled, profileStore, sessionStore, type AnalysisSession, type Entitlement, type EntitlementStatus, type ProductId, type ResultView, type UserProfile } from "@gaitai/core";
import { DevEntitlementProvider, FREE_ENTITLEMENT, PlayBillingProvider, SUBSCRIPTIONS, type BillingProvider, type BillingState } from "@gaitai/billing";
import { productMeta } from "@gaitai/design-system";
import { AnalysisEngine, diag, type EngineHandle, type EngineStatus } from "@gaitai/analysis";

interface AppState {
  product: ProductId;
  profile: UserProfile | null;
  updateProfile(patch: Partial<UserProfile>): Promise<void>;
  sessions: AnalysisSession[];
  reloadSessions(): Promise<void>;
  saveSession(s: AnalysisSession): Promise<void>;
  deleteSession(id: string): Promise<void>;
  view(s: AnalysisSession): ResultView;
  billing: BillingState;
  billingProvider: BillingProvider;
  purchase(productId: string): Promise<BillingState>;
  restore(): Promise<BillingState>;
  /** Re-reads plans and the entitlement from the store (also runs on every app foreground). */
  refreshBilling(): Promise<BillingState>;
  /** Opens the store's subscription management for this app. */
  manageSubscription(): Promise<void>;
  entitlement: Entitlement;
  /** The entitlement layer's verdict: FREE, PRO, EXPIRED, PENDING or UNKNOWN. */
  entitlementStatus: EntitlementStatus;
  /** True only for a PRO verdict; the same rule gate() applies to premium values. */
  isPro: boolean;
  /** Development-only demo data mode. Always false in release builds. */
  demoMode: boolean;
  setDemoMode(v: boolean): Promise<void>;
  devSetPro(v: boolean): Promise<void>;
  /** The on-device engine. Screens call runPose/runDetect; both wait for READY themselves. */
  engine: React.RefObject<EngineHandle | null>;
  /** Live engine lifecycle state, for gating actions and showing start-up progress. */
  engineStatus: EngineStatus;
  engineReady: boolean;
  /** Re-initialises the engine from scratch; resolves when READY, rejects with the EngineError otherwise. */
  retryEngine(): Promise<void>;
  loading: boolean;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => { const v = useContext(Ctx); if (!v) throw new Error("useApp outside AppProvider"); return v; };

const INITIAL_ENGINE: EngineStatus = { state: "UNINITIALIZED", detail: "Not started", error: null, attempt: 0, since: Date.now(), warmed: [] };

export function AppProvider({ product, children }: { product: ProductId; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [demoMode, setDemo] = useState(false);
  const [billing, setBilling] = useState<BillingState>({ status: "loading", products: [], entitlement: FREE_ENTITLEMENT });
  const [loading, setLoading] = useState(true);
  const engine = useRef<EngineHandle | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>(INITIAL_ENGINE);

  const billingProvider = useMemo<BillingProvider>(() => {
    // The DEV entitlement exists only in development builds; release builds always talk to Play.
    if (__DEV__) return new DevEntitlementProvider(devStore.pro);
    return new PlayBillingProvider({
      packageName: productMeta[product].packageId,
      productIds: SUBSCRIPTIONS[product],
      persist: entitlementStore,
      log: (event, data) => diag.log(`billing: ${event}`, data),
    });
  }, [product]);

  // States that arrive outside a call (a pending purchase that clears, a store push) land here too.
  useEffect(() => {
    const off = billingProvider.subscribe(setBilling);
    return () => { off(); billingProvider.dispose(); };
  }, [billingProvider]);

  // Re-check the entitlement whenever the app comes back to the foreground.
  useEffect(() => {
    const sub = RNAppState.addEventListener("change", (s) => { if (s === "active") billingProvider.refresh().then(setBilling).catch(() => {}); });
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

  const value = useMemo<AppState>(() => ({
    product, profile, sessions, billing, billingProvider, demoMode, engine, engineStatus, loading, retryEngine,
    engineReady: engineStatus.state === "READY" || engineStatus.state === "ANALYZING",
    entitlement: billing.entitlement,
    entitlementStatus: billing.entitlement.status,
    isPro: isEntitled(billing.entitlement),
    async updateProfile(patch) { setProfile(await profileStore.update(patch)); },
    reloadSessions,
    async saveSession(s) { await sessionStore.save(s); await reloadSessions(); },
    async deleteSession(id) { await sessionStore.remove(id); await analytics.track("session_deleted", { product }); await reloadSessions(); },
    view: (s) => gate(s, billing.entitlement),
    async purchase(id) {
      await analytics.track("purchase_started", { product, id });
      const b = await billingProvider.purchase(id);
      setBilling(b);
      if (b.status === "purchased" || b.status === "restored") await analytics.track("purchase_completed", { product, source: b.entitlement.source });
      else if (b.status === "pending") await analytics.track("purchase_pending", { product });
      else if (b.status === "cancelled") await analytics.track("purchase_cancelled", { product });
      else if (b.status === "failed") await analytics.track("purchase_failed", { product });
      return b;
    },
    async restore() { const b = await billingProvider.restore(); setBilling(b); await analytics.track("restore_completed", { product, status: b.status }); return b; },
    async refreshBilling() { const b = await billingProvider.refresh(); setBilling(b); return b; },
    async manageSubscription() {
      const opened = await billingProvider.manage();
      if (!opened) { const u = billingProvider.manageUrl(); if (u) await Linking.openURL(u); }
    },
    async setDemoMode(v) { if (!__DEV__) return; await devStore.demoMode.set(v); setDemo(v); setSessions(await sessionStore.list(v)); },
    async devSetPro(v) { if (!__DEV__ || billingProvider.name !== "dev") return; const dev = billingProvider as DevEntitlementProvider; setBilling(v ? await dev.purchase() : await dev.revoke()); },
  }), [product, profile, sessions, billing, billingProvider, demoMode, engineStatus, loading, reloadSessions, retryEngine]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnalysisEngine ref={engine} product={product} onStatus={setEngineStatus} />
    </Ctx.Provider>
  );
}
