import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { UseCaseCard } from "@/components/usecases/UseCaseCard";
import { industryUseCases } from "@/data/products";

export const metadata: Metadata = {
  title: "Use Cases — Where GaitAI is deployed",
  description:
    "GaitAI use cases across physiotherapy clinics, hospitals, sports academies, elderly care, airports, smart cities, factories, retail, events and more.",
};

const mobilityCases = industryUseCases.filter(
  (u) => u.vertical === "mobilitycare"
);
const secureCases = industryUseCases.filter(
  (u) => u.vertical === "securevision"
);


export default function UseCasesPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              {industryUseCases.length} industries · {industryUseCases.length} deployments
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              From a quiet home to a{" "}
              <span className="text-gradient">global stadium.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI is deployed across hospitals, sports academies, elderly-care
              homes, airports, smart cities and industrial sites. Each industry
              has its own product mix, environment and outcome.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="#mobility" className="btn-primary">
                Healthcare &amp; sports
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#secure" className="btn-ghost">
                Safety &amp; public spaces
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILITY USE CASES */}
      <section id="mobility" className="section bg-obsidian-300/30">
        <div className="container-wide">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-2 text-teal-300">
                <HeartPulse className="h-3.5 w-3.5" />
                MobilityCare · Healthcare, sports &amp; wearable
              </span>
            }
            title={
              <>
                Where{" "}
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
                is deployed.
              </>
            }
            description={`${mobilityCases.length} clinical, sports, elderly and wearable environments — each with the products and outcomes mapped from the GaitAI brief.`}
            align="left"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mobilityCases.map((u, i) => (
              <UseCaseCard key={u.id} caseId={u.id} delay={(i % 3) * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* SECUREVISION USE CASES */}
      <section id="secure" className="section">
        <div className="container-wide">
          <SectionHeading
            eyebrow={
              <span className="inline-flex items-center gap-2 text-royal-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                SecureVision · Privacy-aware public safety
              </span>
            }
            title={
              <>
                Where{" "}
                <span className="text-gradient-secure">SecureVision</span> is
                deployed.
              </>
            }
            description={`${secureCases.length} privacy-aware deployments across transport hubs, smart cities, campuses, factories, retail and large events.`}
            align="left"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {secureCases.map((u, i) => (
              <UseCaseCard key={u.id} caseId={u.id} delay={(i % 3) * 0.06} />
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
                  Don&apos;t see your industry? Let&apos;s talk.
                </span>
                <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                  Tell us about your environment and we&apos;ll map the right
                  product mix.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/#contact" className="btn-primary">
                  Request a demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/products" className="btn-ghost">
                  Browse all products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
