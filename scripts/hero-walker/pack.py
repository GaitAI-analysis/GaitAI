# Pack walker frames into a tight WebP atlas + JSON, per theme and scale.
# python pack.py <framesDir> <theme> <outDir>
import sys, json, os
import numpy as np
from PIL import Image

d, theme, outdir = sys.argv[1:4]
os.makedirs(outdir, exist_ok=True)
meta = json.load(open(f"{d}/meta.json"))
frames = [Image.open(f"{d}/f{i:04d}.png").convert("RGBA") for i in range(len(meta["frames"]))]
boxes = []
for im in frames:
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 2)
    boxes.append((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))

# Gait events and phases, measured on the rendered body (gait.py).
from gait import analyse
J = [f["J"] for f in meta["frames"]]
gait, _ev = analyse(meta["frames"])
strikes = {"RightFoot": gait["ic"]["r"], "LeftFoot": gait["ic"]["l"]}
# Joints the page draws its analysis layer on, full-size frame px, per frame.
JOINTS = ["Head", "Neck", "Spine1", "Hips", "LeftArm", "RightArm", "LeftForeArm", "RightForeArm", "LeftHand", "RightHand",
          "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg", "LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase",
          "LeftHeel", "RightHeel", "LeftToeTip", "RightToeTip"]
joints = [[round(v, 1) for n in JOINTS for v in j[n]] for j in J]
out = {"theme": theme, "jointNames": JOINTS, "joints": joints, "gait": gait, "count": len(frames), "frameW": frames[0].width, "frameH": frames[0].height,
       "ppm": meta["ppm"], "stride": meta["stride"], "hipX": J[0]["Hips"][0], "floorY": meta["frames"][0]["floorY"],
       "bodyH": float(os.environ.get("BODY_H", "1.774")), "root": [round(f["root"], 5) for f in meta["frames"]], "strikes": strikes, "scales": {}}
for scale, tag in [(float(os.environ.get("HI", "0.66")), "hi"), (float(os.environ.get("LO", "0.42")), "lo")]:
    ims = []
    for im, (x0, y0, x1, y1) in zip(frames, boxes):
        c = im.crop((x0, y0, x1, y1))
        if scale != 1:
            c = c.resize((max(1, round(c.width * scale)), max(1, round(c.height * scale))), Image.LANCZOS)
        ims.append(c)
    MAXW = 3072 if scale > 0.6 else 2048
    x = y = rowh = 0; rects = []
    for c in ims:
        if x + c.width > MAXW:
            x = 0; y += rowh + 2; rowh = 0
        rects.append((x, y, c.width, c.height)); x += c.width + 2; rowh = max(rowh, c.height)
    atlas = Image.new("RGBA", (MAXW, y + rowh), (0, 0, 0, 0))
    for c, (rx, ry, _, _) in zip(ims, rects):
        atlas.paste(c, (rx, ry))
    # trim width
    used = max(r[0] + r[2] for r in rects)
    atlas = atlas.crop((0, 0, used, atlas.height))
    name = f"walk-{theme}-{tag}.webp"
    atlas.save(os.path.join(outdir, name), "WEBP", quality=76, alpha_quality=85, method=6)
    out["scales"][tag] = {"src": name, "scale": scale, "w": atlas.width, "h": atlas.height,
                          "frames": [[r[0], r[1], r[2], r[3], round(b[0] * scale, 2), round(b[1] * scale, 2)] for r, b in zip(rects, boxes)]}
    print(tag, atlas.size, os.path.getsize(os.path.join(outdir, name)) // 1024, "KB")
# The poster: the frame the page starts on (right heel strike), shown from the
# first paint until the walking canvas takes over, and under reduced motion.
S = strikes["RightFoot"]; x0, y0, x1, y1 = boxes[S]
poster = frames[S].crop((x0, y0, x1, y1))
pname = f"walk-{theme}-poster.webp"
poster.save(os.path.join(outdir, pname), "WEBP", quality=80, alpha_quality=90, method=6)
out["poster"] = {"src": pname, "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}
print("poster", poster.size, os.path.getsize(os.path.join(outdir, pname)) // 1024, "KB")
json.dump(out, open(os.path.join(outdir, f"walk-{theme}.json"), "w"))
print("strikes", strikes)
