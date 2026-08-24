import Link from "next/link";
import { ArrowUpRight, Eye, FileSearch, LockKeyhole, UserRoundCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const principles = [
  {
    icon: LockKeyhole,
    title: "Privacy-aware processing",
    description: "The product content supports skeleton-only analytics, face blur, role-based access and configurable retention.",
  },
  {
    icon: UserRoundCheck,
    title: "Human oversight",
    description: "Outputs are framed as decision support for clinicians, caregivers and operators—not autonomous final decisions.",
  },
  {
    icon: Eye,
    title: "Explainability",
    description: "Result interfaces are designed to surface contributing movement signals when reliable explanation data is available.",
  },
  {
    icon: FileSearch,
    title: "Controlled access",
    description: "Audit logs, consent-aware workflows and lawful authority are represented as deployment requirements for sensitive capabilities.",
  },
] as const;

export function ResponsibleAI() {
  return (
    <section id="responsible-ai" className="section">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Privacy and responsible AI"
              title={
                <>
                  Trust is part of the <span className="text-gradient">architecture.</span>
                </>
              }
              description="Movement data can be sensitive. GaitAI’s published product and policy principles treat privacy, oversight and inspectability as product requirements."
              align="left"
            />
            <Link href="/legal/responsible-ai" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
              Read the responsible AI commitment
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="border-y border-white/10">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title} className="grid grid-cols-[auto_1fr] gap-4 border-b border-white/[0.07] py-6 last:border-b-0">
                  <Icon className="mt-1 h-5 w-5 text-emerald-300" />
                  <div>
                    <h3 className="font-display text-xl text-soft-white">{principle.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-soft-mute">{principle.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
