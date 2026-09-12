# Visual-authenticity audit — capture, pose, silhouette, trajectory, sensor

**Scope.** Every surface on gaitai.in where the UI claims or implies camera
video, a CCTV feed, walking video, a raw frame, a live camera, a silhouette, a
pose skeleton, a trajectory or a wearable/sensor signal. Layouts, typography,
copy, spacing and interaction were not touched; this pass swaps source
imagery and corrects representation visuals only.

**Standard applied.** Camera/RGB → a photograph or convincingly real capture.
Silhouette → a foreground segmentation mask. Pose → a keypoint skeleton with
shoulders, elbows, wrists, hips, knees, ankles connected. Trajectory → a
spatial/temporal path. Sensor → an IMU/accelerometer waveform. Research and
editorial diagrams stay diagrammatic unless they explicitly claim to be a raw
frame.

**Method.** Every `/assets/images|videos/**` reference in `src/` was
enumerated; a frame was extracted from each of the nine films with ffmpeg and
inspected; every component drawing a human figure was traced to the pages that
render it. Findings below are per surface.

## Findings

| Page | Section | Old visual | Problem | Replacement | Status |
|---|---|---|---|---|---|
| `/` | Privacy pipeline · Stage 1 Capture / "Camera Video" | Vector mannequin in a drawn room with REC furniture | Read as an illustration inside a CCTV border | Photographic plate `capture/cctv-walk-frame.jpg` (project's own asset, reframed and graded); vignette, grain, scanlines, REC/CAM/timestamp drawn over it | **Done** (prior pass) |
| `/` | Privacy pipeline · Stage 2 / Silhouette | Union of perfect capsules | Geometrically perfect — no segmenter draws that boundary | Seeded `feDisplacementMap` boundary + one stray fragment | **Done** (prior pass) |
| `/` | Privacy pipeline · Pose Skeleton | Keypoints, bounding box, `PERSON 0.97`, `19 LANDMARKS` | Correct | — | Verified |
| `/` | Privacy pipeline · Trajectory | Three body silhouettes with a short squiggle | Read as another body variant, not a path | Full-width path, time ticks, fading history, current-position marker, no body | **Done** (prior pass) |
| `/` | Privacy pipeline · Sensor Signal | 3-channel accel, near-sinusoidal | Waveform already primary; heel strike too soft | Sharpened strike + loading-response dip | **Done** (prior pass) |
| `/` | Workflow · Stage 01 Capture Movement | `workflow/stage-01-capture.mp4` — blue wireframe walker between input icons | Infographic render in the card whose copy says "walking video, CCTV feed or smartwatch signal" | Photographic still `capture/capture-walk-wide.jpg` (`object-fit: cover`, lazy, alt text). Stages 02–04 keep their films: they depict outputs | **Done — interim source** (see note 1) |
| `/` | MobilityCare console "WalkScan · Demo" | `platform/mobilitycare-intelligence.mp4` — photoreal man in a clinic corridor, tracking overlays | None. Base is real capture; overlays are the allowed stylised layer. Tag already reads *Demo*, not *Live*; sr-only disclosure present | — | Verified, no change |
| `/` | SecureVision console "SecureVision · Demo" | `platform/securevision-intelligence.mp4` — photoreal man in a dark public space, fusion overlays | None, as above | — | Verified, no change |
| `/securevision/` | Hero | `securevision/securevision-hero.mp4` — photoreal crowd in a concourse, tracking overlays | None. Already a believable public-space scene | — | Verified, no change |
| `/securevision/` | Privacy Lens · 01 Sensing ("What a camera holds") | `PoseSilhouette` — drawn solid figure | A mannequin standing in for footage on the page whose argument is what footage contains | `cctv-walk-frame.jpg` in a frame matching the plate's aspect (no stretch), vignette, REC/CAM/timestamp; `<title>` updated | **Done** |
| `/securevision/` | Privacy Lens · 02 Privacy transformed | `PoseFrame` alone | Skeleton with no source to have come from; "face blur" had no face | Same photograph at 55 %, head region genuinely Gaussian-blurred (clipped blur of the real pixels, dashed ring), `PoseFrame` keypoints laid over the walker. Placement is by eye and the `<title>` says so | **Done** |
| `/securevision/` | Privacy Lens · 03 Movement intelligence | Faint keypoints + ankle path | Correct: trajectory as a path, photograph gone | — | Verified |
| `/securevision/` | Movement X-Ray · "Raw video" step | `samples/mobility-walk-demo.mp4` — flat cartoon walker on a grid | Synthetic clip where "raw video" is claimed | **Needs a real clip** (see note 2). Already labelled *"a rendered walking figure, not a patient recording"* in copy and `aria-label` | Open — asset required |
| `/securevision/` | 11 product entries (SuspiciousMotion … Watchlist) | Text + capability icons (`SecureCapabilityGroups`) | None — no imagery implies capture | Nothing added (rule: don't add photography to text cards) | Verified, no change |
| `/mobilitycare/` | Hero | `mobilitycare/mobilitycare-hero-v2.mp4` — glowing skeleton figures + clinical report panel | Stylised analytics art; does not claim raw footage | Acceptable under "analytics overlays may remain stylised". Upgrade optional | Verified, no change |
| `/mobilitycare/` | Movement X-Ray · "Raw video" | Same `mobility-walk-demo.mp4` | As above | As above | Open — asset required |
| `/mobilitycare/` | 9 product entries (WalkScan … ProstheticFit) | Text + report/smartwatch visuals (`ClinicalReportVisual`, `SmartwatchVisual`) | None — outputs, not capture | — | Verified, no change |
| `/movement-lab/` | Movement Analyzer sample clip | `mobility-walk-demo.mp4` | Synthetic; **the browser pose model runs on it**, so a still cannot replace it | Needs a real side-view clip the detector can track (note 2) | Open — asset required |
| `/products/` | Product grid, ecosystem, coverage matrix | Text, icons, data visuals | None — no capture claim | — | Verified, no change |
| `/use-cases/` | Environment cards (`EnvironmentGlyph`) | Drawn glyphs — walker, path, signal | Deliberately a glyph system; does not pretend to be footage | — | Verified, no change |
| `/use-cases/[slug]` | Detail views | Data-driven text | None | — | Verified, no change |
| `/research/`, `/publications/` | Diagrams, `ResearchSignal`, publication covers | Diagrammatic / commissioned artwork | Out of scope by rule 6 | — | Preserved |
| `/insights/…` | Article figures (`BaselineExplorer`, `CameraAngleExplorer`, `OneFrameHold`, …) | Interactive editorial diagrams using shared gait keyframes | None claim a raw frame (grep for "camera frame / CCTV / footage / as recorded": no hits) | — | Preserved |

### Note 1 — one source, two cuts
The repository contains exactly one photoreal walking frame (the phone inset
inside `insights/01-walking-video-to-movement-intelligence.jpg`). Both
photographic slots that exist today are cuts of it: portrait/neutral for the
pipeline card and the Privacy Lens, wide/warmer for workflow Stage 01. They are
the same "raw capture" context, so the reuse is defensible — but Stage 01 is
the first slot to replace when a dedicated frame exists. The full asset family
(clinic corridor, gait lab, sport, home, concourse, campus) is specified in
`public/assets/images/capture/README.md` and cannot be produced from anything
in the repository.

### Note 2 — the sample clip must be video
`mobility-walk-demo.mp4` is analysed live by MediaPipe in the Movement
Analyzer. Replacing it means a licensed or GaitAI-generated 6–8 s side-view
clip, 720p, one person fully in frame, steady camera — something a pose
detector can actually track. Until then it stays, and the site already says in
copy and in the `aria-label` that it is a rendered figure.

## Checks

- Every `/assets/images|videos/**` path referenced in `src/` returns 200 on
  the dev server (script in the session log).
- New plates: `cctv-walk-frame` 496×516 · 21 KB JPEG / 8 KB WebP;
  `capture-walk-wide` 688×516 · 29 KB / 11 KB. Progressive JPEG, no EXIF.
- No stretching: the Stage 01 still uses `object-fit: cover`; the Lens frame is
  180×188 stage units against a 496×516 plate (0.957 vs 0.961) with `slice`.
- Alt text: Stage 01 `<img alt>` describes the frame; the Lens `<svg>` carries
  a per-step `<title>`; the pipeline card sits in `role="img" aria-label`.
- Below the fold: Stage 01 `loading="lazy"`; the pipeline plate is an SVG
  `<image>` inside a card that only mounts its figures once rendered.
- Light mode: photographs are not recoloured — only `contrast`/`saturate`
  trims (≤ 6 %) so they sit in either theme.
- `tsc --noEmit` and `next lint` clean.
