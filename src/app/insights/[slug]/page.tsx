/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  INSIGHTS_AUTHOR,
  INSIGHTS_PUBLISHER,
  POST_TYPE_LABEL,
  formatInsightDate,
  getInsightBySlug,
  insightArticles,
  insightHref,
  type InsightArticle,
} from "@/data/insights";
import { InsightProse } from "@/components/insights/InsightProse";
import { JournalCover } from "@/components/insights/JournalCover";
import { SectionRail } from "@/components/insights/SectionRail";
import { ReadingProgress } from "@/components/insights/ReadingProgress";
import { TwoMinute } from "@/components/insights/TwoMinute";
import { NextStory } from "@/components/insights/NextStory";
import { DiscussionMount } from "@/components/comments/DiscussionMount";
import { ArticleMeta } from "@/components/insights/ArticleMeta";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";
import { assetPath } from "@/lib/paths";
import styles from "@/components/insights/journal.module.css";

const SITE_URL = "https://gaitai.in";
const ARTICLE_ID = "insight-article";

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

/**
 * The shared article template.
 *
 * The essays were intellectually strong and visually continuous — heading,
 * paragraph, paragraph, for eight minutes. This template paces them:
 *
 *   progress    a 2px line at the top of the viewport, measured against the
 *               article element rather than the document
 *   hero        category, read time and date on one rule; the headline; the
 *               deck; an opening hook that says what the essay is about to do
 *   2-minute    the argument in four to six points, closed by default, for a
 *               reader deciding whether to start. The full essay stays primary
 *   rail        a sticky navigator using each section's short label, as a
 *               vertical rail on desktop and a horizontal scroller on mobile
 *   sections    the section number set large and faint as the visual anchor,
 *               with the diagrams, state strips, pull quotes and
 *               "why this matters" panels the prose renderer now carries
 *   next        an editorial transition into the next essay in the path
 *
 * Nothing about the content changed: every section, block, quote, tag and link
 * is the same record in `data/insights.ts`. Canonical URL, OpenGraph, Twitter
 * card and BlogPosting structured data are unchanged.
 */
function Headline({ article }: { article: InsightArticle }) {
  const index = article.title.lastIndexOf(article.titleAccent);
  if (index < 0) return <>{article.title}</>;
  return (
    <>
      {article.title.slice(0, index)}
      <span className={styles.heroSpectrum}>{article.titleAccent}</span>
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

  /**
   * The next essay is the next step on the reading path, wrapping at the end;
   * the alternate is whichever of the record's own related pieces is not it.
   */
  const total = insightArticles.length;
  const nextStep = (article.seriesStep % total) + 1;
  const next =
    insightArticles.find((item) => item.seriesStep === nextStep) ?? insightArticles[0];
  const alternate = article.related
    .map((slug) => getInsightBySlug(slug))
    .find(
      (item): item is InsightArticle =>
        Boolean(item) && item!.slug !== next.slug && item!.slug !== article.slug,
    );

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
    <div className={styles.journal}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress targetId={ARTICLE_ID} />

      {/* `overflow-x-clip`, NOT `overflow-hidden`.
          `overflow: hidden` makes an element a scroll container, and a scroll
          container becomes the containing block for every `position: sticky`
          descendant — so the section rail and the mobile strip both had
          nothing to stick to and scrolled away with the page. `overflow-x:
          clip` still clips the hero's decorative bleed sideways, but does not
          create a scroll container, so sticky resolves against the viewport
          again. It is also the only axis that ever needed clipping. */}
      <article id={ARTICLE_ID} className="relative w-full overflow-x-clip pb-20 sm:pb-24">
        {/* ─────────── HERO ─────────── */}
        <header className="site-page-intro-compact relative overflow-hidden pb-10">
          <span aria-hidden="true" className={`${styles.heroField} -z-10`} />
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-[-16%] h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(79,209,255,0.13), transparent 70%)",
              }}
            />
          </div>

          <div className="container-wide">
            <Link
              href="/insights"
              className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
            >
              ← Back to Blog
            </Link>

            {/* The kicker, the headline block and the counters below it are
                one component (see ArticleMeta), because the two metadata rows
                sit either side of the headline and read the same Firestore
                document — two components here would mean two reads, two
                subscriptions and two view-write timers for one article.

                What the kicker no longer says is "Issue 01". GaitAI does not
                publish numbered issues, and a reader arriving from search had
                no way to read "Issue 03" as "third of a five-part series"
                rather than "March's edition". `seriesStep` still orders the
                reading path and picks the next article; it is simply no
                longer printed as though it were an edition number. */}
            <div className="mt-8 max-w-[54rem]">
              <ArticleMeta
                slug={article.slug}
                typeLabel={POST_TYPE_LABEL[article.postType]}
                author={INSIGHTS_AUTHOR}
                date={article.date}
                dateLabel={formatInsightDate(article.date)}
                readMinutes={article.readMinutes}
              >
                <h1 className={styles.articleTitle}>
                  <Headline article={article} />
                </h1>

                {article.subtitle && (
                  <p className={styles.articleSub}>{article.subtitle}</p>
                )}
                <p className={styles.articleDeck}>{article.deck}</p>
                <p className={styles.hook}>{article.openingHook}</p>
              </ArticleMeta>
            </div>
          </div>
        </header>

        {/* ─────────── HERO COVER ───────────
            The essay's drawn cover, so the hero and the archive card show the
            same picture. It replaced the raster hero, which was one of four
            near-identical glowing walkers; the raster survives only as the
            share-card image, where an absolute URL is required. */}
        <div className="container-wide">
          <figure className={styles.articleMedia}>
            <JournalCover concept={article.cover.concept} />
            {/* The cover is decorative to a screen reader — the headline
                above it already says what the essay is — but its description
                is the one place the artwork's meaning is stated in words. */}
            <figcaption className="sr-only">{article.cover.alt}</figcaption>
            <span aria-hidden="true" className={styles.articleMediaVignette} />
          </figure>
        </div>

        {/* ─────────── THE 2-MINUTE VERSION ─────────── */}
        <div className="container-wide">
          <div className="w-full max-w-[46rem]">
            <TwoMinute points={article.twoMinute} />
          </div>
        </div>

        {/* ─────────── SECTION NAV (mobile) ─────────── */}
        <div className="container-wide mt-10 lg:hidden">
          <SectionRail sections={article.sections} variant="strip" />
        </div>

        {/* ─────────── BODY ─────────── */}
        <div className="container-wide">
          <div className="mt-10 grid gap-14 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_210px] lg:gap-16">
            <div className="w-full max-w-[46rem]">
              <InsightProse blocks={article.intro} />

              {article.sections.map((section) => (
                <section key={section.id} className={styles.section}>
                  <p aria-hidden="true" className={styles.sectionNumber}>
                    {section.number}
                  </p>
                  {section.kicker && (
                    <p className={styles.sectionKicker}>{section.kicker}</p>
                  )}
                  <h2 id={section.id} className={styles.sectionTitle}>
                    {section.title}
                  </h2>
                  <span aria-hidden="true" className={styles.sectionRule} />
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
                  {article.cta.label} →
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
                Written by {INSIGHTS_AUTHOR}. GaitAI produces movement
                measurements and decision-support outputs for research, clinical
                and operational teams — not diagnoses. Published research is
                listed in the{" "}
                <Link
                  href="/publications"
                  className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4"
                >
                  publications library
                </Link>
                .
              </p>
            </div>

            {/* ── Section rail (desktop) ── */}
            <aside className="hidden lg:block">
              <SectionRail sections={article.sections} variant="rail" />
            </aside>
          </div>
        </div>
      </article>

      {/* ─────────── DISCUSSION ───────────
          The site's comment system already existed — Firestore-backed,
          moderated, rate-limited, captcha-gated — and was mounted on
          publications and live posts but never on the journal, which is the
          one place readers would actually want to reply. Same component, same
          collection, so the counts on the archive cards and the thread here
          are the same records.

          contentType "blog" is one of ALLOWED_CONTENT_TYPES; the mount is
          client-only and viewport-gated, so Firebase stays off the critical
          path until a reader scrolls this far. */}
      <section id="discussion" className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <div className="mx-auto w-full max-w-[46rem] lg:mx-0">
            <DiscussionMount
              postSlug={article.slug}
              contentType="blog"
              subscriberOnly={false}
            />
          </div>
        </div>
      </section>

      {/* ─────────── SUBSCRIBE ───────────
          Between the thread and the next story: the reader has finished the
          article and is deciding what to do next, which is the only honest
          moment to ask. Same component and same collection as the blog and
          the footer — one validation path, one duplicate rule. */}
      <section className="border-t border-white/[0.07] py-14 sm:py-16">
        <div className="container-wide">
          <div className="mx-auto w-full max-w-[46rem] lg:mx-0">
            <SubscribeForm variant="article" />
          </div>
        </div>
      </section>

      {/* ─────────── NEXT ─────────── */}
      <section className="border-t border-white/[0.07] bg-obsidian-300/25 py-16 sm:py-20">
        <div className="container-wide">
          <NextStory
            current={article}
            next={next}
            alternate={alternate}
            total={total}
          />
        </div>
      </section>
    </div>
  );
}
