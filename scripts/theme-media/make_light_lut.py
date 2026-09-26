#!/usr/bin/env python
"""
GaitAI THEME MEDIA — dark → light colour transform
=============================================================================
Every light-theme video and image companion on the site is the ORIGINAL dark
render pushed through one deterministic per-pixel colour transform. Nothing
is re-generated: the frames, the timing, the composition, the people and the
overlays are the dark asset's own pixels, re-inked for the light visual
system. That is what makes the two files two renderings of the same thing.

The transform works in OKLab so lightness can be remapped while hue stays put:

  ground   the render's near-black (OKLab L ≈ 0.09–0.12, per video) becomes
           the icy off-white the light theme uses for paper (#f4f7fb-ish);
  type     white typography and hot line cores become deep navy;
  signals  saturated cyan / royal / violet that is also BRIGHT (a drawn line,
           a glow core, a chart) is deepened, never inverted — the same hue,
           a shade richer, so it reads on paper;
  bloom    dim bluish haze around the glows is treated as ground and its
           chroma is calmed, so a glow becomes a restrained pale halo rather
           than blue smog;
  gold     the amber/champagne accents keep their hue and are simply deepened
           like every other signal.

Photographic people are NOT pushed through this. For the two console films the
person is masked out (scripts/theme-media/segment_person.mjs) and composited
back untouched by render_light.py. The SecureVision hero's crowd cannot be
masked reliably, which is why that film stays a dark island in both themes.

  python scripts/theme-media/make_light_lut.py cube out.cube  '{"black_toe":0.10}'
  python scripts/theme-media/make_light_lut.py img  in.png out.png '{...}'
  python scripts/theme-media/make_light_lut.py ground        # prints the CSS ground colour

Parameters are documented in DEFAULTS; per-asset overrides live in jobs.json.
=============================================================================
"""
import json
import sys

import numpy as np

# ---------- colour maths ----------------------------------------------------


def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


M1 = np.array(
    [
        [0.4122214708, 0.5363325363, 0.0514459929],
        [0.2119034982, 0.6806995451, 0.1073969566],
        [0.0883024619, 0.2817188376, 0.6299787005],
    ]
)
M2 = np.array(
    [
        [0.2104542553, 0.7936177850, -0.0040720468],
        [1.9779984951, -2.4285922050, 0.4505937099],
        [0.0259040371, 0.7827717662, -0.8086757660],
    ]
)
M1_INV = np.linalg.inv(M1)
M2_INV = np.linalg.inv(M2)


def linear_to_oklab(rgb):
    return np.cbrt(rgb @ M1.T) @ M2.T


def oklab_to_linear(lab):
    return ((lab @ M2_INV.T) ** 3) @ M1_INV.T


def smoothstep(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


# ---------- the transform ---------------------------------------------------

DEFAULTS = dict(
    # Neutral lightness: what the ground and the type become.
    ground_L=0.965,  # the render's black -> icy off-white
    ink_L=0.24,  # the render's white -> deep navy
    black_toe=0.10,  # OKLab L of the render's ground; everything at or below it IS the ground
    # Tint of the neutrals (OKLab a, b) at the ground end and at the ink end.
    ground_ab=(-0.0035, -0.0110),  # icy blue
    ink_ab=(-0.0040, -0.0300),  # navy
    # Signals: saturated AND bright pixels keep their hue and are deepened.
    sat_lo=0.035,
    sat_hi=0.11,  # chroma band that counts as "a colour"
    sig_L_lo=0.30,
    sig_L_hi=0.65,  # …and it has to be bright: bloom is not a signal
    sig_base=0.34,
    sig_slope=0.26,  # L' = base + slope * L for a full signal
    sig_chroma=1.06,  # a shade richer
    # Everything that is not a signal: haze near the ground loses chroma,
    # mid-lightness leftovers keep most of theirs.
    haze_chroma=0.35,
    mid_chroma=0.80,
)


def transform(rgb_srgb, p):
    """(...,3) sRGB floats in 0..1  ->  (...,3) sRGB floats in 0..1."""
    lab = linear_to_oklab(srgb_to_linear(rgb_srgb))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)

    # Neutral branch: invert lightness above the ground toe.
    Lt = np.clip((L - p["black_toe"]) / (1 - p["black_toe"]), 0, 1)
    L_neutral = p["ground_L"] - (p["ground_L"] - p["ink_L"]) * Lt
    tn = (p["ground_L"] - L_neutral) / (p["ground_L"] - p["ink_L"])
    tint_a = lerp(p["ground_ab"][0], p["ink_ab"][0], tn)
    tint_b = lerp(p["ground_ab"][1], p["ink_ab"][1], tn)

    # Signal branch: deepen, keep hue.
    sat = smoothstep(C, p["sat_lo"], p["sat_hi"]) * smoothstep(L, p["sig_L_lo"], p["sig_L_hi"])
    L_signal = p["sig_base"] + p["sig_slope"] * L
    L_out = lerp(L_neutral, L_signal, sat)

    haze = 1 - smoothstep(L, p["black_toe"], p["black_toe"] + 0.25)
    C_scale = lerp(p["mid_chroma"], p["haze_chroma"], haze) * (1 - sat) + sat
    C_scale = C_scale * lerp(1.0, p["sig_chroma"], sat)
    a_out = a * C_scale + tint_a * (1 - sat)
    b_out = b * C_scale + tint_b * (1 - sat)

    out = np.stack([L_out, a_out, b_out], axis=-1)
    lin = oklab_to_linear(out)
    # Gamut: pull chroma in until the colour is representable.
    for _ in range(6):
        bad = (lin.min(-1) < -0.002) | (lin.max(-1) > 1.002)
        if not bad.any():
            break
        out[bad, 1:] *= 0.85
        lin = oklab_to_linear(out)
    return linear_to_srgb(np.clip(lin, 0, 1))


# ---------- outputs ---------------------------------------------------------


def write_cube(path, p, size=65):
    g = np.linspace(0, 1, size)
    B, G, R = np.meshgrid(g, g, g, indexing="ij")  # .cube: R fastest
    rgb = np.stack([R, G, B], axis=-1).reshape(-1, 3)
    out = transform(rgb, p)
    with open(path, "w") as f:
        f.write('TITLE "GaitAI dark to light"\n')
        f.write("LUT_3D_SIZE %d\n" % size)
        f.write("DOMAIN_MIN 0.0 0.0 0.0\nDOMAIN_MAX 1.0 1.0 1.0\n")
        f.write("\n".join("%.6f %.6f %.6f" % tuple(row) for row in out))
        f.write("\n")


def apply_to_image(src, dst, p, quality=90):
    from PIL import Image

    im = Image.open(src)
    alpha = im.getchannel("A") if im.mode in ("RGBA", "LA") else None
    rgb = np.asarray(im.convert("RGB")).astype(np.float64) / 255.0
    out = Image.fromarray((transform(rgb, p) * 255 + 0.5).astype(np.uint8))
    if alpha is not None:
        out.putalpha(alpha)
    save = {"quality": quality}
    if dst.lower().endswith(".webp"):
        save["method"] = 6
    out.save(dst, **save)


def ground_hex(p):
    rgb = transform(np.array([[0.0, 0.0, 0.0]]), p)[0]
    return "#%02x%02x%02x" % tuple(int(round(v * 255)) for v in rgb)


def params(overrides_json=None):
    p = dict(DEFAULTS)
    if overrides_json:
        p.update(json.loads(overrides_json))
    return p


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "cube":
        p = params(sys.argv[3] if len(sys.argv) > 3 else None)
        write_cube(sys.argv[2], p)
    elif cmd == "img":
        p = params(sys.argv[4] if len(sys.argv) > 4 else None)
        apply_to_image(sys.argv[2], sys.argv[3], p)
    elif cmd == "ground":
        print(ground_hex(params(sys.argv[2] if len(sys.argv) > 2 else None)))
    else:
        raise SystemExit(__doc__)
