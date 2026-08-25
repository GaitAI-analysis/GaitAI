"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { featuredProducts } from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

export function FeaturedProducts() {
  return (
    <section
      id="featured-products"
      className="section relative bg-obsidian-300/40"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-25" />
      <div className="container-wide">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Featured · Movement intelligence products"
            title={
              <>
                Twenty-three products.{" "}
                <span className="text-gradient">One movement engine.</span>
              </>
            }
            description="From clinical gait reports to crowd flow analytics — every product is built on the same GaitAI movement-intelligence platform. These are the eight we&apos;re leading with."
            align="left"
            className="lg:max-w-2xl"
          />
          <div className="flex gap-3">
            <Link
              href="/mobilitycare"
              className="rounded-full border border-teal-300/30 bg-teal-300/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200 transition-all hover:border-teal-300/50 hover:bg-teal-300/15"
            >
              MobilityCare
            </Link>
            <Link
              href="/securevision"
              className="rounded-full border border-royal-300/30 bg-royal-300/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-royal-200 transition-all hover:border-royal-300/50 hover:bg-royal-300/15"
            >
              SecureVision
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} compact />
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center">
          <Link
            href="#use-cases"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-soft-white transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.05]"
          >
            See where they&apos;re deployed
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
