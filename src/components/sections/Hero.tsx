import { HERO_SCENE } from "@/data/home-hero";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import { HeroOptions } from "./HeroOptions";
import { HeroSignals } from "./HeroSignals";
import { HeroMobile } from "./HeroMobile";
import { HERO_MOBILE } from "@/data/home-hero-mobile";
import styles from "./homehero.module.css";
import haze from "./herohaze.module.css";

/**
 * THE HOMEPAGE HERO — the founder's final artwork, as supplied.
 * =============================================================================
 * One picture in both themes: public space, clinic and the walking model
 * figure, with three option pills painted into it — SecureVision,
 * MobilityCare, Pose analysis. It is shown as it is: not regenerated,
 * recoloured, overlaid or cropped beyond what a short window needs.
 *
 * ── WHAT IS CODE ──────────────────────────────────────────────────────────
 *   - The caption, as real HTML in the empty haze on the left — the painted
 *     caption was inpainted out of the file so the words are never doubled
 *     (see HERO_SCENE in data/home-hero.ts).
 *   - Transparent hotspots on the three painted pills, and the detail panel
 *     each one opens (HeroOptions). Nothing but the picture and the caption
 *     is visible until a pill is pressed.
 *
 * ── GEOMETRY ──────────────────────────────────────────────────────────────
 * The picture keeps its own 1672:941 box at every width — never stretched,
 * never cropped at the sides, so the three pills and the people are always
 * whole. From 1024px the section frames 84% of its height (6% off the top,
 * 10% off the bottom), but never more than the window under the header: a
 * shorter window shrinks the frame toward 70%, so the pills and the walker's
 * shoes stay inside it (homehero.module.css, "THE FRAME, REVISED"). The
 * picture is moved inside the frame, never edited. The caption is centred on
 * the frame and sized in viewport-width units, so it sits where the artwork
 * left room for it at every desktop width. Below 1024px the caption moves above the picture,
 * where it can be read, and the picture follows at full width.
 */
export function Hero() {
  return (
    <section aria-labelledby="home-hero-title" className={styles.hero}>
      {/* Dark only: a soft shade under the caption, over the lit city. */}
      <div aria-hidden="true" className={styles.shade} />
      {/* Dark only: blur, deeper ramp and fog behind the words — see herohaze. */}
      <div aria-hidden="true" className={haze.haze} />

      {/* One caption for both themes. The eyebrow and the dark paragraph are
          dark-only (hidden by CSS in light, so the light hero is exactly as
          approved); no branch in the markup, so nothing can disagree between
          the server HTML and hydration. The dark hero has no calls to action
          by the founder's decision (2026-09-24) — do not add any back. */}
      <div className={styles.caption}>
        <p className={`${styles.eyebrow} ${styles.darkOnly}`}>{HERO_SCENE.dark.eyebrow}</p>
        <h1 id="home-hero-title" className={styles.title}>
          <span className={styles.lead}>{HERO_SCENE.title}</span>{" "}
          <span className={styles.accent}>{HERO_SCENE.accent}</span>
        </h1>
        <span aria-hidden="true" className={styles.rule} />
        <p className={`${styles.support} ${styles.lightOnly}`}>{HERO_SCENE.support}</p>
        <p className={`${styles.support} ${styles.darkOnly}`}>
          {HERO_SCENE.dark.support.join(" ")}
        </p>
        {/* Phones and tablets: one compact sentence, both themes. */}
        <p className={`${styles.support} ${styles.mobileSupport}`}>{HERO_MOBILE.support}</p>
      </div>

      <div className={styles.stage}>
        {/* One file per theme, chosen before first paint — a dark visitor
            never downloads the daylight picture, and vice versa. */}
        <ThemePicture
          className={styles.photo}
          sources={[
            /* Below 1024px this picture is hidden (the phone hero replaces
               it) but an <img> still downloads under display:none — so there
               it resolves to the one full-size file the phone hero's scene
               tiles use, and the page fetches the plate once. */
            {
              type: "image/webp",
              media: "(max-width: 1023px)",
              lightSrcSet: `${HERO_SCENE.src} ${HERO_SCENE.width}w`,
              darkSrcSet: `${HERO_SCENE.dark.src} ${HERO_SCENE.dark.width}w`,
            },
            {
              type: "image/webp",
              lightSrcSet: `${HERO_SCENE.narrowSrc} 1200w, ${HERO_SCENE.src} ${HERO_SCENE.width}w`,
              darkSrcSet: `${HERO_SCENE.dark.narrowSrc} 1200w, ${HERO_SCENE.dark.src} ${HERO_SCENE.dark.width}w`,
            },
          ]}
          lightSrc={HERO_SCENE.src}
          darkSrc={HERO_SCENE.dark.src}
          sizes="100vw"
          alt=""
          width={HERO_SCENE.width}
          height={HERO_SCENE.height}
          priority
        />
        {/* The third panel's digital human is not in the picture any more:
            he is the motion-capture walker HeroOptions mounts over it
            (HeroWalker), and he walks all the time. */}
        <HeroOptions />
        {/* The story layer: SecureVision and MobilityCare as applications of
            the gait engine in the third panel, joined by one thread along the
            floor (HeroSignals). After HeroOptions so it paints over the
            walker's canvas (same z-index 1), under the connectors (2) and the
            dots, pills and rail (3). */}
        <HeroSignals />
      </div>

      {/* Below 1024px: the hero recomposed for a phone (see HeroMobile). */}
      <HeroMobile />

      {/* `/#overview` lands here: the foot of the hero, so the page scrolls
          to the line where the next section begins. */}
      <span id="overview" aria-hidden="true" className={styles.anchor} />

      {/* Keeps the floating Ask GaitAI launcher off the copy in short
          windows — see HeroLauncherGuard. */}
      <HeroLauncherGuard />
    </section>
  );
}
