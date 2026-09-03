"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { GaitProduct } from "@/data/products";

/**
 * One class per product family, and the colour comes from tokens behind it.
 *
 * This used to be six sets of Tailwind shades — `text-teal-300`,
 * `bg-amber-300/8`, `text-violet-200`. Those shades are lights for a dark
 * ground: on paper the amber pills rendered as pale yellow on near-white,
 * which is a legibility failure rather than a preference. The theme cannot
 * fix that from a token if the component hard-codes the shade, so the
 * component now names the MEANING and `globals.css` branches the value —
 * see PRODUCT ACCENTS — SIX MEANINGS, TWO BRANCHES.
 *
 * The dark branch is a transcription of exactly what these classes computed
 * to, so dark renders unchanged; light is designed for paper on its own
 * terms. The glow stays a literal because it is a fixed cyan radial that
 * never read as the family colour anyway (see the inline `style` below,
 * which has always overridden this gradient).
 */
const accentClass: Record<GaitProduct["accent"], string> = {
  teal: "pa-teal",
  blue: "pa-blue",
  cyan: "pa-cyan",
  violet: "pa-violet",
  gold: "pa-gold",
  emerald: "pa-emerald",
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
  // The accent class carries --pa-rgb / --pa-ink / --pa-pill-ink to the whole
  // subtree, so the eyebrow and the pills read one branching source.
  const accent = accentClass[product.accent];
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
      className={`card-surface group overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent ${accent}`}
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
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at center, rgb(79 209 255 / 0.18), transparent 60%)`,
        }}
      />

      <div className={`relative ${compact ? "p-5" : "p-6"}`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div
            className="pa-ink text-[10px] font-semibold uppercase tracking-[0.18em]"
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
                className="pa-pill rounded-full border px-2.5 py-1 text-[10.5px] font-medium"
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
