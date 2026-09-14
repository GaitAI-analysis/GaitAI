import { ThemeImage } from "@/components/ui/ThemeMedia";
import styles from "./hero.module.css";

/**
 * THE HOMEPAGE HERO — one finished banner, shown whole.
 * =============================================================================
 * The site owner supplied two hand-finished compositions, one per theme:
 * GaitAI | MobilityCare | SecureVision as three panels in a single frame,
 * with the platform headline, the product questions and the three calls to
 * action already set inside the artwork. Nothing is drawn over it — no second
 * headline, no CTA, no pose graphics — and the artwork is never cropped,
 * re-graded or regenerated. The only thing above it is the global navbar.
 *
 * ONE HERO, TWO FILES. `ThemeImage` resolves the theme's file before paint
 * (an inline bootstrap reads `html.light`), swaps it on the theme toggle
 * without a reload, and requests exactly one image. The three-frame slider,
 * its arrows, dots, autoplay control and per-frame assets are gone.
 *
 * SIZING. Full available width, `height: auto`, and the theme's own aspect
 * ratio reserved in CSS so the box is laid out before the bytes arrive (no
 * CLS). No `cover`: every panel carries meaning, so the composition is never
 * cut. Below 768px the whole banner would shrink to ~160px tall and its type
 * to a few pixels, so there it keeps a readable width inside a horizontal
 * pan that snaps to the three panels — nothing is cropped away, and the page
 * itself never scrolls sideways (`overscroll-behavior-x: contain`).
 *
 * THE HEADLINE IS IN THE PICTURE, so the document keeps a real `<h1>` that
 * says the same words for assistive technology and for search, visually
 * hidden. The image's own alt names the three panels.
 */
export function Hero() {
  return (
    <section
      id="platform"
      aria-labelledby="home-hero-title"
      className={`relative w-full ${styles.hero}`}
    >
      <h1 id="home-hero-title" className="sr-only">
        One movement intelligence platform for health, safety and identity —
        GaitAI, MobilityCare and SecureVision.
      </h1>
      <div className={styles.frame}>
        <ThemeImage
          mediaKey="platformHero"
          alt="GaitAI movement intelligence platform: three panels — GaitAI, asking what movement can tell us before we can see it; MobilityCare, earlier insight and healthier tomorrows; SecureVision, safer spaces and more human tomorrows."
          priority
          sizes="100vw"
          className={styles.img}
        />
      </div>
    </section>
  );
}
