import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GaitscapeExplorer } from "@/components/gaitscape/GaitscapeExplorer";
import { CapabilityMatrix } from "@/components/gaitscape/CapabilityMatrix";
import { CompareSystems } from "@/components/gaitscape/CompareSystems";

export const metadata: Metadata = {
  alternates: { canonical: "/gaitscape" },
  title: "GaitScape — Human Movement Intelligence Landscape | GaitAI",
  description:
    "Explore how GaitAI connects human movement signals, AI capabilities, research and products across mobility, healthcare, safety and secure environments.",
  openGraph: {
    title: "GaitScape — Human Movement Intelligence Landscape | GaitAI",
    description:
      "Explore how GaitAI connects human movement signals, AI capabilities, research and products across mobility, healthcare, safety and secure environments.",
    type: "website",
  },
};

export default function GaitscapePage() {
  return (
    <>
      {/* PRIMARY EXPLORATION VIEW — compact header + graph, above the fold */}
      <section
        aria-label="GaitScape interactive landscape"
        className="site-page-intro-compact border-b border-white/[0.06] pb-12 sm:pb-16"
      >
        <div className="container-wide">
          <GaitscapeExplorer />
        </div>
      </section>

      {/* EXPLORE THE INTELLIGENCE LAYER */}
      <section
        aria-labelledby="gaitscape-capabilities"
        className="border-b border-white/[0.06] bg-obsidian-300/40 py-20 sm:py-24"
      >
        <div className="container-wide">
          <SectionHeading
            eyebrow="Explore the intelligence layer"
            title={
              <span id="gaitscape-capabilities">
                See what powers each{" "}
                <span className="text-gradient">GaitAI system.</span>
              </span>
            }
            description={
              <span className="text-[1.06rem] leading-relaxed sm:text-xl">
                Explore how movement-analysis capabilities are used across
                products, environments and outcomes.
              </span>
            }
            align="left"
          />
          <div className="mt-12 sm:mt-14">
            <CapabilityMatrix />
          </div>
        </div>
      </section>

      {/* COMPARE GAITAI SYSTEMS */}
      <section
        aria-labelledby="gaitscape-compare"
        className="py-16 sm:py-20"
      >
        <div className="container-wide">
          <SectionHeading
            eyebrow="Compare GaitAI systems"
            title={
              <span id="gaitscape-compare">
                Put systems <span className="text-gradient">side by side.</span>
              </span>
            }
            description="Select two or three products to compare their signals, intelligence capabilities, deployment context and intended outcomes side by side."
            align="left"
          />
          <div className="mt-10">
            <CompareSystems />
          </div>

          {/* Onward to the other two analytical surfaces: the map shows how
              the ecosystem connects; the lab shows what the pipeline does,
              and the configurator turns it into a recommendation. */}
          <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-8">
            <Link href="/movement-lab" className="btn-ghost">
              Open Movement Studio →
            </Link>
            <Link href="/products#stack" className="btn-ghost">
              Find your GaitAI stack →
            </Link>
            <Link href="/use-cases#explore" className="btn-ghost">
              Explore by environment →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
