import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/products/ProductGrid";
import { DeployGaitAI } from "@/components/sections/DeployGaitAI";
import { ProductEcosystem } from "@/components/products/ProductEcosystem";
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
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="max-w-2xl">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Our product ecosystem
            </span>
            <h1 className="mt-5 font-display text-display-xl text-balance text-soft-white">
              Movement intelligence{" "}
              <span className="text-gradient">for real-world impact.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Two product families. One Movement Intelligence Platform. Every one of the{" "}
              {productCount} modules is built on the same capture, pose, gait
              and quality layers — the family decides what the measurement is
              read for.
            </p>
          </div>

          <ProductEcosystem
            careProducts={careLead}
            secureProducts={secureLead}
            careTotal={mobilityProducts.length}
            secureTotal={secureProducts.length}
          />
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
