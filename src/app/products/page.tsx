import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/products/ProductGrid";
import { DeployGaitAI } from "@/components/sections/DeployGaitAI";
import {
  mobilityProducts,
  productCount,
  secureProducts,
} from "@/data/products";

export const metadata: Metadata = {
  title: `All Products — ${productCount} modular movement-intelligence products`,
  description: `Every GaitAI product across MobilityCare and SecureVision — ${productCount} modular movement-intelligence products on one movement engine. Filter by Healthcare, Sports, Elderly Care, Wearables, Security, Crowd, Industrial and more, then see how a pilot runs.`,
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {productCount} modular products · One movement engine
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              {productCount} products.{" "}
              <span className="text-gradient">One movement platform.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Every product is a module on the same movement engine, organised
              into two families. Start with the family that matches your
              environment.
            </p>
          </div>

          {/* The two families, as the primary route into the catalogue. The
              full grid stays below for people who already know what they
              want. */}
          <div className="mx-auto mt-14 grid max-w-5xl gap-4 lg:grid-cols-2">
            <Link
              href="/mobilitycare"
              className="group rounded-3xl border border-teal-300/20 bg-gradient-to-b from-teal-300/[0.05] to-transparent p-7 text-left transition-colors hover:border-teal-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60 sm:p-8"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-teal-300">
                  MobilityCare
                </span>
                <span className="font-display text-3xl font-semibold text-soft-white">
                  {mobilityProducts.length}
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl text-soft-white">
                Clinical &amp; human-mobility intelligence
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                Gait assessment, fall-risk screening, rehabilitation
                monitoring, neurological and orthopedic movement tracking,
                sports movement and wearable mobility.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                Explore MobilityCare
                <ArrowRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>

            <Link
              href="/securevision"
              className="group rounded-3xl border border-royal-300/20 bg-gradient-to-b from-royal-300/[0.05] to-transparent p-7 text-left transition-colors hover:border-royal-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-300/60 sm:p-8"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-royal-300">
                  SecureVision
                </span>
                <span className="font-display text-3xl font-semibold text-soft-white">
                  {secureProducts.length}
                </span>
              </div>
              <h2 className="mt-3 font-display text-xl text-soft-white">
                Privacy-aware movement intelligence for safety and public
                spaces
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                Anomaly detection, crowd flow, worker safety and campus
                monitoring — plus a separate, governed group for identity and
                investigation.
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-royal-300">
                Explore SecureVision
                <ArrowRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="section bg-obsidian-300/30">
        <div className="container-wide">
          <SectionHeading
            eyebrow="The full catalogue"
            title={
              <>
                Or browse{" "}
                <span className="text-gradient">all {productCount} modules.</span>
              </>
            }
            description="Filter across both families by capability or audience. Every card opens the product's own page, with an executive and a technical view."
            align="left"
          />
          <div className="mt-10">
            <ProductGrid vertical="all" />
          </div>
        </div>
      </section>

      {/* DEPLOYMENT / BUYER READINESS */}
      <DeployGaitAI />

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
