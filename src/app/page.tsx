import { Hero } from "@/components/sections/Hero";
import { MissionVision } from "@/components/sections/about/MissionVision";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ResearchCredibility } from "@/components/sections/ResearchCredibility";
import { EnvironmentStrip } from "@/components/sections/EnvironmentStrip";
import { Vision } from "@/components/sections/Vision";
import { CTA } from "@/components/sections/CTA";

/**
 * Home — "what is GaitAI and why should I care?", and nothing else.
 *
 *   1. Hero                        what this is
 *   2. Mission / Vision            the Motion DNA band
 *   3. Verticals                   the two product families
 *   4. Featured products           the eight we lead with
 *   5. How GaitAI works            the four-stage pipeline
 *   6. Research credibility        why believe it, + featured references
 *   7. Environments                where it applies (teaser → /use-cases)
 *   8. Philosophy                  the closing statement
 *   9. CTA                         request a demo
 *
 * Everything with its own destination is a teaser here and lives in full
 * elsewhere: the research timeline on /research, the publication library on
 * /publications, the product grids on /mobilitycare and /securevision, the
 * problem-led breakdown on /use-cases, WatchCare's deep dive on
 * /mobilitycare#watchcare, and the collaboration and investment material on
 * /investors. The obsolete /about route is gone; the audience framing it
 * carried now opens /use-cases.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <MissionVision motion="gait" />
      <Verticals />
      <FeaturedProducts />
      <HowItWorks />
      <ResearchCredibility />
      <EnvironmentStrip />
      <Vision />
      <CTA />
    </>
  );
}
