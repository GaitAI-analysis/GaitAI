import { Hero } from "@/components/sections/Hero";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { WatchCareFlagship } from "@/components/sections/WatchCareFlagship";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { UseCases } from "@/components/sections/UseCases";
import { ResearchCredibility } from "@/components/sections/ResearchCredibility";
import { Vision } from "@/components/sections/Vision";
import { AboutMission } from "@/components/sections/about/AboutMission";
import { MissionVision } from "@/components/sections/about/MissionVision";
import { WhoWeServe } from "@/components/sections/about/WhoWeServe";
import { Partnerships } from "@/components/sections/about/Partnerships";
import { Investors } from "@/components/sections/about/Investors";
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

      {/* About-page narrative — shared components, see src/components/sections/about/ */}
      <AboutMission />
      <MissionVision />
      <WhoWeServe />
      <Partnerships />
      <Investors />

      <CTA />
    </>
  );
}
