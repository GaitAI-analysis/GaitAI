import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { HomeSectionNav } from "@/components/home/HomeSectionNav";
import { OverviewSection } from "@/components/home/OverviewSection";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { EnvironmentExplorer } from "@/components/home/EnvironmentExplorer";
import { TechnologySection } from "@/components/home/TechnologySection";
import { ResearchGateway } from "@/components/home/ResearchGateway";
import { TrustGateway } from "@/components/home/TrustGateway";
import { VisitorIntent } from "@/components/home/VisitorIntent";
import { Vision } from "@/components/sections/Vision";
import { CTA } from "@/components/sections/CTA";

/* Title, description and social cards are inherited from the root layout;
   only the canonical is stated here, because the root must not declare one
   (it would become every other route's canonical too). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home — eight places to go, not one document to read.
 * =============================================================================
 * It used to be twelve sections in a fixed order, about 16,000px at 1440, and
 * the only way to reach the ninth thing was to scroll past the eight before
 * it. Every section was good. The arrangement was a specification document.
 *
 * THE SHAPE NOW
 *
 *   Hero                 one question, two doors, one demo
 *   HomeSectionNav       sticky — the eight destinations below
 *   #overview            Motion DNA band + "One movement. Many meanings."
 *   #mobilitycare        the clinical family, its own band
 *   #securevision        the privacy-aware family, its own band
 *   #products            the featured four per family, behind a family tab
 *   #use-cases           18 environments behind 7 categories
 *   #technology          the four-stage journey + the capture chain
 *   #research            the founder record and the two research doors
 *   #trust               four principles and the Trust Center
 *   VisitorIntent        "what brings you here?" — the last, narrowest path
 *   Vision               the closing statement
 *   #contact             request a demo
 *
 * EVERY SECTION NAME ABOVE THAT STARTS WITH `#` IS A REAL ANCHOR, listed once
 * in `data/home-sections.ts`, carried by exactly one element, and offset for
 * the header and the sticky rail by `.home-section` in globals.css. A hash
 * pasted into a fresh tab lands where it says it does.
 *
 * WHAT PROGRESSIVE DISCLOSURE REPLACED, AND WHERE IT WENT
 *
 *   the 5-step movement story   → the 5 meanings, which is the same signal
 *                                 making the platform's point in one screen;
 *                                 the pipeline narrative it told is the
 *                                 Technology section's subject and
 *                                 /movement-lab's in full
 *   the 4 stacked workflow rows → one stage panel, clicked through
 *   18 stacked environments     → 7 categories over the same 18 records
 *   the full research section   → a gateway; the evidence map is on /research
 *                                 and the library on /publications
 *   the trust material buried
 *   under research              → its own section, which it never had
 *
 * Nothing was deleted to make the page shorter. Every claim, every count and
 * every link either still renders here or renders on the page this one now
 * points at by name.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeSectionNav />
      <OverviewSection />
      <Verticals />
      <FeaturedProducts />
      <EnvironmentExplorer />
      <TechnologySection />
      <ResearchGateway />
      <TrustGateway />
      <VisitorIntent />
      <Vision />
      <CTA />
    </>
  );
}
