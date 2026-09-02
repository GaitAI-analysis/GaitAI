/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { assetPath } from "@/lib/paths";
import {
  formatInsightDate,
  insightHref,
  type InsightArticle,
} from "@/data/insights";

/**
 * Insights card.
 *
 * The whole card is a single link, so the entire surface is clickable and the
 * card is reachable and activatable from the keyboard with no extra wiring.
 * Hover motion is CSS-only and deliberately restrained: a 3px lift, a slightly
 * brighter border, a 1.02 image scale and a 3px arrow nudge — no glow.
 */

export function InsightCard({
  article,
  featured = false,
  eager = false,
}: {
  article: InsightArticle;
  featured?: boolean;
  eager?: boolean;
}) {
  const meta = (
    <>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        {article.category}
      </span>
      <span aria-hidden className="h-3 w-px bg-soft-mute/35" />
      <span className="text-xs text-soft-mute">{article.readMinutes} min read</span>
    </>
  );

  /**
   * The hero renders are wide diagrams whose left and right panels carry
   * meaning, so cropping is kept to a minimum: containers are 16/9 to match the
   * source, and where the featured card turns the image column into a taller
   * panel (lg and up) the fit switches to `contain` rather than losing the
   * edges of the diagram.
   */
  const image = (
    <img
      src={assetPath(article.hero.src)}
      alt={article.hero.alt}
      width={article.hero.width}
      height={article.hero.height}
      loading={eager ? "eager" : "lazy"}
      // eslint-disable-next-line react/no-unknown-property
      fetchPriority={eager ? "high" : undefined}
      className={`absolute inset-0 h-full w-full object-center transition-transform duration-[600ms] ease-smooth group-hover:scale-[1.02] ${
        featured ? "object-cover lg:object-contain" : "object-cover"
      }`}
    />
  );

  if (featured) {
    return (
      <article className="insight-card group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
        <Link
          href={insightHref(article.slug)}
          className="grid items-stretch gap-0 focus-visible:outline-none lg:grid-cols-[1.02fr_1fr]"
        >
          <div className="order-2 flex flex-col justify-between gap-10 p-7 sm:p-10 lg:order-1 lg:p-12">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Featured
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  {article.category}
                </span>
              </div>

              <h3 className="mt-7 font-display text-display-md text-balance text-soft-white">
                {article.title}
              </h3>
              {article.subtitle && (
                <p className="mt-3 font-display text-lg leading-snug text-soft-mute sm:text-xl">
                  {article.subtitle}
                </p>
              )}

              <p className="mt-6 max-w-xl text-[0.9875rem] leading-[1.75] text-soft-gray">
                {article.excerpt}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6">
              <span className="text-xs text-soft-mute">
                {article.readMinutes} min read
                <span aria-hidden className="px-2 text-soft-mute/45">
                  ·
                </span>
                {formatInsightDate(article.date)}
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300">
                Read essay
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-300 ease-smooth group-hover:translate-x-[3px]"
                />
              </span>
            </div>
          </div>

          <div className="relative order-1 aspect-[16/9] overflow-hidden bg-obsidian-300 lg:order-2 lg:aspect-auto lg:min-h-[420px]">
            {image}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="insight-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <Link
        href={insightHref(article.slug)}
        className="flex h-full flex-col focus-visible:outline-none"
      >
        <div className="relative aspect-[16/9] overflow-hidden border-b border-white/8 bg-obsidian-300">
          {image}
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">{meta}</div>

          <h3 className="mt-4 font-display text-[1.3rem] leading-snug text-balance text-soft-white transition-colors duration-300 group-hover:text-cyan-200">
            {article.title}
          </h3>

          <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-[1.7] text-soft-mute">
            {article.excerpt}
          </p>

          <div className="mt-auto flex items-center justify-between gap-4 pt-7">
            <span className="text-xs text-soft-mute">
              {formatInsightDate(article.date)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300">
              Read
              <ArrowRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform duration-300 ease-smooth group-hover:translate-x-[3px]"
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
