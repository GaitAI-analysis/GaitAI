"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { GaitProduct } from "@/data/products";

const accentMap: Record<
  GaitProduct["accent"],
  {
    text: string;
    ring: string;
    glow: string;
    pill: string;
    border: string;
  }
> = {
  teal: {
    text: "text-teal-300",
    ring: "ring-teal-300/30",
    glow: "from-teal-400/15 to-cyan-300/10",
    pill: "bg-teal-300/8 border-teal-300/30 text-teal-200",
    border: "hover:border-teal-300/40",
  },
  blue: {
    text: "text-royal-300",
    ring: "ring-royal-300/30",
    glow: "from-royal-400/15 to-cyan-300/10",
    pill: "bg-royal-300/8 border-royal-300/30 text-royal-200",
    border: "hover:border-royal-300/40",
  },
  cyan: {
    text: "text-cyan-300",
    ring: "ring-cyan-300/30",
    glow: "from-cyan-300/15 to-royal-400/10",
    pill: "bg-cyan-300/8 border-cyan-300/30 text-cyan-200",
    border: "hover:border-cyan-300/40",
  },
  violet: {
    text: "text-violet-300",
    ring: "ring-violet-300/30",
    glow: "from-violet-400/15 to-cyan-300/10",
    pill: "bg-violet-300/8 border-violet-300/30 text-violet-200",
    border: "hover:border-violet-300/40",
  },
  gold: {
    text: "text-amber-300",
    ring: "ring-amber-300/30",
    glow: "from-amber-400/15 to-cyan-300/10",
    pill: "bg-amber-300/8 border-amber-300/30 text-amber-200",
    border: "hover:border-amber-300/40",
  },
  emerald: {
    text: "text-emerald-300",
    ring: "ring-emerald-300/30",
    glow: "from-emerald-400/15 to-cyan-300/10",
    pill: "bg-emerald-300/8 border-emerald-300/30 text-emerald-200",
    border: "hover:border-emerald-300/40",
  },
};

export function ProductCard({
  product,
  index = 0,
  compact = false,
}: {
  product: GaitProduct;
  index?: number;
  compact?: boolean;
}) {
  const a = accentMap[product.accent];
  // MobilityCare products have dedicated detail pages; SecureVision products
  // still anchor into their vertical page.
  const href =
    product.vertical === "mobilitycare"
      ? `/mobilitycare/${product.id}/`
      : `/${product.vertical}#${product.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: (index % 6) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent transition-[border-color,background-color,box-shadow] duration-300 ${a.border} hover:bg-white/[0.04] hover:shadow-[0_16px_40px_-20px_rgba(79,209,255,0.3),0_0_0_1px_rgba(124,58,237,0.1)] focus-within:border-cyan-300/40`}
    >
      {/* Whole-card link (stretched). Enter activates natively; Space is
          handled explicitly so keyboard users can open a focused card. */}
      <Link
        href={href}
        aria-label={`Explore ${product.name}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        <span className="sr-only">Explore {product.name}</span>
      </Link>

      {/* Glow on hover */}
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-radial opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${a.glow}`}
        style={{
          background: `radial-gradient(circle at center, rgb(79 209 255 / 0.18), transparent 60%)`,
        }}
      />

      <div className={`relative ${compact ? "p-5" : "p-6"}`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${a.text}`}
          >
            GaitAI · {product.short}
          </div>
          <span
            aria-hidden
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full glass transition-all ${a.border} group-hover:text-cyan-300`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>

        {/* Name + label */}
        <div className="mt-2.5">
          <h3 className="font-display text-lg font-semibold text-soft-white">
            {product.headline}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-soft-mute">
            {product.description}
          </p>
        </div>

        {/* Outputs preview */}
        {!compact && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {product.outputs.slice(0, 3).map((o) => (
              <span
                key={o}
                className={`rounded-full border px-2.5 py-1 text-[10.5px] font-medium ${a.pill}`}
              >
                {o}
              </span>
            ))}
            {product.outputs.length > 3 && (
              <span className="rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10.5px] font-medium text-soft-mute">
                +{product.outputs.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Explore reveal */}
        <div
          aria-hidden
          className={`mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${a.text} opacity-60 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100`}
        >
          Explore product
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.article>
  );
}
