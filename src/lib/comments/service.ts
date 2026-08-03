"use client";

/**
 * Public comment service — the only Firestore surface the public bundle touches.
 *
 * Capabilities here are deliberately limited to what a visitor may do:
 *   - post a comment / reply, which appears IMMEDIATELY (no approval queue)
 *   - read visible (non-hidden) comments in real time
 *   - report a comment
 *
 * Moderation (hide / unhide / delete) lives exclusively in the admin control
 * panel and is enforced by firestore.rules — it is intentionally NOT importable
 * from the public bundle.
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fbLog, fbOk, fbFail } from "@/lib/firebase-logger";
import {
  BLOCKED_WORDS,
  COLLECTIONS,
  MAX_COMMENT_LENGTH,
  MAX_NAME_LENGTH,
  MIN_COMMENT_LENGTH,
  MIN_NAME_LENGTH,
  RATE_LIMIT_COOLDOWN_MS,
  RATE_LIMIT_STORAGE_KEY,
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
 * Post a comment or reply. It goes live immediately (`hidden: false`) — there
 * is no approval queue. Client-side abuse checks run first; an admin can hide
 * or delete anything afterwards from the control panel.
 */
export async function submitComment(
  input: NewCommentInput
): Promise<SubmitResult> {
  fbLog(`Submitting comment on "${input.postSlug}"…`);

  const base = validateComment({
    userName: input.userName,
    message: input.message,
  });
  if (!base.ok) {
    fbLog(`Submit blocked by validation (${base.code}): ${base.message}`);
    return base;
  }
  fbOk("Step 1/4 — client-side validation passed");

  // Rate-limit (per browser).
  const remaining = withinCooldown();
  if (remaining > 0) {
    fbLog(`Submit blocked — rate-limit cooldown, ${Math.ceil(remaining / 1000)}s left`);
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
    fbLog("Submit blocked — duplicate of a recent local submission");
    return {
      ok: false,
      code: "duplicate",
      message: "Looks like you already submitted this comment.",
    };
  }
  fbOk("Step 2/4 — rate-limit & duplicate fingerprint checks passed");

  // Block exact duplicates of comments already live on this post.
  try {
    fbLog("Step 3/4 — querying Firestore for duplicates…");
    const dupQ = query(
      collection(db, COLLECTIONS.comments),
      where("postId", "==", input.postSlug),
      where("hidden", "==", false),
      where("userName", "==", input.userName.trim()),
      where("message", "==", input.message.trim())
    );
    const dup = await getDocs(dupQ);
    if (!dup.empty) {
      fbLog("Submit blocked — identical comment already posted");
      return {
        ok: false,
        code: "duplicate",
        message: "This comment has already been posted.",
      };
    }
    fbOk("Step 3/4 — duplicate query OK (no match)");
  } catch (err) {
    /* read may be denied/offline — fall through, rules still protect writes */
    fbFail("Step 3/4 — duplicate query failed (non-fatal, continuing)", err);
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
    hidden: false,
    parentCommentId: input.parentCommentId ?? null,
    userId: input.userId ?? null,
  };

  try {
    fbLog(`Step 4/4 — publishing comment (${COLLECTIONS.comments}/${commentId})…`);
    await setDoc(doc(db, COLLECTIONS.comments, commentId), payload);

    stampCooldown();
    rememberFingerprint(fp);
    fbOk(`Step 4/4 — comment ${commentId} published and live`);
    return { ok: true };
  } catch (err) {
    const code = fbFail("Step 4/4 — Firestore write REJECTED", err);
    return {
      ok: false,
      code: "network",
      message:
        code === "permission-denied"
          ? "The server rejected this comment (permission denied). If you're the site owner, publish the Firestore security rules."
          : "We couldn't post your comment right now. Please try again shortly.",
    };
  }
}

/* ---------------------------------------------------------- read approved -- */

export function mapComment(data: DocumentData): CommentDoc {
  return {
    commentId: String(data.commentId ?? ""),
    postId: String(data.postId ?? data.contentId ?? ""),
    contentId: String(data.contentId ?? data.postId ?? ""),
    contentType: (data.contentType ?? "blog") as ContentType,
    userName: String(data.userName ?? "Anonymous"),
    email: data.email ?? null,
    message: String(data.message ?? ""),
    createdAt: toIso(data.createdAt),
    hidden: Boolean(data.hidden ?? false),
    parentCommentId: data.parentCommentId ?? null,
    userId: data.userId ?? null,
  };
}

/** Oldest-first, so a thread reads top to bottom. */
function byOldest(a: CommentDoc, b: CommentDoc): number {
  return a.createdAt.localeCompare(b.createdAt);
}

/**
 * Real-time subscription to the VISIBLE comments on a post.
 *
 * Filters are equality-only (`postId`, `hidden`) so Firestore serves this from
 * its automatic indexes — no composite index to create. Ordering is done in
 * memory, which keeps the query index-free.
 */
export function subscribeApprovedComments(
  postSlug: string,
  onChange: (comments: CommentDoc[]) => void,
  onError?: (error: Error) => void
): () => void {
  fbLog(`Opening live subscription to comments on "${postSlug}"…`);
  const q = query(
    collection(db, COLLECTIONS.comments),
    where("postId", "==", postSlug),
    where("hidden", "==", false)
  );
  let first = true;
  return onSnapshot(
    q,
    (snap) => {
      if (first) {
        first = false;
        fbOk(
          `LIVE CONNECTION ESTABLISHED for "${postSlug}" — ${snap.size} comment(s)${snap.metadata.fromCache ? " (from cache)" : " (from server)"}`
        );
      } else {
        fbLog(`Live update for "${postSlug}" — now ${snap.size} comment(s)`);
      }
      onChange(snap.docs.map((d) => mapComment(d.data())).sort(byOldest));
    },
    (err) => {
      fbFail(`Live subscription for "${postSlug}" FAILED`, err);
      onError?.(err as Error);
    }
  );
}

/** One-shot fetch of the visible comments on a post. */
export async function fetchApprovedComments(
  postSlug: string
): Promise<CommentDoc[]> {
  const q = query(
    collection(db, COLLECTIONS.comments),
    where("postId", "==", postSlug),
    where("hidden", "==", false)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapComment(d.data())).sort(byOldest);
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
    fbLog(`Reporting comment ${args.commentId} on "${args.postSlug}"…`);
    await setDoc(doc(db, COLLECTIONS.reports, reportId), payload);
    fbOk(`Report ${reportId} written to Firestore`);
    return { ok: true };
  } catch (err) {
    fbFail("Report write REJECTED", err);
    return { ok: false };
  }
}
