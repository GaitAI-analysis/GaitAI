# Erase patch (feathered, only where the painted figure was) + tileable floor band, per theme.
import os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "pack2")
CFG = {
    "light": dict(floorTop=690, fadeRows=70, blur=14),
    "dark": dict(floorTop=735, fadeRows=60, blur=14),
}
res = {}
for theme, c in CFG.items():
    clean = np.array(Image.open(os.path.join(HERE, f"clean-{theme}.png")).convert("RGB"))
    H, W = clean.shape[:2]
    mask = np.array(Image.open(os.path.join(HERE, f"mask-{theme}.png"))) > 127
    ys, xs = np.where(mask)
    x0, y0, x1, y1 = xs.min() - 12, ys.min() - 12, min(W, xs.max() + 13), min(H, ys.max() + 13)
    soft = ndimage.gaussian_filter(ndimage.binary_dilation(mask, iterations=4).astype(float), 3)
    a = np.clip(soft * 1.4, 0, 1)
    rgba = np.dstack([clean, (a * 255).astype(np.uint8)])[y0:y1, x0:x1]
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, f"walk-{theme}-patch.webp"), "WEBP", quality=86, alpha_quality=90, method=6)

    # Floor band: the clean floor across the whole panel width (from the divider at the band's
    # bottom row to the picture edge), made seamless horizontally, then motion-blurred.
    ft = c["floorTop"]
    band = clean[ft:H].astype(float)
    # start right of the divider at the bottom row so no MobilityCare pixels enter the tile
    div = json.load(open(os.path.join(HERE, "out", "divider.json")))[theme]
    bx0 = int(div["b"] + div["m"] * ft) + 8
    band = band[:, bx0:]
    bw = band.shape[1]
    ov = 90
    left, right = band[:, :ov], band[:, bw - ov:]
    t = np.linspace(0, 1, ov)[None, :, None]
    seam = right * (1 - t) + left * t
    tile = np.concatenate([band[:, ov:bw - ov], seam], axis=1)
    # horizontal motion blur with wrap
    k = c["blur"]
    acc = np.zeros_like(tile)
    for s in range(-k, k + 1):
        acc += np.roll(tile, s, axis=1)
    tile = acc / (2 * k + 1)
    alpha = np.ones(tile.shape[:2])
    fr = c["fadeRows"]
    alpha[:fr] = np.linspace(0, 1, fr)[:, None] ** 1.5
    out = np.dstack([np.clip(tile, 0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
    Image.fromarray(out, "RGBA").save(os.path.join(OUT, f"walk-{theme}-floor.webp"), "WEBP", quality=84, alpha_quality=90, method=6)
    res[theme] = dict(patch=[int(x0), int(y0), int(x1 - x0), int(y1 - y0)], floor=dict(top=ft, w=int(tile.shape[1]), h=int(tile.shape[0])), plate=[W, H])
    print(theme, res[theme], os.path.getsize(os.path.join(OUT, f"walk-{theme}-patch.webp")) // 1024, "KB patch",
          os.path.getsize(os.path.join(OUT, f"walk-{theme}-floor.webp")) // 1024, "KB floor")
json.dump(res, open(os.path.join(OUT, "plates.json"), "w"))
