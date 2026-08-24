import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { LivePostsList } from "@/components/posts/LivePostsList";

export const metadata: Metadata = {
  title: "Insights — Blog, research notes & updates",
  description:
    "Verified GaitAI research notes, product updates and technical essays on movement intelligence.",
  alternates: { canonical: "/insights" },
};

/**
 * Firestore is the source of truth for posts. The client list requests only
 * records explicitly marked as verified for public display.
 */
export default function InsightsPage() {
  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden pt-36 pb-12 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[6%] h-[560px] w-[1000px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.16), transparent 70%)",
            }}
          />
          <div className="absolute right-[10%] bottom-[8%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Newspaper className="h-3.5 w-3.5" />
              GaitAI Insights
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Insights from the <span className="text-gradient">GaitAI lab.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Verified research notes, product updates and technical essays
              will appear here once their claims and source material are ready
              for public review.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────── POSTS ─────────── */}
      <section className="section pt-4">
        <div className="container-wide">
          <LivePostsList />
        </div>
      </section>
    </>
  );
}
