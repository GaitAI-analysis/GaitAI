import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { readPosts, uniqueSlug, writePosts } from "@/lib/posts-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const posts = await readPosts();
  const post = posts.find((p) => p.id === params.id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = await readPosts();
  const idx = posts.findIndex((p) => p.id === params.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();
  const current = posts[idx];
  const slug = body.title && body.title !== current.title
    ? await uniqueSlug(body.slug || body.title, current.id)
    : current.slug;

  const updated = {
    ...current,
    ...body,
    id: current.id,
    slug,
    tags: Array.isArray(body.tags)
      ? body.tags.map((t: string) => String(t).trim()).filter(Boolean)
      : current.tags,
    publishedAt: body.publishedAt || current.publishedAt,
    featured: typeof body.featured === "boolean" ? body.featured : current.featured,
  };
  posts[idx] = updated;
  await writePosts(posts);
  return NextResponse.json({ post: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const posts = await readPosts();
  const next = posts.filter((p) => p.id !== params.id);
  if (next.length === posts.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writePosts(next);
  return NextResponse.json({ ok: true });
}
