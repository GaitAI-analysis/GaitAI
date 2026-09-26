import { HERO_LIGHT_BANNER } from "@/data/home-hero";
import { ThemePicture } from "@/components/ui/ThemePicture";
import styles from "./hero.module.css";

/**
 * THE LIGHT HERO'S ARTWORK — A BACKGROUND, AND NOTHING ELSE.
 * =============================================================================
 * The light hero used to be one supplied picture with the headline, the three
 * eyebrows, the messages and the three pills already painted into it. That
 * meant the words on the largest screens were pixels: unselectable,
 * untranslatable, invisible to search, impossible to restyle, and the reason
 * two rounds of accent-colour work had no effect above 1024px.
 *
 * The founder has now supplied a CLEAN composition (2026-09-23): the same
 * three panels, the same people, the rehabilitation and public-space scenes,
 * the diagonal separators and the painted gait tracking dots — and no type of
 * any kind. Verified on the file before it shipped: the three bands that used
 * to hold the headline, the eyebrow row and the pill row are glass, floor, a
 * suitcase wheel and shoes.
 *
 * So this layer is now purely the stage's photograph. Every word and every
 * link in the light hero is the SAME DOM that the dark hero has always used —
 * Hero.tsx renders it, `.canvas` is no longer hidden in light, and the
 * per-panel photographs, pose overlays and drawn dividers step aside there
 * because this one picture already carries all three. The picture is
 * decorative in the strict sense: its `alt` is empty and it is aria-hidden,
 * because the headline it used to speak is real text again, directly above it.
 *
 * ONE FILE, NO DARK TWIN, NO PHONE DOWNLOAD. `ThemePicture` gets no dark
 * candidate, so a dark visitor never fetches it; the light candidate is a
 * `<source>` gated on `(min-width: 1024px)` with an empty fallback `src`, so a
 * phone in light mode — where this layer is off and the native panels show —
 * does not download it either. On the panoramic layout a light visitor gets it
 * before first paint from the same inline bootstrap the panel photographs use,
 * and it is swapped in and out on a theme toggle without a reload.
 *
 * THE FILE is public/images/hero/home-hero-light-clean.webp, the approved
 * source at its native 1672x941 (a pixel-identical lossless master sits beside
 * it as home-hero-light-clean-master.webp). Replace the file to replace the
 * picture; no coordinates in this component depend on its content any more,
 * which is the point of it carrying no type.
 */
export const HERO_LIGHT_BANNER_SRC = HERO_LIGHT_BANNER.src;

export function HeroLightBanner() {
  return (
    <div className={styles.banner} data-hero-light-banner aria-hidden="true">
      <ThemePicture
        className={styles.bannerPhoto}
        sources={[
          {
            type: "image/webp",
            /* Must match the `.banner` breakpoint in hero.module.css. */
            media: "(min-width: 1024px)",
            darkSrcSet: "",
            lightSrcSet: `${HERO_LIGHT_BANNER.src} ${HERO_LIGHT_BANNER.width}w`,
          },
        ]}
        darkSrc=""
        lightSrc=""
        sizes="100vw"
        alt=""
        width={HERO_LIGHT_BANNER.width}
        height={HERO_LIGHT_BANNER.height}
        priority
      />
    </div>
  );
}
