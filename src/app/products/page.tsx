import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/products/ProductGrid";
import { DeployGaitAI } from "@/components/sections/DeployGaitAI";
import { ProductEcosystem } from "@/components/products/ProductEcosystem";
import { HeroMotionField } from "@/components/products/HeroMotionField";
import { ProductAnalytics } from "@/components/analytics/ProductAnalytics";
import { CoverageMatrix } from "@/components/analytics/CoverageMatrix";
import { ctas } from "@/data/content";
import {
  type GaitProduct,
  mobilityProducts,
  productCount,
  secureProducts,
} from "@/data/products";

export const metadata: Metadata = {
  title: `All Products — ${productCount} modular movement-intelligence products`,
  description: `Every GaitAI product across MobilityCare and SecureVision — ${productCount} modular movement-intelligence products on one Movement Intelligence Platform. Filter by Healthcare, Sports, Elderly Care, Wearables, Security, Crowd, Industrial and more, then see how deployment works.`,
  alternates: { canonical: "/products" },
};

/**
 * Lead products per family, from the flagship flags already in the product
 * data. Mapped down to plain fields: ProductEcosystem is a client component
 * and a whole GaitProduct carries a Lucide `icon` function, which cannot be
 * serialized across the server -> client boundary.
 */
const toEcosystem = (p: GaitProduct) => ({
  id: p.id,
  short: p.short,
  label: p.label,
  vertical: p.vertical,
  outputs: p.outputs,
});

const careLead = mobilityProducts.filter((p) => p.flagship).slice(0, 4).map(toEcosystem);
const secureLead = secureProducts.filter((p) => p.flagship).slice(0, 4).map(toEcosystem);

export default function ProductsPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
          {/* Depth behind the movement-intelligence field: one soft blue light
              where its core sits, and a violet one further out, both wide
              enough to read as atmosphere rather than as a blob. */}
          <div className="absolute right-[-6%] top-[6%] hidden h-[560px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),rgba(59,130,246,0.04)_45%,transparent_72%)] blur-2xl lg:block" />
          <div className="absolute right-[-10%] top-[34%] hidden h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.11),transparent_70%)] blur-3xl lg:block" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />
        {/* The flat grid gets a horizon: it fades out toward the top and the
            bottom of the hero instead of stopping at a hard edge. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-obsidian-400/70 to-transparent" />

        <div className="container-wide">
          <div className="relative">
            <div className="relative z-10 max-w-2xl">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Product finder
              </span>
              <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
                Find the right{" "}
                <span className="text-gradient">GaitAI product mix.</span>
              </h1>
              {/* "the same capture, pose, gait and quality layers" overstated
                  the architecture: the modules share a movement-processing
                  foundation, not one identical pipeline. */}
              <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
                Two product families. One Movement Intelligence Platform.
                GaitAI&apos;s {productCount} modules share a common
                movement-processing foundation, with capability-specific
                pipelines for pose, gait, trajectory, sensor and privacy-aware
                analysis. Choose your environment, objective and available
                signals to see the best-fit modules.
              </p>
            </div>

            <HeroMotionField />
          </div>

          <ProductEcosystem
            careProducts={careLead}
            secureProducts={secureLead}
            careTotal={mobilityProducts.length}
            secureTotal={secureProducts.length}
          />
        </div>
      </section>

      {/* CONFIGURATOR + COMPARISON ──
          "Find your GaitAI stack": three answers resolved against the
          documented product / environment / capability relationships, with
          the recommendation feeding straight into a side-by-side comparison.
          State lives in the URL (?environment=&goal=&signal=&compare=). */}
      <section className="section border-y border-white/[0.07] bg-obsidian-300/25">
        <div className="container-wide">
          <ProductAnalytics />
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

      {/* INTELLIGENCE COVERAGE MAP ──
          capability × environment, as three discrete documented states.
          The join GaitScape's capability × product matrix cannot make. */}
      <section id="coverage" className="section border-t border-white/[0.07]">
        <div className="container-wide">
          <SectionHeading
            eyebrow="Intelligence coverage"
            title={
              <>
                Which capability applies{" "}
                <span className="text-gradient">where.</span>
              </>
            }
            description="Every capability against every environment, in three documented states — primary, supporting, or not used. Select a cell to see the modules and signals behind it."
            align="left"
          />
          <div className="mt-10">
            <CoverageMatrix />
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
                  {ctas.pilot.label}
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Not sure which products fit? We&apos;ll help you scope a pilot.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  {ctas.demo.label}
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
