import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Intersection } from "./Intersection";

const audiences = [
  {
    title: "Patients",
    desc: "Early mobility screening, fall-risk indicators, rehabilitation progress tracking and better-informed clinical review.",
  },
  {
    title: "Elderly people",
    desc: "Safer monitoring at home and in care settings, with early movement-change indicators surfaced for review.",
  },
  {
    title: "Doctors & physiotherapists",
    desc: "Objective gait reports, measurable mobility insights and decision-support across clinical workflows.",
  },
  {
    title: "Sports professionals",
    desc: "Performance, posture, asymmetry and movement-efficiency analytics for athletes, academies and sports medicine.",
  },
  {
    title: "Security teams",
    desc: "Intelligent surveillance, movement-biometric candidate matching and privacy-aware safety analytics for public spaces.",
  },
  {
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
        {/* Editorial list, not a card grid: these are audiences to read, not
            entities to select. */}
        <Reveal>
          <dl className="mt-12 grid gap-x-14 border-t border-white/[0.06] lg:grid-cols-2">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="border-b border-white/[0.06] py-6"
              >
                <dt className="font-display text-lg font-semibold text-soft-white">
                  {a.title}
                </dt>
                <dd className="mt-1.5 max-w-prose text-sm leading-relaxed text-soft-mute">
                  {a.desc}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* Intersection callout */}
        <Intersection />
      </div>
    </section>
  );
}
