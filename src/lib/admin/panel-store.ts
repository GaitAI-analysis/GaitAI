"use client";

/**
 * Control-panel data layer — now backed by Firestore (live).
 *
 * The panel talks only to the async `PanelAdapter` interface below. Posts live
 * in the `posts` collection (src/lib/posts-firebase.ts); comments live in the
 * flat `comments` collection with reports in `reportedComments`
 * (src/lib/comments/moderation.ts). Every write is gated by the signed-in
 * admin via firestore.rules.
 */

import type { Post, Category } from "@/lib/posts";
import type { CommentDoc, ReportDoc } from "@/lib/comments/types";
import {
  deletePost as fbDeletePost,
  fetchPosts as fbFetchPosts,
  savePost as fbSavePost,
} from "@/lib/posts-firebase";
import {
  deleteComment as fbDeleteComment,
  fetchAllComments,
  fetchReports,
  resolveReport as fbResolveReport,
  setCommentHidden,
} from "@/lib/comments/moderation";

/* ------------------------------------------------------------------ types -- */

export interface PanelAdapter {
  loadPosts(): Promise<Post[]>;
  savePost(post: Post): Promise<Post[]>;
  deletePost(id: string): Promise<Post[]>;
  /** Every comment, including hidden ones (admin-only read). */
  loadComments(): Promise<CommentDoc[]>;
  loadReports(): Promise<ReportDoc[]>;
  /** Hide or restore a comment on the public site. */
  setCommentHidden(commentId: string, hidden: boolean): Promise<CommentDoc[]>;
  /** Permanently delete a comment. */
  deleteComment(commentId: string): Promise<CommentDoc[]>;
  resolveReport(reportId: string): Promise<ReportDoc[]>;
  /** False now that the panel is Firestore-backed. */
  readonly isLocal: boolean;
}

/* ------------------------------------------------------------------ utils -- */

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* --------------------------------------------------------- firebase adapter */

/** Live Firestore adapter — every call goes straight to the database. */
function createFirebaseAdapter(): PanelAdapter {
  return {
    isLocal: false,

    loadPosts: () => fbFetchPosts(),

    async savePost(post: Post) {
      await fbSavePost(post);
      return fbFetchPosts();
    },

    async deletePost(id: string) {
      await fbDeletePost(id);
      return fbFetchPosts();
    },

    loadComments: () => fetchAllComments(),

    async setCommentHidden(commentId: string, hidden: boolean) {
      await setCommentHidden(commentId, hidden);
      return fetchAllComments();
    },

    async deleteComment(commentId: string) {
      await fbDeleteComment(commentId);
      return fetchAllComments();
    },

    async loadReports() {
      const reports = await fetchReports();
      return reports.filter((r) => !r.resolved);
    },

    async resolveReport(reportId: string) {
      await fbResolveReport(reportId);
      const reports = await fetchReports();
      return reports.filter((r) => !r.resolved);
    },
  };
}

/* ---------------------------------------------------------------- factory -- */

/** Get the live Firestore-backed adapter. */
export function getAdapter(): PanelAdapter {
  return createFirebaseAdapter();
}

export type { Post, Category, CommentDoc, ReportDoc };
