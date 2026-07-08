"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import type { User } from "firebase/auth";
import { cn } from "@/lib/utils";
import {
  CAPTCHA_ENABLED,
  MAX_COMMENT_LENGTH,
} from "@/lib/comments/config";
import { submitComment } from "@/lib/comments/service";
import type { ContentType } from "@/lib/comments/types";
import type { ToastTone } from "./Toast";
import { Turnstile } from "./Turnstile";

interface CommentFormProps {
  postSlug: string;
  contentType: ContentType;
  parentCommentId?: string | null;
  user?: User | null;
  compact?: boolean;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  onCancel?: () => void;
  notify: (tone: ToastTone, text: string) => void;
}

const fieldCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-soft-white placeholder:text-soft-mute outline-none transition-all duration-200 focus:border-cyan-300/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-300/20";

export function CommentForm({
  postSlug,
  contentType,
  parentCommentId = null,
  user = null,
  compact = false,
  autoFocus = false,
  onSubmitted,
  onCancel,
  notify,
}: CommentFormProps) {
  const [name, setName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_COMMENT_LENGTH - message.length;
  const isReply = Boolean(parentCommentId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (CAPTCHA_ENABLED && !captchaToken) {
      setError("Please complete the verification challenge.");
      return;
    }

    setSubmitting(true);
    const res = await submitComment({
      postSlug,
      contentType,
      userName: name,
      email,
      message,
      parentCommentId,
      userId: user?.uid ?? null,
      captchaToken,
    });
    setSubmitting(false);

    if (res.ok) {
      setMessage("");
      if (!user) setName("");
      setCaptchaToken(null);
      notify(
        "success",
        "Thank you. Your comment has been submitted for approval."
      );
      onSubmitted?.();
    } else {
      setError(res.message);
      notify("error", res.message);
    }
  }

  return (
    <motion.form
      initial={isReply ? { opacity: 0, height: 0 } : false}
      animate={isReply ? { opacity: 1, height: "auto" } : undefined}
      onSubmit={handleSubmit}
      className={cn(
        "relative",
        compact ? "mt-3" : "card p-5 sm:p-6"
      )}
    >
      {!compact && (
        <div className="mb-4 flex items-center gap-2">
          <h4 className="font-display text-base text-soft-white">
            Join the discussion
          </h4>
        </div>
      )}

      {!user && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="sr-only" htmlFor={`c-name-${parentCommentId}`}>
              Your name
            </label>
            <input
              id={`c-name-${parentCommentId}`}
              className={fieldCls}
              placeholder="Your name"
              value={name}
              maxLength={80}
              autoComplete="name"
              autoFocus={autoFocus}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="sr-only" htmlFor={`c-email-${parentCommentId}`}>
              Email (optional)
            </label>
            <input
              id={`c-email-${parentCommentId}`}
              type="email"
              className={fieldCls}
              placeholder="Email (optional, never shown)"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={cn(!user && "mt-3")}>
        <label className="sr-only" htmlFor={`c-msg-${parentCommentId}`}>
          Your comment
        </label>
        <textarea
          id={`c-msg-${parentCommentId}`}
          className={cn(fieldCls, "min-h-[96px] resize-y")}
          placeholder={
            isReply ? "Write a reply…" : "Share your thoughts…"
          }
          value={message}
          maxLength={MAX_COMMENT_LENGTH}
          autoFocus={autoFocus && Boolean(user)}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      <Turnstile onToken={setCaptchaToken} />

      {error && (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] text-soft-mute">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-300/80" />
            Reviewed before publishing
          </span>
          <span
            className={cn(
              "tabular-nums",
              remaining < 80 ? "text-amber-300" : "text-soft-mute"
            )}
          >
            {remaining}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-4 py-2 text-sm text-soft-mute transition-colors hover:text-soft-white"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Submitting…" : isReply ? "Post reply" : "Post comment"}
          </button>
        </div>
      </div>
    </motion.form>
  );
}
