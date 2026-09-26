# python compose.py <theme> <framesDir> <frame,frame,...> <out.png>
# Places walker frames on the clean plate at the painted figure's scale/position, next to the original.
import sys, json
from PIL import Image

theme, d, idx, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
REPO = r"C:/Users/Anubha/Documents/website/GaitAI-main/GaitAI/public/images/hero/"
cfg = {
    "light": dict(orig="home-hero-gaitai.webp", height=474, floor=827, hipx=1318, crop=(1080, 250, 1672, 941)),
    "dark": dict(orig="home-hero-dark.webp", height=554, floor=834, hipx=1440, crop=(1200, 180, 1759, 894)),
}[theme]
meta = json.load(open(f"{d}/meta.json"))
ppm = meta["ppm"]
scale = cfg["height"] / (float(__import__("os").environ.get("BODY_H", "1.774")) * ppm)
orig = Image.open(REPO + cfg["orig"]).convert("RGBA")
clean = Image.open(f"clean-{theme}.png").convert("RGBA")
tiles = [orig.crop(cfg["crop"])]
for i in [int(x) for x in idx.split(",")]:
    f = meta["frames"][i]
    im = Image.open(f"{d}/f{i:04d}.png").convert("RGBA")
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
    x = round(cfg["hipx"] - f["J"]["Hips"][0] * scale)
    y = round(cfg["floor"] - f["floorY"] * scale)
    base = clean.copy()
    base.alpha_composite(im, (x, y))
    tiles.append(base.crop(cfg["crop"]))
w = sum(t.width for t in tiles)
sheet = Image.new("RGBA", (w, tiles[0].height))
xx = 0
for t in tiles:
    sheet.paste(t, (xx, 0)); xx += t.width
sheet.convert("RGB").save(out)
