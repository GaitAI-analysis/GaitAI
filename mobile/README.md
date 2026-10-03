# GaitAI mobile

Two native Android apps, one React Native monorepo.

| | GaitAI MobilityCare | GaitAI SecureVision |
|---|---|---|
| Package | `in.gaitai.mobilitycare` | `in.gaitai.securevision` |
| Tabs | Home · Analyze · Progress · Reports · Profile | Home · Analyze · Activity · Reports · Profile |
| Real analyses in this build | WalkScan, RehabTrack | CrowdSense, Zone & occupancy |
| Coming soon (visible, not startable) | Balance, SportsMotion | Motion analysis |

Neither app is a website wrapper. Every screen is native (Expo Router, React
Native), and every analysis runs **on the phone**: an invisible WebView hosts
the MediaPipe WebAssembly runtime and model files from the app bundle, the
app computes metrics from the landmarks or boxes it returns, and nothing is
uploaded. See `../docs/mobile-product-capability-matrix.md` for what is and
is not real.

```
mobile/
├── apps/
│   ├── mobilitycare/      Expo app: app.json, app/ (thin routes), assets/
│   └── securevision/
├── packages/
│   ├── design-system/     tokens: palette, per-product themes, type scale, spacing
│   ├── core/              schema (AnalysisSession, Metric…), local store, entitlement gate, catalogue
│   ├── analysis/          gait + crowd metric code, engine bridge, session builders, engine build script
│   ├── billing/           Play Billing interface + state machine, DEV entitlement provider
│   └── ui/                theme provider, primitives, charts, metric cards, every screen
├── scripts/gen-routes.mjs regenerates apps/*/app/ from the screen list
└── README.md
```

## Free vs Pro, enforced in data

`AnalysisSession` stores `freeMetrics` and `premiumMetrics` separately. Screens
never read a session directly; they call `gate(session, entitlement)` and get a
`ResultView` in which `premium` is `null` for free users and `locked` holds
names and descriptions only. There are no premium values to blur or hide.
Safety-related notes are moved to the free set by the gate whatever their flag.

| Analysis | Free | Pro |
|---|---|---|
| WalkScan | Cadence (steps/min), Step-time balance (%) | Step-time variability (% CV), Stride regularity (0–1), Trunk sway (% hip width), Left / right step time (ms), Contact timeline, quality report, trend vs previous |
| RehabTrack | Cadence change, Balance change | Variability / regularity / sway / left / right change, trend graph, report |
| CrowdSense | Current, average, peak people-in-frame | Density timeline, detection confidence, export |
| Zone & occupancy | Total entries, current occupancy | Event list with timestamps, occupancy timeline, mean dwell, total exits, export |

## Billing

`@gaitai/billing` defines `BillingProvider` with `init / purchase / restore /
refresh / manageUrl` and a `BillingState` covering unavailable, loading, ready,
purchasing, pending, purchased, cancelled, failed, restored, expired and grace.
Subscription ids: `mobilitycare_pro_monthly`, `mobilitycare_pro_yearly`,
`securevision_pro_monthly`, `securevision_pro_yearly`. Prices are never
hardcoded; they come from store product metadata.

- Development builds use `DevEntitlementProvider`: a Profile → Developer
  toggle grants Pro locally, labelled "DEV ENTITLEMENT · not a purchase".
- Release builds use `PlayBillingProvider`, which currently reports
  `unavailable` with an explanation. The Play Billing client is linked when the
  apps enter Internal Testing and the products exist in Play Console.

## Demo Data Mode (development only)

Profile → Developer → Demo Data Mode writes synthetic sessions (`demo: true`)
to a separate store, shows a yellow watermark on every screen and a
"Run with demo data (DEV)" button on each flow. Release builds compile it out
(`__DEV__`).

## Develop

```powershell
cd mobile
npm install
npm run engine:build            # builds packages/analysis/engine/engine.html (~29 MB, gitignored)
cd apps\mobilitycare
npx expo start                  # Metro; open in a development build, not Expo Go (native modules)
```

## Build an installable APK

Prerequisites on this machine: JDK 17 at `C:\Users\Anubha\.bubblewrap\jdk17`,
Android SDK at `%LOCALAPPDATA%\Android\Sdk`. First build downloads Gradle 9.3.1
(pre-seed it in `%USERPROFILE%\.gradle\wrapper\dists` if the wrapper's download
times out; see `../docs/android-apps.md` for the trick).

On Windows use the wrapper script; it works around the 260-character path
limit that breaks React Native's C++ build under a deep repository path and
keeps Gradle inside this machine's memory (2 workers, no daemon, 1.5 GB heap):

```powershell
powershell -File mobile\scripts\win-build.ps1 mobilitycare    # or securevision
# → android-builds\GaitAI-MobilityCare-native-debug.apk
```

It skips `lintVitalAnalyzeRelease` for these local test APKs only; Play builds
keep the full release lint. The manual equivalent:

```powershell
$env:JAVA_HOME = "C:\Users\Anubha\.bubblewrap\jdk17"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd mobile\apps\mobilitycare
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleRelease
# → app\build\outputs\apk\release\app-release.apk (JS bundled, signed with the debug key)
```

Same for `securevision`. Copies live in `../android-builds/` as
`GaitAI-MobilityCare-native-debug.apk` and `GaitAI-SecureVision-native-debug.apk`.

## Privacy

Videos are analysed on device and deleted afterwards unless "Keep analysed
videos" is on. Sessions, profile and settings are in the app's private storage.
"Delete account data" removes everything. Analytics events are names plus
coarse context, stored locally in this build; the tracker refuses keys that
look like values, media or landmarks.
