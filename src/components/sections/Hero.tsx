import { HERO_SCENE } from "@/data/home-hero";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import styles from "./homehero.module.css";

/**
 * THE HOMEPAGE HERO — one approved scene per theme, every word real.
 * =============================================================================
 * This was a three-panel panoramic composition: GaitAI | MobilityCare |
 * SecureVision cut by two diagonals, a drawn pose overlay on each, an
 * eyebrow and a message per panel, and — in light — a 1.2 MB banner with
 * the headline, the pills and the diagonals painted into the pixels.
 *
 * The founder replaced the artwork (2026-09-24) with ONE CLEAN PHOTOGRAPH
 * PER THEME: the same atrium in daylight and at night, a clinician walking
 * with a patient, an officer, a movement trace through the room, and no
 * type or UI baked into either file. The brief was that the picture tells
 * the story and the words are code.
 *
 * So the composition here is deliberately small: the picture, a scrim only
 * under the words, the headline, the two supporting lines and a scroll cue.
 * Nothing is drawn over the photograph, and nothing repeats the site header
 * that sits above it.
 *
 * ── ONE FILE FETCHED, CHOSEN BEFORE PAINT ─────────────────────────────────
 * `ThemePicture` carries a dark and a light candidate and resolves the site's
 * own theme class in an inline script while the HTML is still parsing, so a
 * dark visitor never downloads the daylight scene and there is no flash of
 * the other theme's art. The picture is `priority`: in both themes it is the
 * LCP element. It is `aria-hidden` with an empty alt on purpose — the
 * headline below it is real text, and giving the picture the same words
 * would have a screen reader announce the hero twice.
 *
 * ── THE FIRST VIEWPORT MAKES A STATEMENT, IT DOES NOT OFFER A MENU ────────
 * The hero used to end in a row of three pills — Explore GaitAI, Explore
 * MobilityCare, Explore SecureVision — which made the opening screen a
 * chooser: three destinations competing with the sentence that was supposed
 * to say what the company is. The founder removed the row (2026-09-24) and
 * asked for nothing in its place.
 *
 * So there is no CTA in the hero at all, by design. MobilityCare and
 * SecureVision are reached from their own sections and cards further down
 * the page — `Verticals` and `FeaturedProducts` both carry the links, with
 * the context a bare pill never had — and `/#overview`, which the first pill
 * used to point at, is still the anchor at the foot of this section, so the
 * header and any deep link that targets it land exactly where they did.
 *
 * What replaces the row is height, not another control: the copy keeps its
 * vertical centring, so removing roughly five rems of pills closes the gap
 * from both ends at once rather than leaving a hole under the last line, and
 * the scroll cue at the foot tells the reader there is a page below without
 * asking them to decide anything. The cue is decorative in the strict sense
 * — `aria-hidden`, not a link, not focusable — because the section beneath
 * it is the next thing in the document anyway.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="home-hero-title"
      className={`relative w-full ${styles.hero}`}
    >
      <ThemePicture
        className={styles.photo}
        sources={[
          {
            type: "image/webp",
            darkSrcSet: `${HERO_SCENE.darkNarrowSrc} 1200w, ${HERO_SCENE.darkSrc} ${HERO_SCENE.width}w`,
            lightSrcSet: `${HERO_SCENE.lightNarrowSrc} 1200w, ${HERO_SCENE.lightSrc} ${HERO_SCENE.width}w`,
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

      {/* Readability only, and only where the words are: a horizontal wash
          that is gone by 62% of the width, so the people and the movement
          trace are never behind it. See homehero.module.css. */}
      <div aria-hidden="true" className={styles.scrim} />

      <div className={`container-wide ${styles.inner}`}>
        <div className={styles.copy}>
          <h1 id="home-hero-title" className={styles.title}>
            {HERO_SCENE.lead}
            <span className={styles.accent}>{HERO_SCENE.accent}</span>
          </h1>
          <p className={styles.lede}>{HERO_SCENE.lede}</p>
          <p className={styles.support}>{HERO_SCENE.support}</p>
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
