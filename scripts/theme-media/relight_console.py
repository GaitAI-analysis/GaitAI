#!/usr/bin/env python
"""
GaitAI THEME MEDIA — layer-aware light master for the console films
=============================================================================
The two homepage console films (platform/mobilitycare-intelligence.mp4 and
platform/securevision-intelligence.mp4) are flattened renders: a photographic
walker, a rendered environment, a cyan tracking overlay and translucent HUD
panels, all baked into one MP4 with no source layers in the repository. A
single global colour transform cannot produce a credible light edition of
that — it inverts the person and flattens the hierarchy. This pipeline
instead treats every frame as a set of visual regions and gives each its own
light-theme treatment, with static region masks and one deterministic mapping
for the whole sequence (no per-frame exposure, so nothing flickers):

  HUMAN SUBJECT   per-frame pose-model mask (segment_person.mjs). The person
                  keeps their own pixels and is RE-LIT, not recoloured: a
                  shadow lift and midtone raise so they read as photographed
                  in a bright room, the scene's cyan cast pulled back toward
                  neutral, skin kept warm. A soft contact shadow is laid on
                  the floor beneath the feet.
  ENVIRONMENT     replaced tonally, not inverted: a designed pearl → cool-grey
                  gradient (light above, a slightly deeper polished floor
                  below) carries the environment's own high-frequency detail
                  back on top at reduced strength, so the room's structure
                  survives with depth and nothing blows out. The original
                  floor light becomes a soft cyan reflection.
  UI PANELS       static rounded rectangles (measured from the film). Their
                  translucent dark fill becomes a light-native pearl fill with
                  a cool hairline border and a soft blue-grey drop shadow, so
                  panels sit ABOVE the environment instead of vanishing into it.
  TEXT            white → deep navy, grey → slate, by inverse lightness with
                  high contrast; dividers → pale blue-grey.
  SIGNALS         cyan / blue / violet / gold keep their hue and gain depth:
                  brighter core → deeper, more saturated line; the dark film's
                  bloom becomes a tight, faint halo rather than neon haze.
  GLOW            emitted light becomes reflection: bloom chroma is calmed and
                  its lightness lifted toward the surface it sits on.

Everything is computed in OKLab so hue never drifts. The output has the same
frames, frame rate, duration and dimensions as the dark film; the encode step
lives in render_light.py (--pipeline console).

    python scripts/theme-media/relight_console.py frame.png out.png --video mobilitycare-intelligence --mask mask.png
=============================================================================
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from make_light_lut import linear_to_oklab, oklab_to_linear, srgb_to_linear, linear_to_srgb, smoothstep, lerp  # noqa: E402

# ── Region geometry per film: panel rectangles (x0, y0, x1, y1) and corner radius.
CONFIG_PATH = HERE / "console_layers.json"


def load_config(video: str) -> dict:
    cfg = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    return cfg[video]


# ── Light palette (OKLab) ─────────────────────────────────────────────────────
PEARL_TOP = (0.975, -0.003, -0.009)     # ~#f6f8fc
PEARL_MID = (0.945, -0.004, -0.013)     # ~#e9eef7
FLOOR = (0.885, -0.006, -0.020)         # ~#d5dde9  polished cool floor
PANEL_FILL = (0.985, -0.002, -0.006)    # ~#fbfcfe
PANEL_BORDER = (0.80, -0.010, -0.030)   # cool hairline
DIVIDER = (0.86, -0.006, -0.020)
INK = (0.22, -0.004, -0.032)            # navy text
SLATE = (0.48, -0.006, -0.028)          # secondary text

# ── The grade ─────────────────────────────────────────────────────────────────
# Every tonal decision below is a named number. The defaults are the first
# (2026-09-14) edition, which read as washed out on the page: a near-white room
# with no structure, a hairline panel that vanished into it, thin pale signals
# and a walker with a grey aura. A film overrides them under "grade" in
# console_layers.json; the shipped consoles use the deeper values there.
DEFAULT_GRADE = {
    "env_top": 0.975, "env_mid": 0.945, "env_floor": 0.885,   # OKLab L of the room's gradient
    "env_detail": 0.15, "env_detail_clip": 0.06,             # the room's own fine texture
    "env_structure": 0.0,                                    # inverted mid-scale structure (glow → depth)
    "env_refl": 1.0,                                         # cyan floor reflection strength
    "env_vignette": 0.03, "env_tint": 0.0,                   # extra OKLab -b (blue) on the room
    "foot_shadow": 0.12, "panel_shadow": 0.10,
    "panel_fill": 0.985, "panel_border": 0.80, "panel_border_px": 1.2, "panel_detail": 0.15,
    "ink": 0.22, "slate": 0.48,
    "sig_L_hi": 0.58, "sig_L_range": 0.26, "sig_chroma_lo": 1.3, "sig_chroma_hi": 1.5,
    "soft_L": 0.62, "soft_chroma": 1.8,
    "halo_L": 0.04, "halo_chroma": 0.3,
    "body_sig_L": 0.50, "body_sig_chroma": 1.25,
    "person_edge_lo": 0.45, "person_edge_hi": 0.8,           # mask tightening
    "person_offset": 0.03, "person_contrast": 0.14,
    # A final S-curve on lightness for the whole frame (1 = none). Applied last,
    # about `contrast_pivot`, so a bright scene keeps its brightness while the
    # shadows, the subject and the drawn signals gain definition. Panel fills
    # simply clip at white; ink and signals get darker, which is the point.
    "contrast": 1.0, "contrast_pivot": 0.72,
}


def rounded_rect_mask(h, w, rect, radius, feather=0.8):
    x0, y0, x1, y1 = rect
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float64)
    # distance outside the rounded rectangle (0 inside)
    cx = np.clip(xx, x0 + radius, x1 - radius)
    cy = np.clip(yy, y0 + radius, y1 - radius)
    d = np.hypot(xx - cx, yy - cy) - radius
    return 1.0 - smoothstep(d, -feather, feather)


def env_gradient(h, w, horizon, g=DEFAULT_GRADE):
    """Pearl above the horizon, a deeper polished floor below it, with a soft
    lateral falloff so the ground is not a flat wash."""
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(-1, 1, w)[None, :]
    t_top = smoothstep(y, 0.0, horizon)                # top → horizon
    t_floor = smoothstep(y, horizon, 1.0)              # horizon → bottom
    L = lerp(g["env_top"], g["env_mid"], t_top)
    L = lerp(L, g["env_floor"], t_floor)
    L = L - g["env_vignette"] * (x ** 2) * (0.4 + 0.6 * y)   # gentle vignette, stronger low
    a = lerp(PEARL_TOP[1], FLOOR[1], t_floor)
    b = lerp(PEARL_TOP[2], FLOOR[2], t_floor) + g["env_tint"] * (0.6 + 0.4 * t_floor)   # cooler toward the floor
    return L, a * np.ones_like(L), b * np.ones_like(L)


def relight(rgb: np.ndarray, person: np.ndarray, cfg: dict) -> np.ndarray:
    """rgb float (h,w,3) in 0..1, person float (h,w) 0..1 → light frame 0..1."""
    h, w, _ = rgb.shape
    g = {**DEFAULT_GRADE, **cfg.get("grade", {})}
    lab = linear_to_oklab(srgb_to_linear(rgb))
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    C = np.hypot(a, b)
    hue = (np.degrees(np.arctan2(b, a)) + 360) % 360

    # ── region weights ──────────────────────────────────────────────────────
    panel = np.zeros((h, w))
    panel_edge = np.zeros((h, w))
    edge_zone = np.zeros((h, w))
    shadow = np.zeros((h, w))
    for rect in cfg["panels"]:
        r = cfg.get("radius", 12)
        m = rounded_rect_mask(h, w, rect, r)
        panel = np.maximum(panel, m)
        bw = g["panel_border_px"]
        inner = rounded_rect_mask(h, w, (rect[0] + bw, rect[1] + bw, rect[2] - bw, rect[3] - bw), max(1, r - bw))
        panel_edge = np.maximum(panel_edge, np.clip(m - inner, 0, 1))
        # the dark film's own hairline sits within a few px of the edge; it is
        # replaced by ours, so type/divider detection is muted in that zone
        zone_in = rounded_rect_mask(h, w, (rect[0] + 4, rect[1] + 4, rect[2] - 4, rect[3] - 4), max(1, r - 4))
        zone_out = rounded_rect_mask(h, w, (rect[0] - 3, rect[1] - 3, rect[2] + 3, rect[3] + 3), r + 3)
        edge_zone = np.maximum(edge_zone, np.clip(zone_out - zone_in, 0, 1))
        sh = rounded_rect_mask(h, w, (rect[0] - 2, rect[1] + 6, rect[2] + 2, rect[3] + 10), cfg.get("radius", 12) + 4)
        shadow = np.maximum(shadow, gaussian_filter(sh, 9) * (1 - m))
    # the pose mask is soft; tighten it so the dark room's edge pixels do not
    # ride along the silhouette as a grey aura
    person = smoothstep(np.clip(person, 0, 1), g["person_edge_lo"], g["person_edge_hi"])
    person = np.minimum(person, gaussian_filter(person, 0.7))

    # pixel classes (soft), from the ORIGINAL colours
    sat = smoothstep(C, 0.045, 0.12)                    # a colour (cyan/blue/violet/gold)
    bright = smoothstep(L, 0.55, 0.85)                  # a line core / text
    # drawn things are THIN (waveforms, skeleton lines, dots); glow is smooth
    thin = smoothstep(np.abs(L - gaussian_filter(L, 2.0)), 0.015, 0.06)
    band = smoothstep(np.abs(L - gaussian_filter(L, 6.0)), 0.01, 0.05)   # narrow bands (waveforms), not broad glow
    # type is thin strokes (or a very hot core); broad bright shapes are room, not type
    text = (1 - sat) * bright * (1 - edge_zone) * np.maximum(thin, smoothstep(L, 0.78, 0.95))
    signal = sat * smoothstep(L, 0.18, 0.5) * np.maximum(thin, smoothstep(L, 0.55, 0.8))  # a drawn signal: thin, or a hot core
    # soft coloured bands (the waveforms) are signals too when their chroma is real
    # (the waveforms are dim: L ~0.2, chroma 0.04-0.1, so the colour test is relaxed here)
    soft_signal = smoothstep(C, 0.03, 0.07) * smoothstep(L, 0.15, 0.42) * (1 - thin) * band * (1 - signal) * (1 - text)
    # on the floor the same class is a reflection, not a drawn band: half strength
    yn = np.linspace(0, 1, h)[:, None] * np.ones((1, w))
    soft_signal = soft_signal * (1 - 0.5 * smoothstep(yn, cfg.get("horizon", 0.72), cfg.get("horizon", 0.72) + 0.12))
    bloom = sat * (1 - thin) * (1 - signal) * (1 - soft_signal)  # saturated, smooth, weak: glow
    dim_text = (1 - sat) * smoothstep(L, 0.28, 0.5) * (1 - bright) * (1 - edge_zone) * thin  # secondary grey type / dividers (thin strokes only)

    # ── ENVIRONMENT: designed base + the room's own detail ───────────────────
    gL, ga, gb = env_gradient(h, w, cfg.get("horizon", 0.72), g)
    detail = L - gaussian_filter(L, 10)
    env_L = gL + g["env_detail"] * np.clip(detail, -g["env_detail_clip"], g["env_detail_clip"])
    # the room's mid-scale structure, inverted: what GLOWED in the dark room
    # (floor light, screens) becomes the slightly deeper, reflective part of
    # the light room, and what was black becomes the lit wall. This is what
    # keeps depth — without it the room is a white void.
    structure = gaussian_filter(L, 10) - gaussian_filter(L, 40)
    env_L = env_L - g["env_structure"] * np.clip(structure, -0.15, 0.15)
    # the dark film's floor light becomes a cyan reflection on the polished floor
    refl = gaussian_filter(sat * smoothstep(L, 0.2, 0.6) * (1 - person), 6) * g["env_refl"]
    env_a = ga + (-0.020) * refl
    env_b = gb + (-0.035) * refl
    env_L = env_L - 0.03 * refl
    # contact shadow beneath the subject
    foot = gaussian_filter(np.roll(person, 6, axis=0), 7) * (1 - person)
    env_L = env_L - g["foot_shadow"] * foot * smoothstep(np.linspace(0, 1, h)[:, None] * np.ones((1, w)), 0.55, 0.8)
    # panel drop shadow
    env_L = env_L - g["panel_shadow"] * shadow
    env_a = env_a - 0.004 * shadow
    env_b = env_b - 0.012 * shadow

    # ── PANELS: light-native fill ────────────────────────────────────────────
    pan_L = np.full((h, w), g["panel_fill"])
    pan_a = np.full((h, w), PANEL_FILL[1])
    pan_b = np.full((h, w), PANEL_FILL[2])
    # keep the panel's own interior structure faintly (rows, sub-cards)
    pan_L = pan_L - g["panel_detail"] * np.clip(detail, -0.06, 0.06) * (1 - sat)
    # hairline border
    pan_L = lerp(pan_L, g["panel_border"], panel_edge)
    pan_b = lerp(pan_b, PANEL_BORDER[2], panel_edge)

    # base surface = env or panel, by region
    base_L = lerp(env_L, pan_L, panel)
    base_a = lerp(env_a, pan_a, panel)
    base_b = lerp(env_b, pan_b, panel)

    # ── TEXT and hairlines → ink ─────────────────────────────────────────────
    ink_L = lerp(g["ink"], g["slate"], 1 - smoothstep(L, 0.6, 0.95))   # whiter → darker
    out_L = lerp(base_L, ink_L, text)
    out_a = lerp(base_a, INK[1], text)
    out_b = lerp(base_b, INK[2], text)
    # secondary grey type and dividers
    out_L = lerp(out_L, g["slate"], dim_text)
    out_a = lerp(out_a, SLATE[1], dim_text)
    out_b = lerp(out_b, SLATE[2], dim_text)

    # ── SIGNALS: deepen, keep hue; bloom → controlled halo ───────────────────
    sig_L = g["sig_L_hi"] - g["sig_L_range"] * smoothstep(L, 0.3, 0.95)   # brighter core → deeper line
    gold = smoothstep(hue, 50, 75) * (1 - smoothstep(hue, 100, 120))
    sig_L = lerp(sig_L, 0.60, gold)                        # gold stays lighter, champagne
    chroma_gain = lerp(g["sig_chroma_lo"], g["sig_chroma_hi"], smoothstep(L, 0.4, 0.9))
    out_L = lerp(out_L, sig_L, signal)
    out_a = lerp(out_a, a * chroma_gain, signal)
    out_b = lerp(out_b, b * chroma_gain, signal)
    out_L = lerp(out_L, g["soft_L"], soft_signal)
    out_a = lerp(out_a, a * g["soft_chroma"], soft_signal)
    out_b = lerp(out_b, b * g["soft_chroma"], soft_signal)
    halo = bloom * (1 - person) * smoothstep(L, 0.12, 0.4)
    out_L = lerp(out_L, out_L - g["halo_L"], halo)
    out_a = lerp(out_a, out_a + g["halo_chroma"] * a, halo)
    out_b = lerp(out_b, out_b + g["halo_chroma"] * b, halo)

    # ── PERSON: re-lit, not recoloured ───────────────────────────────────────
    p_lift = cfg.get("person_lift", 0.62)
    pL = np.clip(L, 0, 1) ** p_lift                        # shadow lift
    pL = np.clip(pL * cfg.get("person_gain", 1.08) + g["person_offset"], 0, 0.97)
    # restore local contrast the lift flattened (gentle S around the midtones)
    pL = pL + g["person_contrast"] * (pL - 0.5) * (1 - np.abs(pL - 0.5) * 2)
    # pull the scene's cyan cast back toward neutral for low-chroma pixels
    cast = (1 - smoothstep(C, 0.05, 0.12)) * cfg.get("person_cast", 0.3)
    pa = a * (1 - cast)
    pb = b * (1 - cast)
    # skin: warm hues keep a little extra chroma so they read as skin
    skin = smoothstep(hue, 20, 40) * (1 - smoothstep(hue, 70, 90)) * smoothstep(C, 0.02, 0.06)
    pa = pa * (1 + 0.15 * skin)
    pb = pb * (1 + 0.15 * skin)
    # tracking drawn over the body: clean, deeper cyan on the lit body
    body_sig = sat * smoothstep(L, 0.45, 0.8)
    pL = lerp(pL, g["body_sig_L"], body_sig)
    pa = lerp(pa, a * g["body_sig_chroma"], body_sig)
    pb = lerp(pb, b * g["body_sig_chroma"], body_sig)
    body_bloom = sat * (1 - smoothstep(L, 0.3, 0.55))
    pa = lerp(pa, pa * 0.55, body_bloom)
    pb = lerp(pb, pb * 0.55, body_bloom)

    out_L = lerp(out_L, pL, person)
    out_a = lerp(out_a, pa, person)
    out_b = lerp(out_b, pb, person)

    # ── CONTRAST: the frame as a whole, last ────────────────────────────────
    if g["contrast"] != 1.0:
        pv = g["contrast_pivot"]
        out_L = np.clip(pv + (out_L - pv) * g["contrast"], 0.0, 0.985)

    out = np.stack([out_L, out_a, out_b], axis=-1)
    lin = oklab_to_linear(out)
    for _ in range(4):
        bad = (lin.min(-1) < -0.002) | (lin.max(-1) > 1.002)
        if not bad.any():
            break
        out[bad, 1:] *= 0.85
        lin = oklab_to_linear(out)
    return linear_to_srgb(np.clip(lin, 0, 1))


def _load_mask(path: Path) -> np.ndarray:
    return np.asarray(Image.open(path).convert("L")).astype(np.float64) / 255


def _batch_one(args):
    frame, masks, dst, cfg = args
    if dst.exists():
        return dst.name
    rgb = np.asarray(Image.open(frame).convert("RGB")).astype(np.float64) / 255
    # 1-2-1 temporal smoothing of the pose mask: one mask per frame, no flicker
    prev_, cur_, next_ = (_load_mask(m) for m in masks)
    mask = (prev_ + 2 * cur_ + next_) / 4
    out = relight(rgb, mask, cfg)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(dst)
    return dst.name


def batch(video: str, frames_dir: Path, masks_dir: Path, out_dir: Path, workers: int):
    from multiprocessing import Pool
    cfg = load_config(video)
    frames = sorted(frames_dir.glob("*.png"))
    masks = sorted(masks_dir.glob("*.png"))
    if len(frames) != len(masks):
        raise SystemExit(f"{len(frames)} frames but {len(masks)} masks")
    out_dir.mkdir(parents=True, exist_ok=True)
    jobs = []
    for i, f in enumerate(frames):
        trio = (masks[max(0, i - 1)], masks[i], masks[min(len(masks) - 1, i + 1)])
        jobs.append((f, trio, out_dir / f.name, cfg))
    with Pool(workers) as pool:
        for k, name in enumerate(pool.imap_unordered(_batch_one, jobs, chunksize=2)):
            if k % 24 == 0:
                print(f"  {k + 1}/{len(jobs)} {name}", flush=True)
    print(f"done: {len(jobs)} frames -> {out_dir}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src", nargs="?")
    ap.add_argument("dst", nargs="?")
    ap.add_argument("--video", required=True)
    ap.add_argument("--mask")
    ap.add_argument("--batch", nargs=3, metavar=("FRAMES_DIR", "MASKS_DIR", "OUT_DIR"))
    ap.add_argument("--workers", type=int, default=3)
    args = ap.parse_args()
    if args.batch:
        batch(args.video, Path(args.batch[0]), Path(args.batch[1]), Path(args.batch[2]), args.workers)
        return
    cfg = load_config(args.video)
    rgb = np.asarray(Image.open(args.src).convert("RGB")).astype(np.float64) / 255
    mask = np.asarray(Image.open(args.mask).convert("L")).astype(np.float64) / 255
    out = relight(rgb, mask, cfg)
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(args.dst)


if __name__ == "__main__":
    main()
