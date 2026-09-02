import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ctas } from "@/data/content";
import {
  PILOT_SCOPE,
  deploymentFacts,
  deploymentSteps,
} from "@/data/trust";

/**
 * Buyer / procurement readiness — the questions an enterprise or clinical
 * buyer asks before a pilot, answered from what the platform actually
 * supports (see src/data/trust.ts for the sourcing rule).
 *
 * Reusable: rendered on /products and linkable as #deploy from the vertical
 * and use-case CTAs. Presented as a numbered process plus a definition list —
 * no pricing, no compliance status, no delivery commitments.
 */
export function DeployGaitAI() {
  return (
    <section id="deploy" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Deploy GaitAI"
          title={
            <>
              From environment to pilot,{" "}
              <span className="text-gradient">in five steps.</span>
            </>
          }
          description={`A GaitAI engagement is scoped around one environment and the modules it needs. ${PILOT_SCOPE}`}
          align="left"
        />

        {/* Process — a visual sequence, not five identical cards */}
        <Reveal>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] sm:grid-cols-2 lg:grid-cols-5">
            {deploymentSteps.map((step, i) => (
              <li
                key={step.title}
                className="relative bg-obsidian-200/70 p-5 sm:p-6"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] tabular-nums text-cyan-300/70"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2.5 font-display text-base font-semibold leading-snug text-soft-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-soft-mute">
                  {step.desc}
                </p>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-300/50 to-transparent"
                />
              </li>
            ))}
          </ol>
        </Reveal>

        <p className="mt-8 max-w-2xl text-[12.5px] leading-relaxed text-soft-mute">
          Timelines are agreed with the deployment partner rather than quoted
          up front — they follow the environment, the integration required and
          the number of modules involved.
        </p>

        {/* Procurement questions */}
        <Reveal>
          <div className="mt-14 border-t border-white/[0.06]">
            <h3 className="pt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-soft-white">
              What buyers ask first
            </h3>
            <dl className="mt-2 grid gap-x-14 lg:grid-cols-2">
              {deploymentFacts.map((fact) => (
                <div
                  key={fact.question}
                  className="border-b border-white/[0.06] py-5"
                >
                  <dt className="text-sm font-semibold text-soft-white">
                    {fact.question}
                  </dt>
                  <dd className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-soft-mute">
                    {fact.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/#contact" className="btn-primary">
            {ctas.pilot.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href="/legal/security"
            className="text-xs font-semibold uppercase tracking-[0.16em] text-soft-mute transition-colors hover:text-soft-white"
          >
            Privacy &amp; security controls
          </Link>
        </div>
      </div>
    </section>
  );
}
