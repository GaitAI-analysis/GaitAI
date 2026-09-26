"""Export the rendered 512px PNGs as WebP (512 master + 128 rung) into the repo."""
from pathlib import Path
from PIL import Image

import sys
# Usage: python scripts/icons/export_icons.py [png-dir]   (default tmp/icons/png)
PNG = Path(sys.argv[1] if len(sys.argv) > 1 else "tmp/icons/png")
DST = Path("public/assets/icons/light/environments")
DST.mkdir(parents=True, exist_ok=True)
total = 0
for png in sorted(PNG.glob("*.png")):
    im = Image.open(png).convert("RGBA")
    assert im.size == (512, 512), (png.name, im.size)
    master = DST / f"{png.stem}.webp"
    rung = DST / f"{png.stem}-128.webp"
    im.save(master, "WEBP", quality=92, method=6, alpha_quality=100)
    im.resize((128, 128), Image.LANCZOS).save(rung, "WEBP", quality=92, method=6, alpha_quality=100)
    total += master.stat().st_size + rung.stat().st_size
    print(f"{png.stem:12s} {master.stat().st_size // 1024:3d} KB  {rung.stat().st_size // 1024:2d} KB")
print(f"{len(list(PNG.glob('*.png')))} icons, {total // 1024} KB total")
