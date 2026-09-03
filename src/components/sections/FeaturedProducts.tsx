"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { featuredProducts, productCount, type Vertical } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

const productViews: { id: Vertical; label: string }[] = [
  { id: "mobilitycare", label: "MobilityCare" },
  { id: "securevision", label: "SecureVision" },
];

export function FeaturedProducts() {
  const [selectedView, setSelectedView] = useState<Vertical>("mobilitycare");
  const visibleProducts = featuredProducts
    .filter((product) => product.vertical === selectedView)
    .slice(0, 4);

  return (
    <section
      id="featured-products"
      className="section relative bg-obsidian-300/40"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-25" />
      <div className="container-wide">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading
            eyebrow="Featured · Movement intelligence products"
            title={
              <>
                {productCount} modular products.{" "}
                <span className="text-gradient">
                  One Movement Intelligence Platform.
                </span>
              </>
            }
            description="From clinical gait reports to crowd flow analytics — every product is a module on the same GaitAI Movement Intelligence Platform. These are the eight we&apos;re leading with."
            align="left"
            className="w-full lg:max-w-3xl"
          />

          <div
            role="group"
            aria-label="Choose a product system"
            className="inline-flex h-10 max-w-full shrink-0 items-center rounded-full touch:h-12 border border-[rgba(110,150,255,0.18)] bg-[rgba(10,18,40,0.55)] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[10px]"
          >
            {productViews.map((view) => {
              const isActive = selectedView === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  aria-pressed={isActive}
                  /* The panel id already existed and nothing pointed at it,
                     so a screen-reader user was never told what these
                     switches govern. */
                  aria-controls="featured-products-panel"
                  onClick={() => setSelectedView(view.id)}
                  className={`h-8 touch:h-10 whitespace-nowrap rounded-full border px-4 text-sm leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-300 sm:px-5 ${
                    isActive
                      ? "border-[rgba(120,190,255,0.30)] bg-[linear-gradient(135deg,rgba(53,130,255,0.22),rgba(98,76,255,0.18))] font-semibold text-[#F5F8FF] shadow-[0_8px_24px_rgba(35,90,220,0.18)]"
                      : "border-transparent font-medium text-[rgba(220,232,255,0.78)] hover:bg-white/[0.04] hover:text-[#F5F8FF]"
                  }`}
                >
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="featured-products-panel"
          aria-live="polite"
          className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} compact />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-soft-white transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.05]"
          >
            Browse all {productCount} products
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/gaitscape"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-soft-white transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.05]"
          >
            Explore how they connect
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
