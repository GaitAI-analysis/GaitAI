# Use-case environment imagery

The reviewed dark/light photograph pair behind each card on `/use-cases/`. The
record of truth is `use-case-image-manifest.json`; this page is a readable
view of it. Pixels are written only by `scripts/import-use-case-images.py`,
and `npm run check:use-case-images` (in `prebuild`) fails the build if
production drifts from the review in any way — a swapped file, a reused
source, a light frame that is really the dark one brightened.

## How the review was done

Every source opened and described individually. Nothing was assigned from filename, timestamp or folder order; the alternating dark/light ordering was treated as a hypothesis and confirmed scene by scene.

- Source files inspected: **38**
- Selected: **34** (17 environments × dark + light)
- Rejected: **4**
- Exact or pixel-identical duplicates among the selected: **0**
- Environments on the page: **18** · with imagery: **17** · documented gap: **1**

## Encoding

WEBP quality 94, method 6; rungs 480, 768, 1024px plus the native width. Native width is always emitted as the unsuffixed file; narrower rungs only when smaller than the source. No upscaling.

Band: **4:3**. 4:3, the product-card ratio. Thirteen sources are 16:9 and lose 25% of their width to the band, which is the safe axis for scenes of standing people; the five 4:3 sources are shown whole. The position is per theme because the two frames of a pair are separate photographs with their subjects in different places.

## Mapping

| Use case | Family | Dark (review id · source) | Light (review id · source) | Position dark / light |
|---|---|---|---|---|
| Physiotherapy clinics | MobilityCare | U001 · `ChatGPT Image Sep 20, 2026, 09_07_53 PM (1).png` | U002 · `ChatGPT Image Sep 20, 2026, 09_07_53 PM (2).png` | `50% 50%` / `50% 50%` |
| Hospitals | MobilityCare | U003 · `ChatGPT Image Sep 20, 2026, 09_07_54 PM (3).png` | U004 · `ChatGPT Image Sep 20, 2026, 09_07_55 PM (4).png` | `50% 50%` / `50% 50%` |
| Sports academies | MobilityCare | U005 · `ChatGPT Image Sep 20, 2026, 09_07_56 PM (5).png` | U006 · `ChatGPT Image Sep 20, 2026, 09_07_56 PM (6).png` | `45% 50%` / `50% 50%` |
| Elderly-care centers | MobilityCare | U007 · `ChatGPT Image Sep 20, 2026, 09_07_57 PM (7).png` | U008 · `ChatGPT Image Sep 20, 2026, 09_07_58 PM (8).png` | `50% 50%` / `50% 50%` |
| Neurology clinics | MobilityCare | U009 · `ChatGPT Image Sep 20, 2026, 09_07_58 PM (9).png` | U010 · `ChatGPT Image Sep 20, 2026, 09_07_59 PM (10).png` | `85% 50%` / `40% 50%` |
| Home care & telehealth | MobilityCare | U023 · `ChatGPT Image Sep 20, 2026, 09_43_39 PM (1).png` | U024 · `ChatGPT Image Sep 20, 2026, 09_43_40 PM (2).png` | `50% 50%` / `50% 50%` |
| Fitness centers & wellness | MobilityCare | U025 · `ChatGPT Image Sep 20, 2026, 09_43_40 PM (3).png` | U026 · `ChatGPT Image Sep 20, 2026, 09_43_40 PM (4).png` | `50% 50%` / `50% 50%` |
| Schools & academies | MobilityCare | U018 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (5).png` | U019 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (6).png` | `70% 50%` / `60% 50%` |
| Prosthetic & orthotic clinics | MobilityCare | U027 · `ChatGPT Image Sep 20, 2026, 09_43_41 PM (5).png` | U028 · `ChatGPT Image Sep 20, 2026, 09_43_41 PM (6).png` | `50% 50%` / `50% 50%` |
| Insurance & wellness programs | MobilityCare | U029 · `ChatGPT Image Sep 20, 2026, 09_43_42 PM (7).png` | U030 · `ChatGPT Image Sep 20, 2026, 09_43_42 PM (8).png` | `50% 50%` / `50% 50%` |
| Research & clinical trials | MobilityCare | U032 · `ChatGPT Image Sep 20, 2026, 09_43_44 PM (9).png` | U031 · `ChatGPT Image Sep 20, 2026, 09_43_44 PM (10).png` | `50% 50%` / `50% 50%` |
| Airports, metro & rail | SecureVision | U013 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (1).png` | U015 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (2).png` | `60% 50%` / `60% 50%` |
| Smart cities | SecureVision | U033 · `ChatGPT Image Sep 20, 2026, 09_47_40 PM (1).png` | U034 · `ChatGPT Image Sep 20, 2026, 09_47_40 PM (2).png` | `30% 50%` / `45% 50%` |
| Corporate & university campuses | SecureVision | U020 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (7).png` | U021 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (8).png` | `70% 50%` / `80% 50%` |
| Factories & warehouses | SecureVision | U016 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (3).png` | U017 · `ChatGPT Image Sep 20, 2026, 09_38_50 PM (4).png` | `65% 50%` / `60% 50%` |
| Malls & retail | SecureVision | U035 · `ChatGPT Image Sep 20, 2026, 09_47_41 PM (3).png` | U036 · `ChatGPT Image Sep 20, 2026, 09_47_42 PM (4).png` | `45% 50%` / `55% 50%` |
| Large events & stadiums | SecureVision | U037 · `ChatGPT Image Sep 20, 2026, 09_47_42 PM (5).png` | U038 · `ChatGPT Image Sep 20, 2026, 09_47_43 PM (6).png` | `50% 50%` / `50% 50%` |

### Notes on individual assignments

- **Schools & academies** — Closest fit on age group, not on industry: the record's problem statement is children's developmental screening, and the only educational-campus photographs in the reviewed set show university-age students. The environment is correct; a paediatric school set would be a stronger replacement.

## What each frame shows

- **Physiotherapy clinics**
  - dark: Physiotherapist walks beside a patient along a clinic gait lane after hours; parallel bars, treatment plinth and exercise balls.
  - light: Physiotherapist walks beside a patient along a sunlit clinic gait lane; parallel bars, treatment plinth and exercise balls.
- **Hospitals**
  - dark: Nurse supports a patient in a gown walking a hospital ward corridor at night.
  - light: Nurse walks a patient in a gown along a bright hospital ward corridor past a bed and IV stand.
- **Sports academies**
  - dark: Athlete walks a marked assessment lane in a performance gym while a coach records on a tablet.
  - light: Athlete walks a marked assessment lane in a daylit performance gym while a coach records on a tablet.
- **Elderly-care centers**
  - dark: Carer walks beside an elderly resident along a care-home corridor in the evening.
  - light: Carer walks beside an elderly resident using a cane along a sunlit care-home corridor.
- **Neurology clinics**
  - dark: Patient walks a neurology clinic floor at night while a clinician observes; brain imaging on the wall.
  - light: Patient walks a bright neurology clinic while a clinician records on a tablet; brain anatomy chart behind.
- **Home care & telehealth**
  - dark: Older adult walks a living room at night under a pose overlay while a carer reviews a tablet.
  - light: Older adult walks a sunlit living room under a pose overlay while a carer reviews a tablet.
- **Fitness centers & wellness**
  - dark: Gym member holds a lunge under a pose overlay in a night-lit gym above the city.
  - light: Trainer coaches a gym member through a lunge under a pose overlay in a daylit studio.
- **Schools & academies**
  - dark: Students walk a university campus path at dusk between lit academic buildings.
  - light: Students walk a sunlit university campus path between academic buildings and lawn.
- **Prosthetic & orthotic clinics**
  - dark: Man walking on a transtibial prosthesis under a pose overlay while a clinician records; prosthetic limbs on the wall.
  - light: Clinician checks the gait of a man walking on a transtibial prosthesis in a bright fitting room.
- **Insurance & wellness programs**
  - dark: Professional walks a premium lobby at night under a pose overlay.
  - light: Professional walks a bright wellness-centre lobby under a pose overlay past reception and treadmills.
- **Research & clinical trials**
  - dark: Participant walks an instrumented gait lab walkway at night between motion-capture rigs and analysis screens.
  - light: Participant walks an instrumented gait lab walkway in daylight between motion-capture cameras and two researchers.
- **Airports, metro & rail**
  - dark: Traveller walks an airport terminal concourse at night with luggage; aircraft and control tower beyond the glass.
  - light: Traveller walks a sunlit airport terminal concourse with luggage; aircraft on stand beyond the glass.
- **Smart cities**
  - dark: Pedestrians cross a city plaza at night under pose overlays; lit towers behind.
  - light: Pedestrians cross a sunlit city plaza under pose overlays between office towers.
- **Corporate & university campuses**
  - dark: Professionals cross a corporate lobby at night past the revolving entrance; city towers beyond.
  - light: Professionals cross a bright corporate lobby past the revolving entrance and reception desk.
- **Factories & warehouses**
  - dark: Worker in hi-vis and a hard hat walks a warehouse aisle at night past racking and a forklift.
  - light: Worker in hi-vis and a hard hat walks a daylit warehouse aisle past racking and a forklift.
- **Malls & retail**
  - dark: Shoppers walk a mall arcade at night under pose overlays past lit storefronts.
  - light: Shoppers walk a bright mall arcade under pose overlays past storefronts.
- **Large events & stadiums**
  - dark: Crowd arrives at a stadium concourse at night under pose overlays.
  - light: Crowd moves through a daylit stadium concourse under pose overlays past wayfinding signage.

## Rejected sources

| Review id | Kind | Why |
|---|---|---|
| U011 | contact-sheet-or-collage | Five-panel marketing contact sheet of use-case tiles with overlaid UI text and score cards. |
| U012 | contact-sheet-or-collage | Five-panel vertical poster set with GaitAI wordmark and overlaid metric lists. |
| U014 | excluded-subject | Armed soldier patrols a military base perimeter fence in daylight. |
| U022 | excluded-subject | Armed soldier patrols a military base perimeter fence at dusk. |

## Environment without imagery

**Defence & Armed Forces** (`defence`) — The only defence photographs in this batch (U014, U022) show an armed soldier on patrol. The site's defence imagery rule forbids weapons and combat imagery, and the integration brief excluded military imagery, so both were rejected and this environment ships without a photograph.

Resolution: Commission a non-weapons defence pair — a base pedestrian environment such as a gate or perimeter walkway with no visible firearm.

## Verification

- `npm run check:use-case-images` — files, hashes, sizes, ladders, ownership, per-theme luminance, rejects stay rejected, no orphan directories.
- `npm run check:use-case-images:browser` — served export in headless Chromium: the painted frame belongs to the environment and the theme, the toggle swaps in place with no reload, a persisted light theme never requests a dark frame (and the server HTML carries no `src`), 4:3 with `object-fit: cover` and the manifest's `object-position` at 1440 / 1024 / 768 / 390 in both themes, the fetched rung is never narrower than the painted box, and an expanded card keeps its photograph.
