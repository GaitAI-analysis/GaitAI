# Reconstruct the background that the painted figure covers, so the rigged
# copy has somewhere to walk. Only the figure's own silhouette is touched —
# the soft floor reflection under it is left exactly as painted, because it is
# broad and diffuse enough to survive the small travel the brief asks for.
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
from skimage.restoration import inpaint_biharmonic

REPO = r"C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI"
HERE = os.path.dirname(os.path.abspath(__file__))
BOX = (1140, 320, 1500, 900)

full = Image.open(os.path.join(REPO, "public/images/hero/home-hero-gaitai.webp")).convert("RGB")
crop = np.array(full.crop(BOX)).astype(np.float64) / 255.0
H, W = crop.shape[:2]

alpha = np.array(Image.open(os.path.join(HERE, "figure_raw.png")).convert("RGBA"))[:, :, 3]
# The hole: everything the figure paints, plus a margin for its soft edge.
hole = ndimage.binary_dilation(alpha > 8, iterations=3)
print("hole px", hole.sum(), "of", H * W)

# --- structure pass: interpolate each row across the hole -------------------
# The panel's gold streams run close to horizontal here, so a row-wise fill
# keeps them continuous where a diffusion fill would erase them.
row_fill = crop.copy()
for y in range(H):
    m = hole[y]
    if not m.any():
        continue
    xs = np.where(~m)[0]
    if len(xs) < 2:
        continue
    bad = np.where(m)[0]
    for c in range(3):
        row_fill[y, bad, c] = np.interp(bad, xs, crop[y, xs, c])

# --- smooth pass: biharmonic at half resolution, then back up ---------------
small = np.array(Image.fromarray((crop * 255).astype(np.uint8)).resize((W // 2, H // 2), Image.LANCZOS)).astype(np.float64) / 255
hole_s = np.array(Image.fromarray((hole * 255).astype(np.uint8)).resize((W // 2, H // 2), Image.NEAREST)) > 127
smooth_s = inpaint_biharmonic(small, hole_s, channel_axis=-1)
smooth = np.array(
    Image.fromarray(np.clip(smooth_s * 255, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
).astype(np.float64) / 255

fill = 0.55 * row_fill + 0.45 * smooth
# Soften only inside the hole so the join to real pixels stays sharp.
fill_img = Image.fromarray(np.clip(fill * 255, 0, 255).astype(np.uint8))
fill_blur = np.array(fill_img.filter(ImageFilter.GaussianBlur(1.1))).astype(np.float64) / 255
fill = np.where(hole[:, :, None], fill_blur, crop)

# Match the artwork's grain so the patch does not read as a clean plate.
rng = np.random.default_rng(7)
grain = rng.normal(0, 0.0045, (H, W, 1))
fill = np.clip(fill + grain * hole[:, :, None], 0, 1)

out = np.clip(fill * 255, 0, 255).astype(np.uint8)
Image.fromarray(out).save(os.path.join(HERE, "erased_rgb.png"))

# The shipped patch paints ONLY the hole, feathered, so everywhere else the
# original artwork shows through untouched and there is no rectangle seam.
soft = ndimage.gaussian_filter(hole.astype(np.float64), 1.6)
patch_a = np.clip(soft * 1.6, 0, 1)
patch_a[hole] = 1.0
rgba = np.dstack([out, (patch_a * 255).astype(np.uint8)])
Image.fromarray(rgba, "RGBA").save(os.path.join(HERE, "eraser_patch.png"))

ys, xs = np.where(patch_a > 0.004)
print("patch bbox in crop", xs.min(), ys.min(), xs.max(), ys.max())
print("patch bbox in image", BOX[0] + xs.min(), BOX[1] + ys.min(), BOX[0] + xs.max(), BOX[1] + ys.max())
Image.fromarray(out).save(os.path.join(HERE, "check_erased.png"))
