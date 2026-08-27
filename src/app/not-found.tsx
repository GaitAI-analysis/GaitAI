"use client";

/**
 * Global 404 — and the live-publish fallback.
 *
 * On a static export, only the routes that existed at build time have HTML.
 * A post published from the control panel afterwards therefore lands here.
 * When the path looks like /publications/<slug>, we hand off to LivePostView,
 * which resolves the slug against Firestore and renders the real article.
 * Anything else gets a normal, on-brand 404.
 *
 * (Next.js exports this file as 404.html, which GitHub Pages serves for every
 * unknown path — so the fallback works in production too.)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { LivePostView } from "@/components/posts/LivePostView";

/** Pull "<slug>" out of "/publications/<slug>/" — null if it isn't one. */
function publicationSlug(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "publications") {
    return decodeURIComponent(parts[1]);
  }
  return null;
}

export default function NotFound() {
  // Resolved on the client only — the exported HTML is path-agnostic.
  const [slug, setSlug] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSlug(publicationSlug(window.location.pathname));
    setReady(true);
  }, []);

  if (!ready) return <div className="min-h-[70vh]" />;
  if (slug) return <LivePostView slug={slug} />;

  return (
    <div className="site-page-intro-roomy container-wide grid min-h-[70vh] place-items-center pb-24 text-center">
      <div className="max-w-md">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
          404 — Not found
        </div>
        <h1 className="mt-4 font-display text-display-md text-balance text-soft-white">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-soft-gray">
          The link may be broken, or the page may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go home
          </Link>
          <Link href="/insights" className="btn-ghost">
            Browse insights
          </Link>
        </div>
      </div>
    </div>
  );
}
