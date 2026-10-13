# Subscriptions in the Android apps

Both apps are **paid, subscription-gated**. The APK is free to download; no
functional screen works without a signed-in GaitAI account that holds an
active, server-confirmed subscription for *that* product.

## The journey

Download APK → open → onboarding → **Sign in / Create account** (Firebase
email + password) → verify email → **Subscription screen** (`/paywall`): two
plans, annual highlighted "Save 20 %", recurring/cancellation/tax disclosures →
**Secure checkout** (`/checkout`, a WebView on the billing Worker's hosted
page: Razorpay Standard Checkout, or two simulate buttons on the sandbox
Worker) → Worker verifies the signature and reconciles with the gateway →
app re-reads `/v1/me` → everything unlocks.

## Where the gate is

| Layer | File | What it does |
| --- | --- | --- |
| Routes | `scripts/gen-routes.mjs` → every tab, flow and result route | wraps in `RequireSubscription` (`packages/ui/src/gate.tsx`): signed-out → sign-in prompt; unpaid → locked screen. Deep links land here too. |
| Root | `_layout.tsx` (generated) | signed-out users are redirected to `/auth/sign-in` from any non-public segment |
| Analysis start | `WalkScan.tsx`, `Crowd.tsx`, `RehabTrack.tsx` | `app.authorizeAnalysis(kind)` → `POST /v1/analysis/grant`; 402 → subscription screen |
| Values | `packages/core/src/gate.ts` | premium values only for a PRO verdict from the server provider |
| Verdict | `packages/billing/src/server.ts` | `ServerBillingProvider`: `/v1/me` online; signed token (≤24 h) offline; UNKNOWN → locked |

Account routes stay reachable without a subscription: `auth/*`, `paywall`,
`checkout`, `account/manage`, the Profile tab, privacy/terms/support links,
sign-out, delete account.

## Configuration (public values, `app.config.js` → `expo.extra`)

| Env | Default | Meaning |
| --- | --- | --- |
| `GAITAI_API_BASE_URL` | production Worker | which billing Worker the build talks to; QA builds use `…-sandbox` |
| `GAITAI_BILLING_MODE` | derived | label only |
| `GAITAI_ENTITLEMENT_PUBLIC_JWK` | matches the Worker | Ed25519 public key for offline token checks |

The Firebase web API key is public configuration (it is in every page of
gaitai.in); access is governed by Firebase and the Worker.

## Builds

```
# QA build against the sandbox Worker, signed with the release key
$env:GAITAI_API_BASE_URL="https://gaitai-billing-sandbox.gait-ai-founder.workers.dev"
powershell -File mobile\scripts\win-build.ps1 mobilitycare assembleRelease -Sign -OutDir <dir>

# Public release candidate (production Worker)
Remove-Item Env:GAITAI_API_BASE_URL
powershell -File mobile\scripts\win-build.ps1 mobilitycare assembleRelease -Sign -OutDir <dir>
```

Never publish a debug-signed APK. The release key lives in `~/.gaitai-keys`
and never enters the repository.

## Platform policy

* **Direct APK from gaitai.in**: Google Play's payments policy does not apply
  to apps distributed outside Play; Razorpay checkout is permitted.
* **If published on Google Play**: in-app digital subscriptions must use
  Google Play Billing; in India an alternative billing system may be offered
  *alongside* Play Billing under Google's user-choice/alternative-billing
  programme (enrolment required; service fee reduced by 4 points). Switch
  `AppProvider` to `StoreBillingProvider` for a Play build and keep the server
  ledger as the record (Play RTDN → Worker is the follow-up).
* **iOS**: StoreKit stays (`StoreBillingProvider`); no account is required
  there today and no iOS build exists.

## Offline behaviour and limits

* Online: every launch, foreground and analysis is checked with the Worker.
* Offline: a signed token issued in the last 24 h keeps the app unlocked
  ("grace"); after that it locks until the Worker can be reached.
* A modified APK can skip the on-device gate and run the engine locally; it
  cannot obtain a grant, a valid token or anything from the Worker. Making
  metric computation server-side would close that gap (see
  `billing/README.md`, "What can be bypassed").

## Removed in 0.2.0

* DEV entitlement toggle (`DevEntitlementProvider` kept in the tree, unused).
* `RECORD_AUDIO` permission (never needed; recordings are muted).
* "Nothing requires an account" copy.
