# Google Play Billing — Internal Testing runbook

Status 2026-10-05: the apps talk to Play Billing for real (`@gaitai/billing` →
`PlayBillingProvider` on expo-iap 5.8 / Play Billing Library via OpenIAP). Nothing is
published publicly; the target is **Internal testing → install from Google Play → real test
purchase → Pro unlocks → restore works**. Production release is a separate decision.

## What the app does

| Step | Where | Behaviour |
|---|---|---|
| Connect | `play.ts` `connect()` | `initConnection()`; one automatic reconnect on service-disconnected / not-prepared / connection-closed / timeout. Billing-unavailable devices get a clear message and the paywall says "Subscriptions not available". |
| Products | `loadProducts()` | `fetchProducts({ type: "subs" })` for the two product IDs. Price, currency, billing period and any trial/intro offer are read from Play's pricing phases. Nothing is hardcoded; a product without a recurring phase is dropped, never priced by the app. |
| Entitlement | `syncEntitlement()` | `getAvailablePurchases()` → PRO (purchased, acknowledged if needed), PENDING (slow payment), EXPIRED (previously known, no longer active, or payment-suspended), FREE, UNKNOWN (store unreachable, nothing recent cached). A store-confirmed PRO keeps unlocking for 72 h offline. Persisted via `entitlementStore`; refreshed on every app foreground. |
| Purchase | `purchase()` | Play's sheet via `requestPurchase` with the offer token. Outcome from the purchase listeners: purchased → acknowledge → PRO; pending → PENDING; user-cancelled → "cancelled"; already-owned → restore; anything else → "failed" with Play's message. A sheet left open 10 minutes resolves as failed. |
| Restore | `restore()` | `restorePurchases()` + re-sync. Message says whether Pro was found for this Google account. |
| Manage | `manage()` | `deepLinkToSubscriptions` into Play's subscription centre; falls back to the web URL. |
| Gate | `core/gate.ts` | Premium values leave storage only for `status === "PRO"` **and** `tier === "pro"`. Hiding UI is never the gate. |
| DEV | `dev.ts` | Development builds only (`__DEV__`), labelled "DEV ENTITLEMENT", never touches Play. |

Verification is client-side for Internal Testing. Before production add server-side
verification (Real-time Developer Notifications + Play Developer API) behind the same
`BillingProvider` interface.

## Product IDs (create exactly these in Play Console → Monetise → Subscriptions)

| App | Product ID | Base plan ID (suggested) | Period |
|---|---|---|---|
| MobilityCare | `mobilitycare_pro_monthly` | `monthly` | 1 month |
| MobilityCare | `mobilitycare_pro_yearly` | `yearly` | 1 year |
| SecureVision | `securevision_pro_monthly` | `monthly` | 1 month |
| SecureVision | `securevision_pro_yearly` | `yearly` | 1 year |

Prices are set in Play Console only. The paywall shows them exactly as Play reports them
and labels the yearly plan "BEST VALUE · SAVE N%" when Play's prices make it cheaper than
twelve monthly payments.

## Building the App Bundles

```powershell
powershell -File mobile\scripts\win-build.ps1 mobilitycare bundleRelease
powershell -File mobile\scripts\win-build.ps1 securevision bundleRelease
```

Outputs `android-builds\GaitAI-MobilityCare-internal.aab` and `GaitAI-SecureVision-internal.aab`,
signed with the **upload key** in `~/.gaitai-keys/gaitai-upload.jks` (passwords in
`upload-keystore.properties` beside it; both outside the repository and git-ignored by
pattern). `assembleRelease` keeps producing the debug-signed sideload APKs. The upload key's
SHA-256 is printed by `keytool -list -v`; Play App Signing re-signs the APKs it serves with
Google's app signing key.

Each Play upload needs a higher `versionCode` than the last one accepted: bump
`expo.android.versionCode` in both `app.json` files and re-run `expo prebuild` (the build
script re-applies its Gradle patches afterwards).

## Testing the states

| State | How to produce it in Internal testing |
|---|---|
| ready + prices | Install from the Play internal-testing link with a tester account; open the paywall. |
| purchased | Buy with a **licence tester** account (Play Console → Setup → Licence testing). No real charge. |
| pending | Licence testers can pick the test card "Slow test card, approves after a few minutes" in the Play sheet. The app shows PENDING and unlocks on the next foreground/refresh. |
| cancelled | Dismiss the Play sheet. |
| failed | Test card "Test card, always declines". |
| restore | Clear app data (or reinstall), open the paywall → Restore purchases. |
| expired | Test subscriptions renew every 5 minutes (monthly) / 30 minutes (yearly) and lapse after a few renewals, or cancel in Play's subscription centre and wait for the period to end. The app then shows EXPIRED. |
| billing unavailable | A device without Play services, or an APK sideloaded under a different signing key. |

## Keep out of the app

Service-account JSON, Play Console API keys and the upload keystore are never bundled or
committed (`.gitignore`: `*.jks`, `*.keystore`, `*service-account*.json`,
`play-service-account*.json`, `android-builds/*.aab`).
