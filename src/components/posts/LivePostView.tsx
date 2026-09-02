"use client";

/**
 * Client-rendered publication page, used as the fallback for posts that were
 * published to Firestore AFTER the last static build.
 *
 * The site is a static export, so /publications/[slug] only pre-renders slugs
 * that existed at build time. When a visitor hits a newer post, the host serves
 * the 404 page — which mounts this component, looks the slug up live in
 * Firestore, and renders the real article. The post therefore works instantly
 * on publish, and gets promoted to a fully pre-rendered page on the next build.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  User,
} from "lucide-react";
import { fetchPostBySlug } from "@/lib/posts-firebase";
import { CategoryBadge, categoryGradient } from "@/components/posts/CategoryBadge";
import { PostCoverImage, PostResources } from "@/components/posts/PostMedia";
import { renderMarkdown } from "@/lib/markdown";
import { DiscussionMount } from "@/components/comments/DiscussionMount";
import type { Post } from "@/lib/posts";

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

type State =
  | { phase: "loading" }
  | { phase: "found"; post: Post }
  | { phase: "missing" };

export function LivePostView({ slug }: { slug: string }) {
  const [state, setState] = useState<State>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    // Exactly ONE Firestore read: the single post being opened.
    fetchPostBySlug(slug)
      .then((post) => {
        if (cancelled) return;
        setState(post ? { phase: "found", post } : { phase: "missing" });
      })
      .catch(() => {
        if (!cancelled) setState({ phase: "missing" });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.phase === "loading") return <ArticleSkeleton />;
  if (state.phase === "missing") return <NotFoundBlock />;

  const { post } = state;

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
            href="/insights"
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
                  partnering with hospitals, agencies &amp; researchers.
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

        {/* No "related posts" grid here on purpose — computing it would mean
            downloading the whole collection just to show three cards. The
            pre-rendered page (built on the next deploy) shows them instead. */}
        <div className="mt-24 border-t border-white/5 pt-16 text-center">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 transition-colors hover:text-soft-white"
          >
            Browse all insights
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ArticleSkeleton() {
  return (
    <div className="site-page-intro-roomy container-wide pb-24">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="h-6 w-32 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-12 w-2/3 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-4 w-full animate-pulse rounded bg-white/[0.04]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-white/[0.04]" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-full animate-pulse rounded bg-white/[0.03]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFoundBlock() {
  return (
    <div className="site-page-intro-roomy container-wide grid min-h-[70vh] place-items-center pb-24 text-center">
      <div className="max-w-md">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          404 — Not found
        </div>
        <h1 className="mt-4 font-display text-display-md text-balance text-soft-white">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-soft-gray">
          The link may be broken, or the publication may have been moved or
          unpublished.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/insights" className="btn-primary">
            Browse all insights
          </Link>
          <Link href="/" className="btn-ghost">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
