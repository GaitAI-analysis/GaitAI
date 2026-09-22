"""Encode only explicitly reviewed use-case source mappings; never infer from file order.

Usage: python scripts/import-use-case-images.py --source-dir "path/to/downloads"
Requires Pillow. Original files stay untouched in the source directory.

The companion to import-product-images.py, and deliberately the same shape: the
manifest is the reviewed record, this script is the only thing that writes
production pixels, and every precondition the review asserted is re-checked
here before a single file is opened for encoding. A source that has been edited
since it was looked at, or that was never marked a clean photograph, stops the
run rather than quietly shipping.
"""

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "use-case-image-manifest.json"
REGISTRY = ROOT / "src/data/use-case-images.generated.json"
ROLES = ("dark", "light")
RESPONSIVE_WIDTHS = (480, 768, 1024)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--only", default=None, help="comma-separated caseIds to (re)encode; others keep their outputs")
    args = parser.parse_args()
    source_root = args.source_dir.resolve(strict=True)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    inventory = {item["source"]: item for item in manifest["inventory"]}
    # Keep imagery for environments already integrated. Completeness is per use
    # case, never a gate on all 34 roles across the page.
    generated = json.loads(REGISTRY.read_text(encoding="utf-8")) if REGISTRY.exists() else {}

    only = set(args.only.split(",")) if args.only else None
    ready = []
    selected_hashes = {}
    for record in manifest["useCases"]:
        if record["status"] != "reviewed":
            continue
        if only is not None and record["caseId"] not in only:
            continue
        if not all(record["sources"].get(role) and
                   record["roleReview"][role]["status"] == "selected-clean" for role in ROLES):
            continue
        case_id = record["caseId"]
        if not case_id.isascii() or not case_id.isalnum() or case_id != case_id.lower():
            raise ValueError(f"Invalid use case id: {case_id}")
        # Preflight the entire selection before writing any production files.
        for role in ROLES:
            filename = record["sources"][role]
            reviewed = inventory[filename]
            # A record marked `singlePhotograph` (one reviewed frame for both
            # themes, with the reason stated) claims its source for "both".
            expected = {"caseId": case_id, "role": "both" if record.get("singlePhotograph") else role}
            if (reviewed["sourceKind"] != "clean-photograph" or
                    not reviewed["eligibleForMapping"] or
                    reviewed["selection"] != "selected" or
                    reviewed["selectedFor"] != expected):
                raise ValueError(f"Source is not a reviewed clean {case_id}/{role}: {filename}")
            source = (source_root / filename).resolve(strict=True)
            if not source.is_relative_to(source_root):
                raise ValueError(f"Source escapes selected folder: {filename}")
            if digest(source) != reviewed["sha256"]:
                raise ValueError(f"Source changed since visual review: {filename}")
            if selected_hashes.get(reviewed["sha256"], filename) != filename:
                raise ValueError(f"Duplicate export selected as another source: {filename}")
            selected_hashes[reviewed["sha256"]] = filename
        if record.get("singlePhotograph") and len(record["singlePhotograph"].get("reason", "")) < 40:
            raise ValueError(f"A single photograph for both themes needs a stated reason: {case_id}")
        ready.append(record)

    for record in ready:
        case_id = record["caseId"]
        images = {
            "alt": record["visualDescription"],
            "objectPosition": record["objectPosition"],
            "assets": {},
        }
        for role in ROLES:
            filename = record["sources"][role]
            source = (source_root / filename).resolve(strict=True)
            directory = ROOT / "public" / "images" / "use-cases" / case_id
            directory.mkdir(parents=True, exist_ok=True)
            with Image.open(source) as original:
                photograph = ImageOps.exif_transpose(original).convert("RGB")
                # Never upscale: a rung wider than the source would be soft.
                widths = sorted({w for w in RESPONSIVE_WIDTHS if w < photograph.width}
                                | {photograph.width})
                variants = []
                for width in widths:
                    name = f"{role}.webp" if width == photograph.width else f"{role}-{width}.webp"
                    output = directory / name
                    height = round(photograph.height * width / photograph.width)
                    resized = (photograph if width == photograph.width
                               else photograph.resize((width, height), Image.Resampling.LANCZOS))
                    resized.save(output, "WEBP", quality=94, method=6)
                    variants.append({
                        "src": f"/images/use-cases/{case_id}/{name}",
                        "width": width, "height": height,
                        "bytes": output.stat().st_size, "sha256": digest(output),
                    })
                images[role] = variants[-1]["src"]
                images["assets"][role] = {
                    "width": photograph.width, "height": photograph.height,
                    "variants": variants,
                }
        generated[case_id] = images
        record["outputs"] = images["assets"]
        record["deploymentStatus"] = "integrated"

    manifest["audit"]["summary"]["currentlyIntegratedUseCaseSets"] = len(generated)
    manifest["audit"]["summary"]["currentlyIntegratedPrimaryAssets"] = len(generated) * len(ROLES)
    REGISTRY.write_text(json.dumps(generated, indent=2) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Encoded {len(generated)} reviewed use cases / "
          f"{len(generated) * len(ROLES)} primary assets (plus responsive derivatives).")


if __name__ == "__main__":
    main()
