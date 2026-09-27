# Mobile product capability matrix

What the GaitAI repository can actually analyse today, product by product,
so the native apps only offer analyses that run. Audited 2026-09-27 on
`feature/native-apps-v2`. Update this file before any product is promoted
in either app.

## What exists in the repository

| Asset | Where | What it does | Runs |
|---|---|---|---|
| MediaPipe Tasks Vision 1.0.1 (WebAssembly) | `node_modules/@mediapipe/tasks-vision` | BlazePose `PoseLandmarker`: 33 body landmarks per frame, single or multiple people, 2D image coordinates plus a coarse depth estimate and per-landmark visibility | On device, in a browser engine |
| `pose_landmarker_lite.task` (5.5 MB) | `public/assets/models/` | The pose model the web Movement Lab uses | On device |
| `usePoseAnalysis.ts` | `src/components/analytics/` | Samples a clip at fixed instants, stores landmarks per instant, classifies suitability (single person / no person / intermittent) | Web |
| Ask GaitAI Worker | `worker/` | Retrieval-grounded Q&A over the site's records | Cloudflare |
| EfficientDet-Lite0 (COCO, int8, 4.6 MB) | downloaded for the apps, Apache-2.0 | General object detector; the `person` class gives people-in-frame boxes | On device |

There is **no** GaitAI-trained model, no server-side analysis endpoint, no
3D or calibrated capture, no wearable ingestion, no face or identity model,
and no clinical validation data in the repository. The web Movement Lab
deliberately shows trajectories only and states that it does not compute
cadence or symmetry.

## How the apps run analysis

Both apps run models **on the device**, inside an embedded, invisible
browser engine (`react-native-webview`) that loads the MediaPipe WebAssembly
runtime and the model files from the app bundle. No video leaves the phone
for analysis. Metric computation happens in TypeScript in the app from the
landmarks or boxes the engine returns. This is a pragmatic bridge; a native
module (LiteRT / MediaPipe Android) would be faster and is the intended
next step, with the same metric code on top.

Every result carries `modelVersion`, the sampling rate, the frames analysed
and quality flags, and is labelled "2D estimate from a single camera".

## Metric honesty rules applied

- Cadence, step-time balance and step-time variability are **time-domain**
  measurements from detected foot-contact events; they need no spatial
  calibration and are reported with the frames-per-second they were derived
  from.
- Anything needing distance (stride length, walking speed) is **not**
  computed: a phone clip has no scale.
- Symmetry is reported as **step-time balance** (left vs right step
  duration), not a spatial symmetry score; viewing angle is recorded as a
  quality flag.
- No reference ranges, no scores, no risk ratings, no diagnoses.
- People counts are "people visible to the detector in the frame", stated as
  such; dense crowds and occlusion are flagged, not hidden.

## MobilityCare

| Product | Input | Analysis available | Output (free / premium) | Status |
|---|---|---|---|---|
| **WalkScan** | 10–20 s walking video (record or upload), side or front view | PoseLandmarker per frame → foot-contact events → time-domain gait metrics; trunk sway from hip/shoulder midpoints | Free: cadence, step-time balance. Premium: step-time variability, stride regularity, trunk sway, left/right step timing, contact timeline, quality report, comparison with previous scan | **IMPLEMENTED** (2D, on device) |
| **RehabTrack** | Two or more WalkScan sessions | Metric-by-metric comparison of stored sessions | Free: cadence change, balance change. Premium: full comparison, trend, side-by-side timelines, notes | **IMPLEMENTED** (built on WalkScan) |
| **Balance / stability** | Standing-still video, 10–20 s | Trunk and hip lateral/vertical displacement from pose landmarks | Free: sway summary. Premium: sway timeline, per-axis breakdown | **PARTIAL**: measurement exists (same sway code as WalkScan); the guided capture and result screen are not built yet → shown as COMING SOON |
| **SportsMotion** | Movement video | Joint-angle timelines from landmarks are computable; no sport-specific interpretation exists | — | **NO ANALYSIS BACKEND** for sport-specific outputs → COMING SOON |
| **Mobility trend** | Stored sessions | Longitudinal charts of the metrics above | Premium | **IMPLEMENTED** as the Progress tab (needs ≥2 sessions) |
| FallRisk, WatchCare, NeuroMotion, OrthoMotion, SeniorCare, PediatricMotion, ProstheticFit, RemoteCare, ClinicalTrials | — | No model, no data, no validation | — | **NO ANALYSIS BACKEND** → not shown in the app |

## SecureVision

| Product | Input | Analysis available | Output (free / premium) | Status |
|---|---|---|---|---|
| **CrowdSense** | Uploaded video of a space the user is authorised to analyse | EfficientDet-Lite0 `person` detections per sampled frame | Free: current, average and peak people-in-frame. Premium: density timeline, per-frame counts, box overlay review, export | **IMPLEMENTED** (people-in-frame counting; not a density model, degrades in dense crowds, stated) |
| **Zone / occupancy** | Same video + a polygon the user draws on a frame | Detections whose foot point falls inside the polygon; nearest-centroid tracking across frames for entries/exits and dwell | Free: total entries, current occupancy. Premium: event list with timestamps, occupancy timeline, dwell distribution, export | **IMPLEMENTED** (entries/exits are tracker estimates and labelled so) |
| **Motion analysis** | Video | Frame-difference motion energy over time is computable without a model | Free: motion timeline. Premium: per-zone motion | **PARTIAL** → COMING SOON (not in the first build) |
| **PrivacyGuard** | — | The apps do not store faces, identities or raw frames after analysis; boxes only | Shown as a principle and a settings surface, not an analysis | **PARTIAL** (policy, not a model) |
| IndustrialSafety | Video | Fall-like pose events would need a validated classifier; none exists | — | **NO ANALYSIS BACKEND** → COMING SOON |
| SuspiciousMotion, CampusShield, EventShield, RetailGuard, DefenceMotion | — | No models | — | **NO ANALYSIS BACKEND** → not shown |
| ForensicSearch, ReID, AccessMotion, Watchlist | — | Identity-related; excluded from any consumer build by policy | — | **EXCLUDED** |

## What the first native build ships

- MobilityCare: WalkScan (full flow), RehabTrack (comparison), Progress
  (trends). Balance and SportsMotion appear as COMING SOON, nothing else.
- SecureVision: CrowdSense (full flow), Zone / occupancy (full flow).
  Motion analysis and IndustrialSafety appear as COMING SOON.
- A **DEMO DATA MODE** exists only in development builds, is switched on
  from the Profile tab's Developer section, watermarks every screen, and
  writes sessions tagged `demo: true` that never mix with real history.
  Release builds compile it out.

## What would change a row

| To reach | Needed |
|---|---|
| Balance → IMPLEMENTED | Guided still-standing capture screen and a result screen over the existing sway code |
| SportsMotion → PARTIAL | Named joint-angle outputs agreed with the founder; still no sport interpretation |
| Motion analysis → IMPLEMENTED | Frame-difference engine step (no model) and a result screen |
| IndustrialSafety → PARTIAL | A validated fall/slip event classifier; none exists in the repo |
| Any clinical claim | Validation study and regulatory review; out of scope for the apps |
