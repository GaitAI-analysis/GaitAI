"use client";

/**
 * Control-panel data layer — SINGLE SEAM for the future Firebase wiring.
 *
 * The panel talks only to the `PanelAdapter` interface below. Today it is
 * backed by localStorage (seeded from `data/posts.json` + sample moderation
 * items) so the whole UI is fully usable with zero backend.
 *
 * WHEN WIRING FIREBASE: implement `createFirebaseAdapter()` with the same
 * interface (posts → a `posts` collection; comments → the existing
 * pendingCommentQueue / postComments / reportedComments collections used by
 * src/lib/comments/service.ts) and swap it in `getAdapter()`. Nothing in the
 * UI needs to change.
 */

import type { Post, Category } from "@/lib/posts";
import type { CommentDoc, ReportDoc } from "@/lib/comments/types";
import postsSeed from "../../../data/posts.json";

/* ------------------------------------------------------------------ types -- */

export interface PanelAdapter {
  loadPosts(): Post[];
  savePost(post: Post): Post[];
  deletePost(id: string): Post[];
  loadPending(): CommentDoc[];
  loadReports(): ReportDoc[];
  approveComment(commentId: string): { pending: CommentDoc[] };
  rejectComment(commentId: string): { pending: CommentDoc[] };
  resolveReport(reportId: string): ReportDoc[];
  /** True while running on sample/local data (Firebase not wired yet). */
  readonly isLocal: boolean;
}

/* ------------------------------------------------------------------ utils -- */

const KEYS = {
  posts: "gaitai:cp:posts",
  pending: "gaitai:cp:pendingComments",
  reports: "gaitai:cp:reports",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — non-fatal, session-only state */
  }
}

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

/* ------------------------------------------------------------ sample seed -- */

const daysAgo = (n: number, h = 0) =>
  new Date(Date.now() - n * 864e5 - h * 36e5).toISOString();

/** Sample moderation items so the queue UI is demonstrable pre-Firebase. */
const SAMPLE_PENDING: CommentDoc[] = [
  {
    commentId: "sample_c1",
    postId: "early-parkinsonian-gait-detection",
    contentId: "early-parkinsonian-gait-detection",
    contentType: "research",
    userName: "Dr. Meera Iyer",
    email: "meera@example.org",
    message:
      "Impressive sensitivity numbers. Did you validate against the PPMI cohort, or is this an internal dataset only?",
    createdAt: daysAgo(0, 3),
    status: "pending",
    approvedAt: null,
    approvedBy: null,
    parentCommentId: null,
    userId: null,
  },
  {
    commentId: "sample_c2",
    postId: "gaitai-care-preview-launches",
    contentId: "gaitai-care-preview-launches",
    contentType: "announcement",
    userName: "Rohit S.",
    email: null,
    message:
      "Congrats on the launch! Is the Care preview available for clinics in India yet?",
    createdAt: daysAgo(1),
    status: "pending",
    approvedAt: null,
    approvedBy: null,
    parentCommentId: null,
    userId: null,
  },
  {
    commentId: "sample_c3",
    postId: "gaitai-edge-sdk-getting-started",
    contentId: "gaitai-edge-sdk-getting-started",
    contentType: "documentation",
    userName: "anon_user_42",
    email: null,
    message: "check out my site for cheap followers >>> spamlink.example",
    createdAt: daysAgo(2, 5),
    status: "pending",
    approvedAt: null,
    approvedBy: null,
    parentCommentId: null,
    userId: null,
  },
];

const SAMPLE_REPORTS: ReportDoc[] = [
  {
    reportId: "sample_r1",
    postId: "gaitai-begins-iso-13485-readiness",
    commentId: "approved_c9",
    reason: "Off-topic self promotion in the replies.",
    reportedBy: null,
    createdAt: daysAgo(1, 8),
    resolved: false,
  },
];

/* -------------------------------------------------------- local adapter --- */

function seedPosts(): Post[] {
  return (postsSeed as { posts: Post[] }).posts;
}

function createLocalAdapter(): PanelAdapter {
  return {
    isLocal: true,

    loadPosts: () => read<Post[]>(KEYS.posts, seedPosts()),

    savePost(post: Post) {
      const posts = read<Post[]>(KEYS.posts, seedPosts());
      const idx = posts.findIndex((p) => p.id === post.id);
      const next =
        idx === -1
          ? [post, ...posts]
          : posts.map((p) => (p.id === post.id ? post : p));
      write(KEYS.posts, next);
      return next;
    },

    deletePost(id: string) {
      const next = read<Post[]>(KEYS.posts, seedPosts()).filter(
        (p) => p.id !== id
      );
      write(KEYS.posts, next);
      return next;
    },

    loadPending: () => read<CommentDoc[]>(KEYS.pending, SAMPLE_PENDING),

    approveComment(commentId: string) {
      const pending = read<CommentDoc[]>(KEYS.pending, SAMPLE_PENDING).filter(
        (c) => c.commentId !== commentId
      );
      write(KEYS.pending, pending);
      return { pending };
    },

    rejectComment(commentId: string) {
      const pending = read<CommentDoc[]>(KEYS.pending, SAMPLE_PENDING).filter(
        (c) => c.commentId !== commentId
      );
      write(KEYS.pending, pending);
      return { pending };
    },

    loadReports: () => read<ReportDoc[]>(KEYS.reports, SAMPLE_REPORTS),

    resolveReport(reportId: string) {
      const next = read<ReportDoc[]>(KEYS.reports, SAMPLE_REPORTS).filter(
        (r) => r.reportId !== reportId
      );
      write(KEYS.reports, next);
      return next;
    },
  };
}

/* ---------------------------------------------------------------- factory -- */

// TODO(firebase): return createFirebaseAdapter() once the panel is wired to
// Firestore. Keep the interface identical — the UI is adapter-agnostic.
export function getAdapter(): PanelAdapter {
  return createLocalAdapter();
}

/** Reset local sample data (dev convenience, surfaced in the panel UI). */
export function resetLocalData() {
  Object.values(KEYS).forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  });
}

export type { Post, Category, CommentDoc, ReportDoc };
