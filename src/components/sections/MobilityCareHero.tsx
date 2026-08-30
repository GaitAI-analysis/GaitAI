"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Dynamically imported with ssr:false — same pattern as the homepage Hero.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Full-viewport hero for /mobilitycare/ — uses the exact same background
 * canvas (hero-ambient · ring-grid · HeroScene) as the homepage hero so
 * both pages share one visual language.
 */
export function MobilityCareHero() {
  return (
    <section
      aria-labelledby="mobilitycare-hero-title"
      className="site-viewport-section relative flex w-full items-center overflow-hidden py-20 sm:py-28 lg:py-32"
    >
      {/* Background layers - identical to homepage Hero.tsx */}
      <div className="hero-ambient pointer-events-none absolute inset-0 -z-10" />
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-20" />

      {/* Animated gait skeleton scene at the same position and opacity */}
      <div
        aria-hidden="true"
        className="hero-scene-mask pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[76%] w-full opacity-20 sm:opacity-30"
      >
        <HeroScene />
      </div>

      {/* Content - centred, same layout as homepage hero */}
      <div className="container-wide relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {/* Eyebrow pill */}
          <div className="inline-flex items-center rounded-full border border-teal-300/20 bg-obsidian/55 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-teal-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs">
            GaitAI MobilityCare · Movement intelligence
          </div>

          {/* Hero headline */}
          <h1
            id="mobilitycare-hero-title"
            className="mt-8 max-w-5xl pb-2 text-balance font-display text-[clamp(1.85rem,7.2vw,3.25rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-soft-white sm:mt-10 sm:pb-2.5 sm:text-[clamp(2.5rem,4.8vw,4.75rem)] lg:pb-3.5"
          >
            <span className="block">AI as a silent guardian</span>
            <span className="block">for human safety,</span>
            <span className="mt-0.5 block text-[0.9em] leading-[0.95] text-gradient-mobility sm:mt-1">
              health and identity.
            </span>
          </h1>

          {/* Supporting paragraph */}
          <p className="mt-8 max-w-2xl text-balance text-base leading-relaxed text-soft-white/90 sm:mt-10 sm:text-xl">
            GaitAI exists for a future where AI doesn&apos;t only respond after
            something goes wrong, but quietly helps predict, prevent and
            protect — before it does.
          </p>

          {/* CTA row — same pill style as homepage */}
          <div className="mt-10 flex w-full max-w-xl flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:items-center">
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
            <Link href="/#contact" className="btn-ghost">
              Book a demo
            </Link>
          </div>

          {/* Breadth note */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-soft-gray/80 sm:mt-16">
            <span>
              Clinical gait · Fall-risk · Rehabilitation · Sports motion ·
              Elderly mobility · Wearable intelligence
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
