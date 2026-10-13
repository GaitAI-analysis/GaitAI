/**
 * Environment contract and the two hard safety rules.
 *
 * 1. The sandbox provider can only run in a Worker whose name says so. A
 *    production deployment with BILLING_PROVIDER accidentally set to "sandbox"
 *    refuses every request rather than letting anyone "pay" with a button.
 * 2. The Razorpay provider with no key configured is a valid, inert state:
 *    catalogue and accounts work, every checkout answers 503
 *    `payments_not_activated`. That is how production runs until the founder
 *    approves live collection and sets the secrets.
 */
export type Provider = "razorpay" | "sandbox";
export type TaxMode = "inclusive" | "exclusive" | "unconfirmed";

export interface Env {
  DB: D1Database;
  BILLING_PROVIDER: string;
  FIREBASE_PROJECT_ID: string;
  ALLOWED_ORIGINS: string;
  TAX_MODE: string;
  GST_RATE_PERCENT: string;
  PENDING_GRACE_DAYS: string;
  RENEWAL_GRACE_HOURS: string;
  ENTITLEMENT_TOKEN_HOURS: string;
  ANALYSIS_GRANT_MINUTES: string;
  PUBLIC_BASE_URL: string;
  /** "true" (default) requires a verified email before checkout. The sandbox Worker sets "false" so QA accounts need no inbox. */
  REQUIRE_VERIFIED_EMAIL?: string;
  // Secrets / optional
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET_PREVIOUS?: string;
  ENTITLEMENT_PRIVATE_JWK?: string;
  CHECKOUT_TOKEN_SECRET?: string;
  /** Test-only: a JWKS JSON used instead of Google's. Ignored unless provider is sandbox. */
  AUTH_TEST_JWKS?: string;
  /** Test-only: the Razorpay API base to call. Defaults to https://api.razorpay.com. */
  RAZORPAY_API_BASE?: string;
  /** Set by wrangler from the config name; used for the sandbox seal. */
  WORKER_NAME?: string;
}

export interface Config {
  provider: Provider;
  sandbox: boolean;
  firebaseProjectId: string;
  allowedOrigins: string[];
  taxMode: TaxMode;
  gstRatePercent: number;
  pendingGraceSeconds: number;
  renewalGraceSeconds: number;
  entitlementTokenSeconds: number;
  analysisGrantSeconds: number;
  publicBaseUrl: string;
  razorpay: { keyId: string; keySecret: string; webhookSecret: string; webhookSecretPrevious?: string; apiBase: string } | null;
  paymentsActive: boolean;
  requireVerifiedEmail: boolean;
}

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export class ConfigError extends Error {}

export function readConfig(env: Env, workerName?: string): Config {
  const provider = env.BILLING_PROVIDER === "sandbox" ? "sandbox" : env.BILLING_PROVIDER === "razorpay" ? "razorpay" : null;
  if (!provider) throw new ConfigError(`BILLING_PROVIDER must be "razorpay" or "sandbox" (got "${env.BILLING_PROVIDER}")`);
  const name = workerName ?? env.WORKER_NAME ?? "";
  if (provider === "sandbox" && name && !name.endsWith("-sandbox")) {
    throw new ConfigError(`sandbox provider refused on Worker "${name}": only a *-sandbox Worker may simulate payments`);
  }
  const taxMode: TaxMode = env.TAX_MODE === "inclusive" || env.TAX_MODE === "exclusive" ? env.TAX_MODE : "unconfirmed";
  const keyId = env.RAZORPAY_KEY_ID?.trim() ?? "";
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim() ?? "";
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  const razorpay = keyId && keySecret && webhookSecret
    ? { keyId, keySecret, webhookSecret, webhookSecretPrevious: env.RAZORPAY_WEBHOOK_SECRET_PREVIOUS?.trim() || undefined, apiBase: env.RAZORPAY_API_BASE?.trim() || "https://api.razorpay.com" }
    : null;
  if (provider === "razorpay" && razorpay && keyId.startsWith("rzp_test_sandbox")) {
    throw new ConfigError("the synthetic sandbox key is not a Razorpay key");
  }
  return {
    provider,
    sandbox: provider === "sandbox",
    firebaseProjectId: env.FIREBASE_PROJECT_ID,
    allowedOrigins: (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    taxMode,
    gstRatePercent: num(env.GST_RATE_PERCENT, 18),
    pendingGraceSeconds: num(env.PENDING_GRACE_DAYS, 3) * 86400,
    renewalGraceSeconds: num(env.RENEWAL_GRACE_HOURS, 48) * 3600,
    entitlementTokenSeconds: num(env.ENTITLEMENT_TOKEN_HOURS, 24) * 3600,
    analysisGrantSeconds: num(env.ANALYSIS_GRANT_MINUTES, 15) * 60,
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "").replace(/\/$/, ""),
    razorpay,
    paymentsActive: provider === "sandbox" ? true : razorpay !== null,
    // A production Worker always requires a verified email, whatever the var says.
    requireVerifiedEmail: provider === "razorpay" ? true : env.REQUIRE_VERIFIED_EMAIL !== "false",
  };
}

export const now = () => Math.floor(Date.now() / 1000);
