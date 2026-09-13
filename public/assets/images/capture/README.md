# Capture plates

Photographic frames that stand in for real capture wherever the site says
"camera", "CCTV", "walking video" or "raw feed". A drawn figure cannot do that
job — however it is graded, a rendered person reads as a render — so these
slots take photographs, and the overlay treatment (vignette, grain, REC /
camera-id / timestamp furniture, keypoints, blur) is drawn over them in code.

Everything here is built by `scripts/build-capture-plate.py` from an asset the
repository already owned. Nothing is fetched from the web. Re-run the script
after replacing a source.

## What exists

| File | Used by | Source |
|---|---|---|
| `cctv-walk-frame.jpg` / `.webp` | Home · privacy pipeline · Camera Video card; `/securevision/` · Privacy Lens steps 1–2 and Movement X-Ray human view; `/insights/from-walking-video-…` · Raw video stage | Phone inset of `insights/01-walking-video-to-movement-intelligence.jpg`, portrait cut, camera grade |
| `capture-walk-wide.jpg` / `.webp` | Home · workflow · Stage 01; `/mobilitycare/` + `/movement-lab/` · Movement X-Ray human view and Raw-video step | Same inset, full width, warmer/higher-contrast grade |

## What is still needed — the asset family

The repository has **one** photoreal walking frame. The two files above are
two cuts of it, and they are the only places it should appear: both are the
generic "raw capture" context. Rule for everything else — *do not reuse the
same person or scene across hospital, sports, CCTV, public-space and rehab
contexts*. Each row below is a slot that is wired or ready to wire; supply
the asset, drop it at the path, and the treatment already applies.

| Slot | Path | Scene | Framing | Ratio | Notes |
|---|---|---|---|---|---|
| **Movement X-Ray · MobilityCare human view** | `xray-clinic-01.jpg` … `xray-clinic-05.jpg` | Clinic corridor or gait lab, one person, side view | Five consecutive frames of ONE stride from ONE fixed camera: heel strike, loading, mid-stance, toe-off, swing; same clothes, scale and perspective | 116:175 each (portrait) | Wire via `XRAY_STRIP.mobilitycare` in `components/visuals/MovementXRay.tsx`; the AI view's five keypoint figures then sit over five real frames |
| **Movement X-Ray · SecureVision human view** | `xray-concourse-01.jpg` … `-05.jpg` | Station, concourse or public corridor, CCTV viewpoint | Same five-instant rule; a different person and place from the clinic strip | 116:175 each | `XRAY_STRIP.securevision` |
| Workflow Stage 01 (replace interim wide cut) | `capture-walk-wide.jpg` | Any everyday indoor space, one person walking | Fixed camera, chest height, side-on, full body, room for the stride | 4:3 → shown `cover` | Replaces the shared source; the pipeline card keeps `cctv-walk-frame` |
| Movement X-Ray / Movement Analyzer sample clip | `/assets/videos/samples/mobility-walk-demo.mp4` + `-poster.jpg` | Clinic corridor or gait lab, one person, side view | 6–8 s, 720p, steady camera, the whole body in frame throughout | 16:9 | **Must be video**: the analyzer runs a pose model on it in the browser, so the person has to be detectable. The current clip is a rendered figure and is labelled as such. |
| MobilityCare · clinic capture | `clinic-corridor-walk.jpg` | Hospital or physio corridor | Side-on, full body | 4:3 | For WalkScan / FallRisk / SeniorCare contexts if a capture frame is ever shown there (today these cards are text-only — do not add one just to have one) |
| MobilityCare · treadmill / gait lab | `gait-lab-treadmill.jpg` | Instrumented treadmill or marked walkway | Side-on | 4:3 | RehabTrack / NeuroMotion / OrthoMotion / ProstheticFit |
| MobilityCare · sport | `sports-run-capture.jpg` | Track, pitch or court | Side-on running stride | 4:3 | SportsMotion |
| MobilityCare · home | `home-walk-capture.jpg` | Domestic hallway, phone-held framing | Handheld feel, full body | 9:16 or 4:3 | Home-care walking check |
| SecureVision · concourse | `concourse-crowd.jpg` | Station, airport or mall concourse | Elevated fixed camera, several people | 16:9 | CrowdSense / EventShield / RetailGuard; the `/securevision/` hero film already covers this scene |
| SecureVision · campus / site | `campus-exterior.jpg` | Campus path or industrial yard | Elevated fixed camera | 16:9 | CampusShield / IndustrialSafety / AccessMotion |

All stills: JPEG at quality 84 plus a WebP sibling, longest edge ≤ 1200 px,
progressive, no EXIF. The build script does this for anything it emits.

## Homepage hero — art-directed, not capture (separate rule)

The hero is a cinematic background, not a Human View: it may stay processed
and it must NOT gain boxes or skeletons. What it should gain is a real
photographic base. The three frames in `public/images/hero/` are AI-generated
composites — 2172 × 193 px strips, `object-fit: cover` into a viewport-height
section, which is why the foreground man, reflections and background people
read soft and synthetic when stretched to ~700 px tall.

Drop-in spec (no code change; the navy scrim, crossfade and label overlay are
all CSS in `heroSlider.module.css`):

| Stem | Scene | Framing | Deliver as |
|---|---|---|---|
| `gaitai-hero-01` | Everyday public space, several people walking, one nearer the camera | Wide, eye height, subject standing right-of-centre (`pos: 42% 50%` keeps them clear of the copy) | 2400 × 1350 min, WebP q80 (+ AVIF for 02/03) |
| `gaitai-hero-02-mobilitycare` | Clinic corridor / rehab space, one person walking | Same | same |
| `gaitai-hero-03-securevision` | Station or concourse, natural crowd | Same; the SVG label overlay draws over it unchanged | same |

Licensed stock with model releases, or a commissioned shoot. Keep people
un-annotated: the treatment is atmosphere, not analytics.

## Licensing and likeness

A photograph of an identifiable person presented as surveillance or clinical
footage needs a model release, whoever supplies it — a stock licence, a
commissioned shoot, or an image generated for GaitAI. That decision belongs to
the site owner and is why none of the slots above have been filled with a
placeholder.

## Recorded walking sequence

| File | Used by | Source |
|---|---|---|
| `sequence/frame-1..5.webp`, `sequence/mask-1..5.png`, `sequence/poster.webp`, `sequence/contact-sheet.webp` | `visuals/SequenceFrame` — Movement X-Ray human / AI / explain views on `/mobilitycare/`, `/securevision/`, `/movement-lab/`; home privacy pipeline; research capture transform; Insights *From Walking Video to Movement Intelligence* | Five fixed-size tracked crops from one continuous take of Pexels video 9731860, *A man walking inside the studio* by SHVETS production, used under the Pexels licence (https://www.pexels.com/license/). Landmarks and segmentation are extracted from these exact frames by `scripts/derive-walking-sequence.mjs` with the repository pose model and written to `src/data/generated/walking-sequence.json`, which also records this provenance. |
| `/assets/videos/samples/recorded-walk.mp4` | Movement Analyzer sample clip (`/movement-lab/`) — the browser pose model runs on it | A 1.28 s, 960x540 excerpt of the same Pexels take, re-encoded with ffmpeg. Illustrative demonstration footage only: no product endorsement, validation result or clinical/safety conclusion. |

The excerpt is short by design: it is a demonstration of the pipeline, not a dataset. Phase labels drawn over it are illustrative annotations, not validated gait-event detection.
