"use client";

/**
 * The Insights list — reads posts straight from Firestore.
 *
 * Firestore is the single source of truth. Only posts explicitly marked as
 * verified are requested by this public surface.
 */

import { useEffect, useState } from "react";
import { fetchPublishedPosts } from "@/lib/posts-firebase";
import { PostsList } from "./PostsList";
import type { Post } from "@/lib/posts";

/**
 * `hideWhenEmpty` lets a page mount the live list alongside other content: the
 * component renders nothing while loading, on failure, or when there are no
 * verified posts, instead of occupying the page with a skeleton or an empty
 * state. Used by the Insights landing, which leads with its editorial library.
 */
export function LivePostsList({
  hideWhenEmpty = false,
}: {
  hideWhenEmpty?: boolean;
} = {}) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchPublishedPosts()
      .then((live) => {
        if (!cancelled) setPosts(live);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setPosts([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (posts === null) return hideWhenEmpty ? null : <ListSkeleton />;

  if (failed) {
    return hideWhenEmpty ? null : (
      <Empty
        title="Couldn't load posts"
        body="We couldn't reach the content server. Please refresh to try again."
      />
    );
  }

  if (posts.length === 0) {
    return hideWhenEmpty ? null : (
      <Empty
        title="Nothing in the newsroom yet"
        body="New announcements, approvals and product updates will appear here."
      />
    );
  }

  return (
    <div className={hideWhenEmpty ? "mt-24" : undefined}>
      {hideWhenEmpty && (
        <div className="flex items-center gap-5">
          <h2 className="font-display text-xl text-soft-white sm:text-2xl">
            From the newsroom
          </h2>
          <span
            aria-hidden
            className="h-px flex-1 bg-gradient-to-r from-soft-mute/25 to-transparent"
          />
        </div>
      )}
      <PostsList posts={posts} />
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-6 py-20 text-center">
      <p className="font-display text-lg text-soft-white">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-soft-gray">
        {body}
      </p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 animate-pulse rounded-full bg-white/[0.05]"
          />
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl border border-white/8 bg-white/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}
