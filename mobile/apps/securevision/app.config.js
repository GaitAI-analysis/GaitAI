// Dynamic layer over app.json. app.json stays the single source of truth for the
// production identity; this file applies build-time configuration and
// development overrides.
//
// SUBSCRIPTION SERVICE (expo.extra — all public values):
//   GAITAI_API_BASE_URL   the billing Worker. Default: production
//                         (razorpay mode, inert until the founder activates
//                         payments). Set to the sandbox Worker for test builds:
//                         https://gaitai-billing-sandbox.gait-ai-founder.workers.dev
//   GAITAI_BILLING_MODE   "razorpay" | "sandbox" — label only; the Worker's
//                         catalogue is authoritative.
//   GAITAI_ENTITLEMENT_PUBLIC_JWK  JSON of the Worker's Ed25519 PUBLIC key for
//                         verifying cached entitlement tokens offline. Defaults
//                         match the deployed Workers; /v1/keys is also read.
//   The Firebase web API key is a public identifier (it is in every page of
//   gaitai.in); access is governed by Firebase rules and the Worker's checks.
//
// iOS development overrides (unchanged):
//   GAITAI_IOS_PERSONAL_TEAM=1   appends ".dev" to the bundle id and " Dev" to the name.
//   GAITAI_APPLE_TEAM_ID=XXXXXXXXXX  team id for `npx expo run:ios --device`.
const PROD_API = "https://gaitai-billing.gait-ai-founder.workers.dev";
const SANDBOX_API = "https://gaitai-billing-sandbox.gait-ai-founder.workers.dev";
const PUBLIC_KEYS = {
  [PROD_API]: { kty: "OKP", crv: "Ed25519", x: "kWnI3clUJ0by-Lg0SE7vudXq9k5hvR_CXK5ML6d5Ka0", kid: "70f2f7fc189f0135" },
  [SANDBOX_API]: { kty: "OKP", crv: "Ed25519", x: "bQe3oCtDZSlhVwuFVS5Dq-knxlPt6cbGmaqSdTSo_0k", kid: "76e3e57493dd57dd" },
};

module.exports = ({ config }) => {
  const personal = process.env.GAITAI_IOS_PERSONAL_TEAM === "1";
  const teamId = process.env.GAITAI_APPLE_TEAM_ID;
  const ios = { ...config.ios };
  if (personal) ios.bundleIdentifier = `${ios.bundleIdentifier}.dev`;
  if (teamId) ios.appleTeamId = teamId;
  const apiBaseUrl = (process.env.GAITAI_API_BASE_URL || PROD_API).replace(/\/$/, "");
  const envKey = process.env.GAITAI_ENTITLEMENT_PUBLIC_JWK;
  return {
    ...config,
    name: personal ? `${config.name} Dev` : config.name,
    ios,
    extra: {
      ...(config.extra || {}),
      apiBaseUrl,
      billingMode: process.env.GAITAI_BILLING_MODE || (apiBaseUrl === SANDBOX_API ? "sandbox" : "razorpay"),
      firebaseApiKey: process.env.GAITAI_FIREBASE_API_KEY || "AIzaSyDu44IhOSsA5nGbuPRuCXGeUkZaDXZiYDA",
      firebaseProjectId: "gaitai-intelligence",
      entitlementPublicJwk: envKey ? JSON.parse(envKey) : PUBLIC_KEYS[apiBaseUrl] || null,
    },
  };
};
