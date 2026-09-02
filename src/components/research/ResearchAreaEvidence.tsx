"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ResearchArea } from "@/data/evidence";
import { CapabilityCard } from "./CapabilityCard";
import { ResearchSpine, ResearchSpineStacked } from "./ResearchSpine";
import styles from "./research.module.css";

/**
 * One research area, presented as a chain rather than a table:
 *
 *   research evidence  →  capabilities grounded  →  products enabled
 *
 * Everything rendered here is the same derived relationship data the previous
 * three-column panel showed — no record, capability, product or link is added,
 * removed or reworded. What changed is density: records and products open
 * progressively, and selecting a capability filters the products to the ones
 * documented as built on it.
 *
 * One honest limit worth stating: the graph maps *areas* to capabilities, not
 * individual papers to capabilities. Every record in an area therefore backs
 * every capability in it, so there is no per-record highlight to show when a
 * capability is selected — only the product side carries real signal, and only
 * that side reacts.
 */

const RECORDS_SHOWN = 3;
const PRODUCTS_SHOWN = 6;
/** Below this, the full product list is short enough to show outright. */
const PRODUCTS_EXPAND_THRESHOLD = 8;

const VERTICAL_LABEL: Record<string, string> = {
  mobilitycare: "MobilityCare",
  securevision: "SecureVision",
};

function Disclosure({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="group mt-6 inline-flex items-center gap-2 text-[12.5px] font-medium text-cyan-300/85 transition-colors hover:text-cyan-200"
    >
      {children}
      <span
        aria-hidden="true"
        className={`text-[10px] transition-transform duration-300 ${
          expanded ? "-translate-y-px rotate-180" : "translate-y-px"
        }`}
      >
        ▾
      </span>
    </button>
  );
}

export function ResearchAreaEvidence({ area }: { area: ResearchArea }) {
  const [allRecords, setAllRecords] = useState(false);
  const [allProducts, setAllProducts] = useState(false);
  const [activeCapability, setActiveCapability] = useState<string | null>(null);
  /** Index of the selected capability — the spine lights that tap. */
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const records = allRecords
    ? area.publications
    : area.publications.slice(0, RECORDS_SHOWN);

  const activeTitle = activeCapability
    ? area.capabilities.find((c) => c.id === activeCapability)?.title
    : null;

  /**
   * Products per capability. The card groups the pills itself, so this is the
   * list rather than a count — the count is its length.
   */
  const productsFor = useMemo(() => {
    const map = new Map<string, typeof area.products>();
    for (const capability of area.capabilities) {
      map.set(
        capability.id,
        area.products.filter((p) => p.capabilityIds.includes(capability.id)),
      );
    }
    return map;
  }, [area]);

  const scoped = activeCapability
    ? area.products.filter((p) => p.capabilityIds.includes(activeCapability))
    : area.products;

  /* A short list stays fully open. A long one shows its most directly
     connected products as rows and keeps the tail as pills behind a toggle —
     expanding must not restore the wall of fifteen entries this replaced. */
  const shortList = scoped.length <= PRODUCTS_EXPAND_THRESHOLD;
  const primary = shortList ? scoped : scoped.slice(0, PRODUCTS_SHOWN);
  const remainder = shortList ? [] : scoped.slice(PRODUCTS_SHOWN);

  /** Capabilities the hovered product is built on — the reverse highlight. */
  const hoveredCapabilities = hoveredProduct
    ? (area.products.find((p) => p.id === hoveredProduct)?.capabilityIds ?? [])
    : [];

  return (
    <article id={area.id} className="scroll-mt-32">
      {/* ─────────── HEADER ─────────── */}
      <header className="max-w-3xl">
        <h3 className="font-display text-[1.625rem] leading-[1.15] tracking-[-0.02em] text-soft-white sm:text-[2rem]">
          {area.title}
        </h3>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-soft-gray sm:text-base">
          {area.summary}
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-soft-mute">
          <span>
            <span className="tabular-nums text-soft-white">
              {area.publications.length}
            </span>{" "}
            research {area.publications.length === 1 ? "record" : "records"}
          </span>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <span>
            <span className="tabular-nums text-soft-white">
              {area.capabilities.length}
            </span>{" "}
            {/* Left deliberately unqualified. The section headings below say
                "informed by this work", not "grounded" or "enabled by" — the
                page states plainly that no study here validates a product, and
                this summary must not quietly reintroduce that implication. */}
            {area.capabilities.length === 1 ? "capability" : "capabilities"}
          </span>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <span>
            <span className="tabular-nums text-soft-white">
              {area.products.length}
            </span>{" "}
            connected {area.products.length === 1 ? "product" : "products"}
          </span>
        </p>
      </header>

      {/* ─────────── EVIDENCE → CAPABILITY ─────────── */}
      <div className="mt-12 grid gap-0 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_88px_minmax(0,1.04fr)]">
        {/* Records */}
        <section className="lg:pr-10">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
            Research foundation
          </h4>

          <ol className="mt-5">
            {records.map((publication, i) => (
              <li key={publication.id}>
                <Link
                  href={`/publications/${publication.id}/`}
                  className={`${styles.refRow} group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4`}
                >
                  <span
                    aria-hidden="true"
                    className="pt-[3px] font-mono text-[11px] tabular-nums text-cyan-300/45"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] leading-snug text-soft-gray transition-colors duration-300 group-hover:text-soft-white">
                      {publication.title}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-soft-mute">
                      <span>{publication.venue}</span>
                      <span aria-hidden="true" className="text-white/20">
                        ·
                      </span>
                      <span className="tabular-nums">{publication.year}</span>
                      {publication.kind === "patent" &&
                        publication.patentNumber && (
                          <>
                            <span aria-hidden="true" className="text-white/20">
                              ·
                            </span>
                            <span>Patent {publication.patentNumber}</span>
                          </>
                        )}
                    </span>
                    <span className="mt-3 flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="block h-px w-6 bg-cyan-300/35 transition-all duration-500 ease-smooth group-hover:w-14 group-hover:bg-cyan-300/60"
                      />
                      <span className="text-[11.5px] font-medium text-cyan-300/75 transition-colors duration-300 group-hover:text-cyan-300">
                        View publication
                        <span
                          aria-hidden="true"
                          className="ml-1.5 inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          {area.publications.length > RECORDS_SHOWN && (
            <Disclosure
              expanded={allRecords}
              onToggle={() => setAllRecords((v) => !v)}
            >
              {allRecords
                ? "Show fewer research records"
                : `View all ${area.publications.length} research records`}
            </Disclosure>
          )}
        </section>

        {/* Signal bus — desktop only. Below lg the columns stack, so a
            horizontal hand-off has nothing to mean and a short vertical
            lead-in replaces it. */}
        <div className="hidden lg:block">
          <ResearchSpine
            count={area.capabilities.length}
            activeIndex={activeIndex}
          />
        </div>
        <div className="lg:hidden">
          <ResearchSpineStacked />
        </div>

        {/* Capabilities */}
        <section className="lg:pl-1">
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
            Capability informed by this work
          </h4>

          <div className="mt-5 space-y-3">
            {area.capabilities.map((capability, i) => {
              const isActive = activeCapability === capability.id;
              const isLinked = hoveredCapabilities.includes(capability.id);

              return (
                <CapabilityCard
                  key={capability.id}
                  title={capability.title}
                  description={capability.description}
                  products={productsFor.get(capability.id) ?? []}
                  isActive={isActive}
                  isLinked={isLinked}
                  isDimmed={
                    (activeCapability !== null && !isActive) ||
                    (hoveredProduct !== null && !isLinked)
                  }
                  onToggle={() => {
                    setActiveCapability(isActive ? null : capability.id);
                    setActiveIndex(isActive ? null : i);
                    setAllProducts(false);
                  }}
                  onProductFocus={setHoveredProduct}
                  onProductBlur={() => setHoveredProduct(null)}
                />
              );
            })}
          </div>

          {activeCapability && (
            <button
              type="button"
              onClick={() => {
                setActiveCapability(null);
                setActiveIndex(null);
              }}
              className="mt-5 text-[11.5px] text-soft-mute underline decoration-white/20 underline-offset-4 transition-colors hover:text-soft-white"
            >
              Clear selection
            </button>
          )}
        </section>
      </div>

      {/* ─────────── PRODUCTS ─────────── */}
      <section className="mt-12 border-t border-white/[0.07] pt-8">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
          {activeTitle
            ? `Related products using ${activeTitle}`
            : "Related GaitAI products"}
        </h4>

        <ul className="mt-5 grid gap-x-10 sm:grid-cols-2">
          {primary.map((product) => (
            <li key={product.id}>
              <Link
                href={product.href}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onFocus={() => setHoveredProduct(product.id)}
                onBlur={() => setHoveredProduct(null)}
                className="group flex flex-col gap-1 border-t border-white/[0.07] py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="min-w-0">
                  <span className="text-[0.9375rem] font-medium text-soft-white transition-colors duration-300 group-hover:text-cyan-300">
                    {product.short}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-soft-mute sm:mt-1">
                    {product.label}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-soft-mute/80">
                  {VERTICAL_LABEL[product.vertical] ?? product.vertical}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {remainder.length > 0 && allProducts && (
          <ul className="mt-6 flex flex-wrap gap-1.5 border-t border-white/[0.07] pt-6">
            {remainder.map((product) => (
              <li key={product.id}>
                <Link
                  href={product.href}
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onFocus={() => setHoveredProduct(product.id)}
                  onBlur={() => setHoveredProduct(null)}
                  className="inline-block rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-soft-gray transition-colors duration-300 hover:border-cyan-300/40 hover:text-soft-white"
                >
                  {product.short}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {remainder.length > 0 && (
          <Disclosure
            expanded={allProducts}
            onToggle={() => setAllProducts((v) => !v)}
          >
            {allProducts
              ? "Show fewer products"
              : `+${remainder.length} more connected ${
                  remainder.length === 1 ? "product" : "products"
                }`}
          </Disclosure>
        )}
      </section>
    </article>
  );
}
