"""Encode only explicitly reviewed source mappings; never infer from file order.

Usage: python scripts/import-product-images.py --source-dir "path/to/downloads"
Requires Pillow. Original files stay untouched in the source directory.
"""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "product-image-manifest.json"
ROLES = {"heroDark": "dark-hero", "heroLight": "light-hero", "card": "card"}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    args = parser.parse_args()
    source_root = args.source_dir.resolve(strict=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    inventory = {item["source"]: item for item in manifest["inventory"]}
    generated = {}
    for product in manifest["products"]:
        if product["status"] != "reviewed":
            continue
        slug = product["slug"]
        if not slug.isascii() or not slug.isalnum() or slug != slug.lower():
            raise ValueError(f"Invalid product slug: {slug}")
        images = {"alt": product["visualDescription"], "heroPosition": product["heroPosition"],
                  "cardPosition": product["cardPosition"], "assets": {}}
        for role, basename in ROLES.items():
            filename = product["sources"][role]
            source = (source_root / filename).resolve(strict=True)
            if not source.is_relative_to(source_root):
                raise ValueError(f"Source escapes selected folder: {filename}")
            if digest(source) != inventory[filename]["sha256"]:
                raise ValueError(f"Source changed since visual review: {filename}")
            directory = ROOT / "public" / "images" / "products" / slug
            directory.mkdir(parents=True, exist_ok=True)
            with Image.open(source) as original:
                photograph = ImageOps.exif_transpose(original).convert("RGB")
                widths = [320, 640, 960] if role == "card" else [480, 768, 1024]
                widths = sorted({w for w in widths if w < photograph.width} | {photograph.width})
                variants = []
                for width in widths:
                    name = f"{basename}.webp" if width == photograph.width else f"{basename}-{width}.webp"
                    output = directory / name
                    height = round(photograph.height * width / photograph.width)
                    resized = photograph if width == photograph.width else photograph.resize((width, height), Image.Resampling.LANCZOS)
                    resized.save(output, "WEBP", quality=94, method=6)
                    variants.append({"src": f"/images/products/{slug}/{name}", "width": width,
                                     "height": height, "bytes": output.stat().st_size, "sha256": digest(output)})
                images[role] = variants[-1]["src"]
                images["assets"][role] = {"width": photograph.width, "height": photograph.height, "variants": variants}
        generated[slug] = images
        product["outputs"] = images["assets"]
    (ROOT / "src/data/product-images.generated.json").write_text(json.dumps(generated, indent=2) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Encoded {len(generated)} reviewed products / {len(generated) * 3} primary assets (plus responsive derivatives).")


if __name__ == "__main__":
    main()
