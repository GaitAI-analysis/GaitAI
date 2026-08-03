"use client";

/**
 * Comments — moderation for a site where comments publish instantly.
 *
 * There is no approval queue: every comment is live the moment it's posted.
 * Moderation is after-the-fact, so this view lists everything and offers two
 * actions — HIDE (reversible; pulls it from the public site but keeps the
 * record) and DELETE (permanent, with a confirm step). Reader reports live on
 * a second tab.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Eye,
  EyeOff,
  Flag,
  MessageSquareText,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { CommentDoc, ReportDoc } from "@/lib/admin/panel-store";
import { CategoryBadge } from "@/components/posts/CategoryBadge";
import { EmptyState, timeAgo } from "./ui";

type QueueTab = "all" | "reports";
type Visibility = "all" | "visible" | "hidden";

export function CommentsView({
  comments,
  reports,
  onToggleHidden,
  onDelete,
  onResolve,
}: {
  comments: CommentDoc[];
  reports: ReportDoc[];
  onToggleHidden: (commentId: string, hidden: boolean) => void;
  onDelete: (commentId: string) => void;
  onResolve: (reportId: string) => void;
}) {
  const [tab, setTab] = useState<QueueTab>("all");
  const [visibility, setVisibility] = useState<Visibility>("all");
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const hiddenCount = useMemo(
    () => comments.filter((c) => c.hidden).length,
    [comments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return comments.filter((c) => {
      if (visibility === "visible" && c.hidden) return false;
      if (visibility === "hidden" && !c.hidden) return false;
      if (!q) return true;
      return `${c.userName} ${c.message} ${c.postId}`.toLowerCase().includes(q);
    });
  }, [comments, visibility, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-soft-white sm:text-3xl">
            Comments
          </h2>
          <p className="mt-1 text-sm text-soft-mute">
            Comments post instantly. Hide anything that doesn&apos;t belong, or
            delete it for good.
          </p>
        </div>

        <div className="flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          {(
            [
              { id: "all", label: "All comments", count: comments.length },
              { id: "reports", label: "Reports", count: reports.length },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? "text-soft-white"
                  : "text-soft-mute hover:text-soft-gray"
              }`}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="queue-tab"
                  className="absolute inset-0 rounded-full bg-white/[0.07] ring-1 ring-white/10"
                />
              )}
              <span className="relative">{t.label}</span>
              {t.count > 0 && (
                <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 text-[10px] font-semibold text-soft-gray">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "all" ? (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "all", label: `All (${comments.length})` },
                  {
                    id: "visible",
                    label: `Visible (${comments.length - hiddenCount})`,
                  },
                  { id: "hidden", label: `Hidden (${hiddenCount})` },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setVisibility(f.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                    visibility === f.id
                      ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                      : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}

              <div className="relative ml-auto">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-soft-mute" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search comments…"
                  className="w-full min-w-[200px] rounded-full border border-white/10 bg-white/[0.02] py-1.5 pl-9 pr-3 text-xs text-soft-white outline-none transition-colors placeholder:text-soft-mute focus:border-cyan-300/40"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<MessageSquareText className="h-5 w-5" />}
                title={
                  comments.length === 0 ? "No comments yet" : "Nothing matches"
                }
                body={
                  comments.length === 0
                    ? "Comments appear here the moment a reader posts one."
                    : "Try a different filter or search term."
                }
              />
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {filtered.map((c) => (
                    <motion.li
                      key={c.commentId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                      className={`card p-5 transition-opacity ${
                        c.hidden ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300/[0.08] font-display text-sm text-cyan-300 ring-1 ring-cyan-300/25">
                          {c.userName.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-soft-white">
                            {c.userName}
                            {c.email && (
                              <span className="text-[11px] font-normal text-soft-mute">
                                {c.email}
                              </span>
                            )}
                            {c.hidden && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-300/25">
                                <EyeOff className="h-2.5 w-2.5" />
                                Hidden
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-soft-mute">
                            {timeAgo(c.createdAt)} · on{" "}
                            <span className="text-soft-gray">{c.postId}</span>
                            {c.parentCommentId && " · reply"}
                          </p>
                        </div>
                        <span className="ml-auto">
                          <CategoryBadge category={c.contentType} />
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-soft-gray ring-1 ring-white/5">
                        {c.message}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        {confirmId === c.commentId ? (
                          <>
                            <span className="mr-auto text-xs text-soft-mute">
                              Delete permanently? This can&apos;t be undone.
                            </span>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-soft-mute transition-all hover:text-soft-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                onDelete(c.commentId);
                                setConfirmId(null);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-400/90 px-4 py-2 text-xs font-medium text-obsidian transition-all hover:bg-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Yes, delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setConfirmId(c.commentId)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-soft-mute transition-all hover:border-red-300/40 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                            <button
                              onClick={() =>
                                onToggleHidden(c.commentId, !c.hidden)
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                                c.hidden
                                  ? "bg-emerald-400/90 text-obsidian hover:bg-emerald-300"
                                  : "border border-white/10 bg-white/[0.02] text-soft-white hover:border-amber-300/40 hover:text-amber-300"
                              }`}
                            >
                              {c.hidden ? (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  Show again
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Hide
                                </>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {reports.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="h-5 w-5" />}
                title="No open reports"
                body="When a reader flags a comment, it shows up here."
              />
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {reports.map((r) => (
                    <motion.li
                      key={r.reportId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                      className="card flex flex-wrap items-center gap-4 p-5"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-300/[0.08] text-violet-300 ring-1 ring-violet-300/25">
                        <Flag className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-soft-white">{r.reason}</p>
                        <p className="mt-0.5 text-[11px] text-soft-mute">
                          {timeAgo(r.createdAt)} · comment{" "}
                          <span className="text-soft-gray">{r.commentId}</span>{" "}
                          on <span className="text-soft-gray">{r.postId}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => onToggleHidden(r.commentId, true)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-soft-white transition-all hover:border-amber-300/40 hover:text-amber-300"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Hide comment
                      </button>
                      <button
                        onClick={() => onResolve(r.reportId)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-soft-white transition-all hover:border-emerald-300/40 hover:text-emerald-300"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark resolved
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="flex items-center gap-2 text-[11px] text-soft-mute">
        <MessageSquareText className="h-3 w-3" />
        Hidden comments stay in the database but can&apos;t be read by visitors —
        enforced by the security rules, not just the interface.
      </p>
    </div>
  );
}
