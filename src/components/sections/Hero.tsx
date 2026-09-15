import {
  HERO_CANVAS,
  HERO_DIVIDERS,
  HERO_HEADLINE,
  HERO_PANELS,
} from "@/data/home-hero";
import {
  HERO_PANEL_FORMATS,
  heroPanelById,
  heroPanelFallback,
  heroPanelSrcSet,
} from "@/lib/hero-panels";
import { ThemePicture } from "@/components/ui/ThemePicture";
import { HeroCta } from "./HeroCta";
import { HeroPose } from "./HeroPose";
import { HeroLauncherGuard } from "./HeroLauncherGuard";
import styles from "./hero.module.css";

/**
 * THE HOMEPAGE HERO — the approved composition, built rather than photographed.
 * =============================================================================
 * GaitAI | MobilityCare | SecureVision as three panels of one panoramic
 * picture, cut by two diagonals, with the headline over the first and an
 * eyebrow, a message and a call to action over each.
 *
 * ── WHAT CHANGED, AND WHAT DID NOT ────────────────────────────────────────
 * The design did not change. The hero used to be ONE FLATTENED 1774x887 PNG
 * per theme with everything inside it, so on a large or Retina screen the
 * headline, the pills, the diagonals and the cyan pose points were all
 * resampled photographs of type and vector art — visibly soft, and there was no
 * width at which they could be sharp. The composition is now assembled from its
 * parts:
 *
 *   headline, sublines, eyebrows, messages   HTML text
 *   the three calls to action                next/link anchors
 *   the diagonal dividers                    CSS gradients on a skewed line
 *   the pose keypoints                       SVG  (HeroPose)
 *   the scrims that make type legible        CSS gradients
 *   the three scenes                         photographs, and only these
 *
 * Three photographs replace two flattened banners: one per panel, per theme, in
 * AVIF with a WebP fallback, at a ladder of widths behind `srcset`/`sizes`, so
 * a 2560 screen at 2x is served real pixels instead of an upscaled banner. See
 * lib/hero-panels.ts for the boxes and the ladder, and data/home-hero.ts for
 * the composition — every number in both is a pixel of the approved artwork's
 * own canvas, and hero.module.css turns one of those into one CSS length.
 *
 * ── STRUCTURE ─────────────────────────────────────────────────────────────
 * `.frame` is the visible box and does the cropping; `.canvas` is the approved
 * picture's own 1774:887 box and is the coordinate system for everything
 * inside it. Within it there are exactly three layers, and the reason they are
 * separate is that CLIP PATHS CLIP TEXT:
 *
 *   .panel   x3   the photography, each clipped to its own wedge
 *   .dividers     the two lit diagonals
 *   .content      every word and every button, clipped by nothing
 *
 * So no headline can be shaved by the diagonal that happens to pass near it,
 * and no panel's photograph can bleed across a boundary. The pose overlays live
 * INSIDE their panel, because a skeleton belongs to the picture it is measuring
 * and should be cut by the same diagonal.
 *
 * ── THE LCP ───────────────────────────────────────────────────────────────
 * The GaitAI panel is the largest thing in the first viewport, so it is the
 * only photograph fetched eagerly at high priority; the other two follow at
 * low priority. Every picture declares its intrinsic box, so the hero has its
 * full geometry before any image arrives and nothing shifts on load.
 */
export function Hero() {
  return (
    <section
      id="platform"
      aria-labelledby="home-hero-title"
      className={`relative w-full ${styles.hero}`}
    >
      <div className={styles.frame}>
        <div className={styles.canvas}>
          <div className={styles.stage}>
            {HERO_PANELS.map((panel, index) => {
              const asset = heroPanelById[panel.id];
              return (
                <div key={panel.id} className={styles.panel} data-panel={panel.id}>
                  {/* `.art` is the CLIPPED layer: the photograph, its scrim and
                      its pose overlay, cut to this panel's wedge. The story is
                      its sibling and is clipped by nothing, because a clip path
                      would shave the words the diagonal happens to pass near. */}
                  <div className={styles.art}>
                    <ThemePicture
                      className={styles.photo}
                      sources={HERO_PANEL_FORMATS.map((format) => ({
                        type: format.type,
                        darkSrcSet: heroPanelSrcSet(asset, "dark", format.ext),
                        lightSrcSet: heroPanelSrcSet(asset, "light", format.ext),
                      }))}
                      darkSrc={heroPanelFallback(asset, "dark")}
                      lightSrc={heroPanelFallback(asset, "light")}
                      sizes={asset.sizes}
                      alt={asset.alt}
                      width={asset.box.x1 - asset.box.x0}
                      height={HERO_CANVAS.height}
                      priority={index === 0}
                    />
                    <HeroPose panel={panel} />
                  </div>

                  {/* The headline belongs to the GaitAI panel, which is where
                      it sits in the composition — and putting it there is what
                      lets the stacked layout carry it down with that panel's
                      photograph instead of stranding it above all three. */}
                  {index === 0 && (
                    <div className={styles.headline}>
                      {/* The break after "movement" is the approved
                          composition, not a reflow the browser chose: two
                          block lines on the panoramic layout, inline once
                          stacked so the headline wraps to the phone's
                          measure. */}
                      <h1 id="home-hero-title" className={styles.title}>
                        <span className={styles.titleLine}>
                          <span className={styles.titleLead}>
                            {HERO_HEADLINE.lead}
                          </span>{" "}
                          <span className={styles.titleAccent}>
                            {HERO_HEADLINE.accentFirst}
                          </span>
                        </span>{" "}
                        <span className={`${styles.titleLine} ${styles.titleAccent}`}>
                          {HERO_HEADLINE.accentRest}
                        </span>
                      </h1>
                      <p className={styles.lede}>{HERO_HEADLINE.lede}</p>
                      <p className={styles.sub}>{HERO_HEADLINE.sub}</p>
                    </div>
                  )}

                  <div className={styles.story}>
                    {/* Set in the data as the product's real name and
                        uppercased by the stylesheet, so the tracked capitals
                        are a display decision and a screen reader still says
                        "GaitAI". */}
                    <p className={styles.eyebrow}>{panel.eyebrow}</p>
                    <p className={styles.message}>
                      {panel.lines.map((line) => (
                        <span key={line} className={styles.messageLine}>
                          {line}
                        </span>
                      ))}
                    </p>
                    <HeroCta
                      panel={panel.id}
                      href={panel.cta.href}
                      label={panel.cta.label}
                    />
                  </div>
                </div>
              );
            })}

            {/* The two lit diagonals, over every photograph and under every
                word. Their own layer, because they belong to the composition
                rather than to any one panel. */}
            <div className={styles.dividers} aria-hidden="true">
              {HERO_DIVIDERS.map((_, index) => (
                <span key={index} className={styles.divider} data-divider={index + 1} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* `/#overview` lands here: the foot of the hero, so the page scrolls to
          the line where the next section begins. */}
      <span id="overview" aria-hidden="true" className={styles.anchor} />

      {/* Keeps the floating Ask GaitAI launcher off the SecureVision copy in
          short windows — see HeroLauncherGuard. */}
      <HeroLauncherGuard />
    </section>
  );
}
