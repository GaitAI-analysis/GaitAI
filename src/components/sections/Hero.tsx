import { HERO_SCENE } from "@/data/home-hero";
import { assetPath } from "@/lib/paths";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import { HeroOptions } from "./HeroOptions";
import styles from "./homehero.module.css";

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
 * whole. From 1024px the section frames 77% of its height: 13% off the top
 * (sky), 10% off the bottom (floor), for a tight composition; the picture
 * is raised inside the frame, not edited. The caption is placed in viewport-width
 * units off the same box, so it sits where the artwork left room for it at
 * every desktop width. Below 1024px the caption moves above the picture,
 * where it can be read, and the picture follows at full width.
 */
export function Hero() {
  return (
    <section aria-labelledby="home-hero-title" className={styles.hero}>
      <div className={styles.caption}>
        <h1 id="home-hero-title" className={styles.title}>
          <span className={styles.lead}>{HERO_SCENE.title}</span>{" "}
          <span className={styles.accent}>{HERO_SCENE.accent}</span>
        </h1>
        <span aria-hidden="true" className={styles.rule} />
        <p className={styles.support}>{HERO_SCENE.support}</p>
      </div>

      <div className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static export; the file is pre-sized */}
        <img
          className={styles.photo}
          src={assetPath(HERO_SCENE.src)}
          srcSet={`${assetPath(HERO_SCENE.narrowSrc)} 1200w, ${assetPath(HERO_SCENE.src)} ${HERO_SCENE.width}w`}
          sizes="100vw"
          width={HERO_SCENE.width}
          height={HERO_SCENE.height}
          alt=""
          aria-hidden="true"
          decoding="sync"
          fetchPriority="high"
        />
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
