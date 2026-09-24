# Forward kinematics for the rig, plus the one thing that makes a walk look
# like weight rather than a puppet show: the pelvis height is SOLVED, not
# dialled in. At every instant the body is dropped until the foot that is
# currently bearing weight rests on the floor line, so the stance leg
# supports the body and the vertical bob falls out of the geometry.
#
# The floor is a line, not a horizontal: the artwork's two shoes sit at
# different heights because one is further down the hall, so a level floor
# would plant one foot and float the other.
import json
import math
import os
import numpy as np
from importlib import import_module

HERE = os.path.dirname(os.path.abspath(__file__))
gait = import_module("06_gait")
rig = json.load(open(os.path.join(HERE, "rig.json")))
J = rig["joints"]

# Shoe contact points measured off the sprites, and the floor through the
# two that carry weight in the painted pose.
CONTACT = {
    "l": [(244.0, 479.0), (296.0, 475.0)],
    "r": [(69.0, 476.0), (111.0, 506.0)],
}
FLOOR_X0, FLOOR_Y0 = 111.0, 506.0
FLOOR_SLOPE = (479.0 - 506.0) / (244.0 - 111.0)


def floor_y(x):
    return FLOOR_Y0 + FLOOR_SLOPE * (x - FLOOR_X0)


def M_rot(cx, cy, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, cx - c * cx + s * cy],
                     [s, c, cy - s * cx - c * cy],
                     [0, 0, 1]])


def M_tr(dx, dy):
    return np.array([[1, 0, dx], [0, 1, dy], [0, 0, 1]], float)


def _window(p, start, end, ramp):
    """Periodic smooth window on [0,1), 1 inside [start,end]."""
    p = p % 1.0
    best = 0.0
    for shift in (-1.0, 0.0, 1.0):
        q = p + shift
        if q < start - ramp or q > end + ramp:
            continue
        if q < start:
            t = (q - (start - ramp)) / ramp
        elif q > end:
            t = ((end + ramp) - q) / ramp
        else:
            t = 1.0
        t = min(max(t, 0.0), 1.0)
        best = max(best, t * t * (3 - 2 * t))
    return best


def stance(p, side):
    # The foot is on the ground for the first ~62% of its own cycle.
    return _window(p + (0.0 if side == "l" else 0.5), 0.0, 0.62, 0.07)


def limb_matrices(p, dx=0.0, dy=0.0):
    r = gait.css_rotations(p)
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
    return M, r


def root_offset(p):
    """Solve the pelvis translation for this instant."""
    M, _ = limb_matrices(p)
    # Drop the body until the LOWEST weight-bearing contact rests on the
    # floor. A max, not an average: an average lets the other foot sink
    # through the floor during double support.
    worst = None
    for side in ("l", "r"):
        w = stance(p, side)
        if w <= 0.02:
            continue
        pen = -1e9
        for cx, cy in CONTACT[side]:
            q = M[f"foot_{side}"] @ np.array([cx, cy, 1.0])
            pen = max(pen, q[1] - floor_y(q[0]))
        # Ease a foot's claim in and out with its stance weight, so the
        # hand-over at double support is a blend and not a step.
        pen = pen * w + (-1e6) * 0.0
        worst = pen if worst is None else max(worst, pen)
    dy = -worst if worst is not None else 0.0
    # A whisper of fore-aft surge, in step with the cycle. Not travel: a
    # loop that ends where it began cannot travel, and a figure that drifts
    # and snaps back is worse than one that walks on the spot.
    dx = 1.0 * math.sin(2 * math.pi * (p % 1.0))
    return dx, dy


def pose(p):
    dx, dy = root_offset(p)
    M, r = limb_matrices(p, dx, dy)
    return M, r, (dx, dy)


if __name__ == "__main__":
    for i in range(0, 44, 4):
        p = i / 44
        dx, dy = root_offset(p)
        print("p=%.3f  dx=%+.2f dy=%+.2f  stance L=%.2f R=%.2f"
              % (p, dx, dy, stance(p, "l"), stance(p, "r")))
