/**
 * GaitAI analysis data model, shared by both apps.
 *
 * A session is one run of one product over one input. Its metrics are split
 * at the DATA layer into `freeMetrics` and `premiumMetrics`; the premium set
 * is stored encrypted-at-rest by the platform keystore-backed store and is
 * only handed to the UI through `entitlement.unlock(session)`, which checks
 * the current entitlement. The UI never receives premium values it may not
 * show, so there is nothing to "hide behind blur".
 */

export type ProductId = "mobilitycare" | "securevision";

export type AnalysisProductId =
  | "walkscan"
  | "rehabtrack"
  | "balance"
  | "sportsmotion"
  | "crowdsense"
  | "zone"
  | "motion";

export type InputType = "recorded-video" | "uploaded-video" | "sessions";

export type AnalysisStatus =
  | "queued"
  | "preparing"
  | "detecting"
  | "tracking"
  | "computing"
  | "reporting"
  | "complete"
  | "failed"
  | "cancelled";

export type MetricCategory =
  | "rhythm"
  | "balance"
  | "variability"
  | "stability"
  | "count"
  | "occupancy"
  | "flow"
  | "quality";

export interface Metric {
  id: string;
  label: string;
  value: number | string | null;
  unit?: string;
  /** One or two plain sentences: what this is and how it was measured. */
  description: string;
  category: MetricCategory;
  /** 0–1 confidence in the measurement itself, from quality flags. */
  confidence: number;
  isPremium: boolean;
  /** Only when scientifically justified. Never a clinical range. */
  referenceRange?: { low: number; high: number; source: string };
  /** Change versus the previous session of the same product, if any. */
  trend?: { delta: number; from: string; direction: "up" | "down" | "flat" };
  /** Optional series for charts (t in seconds). */
  series?: { t: number; v: number }[];
}

export type QualityFlag =
  | "single-subject"
  | "multiple-subjects"
  | "no-subject-frames"
  | "low-visibility"
  | "short-clip"
  | "low-fps"
  | "side-view"
  | "front-view"
  | "unknown-view"
  | "dense-scene"
  | "small-subjects"
  | "demo-data";

export interface QualityReport {
  flags: QualityFlag[];
  framesAnalysed: number;
  framesWithSubject: number;
  sampleFps: number;
  durationSeconds: number;
  /** Plain-language notes shown in the result. */
  notes: string[];
}

export interface MediaReference {
  /** App-private file URI. Deleted with the session. */
  uri: string;
  mimeType: string;
  durationSeconds: number;
  width: number;
  height: number;
  /** Kept only if the user chose "keep video"; otherwise removed after analysis. */
  retained: boolean;
}

export interface AnalysisSession {
  id: string;
  userId: string;
  product: ProductId;
  analysisProduct: AnalysisProductId;
  createdAt: string;
  inputType: InputType;
  media: MediaReference | null;
  status: AnalysisStatus;
  progress: number;
  /** e.g. "mediapipe-tasks-vision@1.0.1/pose_landmarker_lite" */
  modelVersion: string;
  engine: "on-device-webengine";
  freeMetrics: Metric[];
  /** Present in storage; delivered to the UI only through the entitlement gate. */
  premiumMetrics: Metric[];
  quality: QualityReport;
  /** Two plain sentences for the history list and the result header. */
  summary: string;
  /** True only in development Demo Data Mode. Never mixed with real sessions. */
  demo: boolean;
  /** Zone analysis: polygon in frame fractions. */
  zone?: { name: string; points: { x: number; y: number }[] };
  /** For comparisons: the sessions this one was derived from. */
  sourceSessionIds?: string[];
  reportId?: string;
  error?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  createdAt: string;
  onboardingComplete: boolean;
  notifications: { analysisReady: boolean; weeklySummary: boolean; reminders: boolean };
  privacy: { keepVideos: boolean; analyticsOptIn: boolean };
}

export type EntitlementTier = "free" | "pro";
export type EntitlementSource = "none" | "play-billing" | "app-store" | "dev";
/**
 * The entitlement layer's verdict. Only PRO unlocks premium values (see gate.ts);
 * the other states say why not, so screens can explain instead of just hiding.
 *   FREE     no subscription for this account
 *   PRO      an active subscription (or the development entitlement in dev builds)
 *   EXPIRED  there was a subscription and the store no longer reports it active
 *   PENDING  a purchase the store has not confirmed yet (e.g. a slow payment method)
 *   UNKNOWN  the store could not be reached and nothing recent is cached
 */
export type EntitlementStatus = "FREE" | "PRO" | "EXPIRED" | "PENDING" | "UNKNOWN";

export interface Entitlement {
  status: EntitlementStatus;
  /** Derived from status: "pro" if and only if status is PRO. Kept for older callers. */
  tier: EntitlementTier;
  source: EntitlementSource;
  productId?: string;
  expiresAt?: string;
  /** In grace period after a failed renewal (Play reports this). */
  inGracePeriod?: boolean;
  /** Purchase acknowledged but not yet granted by Play. */
  pending?: boolean;
  /** ISO time the store last confirmed this verdict. */
  checkedAt?: string;
  /** One sentence for the Profile and paywall copy, written by the billing layer. */
  reason?: string;
}

/** What free users see of a session: no premium values, only their names. */
export interface LockedMetricPreview {
  id: string;
  label: string;
  description: string;
  category: MetricCategory;
  unit?: string;
}

export interface ResultView {
  session: Omit<AnalysisSession, "premiumMetrics">;
  free: Metric[];
  /** Populated only when the entitlement allows it. */
  premium: Metric[] | null;
  locked: LockedMetricPreview[];
  entitlement: Entitlement;
}

export function toLockedPreview(m: Metric): LockedMetricPreview {
  return { id: m.id, label: m.label, description: m.description, category: m.category, unit: m.unit };
}

export function makeId(prefix = "s"): string {
  const r = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${r}`;
}
