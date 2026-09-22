import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroSlider } from "@/components/ui/HeroSlider";
import { ctas } from "@/data/content";

/**
 * Hero for /mobilitycare/ — same composition pattern as the SecureVision
 * hero: the background layer fills the hero, a left-biased shade keeps copy
 * readable, and the text/CTA content sits on top, vertically centered.
 *
 * THE BACKGROUND IS TWO SLIDES (components/ui/HeroSlider.tsx), in both
 * themes: the founder's premium clinic picture for the theme (2026-09-22, a
 * light and a dark one) shows first and the theme's clinical-dashboard film
 * is the second slide, cross-faded on a slow clock. The footage's key
 * elements (walking figures, center subject, Clinical Gait Report) stay
 * visible on the right in both.
 *
 * The section itself stays a Server Component; only the slider is client
 * code, and the <video> lives inside it so no re-render here can restart it.
 */

/** The supplied stills, one per theme — each the picture as delivered, no
 *  crop, no grade. The theme picks the file (see HeroSlider); the framing
 *  per file is in globals.css. */
const STILLS = {
  light: {
    src: "/images/hero/mobilitycare-hero-light-premium.webp",
    width: 1672,
    height: 941,
    name: "the MobilityCare clinic picture",
  },
  dark: {
    src: "/images/hero/mobilitycare-hero-dark-premium.webp",
    width: 1672,
    height: 941,
    name: "the MobilityCare evening clinic picture",
  },
} as const;

export function MobilityCareHero() {
  return (
    <section
      aria-labelledby="mobilitycare-hero-title"
      className="mobilitycare-hero"
    >
      {/* Background media layer: still, then film. `eager` means the film's
          source is set while the HTML parses with `preload="metadata"`, so
          in dark the hero starts as early as it always did and a light-mode
          visitor never sees the dark film flash first. The poster follows the
          same choice.

          Reduced motion is handled in CSS (see .mobilitycare-hero__video):
          the video is hidden and the layer keeps the theme's poster as its
          background; the slider's clock stops and the still simply stays.

          The left readability shade is rendered by the slider inside each
          slide (so it fades with its picture) — `.mobilitycare-hero__overlay`
          is still the class it wears. */}
      <HeroSlider
        className="mobilitycare-hero__media"
        stills={STILLS}
        mediaKey="mobilityCareHero"
        eager
        videoClassName="mobilitycare-hero__video"
        shadeClassName="mobilitycare-hero__overlay"
        filmName="the clinical gait film"
      />

      {/* Content layer */}
      <div className="mobilitycare-hero__content container-wide">
        <div className="w-full max-w-[640px]">
          <div className="inline-flex items-center rounded-full border border-teal-300/30 bg-teal-300/[0.08] px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-teal-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs">
            GAITAI MOBILITYCARE · MOVEMENT INTELLIGENCE
          </div>

          <h1
            id="mobilitycare-hero-title"
            className="mt-6 text-balance font-display text-[clamp(2.3rem,8vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-soft-white lg:text-[clamp(2.7rem,3.9vw,4.6rem)]"
          >
            Movement intelligence for assessment, recovery and{" "}
            <span className="text-gradient-mobility">longitudinal care.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg lg:mt-5 lg:text-base">
            GaitAI exists for a future where AI doesn&apos;t only respond after
            something goes wrong, but quietly helps{" "}
            <span className="text-soft-white">
              predict, prevent and protect
            </span>{" "}
            — before it does.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-7">
            <Link
              href="#products"
              className="hero-product-link hero-product-link--care group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/[0.1] px-6 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-teal-300/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Explore products
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/#contact"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-soft-white/20 bg-obsidian/40 px-6 py-3 text-sm font-semibold text-soft-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-soft-white/35 hover:bg-obsidian/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soft-white/50 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              {ctas.demo.label}
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* Nothing sits under the CTAs. Two things used to: an illustrative-
              values pill, and a 2×2 grid of capability chips (Clinical gait,
              Fall-risk, Rehabilitation, Elderly mobility). Both read as extra
              controls in the button stack rather than as content, and the
              twelve module cards directly below name every capability the
              chips did. The hero is the eyebrow, the headline, one paragraph
              and two buttons; the content block is vertically centred in the
              hero, so the column simply closes up — no reserved height. */}
        </div>
      </div>
    </section>
  );
}
