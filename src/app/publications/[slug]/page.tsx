import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  User,
} from "lucide-react";
import { getPublishedPostBySlug, readPublishedPosts } from "@/lib/posts-store";
import { allPublications } from "@/data/publications";
import { PublicationDetail } from "@/components/publications/PublicationDetail";
import { CategoryBadge, categoryGradient } from "@/components/posts/CategoryBadge";
import { ArticleDiscovery } from "@/components/insights/ArticleDiscovery";
import { PostCoverImage, PostResources } from "@/components/posts/PostMedia";
import { renderMarkdown } from "@/lib/markdown";
import { DiscussionMount } from "@/components/comments/DiscussionMount";
import { ctas } from "@/data/content";
import { postToPublicationStory, readPublicationStories } from "@/lib/publication-store";
import { assetPath } from "@/lib/paths";

export const dynamicParams = false;

export async function generateStaticParams() {
  /*
   * Only verified posts get a route. Emitting a param for an unverified seed
   * record made notFound() run at export time, which writes a real
   * __next_error__ document to that URL — a crawlable page with no <html lang>
   * and no <h1>. Withholding the param leaves no page at all, which is what
   * "withheld from public rendering" is supposed to mean. The publication
   * records below always keep this list non-empty.
   */
  const posts = await readPublishedPosts();
  return [
    // Research-library publication records share this route with posts.
    ...allPublications.map((p) => ({ slug: p.id })),
    ...posts.map((post) => ({ slug: post.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const publication = allPublications.find((p) => p.id === params.slug);
  if (publication) {
    return {
      title: `${publication.title} — GaitAI Research`,
      description: `${publication.venue} · ${publication.publisher} · ${publication.year}. Authors: ${publication.authors.join(", ")}.`,
      // Without this the record inherited the root canonical and every one of
      // the nine publication pages declared itself a duplicate of the home page.
      alternates: { canonical: `/publications/${publication.id}` },
    };
  }
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) return { title: "Publication not found" };
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/publications/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      url: `/publications/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl, alt: post.coverImageAlt || post.title }]
        : undefined,
    },
    twitter: post.coverImageUrl
      ? {
          card: "summary_large_image",
          title: post.title,
          description: post.summary,
          images: [post.coverImageUrl],
        }
      : undefined,
  };
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function PublicationPage({
  params,
}: {
  params: { slug: string };
}) {
  const publication = allPublications.find((p) => p.id === params.slug);
  if (publication) {
    return <PublicationDetail publication={publication} />;
  }

  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const stories = await readPublicationStories();
  const currentStory = postToPublicationStory(post);
  const image = post.coverImageUrl
    ? (post.coverImageUrl.startsWith("http") ? post.coverImageUrl : `https://gaitai.in${assetPath(post.coverImageUrl)}`)
    : `https://gaitai.in${assetPath("/brand/logo-main.png")}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    image: [image],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "GaitAI",
      url: "https://gaitai.in/",
      logo: { "@type": "ImageObject", url: "https://gaitai.in/brand/logo-main.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://gaitai.in/publications/${post.slug}/` },
    articleSection: post.topics?.[0] ?? post.category,
    keywords: post.tags.join(", "),
    isAccessibleForFree: true,
    ...(post.series ? { isPartOf: { "@type": "CreativeWorkSeries", name: post.series }, position: post.seriesOrder } : {}),
  };

  return (
    <article className="relative w-full overflow-hidden pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {/* Hero cover */}
      <header
        className="site-page-intro-compact relative isolate overflow-hidden pb-16 sm:pb-24"
        style={{ backgroundImage: categoryGradient[post.category] }}
      >
        <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/40 via-obsidian/60 to-obsidian" />
        <div className="container-wide relative">
          <Link
            href="/publications"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
          >
            <ArrowLeft className="h-3 w-3" />
            All publications
          </Link>
          <div className="mt-6 flex items-center gap-3">
            <CategoryBadge category={post.category} size="md" />
            <span className="text-xs text-soft-mute">
              {formatDate(post.publishedAt)}
            </span>
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-display-xl text-balance text-soft-white">
            {post.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-soft-gray sm:text-lg">
            {post.summary}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-soft-mute">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3 w-3" />
              {post.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {formatDate(post.publishedAt)}
            </span>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <PostCoverImage post={post} />

      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Body */}
          <div className="relative mx-auto w-full max-w-3xl">
            <div className="mt-10">{renderMarkdown(post.body)}</div>

            <PostResources post={post} />

            {/* Discussion — moderated comments (approved comments only).
                Mounted client-side only (Firebase / real-time) so it stays out
                of the static server prerender. */}
            <DiscussionMount
              postSlug={post.slug}
              contentType={post.category}
              subscriberOnly={post.subscriberOnly ?? false}
            />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="site-sticky-below-header space-y-6">
              <div className="card p-6">
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  About this publication
                </h4>
                <ul className="mt-4 space-y-3 text-sm">
                  <li className="flex items-center justify-between gap-3 text-soft-gray">
                    <span className="text-soft-mute">Category</span>
                    <CategoryBadge category={post.category} />
                  </li>
                  <li className="flex items-center justify-between gap-3 text-soft-gray">
                    <span className="text-soft-mute">Author</span>
                    <span className="text-soft-white">{post.author}</span>
                  </li>
                  <li className="flex items-center justify-between gap-3 text-soft-gray">
                    <span className="text-soft-mute">Published</span>
                    <span className="text-soft-white">
                      {formatDate(post.publishedAt)}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="card relative overflow-hidden p-6">
                <div className="ring-grid absolute inset-0 opacity-40" />
                <h4 className="relative text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  Work with us
                </h4>
                <p className="relative mt-3 text-sm text-soft-gray">
                  Bring movement intelligence to your organization. We&apos;re
                  open to conversations with healthcare, safety and research teams.
                </p>
                <Link
                  href="/#contact"
                  className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 hover:text-soft-white"
                >
                  {ctas.demo.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>

      </div>
      <ArticleDiscovery current={currentStory} stories={stories} />
    </article>
  );
}
