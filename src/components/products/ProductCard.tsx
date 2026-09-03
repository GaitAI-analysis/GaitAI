"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { GaitProduct } from "@/data/products";

const accentMap: Record<
  GaitProduct["accent"],
  {
    text: string;
    glow: string;
    pill: string;
  }
> = {
  teal: {
    text: "text-teal-300",
    glow: "from-teal-400/15 to-cyan-300/10",
    pill: "bg-teal-300/8 border-teal-300/30 text-teal-200",
  },
  blue: {
    text: "text-royal-300",
    glow: "from-royal-400/15 to-cyan-300/10",
    pill: "bg-royal-300/8 border-royal-300/30 text-royal-200",
  },
  cyan: {
    text: "text-cyan-300",
    glow: "from-cyan-300/15 to-royal-400/10",
    pill: "bg-cyan-300/8 border-cyan-300/30 text-cyan-200",
  },
  violet: {
    text: "text-violet-300",
    glow: "from-violet-400/15 to-cyan-300/10",
    pill: "bg-violet-300/8 border-violet-300/30 text-violet-200",
  },
  gold: {
    text: "text-amber-300",
    glow: "from-amber-400/15 to-cyan-300/10",
    pill: "bg-amber-300/8 border-amber-300/30 text-amber-200",
  },
  emerald: {
    text: "text-emerald-300",
    glow: "from-emerald-400/15 to-cyan-300/10",
    pill: "bg-emerald-300/8 border-emerald-300/30 text-emerald-200",
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
  // Every product has a dedicated detail page under its vertical.
  const href = `/${product.vertical}/${product.id}/`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.7,
        delay: (index % 6) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      /* The lift, the border and the tint come from `card-surface` — the
         site's shared clickable-card treatment — rather than from a
         `whileHover` on this one component, so a focused card looks exactly
         like a hovered one and every card on the site moves by the same 2px.
         See interactions.css. */
      className={`card-surface group overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent`}
    >
      {/* Whole-card link (stretched). Enter activates natively; Space is
          handled explicitly so keyboard users can open a focused card. */}
      <Link
        href={href}
        aria-label={`View product: ${product.name}`}
        className="card-hit"
        onKeyDown={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        <span className="sr-only">View product: {product.name}</span>
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
          <span aria-hidden className="card-corner">
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

        {/* The cue. Legible at rest rather than revealed on hover: on a
            phone the hover state never arrives, and this line is the only
            thing that says the card opens something. */}
        <div aria-hidden className="card-cue mt-5">
          View product
          <ArrowRight className="card-cue-arrow h-3 w-3" />
        </div>
      </div>
    </motion.article>
  );
}
