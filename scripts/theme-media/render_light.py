#!/usr/bin/env python
"""
GaitAI THEME MEDIA — render the light companions
=============================================================================
Reads scripts/theme-media/jobs.json and, for every job, writes the light
companion NEXT TO the dark asset with the `-light` suffix the manifest in
src/lib/theme-media.ts expects:

    public/assets/videos/x/name.mp4            -> name-light.mp4
    public/assets/videos/x/name-poster.jpg     -> name-poster-light.jpg
    public/assets/images/x/name.webp           -> name-light.webp

Dark files are never touched. The light video is the dark video's own frames
through the colour transform in make_light_lut.py (a 3D LUT applied by
ffmpeg's lut3d filter), so it has the same dimensions, frame count, frame
rate and duration — the script checks that and fails if it does not.

Films with a photographic person (`"personMask": true`) also need a per-frame
person mask, produced once by segment_person.mjs into
<work>/<stem>/masks/%04d.png. The person is composited back untouched.

    python scripts/theme-media/render_light.py                 # every job
    python scripts/theme-media/render_light.py --only stage-02 # substring match
    python scripts/theme-media/render_light.py --work tmp/theme-media

Requires: ffmpeg + ffprobe on PATH, Python 3 with numpy and Pillow.
=============================================================================
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))
import make_light_lut as lut  # noqa: E402


def light_path(p: Path, suffix="-light") -> Path:
    return p.with_name(p.stem + suffix + p.suffix)


def probe(path: Path):
    out = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-count_frames", "-show_entries",
            "stream=width,height,r_frame_rate,nb_read_frames:format=duration",
            "-of", "json", str(path),
        ],
        capture_output=True, text=True, check=True,
    ).stdout
    j = json.loads(out)
    s = j["streams"][0]
    return dict(
        width=s["width"], height=s["height"], fps=s["r_frame_rate"],
        frames=int(s["nb_read_frames"]), duration=float(j["format"]["duration"]),
    )


def cube_for(params: dict, work: Path) -> Path:
    key = hashlib.sha1(json.dumps(params, sort_keys=True).encode()).hexdigest()[:10]
    path = work / f"lut-{key}.cube"
    if not path.exists():
        lut.write_cube(str(path), params)
    return path


def soften_masks(src_dir: Path, dst_dir: Path, dilate=3, sigma=1.2):
    """Temporal 1-2-1 smoothing, a small dilation so hair and edges stay with the
    person, then a feather. Written as a PNG sequence ffmpeg can read."""
    files = sorted(src_dir.glob("*.png"))
    if not files:
        raise SystemExit(f"no masks in {src_dir}; run segment_person.mjs first")
    dst_dir.mkdir(parents=True, exist_ok=True)
    frames = [np.asarray(Image.open(f).convert("L")).astype(np.float32) for f in files]
    n = len(frames)
    for i, f in enumerate(files):
        prev = frames[max(0, i - 1)]
        nxt = frames[min(n - 1, i + 1)]
        m = (prev + 2 * frames[i] + nxt) / 4.0
        im = Image.fromarray(m.clip(0, 255).astype(np.uint8))
        im = im.filter(ImageFilter.MaxFilter(dilate)).filter(ImageFilter.GaussianBlur(sigma))
        im.save(dst_dir / f"{i + 1:04d}.png")
    return n


def render_video(job: dict, work: Path, root: Path):
    dark = root / job["dark"]
    light = light_path(dark)
    params = lut.params(json.dumps(job.get("lut", {})))
    cube = cube_for(params, work)
    stem = dark.stem
    info = probe(dark)
    print(f"\n> {dark.relative_to(root)}  {info['width']}x{info['height']} {info['frames']}f {info['fps']}fps {info['duration']:.2f}s")

    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(dark)]
    if job.get("personMask"):
        masks = work / stem / "masks"
        soft = work / stem / "masks-soft"
        n = soften_masks(masks, soft)
        if n != info["frames"]:
            raise SystemExit(f"{stem}: {n} masks for {info['frames']} frames")
        fps = info["fps"]
        cmd += ["-framerate", fps, "-i", str(soft / "%04d.png")]
        # base = light render, overlay = the untouched dark frame, mask = person
        fc = (
            f"[0:v]format=gbrp,split[orig][tolut];"
            f"[tolut]lut3d=file={cube.name}:interp=tetrahedral[light];"
            f"[1:v]format=gray[m];"
            f"[light][orig][m]maskedmerge,format=yuv420p[out]"
        )
        cmd += ["-filter_complex", fc, "-map", "[out]"]
    else:
        cmd += ["-vf", f"lut3d=file={cube.name}:interp=tetrahedral,format=yuv420p"]
    cmd += [
        "-an", "-c:v", "libx264", "-crf", str(job.get("crf", 18)), "-preset", "slow",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(light),
    ]
    # lut3d needs the cube path without a drive-letter colon: run from `work`.
    subtitle = subprocess.run(cmd, cwd=work, capture_output=True, text=True)
    if subtitle.returncode != 0:
        print(subtitle.stderr)
        raise SystemExit(f"ffmpeg failed for {stem}")

    out = probe(light)
    same = all(out[k] == info[k] for k in ("width", "height", "frames", "fps")) and abs(out["duration"] - info["duration"]) < 0.05
    status = "OK identical geometry and timing" if same else "FAIL GEOMETRY/TIMING MISMATCH"
    print(f"  {light.name}: {out['width']}x{out['height']} {out['frames']}f {out['duration']:.2f}s  {light.stat().st_size // 1024} KB  {status}")
    if not same:
        raise SystemExit(1)

    if job.get("poster"):
        render_poster(job, light, root)


def render_poster(job: dict, light: Path, root: Path):
    """The light poster is the light film's first frame at the DARK poster's
    exact pixel size, so the two posters are the same image in two palettes."""
    poster_dark = root / job["poster"]
    poster_light = light_path(poster_dark)
    w, h = Image.open(poster_dark).size
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(light), "-frames:v", "1",
         "-vf", f"scale={w}:{h}:flags=lanczos", "-q:v", "2", str(poster_light)],
        check=True,
    )
    print(f"  {poster_light.name}: first light frame at {w}x{h} (the dark poster's size), {poster_light.stat().st_size // 1024} KB")


def render_image(job: dict, work: Path, root: Path):
    dark = root / job["dark"]
    light = light_path(dark)
    params = lut.params(json.dumps(job.get("lut", {})))
    lut.apply_to_image(str(dark), str(light), params, quality=job.get("quality", 90))
    a, b = Image.open(dark), Image.open(light)
    ok = a.size == b.size
    print(f"> {dark.relative_to(root)} -> {light.name}  {b.size[0]}x{b.size[1]}  {'OK' if ok else 'FAIL size mismatch'}")
    if not ok:
        raise SystemExit(1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default=str(HERE / "jobs.json"))
    ap.add_argument("--work", default=str(ROOT / "tmp" / "theme-media"))
    ap.add_argument("--only", default=None, help="substring of the dark path")
    ap.add_argument("--images-only", action="store_true")
    ap.add_argument("--videos-only", action="store_true")
    ap.add_argument("--posters-only", action="store_true", help="re-cut posters from existing light films")
    args = ap.parse_args()

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe must be on PATH")
    work = Path(args.work).resolve()
    work.mkdir(parents=True, exist_ok=True)
    jobs = json.loads(Path(args.jobs).read_text(encoding="utf-8"))

    sel = lambda j: (args.only is None) or (args.only in j["dark"])  # noqa: E731
    if args.posters_only:
        for job in filter(sel, jobs.get("videos", [])):
            if job.get("poster"):
                render_poster(job, light_path(ROOT / job["dark"]), ROOT)
        return
    if not args.images_only:
        for job in filter(sel, jobs.get("videos", [])):
            render_video(job, work, ROOT)
    if not args.videos_only:
        for job in filter(sel, jobs.get("images", [])):
            render_image(job, work, ROOT)
    print("\nground colour for CSS:", lut.ground_hex(lut.params()))


if __name__ == "__main__":
    main()
