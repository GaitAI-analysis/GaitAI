# The homepage hero's panel photographs

The hero is one panoramic composition of three panels — GaitAI | MobilityCare |
SecureVision — cut by two diagonals. Everything in it except the photography is
DOM and SVG: the headline, the sublines, the eyebrows, the messages, the three
pills, the diagonal dividers, the pose keypoints and every gradient. Those are
resolution-independent and need nothing from you.

**The photographs are the one raster layer, and they are what this document is
about.** Three of them, one per panel, in two themes.

---

## What to supply

Six files, in `assets/hero/src/`, named exactly:

```
gaitai-dark.png          mobilitycare-dark.png          securevision-dark.png
gaitai-light.png         mobilitycare-light.png         securevision-light.png
```

Any still format ffmpeg reads (PNG, JPEG, TIFF, WebP, AVIF). Supply the highest
quality original you have — the encoder does the compression, so do not
pre-compress and do not pre-resize. This directory is git-ignored: originals are
inputs, and what ships is the encoded output.

### The three scenes

| Panel | Scene |
| --- | --- |
| `gaitai` | A traveller walking away from camera through a glass concourse, with a rolling case. Other people in soft focus behind. |
| `mobilitycare` | A clinician steadying an older adult walking between parallel bars, both seen from behind. |
| `securevision` | A security officer seen from behind, watching people cross a large public concourse. Other pedestrians mid-stride, left and right of him. |

### Minimum width

Each panel is a box of the composition's 1774×887 canvas, so each one is
requested at its own share of the hero's width — and on a 2× screen it needs
twice that in device pixels:

| Panel | Box | Share of hero | Needs at 2560 CSS @2× | Needs at 1920 CSS @2× |
| --- | --- | --- | --- | --- |
| `gaitai` | 810 × 887 | 45.7 % | **2338 px** | 1754 px |
| `mobilitycare` | 805 × 887 | 45.4 % | **2324 px** | 1743 px |
| `securevision` | 668 × 887 | 37.7 % | **1928 px** | 1446 px |

**Supply at least 2400 px wide, per panel, after cropping** (see below). 2400 is
the top step of the ladder and covers a 2560 screen at 2×. More is welcome and
is not wasted — the encoder will use the source's own width as an extra top
step. Less is accepted but reported: the encoder emits only the steps a source
can actually fill and **never upscales**, so a short source simply means the
`srcset` stops earlier and the photography is soft at 2× while everything else
stays sharp.

### Aspect ratio and cropping

Each panel's photograph is its box's ratio:

```
gaitai        810 / 887  =  0.913     (slightly taller than square)
mobilitycare  805 / 887  =  0.908
securevision  668 / 887  =  0.753
```

You do not have to crop to that yourself — `hero:panels` centre-crops whatever
you give it. But it crops from the CENTRE, so frame the subject centrally, or
crop it yourself first and it will pass through untouched.

**The whole box must be good photography, not just the visible wedge.** On the
panoramic layout a panel is clipped to a diagonal, so the corners outside it are
hidden — but the stacked phone layout shows the entire box. Any filler, smear or
placeholder outside the diagonal will be visible on a phone.

### The two themes must be the same frame

The light and dark files for a panel must be **the same photograph, graded
differently** — a brighter, airier exposure of the same shot for light, not a
different shot. Two reasons:

1. The pose overlay is authored against the frame. One set of joint coordinates
   serves both themes, so if the person stands somewhere else in the light
   photograph, the skeleton fits one theme and misses in the other.
2. The composition is one layout now, not two. The old pair of flattened banners
   disagreed about where the panels sat by up to 60 px; that is exactly what
   this rebuild removed.

If a single file works in both themes, supply the same file twice — the encoder
is happy to, and the CSS scrim and ink already branch per theme on top of it.

---

## Encoding them

```bash
npm run hero:panels
```

On Windows, if ffmpeg is not on `PATH`, point at it:

```bash
FFMPEG=/path/to/ffmpeg.exe FFPROBE=/path/to/ffprobe.exe npm run hero:panels
```

It centre-crops each source to its panel's ratio, then writes AVIF and WebP at
every step of `[480, 720, 1024, 1280, 1600, 2000, 2400]` that the source can
fill, into `public/images/hero/panels/`, and records what it produced in
`src/data/hero-panels.generated.json`.

**The manifest is the source of truth for the `srcset`.** The hero builds its
candidates from what is on disk, never from the wished-for ladder, so a
candidate can never 404. Both the encoded files and the manifest are committed,
so a build never has to run the encoder.

If any source is under 2400 px the command **fails** with the shortfall per
panel. That is deliberate — it is the one mistake this whole rebuild exists to
prevent. Pass `--interim` to accept it knowingly:

```bash
npm run hero:panels -- --interim
```

---

## Re-tuning the pose overlays

The keypoints live in `src/data/home-hero.ts`, as pixels of **the panel's own
photograph** (not the hero's canvas — so for MobilityCare, whose box starts at
canvas x 553, canvas x 1071 is photograph x 518).

A new photograph means new coordinates. Note two things that are design, not
accident, and should survive the change:

- **The SecureVision officer carries no skeleton.** The overlay is on the people
  crossing the space, never on the person watching it. That is the panel's
  argument.
- **The MobilityCare clinician carries no skeleton either** — only the patient
  does. She is the care, not the measurement.

To check a fit, run the site and look at the overlay over the picture at a wide
viewport and on a phone. The two layers are locked together by a matched pair of
declarations — the photograph uses `object-fit: cover; object-position: center`
and the overlay's SVG uses `preserveAspectRatio="xMidYMid slice"`, which is the
same rule in SVG. Change one and the skeletons drift off the people; there is
deliberately no per-panel focal point, because SVG can only align to the start,
middle or end of an axis. Framing is adjusted through the panel's height in
`hero.module.css` instead.

---

## Where the rest of it lives

| File | What it owns |
| --- | --- |
| `src/lib/hero-panels.ts` | The boxes, the width ladder, the `sizes` strings, the srcset builders |
| `src/data/home-hero.ts` | The composition: canvas, diagonals, copy, pose joints |
| `src/components/sections/Hero.tsx` | The three layers and their order |
| `src/components/sections/hero.module.css` | All the geometry — one artwork pixel is one CSS length, `--px` |
| `src/components/sections/HeroPose.tsx` | The SVG overlay |
| `src/components/sections/HeroCta.tsx` | One pill, as a real link |
| `src/components/ui/ThemePicture.tsx` | `<picture>` with a theme resolved before first paint |
| `scripts/hero-panels.mjs` | The encoder |
| `design-references/hero/` | The approved flattened artwork the rebuild was measured against. Reference only — nothing renders it. |

The LCP preload in `src/app/page.tsx` is built from the same registry, so its
`imagesrcset`, `imagesizes` and `type` cannot drift from what the hero actually
requests. If they ever did, the preload would land beside the real request
instead of satisfying it.
