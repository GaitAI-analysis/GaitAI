"use client";

import {
  Clock,
  FileText,
  Flag,
  MessageSquareText,
  Star,
} from "lucide-react";
import { CATEGORY_META } from "@/lib/posts";
import type { CommentDoc, Post, ReportDoc } from "@/lib/admin/panel-store";
import { CategoryBadge } from "@/components/posts/CategoryBadge";
import type { PanelTab } from "./ControlPanel";
import { JournalViewsPanel } from "./JournalViewsPanel";
import { StatCard, formatDate, timeAgo } from "./ui";

export function OverviewView({
  posts,
  comments,
  reports,
  onNavigate,
}: {
  posts: Post[];
  comments: CommentDoc[];
  reports: ReportDoc[];
  onNavigate: (tab: PanelTab) => void;
}) {
  const hidden = comments.filter((c) => c.hidden).length;
  const featured = posts.filter((p) => p.featured).length;
  const recent = [...posts]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 5);

  const byCategory = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  const maxCat = Math.max(1, ...Object.values(byCategory));

  return (
    <div className="space-y-6">
      {/* Journal view counters — read live from articleStats, so this and the
          public counts come from one place. */}
      <JournalViewsPanel />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          label="Published posts"
          value={posts.length}
          hint="Across the Journal & publications"
          tone="cyan"
        />
        <StatCard
          icon={<MessageSquareText className="h-4 w-4" />}
          label="Comments"
          value={comments.length}
          hint={hidden > 0 ? `${hidden} hidden from the site` : "All visible"}
          tone="amber"
        />
        <StatCard
          icon={<Flag className="h-4 w-4" />}
          label="Open reports"
          value={reports.length}
          hint="Flagged by readers"
          tone="violet"
        />
        <StatCard
          icon={<Star className="h-4 w-4" />}
          label="Featured"
          value={featured}
          hint="Highlighted on the site"
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* Recent posts */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h3 className="font-display text-lg text-soft-white">
              Latest content
            </h3>
            <button
              onClick={() => onNavigate("content")}
              className="text-xs text-cyan-300 hover:underline"
            >
              Open Content Studio →
            </button>
          </header>
          <ul className="divide-y divide-white/5">
            {recent.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
              >
                <CategoryBadge category={p.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-soft-white">{p.title}</p>
                  <p className="mt-0.5 text-[11px] text-soft-mute">
                    {p.author} · {formatDate(p.publishedAt)}
                  </p>
                </div>
                {p.featured && (
                  <Star className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          {/* Category distribution */}
          <section className="card p-5">
            <h3 className="font-display text-lg text-soft-white">
              Content mix
            </h3>
            <ul className="mt-4 space-y-3">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const n = byCategory[key] ?? 0;
                return (
                  <li key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-soft-gray">{meta.label}</span>
                      <span className="text-soft-mute">{n}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400/80 to-cyan-300/50 transition-all duration-500"
                        style={{ width: `${(n / maxCat) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Moderation shortcut */}
          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-soft-white">
              <Clock className="h-4 w-4 text-amber-300" />
              Recent activity
            </h3>
            {comments.length === 0 && reports.length === 0 ? (
              <p className="mt-3 text-sm text-soft-mute">
                All clear — no comments or reports yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {comments.slice(0, 3).map((c) => (
                  <li key={c.commentId} className="text-xs leading-relaxed">
                    <span className="text-soft-white">{c.userName}</span>{" "}
                    <span className="text-soft-mute">
                      commented · {timeAgo(c.createdAt)}
                    </span>
                    <p className="mt-0.5 line-clamp-2 text-soft-gray">
                      “{c.message}”
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => onNavigate("comments")}
              className="btn-primary mt-4 w-full justify-center text-xs"
            >
              Manage comments
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
