import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { assetPath } from "@/lib/paths";

/**
 * Hero for /mobilitycare/ — the clinical-dashboard film IS the hero.
 *
 * Desktop/laptop (≥1024px): the section fills the viewport below the navbar
 * and the video is letterboxed with object-fit: contain so the complete
 * composition (Fall-Risk panel, walking figures, center subject, Clinical
 * Gait Report, bottom alert cards) is always fully visible — never cropped.
 * The headline moves to screen-reader-only there so no text sits over the
 * footage; a slim CTA bar lives below the video inside the same viewport.
 *
 * Mobile/tablet: a normal stacked flow — pill, headline, full-width 16:9
 * video, CTAs.
 *
 * Deliberately a Server Component with no animation state: the <video>
 * can never be re-rendered (and restarted) by client updates.
 */
export function MobilityCareHero() {
  return (
    <section
      aria-labelledby="mobilitycare-hero-title"
      className="mobilitycare-hero relative w-full overflow-hidden"
    >
      {/* Compact copy block — full text on mobile, pill only on desktop */}
      <div className="mobilitycare-hero-copy container-wide relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full border border-teal-300/25 bg-obsidian/55 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-teal-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs">
          GAITAI MOBILITYCARE · MOVEMENT INTELLIGENCE
        </div>

        <h1
          id="mobilitycare-hero-title"
          className="mt-6 max-w-4xl text-balance font-display text-[clamp(1.8rem,7.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-soft-white lg:sr-only"
        >
          AI as a silent guardian for human safety,{" "}
          <span className="text-gradient-mobility">health and identity.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-soft-white/90 sm:text-lg lg:sr-only">
          GaitAI exists for a future where AI doesn&apos;t only respond after
          something goes wrong, but quietly helps predict, prevent and protect
          — before it does.
        </p>
      </div>

      {/* Video stage — contain on desktop so nothing important is cropped */}
      <div className="mobilitycare-hero-stage" aria-hidden="true">
        <video
          className="mobilitycare-hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source
            src={assetPath("/assets/videos/mobilitycare/mobilitycare-hero.mp4")}
            type="video/mp4"
          />
        </video>
      </div>

      {/* Slim CTA bar — sits below the footage, inside the same viewport */}
      <div className="mobilitycare-hero-bar container-wide relative z-10 flex flex-wrap items-center justify-center gap-3">
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
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-soft-white/20 bg-soft-white/[0.06] px-6 py-3 text-sm font-semibold text-soft-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-soft-white/35 hover:bg-soft-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soft-white/50 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
        >
          Book a demo
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
        <span className="mobilitycare-hero-breadth basis-full text-center text-xs text-soft-gray/80 lg:basis-auto lg:pl-2">
          Clinical gait · Fall-risk · Rehabilitation · Sports motion · Elderly
          mobility · Wearable intelligence
        </span>
      </div>
    </section>
  );
}
