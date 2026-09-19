import type { ProductImageAsset, ProductImages } from "@/data/product-images";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { assetPath } from "@/lib/paths";

function srcSet(asset: ProductImageAsset): string {
  return asset.variants.map(({ src, width }) => `${assetPath(src)} ${width}w`).join(", ");
}

export function ProductCardImage({ images }: { images: ProductImages }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl" data-product-card-image>
      {/* Static export has no Next image server. Pre-encoded srcsets provide
          responsive loading without requesting oversized heroes for cards. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath(images.card)}
        srcSet={srcSet(images.assets.card)}
        sizes="(min-width: 1320px) 400px, (min-width: 1024px) calc((100vw - 128px) / 3), (min-width: 640px) calc((100vw - 80px) / 2), calc(100vw - 40px)"
        alt={images.alt}
        width={images.assets.card.width}
        height={images.assets.card.height}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
        style={{ objectPosition: images.cardPosition }}
      />
    </div>
  );
}

export function ProductHeroImage({ images }: { images: ProductImages }) {
  return (
    <div
      data-product-hero-image
      className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 lg:aspect-[4/5] lg:max-h-[38rem]"
    >
      <ThemePicture
        sources={[{ type: "image/webp", darkSrcSet: srcSet(images.assets.heroDark), lightSrcSet: srcSet(images.assets.heroLight) }]}
        darkSrc={images.heroDark}
        lightSrc={images.heroLight}
        // Account for the full photograph width when object-cover crops the
        // desktop portrait panel; otherwise srcset would select a soft image.
        sizes="(min-width: 1320px) 1320px, (min-width: 1024px) 110vw, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"
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
