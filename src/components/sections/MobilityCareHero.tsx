import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SyntheticDataBadge } from "@/components/ui/SyntheticDataBadge";
import { assetPath } from "@/lib/paths";
import { ctas } from "@/data/content";

/**
 * Hero for /mobilitycare/ — same composition pattern as the SecureVision
 * hero: the clinical-dashboard film fills the hero as a background layer,
 * a left-biased dark shade keeps copy readable, and the text/CTA content
 * sits on top, vertically centered. The footage's key elements (walking
 * figures, center subject, Clinical Gait Report) stay visible on the right.
 *
 * Deliberately a Server Component with no animation state: the <video>
 * can never be re-rendered (and restarted) by client updates.
 */
export function MobilityCareHero() {
  return (
    <section
      aria-labelledby="mobilitycare-hero-title"
      className="mobilitycare-hero"
    >
      {/* Background media layer */}
      <div className="mobilitycare-hero__media" aria-hidden="true">
        <video
          className="mobilitycare-hero__video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source
            src={assetPath("/assets/videos/mobilitycare/mobilitycare-hero-v2.mp4")}
            type="video/mp4"
          />
        </video>
      </div>

      {/* Left readability shade — fades out so the dashboard stays bright */}
      <div className="mobilitycare-hero__overlay" aria-hidden="true" />

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

          {/* The hero footage renders a clinical mobility dashboard. Its
              numbers are invented for the composition, so it is labelled. */}
          <SyntheticDataBadge
            variant="overlay"
            label="Illustrative demo · Synthetic data"
            className="mt-8 lg:mt-7"
          />

          {/* Capability pills — same component style as the SecureVision hero
              chips so both product pages read as one family */}
          <div className="securevision-capability-grid">
            {[
              ["Clinical gait", "Fall-risk"],
              ["Rehabilitation", "Elderly mobility"],
            ].map((row) => (
              <div key={row[0]} className="securevision-capability-row">
                {row.map((label) => (
                  <div key={label} className="securevision-capability-chip">
                    {label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
