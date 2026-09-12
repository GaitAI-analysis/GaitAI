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


if __name__ == "__main__":
    main()
