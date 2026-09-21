# SecureVision hero — the daylight film

The `/securevision/` hero is two independent films, one per theme, registered
as `secureVisionHero` in `src/lib/theme-media.ts`:

```
public/assets/videos/securevision/securevision-hero.mp4               dark  · night concourse (unchanged)
public/assets/videos/securevision/securevision-hero-poster.jpg
public/assets/videos/securevision/securevision-hero-light.mp4         light · daylight concourse
public/assets/videos/securevision/securevision-hero-poster-light.jpg
```

`ThemeVideo` picks one file by the resolved theme before first paint and swaps
it in place on toggle. The light film is **never** derived from the dark one:
no brightness, no desaturation, no white wash, no LUT. `check:media --strict`
requires both files on disk and, because the pair is `timing: "own"`, the same
1280×720 box but not the same length.

## Status: interim plate

The light file currently shipping is a **fixed-camera, slow-parallax render of
a reviewed daylight photograph** — `use-case-image-manifest.json` review id
U015, the sunlit airport concourse (traveller at the right third, aircraft and
control tower through the glass, walkers in the middle distance). It is a
native daylight image, 12 s, seamless loop (first↔last frame Δ 3.2/255),
±1.4 % zoom drift. It meets the light-mode rule — true whites, no filter, no
fog — but it is a still with parallax, not footage: nobody walks, and the
subject is a traveller rather than a safety officer. It exists so light mode is
right *today*; the commissioned film replaces it.

## The commissioned film — brief

Deliver `securevision-hero-light.mp4` and a first-frame
`securevision-hero-poster-light.jpg`, then run `npm run check:media -- --strict`
and `npm run check:securevision-hero:browser`. Re-anchor the three skeletons in
`SecureVisionDaylightIntelligence.tsx` (`WALKERS`, `SCENE`) to the new frames.

**Technical.** 1280×720 minimum (1920×1080 preferred; the encoder scales), 24
fps, 10–14 s, seamless loop (first and last frames within a few levels of
each other — a slow sinusoidal drift, not a cut), H.264 High profile, yuv420p,
`-movflags +faststart`, no audio, target ≤ 1.5 MB at 1280×720.

**Scene.** A modern airport / metro / civic concourse. Clean white and pale
warm-grey architecture, large glass surfaces, daylight entering from the
sides, subtle cool-blue architectural accents, realistic floor reflections and
soft shadows, crisp people. Bright, calm, enterprise-grade — not futuristic,
not security-footage grey.

**Composition.** One cinematic scene. A safety/security officer around the
right third, back or three-quarter to camera, not dominant. People walking
naturally through the middle and background at different depths and speeds.
The left third stays quiet and clean — the headline and CTAs live there.

**Camera.** Nearly fixed. Subtle parallax only. No push-ins, no whip pans, no
handheld shake, no thriller grammar.

**Overlays.** None baked in. The site draws them: thin cyan `#35C8F3` skeletons
on two or three walkers, tiny joint dots, faint floor trajectories, one royal
flow ribbon, one small anomaly ring, one privacy indicator. No tracking boxes,
no HUD panels, no wordmark, no text.

**Generator prompt (starting point).**

> Static wide shot inside a bright modern airport concourse, white and pale
> warm-grey architecture, floor-to-ceiling glass on the left with soft
> daylight entering from the side, polished light-grey terrazzo floor with
> gentle reflections, subtle cool-blue signage accents. A uniformed safety
> officer in navy stands in the right third with his back three-quarters to
> camera, watching the concourse. Travellers walk naturally at different
> distances and speeds through the middle and background. The left third of
> the frame is open and uncluttered. Calm, premium, architectural,
> photoreal, no text, no graphics, no camera movement beyond a very slow,
> subtle drift. Seamless loop.

## Removed from the hero

The four capability chips ("Anomaly alerts", "Crowd analytics", "Worker
safety", "Privacy-first") no longer sit on the film in either theme. The
signals section directly beneath the hero names every capability from the
canonical taxonomy. The hero wording, eyebrow and both CTAs are unchanged.
