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
  readingMinutes,
  insightHref,
  type InsightArticle,
} from "@/data/insights";
import { InsightProse } from "@/components/insights/InsightProse";
import { JournalCover } from "@/components/insights/JournalCover";
import { SectionRail } from "@/components/insights/SectionRail";
import { ReadingProgress } from "@/components/insights/ReadingProgress";
import { TwoMinute } from "@/components/insights/TwoMinute";
import { ArticleDiscovery } from "@/components/insights/ArticleDiscovery";
import { DiscussionMount } from "@/components/comments/DiscussionMount";
import { ArticleMeta } from "@/components/insights/ArticleMeta";
import { SubscribeForm } from "@/components/subscribe/SubscribeForm";
import { ArticleReadingModes } from "@/components/insights/experience/ArticleReadingModes";
import { ArticleProgressRail } from "@/components/insights/experience/ArticleProgressRail";
import { TextHighlightShare } from "@/components/insights/experience/TextHighlightShare";
import { SectionMark } from "@/components/insights/experience/SectionMark";
import { NextFoundation } from "@/components/insights/experience/NextFoundation";
import { ArticleLinks } from "@/components/insights/experience/ArticleLinks";
import { ArticleAnalytics } from "@/components/insights/experience/ArticleAnalytics";
import { ArticleFeedback } from "@/components/insights/experience/ArticleFeedback";
import { TrackedLink } from "@/components/insights/experience/TrackedLink";
import {
  ArticleHero,
  SectionFigures,
  buildMoments,
  termsFor,
} from "@/components/insights/experience/compose";
import { getArticleExperience } from "@/data/insight-experiences";
import { FOUNDATIONS_SERIES, seriesHref, seriesMark } from "@/data/insight-series";
import { assetPath } from "@/lib/paths";
import { insightToPublicationStory, readPublicationStories } from "@/lib/publication-store";
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

export default async function InsightArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = getInsightBySlug(params.slug);
  if (!article) notFound();

  const allStories = await readPublicationStories();
  const currentStory = insightToPublicationStory(article);

  /* THE INTERACTIVE LAYER. Everything below that moves, scrubs or reveals is
     described in `data/insight-experiences.ts` and drawn by the components in
     `components/insights/experience/`. The article's text — every block,
     section, quote and link — is untouched by it: the figures sit between the
     sections the record already has, the terms are wrapped around words that
     were already there, and an article without an experience record renders
     exactly as before. */
  const experience = getArticleExperience(article.slug);
  const moments = experience ? buildMoments(experience) : [];
  const sectionIds = article.sections.map((section) => section.id);
  /* THE SERIES. Every article belongs to one editorial series (see
     data/insight-series.ts); the Foundations are the ordered reading path and
     the others are open strands. The bridge at the foot of the page hands over
     to the next story in the SAME series, never across series. */
  const seriesName = article.series ?? FOUNDATIONS_SERIES;
  const seriesStories = [...insightArticles]
    .filter((item) => (item.series ?? FOUNDATIONS_SERIES) === seriesName)
    .sort((a, b) => (a.seriesOrder ?? a.seriesStep) - (b.seriesOrder ?? b.seriesStep));
  const step = article.seriesOrder ?? article.seriesStep;
  const mark = seriesMark(seriesName, step);
  const nextArticle = seriesStories.find((item) => (item.seriesOrder ?? item.seriesStep) === step + 1);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "GaitAI", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "GaitAI Insights", item: `${SITE_URL}/insights/` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${SITE_URL}${insightHref(article.slug)}` },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.seo.title,
    description: article.seo.description,
    image: [`${SITE_URL}${assetPath(article.hero.src)}`],
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
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
    ...(article.series || article.seriesStep
      ? {
          isPartOf: {
            "@type": "CreativeWorkSeries",
            name: article.series ?? "GaitAI Foundations",
          },
          position: article.seriesOrder ?? article.seriesStep,
        }
      : {}),
  };

  return (
    <div className={`${styles.journal} insights-page`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <ReadingProgress targetId={ARTICLE_ID} sectionIds={sectionIds} />
      <ArticleProgressRail sections={article.sections} articleId={ARTICLE_ID} />
      <TextHighlightShare articleId={ARTICLE_ID} />
      <ArticleAnalytics
        slug={article.slug}
        series={seriesName}
        seriesOrder={step}
        foundations={seriesName === FOUNDATIONS_SERIES}
      />

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
                seriesLabel={mark ? `${mark.label} ${mark.number}`.trim() : undefined}
                typeLabel={POST_TYPE_LABEL[article.postType]}
                author={INSIGHTS_AUTHOR}
                date={article.date}
                dateLabel={formatInsightDate(article.date)}
                readMinutes={readingMinutes(article)}
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
          {experience ? (
            /* The article's own interactive hero — the argument, explorable,
               in place of the still cover. The drawn cover still carries the
               story on the hub and in every card. */
            <ArticleHero experience={experience} />
          ) : (
            <figure className={styles.articleMedia}>
              <JournalCover concept={article.cover.concept} />
              {/* The cover is decorative to a screen reader — the headline
                  above it already says what the essay is — but its description
                  is the one place the artwork's meaning is stated in words. */}
              <figcaption className="sr-only">{article.cover.alt}</figcaption>
              <span aria-hidden="true" className={styles.articleMediaVignette} />
            </figure>
          )}
        </div>

        {/* ─────────── READING MODES · THE 2-MINUTE VERSION ───────────
            READ is the default and changes nothing. ESSENTIALS opens the same
            2-minute <details> the article has always had. VISUAL STORY opens a
            guided sequence of the figures. */}
        <div className="container-wide">
          <div className="w-full max-w-[46rem]">
            {experience ? (
              <ArticleReadingModes
                articleSlug={article.slug}
                articleTitle={article.title}
                readMinutes={readingMinutes(article)}
                twoMinute={article.twoMinute}
                moments={moments}
              />
            ) : (
              <TwoMinute points={article.twoMinute} />
            )}
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

              {article.sections.map((section, index) => (
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
                  {/* The section mark: the essay's motif under each title —
                      a gait cycle, a branch, a fading trace, temporal markers,
                      converging streams — in place of a plain gradient rule. */}
                  {experience ? (
                    <SectionMark motif={experience.motif} index={index} />
                  ) : (
                    <span aria-hidden="true" className={styles.sectionRule} />
                  )}
                  <div className="mt-7">
                    <InsightProse
                      blocks={section.blocks}
                      terms={termsFor(experience, section.id)}
                      articleSlug={article.slug}
                    />
                    {experience && (
                      <SectionFigures experience={experience} sectionId={section.id} />
                    )}
                  </div>
                </section>
              ))}

              {/* ── Closing ── */}
              <div className="mt-20 border-t border-white/8 pt-12">
                <InsightProse blocks={article.closing} />

                <TrackedLink
                  href={article.cta.href}
                  event="product_opened"
                  props={{ article_slug: article.slug, destination: article.cta.href }}
                  className="btn-ghost mt-10 !px-6 !py-3 text-sm font-medium"
                >
                  {article.cta.label} →
                </TrackedLink>
              </div>

              {/* ── One question, two answers — the reader's verdict, counted ── */}
              <ArticleFeedback slug={article.slug} />

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
                <TrackedLink
                  href="/publications"
                  event="research_opened"
                  props={{ article_slug: article.slug, destination: "publications" }}
                  className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4"
                >
                  publications library
                </TrackedLink>
                .
              </p>

              {/* ── The doors: evidence, GaitScape, the Lab, Ask GaitAI ── */}
              {experience && (
                <ArticleLinks
                  experience={experience}
                  articleTitle={article.title}
                  sections={article.sections.map((section) => ({ id: section.id, title: section.title }))}
                />
              )}

              {/* ── The bridge into the next Foundation ── */}
              {experience && (
                <NextFoundation
                  articleSlug={article.slug}
                  step={step}
                  total={seriesStories.length}
                  seriesName={seriesName}
                  seriesHref={seriesHref(seriesName)}
                  learned={experience.bridge.learned}
                  nextQuestion={experience.bridge.nextQuestion}
                  from={article.cover.concept}
                  to={nextArticle ? nextArticle.cover.concept : "start"}
                  next={
                    nextArticle
                      ? {
                          href: insightHref(nextArticle.slug),
                          title: nextArticle.title,
                          seriesTitle: nextArticle.seriesTitle,
                          step: nextArticle.seriesOrder ?? nextArticle.seriesStep,
                        }
                      : null
                  }
                />
              )}
            </div>

            {/* ── Section rail (desktop) ── */}
            <aside className="hidden lg:block">
              <SectionRail sections={article.sections} variant="rail" />
            </aside>
          </div>
        </div>
      </article>

      {/* ─────────── ENGAGEMENT ───────────
          The thread and the signup share one row.

          They were two full-width sections stacked, each holding a ~46rem
          column, so on a desktop the page ran two thin panels down the middle
          with the rest of the width empty and two dividers between them. They
          are the same moment in the read — the reader has finished and is
          deciding what to do next — so they belong side by side under one
          divider.

          Proportions rather than fixed widths: 1.3fr to 0.9fr, because the
          thread holds a form with two fields on one line and the signup holds
          one. The signup floors at 360px so its field and button never wrap
          into a column too narrow to use, and the gap is 42-72px so the two
          read as two separate offers rather than as one crowded row.

          THE 360px FLOOR IS LOAD-BEARING. The signup field's flex basis was
          cut to 11rem specifically so the field and the SUBSCRIBE button hold
          one line inside it. Drop this floor back to 300 and the button wraps
          to a second row at exactly the width where the two-column layout
          begins.

          The signup stays deliberately lighter than the thread. It is not
          padded out to match its height and nothing is invented to fill the
          space under it — the whitespace beside a finished article is the
          editorial point, not a gap to plug.

          The row collapses below 900px, and that is measured: the comment
          form puts its name and email fields on one line from 640px up, and
          the signup floors 60px wider than it once did, so 900 is the width
          at which both columns still hold their contents — at 900 they come
          out 434 and 360. Below it the thread is full width again and the
          stacked order is the one a phone had before.

          The comment system itself is untouched — Firestore-backed, moderated,
          rate-limited, captcha-gated, mounted client-only and viewport-gated
          so Firebase stays off the critical path until a reader scrolls here.
          contentType "blog" is one of ALLOWED_CONTENT_TYPES. The signup is the
          same component and collection as the blog index and the footer: one
          validation path, one duplicate rule. */}
      <section
        id="discussion"
        /* Asymmetric on purpose. The rule above wants clear air beneath it,
           but the tail of this section was landing well below the last thing
           a reader can act on, because the composer card carries its own
           padding inside the column. Trimmed at the bottom only. */
        className="border-t border-white/[0.07] pb-10 pt-12 sm:pb-12 sm:pt-14"
      >
        <div className="container-wide">
          <div className="grid items-start gap-[clamp(42px,5vw,72px)] min-[900px]:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
            {/* `DiscussionSection` carries its own `mt-16 border-t pt-12`,
                which is right where it is the last thing on a publication or
                a live post. In this row it put "Discussion" 112px below
                "Enjoyed this story?" and drew a second rule across half the
                width. Neutralised on this page only — the component is shared,
                and publications and live posts still want their own spacing.
                The placeholder shown before hydration has the same chrome, so
                the selector matches the element rather than the component. */}
            <div className="min-w-0 [&>div>section]:mt-0 [&>div>section]:border-t-0 [&>div>section]:pt-0">
              <DiscussionMount
                postSlug={article.slug}
                contentType="blog"
                subscriberOnly={false}
              />
            </div>

            {/* Deliberately no card. The brief for this row was to use the
                width, not to build a second panel to match the first — the
                signup stays a light block of type and one field. */}
            <div className="min-w-0">
              <SubscribeForm variant="article" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── NEXT ─────────── */}
      <ArticleDiscovery current={currentStory} stories={allStories} />
    </div>
  );
}
