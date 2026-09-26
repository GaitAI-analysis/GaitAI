// Server-only — must never be imported from a client component.
import fs from "fs/promises";
import path from "path";
import { Post, slugify } from "./posts";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "posts.json");

/* Seed content removed — Firestore is the source of truth. */

/**
 * `data/posts.json` is a build-time MIRROR of Firestore, written by
 * scripts/sync-posts.mjs. If it's missing we create it EMPTY — never with seed
 * content, which would resurrect posts that were deleted in the control panel.
 * Firestore is the single source of truth.
 */
async function ensureFile(): Promise<void> {
  try {
    await fs.access(FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify({ posts: [] }, null, 2));
  }
}

export async function readPosts(): Promise<Post[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf-8");
  try {
    const data = JSON.parse(raw);
    return (data.posts as Post[]) || [];
  } catch {
    return [];
  }
}

export async function readPublishedPosts(): Promise<Post[]> {
  const posts = await readPosts();
  return posts.filter((post) => post.publicationStatus === "verified");
}

export async function writePosts(posts: Post[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify({ posts }, null, 2));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPublishedPostBySlug(slug: string): Promise<Post | null> {
  const posts = await readPublishedPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getPostById(id: string): Promise<Post | null> {
  const posts = await readPosts();
  return posts.find((p) => p.id === id) ?? null;
}

export async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const posts = await readPosts();
  const slug = slugify(base);
  if (!slug) return `p-${Date.now().toString(36)}`;
  let candidate = slug;
  let n = 2;
  while (posts.some((p) => p.slug === candidate && p.id !== ignoreId)) {
    candidate = `${slug}-${n++}`;
  }
  return candidate;
}
