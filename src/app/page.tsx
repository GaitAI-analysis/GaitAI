import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { MovementIntelligenceDemo } from "@/components/sections/MovementIntelligenceDemo";
import { ResearchProof } from "@/components/sections/ResearchProof";
import { MovementCapabilityMap } from "@/components/sections/MovementCapabilityMap";
import { Verticals } from "@/components/sections/Verticals";
import { CapabilityShowcase } from "@/components/sections/CapabilityShowcase";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { EvidenceSection } from "@/components/sections/EvidenceSection";
import { ResearchProductMap } from "@/components/sections/ResearchProductMap";
import { ResponsibleAI } from "@/components/sections/ResponsibleAI";
import { FounderPreview } from "@/components/sections/FounderPreview";
import { CTA } from "@/components/sections/CTA";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <MovementIntelligenceDemo />
      <ResearchProof />
      <MovementCapabilityMap />
      <Verticals />
      <CapabilityShowcase />
      <HowItWorks />
      <EvidenceSection />
      <ResearchProductMap />
      <ResponsibleAI />
      <FounderPreview />
      <CTA />
    </>
  );
}
