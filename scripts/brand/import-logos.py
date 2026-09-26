"""
Import the founder's approved GaitAI wordmarks (light + dark) as transparent,
trimmed PNGs for the site's Logo component.

The sources are the founder's own files, used as supplied: nothing is redrawn,
recoloured or re-rendered. Each arrives with its background baked in (white
for light, deep navy for dark), and neither matches the navbar or footer it
sits on, so the ONLY change is removing that background colour:

  colour-to-alpha against the measured background. For every pixel, alpha is
  the smallest opacity that, composited over the background, reproduces the
  source pixel exactly; the colour is un-premultiplied to match. So over its
  original background each derivative gives back the original, pixel for
  pixel (the script asserts this), and anti-aliased edges keep their
  softness instead of picking up a halo.

Then the empty margin is trimmed to the ink's bounding box (plus a hair), and
a 640px-wide copy is written for 1x/2x navbar use.

  python scripts/brand/import-logos.py <light.png> <dark.png>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parents[2] / "public" / "assets" / "brand"
# A channel within this many levels of the background is the background's own
# noise and gradient (the navy one drifts by about 3 levels corner to corner),
# not ink.
TOL = 8 / 255
PAD = 4


def background(rgb: np.ndarray) -> np.ndarray:
    """The median colour of a 12px border: the flat baked background."""
    b = 12
    ring = np.concatenate(
        [rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
         rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3)]
    )
    return np.median(ring, axis=0)


def colour_to_alpha(rgb: np.ndarray, bg: np.ndarray) -> np.ndarray:
    """Classic colour-to-alpha, both directions, with a noise floor.

    A channel counts only once it is more than TOL away from the background.
    Without that floor a background at 254 (or 3) has a single level of
    headroom on its far side, so a 1-level speck of noise would divide out to
    fully opaque ink. With it, the flat background goes fully transparent and
    everything the artwork actually draws is kept -- including the dark file's
    thin near-black rim around its white shapes, which lies BELOW the navy and
    so is darker ink, not background."""
    c = rgb.astype(np.float64) / 255
    g = bg / 255
    up = np.where(c - g > TOL, (c - g) / np.maximum(1 - g, 1e-6), 0)
    down = np.where(g - c > TOL, (g - c) / np.maximum(g, 1e-6), 0)
    a = np.clip(np.max(np.maximum(up, down), axis=2), 0, 1)
    safe = np.where(a > 0, a, 1)[..., None]
    col = np.clip((c - g) / safe + g, 0, 1)
    col[a == 0] = 0
    return np.dstack([col, a])


def verify(rgba: np.ndarray, rgb: np.ndarray, bg: np.ndarray) -> float:
    """Worst error, in levels, of the derivative composited back over the
    measured background, across the ink (alpha > 0). Channels the ink does not
    move are clamped at the background, so a pixel off-direction on one channel
    can differ by up to TOL there; the ink itself is exact."""
    a = rgba[..., 3:4]
    comp = rgba[..., :3] * a + (bg / 255) * (1 - a)
    ink = rgba[..., 3] > 0
    return float(np.abs(comp[ink] * 255 - rgb[ink].astype(np.float64)).max())


def run(src: str, name: str) -> None:
    im = Image.open(src).convert("RGB")
    rgb = np.asarray(im)
    bg = background(rgb)
    rgba = colour_to_alpha(rgb, bg)
    err = verify(rgba, rgb, bg)
    assert err <= TOL * 255 + 1, f"{name}: recomposite differs by {err:.2f} levels"
    a8 = (rgba[..., 3] * 255).round().astype(np.uint8)
    ys, xs = np.nonzero(a8 > 24)
    y0, y1 = max(ys.min() - PAD, 0), min(ys.max() + PAD + 1, rgb.shape[0])
    x0, x1 = max(xs.min() - PAD, 0), min(xs.max() + PAD + 1, rgb.shape[1])
    out = Image.fromarray((rgba[y0:y1, x0:x1] * 255).round().astype(np.uint8), "RGBA")
    OUT.mkdir(parents=True, exist_ok=True)
    out.save(OUT / f"{name}.png", optimize=True)
    small = out.resize((640, round(out.height * 640 / out.width)), Image.LANCZOS)
    small.save(OUT / f"{name}-640.png", optimize=True)
    print(f"{name}: bg={bg.round().astype(int).tolist()} max recomposite error "
          f"{err:.2f}/255, trimmed {out.width}x{out.height} "
          f"(ratio {out.width / out.height:.4f}), 640w {small.width}x{small.height}")


if __name__ == "__main__":
    light, dark = sys.argv[1], sys.argv[2]
    run(light, "gaitai-logo-light")
    run(dark, "gaitai-logo-dark")
