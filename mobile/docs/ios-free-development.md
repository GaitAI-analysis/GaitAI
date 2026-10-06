# Running the iOS apps on your own iPhone with a free Apple ID

Goal: GaitAI MobilityCare and GaitAI SecureVision installed on **your** iPhone for testing.
No App Store, no TestFlight, no paid Apple Developer Program. Branch: `feature/ios-apps`.

## What a free Apple ID can and cannot do

| Works with a free Apple ID ("Personal Team") | Does not work until the paid Program |
|---|---|
| Build in Xcode and install on iPhones plugged into (or on the same Wi-Fi as) the Mac | TestFlight, App Store, any distribution to other people's phones |
| Camera, photo picker, on-device analysis, history, reports, share sheet, dark/light | Push notifications, Associated Domains (universal links), iCloud, Sign in with Apple, App Groups and other paid-team capabilities (none of these are used by the apps today) |
| **Local StoreKit testing** in Xcode with a StoreKit configuration file: the paywall shows test products, purchases and restores complete locally, subscriptions renew fast | Real App Store products and prices (need App Store Connect), sandbox testers, server receipts |
| Up to **3 apps** signed by the personal team installed at once; up to 10 App IDs per week | — |
| The install stays valid for **7 days**, then the app refuses to open until you build again from Xcode | — |

Also required on the phone: **Developer Mode** (Settings → Privacy & Security → Developer
Mode, iOS 16+) and trusting your developer certificate once (Settings → General → VPN & Device
Management).

## Bundle identifiers for free signing

Apple ties an explicit App ID to the first team that registers it. Signing
`in.gaitai.mobilitycare` with a personal team could later block registering it under the
company's paid team. So the repo has a switch that keeps the production identifiers untouched
and uses development ones only when you ask for them:

| App | Production (unchanged) | Free-development (`GAITAI_IOS_PERSONAL_TEAM=1`) |
|---|---|---|
| MobilityCare | `in.gaitai.mobilitycare` | `in.gaitai.mobilitycare.dev` ("GaitAI MobilityCare Dev") |
| SecureVision | `in.gaitai.securevision` | `in.gaitai.securevision.dev` ("GaitAI SecureVision Dev") |

The switch lives in `apps/<app>/app.config.js`; app.json is never edited for it. Android is
not affected.

## What you need

- **A Mac is required.** Apple only signs and installs iOS apps from Xcode on macOS. Any Mac
  that runs a current Xcode (macOS 14+ for Xcode 16) will do; it can be borrowed.
- **Your normal Apple ID is sufficient.** No membership, no payment.
- Your iPhone, its cable, iOS 16.4 or newer.
- On the Mac: Xcode (App Store, free), Node 20+, CocoaPods (`brew install cocoapods` or
  `sudo gem install cocoapods`), git.

## Exact steps (first time, about 30 minutes incl. downloads)

1. **Xcode account.** Open Xcode → Settings (⌘,) → Accounts → "+" → Apple ID → sign in. The
   team shown as "(Personal Team)" is what you will use.
2. **Get the code.**
   ```bash
   git clone https://github.com/GaitAI-analysis/GaitAI.git
   cd GaitAI && git checkout feature/ios-apps
   cd mobile && npm ci
   ```
3. **Generate the iOS project for MobilityCare** with the free-development identifier:
   ```bash
   cd apps/mobilitycare
   GAITAI_IOS_PERSONAL_TEAM=1 npx expo prebuild --platform ios --clean
   ```
   This writes `ios/` (git-ignored) and runs `pod install`. The warning about
   `edgeToEdgeEnabled` is Android-only and harmless.
4. **Open and sign.** `open ios/GaitAIMobilityCareDev.xcworkspace` (the exact name is printed
   by prebuild; it is the `.xcworkspace`, not the `.xcodeproj`). In Xcode: select the app target
   → **Signing & Capabilities** → tick **Automatically manage signing** → **Team: your name
   (Personal Team)**. Xcode registers the `.dev` App ID and makes a profile. If it complains the
   identifier is taken, change the last segment (for example `.dev2`) in the same panel.
5. **Phone.** Plug the iPhone in, unlock it, tap **Trust** on the phone. Settings → Privacy &
   Security → **Developer Mode** → on → restart when asked.
6. **Run.** In Xcode choose your iPhone in the device picker and press **Run (⌘R)**. The first
   build takes several minutes. On the phone, open Settings → General → VPN & Device Management
   → your Apple ID → **Trust**. Launch the app from the home screen.
7. **SecureVision.** Repeat steps 3–6 in `apps/securevision`. Both apps install side by side.

### Metro (JavaScript) — Debug vs Release

A Debug build loads JavaScript from a Metro server on the Mac: run `npx expo start` in the app
folder and keep the Mac on the same Wi-Fi while testing. For a self-contained install (walk
away from the Mac, test on the street), build the **Release** configuration instead: Xcode →
Product → Scheme → Edit Scheme → Run → Build Configuration → Release, then Run. The 7-day
expiry applies to both.

| Build | Billing provider in the app | Why |
|---|---|---|
| Debug (`__DEV__`) | DEV entitlement (Profile → Developer toggles Pro; labelled "DEV ENTITLEMENT") | Never talks to StoreKit |
| Release | StoreBillingProvider → StoreKit | Needs products: see next section |

### Testing the paywall with local StoreKit (optional, free)

`apps/<app>/GaitAIPro.storekit` describes the four subscriptions as **local test fixtures**
(the displayed prices are test values, not real prices — real prices only ever come from App
Store Connect). To use it: Xcode → Product → Scheme → Edit Scheme → Run → **Options** →
**StoreKit Configuration** → choose `GaitAIPro.storekit`. In a Release run the paywall then
shows the test plans, a purchase completes without payment, Pro unlocks, Restore works, and
subscriptions renew every few minutes so EXPIRED can be seen (Xcode → Debug → StoreKit →
Manage Transactions). If Xcode rejects the file as an older format, create one via File → New →
File → StoreKit Configuration File and add the same product IDs and periods.

Without the StoreKit configuration, a Release build honestly shows "Plans are not available
right now" with the App Store explanation. That is expected until App Store Connect exists.

## What to test on the phone

WalkScan: Home → Start WalkScan → wait for "Movement engine ready" → record 10–20 s of someone
walking (side view, whole body) or upload a clip → result with cadence and step-time balance.
CrowdSense: Home → Start CrowdSense → upload a clip with people → counts. Zone & occupancy:
drag the polygon handles on the frame, name the zone, Analyse.

Things to watch for the first time, because they could not be verified on Windows: the engine
reaching READY (Profile does not show it; the WalkScan screen does), the camera recording
without a microphone prompt, and a 20 s clip taking roughly a second per sampled frame on
older iPhones. If the engine shows "could not start", connect the phone to the Mac and read
`[gaitai-engine …]` lines in Xcode's console (Debug builds also allow Safari → Develop →
iPhone → inspecting the hidden engine page).

## After 7 days

The app stops opening. Plug the phone in and press Run in Xcode again; data on the phone is
kept.

## Known dependency notes

`npx expo-doctor` reports patch-level version differences (expo, expo-camera, expo-constants,
expo-router) and react-native-webview 13.17.0 against SDK 57's 13.16.1. These built and
passed QA on Android; align them with `npx expo install --check` only together with an Android
regression run.
