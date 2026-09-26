# Visual-authenticity audit — repository-wide

**Rule.** Wherever the UI presents something as real-world source capture —
human view, camera view, camera/raw/walking video, a video frame, CCTV, RGB —
the visual must be a photograph or convincingly real capture. Silhouette →
foreground segmentation mask. Pose → keypoint skeleton. Trajectory →
temporal/spatial path. Sensor → IMU waveform. Crowd/CCTV → real environment
under the overlays. Architecture diagrams, research visuals, model layers,
Motion DNA and legitimate pose *output* are diagrams and stay diagrams.

**Method.** Not by visible text alone. Every consumer of the drawn-figure
primitives was traced — `PoseSilhouette`, `PoseFrame`, `GAIT_PHASES`, the
`Body()` mask helpers, `MotionSignature`, `RepresentationFigure`,
`MovementXRay`, `PrivacyLens` — across `src/app/**` and every shared and
insight-figure component; every `/assets/images|videos/**` reference was
enumerated and a frame pulled from all nine films with ffmpeg; every route
under `src/app` was listed. Then every claim-bearing label was grepped
(HUMAN VIEW, CAMERA VIEW, Camera Video, Raw video, video frame, CCTV, walking
video, as recorded, live feed, RGB).

## Inventory

| Route | Component | State | Current visual | Problem | Shared? |
|---|---|---|---|---|---|
| `/securevision/` `/mobilitycare/` `/movement-lab/` | `visuals/MovementXRay` | **Human view** | five grey `PoseSilhouette` mannequins | labelled HUMAN VIEW, drawn body | **shared — 3 routes** |
| same | `MovementXRay` | Raw video step | `mobility-walk-demo.mp4` cartoon walker | labelled Raw video | shared |
| same | `MovementXRay` | AI view / Explain view | `PoseFrame` keypoints, contacts, trails, two channels | legitimate pose output | shared |
| `/securevision/` | `visuals/PrivacyLens` | 01 Sensing | drawn solid figure (fixed in prior pass → photograph) | "what a camera holds" | page |
| `/securevision/` | `PrivacyLens` | 02 Transformed | skeleton alone (prior pass → blurred photo + keypoints) | face blur had no face | page |
| `/` | `home/RepresentationFigure` | Camera Video | vector mannequin (prior pass → photograph) | labelled Camera Video | page |
| `/` | `RepresentationFigure` | Silhouette / Pose / Trajectory / Sensor | mask · keypoints · path · IMU waveform | correct after prior passes | page |
| `/` | `sections/HowItWorks` Stage 01 | — | `stage-01-capture.mp4` wireframe infographic (prior pass → photograph) | copy says walking video / CCTV | page |
| `/` | `Verticals` consoles | — | `*-intelligence.mp4`: photoreal person under overlays, tagged *Demo* | none | page |
| `/securevision/` | hero film | — | photoreal concourse crowd under overlays | none | page |
| `/mobilitycare/` | hero film | — | glowing-skeleton analytics art, no capture claim | acceptable (stylised overlay) | page |
| `/movement-lab/` | `analytics/MovementAnalyzer` | Demo sample | `mobility-walk-demo` poster/clip, disclosed as rendered | needs a real **video** — MediaPipe runs on it | page |
| `/movement-lab/` | `MovementAnalyzer` | Upload | the reader's own frames | none | page |
| `/insights/from-walking-video-to-movement-intelligence/` (+6 stories) | `figures/VideoToIntelligence` | Raw video stage | pixel mosaic + drawn walker | labelled RAW VIDEO | shared figure |
| `/insights/…` | `PrivacyTransform`, `IdentityLayersExplorer`, `CameraAngleExplorer`, `PoseErrorExplorer`, `OneFrameHold`, `BaselineExplorer`, `SignalQualityLab`, `FusionExperiment`, `LongitudinalTrend`, `MotionDNABranches` | — | keyframe skeletons / masks as *model output* explainers | no raw-capture claim (grep: none) | preserve |
| `/` hero | `visuals/MotionSignature` | level 0 | five `PoseSilhouette` at 1.0 s | Motion DNA / signature graphic, no camera or human-view label | preserve (rule 9) |
| `/research/` | `PrivacyTransformationVisual`, `PoseBiomechanicsVisual`, `ResearchSignal`, pillar visuals | — | research diagrams | out of scope by rule | preserve |
| `/labs/*` | `LabPhotoStage`, `LabScene` | — | a real photograph; the 3-D reconstruction is labelled *digital twin, approximate* | none | preserve |
| `/products/` `/use-cases/*` `/gaitscape/` `/publications/*` `/securevision/[slug]` `/mobilitycare/[slug]` | text, icons, glyphs, data visuals, publication artwork | — | no capture claimed | nothing added | — |

## Fixes (this pass)

| Route | Component | Before problem | Fix | Verified |
|---|---|---|---|---|
| `/securevision/` `/mobilitycare/` `/movement-lab/` | `MovementXRay` · Human view | five grey mannequins as HUMAN VIEW | **Shared component fixed once.** Human layer is a camera frame at true aspect on the ground line, the five gait events (heel strike, loading, mid-stance, toe-off, swing) as ticks on the recording's timeline. Per family: MobilityCare the wide warm cut, SecureVision the neutral CCTV cut. AI and Explain layers unchanged over it — real frame → keypoints → interpretation. `XRAY_STRIP[family]` accepts five real consecutive frames when they exist and draws them at the five figure positions | DOM: `massVisible:false` in all three views on all three routes; `plateVisible:true` in human; `keypointsVisible:true` in AI/Explain. Screens `sv-xray-*`, `mc-xray-*`, `lab-xray` |
| same | `MovementXRay` · Raw video step | cartoon clip labelled Raw video | the same frame as an `<img>` with alt; captions and stage copy say the keyframes are not inferred from it | `plate` href asserted per family |
| `/insights/…` ×7 stories | `VideoToIntelligence` · Raw / Person stages | pixel mosaic + drawn walker as RAW VIDEO | photograph under the capture frame; drawn body only appears once the frame fades (Pose), the detection box sits on the photo at Person | `insight-v2i-raw` |
| `/securevision/` | `PrivacyLens` 01 / 02 | (prior pass) | photograph; genuine head blur + keypoints | `sv-lens-1..3` |
| `/` | privacy pipeline, workflow Stage 01 | (prior passes) | photograph in both | `home-pipeline-*`, `home-stage01` |

Zero `PoseSilhouette` renders remain under a Human-View / Camera / Raw / CCTV
label. Its two remaining consumers are the research pillar visual and the hero
Motion-DNA signature, both diagrams by the stated rule.

## What cannot be closed from the repository

- **Five consecutive real frames of one stride, per family.** The repository
  holds one photoreal walking frame. Five moments of one walk cannot be
  invented from it without faking a recording, so the X-Ray shows one frame
  with the five instants marked. The slot is wired (`XRAY_STRIP`) and specified
  in `public/assets/images/capture/README.md` — clinic strip and concourse
  strip, different people, different places.
- **The Movement Analyzer sample clip** must be real video: the browser pose
  model runs on it. Specified in the same manifest.
- **Same person, several slots.** Both current plates are cuts of the one
  frame. Every slot that shares it is listed in the manifest as the next thing
  to replace; the concern is acknowledged, not hidden.

## Checks

`tsc --noEmit` clean · `next lint` clean · `validate:gaitai` passed · every
`/assets/**` path referenced in `src/` returns 200 · no horizontal overflow at
390 px · plates: 21 KB / 29 KB JPEG with 8 KB / 11 KB WebP siblings, lazy,
alt text or `<title>` on each · light mode uses ≤ 6 % contrast/saturation
trims, no recolouring.
