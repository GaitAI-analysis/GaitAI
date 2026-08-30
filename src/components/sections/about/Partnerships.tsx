import { Brain, Building2, Globe2, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const partnerships = [
  {
    icon: Building2,
    title: "Clinical partners",
    desc: "Physiotherapy networks, neurology and orthopedic clinics co-piloting MobilityCare products.",
  },
  {
    icon: Users,
    title: "Sports academies",
    desc: "Cricket, football, tennis and athletics academies running SportsMotion injury-risk programs.",
  },
  {
    icon: Globe2,
    title: "Public-sector & smart cities",
    desc: "Campus, transport and civic-body engagements piloting SecureVision crowd and safety analytics.",
  },
  {
    icon: Brain,
    title: "Research collaborations",
    desc: "University labs, CROs and hospitals running clinical-trial gait biomarker studies with us.",
  },
];

/**
 * Partnerships & collaborations cards. Shared by /about and the home page.
 */
export function Partnerships() {
  return (
    <section className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Partnerships & collaborations"
          title={
            <>
              We build with{" "}
              <span className="text-gradient">the people who deploy us.</span>
            </>
          }
          description="GaitAI's product roadmap is shaped by pilots with hospitals, sports academies, civic bodies and research labs."
          align="left"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {partnerships.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={(i % 4) * 0.06}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
