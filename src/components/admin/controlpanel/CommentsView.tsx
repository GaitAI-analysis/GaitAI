"use client";

/**
 * Comments — moderation queue for pending comments and reader reports.
 * Replaces the retired static admin-comments.html page. Actions flow through
 * the panel adapter (local today; the Firestore moderation collections —
 * pendingCommentQueue / reportedComments — plug in later without UI changes).
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Flag,
  Inbox,
  MessageSquareText,
  ShieldCheck,
  X,
} from "lucide-react";
import { CATEGORY_META, type Category } from "@/lib/posts";
import type { CommentDoc, ReportDoc } from "@/lib/admin/panel-store";
import { CategoryBadge } from "@/components/posts/CategoryBadge";
import { EmptyState, timeAgo } from "./ui";

type QueueTab = "pending" | "reports";

export function CommentsView({
  pending,
  reports,
  onApprove,
  onReject,
  onResolve,
}: {
  pending: CommentDoc[];
  reports: ReportDoc[];
  onApprove: (commentId: string) => void;
  onReject: (commentId: string) => void;
  onResolve: (reportId: string) => void;
}) {
  const [tab, setTab] = useState<QueueTab>("pending");
  const [filter, setFilter] = useState<Category | "all">("all");

  const filteredPending = useMemo(
    () =>
      filter === "all"
        ? pending
        : pending.filter((c) => c.contentType === filter),
    [pending, filter]
  );

  const usedCategories = useMemo(
    () => Array.from(new Set(pending.map((c) => c.contentType))),
    [pending]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-soft-white sm:text-3xl">
            Comments
          </h2>
          <p className="mt-1 text-sm text-soft-mute">
            Approve what belongs on the site — reject what doesn&apos;t.
          </p>
        </div>

        {/* Queue tabs */}
        <div className="flex rounded-full border border-white/10 bg-white/[0.02] p-1">
          {(
            [
              { id: "pending", label: "Queue", count: pending.length },
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
                <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-300/15 px-1 text-[10px] font-semibold text-amber-300">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "pending" ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Category filter — only categories present in the queue */}
            {usedCategories.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {(["all", ...usedCategories] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                      filter === c
                        ? "border-cyan-300/50 bg-cyan-300/[0.08] text-cyan-300"
                        : "border-white/10 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
                    }`}
                  >
                    {c === "all" ? "All" : CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
            )}

            {filteredPending.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-5 w-5" />}
                title="Queue is clear"
                body="New comments land here for review before they appear on the site."
              />
            ) : (
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {filteredPending.map((c) => (
                    <motion.li
                      key={c.commentId}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                      className="card p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-300/[0.08] font-display text-sm text-cyan-300 ring-1 ring-cyan-300/25">
                          {c.userName.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-soft-white">
                            {c.userName}
                            {c.email && (
                              <span className="ml-2 text-[11px] font-normal text-soft-mute">
                                {c.email}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-soft-mute">
                            {timeAgo(c.createdAt)} · on{" "}
                            <span className="text-soft-gray">{c.postId}</span>
                          </p>
                        </div>
                        <span className="ml-auto">
                          <CategoryBadge category={c.contentType} />
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-soft-gray ring-1 ring-white/5">
                        {c.message}
                      </p>

                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          onClick={() => onReject(c.commentId)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-soft-mute transition-all hover:border-red-300/40 hover:text-red-300"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                        <button
                          onClick={() => onApprove(c.commentId)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/90 px-4 py-2 text-xs font-medium text-obsidian transition-all hover:bg-emerald-300"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Approve
                        </button>
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
                body="When readers flag an approved comment, it shows up here."
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

      {/* Footnote */}
      <p className="flex items-center gap-2 text-[11px] text-soft-mute">
        <MessageSquareText className="h-3 w-3" />
        Approvals publish to the live discussion once Firebase is connected —
        for now they update the local dataset.
      </p>
    </div>
  );
}
