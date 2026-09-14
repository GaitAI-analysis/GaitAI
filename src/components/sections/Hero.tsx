import Link from "next/link";
import { ThemeImage } from "@/components/ui/ThemeMedia";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import styles from "./hero.module.css";

/**
 * THE HOMEPAGE HERO — the approved artwork, with its three buttons made real.
 * =============================================================================
 * One 1774×887 composition per theme: GaitAI | MobilityCare | SecureVision as
 * three panels, headline, sublines and three calls to action all set inside
 * the picture. It is shown whole and unaltered — no zoom, no second headline,
 * no logo or navigation of its own; the global navbar above it is the only
 * chrome. How it fills the hero at each width is hero.module.css's business. `ThemeImage` picks the theme's file before first paint and
 * swaps it on the toggle without a reload.
 *
 * THE BUTTONS ARE LINKS. The three pills in the artwork are covered by real
 * anchors, positioned as PERCENTAGES of the canvas (see hero.module.css), so
 * they track the picture at every width instead of drifting with a pixel
 * offset. They render no text of their own — the artwork already carries it
 * — and expose it through `aria-label`; each carries one decorative span, the
 * glass surface that lights and lifts on hover. Their targets:
 *
 *   Explore GaitAI        → /#overview  (an anchor at the foot of the hero)
 *   Explore MobilityCare  → /mobilitycare/
 *   Explore SecureVision  → /securevision/
 *
 * ACCESSIBILITY. The copy lives in the pixels, so the document keeps a real,
 * visually hidden heading and subline saying the same thing. The image itself
 * is marked decorative (`alt=""`) so the headline is announced once, not
 * twice; the pose points and scene are not described — they are decoration.
 */
const CTAS = [
  { id: "gaitai", href: "/#overview", label: "Explore GaitAI" },
  { id: "mobilitycare", href: "/mobilitycare/", label: "Explore MobilityCare" },
  { id: "securevision", href: "/securevision/", label: "Explore SecureVision" },
] as const;

export function Hero() {
  return (
    <section
      id="platform"
      aria-labelledby="home-hero-title"
      className={`relative w-full ${styles.hero}`}
    >
      <h1 id="home-hero-title" className="sr-only">
        One movement intelligence platform for health, safety and identity.
        GaitAI, MobilityCare and SecureVision.
      </h1>
      <p className="sr-only">
        From everyday movement to meaningful insight — GaitAI: movement,
        understood. MobilityCare: better movement, better care. SecureVision:
        safer spaces, privacy-aware intelligence.
      </p>

      <div className={styles.frame}>
        <div className={styles.canvas}>
          <ThemeImage
            mediaKey="platformHero"
            alt=""
            priority
            sizes="100vw"
            className={styles.img}
          />
          {/* The three calls to action, over the pills in the picture. */}
          <nav aria-label="Explore the platform" className={styles.ctas}>
            {CTAS.map((cta) => (
              <Link
                key={cta.id}
                href={cta.href}
                aria-label={cta.label}
                data-cta={cta.id}
                className={styles.cta}
              >
                {/* The button surface. The pill is painted into the artwork,
                    so the interaction is a sheet of glass laid exactly over
                    it — see `.skin` in hero.module.css. Decorative: the
                    link's name is its aria-label. */}
                <span aria-hidden="true" className={styles.skin} />
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {/* The `/#overview` target — see .anchor in hero.module.css. */}
      <span id="overview" aria-hidden="true" className={styles.anchor} />
      {/* Keeps the floating Ask GaitAI launcher off the SecureVision copy in
          short windows — see HeroLauncherGuard. */}
      <HeroLauncherGuard />
    </section>
  );
}
