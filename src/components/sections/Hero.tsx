import { HERO_SCENE } from "@/data/home-hero";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import { HeroOptions } from "./HeroOptions";
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
 * whole. From 1024px the section frames 82% of its height: 11% off the top
 * (sky), 7% off the bottom (floor), for a tight composition; the picture
 * is raised inside the frame, not edited. The caption is placed in viewport-width
 * units off the same box, so it sits where the artwork left room for it at
 * every desktop width. Below 1024px the caption moves above the picture,
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
      </div>

      <div className={styles.stage}>
        {/* One file per theme, chosen before first paint — a dark visitor
            never downloads the daylight picture, and vice versa. */}
        <ThemePicture
          className={styles.photo}
          sources={[
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
        {/* The digital human is the artwork's own still figure. The puppet
            walk (HeroWalk, 680c4ad) was rejected by the founder on
            2026-09-24 and removed; any motion for it is chosen from preview
            options first, never shipped as an experiment. */}
        <HeroOptions />
      </div>

      {/* `/#overview` lands here: the foot of the hero, so the page scrolls
          to the line where the next section begins. */}
      <span id="overview" aria-hidden="true" className={styles.anchor} />

      {/* Keeps the floating Ask GaitAI launcher off the copy in short
          windows — see HeroLauncherGuard. */}
      <HeroLauncherGuard />
    </section>
  );
}
