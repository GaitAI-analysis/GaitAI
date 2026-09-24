import Link from "next/link";
import { HERO_SCENE } from "@/data/home-hero";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import { HeroMotion } from "./HeroMotion";
import styles from "./homehero.module.css";

/**
 * THE HOMEPAGE HERO — one scene per theme, every word real.
 * =============================================================================
 * DARK is the night atrium photograph (2026-09-24): a clinician walking with a
 * patient, an officer, a movement trace, no type baked in. Unchanged.
 *
 * LIGHT (2026-09-24, later) is the founder's wide three-zone artwork — public
 * space with SecureVision tracking, a MobilityCare patient and clinician, and
 * the walking model figure with its metrics board — brought to life as an
 * 8-second seamless loop (`HeroMotion`). The still is the loop's first frame,
 * so it is also the LCP element and the reduced-motion answer. What moves is
 * deliberately small, and every figure is the artwork's own pixels: the
 * model figure and the photographed people carry a subtle gait (small warps
 * of the supplied image, never a substitute figure), their joint points
 * pulse, light travels along the model's arcs, and the boards — which carry
 * the approved values verbatim — drift their bars and waveforms. The
 * homepage copy is never in the film: it is the DOM below at every width.
 *
 * ── LAYOUT ────────────────────────────────────────────────────────────────
 * The light artwork is a 3.12:1 panorama, not a full-screen photograph, so on
 * the panoramic widths (≥1280px) the hero takes the artwork's own height
 * (with a floor) and anchors it to its right edge; the copy sits in the haze
 * band on the left. Below 1280px the copy comes first and the artwork is a
 * strip beneath it — a panorama behind a phone's full-width headline would
 * put every person under the words. Dark keeps its full-bleed layout.
 *
 * ── ONE FILE FETCHED, CHOSEN BEFORE PAINT ─────────────────────────────────
 * `ThemePicture` carries a dark and a light candidate and resolves the site's
 * own theme class in an inline script while the HTML is still parsing, so a
 * dark visitor never downloads the daylight scene and there is no flash of
 * the other theme's art. The picture is `aria-hidden` with an empty alt on
 * purpose — the headline below it is real text.
 *
 * ── TWO ACTIONS ───────────────────────────────────────────────────────────
 * The founder asked for two calls to action (2026-09-24, reversing the
 * earlier "no CTA" hero): Explore GaitAI (the foot of the hero, `/#overview`,
 * where the page's own story begins) and See how it works (`/#technology`,
 * the HowItWorks journey). Two, not three product pills: the products are
 * still reached from `Verticals` and `FeaturedProducts` below.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="home-hero-title"
      className={`relative w-full ${styles.hero}`}
    >
      {/* The picture and the film share one box so they crop identically:
          absolute behind the copy on the panoramic layout, a strip under it
          on narrow light screens. */}
      <div className={styles.media}>
        <ThemePicture
          className={styles.photo}
          sources={[
            {
              type: "image/webp",
              darkSrcSet: `${HERO_SCENE.darkNarrowSrc} 1200w, ${HERO_SCENE.darkSrc} ${HERO_SCENE.width}w`,
              lightSrcSet: `${HERO_SCENE.lightNarrowSrc} 1200w, ${HERO_SCENE.lightSrc} 2403w`,
            },
          ]}
          darkSrc={HERO_SCENE.darkSrc}
          lightSrc={HERO_SCENE.lightSrc}
          sizes="100vw"
          alt=""
          width={HERO_SCENE.width}
          height={HERO_SCENE.height}
          priority
        />
        <HeroMotion
          className={styles.motion}
          webm={HERO_SCENE.lightMotion.lightAlt}
          mp4={HERO_SCENE.lightMotion.light}
        />
      </div>

      {/* Readability only, and only where the words are. See
          homehero.module.css. */}
      <div aria-hidden="true" className={styles.scrim} />

      <div className={`container-wide ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{HERO_SCENE.eyebrow}</p>
          <h1 id="home-hero-title" className={styles.title}>
            {HERO_SCENE.title[0]}
            <br />
            {HERO_SCENE.title[1]}{" "}
            <span className={styles.accent}>
              {HERO_SCENE.accent[0]}
              <br />
              {HERO_SCENE.accent[1]}
            </span>
          </h1>
          <p className={styles.support}>
            {HERO_SCENE.support[0]} <br className={styles.wideBreak} />
            {HERO_SCENE.support[1]}
          </p>
          <div className={styles.actions}>
            <Link href={HERO_SCENE.primary.href} className={`${styles.btn} ${styles.primary}`}>
              {HERO_SCENE.primary.label}
              <span aria-hidden="true" className={styles.arrow}>
                →
              </span>
            </Link>
            <Link href={HERO_SCENE.secondary.href} className={`${styles.btn} ${styles.secondary}`}>
              {HERO_SCENE.secondary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* The scroll cue. It is a child of the SECTION, not of the centred
          copy, so it sits at the foot of the hero however tall the window
          is; `container-wide` inside it puts the hairline on the same left
          edge as the headline, inside the scrim, where it reads in both
          themes instead of fighting the photograph. */}
      <div aria-hidden="true" className={`container-wide ${styles.cue}`}>
        <span className={styles.cueTrack} />
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
