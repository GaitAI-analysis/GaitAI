"use client";

/**
 * Client-only mount for the discussion widget.
 *
 * The comment system is inherently client-side (Firebase Auth + real-time
 * Firestore). Loading it with `ssr: false` keeps Firebase out of the static
 * server prerender entirely, which is required for the site's `output: export`
 * build and avoids prerendering a widget that has no server-rendered content
 * anyway. A lightweight placeholder holds the layout until it hydrates.
 */
import dynamic from "next/dynamic";
import type { ContentType } from "@/lib/comments/types";

const DiscussionSection = dynamic(
  () => import("./DiscussionSection").then((m) => m.DiscussionSection),
  {
    ssr: false,
    loading: () => (
      <section className="mt-16 border-t border-white/5 pt-12">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.06]" />
          <div className="space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-40 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      </section>
    ),
  }
);

export interface DiscussionMountProps {
  postSlug: string;
  contentType: ContentType;
  subscriberOnly?: boolean;
}

export function DiscussionMount(props: DiscussionMountProps) {
  return <DiscussionSection {...props} />;
}
