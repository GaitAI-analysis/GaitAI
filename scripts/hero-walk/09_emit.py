# Emit what ships: the limb sprites, the patch that erases the painted
# figure, and the stylesheet that walks the rig.
#
# The animation is CSS on eleven nested layers rather than a video. A
# transparent video would have to be VP9-alpha WebM, which Safari decodes
# without its alpha channel — it would show a black box over the hero — and
# it would fix the figure's resolution, where the sprites are the artwork's
# own pixels and scale with it. CSS also gives the reduced-motion case for
# free: with no animation every layer sits at its identity transform, and
# because every sprite was cut from the same picture the rig at rest
# re-assembles the painted figure exactly.
import json
import math
import os
import shutil
import sys
from importlib import import_module

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
gait = import_module("06_gait")
REPO = r"C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI"
ASSETS = os.path.join(REPO, "public/images/hero/walk")
CSS = os.path.join(REPO, "src/components/sections/herowalk.module.css")

rig = json.load(open(os.path.join(HERE, "rig.json")))
J, BOX = rig["joints"], rig["box"]
IMG_W, IMG_H = 1672, 941
OX, OY = BOX[0], BOX[1]
STEPS = 40          # keyframes per cycle
CYCLE = "1.45s"     # one stride: about 83 steps a minute, an unhurried walk
DRIFT = "5.8s"      # the whole composition's period

CLASS = {
    "torso": "torso", "upperarm_l": "armLUpper", "forearm_l": "armLFore",
    "upperarm_r": "armRUpper", "forearm_r": "armRFore",
    "thigh_l": "thighL", "shank_l": "shankL", "foot_l": "footL",
    "thigh_r": "thighR", "shank_r": "shankR", "foot_r": "footR",
}
PIVOT = {
    "torso": "hip_c", "upperarm_l": "shoulder_l", "forearm_l": "elbow_l",
    "upperarm_r": "shoulder_r", "forearm_r": "elbow_r",
    "thigh_l": "hip_l", "shank_l": "knee_l", "foot_l": "ankle_l",
    "thigh_r": "hip_r", "shank_r": "knee_r", "foot_r": "ankle_r",
}


def pctx(x):
    return round((OX + x) / IMG_W * 100, 4)


def pcty(y):
    return round((OY + y) / IMG_H * 100, 4)


# ---------------------------------------------------------------- assets --
os.makedirs(ASSETS, exist_ok=True)
total = 0
for name in rig["sprites"]:
    src = Image.open(os.path.join(HERE, "sprites", f"{name}.png")).convert("RGBA")
    out = os.path.join(ASSETS, f"{CLASS[name]}.webp")
    src.save(out, "WEBP", lossless=True, quality=100, method=6)
    total += os.path.getsize(out)
    print(f"{CLASS[name]:11s} {src.width:3d}x{src.height:3d}  {os.path.getsize(out)//1024:4d} KB")

patch = Image.open(os.path.join(HERE, "eraser_patch.png")).convert("RGBA")
pa = np.array(patch)
ys, xs = np.where(pa[:, :, 3] > 1)
px0, py0, px1, py1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
patch = patch.crop((px0, py0, px1, py1))
patch.save(os.path.join(ASSETS, "erase.webp"), "WEBP", lossless=True, quality=100, method=6)
total += os.path.getsize(os.path.join(ASSETS, "erase.webp"))
print(f"{'erase':11s} {patch.width:3d}x{patch.height:3d}  {os.path.getsize(os.path.join(ASSETS,'erase.webp'))//1024:4d} KB")
print("total", total // 1024, "KB")

# ------------------------------------------------------------------- css --
frames = []
for i in range(STEPS + 1):
    p = (i % STEPS) / STEPS
    dx, dy = gait.root_offset(p)
    frames.append((gait.css_rotations(p, dx, dy), dx, dy))

L = []
w = L.append
w("""/* =========================================================================
   THE POSE-ANALYSIS FIGURE, WALKING
   -------------------------------------------------------------------------
   GENERATED FILE — edit scripts/hero-walk/, not this. Regenerate with
   `python scripts/hero-walk/09_emit.py`.

   The rightmost panel of the hero artwork holds an anatomical figure caught
   mid-stride. This walks it. The painted figure is covered by `erase.webp`,
   a patch that repaints only the pixels the body occupied and is
   transparent everywhere else, so the panel behind it — the gradient, the
   gold streams, the floor and its reflection — is the founder's artwork,
   untouched, with no rectangle seam. Over that patch the same figure is
   rebuilt out of eleven sprites cut from the original pixels and hung off
   each other at the joints, so rotating a layer rotates everything below it
   exactly as a limb does.

   WHY NOT A VIDEO. A transparent WebM has to be VP9 with alpha, and Safari
   decodes it without the alpha channel — a black box over the hero. The
   sprites are also the artwork's own pixels, so they stay as sharp as the
   picture at any width, and a fixed-size video would not.

   THE FIGURE WALKS ON THE SPOT, and that is deliberate. A loop that ends
   where it began cannot have travelled, so a figure that advances has to
   jump back, and a figure that slides back while its feet step forward is
   the moonwalk the brief rules out. What is here is the same motion a
   camera walking alongside would record. The floor is a mirror with nothing
   on it to measure against, so there is nothing to contradict it.

   REDUCED MOTION: every animation lives inside a
   `prefers-reduced-motion: no-preference` query. With motion reduced the
   layers keep their identity transforms, and since all eleven sprites were
   cut from one picture they re-assemble it exactly — the visitor sees the
   painted hero, unchanged.
   ========================================================================= */

.walk {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  /* Revealed by HeroWalk once every sprite has decoded, so the panel never
     shows an erased figure waiting for its limbs. */
  opacity: 0;
  transition: opacity 320ms ease;
}

.walk[data-ready="true"] {
  opacity: 1;
}

/* Each layer is the whole picture box, so every transform-origin below is
   in the artwork's own coordinates and nesting composes like a skeleton. */
.layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  will-change: transform;
}

.sprite {
  position: absolute;
  display: block;
  object-fit: contain;
  pointer-events: none;
}
""")

erase_box = (pctx(px0), pcty(py0), round((px1 - px0) / IMG_W * 100, 4), round((py1 - py0) / IMG_H * 100, 4))
w(f"""
/* The patch that takes the painted figure out. */
.erase {{
  position: absolute;
  left: {erase_box[0]}%;
  top: {erase_box[1]}%;
  width: {erase_box[2]}%;
  height: {erase_box[3]}%;
  object-fit: contain;
  pointer-events: none;
}}
""")

# sprite boxes, in the order they are painted
w("\n/* Sprite boxes, in artwork fractions. */")
for name in rig["order"]:
    m = rig["sprites"][name]
    w(f"""
.{CLASS[name]} {{
  left: {pctx(m['x'])}%;
  top: {pcty(m['y'])}%;
  width: {round(m['w'] / IMG_W * 100, 4)}%;
  height: {round(m['h'] / IMG_H * 100, 4)}%;
}}""")

w("\n\n/* Pivots. */")
for name in rig["sprites"]:
    jx, jy = J[PIVOT[name]]
    w(f"""
.{CLASS[name]}Layer {{
  transform-origin: {pctx(jx)}% {pcty(jy)}%;
}}""")

w(f"""

@media (prefers-reduced-motion: no-preference) {{
  .root {{
    animation: walkRoot {CYCLE} linear infinite;
  }}
  /* A long, shallow wander on top of the stride, so the loop as a whole
     comes round every {DRIFT} instead of every {CYCLE} and never settles
     into a visible repeat. */
  .drift {{
    animation: walkDrift {DRIFT} ease-in-out infinite;
  }}""")
for name in rig["sprites"]:
    w(f"""  .{CLASS[name]}Layer {{
    animation: walk{CLASS[name][0].upper() + CLASS[name][1:]} {CYCLE} linear infinite;
  }}""")
w("}")


def kf(name, fn):
    out = [f"\n@keyframes {name} {{"]
    prev = None
    for i in range(STEPS + 1):
        pct = round(i * 100 / STEPS, 3)
        val = fn(i)
        if val == prev and 0 < i < STEPS:
            continue
        prev = val
        out.append(f"  {pct:g}% {{ transform: {val}; }}")
    out.append("}")
    return "\n".join(out)


w(kf("walkRoot", lambda i: "translate(%.4f%%, %.4f%%)"
     % (frames[i][1] / IMG_W * 100, frames[i][2] / IMG_H * 100)))
w(kf("walkDrift", lambda i: "translate(%.4f%%, 0)"
     % (1.2 * math.sin(2 * math.pi * i / STEPS) / IMG_W * 100)))
for name in rig["sprites"]:
    cls = CLASS[name]
    w(kf("walk" + cls[0].upper() + cls[1:],
         lambda i, n=name: "rotate(%.3fdeg)" % frames[i][0][n]))

open(CSS, "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")
print("wrote", CSS, os.path.getsize(CSS) // 1024, "KB")

# the component needs the paint order and the class names
json.dump({"order": [CLASS[n] for n in rig["order"]]},
          open(os.path.join(HERE, "emit.json"), "w"), indent=1)
