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
| `cctv-walk-frame.jpg` / `.webp` | Home · privacy pipeline · Camera Video card; `/securevision/` · Privacy Lens steps 1–2 | Phone inset of `insights/01-walking-video-to-movement-intelligence.jpg`, portrait cut, camera grade |
| `capture-walk-wide.jpg` / `.webp` | Home · workflow · Stage 01 Capture Movement | Same inset, full width, warmer/higher-contrast grade |

## What is still needed — the asset family

The repository has **one** photoreal walking frame. The two files above are
two cuts of it, and they are the only places it should appear: both are the
generic "raw capture" context. Rule for everything else — *do not reuse the
same person or scene across hospital, sports, CCTV, public-space and rehab
contexts*. Each row below is a slot that is wired or ready to wire; supply
the asset, drop it at the path, and the treatment already applies.

| Slot | Path | Scene | Framing | Ratio | Notes |
|---|---|---|---|---|---|
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

## Licensing and likeness

A photograph of an identifiable person presented as surveillance or clinical
footage needs a model release, whoever supplies it — a stock licence, a
commissioned shoot, or an image generated for GaitAI. That decision belongs to
the site owner and is why none of the slots above have been filled with a
placeholder.
