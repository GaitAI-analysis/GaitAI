import type { UseCaseImageAsset, UseCaseImages } from "@/data/use-case-images";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { assetPath } from "@/lib/paths";
import styles from "./usecases.module.css";

/**
 * THE ENVIRONMENT PHOTOGRAPH ON A USE CASE CARD.
 *
 * One photograph of the place the use case happens. On a collapsed card it is
 * a 4:3 band across the top — the product-card ratio, so the two catalogues
 * read as one system, and the ratio that shows a standing person whole: five of
 * the seventeen sources are 4:3 full-body scenes, and a wider band would crop
 * through heads or feet. The 16:9 sources give up width instead, which is the
 * forgiving axis, with a per-theme `object-position` keeping every foreground
 * figure inside the crop.
 *
 * THEME. Both roles are real photographs of the same place — a night frame and
 * a daylight frame — never one frame filtered twice. That is the whole reason
 * this goes through `ThemePicture`: it resolves the theme in an inline script
 * before the first paint, so a light visitor never sees the night frame flash,
 * and it follows the toggle afterwards without a reload. `display:none` does
 * not cancel a request, so rendering both and hiding one would fetch two
 * photographs per card and seventeen cards would pay for it.
 *
 * SIZES FOLLOW THE CARD'S STATE. A collapsed card is a third of the grid; an
 * expanded one spans the row, and at ≥900px the photograph becomes a tile
 * beside the head at roughly two-fifths of that. The browser picks its rung
 * from `sizes`, so `sizes` has to describe the box the image is actually in,
 * or an opened card paints the 480px rung at 470px — sharp — and a full-width
 * one would have painted it at 1200px. Changing `sizes` after load makes the
 * browser re-select and fetch the larger rung; that is the intended behaviour,
 * and it is what the expanded state relies on.
 *
 * NOTHING IS EAGER. The grid sits below the hero, the audience strip and the
 * environment panel; no card is above the fold at any width, so every band is
 * lazy at low priority. `priority` exists for a surface where that stops being
 * true, and is not used here.
 */

function srcSet(asset: UseCaseImageAsset): string {
  return asset.variants
    .map(({ src, width }) => `${assetPath(src)} ${width}w`)
    .join(", ");
}

/* Collapsed: the card's full width. One column under 720px, two to 1180px,
   three above, inside a 1320px container whose side padding is 20 / 32 / 48px
   at the 0 / 640 / 1024 breakpoints, with 18px gutters. */
const COLLAPSED_SIZES = [
  "(min-width: 1320px) 396px",
  "(min-width: 1180px) calc((100vw - 132px) / 3)",
  "(min-width: 1024px) calc((100vw - 114px) / 2)",
  "(min-width: 720px) calc((100vw - 82px) / 2)",
  "(min-width: 640px) calc(100vw - 64px)",
  "calc(100vw - 40px)",
].join(", ");

/* Expanded: a two-fifths tile beside the head from 900px, the card's full
   width below that. The 900px value is deliberately generous — it fetches the
   next rung up rather than the one below. */
const EXPANDED_SIZES = [
  "(min-width: 1320px) 472px",
  "(min-width: 900px) calc((100vw - 96px) * 0.4)",
  "(min-width: 640px) calc(100vw - 64px)",
  "calc(100vw - 40px)",
].join(", ");

export function UseCaseMedia({
  images,
  expanded = false,
  priority = false,
}: {
  images: UseCaseImages;
  expanded?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={styles.media} data-use-case-media>
      <ThemePicture
        sources={[
          {
            type: "image/webp",
            darkSrcSet: srcSet(images.assets.dark),
            lightSrcSet: srcSet(images.assets.light),
          },
        ]}
        darkSrc={images.dark}
        lightSrc={images.light}
        sizes={expanded ? EXPANDED_SIZES : COLLAPSED_SIZES}
        alt={images.alt}
        width={images.assets.dark.width}
        height={images.assets.dark.height}
        priority={priority}
        className={styles.mediaPicture}
        style={
          {
            "--uc-media-position": images.objectPosition.dark,
            "--uc-media-position-light": images.objectPosition.light,
          } as React.CSSProperties
        }
      />
      {/* A single accent-tinted wash, so the photograph meets the card's own
          gradient instead of ending at a hard edge. Pointer-events none: the
          stretched link underneath still owns the whole surface. */}
      <span aria-hidden="true" className={styles.mediaVeil} />
    </div>
  );
}
