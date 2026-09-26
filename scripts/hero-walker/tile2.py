# Backdrop for the tracking shot, from the REAL panel only.
#   walk-<theme>-backdrop.webp : clean panel (x0..W) + a narrow outpainted strip past the right edge (EXT px),
#                                floor rows softened (their reflection drifts with the backdrop)
#   walk-<theme>-grain.webp     : the floor's own detail as a seamless tile (128-neutral), for per-row ground speed
import os, json, sys
import numpy as np
from PIL import Image
from scipy import ndimage
import onnxruntime as ort

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out", "pack3")
os.makedirs(OUT, exist_ok=True)
sess = ort.InferenceSession(os.path.join(HERE, "models/lama_fp32.onnx"))
div = json.load(open(os.path.join(HERE, "out", "divider.json")))
FLOOR = {"light": 700, "dark": 742}
EXT = 72


def lama_col(img, mask, x):
    H = img.shape[0]
    for y in sorted(set([0, max(0, H - 512)] + list(range(0, max(1, H - 512), 300)))):
        m = mask[y:y + 512, x:x + 512]
        if not m.any():
            continue
        win = img[y:y + 512, x:x + 512]
        o = sess.run(None, {"image": win.transpose(2, 0, 1)[None].astype(np.float32), "mask": m[None, None].astype(np.float32)})[0][0].transpose(1, 2, 0)
        if o.max() > 2:
            o = o / 255.0
        img[y:y + 512, x:x + 512] = np.where(m[..., None], o, win)
        mask[y:y + 512, x:x + 512] = False
    return img


res = {}
for theme in sys.argv[1:] or ["light", "dark"]:
    clean = np.array(Image.open(os.path.join(HERE, f"clean-{theme}.png")).convert("RGB")).astype(np.float32) / 255
    H, W = clean.shape[:2]
    b, m = div[theme]["b"], div[theme]["m"]
    x0 = int(b + m * H) - 6
    R = np.concatenate([clean[:, x0:W], np.zeros((H, EXT, 3), np.float32)], axis=1)
    mask = np.zeros(R.shape[:2], bool); mask[:, -EXT:] = True
    R = lama_col(R, mask, R.shape[1] - 512)
    ft = FLOOR[theme]
    soft = np.stack([ndimage.gaussian_filter(R[..., c], 9, mode="nearest") for c in range(3)], -1)
    ramp = np.clip((np.arange(H) - ft) / 50.0, 0, 1)[:, None, None]
    back = R * (1 - ramp) + soft * ramp
    Image.fromarray((np.clip(back, 0, 1) * 255).astype(np.uint8)).save(os.path.join(OUT, f"walk-{theme}-backdrop.webp"), "WEBP", quality=88, method=6)
    # grain tile: floor rows right of the divider at the floor's top row, seamless by an end crossfade
    gx0 = int(b + m * ft) + 10 - x0
    detail = (R - soft)[ft:, gx0:R.shape[1] - EXT]
    gw = detail.shape[1]; ov = 80
    t = np.linspace(0, 1, ov)[None, :, None]
    seam = detail[:, gw - ov:] * (1 - t) + detail[:, :ov] * t
    tile = np.concatenate([detail[:, ov:gw - ov], seam], axis=1)
    fade = np.clip((np.arange(tile.shape[0])) / 50.0, 0, 1)[:, None, None]
    g = np.clip(0.5 + tile * fade, 0, 1)
    Image.fromarray((g * 255).astype(np.uint8)).save(os.path.join(OUT, f"walk-{theme}-grain.webp"), "WEBP", quality=90, method=6)
    Image.fromarray((np.clip(back, 0, 1) * 255).astype(np.uint8)).save(os.path.join(HERE, f"backdrop-check-{theme}.png"))
    res[theme] = dict(x0=x0, w=int(R.shape[1]), h=H, ext=EXT, floorTop=ft, grainW=int(tile.shape[1]), grainH=int(tile.shape[0]))
    print(theme, res[theme], os.path.getsize(os.path.join(OUT, f"walk-{theme}-backdrop.webp")) // 1024, "KB",
          os.path.getsize(os.path.join(OUT, f"walk-{theme}-grain.webp")) // 1024, "KB")
p = os.path.join(OUT, "tiles.json")
old = json.load(open(p)) if os.path.exists(p) else {}
old.update(res)
json.dump(old, open(p, "w"))
