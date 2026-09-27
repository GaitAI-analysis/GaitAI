/**
 * App-wide state: profile, sessions, entitlement (billing), demo mode, and
 * the analysis engine handle. One provider per app; screens use the hooks.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { analytics, devStore, gate, profileStore, sessionStore, type AnalysisSession, type Entitlement, type ProductId, type ResultView, type UserProfile } from "@gaitai/core";
import { DevEntitlementProvider, PlayBillingProvider, SUBSCRIPTIONS, type BillingProvider, type BillingState } from "@gaitai/billing";
import { AnalysisEngine, type EngineHandle } from "@gaitai/analysis";

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
  entitlement: Entitlement;
  isPro: boolean;
  /** Development-only demo data mode. Always false in release builds. */
  demoMode: boolean;
  setDemoMode(v: boolean): Promise<void>;
  devSetPro(v: boolean): Promise<void>;
  engine: React.RefObject<EngineHandle | null>;
  engineReady: boolean;
  loading: boolean;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => { const v = useContext(Ctx); if (!v) throw new Error("useApp outside AppProvider"); return v; };

const FREE: Entitlement = { tier: "free", source: "none" };

export function AppProvider({ product, engineSource, children }: { product: ProductId; engineSource: number; children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [demoMode, setDemo] = useState(false);
  const [billing, setBilling] = useState<BillingState>({ status: "loading", products: [], entitlement: FREE });
  const [loading, setLoading] = useState(true);
  const engine = useRef<EngineHandle | null>(null);
  const [engineReady, setEngineReady] = useState(false);

  const billingProvider = useMemo<BillingProvider>(() => {
    // The DEV entitlement exists only in development builds; release builds always talk to Play.
    if (__DEV__) return new DevEntitlementProvider(devStore.pro);
    return new PlayBillingProvider(SUBSCRIPTIONS[product]);
  }, [product]);

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

  // Poll the engine's ready flag (it is set by the WebView's ready message).
  useEffect(() => { const id = setInterval(() => { if (engine.current?.ready && !engineReady) setEngineReady(true); }, 300); return () => clearInterval(id); }, [engineReady]);

  const value = useMemo<AppState>(() => ({
    product, profile, sessions, billing, billingProvider, demoMode, engine, engineReady, loading,
    entitlement: billing.entitlement,
    isPro: billing.entitlement.tier === "pro",
    async updateProfile(patch) { setProfile(await profileStore.update(patch)); },
    reloadSessions,
    async saveSession(s) { await sessionStore.save(s); await reloadSessions(); },
    async deleteSession(id) { await sessionStore.remove(id); await analytics.track("session_deleted", { product }); await reloadSessions(); },
    view: (s) => gate(s, billing.entitlement),
    async purchase(id) { await analytics.track("purchase_started", { product, id }); const b = await billingProvider.purchase(id); setBilling(b); if (b.status === "purchased") await analytics.track("purchase_completed", { product, source: b.entitlement.source }); return b; },
    async restore() { const b = await billingProvider.restore(); setBilling(b); return b; },
    async setDemoMode(v) { if (!__DEV__) return; await devStore.demoMode.set(v); setDemo(v); setSessions(await sessionStore.list(v)); },
    async devSetPro(v) { if (!__DEV__ || billingProvider.name !== "dev") return; const dev = billingProvider as DevEntitlementProvider; setBilling(v ? await dev.purchase() : await dev.revoke()); },
  }), [product, profile, sessions, billing, billingProvider, demoMode, engineReady, loading, reloadSessions]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnalysisEngine ref={engine} source={engineSource} />
    </Ctx.Provider>
  );
}
