"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  featuredProducts,
  mobilityProducts,
  productCount,
  secureProducts,
  type Vertical,
} from "@/data/products";
import { ProductCard } from "@/components/products/ProductCard";

/**
 * FEATURED PRODUCTS — one selector, two families, four cards each.
 * =============================================================================
 * The selector itself is not new; what it was missing was the semantics and
 * the way out.
 *
 * SEMANTICS. It was two `aria-pressed` buttons pointing at one panel through
 * `aria-controls`, which describes two independent toggles that happen to
 * govern the same region — not a choice between two views. It is a `tablist`
 * now: one tab selected at a time, each owning its own `tabpanel`, roving
 * `tabIndex` so the pair is a single tab stop, and arrows / Home / End inside
 * it. That is the same control the environment explorer and the capture chain
 * use, and saying it three different ways was the actual problem.
 *
 * THE WAY OUT. Every family panel now ends with its own "Explore all …
 * products" link and its own count, so a visitor who has chosen a family is
 * offered that family's catalogue rather than the combined one. The combined
 * links stay under both, because "how do they connect" is a question about the
 * platform rather than about either family.
 *
 * BOTH PANELS ARE IN THE DOM. The inactive one carries `hidden`. Eight product
 * names, eight descriptions and eight links are in the server-rendered HTML
 * whichever family is selected, which is what keeps a tabbed section
 * crawlable — and what gives a reader without JavaScript both panels open
 * rather than neither.
 *
 * FOUR, NOT THE CATALOGUE. `featured` is a field on the product record, so
 * which four appear is the registry's decision and not this component's.
 */

const productViews: { id: Vertical; label: string; total: number; href: string }[] = [
  {
    id: "mobilitycare",
    label: "MobilityCare",
    total: mobilityProducts.length,
    href: "/mobilitycare/",
  },
  {
    id: "securevision",
    label: "SecureVision",
    total: secureProducts.length,
    href: "/securevision/",
  },
];

const PER_VIEW = 4;

export function FeaturedProducts() {
  const [selectedView, setSelectedView] = useState<Vertical>("mobilitycare");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const move = (from: number, step: number) => {
    const next = (from + step + productViews.length) % productViews.length;
    setSelectedView(productViews[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section
      id="products"
      aria-label="Featured products"
      className="home-section section relative bg-obsidian-300/40"
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
            description="From clinical gait reports to crowd flow analytics — every product is a module on the same GaitAI Movement Intelligence Platform. Pick a family to see the ones it leads with."
            align="left"
            size="lg"
            className="w-full lg:max-w-3xl"
          />

          <div
            role="tablist"
            aria-label="Choose a product family"
            aria-orientation="horizontal"
            className="inline-flex h-10 max-w-full shrink-0 items-center rounded-full touch:h-[3.25rem] border border-[rgba(110,150,255,0.18)] bg-[rgba(10,18,40,0.55)] p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-[10px]"
          >
            {productViews.map((view, i) => {
              const isActive = selectedView === view.id;

              return (
                <button
                  key={view.id}
                  ref={(node) => {
                    tabRefs.current[i] = node;
                  }}
                  id={`${baseId}-tab-${view.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${baseId}-panel-${view.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setSelectedView(view.id)}
                  onKeyDown={(event) => {
                    const key = event.key;
                    if (key === "ArrowRight" || key === "ArrowDown") {
                      event.preventDefault();
                      move(i, 1);
                    } else if (key === "ArrowLeft" || key === "ArrowUp") {
                      event.preventDefault();
                      move(i, -1);
                    } else if (key === "Home") {
                      event.preventDefault();
                      move(0, 0);
                    } else if (key === "End") {
                      event.preventDefault();
                      move(productViews.length - 1, 0);
                    }
                  }}
                  className={`h-8 touch:h-11 whitespace-nowrap rounded-full border px-4 text-sm leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian-300 sm:px-5 ${
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

        {productViews.map((view) => {
          const visible = featuredProducts
            .filter((product) => product.vertical === view.id)
            .slice(0, PER_VIEW);
          const on = selectedView === view.id;

          return (
            <div
              key={view.id}
              id={`${baseId}-panel-${view.id}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${view.id}`}
              hidden={!on}
              tabIndex={0}
              className="mt-9 focus-visible:outline-none sm:mt-10"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} compact />
                ))}
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.07] pt-5">
                <p className="text-[11px] uppercase tracking-[0.16em] text-soft-mute">
                  Showing {visible.length} of {view.total} {view.label} products
                </p>
                <Link
                  href={view.href}
                  className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  Explore all {view.label} products
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-soft-white transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.05]"
          >
            Browse all {productCount} products
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/gaitscape"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-soft-white transition-all hover:border-cyan-300/40 hover:bg-cyan-300/[0.05]"
          >
            Explore how they connect
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
