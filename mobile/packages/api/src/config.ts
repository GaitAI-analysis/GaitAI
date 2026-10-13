/**
 * Where the app talks to. Everything here is PUBLIC configuration: the
 * billing Worker's URL, Firebase's web API key (a public identifier, not a
 * secret — security is in Firebase's rules and the Worker's token checks)
 * and the Ed25519 PUBLIC key that verifies cached entitlement tokens.
 *
 * Values come from `expo.extra` (set in app.config.js, overridable with
 * environment variables at build time) so a sandbox build and a production
 * build differ only in configuration, never in code.
 */
import Constants from "expo-constants";

interface Extra {
  apiBaseUrl?: string;
  firebaseApiKey?: string;
  firebaseProjectId?: string;
  entitlementPublicJwk?: { kty: string; crv: string; x: string; kid?: string } | null;
  billingMode?: "razorpay" | "sandbox";
}

const extra = ((Constants.expoConfig?.extra ?? {}) as Extra) || {};

export const API_BASE_URL = (extra.apiBaseUrl ?? "https://gaitai-billing.gait-ai-founder.workers.dev").replace(/\/$/, "");
export const FIREBASE_API_KEY = extra.firebaseApiKey ?? "";
export const FIREBASE_PROJECT_ID = extra.firebaseProjectId ?? "gaitai-intelligence";
export const ENTITLEMENT_PUBLIC_JWK = extra.entitlementPublicJwk ?? null;
/** Informational: the sandbox Worker simulates payments; the UI labels it. */
export const BILLING_MODE: "razorpay" | "sandbox" = extra.billingMode === "sandbox" || API_BASE_URL.includes("-sandbox") ? "sandbox" : "razorpay";

export const ACCOUNT_URL = "https://gaitai.in/account/";
export const PRIVACY_URL = "https://gaitai.in/legal/privacy/";
export const TERMS_URL = "https://gaitai.in/legal/terms/";
export const SUPPORT_EMAIL = "support@gaitai.in";
