/**
 * Local persistence for sessions, profile and settings.
 *
 * Everything lives in the app's private storage on the device. Premium
 * metric values are stored with the session but never read into a screen
 * except through `gate()` (see gate.ts). Demo sessions carry `demo: true`
 * and are kept in a separate key, so a production build never sees them.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AnalysisSession, Entitlement, UserProfile } from "./schema";
import { makeId } from "./schema";

const K = {
  sessions: "gaitai.sessions.v1",
  demoSessions: "gaitai.sessions.demo.v1",
  profile: "gaitai.profile.v1",
  devPro: "gaitai.dev.pro.v1",
  demoMode: "gaitai.dev.demoMode.v1",
  events: "gaitai.analytics.v1",
  entitlement: "gaitai.entitlement.v1",
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
async function writeJson(key: string, value: unknown) { await AsyncStorage.setItem(key, JSON.stringify(value)); }

export const sessionStore = {
  async list(demo = false): Promise<AnalysisSession[]> {
    const all = await readJson<AnalysisSession[]>(demo ? K.demoSessions : K.sessions, []);
    return all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },
  async get(id: string): Promise<AnalysisSession | null> {
    const real = await this.list(false); const hit = real.find((s) => s.id === id); if (hit) return hit;
    const demo = await this.list(true); return demo.find((s) => s.id === id) ?? null;
  },
  async save(session: AnalysisSession): Promise<void> {
    const key = session.demo ? K.demoSessions : K.sessions;
    const all = await readJson<AnalysisSession[]>(key, []);
    const i = all.findIndex((s) => s.id === session.id);
    if (i >= 0) all[i] = session; else all.push(all.length ? session : session);
    await writeJson(key, all);
  },
  async remove(id: string): Promise<void> {
    for (const key of [K.sessions, K.demoSessions]) {
      const all = await readJson<AnalysisSession[]>(key, []);
      const next = all.filter((s) => s.id !== id);
      if (next.length !== all.length) await writeJson(key, next);
    }
  },
  async clearAll(): Promise<void> { await AsyncStorage.multiRemove([K.sessions, K.demoSessions]); },
};

export const profileStore = {
  async get(): Promise<UserProfile> {
    const p = await readJson<UserProfile | null>(K.profile, null);
    if (p) return p;
    const fresh: UserProfile = {
      id: makeId("u"), displayName: "", createdAt: new Date().toISOString(), onboardingComplete: false,
      notifications: { analysisReady: true, weeklySummary: false, reminders: false },
      privacy: { keepVideos: false, analyticsOptIn: false },
    };
    await writeJson(K.profile, fresh); return fresh;
  },
  async update(patch: Partial<UserProfile>): Promise<UserProfile> {
    const cur = await this.get(); const next = { ...cur, ...patch }; await writeJson(K.profile, next); return next;
  },
  async deleteAccount(): Promise<void> {
    await AsyncStorage.multiRemove([K.profile, K.sessions, K.demoSessions, K.devPro, K.demoMode, K.events, K.entitlement]);
  },
};

export const devStore = {
  pro: { get: () => readJson<boolean>(K.devPro, false), set: (v: boolean) => writeJson(K.devPro, v) },
  demoMode: { get: () => readJson<boolean>(K.demoMode, false), set: (v: boolean) => writeJson(K.demoMode, v) },
};

/**
 * The last verdict the store gave. The billing layer reads it to tell EXPIRED
 * from FREE (a subscription that vanished vs. one that never existed) and to
 * bridge short offline spells. Never a grant by itself: gate() only trusts a
 * verdict the billing layer has derived.
 */
export const entitlementStore = {
  get: () => readJson<Entitlement | null>(K.entitlement, null),
  set: (e: Entitlement) => writeJson(K.entitlement, e),
  clear: () => AsyncStorage.removeItem(K.entitlement),
};

/** Product analytics: event names only, plus coarse context. Never metric values or media. */
export type AnalyticsEvent =
  | "onboarding_completed" | "product_opened" | "analysis_started" | "analysis_completed" | "analysis_failed"
  | "result_viewed" | "premium_locked_metric_tapped" | "paywall_opened" | "purchase_started" | "purchase_completed"
  | "purchase_pending" | "purchase_cancelled" | "purchase_failed" | "restore_completed"
  | "report_exported" | "session_deleted";

export const analytics = {
  async track(event: AnalyticsEvent, context: Record<string, string | number | boolean> = {}) {
    const forbidden = ["value", "uri", "landmarks", "boxes", "metrics"];
    const safe = Object.fromEntries(Object.entries(context).filter(([k]) => !forbidden.some((f) => k.toLowerCase().includes(f))));
    const log = await readJson<{ e: string; t: string; c: Record<string, unknown> }[]>(K.events, []);
    log.push({ e: event, t: new Date().toISOString(), c: safe });
    await writeJson(K.events, log.slice(-500));
  },
  async dump() { return readJson<unknown[]>(K.events, []); },
};
