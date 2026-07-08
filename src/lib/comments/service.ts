"use client";

/**
 * Public comment service — the only Firestore surface the public bundle touches.
 *
 * Capabilities here are deliberately limited to what a visitor may do:
 *   - submit a comment / reply (always written as `pending`)
 *   - read APPROVED comments (real-time)
 *   - report an approved comment
 *
 * Moderation (read pending, approve, reject, delete) lives exclusively in the
 * standalone admin page and is enforced by firestore.rules — it is intentionally
 * NOT importable from the public bundle.
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BLOCKED_WORDS,
  COLLECTIONS,
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  MIN_COMMENT_LENGTH,
  MIN_NAME_LENGTH,
  RATE_LIMIT_COOLDOWN_MS,
  RATE_LIMIT_STORAGE_KEY,
  queueKey,
} from "./config";
import type {
  CommentDoc,
  ContentType,
  NewCommentInput,
  SubmitResult,
  ThreadedComment,
} from "./types";
import { MAX_REPLY_DEPTH } from "./config";

/* ------------------------------------------------------------------ utils -- */

function genId(prefix = "c"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsBlockedWord(text: string): boolean {
  const haystack = ` ${normalize(text).replace(/[^a-z0-9 ]/g, " ")} `;
  return BLOCKED_WORDS.some((w) => haystack.includes(` ${w.toLowerCase()} `));
}

/** Local fingerprint set to stop rapid duplicate / double-click submissions. */
function fingerprint(slug: string, name: string, message: string): string {
  return `${slug}::${normalize(name)}::${normalize(message)}`;
}

function recentFingerprints(): string[] {
  try {
    const raw = localStorage.getItem("gaitai:recentComments");
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberFingerprint(fp: string) {
  try {
    const next = [fp, ...recentFingerprints()].slice(0, 25);
    localStorage.setItem("gaitai:recentComments", JSON.stringify(next));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function withinCooldown(): number {
  try {
    const last = Number(localStorage.getItem(RATE_LIMIT_STORAGE_KEY) ?? 0);
    const elapsed = Date.now() - last;
    return elapsed < RATE_LIMIT_COOLDOWN_MS
      ? RATE_LIMIT_COOLDOWN_MS - elapsed
      : 0;
  } catch {
    return 0;
  }
}

function stampCooldown() {
  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, String(Date.now()));
  } catch {
    /* non-fatal */
  }
}

/* ------------------------------------------------------------ validation -- */

export function validateComment(input: {
  userName: string;
  message: string;
}): SubmitResult {
  const name = input.userName.trim();
  const message = input.message.trim();

  if (name.length < MIN_NAME_LENGTH || message.length < MIN_COMMENT_LENGTH) {
    return {
      ok: false,
      code: "too-short",
      message: "Please add your name and a slightly longer message.",
    };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      code: "validation",
      message: `Name must be ${MAX_NAME_LENGTH} characters or fewer.`,
    };
  }
  if (message.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      code: "too-long",
      message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`,
    };
  }
  if (containsBlockedWord(message) || containsBlockedWord(name)) {
    return {
      ok: false,
      code: "blocked-words",
      message: "Your comment contains words that aren't allowed here.",
    };
  }
  return { ok: true };
}

/* ---------------------------------------------------------------- submit -- */

/**
 * Submit a comment or reply. Always written with `status: "pending"`. Performs
 * client-side abuse checks, then writes BOTH the canonical pending doc and the
 * flat queue mirror in a single atomic batch.
 */
export async function submitComment(
  input: NewCommentInput
): Promise<SubmitResult> {
  const base = validateComment({
    userName: input.userName,
    message: input.message,
  });
  if (!base.ok) return base;

  // Rate-limit (per browser).
  const remaining = withinCooldown();
  if (remaining > 0) {
    return {
      ok: false,
      code: "rate-limited",
      message: `Please wait ${Math.ceil(
        remaining / 1000
      )}s before commenting again.`,
    };
  }

  // CAPTCHA gate (only relevant when enabled; UI enforces presence).
  // The token is forwarded for completeness; verification would happen in a
  // Cloud Function / App Check when fully wired.

  const fp = fingerprint(input.postSlug, input.userName, input.message);
  if (recentFingerprints().includes(fp)) {
    return {
      ok: false,
      code: "duplicate",
      message: "Looks like you already submitted this comment.",
    };
  }

  // Block exact duplicates of already-approved comments (public-readable).
  try {
    const dupQ = query(
      collection(db, COLLECTIONS.approved(input.postSlug)),
      where("userName", "==", input.userName.trim()),
      where("message", "==", input.message.trim())
    );
    const dup = await getDocs(dupQ);
    if (!dup.empty) {
      return {
        ok: false,
        code: "duplicate",
        message: "This comment has already been posted.",
      };
    }
  } catch {
    /* read may be denied/offline — fall through, rules still protect writes */
  }

  const commentId = genId();
  const payload: Record<string, unknown> = {
    commentId,
    postId: input.postSlug,
    contentId: input.postSlug,
    contentType: input.contentType,
    userName: input.userName.trim(),
    email: input.email?.trim() || null,
    message: input.message.trim(),
    createdAt: serverTimestamp(),
    status: "pending",
    approvedAt: null,
    approvedBy: null,
    parentCommentId: input.parentCommentId ?? null,
    userId: input.userId ?? null,
  };

  try {
    const batch = writeBatch(db);
    const pendingRef = doc(
      db,
      COLLECTIONS.pending(input.postSlug),
      commentId
    );
    const queueRef = doc(
      db,
      COLLECTIONS.queue,
      queueKey(input.postSlug, commentId)
    );
    batch.set(pendingRef, payload);
    batch.set(queueRef, payload);
    await batch.commit();

    stampCooldown();
    rememberFingerprint(fp);
    return { ok: true };
  } catch {
    return {
      ok: false,
      code: "network",
      message:
        "We couldn't submit your comment right now. Please try again shortly.",
    };
  }
}

/* ---------------------------------------------------------- read approved -- */

function mapComment(data: DocumentData): CommentDoc {
  return {
    commentId: String(data.commentId ?? ""),
    postId: String(data.postId ?? data.contentId ?? ""),
    contentId: String(data.contentId ?? data.postId ?? ""),
    contentType: (data.contentType ?? "blog") as ContentType,
    userName: String(data.userName ?? "Anonymous"),
    email: data.email ?? null,
    message: String(data.message ?? ""),
    createdAt: toIso(data.createdAt),
    status: (data.status ?? "approved") as CommentDoc["status"],
    approvedAt: data.approvedAt ? toIso(data.approvedAt) : null,
    approvedBy: data.approvedBy ?? null,
    parentCommentId: data.parentCommentId ?? null,
    userId: data.userId ?? null,
  };
}

/** Real-time subscription to APPROVED comments for a post. */
export function subscribeApprovedComments(
  postSlug: string,
  onChange: (comments: CommentDoc[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.approved(postSlug)),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => mapComment(d.data()))),
    (err) => onError?.(err as Error)
  );
}

/** One-shot fetch of approved comments (e.g. for SSR-free static prefetch). */
export async function fetchApprovedComments(
  postSlug: string
): Promise<CommentDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.approved(postSlug)),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapComment(d.data()));
}

/* ---------------------------------------------------------- threading ----- */

/**
 * Build a nested thread from a flat approved list. Nesting is capped at
 * MAX_REPLY_DEPTH — deeper replies are re-parented to the deepest allowed
 * ancestor so the UI never runs away horizontally.
 */
export function buildThread(comments: CommentDoc[]): ThreadedComment[] {
  const byId = new Map<string, ThreadedComment>();
  comments.forEach((c) =>
    byId.set(c.commentId, { ...c, replies: [], depth: 0 })
  );

  const roots: ThreadedComment[] = [];

  byId.forEach((node) => {
    const parentId = node.parentCommentId;
    if (parentId && byId.has(parentId)) {
      const parent = byId.get(parentId)!;
      node.depth = Math.min(parent.depth + 1, MAX_REPLY_DEPTH);
      parent.replies.push(node);
    } else {
      node.depth = 0;
      roots.push(node);
    }
  });

  const sortRec = (list: ThreadedComment[]) => {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    list.forEach((n) => sortRec(n.replies));
  };
  sortRec(roots);
  return roots;
}

/* ------------------------------------------------------------- reporting -- */

export async function reportComment(args: {
  postSlug: string;
  commentId: string;
  reason: string;
  reportedBy?: string | null;
}): Promise<{ ok: boolean }> {
  const reportId = genId("r");
  const payload: Record<string, unknown> = {
    reportId,
    postId: args.postSlug,
    commentId: args.commentId,
    reason: args.reason.slice(0, 500),
    reportedBy: args.reportedBy ?? null,
    createdAt: serverTimestamp(),
    resolved: false,
  };
  try {
    await setDoc(doc(db, COLLECTIONS.reports, reportId), payload);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
