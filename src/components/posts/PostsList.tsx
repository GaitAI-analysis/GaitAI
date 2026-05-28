"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORY_META, Category, Post } from "@/lib/posts";
import { PostCard } from "./PostCard";

const FILTERS: Array<{ key: Category | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "research", label: "Research" },
  { key: "announcement", label: "Announcements" },
  { key: "documentation", label: "Docs" },
  { key: "approval", label: "Approvals" },
  { key: "blog", label: "Blog" },
  { key: "demo", label: "Demos" },
];

export function PostsList({ posts }: { posts: Post[] }) {
  const [active, setActive] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (active !== "all" && p.category !== active) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay =
          `${p.title} ${p.summary} ${p.tags.join(" ")} ${p.author}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [posts, active, query]);

  const featured = posts.find((p) => p.featured);
  const showFeaturedAtTop = active === "all" && !query && featured;
  const list = showFeaturedAtTop
    ? filtered.filter((p) => p.id !== featured?.id)
    : filtered;

  return (
    <>
      <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const isActive = active === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActive(f.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                    : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <label className="relative inline-flex w-full max-w-xs items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-soft-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search publications…"
            className="w-full rounded-full border border-white/10 bg-white/[0.02] py-2 pl-9 pr-3 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/15"
          />
        </label>
      </div>

      {showFeaturedAtTop && featured && (
        <div className="mt-10">
          <PostCard post={featured} featured />
        </div>
      )}

      {list.length === 0 ? (
        <div className="mt-16 grid place-items-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
          <p className="font-display text-xl text-soft-white">No publications yet</p>
          <p className="mt-1 text-sm text-soft-mute">
            Try a different filter or check back soon.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      )}

      {/* Category descriptions when an explicit filter is active */}
      {active !== "all" && (
        <p className="mt-10 max-w-xl text-sm text-soft-mute">
          <span className="text-soft-white">
            {CATEGORY_META[active as Category].label}
          </span>{" "}
          — {CATEGORY_META[active as Category].description}
        </p>
      )}
    </>
  );
}
