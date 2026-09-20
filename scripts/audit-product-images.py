"""Inventory source images and prepare visual review aids; never assign products.

python scripts/audit-product-images.py --source-dir "path" --output-dir "tmp/audit"
Requires Pillow, numpy and scipy. Source files are read only.
"""
import argparse
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from scipy.fft import dctn
from scipy.ndimage import gaussian_filter


def bits_hex(bits):
    return f"{int(''.join('1' if b else '0' for b in bits.flatten()), 2):016x}"


def ssim(a, b):
    ma, mb = gaussian_filter(a, 1.5), gaussian_filter(b, 1.5)
    va = gaussian_filter(a * a, 1.5) - ma * ma
    vb = gaussian_filter(b * b, 1.5) - mb * mb
    cov = gaussian_filter(a * b, 1.5) - ma * mb
    return float(np.mean(((2 * ma * mb + 0.01**2) * (2 * cov + 0.03**2)) /
                         ((ma * ma + mb * mb + 0.01**2) * (va + vb + 0.03**2))))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()
    root = args.source_dir.resolve(strict=True)
    output = args.output_dir
    output.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in root.rglob("*") if p.is_file())
    inventory, pixels, groups = [], {}, defaultdict(list)
    for index, path in enumerate(files):
        record = {"reviewId": f"F{index + 1:03d}", "source": path.relative_to(root).as_posix(),
                  "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        with Image.open(path) as original:
            rgb = ImageOps.exif_transpose(original).convert("RGB")
            w, h = rgb.size
            divisor = math.gcd(w, h)
            gray = rgb.convert("L")
            coefficients = dctn(np.asarray(gray.resize((32, 32)), dtype=float), norm="ortho")[:8, :8]
            median = np.median(coefficients.flatten()[1:])
            phash = coefficients > median
            phash[0, 0] = False
            dh = np.asarray(gray.resize((9, 8)))
            record.update(width=w, height=h, aspectRatio=round(w / h, 6), aspectRatioFraction=f"{w // divisor}:{h // divisor}",
                          format=original.format, mode=original.mode, phash=bits_hex(phash), dhash=bits_hex(dh[:, 1:] > dh[:, :-1]),
                          pixelSha256=hashlib.sha256(rgb.tobytes()).hexdigest())
            pixels[record["reviewId"]] = np.asarray(gray.resize((128, 128)), dtype=float) / 255
        inventory.append(record)
        groups[record["sha256"]].append(record["reviewId"])
    pairs = []
    for i, a in enumerate(inventory):
        for b in inventory[i + 1:]:
            if a["sha256"] == b["sha256"]:
                continue
            ph = (int(a["phash"], 16) ^ int(b["phash"], 16)).bit_count()
            dh = (int(a["dhash"], 16) ^ int(b["dhash"], 16)).bit_count()
            if ph <= 12 or dh <= 10 or a["pixelSha256"] == b["pixelSha256"]:
                pairs.append({"a": a["reviewId"], "b": b["reviewId"], "phashDistance": ph, "dhashDistance": dh,
                              "ssim128": round(ssim(pixels[a["reviewId"]], pixels[b["reviewId"]]), 6),
                              "sameDecodedPixels": a["pixelSha256"] == b["pixelSha256"]})
    pairs.sort(key=lambda p: (p["phashDistance"], -p["ssim128"]))
    duplicate_groups = [ids for ids in groups.values() if len(ids) > 1]
    audit = {"sourceDirectory": str(root), "filesInspected": len(inventory), "inventory": inventory,
             "exactDuplicateGroups": duplicate_groups, "exactDuplicateExtraFiles": sum(len(ids) - 1 for ids in duplicate_groups),
             "similarityMethod": "63-bit DCT pHash, 64-bit dHash and grayscale SSIM at 128x128. Candidate pairs: pHash <= 12 OR dHash <= 10; human review decides duplication. Theme variants and similar subjects are not automatically duplicates.",
             "similarityCandidates": pairs}
    (output / "inventory.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 15)
    for start in range(0, len(inventory), 12):
        sheet = Image.new("RGB", (1440, 1240), "#e5e9ee")
        draw = ImageDraw.Draw(sheet)
        for j, record in enumerate(inventory[start:start + 12]):
            x, y = (j % 3) * 480, (j // 3) * 310
            with Image.open(root / record["source"]) as im:
                thumb = ImageOps.contain(im.convert("RGB"), (472, 266))
                sheet.paste(thumb, (x + (480 - thumb.width) // 2, y))
            draw.text((x + 5, y + 267), f"{record['reviewId']} | {record['width']}x{record['height']} | {record['aspectRatio']:.3f}", fill="black", font=font)
            draw.text((x + 5, y + 286), record["source"], fill="black", font=font)
        sheet.save(output / f"review-{start // 12 + 1:02d}.jpg", quality=95)
    print(json.dumps({"files": len(inventory), "exactDuplicateGroups": duplicate_groups,
                      "exactDuplicateExtraFiles": audit["exactDuplicateExtraFiles"], "similarityCandidatePairs": len(pairs)}))
    for pair in pairs[:30]:
        print(json.dumps(pair))


if __name__ == "__main__":
    main()
