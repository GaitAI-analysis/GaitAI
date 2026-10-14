# gaitai-billing — subscriptions and entitlements for the paid Android apps

The backend-authoritative half of the paid **GaitAI MobilityCare** and
**GaitAI SecureVision** Android apps. A Cloudflare Worker with a D1 ledger
that knows who paid for what, asks Razorpay, and tells the apps — never the
other way round.

```
 Android app ──Firebase ID token──▶ gaitai-billing (Worker) ──Basic auth──▶ Razorpay API
      ▲                               │   D1: customers, plans,              │
      │  signed entitlement token /   │   subscriptions, payments,           │ webhooks (HMAC)
      └── per-analysis grant ◀────────┘   webhook_events, audit_log ◀────────┘
 gaitai.in/account ──same token──────▶ same Worker
```

## What it guarantees

* **Who**: every protected route needs a Firebase Authentication ID token
  (email + password accounts, project `gaitai-intelligence`), verified against
  Google's published keys — issuer, audience, expiry, signature.
* **What they bought**: the ledger row for the Razorpay subscription, written
  only from (a) signature-verified checkout results and (b) HMAC-verified
  webhooks, both reconciled against Razorpay's own record.
* **Whether it is paid now**: `src/entitlement.ts` re-derives the verdict from
  the ledger on every call — active / authenticated / pending-with-grace /
  halted / cancelled-until-period-end / refunded / expired. Nothing the device
  says is trusted.
* **Per product**: MobilityCare and SecureVision are separate subscriptions;
  the rule never looks across products.
* **Forgery and replay**: checkout signatures are HMAC-SHA256 over the
  **server-stored** subscription id; webhooks are HMAC-SHA256 over the raw body
  with the webhook secret (plus the previous secret during rotation),
  de-duplicated by `x-razorpay-event-id`, and an older event can never regress
  a newer status.
* **Offline**: the app may cache a signed (Ed25519) entitlement token for at
  most 24 h; `/v1/keys` publishes the public key. The token is a convenience,
  not the boundary — see "What can be bypassed".

## Routes

| Route | Auth | Purpose |
| --- | --- | --- |
| `GET /health` | – | mode and whether payments are active |
| `GET /v1/catalog` | – | plans, prices (paise), savings, tax mode, disclosures |
| `GET /v1/keys` | – | Ed25519 public key for entitlement tokens |
| `GET /v1/me` | bearer | account, both entitlements (+tokens), subscriptions |
| `GET /v1/entitlement?product=` | bearer | one verdict + token |
| `POST /v1/analysis/grant` `{product, kind}` | bearer | 15-minute grant, or **402** |
| `POST /v1/checkout` `{product, cycle}` | bearer, verified email | creates the gateway subscription; returns hosted checkout URL |
| `GET /v1/checkout/page?t=` | checkout token | hosted page: Razorpay Standard Checkout (or sandbox buttons) |
| `POST /v1/checkout/verify` | checkout token or bearer | verifies signature, reconciles with the gateway, unlocks |
| `POST /v1/subscriptions/:id/cancel` `{at_cycle_end}` | bearer (owner) | cancel at period end (default) or now |
| `GET /v1/billing/history` | bearer | payments |
| `POST /v1/account/delete` | bearer | cancel + anonymise |
| `POST /v1/webhooks/razorpay` | `X-Razorpay-Signature` | gateway events |
| `POST /v1/sandbox/pay`, `/v1/sandbox/simulate` | sandbox Worker only | synthetic checkout + lifecycle scenarios |

## Plans (approved as PROPOSED pricing, 2026-10-13)

| Product | Monthly | Annual (−20 %) |
| --- | --- | --- |
| MobilityCare | ₹999.00 (99 900 paise) | ₹9,590.40 (959 040 paise) |
| SecureVision | ₹1,499.00 (149 900 paise) | ₹14,390.40 (1 439 040 paise) |

GST treatment is `TAX_MODE=unconfirmed` until the founder decides; every
surface prints the mode. Razorpay plan period: `monthly`/`yearly`, interval 1;
`total_count` 120 / 10 (Razorpay's ten-year limit).

## Two Workers, two states

| Worker | Config | Provider | Can charge? |
| --- | --- | --- | --- |
| `gaitai-billing-sandbox` | `wrangler.sandbox.jsonc` | `sandbox` (synthetic) | **No.** Buttons simulate the gateway; `/v1/sandbox/*` exists only here. The seal in `src/env.ts` refuses the sandbox provider on any Worker not named `*-sandbox`. |
| `gaitai-billing` | `wrangler.jsonc` | `razorpay` | **Not until the Razorpay secrets are set.** Without them the catalogue reports `paymentsActive:false` and checkout answers `503 payments_not_activated`. |

Both are deployed on the existing Cloudflare account (free plan; D1 free
tier). Nothing in this directory enables a paid service.

## Secrets (never in the repository)

| Secret | Set by | Purpose |
| --- | --- | --- |
| `ENTITLEMENT_PRIVATE_JWK` | `scripts/keygen.mjs` → `wrangler secret put` | signs entitlement tokens and grants |
| `CHECKOUT_TOKEN_SECRET` | same | HMAC for hosted-checkout page tokens |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | founder, from the Razorpay dashboard (test mode first) | API auth + checkout signature |
| `RAZORPAY_WEBHOOK_SECRET` (+ `_PREVIOUS`) | founder, from Razorpay → Webhooks | webhook HMAC |

## Activating payments (founder checklist)

Live checkout opens only when BOTH the three Razorpay secrets are set AND
`TAX_MODE` is "inclusive" or "exclusive" (`src/env.ts`); checkout also
refuses any plan whose amount differs from what the app shows for that tax
mode (`chargedPaise` in `src/catalog.ts`). Nothing here can charge by accident.

1. Razorpay account for GaitAI: KYC approved, **Subscriptions** enabled, and
   the recurring methods you want (UPI AutoPay, card mandates, e-NACH)
   confirmed by Razorpay for the account. Website/app review: Razorpay asks
   for About, Contact, Pricing, Terms, Privacy and Refund pages for a website,
   or an App URL for an app — agree with Razorpay which applies before submitting.
2. Decide GST and set `TAX_MODE` (and `GST_RATE_PERCENT`) in `wrangler.jsonc`;
   redeploy (`npm run deploy`).
3. **Test mode**: generate API keys; webhook →
   `https://gaitai-billing.gait-ai-founder.workers.dev/v1/webhooks/razorpay`,
   events `subscription.authenticated`, `.activated`, `.charged`, `.pending`,
   `.halted`, `.cancelled`, `.completed`, `.updated`, `payment.failed`,
   `refund.created`, `refund.processed`, with a webhook secret.
4. `wrangler secret put RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `RAZORPAY_WEBHOOK_SECRET` in `billing/` (typed at the prompt — never in a
   file, a commit or a chat).
5. `TAX_MODE=<same as step 2> RAZORPAY_KEY_ID=… RAZORPAY_KEY_SECRET=… npm run plans:sync`
   creates the four plans at the charged amount and writes their ids into D1.
6. Test-mode end to end in the app: subscribe (UPI + card), webhook arrives,
   analysis unlocks for that product only, cancel at period end, refund.
7. Repeat 3–6 with **Live** keys; one real low-value purchase and refund
   before announcing anything. Then set `payments.live` in the website's
   `src/data/subscriptions.ts` (it only removes the "Subscriptions coming
   soon" line — the site shows no prices either way).

**Fees (Razorpay published pricing, 2026-10-13):** 2 % platform fee per
successful domestic transaction (2.15 % corporate cards; international up to
3 %); card-based subscriptions carry an extra 0.9 %; UPI/e-mandate recurring is
"pricing on request"; 18 % GST on Razorpay's fee; no setup or annual fee;
T+1 settlement. Confirm on the dashboard before going live.

## What can be bypassed, and what cannot

* **Cannot** be bypassed: anything decided by this Worker — checkout, the
  ledger, the verdict, `/v1/analysis/grant`, `/v1/me`. A patched APK cannot
  mint a grant or a valid entitlement token (Ed25519 private key is only here),
  and the Worker never reads entitlement from the device.
* **Can** be bypassed on a modified device: the on-device analysis itself.
  Pose/detection inference and the metric maths run inside the app; a
  patched APK could skip `authorizeAnalysis()` and run the engine. Strict
  enforcement would mean moving the metric computation (pure TypeScript in
  `packages/analysis` (private app repos): `computeGait`, `computeCrowd`, `computeZone`, the
  session builders) into this Worker: the device would send landmarks/boxes
  (~26 k numbers per 20 s clip) and receive metrics only when entitled. Cost:
  within the Workers free tier at launch volumes (CPU-light JSON maths, no
  GPU; pose inference stays on the phone). Trade-off: landmark data would
  leave the phone, which the apps currently promise it never does — a product
  decision the founder has to make. Not implemented.

## Development

```
cd billing
npm install
npm test                 # 23 tests inside workerd: auth, pricing, checkout, webhooks, lifecycle, seal
npm run typecheck
npm run dev              # sandbox Worker on http://127.0.0.1:8790
```

The website (`/account`) and the apps talk to the production Worker by
default; QA builds point at the sandbox Worker (`GAITAI_API_BASE_URL`,
`NEXT_PUBLIC_BILLING_API`).
