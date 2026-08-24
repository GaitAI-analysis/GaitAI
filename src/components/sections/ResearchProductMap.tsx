import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen } from "lucide-react";
import { researchProductTimeline } from "@/data/company";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

export function ResearchProductMap() {
  return (
    <section id="research-to-product" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Research → product"
          title={
            <>
              A research lineage, <span className="text-gradient">not a feature list.</span>
            </>
          }
          description="Patent and publication milestones show how gait-specific research connects to the GaitAI platform. Dates appear only where the public record provides them."
          align="left"
        />

        <ol className="mt-14 border-y border-white/10 lg:grid lg:grid-cols-5">
          {researchProductTimeline.map((milestone, index) => (
            <Reveal key={`${milestone.marker}-${milestone.title}`} delay={index * 0.06}>
              <li className="relative min-h-full border-b border-white/[0.07] p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">{milestone.marker}</span>
                  {index < researchProductTimeline.length - 1 && (
                    <>
                      <ArrowDown className="h-4 w-4 text-cyan-300/50 lg:hidden" />
                      <ArrowRight className="hidden h-4 w-4 text-cyan-300/50 lg:block" />
                    </>
                  )}
                </div>
                <h3 className="mt-8 font-display text-xl text-soft-white">{milestone.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-soft-mute">{milestone.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Link href="/research" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <BookOpen className="h-4 w-4" />
          Explore the research story
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
