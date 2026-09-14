#!/usr/bin/env python
"""
GaitAI THEME MEDIA — dark/light content-parity check
=============================================================================
Proves that a light companion is the SAME content as its dark original and
differs only in palette: for every pair in jobs.json it samples frames at
0 %, 25 %, 50 %, 75 % and 100 % of the timeline (images: the single frame),
computes an edge map of each (Sobel magnitude on luminance, normalised per
frame, thresholded at the 90th percentile) and reports

  edge IoU      overlap of the two edge sets          (1.0 = identical geometry)
  edge corr     Pearson correlation of edge magnitudes (1.0 = identical structure)
  luma corr     correlation of the raw luminance       (strongly NEGATIVE for an
                                                        inversion — that is the palette
                                                        changing while the geometry does not)

and the container facts (dimensions, frame count, fps, duration) side by side.
Exit 1 if any pair's geometry does not match or its edge IoU falls below the
threshold (default 0.50: the layer-aware console masters deliberately drop the
dark film's bloom and room-shadow edges and score 0.56-0.61 whole-frame; a
different pose or a shifted panel drops it to ~0.2).

    python scripts/theme-media/verify_parity.py
    python scripts/theme-media/verify_parity.py --min-iou 0.6 --only platform
=============================================================================
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent


def light_path(p: Path) -> Path:
    return p.with_name(p.stem + "-light" + p.suffix)


def probe(path: Path):
    j = json.loads(
        subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries",
             "stream=width,height,r_frame_rate,nb_read_frames:format=duration", "-of", "json", str(path)],
            capture_output=True, text=True, check=True,
        ).stdout
    )
    s = j["streams"][0]
    return dict(w=s["width"], h=s["height"], fps=s["r_frame_rate"], frames=int(s["nb_read_frames"]), dur=float(j["format"]["duration"]))


def frame_at(path: Path, index: int, w: int, h: int) -> np.ndarray:
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"select=eq(n\\,{index})", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.uint8).reshape(h, w).astype(np.float64)


def luma(img: Image.Image) -> np.ndarray:
    return np.asarray(img.convert("L")).astype(np.float64)


def edges(g: np.ndarray) -> np.ndarray:
    gx = np.zeros_like(g)
    gy = np.zeros_like(g)
    gx[:, 1:-1] = g[:, 2:] - g[:, :-2]
    gy[1:-1, :] = g[2:, :] - g[:-2, :]
    m = np.hypot(gx, gy)
    return m / (m.max() + 1e-9)


def compare(a: np.ndarray, b: np.ndarray):
    ea, eb = edges(a), edges(b)
    ta, tb = np.percentile(ea, 90), np.percentile(eb, 90)
    ma, mb = ea > ta, eb > tb
    iou = float((ma & mb).sum() / max(1, (ma | mb).sum()))
    ecorr = float(np.corrcoef(ea.ravel(), eb.ravel())[0, 1])
    lcorr = float(np.corrcoef(a.ravel(), b.ravel())[0, 1])
    return iou, ecorr, lcorr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default=str(HERE / "jobs.json"))
    ap.add_argument("--min-iou", type=float, default=0.50)
    ap.add_argument("--only", default=None)
    args = ap.parse_args()
    jobs = json.loads(Path(args.jobs).read_text(encoding="utf-8"))
    failed = 0

    print(f"{'asset':52s} {'geometry':>26s}  {'sample':>6s} {'edgeIoU':>8s} {'edgeCorr':>9s} {'lumaCorr':>9s}")
    for job in jobs.get("videos", []):
        if args.only and args.only not in job["dark"]:
            continue
        dark = ROOT / job["dark"]
        light = light_path(dark)
        a, b = probe(dark), probe(light)
        same = (a["w"], a["h"], a["frames"], a["fps"]) == (b["w"], b["h"], b["frames"], b["fps"]) and abs(a["dur"] - b["dur"]) < 0.05
        geo = f"{a['w']}x{a['h']} {a['frames']}f {a['fps']} {a['dur']:.2f}s"
        if not same:
            failed += 1
            print(f"{dark.name:52s} {geo:>26s}  GEOMETRY MISMATCH: light is {b['w']}x{b['h']} {b['frames']}f {b['fps']} {b['dur']:.2f}s")
            continue
        for pct in (0, 25, 50, 75, 100):
            idx = min(a["frames"] - 1, round((a["frames"] - 1) * pct / 100))
            iou, ec, lc = compare(frame_at(dark, idx, a["w"], a["h"]), frame_at(light, idx, a["w"], a["h"]))
            flag = "" if iou >= args.min_iou else "  <-- below threshold"
            if iou < args.min_iou:
                failed += 1
            print(f"{dark.name if pct == 0 else '':52s} {geo if pct == 0 else '':>26s}  {pct:>5d}% {iou:8.3f} {ec:9.3f} {lc:9.3f}{flag}")
    for job in jobs.get("images", []):
        if args.only and args.only not in job["dark"]:
            continue
        dark = ROOT / job["dark"]
        light = light_path(dark)
        ia, ib = Image.open(dark), Image.open(light)
        if ia.size != ib.size:
            failed += 1
            print(f"{dark.name:52s} SIZE MISMATCH {ia.size} vs {ib.size}")
            continue
        iou, ec, lc = compare(luma(ia), luma(ib))
        flag = "" if iou >= args.min_iou else "  <-- below threshold"
        if iou < args.min_iou:
            failed += 1
        print(f"{dark.name:52s} {f'{ia.width}x{ia.height}':>26s}  {'image':>6s} {iou:8.3f} {ec:9.3f} {lc:9.3f}{flag}")

    print(f"\n{'PARITY OK' if not failed else f'{failed} check(s) failed'}")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
