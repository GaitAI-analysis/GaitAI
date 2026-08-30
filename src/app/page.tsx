import { Hero } from "@/components/sections/Hero";
import { PartnerMarquee } from "@/components/sections/PartnerMarquee";
import { MetricsStrip } from "@/components/sections/MetricsStrip";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { WatchCareFlagship } from "@/components/sections/WatchCareFlagship";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UseCases } from "@/components/sections/UseCases";
import { ResearchCredibility } from "@/components/sections/ResearchCredibility";
import { Vision } from "@/components/sections/Vision";
import { CTA } from "@/components/sections/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Verticals />
      <FeaturedProducts />
      <WatchCareFlagship />
      <HowItWorks />
      <UseCases />
      <ResearchCredibility />
      <Vision />
      <PartnerMarquee />
      <MetricsStrip />
      <CTA />
    </>
  );
}
