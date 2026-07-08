/* CLIENT-SAFE types & shared shapes for the moderated comment system. */

import type { Category } from "@/lib/posts";

/**
 * `contentType` mirrors the post's existing publication category — we keep the
 * site's real taxonomy rather than inventing a parallel one. The admin panel can
 * filter on these directly.
 */
export type ContentType = Category;

export type CommentStatus = "pending" | "approved" | "rejected";

export interface CommentDoc {
  /** Stable id, also used as the Firestore document id. */
  commentId: string;
  /** Post slug — both `postId` and `contentId` carry it for forward-compat. */
  postId: string;
  contentId: string;
  contentType: ContentType;
  userName: string;
  /** Optional — only stored when supplied / available from auth. */
  email: string | null;
  message: string;
  /** ISO string mirror of the Firestore server timestamp (for easy rendering). */
  createdAt: string;
  status: CommentStatus;
  approvedAt: string | null;
  approvedBy: string | null;
  /** Set when this is a reply; null for a top-level comment. */
  parentCommentId: string | null;
  /** Firebase Auth uid when the author was signed in, else null. */
  userId: string | null;
}

/** A comment plus its (already-threaded) replies, used by the public renderer. */
export interface ThreadedComment extends CommentDoc {
  replies: ThreadedComment[];
  depth: number;
}

export interface ReportDoc {
  reportId: string;
  postId: string;
  commentId: string;
  reason: string;
  reportedBy: string | null;
  createdAt: string;
  resolved: boolean;
}

/** Input accepted by the public submit flow. */
export interface NewCommentInput {
  postSlug: string;
  contentType: ContentType;
  userName: string;
  email?: string | null;
  message: string;
  parentCommentId?: string | null;
  userId?: string | null;
  /** Cloudflare Turnstile token, when the CAPTCHA gate is enabled. */
  captchaToken?: string | null;
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; code: SubmitErrorCode; message: string };

export type SubmitErrorCode =
  | "validation"
  | "too-long"
  | "too-short"
  | "blocked-words"
  | "duplicate"
  | "rate-limited"
  | "captcha"
  | "network";
