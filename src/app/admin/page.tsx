import type { Metadata } from "next";
import { isAuthed } from "@/lib/auth";
import { readPosts } from "@/lib/posts-store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "GaitAI internal — content management.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!isAuthed()) {
    return <AdminLogin />;
  }
  const posts = await readPosts();
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return <AdminDashboard initialPosts={posts} />;
}
