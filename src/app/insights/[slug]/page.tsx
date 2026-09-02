/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import {
  INSIGHTS_AUTHOR,
  INSIGHTS_PUBLISHER,
  formatInsightDate,
  getInsightBySlug,
  insightArticles,
  insightHref,
  type InsightArticle,
} from "@/data/insights";
import { InsightProse } from "@/components/insights/InsightProse";
import { ArticleContents } from "@/components/insights/ArticleContents";
import { InsightCard } from "@/components/insights/InsightCard";
import { assetPath } from "@/lib/paths";

const SITE_URL = "https://gaitai.in";

export const dynamicParams = false;

export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const article = getInsightBySlug(params.slug);
  if (!article) return { title: "Insight not found" };

  const canonical = insightHref(article.slug);
  const image = {
    url: assetPath(article.hero.src),
    width: article.hero.width,
    height: article.hero.height,
    alt: article.hero.alt,
  };

  return {
    title: article.seo.title,
    description: article.seo.description,
    keywords: article.tags,
    authors: [{ name: INSIGHTS_AUTHOR }],
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: INSIGHTS_PUBLISHER,
      title: article.seo.title,
      description: article.seo.description,
      publishedTime: article.date,
      authors: [INSIGHTS_AUTHOR],
      tags: article.tags,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: article.seo.title,
      description: article.seo.description,
      images: [image],
    },
  };
}

/** Splits the headline so its trailing fragment can carry the brand gradient. */
function Headline({ article }: { article: InsightArticle }) {
  const index = article.title.lastIndexOf(article.titleAccent);
  if (index < 0) return <>{article.title}</>;
  return (
    <>
      {article.title.slice(0, index)}
      <span className="text-gradient">{article.titleAccent}</span>
      {article.title.slice(index + article.titleAccent.length)}
    </>
  );
}

export default function InsightArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getInsightBySlug(params.slug);
  if (!article) notFound();

  const related = article.related
    .map((slug) => getInsightBySlug(slug))
    .filter((item): item is InsightArticle => Boolean(item));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seo.title,
    description: article.seo.description,
    image: [`${SITE_URL}${assetPath(article.hero.src)}`],
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: INSIGHTS_AUTHOR,
      url: `${SITE_URL}/research/`,
    },
    publisher: {
      "@type": "Organization",
      name: INSIGHTS_PUBLISHER,
      url: `${SITE_URL}/`,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}${assetPath("/brand/logo-main.png")}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${insightHref(article.slug)}`,
    },
    articleSection: article.category,
    keywords: article.tags.join(", "),
    isAccessibleForFree: true,
  };

  return (
    <article className="relative w-full overflow-hidden pb-24 sm:pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ─────────── HEADER ─────────── */}
      <header className="site-page-intro-compact relative overflow-hidden pb-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[-14%] h-[520px] w-[980px] -translate-x-1/2 rounded-full opacity-45 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.14), transparent 70%)",
            }}
          />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

        <div className="container-wide">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
          >
            <ArrowLeft className="h-3 w-3" />
            All insights
          </Link>

          <div className="mt-8 max-w-[54rem]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                {article.category}
              </span>
              <span aria-hidden className="h-3 w-px bg-soft-mute/35" />
              <span className="inline-flex items-center gap-1.5 text-xs text-soft-mute">
                <Clock className="h-3 w-3" />
                {article.readMinutes} min read
              </span>
              <span aria-hidden className="h-3 w-px bg-soft-mute/35" />
              <span className="inline-flex items-center gap-1.5 text-xs text-soft-mute">
                <Calendar className="h-3 w-3" />
                <time dateTime={article.date}>{formatInsightDate(article.date)}</time>
              </span>
            </div>

            <h1 className="mt-7 font-display text-display-lg text-balance text-soft-white">
              <Headline article={article} />
            </h1>
            {article.subtitle && (
              <p className="mt-4 font-display text-xl leading-snug text-soft-mute sm:text-2xl">
                {article.subtitle}
              </p>
            )}

            <p className="mt-7 max-w-3xl text-base leading-relaxed text-soft-gray sm:text-lg">
              {article.deck}
            </p>
          </div>
        </div>
      </header>

      {/* ─────────── HERO IMAGE — breaks wider than the body column ─────────── */}
      <div className="container-wide">
        <figure className="relative overflow-hidden rounded-3xl border border-white/10 bg-obsidian-300">
          <img
            src={assetPath(article.hero.src)}
            alt={article.hero.alt}
            width={article.hero.width}
            height={article.hero.height}
            loading="eager"
            // eslint-disable-next-line react/no-unknown-property
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </figure>
      </div>

      {/* ─────────── BODY + CONTENTS ─────────── */}
      <div className="container-wide">
        <div className="mt-14 grid gap-14 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16">
          <div className="mx-auto w-full max-w-[46rem]">
            <InsightProse blocks={article.intro} />

            {article.sections.map((section) => (
              <section key={section.id} className="mt-16 sm:mt-20">
                <div className="flex items-baseline gap-4 sm:gap-5">
                  <span
                    aria-hidden
                    className="font-display text-[2.25rem] leading-none tracking-tight text-soft-mute/25 sm:text-[2.75rem]"
                  >
                    {section.number}
                  </span>
                  <div className="min-w-0">
                    {section.kicker && (
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                        {section.kicker}
                      </p>
                    )}
                    <h2
                      id={section.id}
                      className="font-display text-[1.6rem] leading-tight text-balance text-soft-white sm:text-[1.9rem]"
                    >
                      {section.title}
                    </h2>
                  </div>
                </div>
                <div className="mt-7">
                  <InsightProse blocks={section.blocks} />
                </div>
              </section>
            ))}

            {/* ── Closing ── */}
            <div className="mt-20 border-t border-white/8 pt-12">
              <InsightProse blocks={article.closing} />

              <Link
                href={article.cta.href}
                className="btn-ghost mt-10 !px-6 !py-3 text-sm font-medium"
              >
                {article.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* ── Tags ── */}
            <div className="mt-12 flex flex-wrap items-center gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-[11px] text-soft-mute"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="mt-8 text-xs leading-relaxed text-soft-mute">
              Written by {INSIGHTS_AUTHOR}. GaitAI produces movement measurements and
              decision-support outputs for research, clinical and operational teams —
              not diagnoses. Published research is listed in the{" "}
              <Link
                href="/publications"
                className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4"
              >
                publications library
              </Link>
              .
            </p>
          </div>

          {/* ── Contents rail ── */}
          <aside className="hidden lg:block">
            <ArticleContents sections={article.sections} />
          </aside>
        </div>
      </div>

      {/* ─────────── CONTINUE EXPLORING ─────────── */}
      {related.length > 0 && (
        <div className="container-wide mt-24 sm:mt-32">
          <div className="border-t border-white/8 pt-14">
            <div className="flex items-center gap-5">
              <h2 className="font-display text-xl text-soft-white sm:text-2xl">
                Continue exploring
              </h2>
              <span
                aria-hidden
                className="h-px flex-1 bg-gradient-to-r from-soft-mute/25 to-transparent"
              />
            </div>
            <div className="mt-8 grid gap-5 sm:gap-6 lg:grid-cols-2">
              {related.map((item) => (
                <InsightCard key={item.slug} article={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
