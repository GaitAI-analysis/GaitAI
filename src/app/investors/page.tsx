import type { Metadata } from "next";
import Link from "next/link";
import { AboutMission } from "@/components/sections/about/AboutMission";
import { Partnerships } from "@/components/sections/about/Partnerships";
import { Investors } from "@/components/sections/about/Investors";
import { productCount } from "@/data/products";
import { papers } from "@/data/publications";
import { ctas } from "@/data/content";

export const metadata: Metadata = {
  title: "Investors & collaboration",
  description:
    "GaitAI's origin, the collaborations we're looking for, and the stage we're raising for. Human Movement Intelligence built on a peer-reviewed gait research record and a granted Indian patent.",
  alternates: { canonical: "/investors" },
};

/**
 * Investor and collaboration material, kept off the customer home journey.
 *
 * Contains the origin story, the four collaboration programmes we're looking
 * for, and the investment-stage overview — reusing the same components the
 * home page used to render. Nothing here states a round size, valuation,
 * revenue, traction figure, named investor or incubator; none of that exists
 * in this repository. It is reachable from the footer rather than the main
 * navigation, because it is not part of the buyer's path.
 */
export default function InvestorsPage() {
  return (
    <>
      <section className="site-page-intro relative overflow-hidden pb-4">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[520px] w-[960px] -translate-x-1/2 rounded-full bg-radial-glow opacity-50 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Investors &amp; collaboration
            </span>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              A research vision becoming a{" "}
              <span className="text-gradient">movement platform.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI began as founder-led research into what walking reveals
              about health, identity and safety. That work — {papers.length}{" "}
              peer-reviewed papers and a granted Indian patent — now underpins
              two verticals and {productCount} modular products.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/research" className="btn-primary">
                See the research basis
              </Link>
              <Link href={ctas.investor.href} className="btn-ghost">
                {ctas.investor.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <AboutMission philosophy={false} />
      <Partnerships />
      <Investors />
    </>
  );
}
