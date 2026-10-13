# The paid Android apps — MobilityCare and SecureVision

Status as of 2026-10-14. Both apps are **subscription products distributed
directly from gaitai.in**: free to download, nothing functional until the
signed-in account holds an active, server-confirmed subscription for that
product. Payment collection is **not live**; everything below runs in sandbox
mode until the founder activates Razorpay.

## Pieces

| Piece | Where | State |
| --- | --- | --- |
| Billing Worker (accounts, ledger, Razorpay, entitlements) | `billing/` on `main`; deployed as `gaitai-billing` (razorpay, inert) and `gaitai-billing-sandbox` (synthetic) | live on workers.dev, 23 tests green |
| Android apps 0.2.0 (build 3) | `mobile/` on `feature/paid-subscriptions` | account + subscription + gating implemented; release builds signed with the GaitAI release key |
| Website pricing, download pages, account page | `src/components/apps/SubscriptionPlans.tsx`, `AndroidDownload.tsx`, `src/components/account/`, `/mobilitycare/android/`, `/securevision/android/`, `/account/` | on `main` |
| Terms | `/legal/terms/#subscriptions` | on `main` |

## Prices (proposed, approved for sandbox 2026-10-13)

MobilityCare ₹999/month or ₹9,590.40/year; SecureVision ₹1,499/month or
₹14,390.40/year; annual = 20 % off twelve monthly payments. GST treatment
unconfirmed — see `TAX_MODE` in `billing/wrangler.jsonc` and `tax` in
`src/data/subscriptions.ts`.

## Release candidates built 2026-10-14 (not published)

Both signed with the GaitAI release key (CN=GaitAI Upload Key), version
0.2.0 (build 3), production Worker baked in, staged as a **draft** GitHub
release (`android-0.2.0-rc1`) so nothing is public until payments are live.

| APK | Bytes | SHA-256 |
| --- | --- | --- |
| GaitAI-MobilityCare-release.apk | 96 573 864 | `5b6ceb799390e5b112b920b139788d451dee9bb661979e60721875dcf7fbbb1e` |
| GaitAI-SecureVision-release.apk | 96 610 520 | `9f1a47c2da3aa591ab3ffbb6f257db1416c03b4c4f08486b8ad63c1f9540b0ac` |

Tested on the Android 16 emulator with equivalent builds pointed at the
sandbox Worker (26/26 scenario steps): sign-in required, locked screens and
deep links, 402 before payment, hosted checkout, unlock after a verified
(synthetic) payment, SecureVision stays locked for a MobilityCare
subscriber, cancel at period end, halted → locked, renewal → restored,
reinstall → restored from the ledger, sign-out. The production RC on the
same emulator: locked, prices shown, checkout refused with
`503 payments_not_activated`, sandbox routes 404.

## Publishing an APK (release gate)

1. Build with the release key: `powershell -File mobile\scripts\win-build.ps1 <app> assembleRelease -Sign -OutDir <dir>` **without** `GAITAI_API_BASE_URL` (production Worker).
2. `apksigner verify --print-certs` must show the GaitAI release certificate
   (CN=GaitAI Upload Key, SHA-256 `88:8A:4F:8E:…:90:EC`), never
   `CN=Android Debug`.
3. Install on a device/emulator; confirm: sign-in required, locked screens
   without a subscription, deep links land on the gate, analysis refused with
   402 before payment.
4. Compute SHA-256 and exact size; upload the APK as a **GitHub Release
   asset** on `GaitAI-analysis/GaitAI` (public repository, binary only — the
   signing key and secrets never leave the machine / Cloudflare).
5. Set `release.publicApk`, `bytes`, `sha256` in `src/data/product-apps.ts`;
   set `payments.live` in `src/data/subscriptions.ts` only once Razorpay is
   live; push `main`; download from the live page and compare the hash.

Do not publish while the Worker is in sandbox mode or before payments are
activated: a public app whose checkout cannot take payment is a locked app.

## Policy notes

* Direct download from gaitai.in is outside Google Play's payments policy;
  Razorpay checkout is permitted there.
* On Google Play the same apps must use Google Play Billing (India: an
  alternative billing system may be offered *alongside* it under Google's
  programme, with enrolment). The app keeps `StoreBillingProvider` for that
  path; the Worker's ledger would then be fed by Play RTDN.
* Razorpay fees (published): 2 % per domestic transaction, +0.9 % for card
  subscriptions, UPI recurring on request, 18 % GST on fees, no setup/AMC.

See `billing/README.md` for the architecture, the activation checklist and
the honest statement of what a modified APK can and cannot bypass.
