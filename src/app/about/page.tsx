import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { JourneyTimeline } from "@/components/sections/JourneyTimeline";
import { AboutMission } from "@/components/sections/about/AboutMission";
import { MissionVision } from "@/components/sections/about/MissionVision";
import { WhoWeServe } from "@/components/sections/about/WhoWeServe";
import { Partnerships } from "@/components/sections/about/Partnerships";
import { Investors } from "@/components/sections/about/Investors";
import { PartnerCollaborate } from "@/components/sections/about/PartnerCollaborate";

export const metadata: Metadata = {
  title: "About — Mission, founder & team",
  description:
    "GaitAI's mission, founder story, partnerships and the team building the future of Human Movement Intelligence.",
};

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="site-page-intro relative overflow-hidden pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[10%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-glow opacity-60 blur-3xl" />
        </div>
        <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              About GaitAI
            </div>
            <h1 className="mt-6 font-display text-display-2xl text-balance text-soft-white">
              Building the future of{" "}
              <span className="text-gradient">human movement intelligence.</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-soft-gray sm:text-lg">
              GaitAI is a research-led deep-tech company turning the way humans
              move into actionable AI for healthcare, sports, elderly care and
              privacy-aware public safety — grounded in 10+ years of gait research
              and built with clinicians, researchers and operators.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION + PHILOSOPHY QUOTE */}
      <AboutMission />

      {/* MISSION & VISION */}
      <MissionVision />

      {/* JOURNEY TIMELINE */}
      <JourneyTimeline />

      {/* WHO WE SERVE + INTERSECTION */}
      <WhoWeServe />

      {/* PARTNERSHIPS */}
      <Partnerships />

      {/* INVESTORS / INCUBATION */}
      <Investors />

      {/* CTA */}
      <PartnerCollaborate />
    </>
  );
}
