import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Collaboration programmes GaitAI is building.
 *
 * Wording policy: this section previously described clinical networks
 * "co-piloting" products, academies "running" programmes and labs "running
 * studies with us". No customer, pilot or partnership record exists in this
 * repository, so it now describes the kinds of collaboration GaitAI is
 * looking for — an invitation, not a claimed roster.
 *
 * Presented as an editorial list rather than four identical cards; the
 * content is informational, not selectable.
 */
const programmes = [
  {
    title: "Clinical collaboration",
    desc: "Physiotherapy, neurology, orthopedic and rehabilitation teams who want a measured movement layer alongside their own assessment — and who are willing to pressure-test the outputs against clinical judgement.",
    looking: "Clinics, rehab centres, hospital departments",
  },
  {
    title: "Sports & performance",
    desc: "Academies and sports-medicine teams interested in movement screening, asymmetry tracking and return-to-activity monitoring as part of an existing programme.",
    looking: "Academies, sports clinics, performance staff",
  },
  {
    title: "Public-sector & smart spaces",
    desc: "Campus, transport and civic operators evaluating privacy-aware crowd and safety analytics, where identity-free movement intelligence is the requirement rather than the compromise.",
    looking: "Campuses, transport operators, civic bodies",
  },
  {
    title: "Research collaboration",
    desc: "University groups, CROs and hospital research teams working on candidate gait measures, movement analytics or privacy-preserving movement AI, including joint publication.",
    looking: "University labs, CROs, research teams",
  },
];

export function Partnerships() {
  return (
    <section id="collaborate" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Collaboration programmes"
          title={
            <>
              We want to build with{" "}
              <span className="text-gradient">the people who deploy us.</span>
            </>
          }
          description="GaitAI's roadmap is meant to be shaped by the environments it runs in. These are the four kinds of collaboration we're actively looking for."
          align="left"
        />

        <Reveal>
          <dl className="mt-12 grid gap-x-12 border-t border-white/[0.06] lg:grid-cols-2">
            {programmes.map((programme, i) => (
              <div
                key={programme.title}
                className="flex gap-4 border-b border-white/[0.06] py-6"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[11px] tabular-nums text-cyan-300/70"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <dt className="font-display text-lg font-semibold text-soft-white">
                    {programme.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-soft-mute">
                    {programme.desc}
                    <span className="mt-2 block text-[11px] uppercase tracking-[0.16em] text-soft-mute/80">
                      Looking for: {programme.looking}
                    </span>
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
