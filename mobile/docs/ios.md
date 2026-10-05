# GaitAI iOS apps — MobilityCare and SecureVision

Written for someone with little iOS experience. Everything below was prepared on a Windows
workstation on branch `feature/ios-apps`; nothing here claims an iOS build exists until the
TestFlight section says so.

## 1. Architecture: one codebase, two apps, two platforms

```
mobile/
├── apps/
│   ├── mobilitycare/   app.json (iOS + Android identity), eas.json, thin expo-router routes
│   └── securevision/   same shape
└── packages/
    ├── ui/             every screen, tabs, app-state (shared by both apps and both platforms)
    ├── core/           schema, local storage, the entitlement gate
    ├── analysis/       the on-device engine (hidden WebView running MediaPipe), gait + crowd maths
    ├── billing/        StoreBillingProvider (Play on Android, StoreKit on iOS), DEV provider
    └── design-system/  tokens, product themes (teal MobilityCare, royal SecureVision)
```

There is no iOS-specific app code. iOS differences live in three places only:

| Concern | Where | What differs on iOS |
|---|---|---|
| Engine file access | `packages/analysis/src/engine.tsx` | WKWebView may read only one directory (`allowingReadAccessToURL`). Bundled engine files are copied once from the .app bundle into the cache's `gaitai-engine/` folder so page, runtime, models and the clip share that root. `onContentProcessDidTerminate` mirrors Android's renderer-gone recovery. |
| Billing | `packages/billing/src/store.ts` | `Platform.OS` picks Apple StoreKit through expo-iap; product mapping reads `displayPrice`, period and intro offers from App Store metadata; the active subscription comes from StoreKit 2 entitlements with its expiry date. |
| Permissions and identity | `apps/*/app.json` | bundle identifier, build number, icon, Info.plist strings, privacy manifest. |

Reports share through the native share sheet (`expo-sharing`), the picker is the system
photo picker (`expo-image-picker`), the camera is `expo-camera`, haptics are `expo-haptics`,
navigation is expo-router (native stack with the swipe-back gesture, native tab bar), and
layout uses `react-native-safe-area-context` insets everywhere, so notch and Dynamic Island
are handled. Text respects Dynamic Type up to 1.6× (`maxFontSizeMultiplier`).

## 2. Identities

| App | Display name | iOS bundle identifier | Android application id |
|---|---|---|---|
| MobilityCare | GaitAI MobilityCare | `in.gaitai.mobilitycare` | `in.gaitai.mobilitycare` |
| SecureVision | GaitAI SecureVision | `in.gaitai.securevision` | `in.gaitai.securevision` |

Version 0.1.1, iOS `buildNumber` 2, Android `versionCode` 2. Both apps install side by side.

## 3. Permissions (Info.plist) — only what is used

| Key | Source | Why |
|---|---|---|
| `NSCameraUsageDescription` | expo-camera plugin | WalkScan records a walking clip; SecureVision records a space. |
| `NSPhotoLibraryUsageDescription` | expo-image-picker plugin | choosing an existing video. (The system picker does not prompt; the string exists for the limited-library path.) |
| not set: `NSMicrophoneUsageDescription` | — | recordings are made with `mute`; no audio is captured, so the microphone is not requested. |
| not set: `NSPhotoLibraryAddUsageDescription` | — | nothing is saved to the photo library. Reports leave through the share sheet. |
| not set: location, contacts, tracking | — | not used. |
| `ITSAppUsesNonExemptEncryption = false` | app.json | only HTTPS to the store; skips the export-compliance question on every upload. |

**Privacy manifest** (`ios.privacyManifests` in app.json): no tracking, no collected data
types, and the four "required reason" API categories React Native and Expo touch
(UserDefaults CA92.1, file timestamps C617.1, system boot time 35F9.1, disk space E174.1).
Third-party SDKs with their own manifests: react-native-webview, expo modules, expo-iap /
OpenIAP. Re-audit when a dependency is added.

**Honesty of claims.** The apps currently make no network calls other than the store. The
analysis runs on the device (MediaPipe in WKWebView). Analytics events are stored locally
only. If a backend, account sync or server-side receipt verification is added later, update
`NSPrivacyCollectedDataTypes`, the App Privacy answers and the in-app wording ("Nothing is
uploaded for processing") in the same change.

## 4. The analysis engine on iOS — what is known and what must be verified

Known from the code and WebKit behaviour (not yet run on a device):

- WKWebView loads `file://` pages via `loadFileURL(_:allowingReadAccessTo:)`; react-native-webview
  passes `allowingReadAccessToURL`, set to the cache directory. The clip (picker and camera
  both write under the cache), the page and the staged engine files are all under it.
- `fetch()` refuses `file://` in WebKit; the engine page uses `XMLHttpRequest`, which works when
  `allowFileAccessFromFileURLs` / `allowUniversalAccessFromFileURLs` are set (react-native-webview
  sets the WKPreferences keys). This is a widely shipped configuration; if a future WebKit
  version blocks it, the fallback is serving the engine over a loopback HTTP server.
- WebAssembly SIMD (the MediaPipe runtime) requires iOS 16.4+, which is Expo SDK 57's minimum.
- `<video playsinline muted>` plus `allowsInlineMediaPlayback` lets Safari decode frames without
  entering full screen; `detectForVideo` reads them through WebGL, which Safari supports.
- The JS bridge is the same `window.ReactNativeWebView.postMessage` and `message` events.

To verify on the first TestFlight build (see §9): engine READY time, WalkScan on a real clip,
background/foreground during analysis (expect `WebView renderer gone` recovery if iOS kills
the content process), and the 20 s camera recording without a microphone prompt.

## 5. Subscriptions (StoreKit)

Product IDs are identical on both stores; Apple does not require a namespace:

| App | Product ID | Subscription group |
|---|---|---|
| MobilityCare | `mobilitycare_pro_monthly`, `mobilitycare_pro_yearly` | GaitAI Pro (MobilityCare) |
| SecureVision | `securevision_pro_monthly`, `securevision_pro_yearly` | GaitAI Pro (SecureVision) |

Prices are set only in App Store Connect; the paywall shows `displayPrice`, the billing period
and any introductory offer exactly as StoreKit reports them. Entitlement verdicts: FREE, PRO
(active or in grace period, with expiry date), EXPIRED (was active, no longer returned, or in
billing retry), PENDING (Ask to Buy / deferred), UNKNOWN (store unreachable, no recent cache).
A store-confirmed PRO keeps working 72 h offline. Restore uses `restorePurchases` (StoreKit
sync). Manage opens the App Store subscription sheet. Verification is client-side for
TestFlight; production adds App Store Server Notifications + the App Store Server API.

Testing in TestFlight uses **sandbox** accounts (App Store Connect → Users and Access → Sandbox
Testers). Sandbox renewals are accelerated (a month ≈ 5 minutes), which is how EXPIRED is
exercised. "Ask to Buy" on a child sandbox account produces PENDING.

## 6. Building — this workstation cannot run Xcode

Two supported paths:

**A. EAS Build (cloud, recommended).** Each app has `eas.json` with profiles `development`,
`preview` (internal distribution) and `testflight` (store distribution). Steps, run from
`mobile/apps/<app>`:

```bash
npx eas-cli login            # the founder's Expo account — never a shared or invented one
npx eas-cli init             # writes extra.eas.projectId into app.json (commit it)
npx eas-cli build --platform ios --profile testflight
npx eas-cli submit --platform ios --profile testflight --latest
```

EAS asks once to create the iOS distribution certificate and provisioning profile using the
Apple Developer account; say yes and let EAS manage them. Nothing is stored in the repo.

**B. A Mac with Xcode.** `npx expo prebuild --platform ios` in the app folder generates
`ios/`, then `npx pod-install`, open `ios/*.xcworkspace`, select the team, Product → Archive →
Distribute → TestFlight. The generated `ios/` folder stays git-ignored.

Either way the artifact is an `.ipa` uploaded to App Store Connect. Name it
`GaitAI-MobilityCare-TestFlight.ipa` / `GaitAI-SecureVision-TestFlight.ipa` if downloaded.

## 7. Updating a build

Bump `expo.version` for user-visible releases and always bump `ios.buildNumber` (and Android
`versionCode`) before a new upload; App Store Connect rejects a repeated build number. Then
rebuild with the same profile and submit.

## 8. Apple account steps (done one at a time in chat)

1. Enrol or confirm enrolment in the Apple Developer Program (organisation or individual).
2. Accept the latest agreements in App Store Connect; add banking/tax for paid subscriptions.
3. Create the two app records (bundle identifiers above).
4. Create the subscription groups and the four subscriptions; set prices.
5. Create sandbox tester accounts.
6. Log in to EAS and run `eas init` for each app; build with the `testflight` profile.
7. Submit to TestFlight; add internal testers; install from the TestFlight app.

## 9. TestFlight QA checklist

Launch · onboarding · camera permission prompt (no microphone prompt) · 20 s recording ·
photo picker · engine READY card then unlock · WalkScan on a real walking clip → cadence and
step-time balance · premium lock · paywall shows App Store prices · sandbox purchase →
PRO · Restore purchases after reinstall · history · report share sheet · dark and light ·
aeroplane mode analysis · background during analysis · iPhone SE / standard / Pro Max · iPad
(supportsTablet). SecureVision: CrowdSense count, Zone polygon drag on a real touch screen,
zone result.

## 10. Metric honesty (what the result screens show)

| Metric | Kind | Notes |
|---|---|---|
| Cadence (steps/min) | REAL (free) | from detected foot contacts |
| Step-time balance (%) | REAL (free) | left/right step-duration ratio; not spatial symmetry |
| Step-time variability, stride regularity, trunk sway, L/R step timing, contact timeline | REAL / DERIVED (Pro) | 2D estimates from one camera, no spatial calibration |
| Trend vs previous, RehabTrack change | DERIVED (Pro) | difference between stored sessions |
| CrowdSense counts | REAL (free + Pro timeline) | detector output per sampled frame |
| Zone entries / exits / dwell | ESTIMATED (Pro) | centroid tracking between frames |
| Balance, SportsMotion, Motion analysis | NOT IMPLEMENTED | shown as "Coming soon", not startable |

No metric is a diagnosis; the result screen says so and safety-relevant notes are never behind Pro.
