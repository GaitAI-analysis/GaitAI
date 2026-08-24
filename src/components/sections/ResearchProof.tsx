import Link from "next/link";
import { ArrowUpRight, BookOpen, Fingerprint } from "lucide-react";
import { researchProof } from "@/data/company";
import { patent } from "@/data/publications";
import { Reveal } from "@/components/ui/Reveal";

export function ResearchProof() {
  return (
    <section id="research-proof" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <Reveal>
            <div>
              <div className="eyebrow">
                <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                Research foundation
              </div>
              <h2 className="mt-5 max-w-3xl font-display text-display-xl text-soft-white">
                Built on a decade of <span className="text-gradient">gait research.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-soft-gray sm:text-lg">
                GaitAI connects a founder-led research record in gait biometrics and deep learning to a movement-intelligence platform for health, performance and safety.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/publications" className="btn-primary">
                  Explore the research
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link href="/publications#patent" className="btn-ghost">
                  <Fingerprint className="h-4 w-4" />
                  Patent {patent.patentNumber}
                </Link>
              </div>
            </div>
          </Reveal>

          <div className="border-y border-white/10">
            {researchProof.map((stat, index) => (
              <Reveal key={stat.label} delay={index * 0.06}>
                <div className="grid grid-cols-[5.5rem_1fr] gap-5 border-b border-white/[0.07] py-6 last:border-b-0 sm:grid-cols-[8rem_1fr]">
                  <div className="stat-num text-4xl text-soft-white sm:text-5xl">{stat.value}</div>
                  <div>
                    <div className="font-display text-lg text-soft-white">{stat.label}</div>
                    <div className="mt-1 text-sm leading-relaxed text-soft-mute">{stat.note}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <div className="mt-10 flex items-center gap-2 text-xs text-soft-mute">
          <BookOpen className="h-4 w-4 text-cyan-300" />
          Counts reflect the public founder profile and the patent/publication records presented on this site.
        </div>
      </div>
    </section>
  );
}
