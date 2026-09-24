# The gait model, shared by the preview renderer and the CSS generator.
#
# THE LEGS ARE SOLVED, NOT DIALLED IN.
# An earlier version drove hip, knee and ankle straight from normative angle
# curves. It walks, but it cannot stand: prescribing three angles per leg
# over-determines the geometry, so at double support the two feet land at
# different heights and the body has to jump between them. Here the FOOT
# leads instead. Each foot follows a path — planted on the floor and
# travelling backwards through stance, lifted and carried forward through
# swing — and the hip and knee are whatever is needed to reach it. Ground
# contact is then exact by construction, and the knee bend and the rise and
# fall of the pelvis fall out of the geometry instead of being animated by
# hand.
#
# The arms and the trunk keep the normative-curve treatment: nothing
# constrains them, and a counter-swing is all they need.
#
# The floor is a line, not a horizontal — the hall recedes, so the two shoes
# in the artwork rest at different heights.
import json
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
_rig = json.load(open(os.path.join(HERE, "rig.json")))
J = _rig["joints"]

# A level contact plane, at the height the painted soles rest on: the two
# shoes touch down at y=509 and y=495, so the hall does recede, but only
# by 14px across a whole step. A receding floor also means the near leg
# should project longer than the far one, and a flat rig has one pair of
# bone lengths — so tilting it makes the two legs disagree about where the
# pelvis belongs, and the body crouches to satisfy the lower foot. Level,
# at the average of the two, costs at most 7px against a reflection that
# is a soft glow, and keeps both legs honest.
FLOOR_Y0 = 502.0
FLOOR_LEAN = 90.0


def floor_y(x):
    return FLOOR_Y0


def _len(a, b):
    return math.hypot(J[a][0] - J[b][0], J[a][1] - J[b][1])


# Both legs are solved at the SAME length, the average of the two measured
# off the artwork. The painted right leg is 7px longer than the left — a
# quirk of the illustration — and letting that stand makes the body sit
# lower on every second step, which reads as a limp.
_T = sum(_len(f"hip_{s}", f"knee_{s}") for s in "lr") / 2
_S = sum(_len(f"knee_{s}", f"ankle_{s}") for s in "lr") / 2
SEG = {s: (_T, _S) for s in "lr"}

STANCE_END = 0.62
# The foot stops carrying weight a little before it leaves the floor.
WEIGHT_END = 0.55
# Half the fore-aft travel of an ankle, in artwork pixels. The painted pose
# is about 96; a little less than that is a calmer step and keeps every
# sprite closer to the rotation it was cut at.
A = 74.0

# Ankle height above the floor, per cent of cycle: flat through mid-stance,
# rising as the heel comes up, clearing through swing, down again to land.
ANKH = [(0, 36), (6, 34), (40, 34), (50, 38), (58, 48), (62, 54), (70, 62),
        (78, 60), (86, 50), (94, 40), (100, 36)]
# Ankle fore-aft offset from its hip, as a fraction of A.
ANKX = [(0, 1.0), (STANCE_END * 100, -1.0), (72, -0.45), (82, 0.3),
        (92, 0.85), (100, 1.0)]
# The shoe's own angle, as a rotation away from the floor line: it lands
# toe-a-little-down, lies flat, rolls onto the toe to push off, recovers.
FOOT = [(0, -8), (6, 0), (45, 0), (50, -9), (58, -40), (62, -55),
        (72, -30), (82, -6), (90, 3), (96, -2), (100, -8)]


def curve(table, p):
    """p in [0,1); piecewise-linear through the table, wrapping at 100%."""
    x = (p % 1.0) * 100.0
    for i in range(len(table) - 1):
        x0, y0 = table[i]
        x1, y1 = table[i + 1]
        if x0 <= x <= x1:
            t = 0 if x1 == x0 else (x - x0) / (x1 - x0)
            return y0 + t * (y1 - y0)
    return table[-1][1]


def shoulder(p):
    return -14.0 * math.cos(2 * math.pi * (p % 1.0))


def elbow(p):
    return 18.0 - 9.0 * math.cos(2 * math.pi * (p % 1.0))


PHASE = {"l": 0.0, "r": 0.5}
# The painted pose, measured off the artwork's own landmarks. lambda is a
# bone's forward lean from straight down, with the far end toward +x.
SRC = {
    "l": {"t": 28.66, "k": 8.66, "lf": 84.30, "ua": -27.30, "el": 12.60},
    "r": {"t": -18.56, "k": 17.34, "lf": 31.20, "ua": 11.60, "el": 20.60},
}


def _offset(fn, key):
    """Shift a curve so its two anchor values average the painted pose's."""
    src_mean = (SRC["l"][key] + SRC["r"][key]) / 2
    cur_mean = (fn(PHASE["l"]) + fn(PHASE["r"])) / 2
    return src_mean - cur_mean


C_SH = _offset(shoulder, "ua")
C_EL = _offset(elbow, "el")


def ankle_target(p, side, dx):
    """Where this foot's ankle must be, in artwork coordinates."""
    ph = p + PHASE[side]
    hx = J[f"hip_{side}"][0] + dx
    x = hx + A * curve(ANKX, ph)
    return x, floor_y(x) - curve(ANKH, ph)


SLACK = 1.5


def stance_weight(p, side):
    """How much of the body's weight this foot is carrying."""
    ph = (p + PHASE[side]) % 1.0
    ramp = 0.07
    if ph <= WEIGHT_END:
        t = min(1.0, (WEIGHT_END + ramp - ph) / ramp, (ph + ramp) / ramp)
    elif ph > 1.0 - ramp:
        t = (ph - (1.0 - ramp)) / ramp
    else:
        return 0.0
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def root_offset(p):
    """
    Fore-aft surge, and the pelvis height that keeps every weight-bearing
    leg within reach. The body sits as high as the most stretched stance
    leg allows, which is what produces the rise and fall of a real walk.
    """
    dx = 1.0 * math.sin(2 * math.pi * (p % 1.0))
    dy = None
    for side in ("l", "r"):
        if stance_weight(p, side) <= 0.02:
            continue
        Lt, Ls = SEG[side]
        ax, ay = ankle_target(p, side, dx)
        hx = J[f"hip_{side}"][0] + dx
        span = abs(hx - ax)
        drop = math.sqrt(max((Lt + Ls) ** 2 - span * span, 1.0))
        want = ay - drop - J[f"hip_{side}"][1]
        # The body can be no higher than the most stretched planted leg
        # allows, so the binding leg wins. SLACK then lets it down a few
        # pixels, which is the slight bend a stance leg always keeps.
        dy = want if dy is None else max(dy, want)
    return dx, (dy + SLACK if dy is not None else 0.0)


def leg_angles(p, side, dx, dy):
    """Two-link IK: hip and knee that put this ankle on its path."""
    Lt, Ls = SEG[side]
    hx = J[f"hip_{side}"][0] + dx
    hy = J[f"hip_{side}"][1] + dy
    ax, ay = ankle_target(p, side, dx)
    vx, vy = ax - hx, ay - hy
    d = math.hypot(vx, vy)
    d = min(max(d, abs(Lt - Ls) + 2.0), Lt + Ls - 0.6)
    lam_line = math.degrees(math.atan2(vx, vy))
    cos_a = (Lt * Lt + d * d - Ls * Ls) / (2 * Lt * d)
    alpha = math.degrees(math.acos(min(max(cos_a, -1.0), 1.0)))
    # The knee leads forward, toward +x.
    lam_thigh = lam_line + alpha
    kx = hx + Lt * math.sin(math.radians(lam_thigh))
    ky = hy + Lt * math.cos(math.radians(lam_thigh))
    lam_shank = math.degrees(math.atan2(ax - kx, ay - ky))
    return lam_thigh, lam_shank


def torso_deg(p):
    return 1.15 * math.sin(2 * math.pi * (p % 1.0))


def limb_angles(p, side, dx, dy):
    ph = p + PHASE[side]
    lt, ls = leg_angles(p, side, dx, dy)
    lf = FLOOR_LEAN + curve(FOOT, ph)
    lua = shoulder(ph) + C_SH
    lfa = lua + (elbow(ph) + C_EL)
    return {"t": lt, "s": ls, "f": lf, "ua": lua, "fa": lfa}


def src_angles(side):
    s = SRC[side]
    lt = s["t"]
    return {"t": lt, "s": lt - s["k"], "f": s["lf"], "ua": s["ua"],
            "fa": s["ua"] + s["el"]}


def css_rotations(p, dx=None, dy=None):
    """
    Per-layer CSS rotations in degrees, each relative to its parent layer.
    A positive CSS rotation is clockwise on screen, which swings a
    downward-pointing bone's far end toward -x, so it is the negative of a
    change in forward lean.
    """
    if dx is None:
        dx, dy = root_offset(p)
    out = {"torso": torso_deg(p)}
    tor = out["torso"]
    for side in ("l", "r"):
        tgt = limb_angles(p, side, dx, dy)
        src = src_angles(side)
        d = {k: tgt[k] - src[k] for k in tgt}
        out[f"thigh_{side}"] = -d["t"]
        out[f"shank_{side}"] = -(d["s"] - d["t"])
        out[f"foot_{side}"] = -(d["f"] - d["s"])
        out[f"upperarm_{side}"] = -d["ua"] - tor
        out[f"forearm_{side}"] = -(d["fa"] - d["ua"])
    return out


if __name__ == "__main__":
    print("floor lean %.1f  seg %s" % (FLOOR_LEAN, SEG))
    for i in range(0, 44, 4):
        p = i / 44
        dx, dy = root_offset(p)
        r = css_rotations(p, dx, dy)
        print("p=%.3f dx=%+5.1f dy=%+6.2f  thighL=%+6.1f shankL=%+6.1f footL=%+6.1f"
              % (p, dx, dy, r["thigh_l"], r["shank_l"], r["foot_l"]))
