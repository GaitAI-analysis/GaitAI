import Link from "next/link";
import { HERO_HEADLINE, HERO_PANELS } from "@/data/home-hero";
import { ThemePicture } from "@/components/ui/ThemePicture";
import styles from "./hero.module.css";

/**
 * THE LIGHT-THEME HERO IS ONE SUPPLIED PICTURE.
 * =============================================================================
 * In the dark theme the hero is the native composition in Hero.tsx: three
 * photographs, and every word, pill, divider and pose point drawn as DOM and
 * SVG. For the LIGHT theme the founder supplied a finished banner of the same
 * composition — headline, eyebrows, messages, pills, diagonals and keypoints
 * already in the pixels — and asked for exactly that picture, unaltered. So on
 * the panoramic layout in light mode the native stage is hidden and this
 * banner is shown in its place; nothing is redrawn over it, because the text
 * and buttons it carries are already there.
 *
 * WHAT STAYS REAL. The three "Explore" pills in the picture are pixels, so
 * three transparent links sit exactly over them (the boxes are measured from
 * the file, in its own 1736×906 pixels, and positioned as percentages so they
 * track the picture at any width). Each carries the pill's label as its
 * accessible name and draws a focus ring only when focused from the keyboard.
 * The picture's `alt` is the headline the picture paints, so the section is
 * still named and read when its DOM headline is hidden.
 *
 * PHONES KEEP THE NATIVE HERO in both themes: below 1024px the panels stack
 * and a 2:1 banner would be a strip of unreadable type. The `.banner` rule in
 * hero.module.css is what turns this layer on, and only there.
 *
 * ONE FILE, NO DARK TWIN, NO PHONE DOWNLOAD. `ThemePicture` gets no dark
 * candidates at all, so a dark visitor never downloads the banner; the light
 * candidate is a `<source>` gated on `(min-width: 1024px)` with an EMPTY
 * fallback `src`, so a phone in light mode — where the banner is hidden and
 * the native stage shows — does not download 1.2 MB it will never paint.
 * On the panoramic layout a light visitor gets it before first paint from the
 * same bootstrap the panel photographs use, and it is swapped in and out on
 * toggle without a reload.
 *
 * THE FILE is public/images/hero/home-hero-light.webp, a lossless WebP that is
 * pixel-identical to the supplied PNG (verified: every pixel equal), not a
 * re-render and not a re-grade. Replace the file to replace the picture; the
 * pill boxes below are the only numbers tied to its layout.
 */

/** The picture's own pixel size. */
const BANNER = { width: 1736, height: 906 } as const;

/** The three pills, measured from the file: [x0, y0, x1, y1] in its pixels. */
const PILLS: Record<(typeof HERO_PANELS)[number]["id"], readonly [number, number, number, number]> = {
  gaitai: [60, 783, 289, 836],
  mobilitycare: [661, 788, 941, 837],
  securevision: [1214, 788, 1493, 837],
};

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

export const HERO_LIGHT_BANNER_SRC = "/images/hero/home-hero-light.webp";

export function HeroLightBanner() {
  const alt = `${HERO_HEADLINE.lead} ${HERO_HEADLINE.accentFirst} ${HERO_HEADLINE.accentRest} ${HERO_HEADLINE.lede} ${HERO_HEADLINE.sub}`;
  return (
    <div className={styles.banner} data-hero-light-banner>
      <ThemePicture
        className={styles.bannerPhoto}
        sources={[
          {
            type: "image/webp",
            /* Must match the `.banner` breakpoint in hero.module.css. */
            media: "(min-width: 1024px)",
            darkSrcSet: "",
            lightSrcSet: `${HERO_LIGHT_BANNER_SRC} ${BANNER.width}w`,
          },
        ]}
        darkSrc=""
        lightSrc=""
        sizes="100vw"
        alt={alt}
        width={BANNER.width}
        height={BANNER.height}
        priority
      />
      {HERO_PANELS.map((panel) => {
        const [x0, y0, x1, y1] = PILLS[panel.id];
        return (
          <Link
            key={panel.id}
            href={panel.cta.href}
            aria-label={panel.cta.label}
            className={styles.bannerHit}
            data-banner-hit={panel.id}
            style={{
              left: pct(x0, BANNER.width),
              top: pct(y0, BANNER.height),
              width: pct(x1 - x0, BANNER.width),
              height: pct(y1 - y0, BANNER.height),
            }}
          />
        );
      })}
    </div>
  );
}
