# Cut the matted figure into rigid limb sprites and describe the rig.
#
# Shapes, not straight cuts. Each limb is a CAPSULE around its bone — a
# rounded band — so a bent joint leaves a rounded end, which is what a knee
# or an elbow looks like, instead of the hard diagonal that makes a 2D puppet
# read as paper.
#
# Each limb also carries a big PROXIMAL DISC centred on its own pivot. The
# disc is deliberately larger than it needs to be and is drawn UNDER the
# piece above it: the thigh reaches well up into the pelvis but the torso is
# composited last and hides it, so however far the hip swings there is always
# opaque thigh under the torso's edge and never a gap. A disc centred on the
# pivot is also invariant under that pivot's rotation, so it cannot introduce
# an edge of its own.
#
# Every sprite is cut from the same pixels, so at rest the rig re-assembles
# the painted figure exactly.
import json
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BOX = (1140, 320, 1500, 900)  # the crop inside the 1672x941 artwork

J = {
    "shoulder_l": (166.2, 125.9), "shoulder_r": (214.1, 124.2),
    "elbow_l": (129.8, 196.4), "elbow_r": (229.7, 200.1),
    "wrist_l": (112.0, 264.2), "wrist_r": (269.2, 262.9),
    "hand_l": (105.0, 292.0), "hand_r": (276.0, 291.0),
    "hip_l": (167.8, 263.9), "hip_r": (187.3, 262.5),
    "knee_l": (219.5, 358.5), "knee_r": (151.6, 368.8),
    "ankle_l": (257.7, 463.5), "ankle_r": (84.5, 461.5),
    "toe_l": (302.6, 468.0), "toe_r": (108.2, 500.6),
    "head": (197.0, 46.0),
}
J["hip_c"] = ((J["hip_l"][0] + J["hip_r"][0]) / 2, (J["hip_l"][1] + J["hip_r"][1]) / 2)
J["sh_c"] = ((J["shoulder_l"][0] + J["shoulder_r"][0]) / 2, (J["shoulder_l"][1] + J["shoulder_r"][1]) / 2)

# caps: capsules (a, b, r).  discs: (joint, r).  cut: keep clear of these bones.
BONES = {
    "torso": dict(
        caps=[("hip_c", "sh_c", 44), ("sh_c", "head", 34)],
        discs=[("hip_c", 60)],
        cut=[("elbow_l", "wrist_l"), ("wrist_l", "hand_l"),
             ("elbow_r", "wrist_r"), ("wrist_r", "hand_r")], cut_r=14),
    "upperarm_l": dict(caps=[("shoulder_l", "elbow_l", 17)], discs=[("shoulder_l", 20)],
                       fade=("shoulder_l", 4, 20), rival="arm_r"),
    "forearm_l": dict(caps=[("elbow_l", "wrist_l", 15), ("wrist_l", "hand_l", 15)],
                      discs=[("elbow_l", 16)], fade=("elbow_l", 3, 13), rival="arm_r"),
    "upperarm_r": dict(caps=[("shoulder_r", "elbow_r", 17)], discs=[("shoulder_r", 20)],
                       fade=("shoulder_r", 4, 20), rival="arm_l"),
    "forearm_r": dict(caps=[("elbow_r", "wrist_r", 15), ("wrist_r", "hand_r", 15)],
                      discs=[("elbow_r", 16)], fade=("elbow_r", 3, 13), rival="arm_l"),
    "thigh_l": dict(caps=[("hip_l", "knee_l", 34)], discs=[("hip_l", 50)],
                    fade=("hip_l", 5, 34), rival="leg_r"),
    "shank_l": dict(caps=[("knee_l", "ankle_l", 24)], discs=[("knee_l", 28)],
                    fade=("knee_l", 4, 24), rival="leg_r"),
    "foot_l": dict(caps=[("ankle_l", "toe_l", 21)], discs=[("ankle_l", 21), ("toe_l", 18)],
                   fade=("ankle_l", 3, 16), rival="leg_r"),
    "thigh_r": dict(caps=[("hip_r", "knee_r", 34)], discs=[("hip_r", 50)],
                    fade=("hip_r", 5, 34), rival="leg_l"),
    "shank_r": dict(caps=[("knee_r", "ankle_r", 24)], discs=[("knee_r", 28)],
                    fade=("knee_r", 4, 24), rival="leg_l"),
    "foot_r": dict(caps=[("ankle_r", "toe_r", 21)], discs=[("ankle_r", 21), ("toe_r", 18)],
                   fade=("ankle_r", 3, 16), rival="leg_l"),
}

# A limb yields to the limb on the other side where that one is plainly
# nearer, so a wide capsule never carries a slice of its opposite number.
RIVALS = {
    "leg_l": [("hip_l", "knee_l"), ("knee_l", "ankle_l"), ("ankle_l", "toe_l")],
    "leg_r": [("hip_r", "knee_r"), ("knee_r", "ankle_r"), ("ankle_r", "toe_r")],
    "arm_l": [("shoulder_l", "elbow_l"), ("elbow_l", "wrist_l"), ("wrist_l", "hand_l")],
    "arm_r": [("shoulder_r", "elbow_r"), ("elbow_r", "wrist_r"), ("wrist_r", "hand_r")],
}

# Back to front. The far (right) side first; within a limb the distal piece
# goes down first so the piece above hides its proximal disc; the torso goes
# last, over the pelvis and both shoulders.
ORDER = ["foot_r", "shank_r", "thigh_r", "foot_l", "shank_l", "thigh_l",
         "forearm_r", "upperarm_r", "forearm_l", "upperarm_l", "torso"]
FEATHER = 4.5


def seg_dist(px, py, a, b):
    ax, ay = a
    bx, by = b
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy
    t = np.clip(((px - ax) * vx + (py - ay) * vy) / L2, 0, 1)
    return np.hypot(px - (ax + t * vx), py - (ay + t * vy))


img = Image.open(os.path.join(HERE, "figure_raw.png")).convert("RGBA")
rgba = np.array(img)
H, W = rgba.shape[:2]
alpha = rgba[:, :, 3].astype(np.float64)
body = alpha > 4
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)

inside = {}
for name, spec in BONES.items():
    s = np.full((H, W), -1e9)
    for a, b, r in spec["caps"]:
        s = np.maximum(s, r - seg_dist(xx, yy, J[a], J[b]))
    for j, r in spec.get("discs", []):
        s = np.maximum(s, r - np.hypot(xx - J[j][0], yy - J[j][1]))
    for a, b in spec.get("cut", []):
        s = np.minimum(s, seg_dist(xx, yy, J[a], J[b]) - spec["cut_r"])
    inside[name] = s

stack = np.stack([inside[n] for n in BONES])
best = np.argmax(stack, axis=0)
uncovered = body & (stack.max(axis=0) < 0)
print("pixels outside every shape:", int(uncovered.sum()))

os.makedirs(os.path.join(HERE, "sprites"), exist_ok=True)
meta = {}
own_dist = {}
for name, spec in BONES.items():
    d = np.full((H, W), 1e9)
    for a, b, r in spec["caps"]:
        d = np.minimum(d, seg_dist(xx, yy, J[a], J[b]))
    own_dist[name] = d

rival_dist = {}
for key, segs in RIVALS.items():
    d = np.full((H, W), 1e9)
    for a, b in segs:
        d = np.minimum(d, seg_dist(xx, yy, J[a], J[b]))
    rival_dist[key] = d

for i, name in enumerate(BONES):
    spec = BONES[name]
    w = np.clip(inside[name] / FEATHER + 0.5, 0, 1)
    w = np.where(uncovered & (best == i), 1.0, w)
    if "rival" in spec:
        w = w * np.clip((rival_dist[spec["rival"]] - own_dist[name]) / 3.0 + 0.5, 0, 1)
    if "fade" in spec:
        # Fade toward the pivot. Those pixels sit under the piece above, so
        # the fade is invisible at rest; it means that when the joint turns,
        # nothing solid swings out past the body's painted outline.
        j, r0, r1 = spec["fade"]
        d = np.hypot(xx - J[j][0], yy - J[j][1])
        t = np.clip((d - r0) / (r1 - r0), 0, 1)
        w = w * (t * t * (3 - 2 * t))
    a = alpha * w
    keep = a > 1.2
    out = np.dstack([rgba[:, :, :3], np.clip(a, 0, 255).astype(np.uint8)])
    ys, xs = np.where(keep)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
    Image.fromarray(out[y0:y1, x0:x1], "RGBA").save(os.path.join(HERE, "sprites", f"{name}.png"))
    meta[name] = {"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0}
    print(f"{name:11s} bbox {x0:4d},{y0:4d} {x1-x0:3d}x{y1-y0:3d}")

json.dump({"box": BOX, "crop": [W, H], "joints": J, "sprites": meta, "order": ORDER},
          open(os.path.join(HERE, "rig.json"), "w"), indent=1)
