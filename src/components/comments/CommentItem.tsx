"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Loader2, Reply } from "lucide-react";
import type { User } from "firebase/auth";
import { cn } from "@/lib/utils";
import { MAX_REPLY_DEPTH } from "@/lib/comments/config";
import { reportComment } from "@/lib/comments/service";
import { avatarAccent, initials, relativeTime } from "@/lib/comments/format";
import type { ContentType, ThreadedComment } from "@/lib/comments/types";
import type { ToastTone } from "./Toast";
import { CommentForm } from "./CommentForm";

interface CommentItemProps {
  comment: ThreadedComment;
  postSlug: string;
  contentType: ContentType;
  user?: User | null;
  notify: (tone: ToastTone, text: string) => void;
}

export function CommentItem({
  comment,
  postSlug,
  contentType,
  user = null,
  notify,
}: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reported, setReported] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  const canNest = comment.depth < MAX_REPLY_DEPTH;

  async function handleReport() {
    setSendingReport(true);
    const res = await reportComment({
      postSlug,
      commentId: comment.commentId,
      reason: reportReason || "Reported by a reader",
      reportedBy: user?.email ?? null,
    });
    setSendingReport(false);
    if (res.ok) {
      setReported(true);
      setReporting(false);
      notify("success", "Thanks — this comment has been flagged for review.");
    } else {
      notify("error", "Couldn't submit the report. Please try again.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        comment.depth > 0 &&
          "mt-4 border-l border-white/[0.07] pl-4 sm:pl-5"
      )}
    >
      <div className="flex gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-semibold ring-1 ring-white/10",
            avatarAccent(comment.userName)
          )}
          aria-hidden
        >
          {initials(comment.userName)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-soft-white">
              {comment.userName}
            </span>
            <span className="text-[11px] text-soft-mute">
              {relativeTime(comment.createdAt)}
            </span>
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-soft-gray">
            {comment.message}
          </p>

          <div className="mt-2 flex items-center gap-4 text-[11px]">
            {canNest && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1.5 text-soft-mute transition-colors hover:text-cyan-300"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            {!reported ? (
              <button
                type="button"
                onClick={() => setReporting((v) => !v)}
                className="inline-flex items-center gap-1.5 text-soft-mute transition-colors hover:text-rose-300"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-soft-mute">
                <Flag className="h-3.5 w-3.5" />
                Flagged
              </span>
            )}
          </div>

          {reporting && !reported && (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <input
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-soft-white placeholder:text-soft-mute outline-none focus:border-rose-300/40 focus:ring-2 focus:ring-rose-300/20"
                placeholder="Reason (optional)"
                value={reportReason}
                maxLength={300}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReporting(false)}
                  className="rounded-full px-3 py-1.5 text-xs text-soft-mute hover:text-soft-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReport}
                  disabled={sendingReport}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/15 px-3 py-1.5 text-xs font-medium text-rose-200 ring-1 ring-rose-300/30 transition-colors hover:bg-rose-400/25 disabled:opacity-60"
                >
                  {sendingReport && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  Submit report
                </button>
              </div>
            </div>
          )}

          {replying && canNest && (
            <CommentForm
              postSlug={postSlug}
              contentType={contentType}
              parentCommentId={comment.commentId}
              user={user}
              compact
              autoFocus
              onSubmitted={() => setReplying(false)}
              onCancel={() => setReplying(false)}
              notify={notify}
            />
          )}

          {comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((child) => (
                <CommentItem
                  key={child.commentId}
                  comment={child}
                  postSlug={postSlug}
                  contentType={contentType}
                  user={user}
                  notify={notify}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
