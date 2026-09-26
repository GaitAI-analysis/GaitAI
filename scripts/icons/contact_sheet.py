"""Contact sheet: all icons at 128px on pearl tiles, plus a 48px readability row."""
from pathlib import Path
from PIL import Image, ImageDraw

import sys
# Usage: python scripts/icons/contact_sheet.py [dir]   (dir holds png/; writes docs/icons/environment-icons-contact-sheet.png)
HERE = Path(sys.argv[1] if len(sys.argv) > 1 else "tmp/icons")
PNG = HERE / "png"
ORDER = ["physio", "hospitals", "sports", "elderly", "neuro", "homecare", "fitness", "schools", "prosthetics", "insurance", "trials",
         "airports", "smartcities", "campuses", "factories", "retail", "events", "defence"]
cell, cols = 176, 6
rows = -(-len(ORDER) // cols)
sheet = Image.new("RGB", (cols * cell, rows * cell + 120), (244, 248, 253))
d = ImageDraw.Draw(sheet)
for i, k in enumerate(ORDER):
    im = Image.open(PNG / f"{k}.png").convert("RGBA").resize((128, 128), Image.LANCZOS)
    x, y = (i % cols) * cell + 24, (i // cols) * cell + 12
    d.rounded_rectangle((x - 6, y - 6, x + 134, y + 134), radius=22, fill=(255, 255, 255), outline=(205, 216, 232))
    sheet.paste(im, (x, y), im)
    d.text((x, y + 140), k, fill=(23, 34, 56))
ry = rows * cell + 24
d.text((24, ry - 16), "48 px:", fill=(74, 91, 120))
for i, k in enumerate(ORDER):
    im = Image.open(PNG / f"{k}.png").convert("RGBA").resize((48, 48), Image.LANCZOS)
    x = 24 + i * 58
    d.rounded_rectangle((x - 4, ry + 4, x + 52, ry + 60), radius=12, fill=(255, 255, 255), outline=(205, 216, 232))
    sheet.paste(im, (x, ry + 8), im)
sheet.save("docs/icons/environment-icons-contact-sheet.png")
print("sheet ok", sheet.size)
