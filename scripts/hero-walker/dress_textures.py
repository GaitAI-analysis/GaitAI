"""The walker's clothing textures, from the MakeHuman CC0 system-asset pack.

Only what the renderer uses survives: the suit's NORMAL map (fabric folds and seams), a
trim mask made from the suit's seam piping (R channel; the chest logo is left out), and
greyscale hair cards with their alpha. The stock colour art is not used anywhere: the
garments are coloured in render.html (GARMENT) in the hero's palette.

Usage: python dress_textures.py <makehuman_system_assets dir> <out dir (render models/clothes)>
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)

suit = os.path.join(src, "clothes", "male_casualsuit02")
a = np.asarray(Image.open(os.path.join(suit, "male_casualsuit02_diffuse.png")).convert("RGB")).astype(int)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
yy, xx = np.mgrid[0:R.shape[0], 0:R.shape[1]]
piping = (R > 150) & (G > 50) & (G < 190) & (B < 110) & (R - B > 90)
logo = (xx > 980) & (xx < 1320) & (yy > 180) & (yy < 480)
m = np.zeros(a.shape, np.uint8)
# The shoulder-yoke piping on the torso pieces reads as a pale fleck on the back at this size:
# only the sleeve seams and the hem keep their line.
yoke = (yy < 160) & (xx < 1480)
m[..., 0] = (piping & ~logo & ~yoke) * 255
(Image.fromarray(m).filter(ImageFilter.GaussianBlur(1.2)).resize((1024, 1024), Image.LANCZOS)
 .save(os.path.join(out, "male_casualsuit02_trim.png")))
(Image.open(os.path.join(suit, "male_casualsuit02_normal.png")).convert("RGB").resize((2048, 2048), Image.LANCZOS)
 .save(os.path.join(out, "male_casualsuit02_normal.png")))

for n in ("short01", "short02", "short04"):
    im = Image.open(os.path.join(src, "hair", n, n + "_diffuse.png")).convert("RGBA")
    r, g, b, alpha = im.split()
    lum = ImageOps.autocontrast(Image.merge("RGB", (r, g, b)).convert("L"), cutoff=1)
    Image.merge("RGBA", (lum, lum, lum, alpha)).resize((1024, 1024), Image.LANCZOS).save(os.path.join(out, n + "_hair.png"))
print("ok")

# ---- The London executive (2026-09-26): MakeHuman's CC0 male_elegantsuit01 (a two-piece
# suit, shirt and tie in one mesh) and shoes04 (black leather lace-ups). Again no stock colour:
#   <suit>_mask.png  R = fabric detail (the diffuse's own weave, lapel and pocket lines;
#                        0.5 = the cloth's median, so the shader multiplies by 2R)
#                    G = shirt (collar and cuffs)
#                    B = tie: 0.5 = the silk, 1.0 = its stripe
#   <suit>_normal.png  a normal map baked from that detail, for the lapels, seams and pockets
from scipy import ndimage

def height_normal(hgt, k):
    gy, gx = np.gradient(ndimage.gaussian_filter(hgt, 1.6))
    n = np.dstack([-gx * k, gy * k, np.ones_like(hgt)])  # OBJ v points up; the texture row down
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))

es = os.path.join(src, "clothes", "male_elegantsuit01")
a = np.asarray(Image.open(os.path.join(es, "male_elegantsuit01_diffuse.png")).convert("RGB")).astype(float)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
L = a.mean(-1); sat = a.max(-1) - a.min(-1)
yy, xx = np.mgrid[0:L.shape[0], 0:L.shape[1]]
silk = (B - R > 12) & (B > 50) & (yy < 420) & (xx > 700) & (xx < 900)
tie = ndimage.binary_fill_holes(ndimage.binary_closing(silk, iterations=4))
stripe = tie & (L > 130)
shirt = (L > 120) & (sat < 40) & ~tie
cloth = ~(shirt | tie)
med = np.median(L[cloth & (L > 25)])
det = np.clip(L / med, 0.62, 1.6)  # the stock art paints hard black outlines round the V; a fold, not a hole
det[shirt] = np.clip(L[shirt] / np.percentile(L[shirt], 90), 0.5, 1.2)
det[tie] = np.clip(L[tie] / np.median(L[tie & ~stripe]), 0.6, 1.3)
det[stripe] = 1.0
m = np.zeros(a.shape, np.uint8)
m[..., 0] = np.clip(det * 0.5 * 255, 0, 255)
m[..., 1] = ndimage.gaussian_filter(shirt.astype(float), 1.0) * 255
m[..., 2] = np.clip(ndimage.gaussian_filter(tie * 0.5 + stripe * 0.5, 0.8), 0, 1) * 255
Image.fromarray(m).resize((1024, 1024), Image.LANCZOS).save(os.path.join(out, "male_elegantsuit01_mask.png"))
height_normal(np.clip(L / med, 0, 2.5), 5.0).resize((1024, 1024), Image.LANCZOS).save(os.path.join(out, "male_elegantsuit01_normal.png"))
sh = os.path.join(src, "clothes", "shoes04")
(Image.open(os.path.join(sh, "shoes04_normal.png")).convert("RGB").resize((1024, 1024), Image.LANCZOS)
 .save(os.path.join(out, "shoes04_normal.png")))
print("executive ok", int(tie.sum()), int(stripe.sum()), int(shirt.sum()))
