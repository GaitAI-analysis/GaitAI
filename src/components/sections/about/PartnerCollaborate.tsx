import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/**
 * Partner · Invest · Collaborate CTA banner. Shared by /about and the
 * home page.
 */
export function PartnerCollaborate() {
  return (
    <section className="section">
      <div className="container-wide">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-glow opacity-40 blur-3xl" />
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <span className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Partner · Invest · Collaborate
              </span>
              <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                Let&apos;s build the future of human movement intelligence
                together.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/#contact" className="btn-primary">
                Get in touch
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/research" className="btn-ghost">
                Explore our research
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
