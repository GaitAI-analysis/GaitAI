import {
  Building2,
  Heart,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Trophy,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Intersection } from "./Intersection";

const audiences = [
  {
    icon: HeartPulse,
    title: "Patients",
    desc: "Early mobility screening, fall-risk detection, rehabilitation progress tracking and better clinical decision-making.",
  },
  {
    icon: Heart,
    title: "Elderly people",
    desc: "Safer monitoring at home and in care settings, with timely alerts before incidents — not after.",
  },
  {
    icon: Stethoscope,
    title: "Doctors & physiotherapists",
    desc: "Objective gait reports, measurable mobility insights and decision-support across clinical workflows.",
  },
  {
    icon: Trophy,
    title: "Sports professionals",
    desc: "Performance, posture, asymmetry and movement-efficiency analytics for athletes, academies and sports medicine.",
  },
  {
    icon: ShieldCheck,
    title: "Security teams",
    desc: "Intelligent surveillance, non-contact gait identification and privacy-aware safety analytics for public spaces.",
  },
  {
    icon: Building2,
    title: "Organizations",
    desc: "A new layer of safety, automation and decision intelligence for enterprises, campuses and smart-city operators.",
  },
];

/**
 * Who GaitAI serves — audience cards plus the intersection callout.
 * Shared by /about and the home page.
 */
export function WhoWeServe() {
  return (
    <section id="who-we-serve" className="section">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Who GaitAI serves"
          title={
            <>
              Built for the people whose lives{" "}
              <span className="text-gradient">movement intelligence touches.</span>
            </>
          }
          description="From patients and clinicians to athletes, caregivers, security teams and large organizations — GaitAI is designed to make human movement measurable, meaningful and useful for everyone in the loop."
          align="left"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a, i) => {
            const Icon = a.icon;
            return (
              <Reveal key={a.title} delay={(i % 3) * 0.06}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-all hover:border-cyan-300/30 hover:bg-white/[0.04]">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-cyan-300/10 text-cyan-300 ring-1 ring-white/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-soft-white">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-soft-mute">
                    {a.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Intersection callout */}
        <Intersection />
      </div>
    </section>
  );
}
