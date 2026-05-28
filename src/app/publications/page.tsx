import type { Metadata } from "next";
import { readPosts } from "@/lib/posts-store";
import { PostsList } from "@/components/posts/PostsList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publications, research & approvals",
  description:
    "GaitAI announcements, research notes, documentation, government approvals and product updates.",
};

export default async function PublicationsPage() {
  const posts = await readPosts();
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const total = posts.length;
  const counts = {
    research: posts.filter((p) => p.category === "research").length,
    announcement: posts.filter((p) => p.category === "announcement").length,
    documentation: posts.filter((p) => p.category === "documentation").length,
    approval: posts.filter((p) => p.category === "approval").length,
    blog: posts.filter((p) => p.category === "blog").length,
    demo: posts.filter((p) => p.category === "demo").length,
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-32 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[8%] h-[440px] w-[1000px] -translate-x-1/2 rounded-full bg-radial-glow opacity-50 blur-3xl" />
        <div className="absolute right-[5%] top-[40%] h-[320px] w-[320px] rounded-full bg-radial-violet opacity-40 blur-3xl" />
      </div>
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <div className="container-wide">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow inline-flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            Newsroom · {total} publications
          </span>
          <h1 className="mt-6 font-display text-display-xl text-balance text-soft-white">
            Publications, research &{" "}
            <span className="text-gradient">approvals.</span>
          </h1>
          <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
            A single home for everything happening at GaitAI — product launches,
            research notes, technical documentation, demo showcases, and the
            government & regulatory milestones that matter.
          </p>
        </div>

        {/* Category stat strip */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl glass sm:grid-cols-6">
          {Object.entries(counts).map(([k, v]) => (
            <div
              key={k}
              className="bg-gunmetal/30 px-3 py-4 text-center sm:py-5"
            >
              <div className="stat-num text-2xl text-soft-white sm:text-3xl">
                {v}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-soft-mute">
                {k}
              </div>
            </div>
          ))}
        </div>

        <PostsList posts={posts} />
      </div>
    </section>
  );
}
