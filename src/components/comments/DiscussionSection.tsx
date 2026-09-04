"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessagesSquare, WifiOff } from "lucide-react";
import {
  buildThread,
  subscribeApprovedComments,
} from "@/lib/comments/service";
import { useSubscription } from "@/lib/comments/subscription";
import type { CommentDoc, ContentType } from "@/lib/comments/types";
import { CommentForm } from "./CommentForm";
import { CommentItem } from "./CommentItem";
import { LockedState } from "./LockedState";
import { ToastViewport, useToast } from "./Toast";

export interface DiscussionSectionProps {
  postSlug: string;
  contentType: ContentType;
  /** When true, only subscribed users may read & comment. */
  subscriberOnly?: boolean;
}

export function DiscussionSection({
  postSlug,
  contentType,
  subscriberOnly = false,
}: DiscussionSectionProps) {
  const { toasts, notify, dismiss } = useToast();
  const { loading: subLoading, user, isSubscribed } = useSubscription();

  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const gated = subscriberOnly && !isSubscribed;

  useEffect(() => {
    // Don't open a stream for gated viewers — they can't read these comments.
    if (gated || subLoading) return;
    setLoading(true);
    setError(false);
    const unsub = subscribeApprovedComments(
      postSlug,
      (next) => {
        setComments(next);
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
    return unsub;
  }, [postSlug, gated, subLoading]);

  const threaded = useMemo(() => buildThread(comments), [comments]);
  const count = comments.length;

  return (
    <section
      id="discussion"
      aria-label="Discussion"
      className="site-anchor-offset mt-16 border-t border-white/5 pt-12"
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-royal-400/25 to-cyan-300/15 text-cyan-300 ring-1 ring-white/10">
            <MessagesSquare className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-xl text-soft-white sm:text-2xl">
              Discussion
            </h2>
            {/* No subtitle at zero. "Be the first to comment" is the same
                invitation the removed empty-state card made, one line higher
                up — and on a journal this young it appeared under every
                article. The count returns as soon as there is one. */}
            {(gated || count > 0) && (
              <p className="text-xs text-soft-mute">
                {gated
                  ? "Subscriber-only conversation"
                  : `${count} ${count === 1 ? "comment" : "comments"}`}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mt-7">
        {subLoading ? (
          <DiscussionSkeleton />
        ) : gated ? (
          <LockedState signedIn={Boolean(user)} />
        ) : (
          <>
            <CommentForm
              postSlug={postSlug}
              contentType={contentType}
              user={user}
              notify={notify}
            />

            {/* NOTHING IS RENDERED WHEN THERE ARE NO COMMENTS — not a card,
                not an icon, not a margin. The empty state used to be a
                bordered panel saying "No comments yet", which on a young
                journal appeared under every article and made each one look
                unread. The composer above is invitation enough.

                The wrapper's top margin is conditional for the same reason:
                an empty `mt-8` div would leave 32px of blank page under the
                form and reintroduce the hole the card was filling. The error
                state stays — a failed load is information, not emptiness. */}
            {(loading || error || count > 0) && (
              <div className="mt-8">
                {loading ? (
                  <DiscussionSkeleton rows={2} />
                ) : error ? (
                  <EmptyOrError
                    icon={<WifiOff className="h-5 w-5" />}
                    title="Couldn't load the discussion"
                    body="Please check your connection and refresh the page."
                  />
                ) : (
                <AnimatePresence initial={false}>
                  <div className="space-y-6">
                    {threaded.map((c) => (
                      <CommentItem
                        key={c.commentId}
                        comment={c}
                        postSlug={postSlug}
                        contentType={contentType}
                        user={user}
                        notify={notify}
                      />
                    ))}
                  </div>
                  </AnimatePresence>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </section>
  );
}

function DiscussionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="card flex gap-3 p-5"
          aria-hidden
        >
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyOrError({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center gap-2 px-6 py-10 text-center"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04] text-soft-mute ring-1 ring-white/10">
        {icon}
      </span>
      <h3 className="mt-1 text-sm font-medium text-soft-white">{title}</h3>
      <p className="max-w-xs text-xs leading-relaxed text-soft-mute">{body}</p>
    </motion.div>
  );
}
