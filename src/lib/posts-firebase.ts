"use client";

/**
 * Firestore-backed posts/blogs service — the live source of truth for
 * everything shown on /insights and /publications/[slug].
 *
 * Reads are public (anyone may list published posts); writes are admin-only,
 * enforced by firestore.rules → `match /posts/{postId}`. This file uses ONLY
 * the public client SDK and is safe to import from client components.
 *
 * Document id == Post.id. Slugs are unique but the id is the stable key.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fbLog, fbOk, fbFail } from "@/lib/firebase-logger";
import type { Post, Category } from "@/lib/posts";

/** The single Firestore collection holding every post/blog. */
export const POSTS_COLLECTION = "posts";

const CATEGORIES: readonly Category[] = [
  "research",
  "announcement",
  "documentation",
  "approval",
  "blog",
  "demo",
];

/** Coerce a raw Firestore document into a well-formed Post. */
function mapPost(data: DocumentData): Post {
  const category = (CATEGORIES as readonly string[]).includes(data.category)
    ? (data.category as Category)
    : "blog";

  const post: Post = {
    id: String(data.id ?? ""),
    slug: String(data.slug ?? ""),
    title: String(data.title ?? "Untitled"),
    category,
    summary: String(data.summary ?? ""),
    body: String(data.body ?? ""),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    publishedAt:
      typeof data.publishedAt === "string"
        ? data.publishedAt
        : new Date().toISOString(),
    author: String(data.author ?? "GaitAI"),
    featured: Boolean(data.featured ?? false),
  };

  // Only attach optional fields when present, so we never emit `undefined`.
  if (data.subscriberOnly != null) post.subscriberOnly = Boolean(data.subscriberOnly);
  if (data.publicationStatus === "draft" || data.publicationStatus === "verified") {
    post.publicationStatus = data.publicationStatus;
  }
  if (data.externalUrl) post.externalUrl = String(data.externalUrl);
  if (data.attachmentUrl) post.attachmentUrl = String(data.attachmentUrl);
  if (data.attachmentName) post.attachmentName = String(data.attachmentName);

  return post;
}

/** Newest-first by publishedAt (ISO strings sort chronologically). */
function byNewest(a: Post, b: Post): number {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Build the exact field set firestore.rules allows for a post write. Optional
 * fields are omitted (not set to undefined — Firestore rejects undefined and
 * the rules use hasOnly()). `createdAt`/`updatedAt` are server-stamped.
 */
function toWritePayload(
  post: Post,
  opts: { isNew: boolean },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: post.id,
    slug: post.slug,
    title: post.title,
    category: post.category,
    summary: post.summary ?? "",
    body: post.body ?? "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    publishedAt: post.publishedAt,
    author: post.author ?? "GaitAI",
    featured: Boolean(post.featured ?? false),
    publicationStatus: post.publicationStatus ?? "draft",
    updatedAt: serverTimestamp(),
  };
  if (opts.isNew) payload.createdAt = serverTimestamp();
  if (post.subscriberOnly != null) payload.subscriberOnly = Boolean(post.subscriberOnly);
  if (post.externalUrl) payload.externalUrl = post.externalUrl;
  if (post.attachmentUrl) payload.attachmentUrl = post.attachmentUrl;
  if (post.attachmentName) payload.attachmentName = post.attachmentName;
  return payload;
}

/* ------------------------------------------------------------------ reads -- */

/** Admin-only one-shot fetch of every post, newest first. */
export async function fetchPosts(): Promise<Post[]> {
  const snap = await getDocs(collection(db, POSTS_COLLECTION));
  return snap.docs.map((d) => mapPost(d.data())).sort(byNewest);
}

/** Public one-shot fetch of explicitly verified posts, newest first. */
export async function fetchPublishedPosts(): Promise<Post[]> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where("publicationStatus", "==", "verified"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapPost(d.data())).sort(byNewest);
}

/**
 * Fetch ONE verified post by slug — the public article fast path.
 *
 * `limit(1)` means Firestore returns a single document instead of scanning the
 * collection, so this is one small read regardless of how many posts exist.
 */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const q = query(
    collection(db, POSTS_COLLECTION),
    where("slug", "==", slug),
    where("publicationStatus", "==", "verified"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return mapPost(snap.docs[0].data());
}

/**
 * Admin subscription to the whole posts collection, newest first. Returns an
 * unsubscribe function.
 */
export function subscribePosts(
  onChange: (posts: Post[]) => void,
  onError?: (error: Error) => void,
): () => void {
  fbLog(`Opening live subscription to posts (${POSTS_COLLECTION})…`);
  let first = true;
  return onSnapshot(
    collection(db, POSTS_COLLECTION),
    (snap) => {
      if (first) {
        first = false;
        fbOk(`LIVE posts subscription established — ${snap.size} post(s)`);
      }
      onChange(snap.docs.map((d) => mapPost(d.data())).sort(byNewest));
    },
    (err) => {
      fbFail("Posts subscription FAILED", err);
      onError?.(err as Error);
    },
  );
}

/* ----------------------------------------------------------------- writes -- */

/** Create or update a post. Admin-only (enforced by rules). */
export async function savePost(post: Post): Promise<void> {
  const ref = doc(db, POSTS_COLLECTION, post.id);
  const existing = await getDoc(ref);
  const payload = toWritePayload(post, { isNew: !existing.exists() });
  await setDoc(ref, payload, { merge: true });
  fbOk(`Post "${post.slug}" saved to Firestore`);
}

/** Delete a post. Admin-only (enforced by rules). */
export async function deletePost(id: string): Promise<void> {
  await deleteDoc(doc(db, POSTS_COLLECTION, id));
  fbOk(`Post ${id} deleted from Firestore`);
}

