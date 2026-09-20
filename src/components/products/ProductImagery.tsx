import type { ProductImageAsset, ProductImages } from "@/data/product-images";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { assetPath } from "@/lib/paths";

function srcSet(asset: ProductImageAsset): string {
  return asset.variants.map(({ src, width }) => `${assetPath(src)} ${width}w`).join(", ");
}

/**
 * THE CARD PHOTOGRAPH IS THE THEME'S HERO, CROPPED TO 4:3.
 *
 * The catalogue used to show the single `card.webp` in both themes. Those
 * files are real photographs, so each is EITHER a daylight scene OR a night
 * scene (2026-09-20 review of all twelve MobilityCare sets: three daylight,
 * nine dusk) — a light page carried nine night-time tiles and a dark page
 * three daylight ones. No card asset is neutral, so none is shown; the card
 * files stay in the registry for the audit trail and nothing else.
 *
 * The rule is the one the detail pages already follow: light theme →
 * `light-hero` ladder, dark theme → `dark-hero` ladder, chosen before first
 * paint from the site's own theme class and re-rendered on toggle, through
 * the same `ThemePicture` — never a second theme detector for images.
 *
 * FRAMING. The heroes are 16:9 and the tile is 4:3, so `object-fit: cover`
 * drops the outer sixth of each side. `heroPosition` is where the subject
 * stands in the photograph (reviewed per product in the manifest), so it is
 * the anchor that keeps the person inside the crop; `cardPosition` described
 * the retired card composition and is not used.
 *
 * RUNGS. `sizes` describes the tile's real width times the cover factor
 * (16:9 into 4:3 ≈ 1.33), so the browser picks the 480 rung on phones, 768 on
 * tablets and desktop tiles, and only reaches the 1024 rung on a wide grid —
 * never the full hero for a card.
 */
export function ProductCardImage({ images }: { images: ProductImages }) {
  const hero = images.assets.heroDark;
  // A wide source needs extra pixels when it fills a 4:3 tile with object-cover.
  const coverScale = Math.max(1, (hero.width / hero.height) / (4 / 3));
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl" data-product-card-image>
      <ThemePicture
        sources={[{ type: "image/webp", darkSrcSet: srcSet(images.assets.heroDark), lightSrcSet: srcSet(images.assets.heroLight) }]}
        darkSrc={images.heroDark}
        lightSrc={images.heroLight}
        sizes={`(min-width: 1320px) ${Math.ceil(400 * coverScale)}px, (min-width: 1024px) calc((100vw - 128px) / 3 * ${coverScale}), (min-width: 640px) calc((100vw - 80px) / 2 * ${coverScale}), calc((100vw - 40px) * ${coverScale})`}
        alt={images.alt}
        width={hero.width}
        height={hero.height}
        /* The hover lift lives on the <picture>, so the photograph scales
           inside the clipped tile exactly as the old <img> did. */
        className="block h-full w-full transition-transform duration-500 motion-safe:group-hover:scale-[1.025] [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:[object-position:var(--product-card-position)]"
        style={{ "--product-card-position": images.heroPosition } as React.CSSProperties}
      />
    </div>
  );
}

export function ProductHeroImage({ images }: { images: ProductImages }) {
  return (
    <div
      data-product-hero-image
      className={`relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 lg:max-h-[38rem] ${images.heroWide ? "lg:aspect-[4/3]" : "lg:aspect-[4/5]"}`}
    >
      <ThemePicture
        sources={[{ type: "image/webp", darkSrcSet: srcSet(images.assets.heroDark), lightSrcSet: srcSet(images.assets.heroLight) }]}
        darkSrc={images.heroDark}
        lightSrc={images.heroLight}
        // Account for the full photograph width when object-cover crops the
        // desktop portrait panel; otherwise srcset would select a soft image.
        sizes={images.heroWide
          ? "(min-width: 1320px) 720px, (min-width: 1024px) 60vw, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
          : "(min-width: 1320px) 1320px, (min-width: 1024px) 110vw, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"}
        alt={images.alt}
        width={images.assets.heroDark.width}
        height={images.assets.heroDark.height}
        priority
        className="block h-full w-full [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:[object-position:var(--product-hero-position)]"
        style={{ "--product-hero-position": images.heroPosition } as React.CSSProperties}
      />
    </div>
  );
}
