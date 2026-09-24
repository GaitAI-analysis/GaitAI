# Render the rig with the same maths the CSS will use, over the reconstructed
# background, so the motion can be judged before any of it reaches the site.
import json, math, os, subprocess, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from importlib import import_module
gait = import_module("06_gait")

HERE = os.path.dirname(os.path.abspath(__file__))
rig = json.load(open(os.path.join(HERE, "rig.json")))
J = rig["joints"]
W, H = rig["crop"]

bg = Image.open(os.path.join(HERE, "erased_rgb.png")).convert("RGBA")
sprites = {}
for name, m in rig["sprites"].items():
    im = Image.open(os.path.join(HERE, "sprites", f"{name}.png")).convert("RGBA")
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(im, (m["x"], m["y"]))
    sprites[name] = layer

# Back to front. The camera is behind the figure's left, so the left limbs
# are the near ones; within a leg the shank goes down first, then the thigh
# over its knee cap, then the shoe over the ankle.
ORDER = json.load(open(os.path.join(HERE, "rig.json")))["order"]


def M_rot(cx, cy, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    # y-down space: this is a clockwise-on-screen rotation about (cx, cy).
    return np.array([[c, -s, cx - c * cx + s * cy],
                     [s, c, cy - s * cx - c * cy],
                     [0, 0, 1]])


def M_tr(dx, dy):
    return np.array([[1, 0, dx], [0, 1, dy], [0, 0, 1]], float)


def frame(p):
    dx, dy = gait.root_offset(p)
    r = gait.css_rotations(p, dx, dy)
    root = M_tr(dx, dy)
    torso = root @ M_rot(*J["hip_c"], r["torso"])
    M = {"torso": torso}
    for side in ("l", "r"):
        th = root @ M_rot(*J[f"hip_{side}"], r[f"thigh_{side}"])
        sh = th @ M_rot(*J[f"knee_{side}"], r[f"shank_{side}"])
        ft = sh @ M_rot(*J[f"ankle_{side}"], r[f"foot_{side}"])
        M[f"thigh_{side}"], M[f"shank_{side}"], M[f"foot_{side}"] = th, sh, ft
        ua = torso @ M_rot(*J[f"shoulder_{side}"], r[f"upperarm_{side}"])
        fa = ua @ M_rot(*J[f"elbow_{side}"], r[f"forearm_{side}"])
        M[f"upperarm_{side}"], M[f"forearm_{side}"] = ua, fa

    out = bg.copy()
    for name in ORDER:
        inv = np.linalg.inv(M[name])
        co = (inv[0, 0], inv[0, 1], inv[0, 2], inv[1, 0], inv[1, 1], inv[1, 2])
        warped = sprites[name].transform((W, H), Image.AFFINE, co, resample=Image.BICUBIC)
        out.alpha_composite(warped)
    return out.convert("RGB")


N = int(sys.argv[1]) if len(sys.argv) > 1 else 44
OUT = os.path.join(HERE, "frames")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
for i in range(N):
    frame(i / N).resize((W * 2, H * 2), Image.LANCZOS).save(os.path.join(OUT, "f%03d.png" % i))
print("frames", N)

mp4 = os.path.join(HERE, "preview.mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(round(N / 1.45)),
                "-stream_loop", "2", "-i", os.path.join(OUT, "f%03d.png"),
                "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", mp4], check=True)
print("wrote", mp4)
