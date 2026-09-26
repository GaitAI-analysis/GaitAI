# GaitAI Android apps: MobilityCare and SecureVision

Two Android apps, one website. Each app is a thin Android shell (a *Trusted
Web Activity*, TWA) that opens one product area of https://gaitai.in in
full-screen Chrome with no browser bar, under its own name, icon and package
ID. There is no second copy of the site: the apps show the pages the site
already serves, so a website deploy updates both apps at once.

```
                         GaitAI Core
                             │
                          gaitai.in
                       ┌─────┴─────┐
                       │           │
               /mobilitycare/  /securevision/
                       │           │
                MobilityCare   SecureVision
                  Android        Android
                    App            App
```

| | GaitAI MobilityCare | GaitAI SecureVision |
|---|---|---|
| Package ID | `in.gaitai.mobilitycare` | `in.gaitai.securevision` |
| Opens | `https://gaitai.in/mobilitycare/` | `https://gaitai.in/securevision/` |
| Owns links under | `/mobilitycare/…` | `/securevision/…` |
| Web manifest | `/manifests/mobilitycare.webmanifest` | `/manifests/securevision.webmanifest` |
| Icons | `/app-icons/mobilitycare/` | `/app-icons/securevision/` |
| Android project | `android-apps/mobilitycare/` | `android-apps/securevision/` |
| Test package | `android-builds/GaitAI-MobilityCare-debug.apk` | `android-builds/GaitAI-SecureVision-debug.apk` |
| Splash / bar colour | `#020E22` | `#000D21` |

Different package IDs are what make Android treat them as two apps: installing
one never replaces the other, and both can sit on the same home screen.

## Folder structure

```
public/manifests/            the two product web manifests (served by the site)
public/app-icons/<app>/      icon-192/512/1024, maskable-192/512, monochrome-512,
                             splash-1080x1920, source.json (where the mark came from)
public/.well-known/assetlinks.json   Digital Asset Links (see below)
android-apps/<app>/          Bubblewrap TWA project: twa-manifest.json + generated
                             Gradle project (app/, build.gradle, gradlew…)
android-apps/<app>/keys/     signing keystores — gitignored, never committed
android-builds/              built packages — gitignored except .gitkeep
play-store/<app>/            listing-copy.md, icon/, screenshots/, feature-graphic/
docs/android-apps.md         this file
```

## How the website side works

- `src/app/mobilitycare/page.tsx` and `src/app/securevision/page.tsx` each
  declare their own `manifest`, `icons` and `appleWebApp` metadata, so those
  two routes advertise the product identity. Every other route keeps the
  GaitAI manifest from the root layout. Nothing else on the site changed.
- Each manifest has `id`, `start_url` and `scope` set to the product path,
  `display: standalone`, the product's navy as `theme_color` and
  `background_color`, and `any`, `maskable` and `monochrome` icons.
- The icons are the real product marks, isolated from the transparent
  wordmarks in `public/assets/brand/<app>/`, set on the brand navy. The
  source is a 290px raster, upscaled about 1.5× for the 512px files; if a
  vector or larger master appears, regenerate from it (the generation
  script is recorded in `source.json`).

## The Android side (Bubblewrap)

[Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) turns
`twa-manifest.json` into an Android project and builds it. It is not
installed globally; it runs from a throwaway npm folder. Tooling it needs on
this machine:

- JDK 17 at `C:\Users\Anubha\.bubblewrap\jdk17` (Temurin, downloaded by hand
  because the machine's `JAVA_HOME` pointed at a JDK that no longer exists).
- Android SDK at `C:\Users\Anubha\AppData\Local\Android\Sdk` (already present:
  build-tools 36.1.0, platform-tools, an Android 36 x86_64 system image).
- `~/.bubblewrap/config.json`:

```json
{"jdkPath":"C:/Users/Anubha/.bubblewrap/jdk17","androidSdkPath":"C:/Users/Anubha/AppData/Local/Android/Sdk/cmdline-tools/latest"}
```

Set up Bubblewrap once (any folder outside the repo):

```powershell
mkdir $env:TEMP\bubblewrap; cd $env:TEMP\bubblewrap
npm init -y | Out-Null
npm i @bubblewrap/cli
$env:BW = "$env:TEMP\bubblewrap\node_modules\.bin\bubblewrap.cmd"
& $env:BW doctor
```

### What `twa-manifest.json` says

Per app: `packageId`, `name`/`launcherName`, `host: gaitai.in`,
`startUrl: /<app>/`, `fullScopeUrl`, colours, `display: standalone`,
`orientation: portrait`, `fallbackType: customtabs` (if Chrome cannot verify
the site the app still opens it, in a Custom Tab with a browser bar),
`minSdkVersion: 21`, and `signingKey` → `./keys/<app>-test.keystore`.

Bubblewrap fetches the three icon URLs and the web manifest when it
generates the project. Until the branch is deployed those URLs point at a
local static server (`http://localhost:3011` → the repo's `public/`).
After the branch is live, change them to `https://gaitai.in/...` in both
`twa-manifest.json` files and re-run `bubblewrap update`.

Generated behaviour worth knowing:

- Deep links: the manifest's intent filter is `https://gaitai.in` with
  `pathPrefix="/mobilitycare/"` (or `/securevision/`), so each app only
  claims its own product URLs.
- Back button: Chrome's normal history inside the app; from the first page
  it closes the app.
- Splash: solid product navy with the launcher icon, then a 300 ms fade, so
  there is no white flash while the page loads.
- Status and navigation bars take the product navy in both themes.
- Offline: Chrome's own offline page appears inside the app (the site has no
  service worker by design); the app recovers when the network returns.

## Signing: test keys now, Play App Signing later

Two keystores exist locally, **for test builds only**:

```
android-apps/mobilitycare/keys/mobilitycare-test.keystore   alias mobilitycare-test
android-apps/securevision/keys/securevision-test.keystore   alias securevision-test
```

Store and key password for both: `android` (the conventional Android debug
password; it is deliberately not a secret because these keys sign nothing
that ships). They are gitignored. If a keystore is missing, Bubblewrap
offers to create one on `build`; use the same alias so the paths above stay
true, then re-read the fingerprint as shown below.

Their real SHA-256 fingerprints, read with `keytool` on 2026-09-27:

| App | TEST fingerprint |
|---|---|
| MobilityCare | `4E:1C:8F:81:C9:29:21:F9:81:68:FF:42:1B:80:EE:1B:4C:85:17:73:1D:BD:49:87:6A:45:8F:FE:BB:8F:5A:9B` |
| SecureVision | `E1:59:B2:02:35:7F:8C:23:92:BF:6D:BD:A0:59:83:5D:0F:6F:BD:FD:E4:BC:91:A3:AD:40:48:7B:4A:14:40:5B` |

To read a fingerprint yourself:

```powershell
& "C:\Users\Anubha\.bubblewrap\jdk17\bin\keytool.exe" -list -v -keystore android-apps\mobilitycare\keys\mobilitycare-test.keystore -alias mobilitycare-test -storepass android | Select-String SHA256
```

**Production is different.** When the apps go to Google Play, Play App
Signing signs what users download with a key Google holds. Its SHA-256
appears in Play Console → the app → Test and release → Setup → App
signing. That fingerprint must be **added** to `assetlinks.json` (keep the
test one too if test builds are still used). It is not known yet and must
not be guessed.

## Digital Asset Links

`public/.well-known/assetlinks.json` is what lets Chrome verify that the
site trusts the apps; without it the TWA falls back to a browser bar. The
file currently lists **the TEST fingerprints above** for both package IDs.
It is served at `https://gaitai.in/.well-known/assetlinks.json` once this
branch is deployed (the export copies `public/` verbatim and `.nojekyll` is
already in place, so the dotfolder is published).

Before publication: add the Play App Signing fingerprint for each app to its
`sha256_cert_fingerprints` array. Verify with

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://gaitai.in&relation=delegate_permission/common.handle_all_urls
```

## Build a test package

The projects are plain Gradle projects, so they build with the Gradle wrapper
Bubblewrap generated; signing is a separate step with the SDK's `apksigner`
(`bubblewrap build` is not used: on this machine it insists on re-installing
build-tools into the wrong folder and cannot launch `gradlew.bat`).

```powershell
$env:JAVA_HOME = "C:\Users\Anubha\.bubblewrap\jdk17"
$env:ANDROID_HOME = "C:\Users\Anubha\AppData\Local\Android\Sdk"

cd android-apps\mobilitycare
.\gradlew.bat assembleRelease bundleRelease
cd ..\..
powershell -File android-apps\sign-test-build.ps1 mobilitycare

cd android-apps\securevision
.\gradlew.bat assembleRelease bundleRelease
cd ..\..
powershell -File android-apps\sign-test-build.ps1 securevision
```

`gradlew.bat` needs a `local.properties` next to it containing
`sdk.dir=C:\Users\Anubha\AppData\Local\Android\Sdk` (gitignored; write it
once). Gradle output lands in `app\build\outputs\` (gitignored).
`sign-test-build.ps1` zipaligns, signs with the app's test keystore, prints
the signer's SHA-256 so you can compare it with the table above, and copies
the results to:

```
android-builds\GaitAI-MobilityCare-debug.apk    android-builds\GaitAI-MobilityCare-test.aab
android-builds\GaitAI-SecureVision-debug.apk    android-builds\GaitAI-SecureVision-test.aab
```

The first build downloads Gradle 8.11.1 (about 130 MB) and the Android
Gradle plugin. If the wrapper's download times out (the distribution is
served from GitHub, which this machine's JVM could not reach on 2026-09-27),
download `gradle-8.11.1-bin.zip` with a browser or curl, check it against
`gradle-8.11.1-bin.zip.sha256` from services.gradle.org, and drop it into
`%USERPROFILE%\.gradle\wrapper\dists\gradle-8.11.1-bin\<hash>\` (the wrapper
creates that folder on its first attempt); it then unpacks it instead of
downloading.

## Install a test package

On a phone with USB debugging on, or on a running emulator:

```powershell
$adb = "C:\Users\Anubha\AppData\Local\Android\Sdk\platform-tools\adb.exe"
& $adb devices
& $adb install -r android-builds\GaitAI-MobilityCare-debug.apk
& $adb install -r android-builds\GaitAI-SecureVision-debug.apk
& $adb shell pm list packages | Select-String gaitai
```

To open one without touching the screen:

```powershell
& $adb shell monkey -p in.gaitai.mobilitycare -c android.intent.category.LAUNCHER 1
& $adb shell am start -a android.intent.action.VIEW -d "https://gaitai.in/securevision/"
```

A headless test emulator exists on this machine: `gaitai_test` (Pixel 7,
Android 36 x86_64). Start it with

```powershell
& "C:\Users\Anubha\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd gaitai_test -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect
```

## Coexistence

`in.gaitai.mobilitycare` and `in.gaitai.securevision` are distinct package
IDs with distinct signing keys, launcher names, icons, start URLs and
deep-link path prefixes. Android installs them side by side; `pm list
packages` shows both; neither install replaces the other. See the QA record
at the end of this document for the checked run.

## Updating the apps later

- **Website changes** need no app update: both apps show the live site.
- **Icon, colour, name or start URL changes**: edit `twa-manifest.json`,
  run `bubblewrap update` in that app folder, then `bubblewrap build`. Bump
  `appVersionCode` (integer, must increase) and `appVersionName` for any
  build that goes to Play; `bubblewrap update` does this for you unless you
  pass `--skipVersionUpgrade`.
- Never change a `packageId` after publication; Play treats it as a new app.

## Before Google Play publication (not done, by design)

1. Deploy this branch so `/manifests/*.webmanifest`, `/app-icons/*` and
   `/.well-known/assetlinks.json` are live; point the icon and manifest URLs
   in both `twa-manifest.json` files at `https://gaitai.in/…` and re-run
   `bubblewrap update`.
2. Create the two apps in Play Console (Google account, developer
   registration and fee, identity verification: founder actions).
3. Upload each `app-release-bundle.aab` to an internal testing track; Play
   App Signing is enabled at that point and shows the production SHA-256.
4. Add both production fingerprints to `assetlinks.json`, deploy, and confirm
   the verification URL above lists them.
5. Complete the listing from `play-store/<app>/listing-copy.md` with real
   screenshots from the installed app and a 1024×500 feature graphic made
   from approved brand artwork.
6. Fill in Data safety (the apps collect nothing themselves; the site's
   privacy policy applies) and content rating.
7. Roll out from internal testing once the TWA opens with no browser bar on
   a device that has the production build.

## QA record (2026-09-27, feature/android-apps)

Emulator `gaitai_test` (Pixel 7, Android 16 / API 36, Chrome 133), both test
APKs (`versionCode 1`, `versionName 1.0.0`, minSdk 21, targetSdk 36).

| Check | Result |
|---|---|
| `pm list packages` after installing both | `in.gaitai.mobilitycare` and `in.gaitai.securevision` both present; installing the second did not remove the first |
| Launcher labels / icons | "MobilityCare" with the teal figure-G mark, "SecureVision" with the blue eye-G mark, side by side in the app drawer |
| MobilityCare first and second launch | Opens `https://gaitai.in/mobilitycare/` (Chrome Custom Tab activity) |
| SecureVision first launch | Opens `https://gaitai.in/securevision/` |
| Back button from the start page | Returns to the launcher (app closes) |
| Deep link `https://gaitai.in/mobilitycare/walkscan/` | Resolver offers the app; without verified asset links Android opened Chrome, as expected before deployment |
| Link ownership | `/securevision/…` is claimed by SecureVision only; `/mobilitycare/…` by MobilityCare only |
| Offline relaunch (Wi-Fi and data off) | App opens and shows the cached start page; recovers when the network returns |
| Landscape | Page reflows; no clipping |
| Signer fingerprints on the installed apps | Match the TEST fingerprints in the table above (read back with `pm get-app-links`) |
| Browser bar | **Visible** (Custom Tab fallback). It disappears once `/.well-known/assetlinks.json` is live on gaitai.in and Chrome verifies the site; the file is in this branch, so the first deploy of the branch enables it for the test builds |

Web checks on the same branch: `npm run typecheck`, `npm run verify` and
`npm run build` pass; the export contains `.well-known/assetlinks.json`, both
manifests and both icon sets, and only `/mobilitycare/` and `/securevision/`
link a product manifest.

Product pages on a phone (production export, 360–430px and 768px, both
themes): no horizontal overflow, no broken media, hero and CTAs readable.
Not changed in this branch.
