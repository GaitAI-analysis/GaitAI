# Matte the walking figure out of the hero artwork.
# Stage 1 of the pose-panel walk pipeline: isolate the figure so it can be
# rigged, and learn its exact bounding box in image fractions.
import os, sys
import numpy as np
from PIL import Image

REPO = r"C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(REPO, "public/images/hero/home-hero-gaitai.webp")

full = Image.open(SRC).convert("RGB")
W, H = full.size
print("full", W, H)

# Generous crop around the figure in the rightmost (Pose analysis) panel.
BOX = (1140, 320, 1500, 900)
crop = full.crop(BOX)
crop.save(os.path.join(HERE, "crop.png"))
print("crop", crop.size)

from rembg import remove, new_session

session = new_session("u2net")
out = remove(crop, session=session, alpha_matting=True,
             alpha_matting_foreground_threshold=250,
             alpha_matting_background_threshold=15,
             alpha_matting_erode_size=5)
out = out.convert("RGBA")
out.save(os.path.join(HERE, "figure_raw.png"))

a = np.array(out)[:, :, 3]
ys, xs = np.where(a > 24)
print("alpha bbox in crop:", xs.min(), ys.min(), xs.max(), ys.max())
print("alpha bbox in image:",
      BOX[0] + xs.min(), BOX[1] + ys.min(), BOX[0] + xs.max(), BOX[1] + ys.max())
print("coverage", (a > 24).mean())

# A quick visual: the matte on a flat plate.
chk = Image.new("RGBA", out.size, (20, 24, 40, 255))
chk.alpha_composite(out)
chk.save(os.path.join(HERE, "figure_on_plate.png"))
