import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  User,
} from "lucide-react";
import { getPublishedPostBySlug, readPosts, readPublishedPosts } from "@/lib/posts-store";
import { CategoryBadge, categoryGradient } from "@/components/posts/CategoryBadge";
import { PostCard } from "@/components/posts/PostCard";
import { PostCoverImage, PostResources } from "@/components/posts/PostMedia";
import { renderMarkdown } from "@/lib/markdown";
import { DiscussionMount } from "@/components/comments/DiscussionMount";

export const dynamicParams = false;

export async function generateStaticParams() {
  // Next static export requires at least one known parameter even when all
  // current editorial seed records are intentionally withheld from public
  // rendering. Each unverified record resolves through notFound() below.
  const posts = await readPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
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
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const all = await readPublishedPosts();
  const related = all
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  return (
    <article className="relative w-full overflow-hidden pb-24">
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
            <div className="sticky top-32 space-y-6">
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
                  Request a demo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-24 border-t border-white/5 pt-16">
            <h3 className="font-display text-2xl text-soft-white sm:text-3xl">
              More from{" "}
              <span className="text-gradient">
                {post.category}
              </span>
            </h3>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <PostCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
