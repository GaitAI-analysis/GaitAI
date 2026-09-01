import type { Metadata } from "next";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GaitscapeHero } from "@/components/gaitscape/GaitscapeHero";
import { GaitscapeExplorer } from "@/components/gaitscape/GaitscapeExplorer";
import { CapabilityMatrix } from "@/components/gaitscape/CapabilityMatrix";
import { CompareSystems } from "@/components/gaitscape/CompareSystems";

export const metadata: Metadata = {
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
      <div className="site-page-intro">
        <GaitscapeHero />
      </div>

      {/* PRIMARY EXPLORATION VIEW */}
      <section
        aria-label="GaitScape interactive landscape"
        className="border-b border-white/[0.06] py-12 sm:py-16"
      >
        <div className="container-wide">
          <GaitscapeExplorer />
        </div>
      </section>

      {/* EXPLORE THE INTELLIGENCE LAYER */}
      <section
        aria-labelledby="gaitscape-capabilities"
        className="border-b border-white/[0.06] bg-obsidian-300/40 py-16 sm:py-20"
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
            description="Explore how movement-analysis capabilities are used across products, environments and outcomes."
            align="left"
          />
          <div className="mt-10">
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
        </div>
      </section>
    </>
  );
}
