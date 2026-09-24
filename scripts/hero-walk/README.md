# Walking the Pose-analysis figure

The homepage hero is one painted picture. In its rightmost panel an
anatomical figure stands caught mid-stride. This pipeline takes that painted
figure out of the picture, cuts it into limbs, and walks it — leaving every
other pixel of the artwork exactly as the founder supplied it.

What ships is `public/images/hero/walk/*.webp` (eleven limb sprites plus the
patch that erases the painted figure, about 175 KB in total) and
`src/components/sections/herowalk.module.css`, which is **generated — do not
edit it by hand**. `HeroWalk.tsx` hangs the sprites off each other and the
stylesheet turns the joints.

## Running it

Needs Python with `pillow`, `numpy`, `scipy`, `scikit-image` and `rembg`, and
Node with `playwright-core` for the pose step. Run in order from this
directory; each stage writes into a scratch folder beside itself.

| Step | What it does |
| --- | --- |
| `01_matte.py` | Cuts the figure out of the artwork with `rembg`. |
| `03_pose.mjs` | Runs the site's own MediaPipe pose landmarker over the cut-out, so the rig's joints sit where the product's engine says they are rather than where someone guessed. Needs `QA_CHROMIUM` pointing at a Chromium binary. |
| `04_erase.py` | Reconstructs the background the figure covered and writes the eraser patch. Row-wise interpolation keeps the gold streams continuous where a pure diffusion fill would smear them away. |
| `05_rig.py` | Cuts the figure into eleven sprites and writes `rig.json`. |
| `06_gait.py` | The gait model. |
| `07_preview.py` | Renders the cycle to `preview.mp4` over the reconstructed background. Look at this before shipping anything. |
| `09_emit.py` | Writes the sprites and the stylesheet into the app. Run `npx prettier --write` on the stylesheet afterwards. |

`rig.json` is committed because `09_emit.py` needs it and re-running the
matte is slow; regenerate it with `05_rig.py` if the joints or the cuts
change.

## The two decisions worth knowing

**The legs are solved, not animated.** An earlier version drove hip, knee and
ankle straight from normative gait curves. That walks, but it cannot stand:
three prescribed angles per leg over-determine the geometry, so at double
support the two feet want the pelvis at different heights and the body jumps
between them. Here each foot follows a path — planted through stance,
lifted through swing — and two-link inverse kinematics supplies whatever hip
and knee reach it. Ground contact is then exact by construction, and the
knee bend and the rise and fall of the body fall out of the geometry.

Both legs are solved at the same length even though the painted right leg
measures 7px longer than the left. Letting that stand drops the body on
every second step, which reads as a limp.

**The figure walks on the spot.** A loop that ends where it began cannot have
travelled. A figure that advances has to jump back at the loop point, and a
figure that drifts backwards while its feet step forward is a moonwalk. What
is here is the motion a camera walking alongside would record. The floor in
the artwork is a mirror with no texture on it, so nothing in frame
contradicts it.

## Why sprites rather than a transparent video

Transparency in WebM means VP9 with an alpha channel, and Safari decodes that
without the alpha — a black box over the hero. The sprites are the artwork's
own pixels, so they stay as sharp as the picture at any width, where a video
is pinned to the resolution it was encoded at. They also cost about 175 KB
instead of a megabyte, they cannot fail to autoplay, and with
`prefers-reduced-motion` they need no fallback image: with the animations
off every layer sits at its identity transform, and because all eleven
sprites were cut from one picture they re-assemble it exactly.
