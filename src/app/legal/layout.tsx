import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative pt-36 pb-24 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[10%] h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-radial-glow opacity-40 blur-3xl" />
      </div>
      <div className="container-wide">
        <article className="prose prose-invert mx-auto max-w-3xl rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-8 sm:p-12">
          {children}
        </article>
      </div>
    </section>
  );
}
