import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HERO_PANELS, HERO_SCENE } from "@/data/home-hero";
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
 * under the words, the headline, the two supporting lines, and the three
 * product links. Nothing is drawn over the photograph, and nothing repeats
 * the site header that sits above it.
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
 * ── THE THREE LINKS KEEP THEIR IDENTITIES ─────────────────────────────────
 * The brief specified a single accent ramp for the headline, but the three
 * products were separated into their own colours in an earlier pass —
 * GaitAI blue, MobilityCare teal, SecureVision cobalt — and flattening them
 * to one blue would undo that silently. They keep their tokens; only the
 * headline takes the ramp. Labels and hrefs still come from HERO_PANELS, so
 * the hero cannot drift from the rest of the site.
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

          <div className={styles.actions}>
            {HERO_PANELS.map((panel, index) => (
              <Link
                key={panel.id}
                href={panel.cta.href}
                data-panel={panel.id}
                data-primary={index === 0 ? "true" : undefined}
                className={styles.action}
              >
                {panel.cta.label}
                <ArrowUpRight aria-hidden="true" className={styles.arrow} />
              </Link>
            ))}
          </div>
        </div>
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
