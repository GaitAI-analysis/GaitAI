import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/products/ProductGrid";
import { allProducts, mobilityProducts, secureProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "All Products — Movement Intelligence platform",
  description:
    "Explore all 23 GaitAI products across MobilityCare and SecureVision — filter by Healthcare, Sports, Elderly Care, Wearables, Security, Crowd, Industrial and more.",
};

export default function ProductsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-36 pb-20 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              {allProducts.length} products · One movement engine
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Every GaitAI product,{" "}
              <span className="text-gradient">in one place.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              From clinical gait reports to crowd flow analytics — filter by
              capability or audience, drill into the product you need, and book
              a pilot in one click.
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1.5">
              <Link
                href="/mobilitycare"
                className="inline-flex items-center gap-2 rounded-full bg-teal-300/10 px-4 py-1.5 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-300/15"
              >
                <HeartPulse className="h-3.5 w-3.5" />
                MobilityCare · {mobilityProducts.length}
              </Link>
              <Link
                href="/securevision"
                className="inline-flex items-center gap-2 rounded-full bg-royal-300/10 px-4 py-1.5 text-xs font-semibold text-royal-300 transition-colors hover:bg-royal-300/15"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                SecureVision · {secureProducts.length}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="section bg-obsidian-300/30">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Filter by capability"
            title={
              <>
                Find the right product for your{" "}
                <span className="text-gradient">deployment.</span>
              </>
            }
            description="Cross-vertical filters from the GaitAI brief. Every product card opens its full block on the relevant vertical page."
            align="left"
          />
          <div className="mt-10">
            <ProductGrid vertical="all" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Talk to us about your environment
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Not sure which products fit? We&apos;ll help you scope a pilot.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Request a demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/use-cases" className="btn-ghost">
                  Browse use cases
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
