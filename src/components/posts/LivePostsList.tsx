"use client";

/**
 * The Insights list — reads posts straight from Firestore.
 *
 * Firestore is the single source of truth. Whatever the control panel writes
 * or deletes is exactly what shows here: no build-time copy, no merging, no
 * fallback list that can go stale.
 */

import { useEffect, useState } from "react";
import { fetchPosts } from "@/lib/posts-firebase";
import { PostsList } from "./PostsList";
import type { Post } from "@/lib/posts";

export function LivePostsList() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchPosts()
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

  if (posts === null) return <ListSkeleton />;

  if (failed) {
    return (
      <Empty
        title="Couldn't load posts"
        body="We couldn't reach the content server. Please refresh to try again."
      />
    );
  }

  if (posts.length === 0) {
    return (
      <Empty
        title="No posts published yet"
        body="New research notes, announcements and essays will appear here."
      />
    );
  }

  return <PostsList posts={posts} />;
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
