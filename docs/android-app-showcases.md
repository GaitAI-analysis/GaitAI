# The MobilityCare and SecureVision Android apps on gaitai.in

The two product pages carry an "Explore the app" section (`#app`) built from
`src/data/product-apps.ts` and rendered by `src/components/apps/AppShowcase.tsx`
with the walkthrough in `AppWalkthrough.tsx`. This note records where the apps
come from, what was verified about the build artefacts on 2026-10-13, and
what still stands between them and a public release. It is the source for the
release-status copy on the pages: when a row below changes, change the data
file in the same commit.

## Where the apps live

| | GaitAI MobilityCare | GaitAI SecureVision |
|---|---|---|
| Source | `mobile/apps/mobilitycare` on branch `feature/native-apps-v2` (shared code in `mobile/packages/*`) | `mobile/apps/securevision` on the same branch |
| Stack | React Native + Expo Router (native screens), Expo 57 monorepo | same |
| Analysis | On the device: MediaPipe Tasks Vision (WebAssembly) in a hidden WebView; metrics computed in TypeScript from landmarks / boxes | same, with the EfficientDet-Lite0 person detector |
| Backend | None for analysis. Play Billing for subscriptions (not configured yet). No account, no upload. | same |
| Package | `in.gaitai.mobilitycare` | `in.gaitai.securevision` |
| Version | 0.1.1, `versionCode` 2 | 0.1.1, `versionCode` 2 |
| Android | minSdk 24 (Android 7.0), targetSdk 36; arm64-v8a and x86_64 | same |
| Capability record | `docs/mobile-product-capability-matrix.md` (same branch) | same |

The earlier Trusted Web Activity wrappers on `feature/android-apps`
(`GaitAI-*-debug.apk`, 1.7 MB, TEST-signed, version 1.0.0) are the first
packaging prototype and are not the apps shown on the site.

There is no web version of either app. The site's `/movement-lab/` is a
browser demonstration of pose tracking and is labelled as such where it is
linked from the MobilityCare showcase. GaitAI Care is a different product.

## What the showcase shows

Every screenshot under `public/images/apps/<app>/` is the app itself, running
on the Android 16 emulator (`gaitai_test`, 1080×2400) with the movement engine
READY, captured in light and dark with `adb exec-out screencap` and encoded
with ffmpeg to WebP at 540 and 810 px wide. The results on the Result,
Progress, Activity and Reports screens are the apps' own history from earlier
test clips; nothing was composited or retouched. The paywall screen was
captured but is not shown, because subscriptions are not configured in this
build ("Subscriptions not available in this build").

To refresh the set: install the current debug APK on the emulator, switch
`adb shell cmd uimode night yes|no`, capture each screen, and encode with
`ffmpeg -i shot.png -vf scale=540:-1 -quality 82 <id>-<theme>-540.webp` (and
810). Keep the ids in `product-apps.ts` in step with the files.

## Artefact inspection (2026-10-13)

Files in `local-backups/2026-10-13-main-cleanup/android-builds/` (outside the
repository). SHA-256 is of the file as inspected.

| File | Size | Signer | SHA-256 |
|---|---|---|---|
| GaitAI-MobilityCare-native-debug.apk | 94,397,475 B | `CN=Android Debug` (debug key) | `38c4f1c854d42ceea294f8762445cf4d9ac81557ebd3baad1e2f654a0be8b52c` |
| GaitAI-SecureVision-native-debug.apk | 94,434,103 B | `CN=Android Debug` (debug key) | `34730c46f9907585bb17024619d08edba203240eb4fcb088bea479a7171c1bc7` |
| GaitAI-MobilityCare-internal.aab | 67,359,478 B | `CN=GaitAI Upload Key` (matches `~/.gaitai-keys/gaitai-upload.jks`) | `4b111df41d9347ca38e0c6a6236e71d2bf868e3b94fbcc60d592cf1336e78930` |
| GaitAI-SecureVision-internal.aab | 67,397,108 B | `CN=GaitAI Upload Key` | `324c625453ddfa2577686832cfa839b9f03c7ddfe4e04c4c7cb511c1e9d2ca57` |
| GaitAI-MobilityCare-debug.apk (TWA prototype) | 1,724,590 B | `CN=GaitAI mobilitycare TEST signing` | `107ab3c9467dce7ba10d9fa4c974239dfdf3dd333363792ee676b446f0c79178` |
| GaitAI-SecureVision-debug.apk (TWA prototype) | 1,765,550 B | TEST signing | `6e3f1c9d4ffedb8f76e3c7da81c9ae4e2ff1ae2b30caeaac7972aea4dfeeedc3` |
| GaitAI-*-test.aab (TWA prototype) | 1.8 MB | — | `4e90e45d…`, `ae05c76d…` |

Permissions in the native APKs: CAMERA, RECORD_AUDIO, INTERNET,
ACCESS_NETWORK_STATE, WAKE_LOCK, VIBRATE, READ/WRITE_EXTERNAL_STORAGE
(maxSdk 32) and SYSTEM_ALERT_WINDOW — the last is the Expo development
overlay and should not ship in a release. The JavaScript bundle contains no
API keys, tokens or internal service URLs (only framework documentation
links and `http://localhost`).

Emulator run (API 36, both apps, light and dark): install, launch,
onboarding-free home, every tab, WalkScan / CrowdSense / Zone guides with the
engine ready, stored results with Pro insights locked, RehabTrack
comparison, Profile privacy toggles — all rendered and navigated without a
crash. No physical device was connected for this pass.

## Why there is no download button

- The only installable APKs are **debug-signed** development builds with the
  development overlay permission. They must not be distributed publicly.
- The **App Bundles** are signed with the Play upload key and exist for
  Google Play **internal testing**; an AAB is not an installable file for a
  phone and is never offered as a direct download.
- **Google Play**: nothing is published, so the site must not say the apps are
  on Google Play. Internal-testing steps are in
  `mobile/docs/play-internal-testing.md` on the apps' branch.
- **Subscriptions**: Play Billing products are not configured; the paywall
  says so.
- **No physical-device test** has been recorded for build 2.

Until these change, both showcases offer "Request a demo" and "Request
Android access" (a pre-filled mail to `demo@gaitai.in`). The data file's
`release.publicApk` is `null`; setting it is the single switch that would
make a download appear, and it must only be set for a release-signed APK
whose checksum has been verified against an approved release report, with a
`/mobilitycare/download/` page built like `/gaitai-care/download/`.

## What a public release needs

1. A release signing decision by the founder: either Play App Signing (upload
   the AABs to internal testing, then production) or a dedicated
   release-signing key for a sideload APK. Do not reuse the debug key; do not
   regenerate the existing upload key.
2. `assembleRelease` configured to sign with that key (today it produces
   debug-signed APKs by design), `SYSTEM_ALERT_WINDOW` gone from the release
   manifest, `versionCode` bumped.
3. Play Billing products created in Play Console and verified in internal
   testing, or the paywall hidden for the release.
4. A product privacy notice for the apps (the website notice does not cover
   on-device analysis and local storage).
5. A physical-device pass on at least one Android 7–9 device and one current
   device, recorded in a release report with the APK's SHA-256.
6. Then: download pages at `/mobilitycare/download/` and
   `/securevision/download/`, `release.publicApk` set, and the download
   tested end to end from the live site.
