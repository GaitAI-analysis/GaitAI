import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UseCaseProblemRow } from "@/components/usecases/UseCaseProblemRow";
import { WhoWeServe } from "@/components/sections/about/WhoWeServe";
import { industryUseCases } from "@/data/products";

export const metadata: Metadata = {
  title: "Use Cases — Which movement problem are you solving?",
  description:
    "GaitAI use cases by environment: the problem each one has, the approach GaitAI takes, the products involved and what they produce — across clinics, hospitals, sports, elderly care, transport hubs, smart cities, industry, retail and events.",
  alternates: { canonical: "/use-cases" },
};

const mobilityCases = industryUseCases.filter(
  (u) => u.vertical === "mobilitycare"
);
const secureCases = industryUseCases.filter(
  (u) => u.vertical === "securevision"
);

/**
 * Problem-led, not product-led.
 *
 * This page used to restate the product cards from /mobilitycare and
 * /securevision under "where GaitAI is deployed" — a deployment claim with
 * no supporting record. It now leads with the problem each environment has
 * and the approach GaitAI takes to it, and links out to products rather than
 * re-describing them.
 */
export default function UseCasesPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {industryUseCases.length} environments · {mobilityCases.length}{" "}
              clinical · {secureCases.length} public-space
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Start with the{" "}
              <span className="text-gradient">problem you have.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              Each environment below states the problem it&apos;s working with,
              how GaitAI approaches it, which products are involved and what
              they produce. Find the one that looks like yours.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="#mobility" className="btn-primary">
                Healthcare &amp; sports
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="#secure" className="btn-ghost">
                Safety &amp; public spaces
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT SERVES — audience framing, moved from the removed /about */}
      <WhoWeServe />

      {/* MOBILITYCARE ENVIRONMENTS */}
      <section id="mobility" className="section bg-obsidian-300/30">
        <div className="container-wide">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-2 text-teal-300">
                <HeartPulse aria-hidden="true" className="h-3.5 w-3.5" />
                MobilityCare · Healthcare, sports &amp; wearable
              </span>
            }
            title={
              <>
                Problems{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #0FA3B1 0%, #4FD1FF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  MobilityCare
                </span>{" "}
                is built for.
              </>
            }
            description={`${mobilityCases.length} clinical, sports, elderly and wearable environments — each with the products and outputs that apply to it.`}
            align="left"
          />
          <div className="mt-12">
            {mobilityCases.map((u) => (
              <UseCaseProblemRow key={u.id} caseId={u.id} />
            ))}
          </div>
        </div>
      </section>

      {/* SECUREVISION ENVIRONMENTS */}
      <section id="secure" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-2 text-royal-300">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                SecureVision · Privacy-aware public safety
              </span>
            }
            title={
              <>
                Problems{" "}
                <span className="text-gradient-secure">SecureVision</span> is
                built for.
              </>
            }
            description={`${secureCases.length} privacy-aware environments across transport hubs, smart cities, campuses, factories, retail and large events.`}
            align="left"
          />
          <div className="mt-12">
            {secureCases.map((u) => (
              <UseCaseProblemRow key={u.id} caseId={u.id} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <span className="eyebrow">
                  <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                  Don&apos;t see your environment? Let&apos;s talk.
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Tell us about your environment and we&apos;ll map the right
                  product mix.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Discuss a pilot
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
                <Link href="/products#deploy" className="btn-ghost">
                  How deployment works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
