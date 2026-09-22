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
    parser.add_argument("--only", default=None, help="comma-separated slugs to (re)encode; others keep their outputs")
    args = parser.parse_args()
    only = set(args.only.split(",")) if args.only else None
    source_root = args.source_dir.resolve(strict=True)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    inventory = {item["source"]: item for item in manifest["inventory"]}
    registry = ROOT / "src/data/product-images.generated.json"
    # Keep existing imagery for incomplete products. Completeness is per product,
    # never a gate on all 72 roles across the catalogue.
    generated = json.loads(registry.read_text(encoding="utf-8")) if registry.exists() else {}
    ready = []
    selected_hashes = {}
    products_by_name = {p["product"]: p for p in manifest["products"]}
    for product in manifest["products"]:
        if product["status"] != "reviewed":
            continue
        if only is not None and product["slug"] not in only:
            continue
        if not all(product["sources"].get(role) and
                   product["roleReview"][role]["status"] == "selected-clean" for role in ROLES):
            continue
        slug = product["slug"]
        if not slug.isascii() or not slug.isalnum() or slug != slug.lower():
            raise ValueError(f"Invalid product slug: {slug}")
        # Preflight the entire selection before writing any production files.
        for role in ROLES:
            filename = product["sources"][role]
            reviewed = inventory[filename]
            review = product["roleReview"][role]
            owner = review.get("sharedFrom", {"product": product["product"], "role": role})
            if (reviewed["sourceKind"] != "clean-photograph" or
                    not reviewed["eligibleForMapping"] or reviewed["selection"] != "selected" or
                    reviewed["selectedFor"] != owner):
                raise ValueError(f"Source is not a reviewed clean {slug}/{role}: {filename}")
            if "sharedFrom" in review:
                primary = products_by_name[owner["product"]]
                if (not manifest.get("semanticSharingPolicy", {}).get("enabled") or
                        not review.get("reason") or not product.get("mappingNote") or
                        primary["sources"][owner["role"]] != filename or
                        "sharedFrom" in primary["roleReview"][owner["role"]]):
                    raise ValueError(f"Undeclared semantic sharing: {slug}/{role}")
            source = (source_root / filename).resolve(strict=True)
            if not source.is_relative_to(source_root):
                raise ValueError(f"Source escapes selected folder: {filename}")
            if digest(source) != reviewed["sha256"]:
                raise ValueError(f"Source changed since visual review: {filename}")
            if selected_hashes.get(reviewed["sha256"], filename) != filename:
                raise ValueError(f"Duplicate export selected as another source: {filename}")
            selected_hashes[reviewed["sha256"]] = filename
        ready.append(product)
    for product in ready:
        slug = product["slug"]
        images = {"alt": product["visualDescription"], "heroPosition": product["heroPosition"],
                  "cardPosition": product["cardPosition"], "assets": {}}
        if product.get("heroWide"):
            images["heroWide"] = True
        if product.get("cardDedicated"):
            # This product has a card photograph of its own; the catalogue shows it
            # instead of the theme hero crop (see ProductCardImage).
            images["cardDedicated"] = True
        for role, basename in ROLES.items():
            filename = product["sources"][role]
            source = (source_root / filename).resolve(strict=True)
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
                    if width == photograph.width and inventory[filename].get("losslessMaster"):
                        # A supplied file the founder asked to use exactly: the
                        # master is a lossless encode, pixel-identical to the source.
                        resized.save(output, "WEBP", lossless=True, quality=100, method=6)
                    else:
                        resized.save(output, "WEBP", quality=94, method=6)
                    variants.append({"src": f"/images/products/{slug}/{name}", "width": width,
                                     "height": height, "bytes": output.stat().st_size, "sha256": digest(output)})
                images[role] = variants[-1]["src"]
                images["assets"][role] = {"width": photograph.width, "height": photograph.height, "variants": variants}
        generated[slug] = images
        product["outputs"] = images["assets"]
        product["deploymentStatus"] = "integrated"
    manifest["audit"]["summary"]["currentlyIntegratedProductSets"] = len(generated)
    manifest["audit"]["summary"]["currentlyIntegratedPrimaryAssets"] = len(generated) * 3
    registry.write_text(json.dumps(generated, indent=2) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Encoded {len(generated)} reviewed products / {len(generated) * 3} primary assets (plus responsive derivatives).")


if __name__ == "__main__":
    main()
