"""
BUILD THE CAPTURE PLATE for the privacy pipeline's "Camera Video" card.

The card has to read as raw camera footage before any privacy transformation.
A drawn figure cannot do that at any level of grain, so the card uses a
photograph — and the site already owned one.

`public/assets/images/insights/01-walking-video-to-movement-intelligence.jpg`
is the insights cover. Inside the phone in its top-left corner is a photoreal
frame of a man walking past a concrete wall: real proportions, real clothing,
real perspective. This script takes that region and nothing else.

WHAT IT DOES
  1. crops the phone's screen content, clear of the bezel, the two UI icons
     and the scrubber along the bottom
  2. upsamples 4x with Lanczos — the source region is small, and a soft frame
     is what a real camera at this resolution produces anyway
  3. grades it off the cover's blue key: saturation down hard, a brightness
     lift out of the hero's darkness, contrast slightly down, which is how a
     sensor at gain in a dim place actually behaves
  4. crops to the card's own 150:156 portrait, framed on the walker
  5. writes public/assets/images/capture/cctv-walk-frame.jpg (+ .webp), and
     a wide, differently graded cut for the workflow's Stage 01 card

Nothing is fetched from the internet and no new licence is involved: this is
the project's own asset, reframed. Re-run after changing the source cover.

    python scripts/build-capture-plate.py     (needs Pillow)
"""

from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/assets/images/insights/01-walking-video-to-movement-intelligence.jpg"
TARGET = ROOT / "public/assets/images/capture/cctv-walk-frame.jpg"

# The screen content inside the phone, in source pixels.
CROP = (120, 122, 292, 251)
SCALE = 4
# The card's viewBox, so `slice` has almost nothing left to cut.
CARD_W, CARD_H = 150, 156
# Where the walker stands in the upsampled crop, for the portrait framing.
WALKER_X = 390


WIDE_TARGET = ROOT / "public/assets/images/capture/capture-walk-wide.jpg"


def grade(frame: Image.Image, colour: float, brightness: float, contrast: float) -> Image.Image:
    frame = ImageEnhance.Color(frame).enhance(colour)
    frame = ImageEnhance.Brightness(frame).enhance(brightness)
    return ImageEnhance.Contrast(frame).enhance(contrast)


def save(frame: Image.Image, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    frame.save(target, quality=84, optimize=True, progressive=True)
    webp = target.with_suffix(".webp")
    frame.save(webp, "WEBP", quality=80, method=6)
    print(f"{target.relative_to(ROOT)}  {frame.width}x{frame.height}  "
          f"{target.stat().st_size // 1024} KB  (+ {webp.name} {webp.stat().st_size // 1024} KB)")


def main() -> None:
    source = Image.open(SOURCE).convert("RGB").crop(CROP)
    source = source.resize((source.width * SCALE, source.height * SCALE), Image.LANCZOS)

    # 1 · The portrait plate for the privacy pipeline's Camera Video card and
    #     the /securevision Privacy Lens: neutral, low-contrast, a camera at gain.
    portrait = grade(source, 0.30, 1.18, 0.94)
    width = round(portrait.height * CARD_W / CARD_H)
    left = max(0, min(portrait.width - width, WALKER_X - width // 2))
    save(portrait.crop((left, 0, left + width, portrait.height)), TARGET)

    # 2 · The wide plate for the workflow's Stage 01 card. Same source — the
    #     repository has exactly one photoreal walking frame — but the whole
    #     width, a warmer and higher-contrast grade and no vignette treatment,
    #     so the two do not read as the same shot. Listed in
    #     public/assets/images/capture/README.md as the first slot to replace
    #     with a dedicated asset.
    save(grade(source, 0.55, 1.10, 1.06), WIDE_TARGET)

    # 3 · The walker's segmentation, traced from the wide plate.
    build_mask()


# ── The walker's foreground mask ─────────────────────────────────────────────
#
# Wherever the site says SILHOUETTE beside a frame it has to show a segmentation
# of THAT frame, not a drawn body. This step traces the walker out of the wide
# plate by luminance against its local background and writes the outline as a
# TypeScript module (src/components/visuals/capture-mask.ts) that every figure
# reads through visuals/capture-plate.ts. Deterministic: the same plate always
# produces the same path, so the module is committed and diff-checked.
#
# Needs numpy, scipy and scikit-image. If they are missing the plates are still
# built and the mask step is skipped with a note — the committed module stands.

MASK_TARGET = ROOT / "src/components/visuals/capture-mask.ts"


def build_mask() -> None:
    try:
        import numpy as np
        from scipy import ndimage as ndi
        from skimage import measure, morphology
    except ImportError as exc:  # pragma: no cover - environment dependent
        print(f"mask step skipped ({exc.name} not installed); capture-mask.ts left as committed")
        return

    a = np.asarray(Image.open(WIDE_TARGET).convert("RGB")).astype(float)
    lum = a.mean(axis=2)
    bg = ndi.uniform_filter(lum, size=71)
    # The jacket and trousers are far darker than the wall; the floor shadow
    # between the feet is not, so the floor band uses stricter thresholds.
    loose = (lum < bg - 18) & (lum < 125)
    strict = (lum < bg - 30) & (lum < 100)
    rows = np.arange(lum.shape[0])[:, None]
    fg = np.where(rows > 430, strict, loose)
    fg = morphology.remove_small_objects(fg, max_size=150)
    fg = morphology.closing(fg, morphology.disk(3))
    # Highlights on the hand and the thigh are holes; the gap between the legs
    # is open to the floor and is not.
    fg = morphology.remove_small_holes(fg, max_size=1400)
    labels = measure.label(fg)
    largest = max(measure.regionprops(labels), key=lambda r: r.area)
    mask = labels == largest.label
    mask = morphology.opening(mask, morphology.disk(1))
    # The head meets the body through a neck a few pixels wide, and after the
    # opening that join can be diagonal-only — which the contour tracer treats
    # as two regions, and the head falls off the outline. One pixel of growth
    # makes the join solid; every remaining contour is emitted, longest first,
    # so nothing the mask contains can be dropped.
    mask = ndi.binary_dilation(mask, iterations=1)
    contours = sorted(measure.find_contours(mask.astype(float), 0.5), key=len, reverse=True)
    contours = [c for c in contours if len(c) > 40]
    loops = []
    points = 0
    for contour in contours:
        simplified = measure.approximate_polygon(contour, tolerance=0.9)
        pts = [(round(float(c), 1), round(float(r), 1)) for r, c in simplified]
        points += len(pts)
        loops.append("M" + " L".join(f"{x} {y}" for x, y in pts) + " Z")
    path = " ".join(loops)
    ys, xs = np.where(mask)
    # The outline must reach as far as the mask does, or a part of the person
    # has been lost between the two.
    px = [float(v) for loop in loops for v in loop.replace("M", "").replace("Z", "").replace("L", "").split()[0::2]]
    py = [float(v) for loop in loops for v in loop.replace("M", "").replace("Z", "").replace("L", "").split()[1::2]]
    assert abs(min(py) - ys.min()) <= 1.5 and abs(max(py) - ys.max()) <= 1.5, ("contour lost part of the mask", min(py), ys.min(), max(py), ys.max())
    assert abs(min(px) - xs.min()) <= 1.5 and abs(max(px) - xs.max()) <= 1.5, ("contour lost part of the mask", min(px), xs.min(), max(px), xs.max())

    MASK_TARGET.write_text(
        "/**\n"
        " * THE WALKER'S FOREGROUND MASK — derived, not drawn.\n"
        " *\n"
        " * A binary segmentation of the site's one photoreal walking frame\n"
        " * (public/assets/images/capture/capture-walk-wide.jpg, 688 × 516), traced to a\n"
        " * polygon. It is what a foreground segmenter returns for that frame: the\n"
        " * person, cut out along the real edge of jacket, trousers and hair, with the\n"
        " * gap between the legs open and the hands and feet where the photograph has\n"
        " * them. Nothing here was placed by hand.\n"
        " *\n"
        " * GENERATED by the mask step of scripts/build-capture-plate.py from the\n"
        " * plate's own luminance against its local background (loose thresholds for\n"
        " * the body, strict ones in the floor band where the shadow lies), the largest\n"
        " * component kept, small holes closed, the 0.5 iso-contour simplified at 0.9 px.\n"
        " * Coordinates are wide-plate pixels; the portrait cut is the same frame\n"
        " * shifted 142 px, which `plateFit` in capture-plate.ts accounts for.\n"
        " * Re-run the script after replacing the source; do not edit the numbers.\n"
        " */\n"
        "export const WALKER_MASK_PATH =\n"
        f'  "{path}";\n'
        "\n"
        "/** The mask's extent in wide-plate pixels. */\n"
        f"export const WALKER_MASK_BBOX = {{ x0: {int(xs.min())}, y0: {int(ys.min())}, x1: {int(xs.max())}, y1: {int(ys.max())} }} as const;\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"{MASK_TARGET.relative_to(ROOT)}  {points} points in {len(loops)} loop(s)  bbox {int(xs.min())},{int(ys.min())}–{int(xs.max())},{int(ys.max())}")


if __name__ == "__main__":
    main()
