import { Hero } from "@/components/sections/Hero";
import { PartnerMarquee } from "@/components/sections/PartnerMarquee";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { WatchCareFlagship } from "@/components/sections/WatchCareFlagship";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UseCases } from "@/components/sections/UseCases";
import { TechStack } from "@/components/sections/TechStack";
import { ResearchCredibility } from "@/components/sections/ResearchCredibility";
import { Vision } from "@/components/sections/Vision";
import { CTA } from "@/components/sections/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PartnerMarquee />
      <Verticals />
      <FeaturedProducts />
      <WatchCareFlagship />
      <HowItWorks />
      <UseCases />
      <TechStack />
      <ResearchCredibility />
      <Vision />
      <CTA />
    </>
  );
}
