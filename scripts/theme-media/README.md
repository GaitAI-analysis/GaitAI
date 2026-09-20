# Theme media — how the light companions are made

Dark is the GaitAI identity and every film and diagram on the site was rendered
for it. Light mode does not get new renders: it gets the **same asset**, pushed
once through a deterministic colour transform, and shipped as a second file next
to the original.

```
public/assets/videos/workflow/stage-02-analyze.mp4            dark (unchanged)
public/assets/videos/workflow/stage-02-analyze-light.mp4      light companion
public/assets/videos/workflow/stage-02-analyze-poster.jpg     dark poster
public/assets/videos/workflow/stage-02-analyze-poster-light.jpg
public/assets/images/publications/gait-covariates-review.webp
public/assets/images/publications/gait-covariates-review-light.webp
```

Nothing is generated at visitor runtime. The registry in `src/lib/theme-media.ts`
names both files and `ThemeVideo` / `ThemeImage` in
`src/components/ui/ThemeMedia.tsx` pick one by the resolved theme.

## The transform (`make_light_lut.py`)

Per pixel, in OKLab, hue preserved:

| dark render | light companion |
| --- | --- |
| near-black ground | icy off-white `#eef4fb` |
| white type, hot line cores | deep navy `#171f2e` |
| bright cyan `#4fd1ff` | deep cyan `#177d9d` |
| violet traces `#a78bfa` | richer violet `#7150c0` |
| amber / champagne `#fbbf24` | `#916e16` |
| dark translucent panels | pale frosted panels |
| glow bloom | restrained pale halo |

Only bright **and** saturated pixels count as signals (a drawn line, a chart);
dim bluish bloom is treated as ground so a glow does not become blue smog.
`black_toe` is the one per-asset parameter: the OKLab lightness of that
render's ground, measured as the 10th percentile of a frame.

## People are never inverted

Photographic people are masked out and composited back untouched
(`segment_person.mjs`, the Movement Lab's own MediaPipe pose model in headless
Chrome; `render_light.py` does the composite with `maskedmerge`). This works for
the two single-subject console films. The SecureVision hero is a night crowd the
model cannot segment reliably, so that film is a deliberate **dark island** in
both themes — see its `island` reason in the registry. A rendered light plate
would replace it; drop it in as `securevision-hero-light.mp4` and switch the
entry to a pair.

## Rendering

```
# once per film with a person: frames, then masks
ffmpeg -i public/assets/videos/platform/securevision-intelligence.mp4 tmp/theme-media/securevision-intelligence/frames/%04d.png
node scripts/theme-media/segment_person.mjs tmp/theme-media/securevision-intelligence/frames tmp/theme-media/securevision-intelligence/masks

# everything in jobs.json (videos, posters, images)
python scripts/theme-media/render_light.py
python scripts/theme-media/render_light.py --only stage-02
```

`render_light.py` refuses a light film whose dimensions, frame count, frame rate
or duration differ from the dark one. Posters are the first frame of the light
film, cut to the dark poster's exact pixel size (`--posters-only` re-cuts them).

## The two console films (`pipeline: "console"`)

`platform/mobilitycare-intelligence.mp4` and `platform/securevision-intelligence.mp4`
are flattened renders — a photographic walker, a room, HUD panels and drawn
signals in one file — and a global LUT cannot light them (it inverts the
person and flattens the hierarchy). They go through `relight_console.py`
instead: per-frame pose masks, then every frame is re-lit by region (room,
panels, type, signals, person) with ONE deterministic grade for the whole
sequence, so nothing flickers and no motion is redrawn — every bar, waveform,
skeleton line and trajectory is the dark film's own pixels, recoloured.

```
ffmpeg -i public/assets/videos/platform/mobilitycare-intelligence.mp4 tmp/theme-media/mobilitycare-intelligence/frames/%04d.png
node scripts/theme-media/segment_person.mjs tmp/theme-media/mobilitycare-intelligence/frames tmp/theme-media/mobilitycare-intelligence/masks
python scripts/theme-media/render_light.py --only intelligence     # relight --batch, then H.264 at the dark film's geometry
```

The grade lives in `console_layers.json` under each film's `grade` and
overrides `DEFAULT_GRADE` in `relight_console.py`. The defaults are the first
(2026-09-14) edition, which read as washed out: a near-white room with no
structure, hairline panels that vanished into it, thin pale signals and a
grey aura around the walker. The 2026-09-21 grade keeps the room's structure
(`env_*`: an icy, cool-tinted gradient with the dark room's own detail and
inverted mid-scale structure, a deeper polished floor, stronger reflection),
gives panels a 2px border and a real shadow, deepens ink and signals
(`sig_*`, `soft_*`, `halo_*`, `body_sig_*`) and re-exposes the person
(`person_*`). Tune on one frame with a JSON override before touching the
config; `render_light.py` refuses a light film whose geometry or timing
differs from the dark one.

## Proving parity

```
python scripts/theme-media/verify_parity.py
```

Samples every pair at 0 / 25 / 50 / 75 / 100 % of the timeline, compares
Sobel edge maps (edge IoU and edge correlation — geometry) against raw
luminance correlation (palette), and fails if a pair's geometry or timing
differs or its edge IoU drops below 0.6. Current pairs score 0.73–0.95 edge
IoU with 0.95–0.99 edge correlation and strongly negative luminance
correlation: same drawing, opposite palette.

## Adding a new video

1. Put the dark file under `public/assets/videos/`.
2. Add a job to `jobs.json` (measure `black_toe`; set `personMask` if a real
   person is in frame) and run `render_light.py`.
3. Register it in `src/lib/theme-media.ts` — as a `pair`, or as an `island`
   with the reason it stays dark.
4. `npm run check:media` reports anything unregistered or missing its companion;
   it runs in `prebuild` (warnings) and `verify` (`--strict`, fails CI).
