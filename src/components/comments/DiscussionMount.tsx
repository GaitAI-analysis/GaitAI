"use client";

/**
 * Client-only, lazily-mounted host for the discussion widget.
 *
 * Two levels of laziness, both deliberate:
 *
 * 1. `ssr: false` — the comment system is inherently client-side (Firebase
 *    Auth + real-time Firestore), so it stays out of the static prerender
 *    entirely, which the site's `output: export` build requires.
 *
 * 2. Viewport-gated — the widget (and the whole Firestore SDK it pulls in) is
 *    only imported once the reader scrolls near the discussion. On an article
 *    page the comments sit well below the fold, so this keeps Firebase off the
 *    critical path: opening a post costs zero Firebase bytes until it's
 *    actually needed. A placeholder reserves the space so nothing jumps.
 */
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { ContentType } from "@/lib/comments/types";

function Placeholder() {
  return (
    <section className="mt-16 border-t border-white/5 pt-12">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
          <div className="h-3 w-40 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </div>
    </section>
  );
}

const DiscussionSection = dynamic(
  () => import("./DiscussionSection").then((m) => m.DiscussionSection),
  { ssr: false, loading: Placeholder },
);

export interface DiscussionMountProps {
  postSlug: string;
  contentType: ContentType;
  subscriberOnly?: boolean;
}

export function DiscussionMount(props: DiscussionMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    // No IntersectionObserver (very old browsers) → just load it.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Start loading a screen early so it's ready by the time it's reached.
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref}>
      {visible ? <DiscussionSection {...props} /> : <Placeholder />}
    </div>
  );
}
