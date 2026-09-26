# Erase the painted Pose-panel figure (and its painted reflection) from a hero plate with LaMa.
# python erase.py light|dark
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage
import onnxruntime as ort
from rembg import remove, new_session

HERE = os.path.dirname(os.path.abspath(__file__))
# Reads the ORIGINAL painted plates (pre-erase; git show 2c... or the scratch copy), never the shipped clean ones.
REPO = os.environ.get("HERO_ORIG", r"C:/Users/Anubha/AppData/Local/Temp/claude/C--Users-Anubha-Documents-website-GaitAI-main/917f7ff1-96ab-4e2c-b8c1-6cc771348861/scratchpad/orig")
theme = sys.argv[1]
cfg = {
    "light": dict(src="home-hero-gaitai.webp", box=(1140, 320, 1500, 900), refl=115, dil=12, halo=0),
    "dark": dict(src="home-hero-dark.webp", box=(1270, 250, 1620, 860), refl=100, dil=30, halo=1),
}[theme]
img = Image.open(os.path.join(REPO, cfg["src"])).convert("RGB")
W, H = img.size
x0, y0, x1, y1 = cfg["box"]
crop = img.crop(cfg["box"])
matte = np.array(remove(crop, session=new_session("u2net")).convert("RGBA"))[:, :, 3]
fig = matte > 20
# largest component only (the figure), not stray bright ribbons
lab, n = ndimage.label(fig)
if n > 1:
    sizes = ndimage.sum(fig, lab, range(1, n + 1))
    fig = lab == (1 + int(np.argmax(sizes)))
ys, xs = np.where(fig)
print(theme, "figure bbox", x0 + xs.min(), y0 + ys.min(), x0 + xs.max(), y0 + ys.max())
mask = np.zeros((H, W), bool)
mask[y0:y1, x0:x1] = fig
# the painted reflection: mirror the figure's lowest part below the floor line
foot = y0 + ys.max()
for yy in range(foot, min(H, foot + cfg["refl"])):
    src_y = foot - (yy - foot)
    mask[yy, x0:x1] |= mask[src_y, x0:x1]
# feet band: everything from 45px above the lowest foot pixel to the end of the reflection,
# over the columns the feet occupy
fy = foot - y0
cols = np.where(fig[max(0, fy - 45):fy + 1].any(0))[0]
band = np.zeros_like(mask)
band[foot - 45:min(H, foot + cfg["refl"] + 20), x0 + cols.min() - 18:x0 + cols.max() + 18] = True
mask |= band & ndimage.binary_dilation(mask, iterations=40)
mask = ndimage.binary_dilation(mask, iterations=cfg["dil"])
Image.fromarray((mask * 255).astype(np.uint8)).save(os.path.join(HERE, f"mask-{theme}.png"))

sess = ort.InferenceSession(os.path.join(HERE, "models/lama_fp32.onnx"))
arr = np.array(img).astype(np.float32) / 255.0
my, mx = np.where(mask)
cx = int((mx.min() + mx.max()) / 2)
# vertical tiles of 512 at native resolution, overlapping
tops = list(range(max(0, my.min() - 60), max(1, min(H - 512, my.max() - 452)) + 1, 300))
if tops[-1] + 512 < my.max() + 30:
    tops.append(min(H - 512, my.max() + 30 - 512))
left = int(np.clip(cx - 256, 0, W - 512))
for top in tops:
    top = int(np.clip(top, 0, H - 512))
    win = arr[top:top + 512, left:left + 512]
    m = mask[top:top + 512, left:left + 512].astype(np.float32)
    if m.sum() == 0:
        continue
    out = sess.run(None, {"image": win.transpose(2, 0, 1)[None], "mask": m[None, None]})[0][0]
    out = out.transpose(1, 2, 0)
    if out.max() > 2:
        out = out / 255.0
    arr[top:top + 512, left:left + 512] = np.where(m[..., None] > 0.5, out, win)
    mask[top:top + 512, left:left + 512] = False
    print("tile", left, top)
res = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8))
res.save(os.path.join(HERE, f"clean-{theme}.png"))
res.crop((x0 - 40, 0, W, H)).save(os.path.join(HERE, f"clean-{theme}-view.png"))
