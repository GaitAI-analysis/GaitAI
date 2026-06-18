import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { generateId, Post } from "@/lib/posts";
import { readPosts, uniqueSlug, writePosts } from "@/lib/posts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await readPosts();
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  if (!isAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.title || !body.category || !body.summary) {
    return NextResponse.json(
      { error: "Missing required fields (title, category, summary)" },
      { status: 400 }
    );
  }
  const posts = await readPosts();
  const slug = await uniqueSlug(body.slug || body.title);
  const newPost: Post = {
    id: generateId(),
    slug,
    title: String(body.title).trim(),
    category: body.category,
    summary: String(body.summary).trim(),
    body: String(body.body || "").trim(),
    attachmentUrl: body.attachmentUrl || undefined,
    attachmentName: body.attachmentName || undefined,
    externalUrl: body.externalUrl || undefined,
    tags: Array.isArray(body.tags)
      ? body.tags.map((t: string) => String(t).trim()).filter(Boolean)
      : [],
    publishedAt: body.publishedAt || new Date().toISOString(),
    author: body.author || "GaitAI",
    featured: Boolean(body.featured),
  };
  posts.push(newPost);
  await writePosts(posts);
  return NextResponse.json({ post: newPost });
}
