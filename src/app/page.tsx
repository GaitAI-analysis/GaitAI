import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { HomeSectionNav } from "@/components/home/HomeSectionNav";
import { MissionVision } from "@/components/sections/about/MissionVision";
import { MovementMeanings } from "@/components/home/MovementMeanings";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { VisitorIntent } from "@/components/home/VisitorIntent";
import { MovementTeaser } from "@/components/analytics/MovementTeaser";
import { ResearchCredibility } from "@/components/sections/ResearchCredibility";
import { EnvironmentStrip } from "@/components/sections/EnvironmentStrip";
import { Vision } from "@/components/sections/Vision";
import { CTA } from "@/components/sections/CTA";

/* Title, description and social cards are inherited from the root layout;
   only the canonical is stated here, because the root must not declare one
   (it would become every other route's canonical too). */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * Home — the page as it was, with six approved sections transplanted into it.
 * =============================================================================
 * THE BASE IS THE OLD PAGE. This file is `7444d8c`'s home page — same
 * components, same order, same implementations — with exactly three kinds of
 * change: two sections swapped for their approved replacements, one approved
 * section inserted, and the section rail added under the hero. Nothing else
 * moved and nothing else was rewritten.
 *
 * An earlier attempt did this the other way round, taking the restructured
 * page as the base and adding old sections back. That is not the same page:
 * it kept the compact gateways, the stacked family bands and the standalone
 * core diagram, none of which were ever in the old design. Hence this one,
 * built from the old tree outwards.
 *
 * ── WHAT COMES FROM THE RESTRUCTURE (approved, do not simplify) ───────────
 *   Hero                   sections/Hero.tsx + heroLiving.module.css
 *   One movement,
 *   many meanings          home/MovementMeanings.tsx, home/MotionDNAThread.tsx
 *                          — in the slot MovementStory used to hold, and no
 *                          longer a section of its own: it is the chapter the
 *                          Mission card opens. The interaction, the five
 *                          readings and the family links are untouched.
 *   24 modular products    sections/FeaturedProducts.tsx, with the family
 *                          tablist and the per-family links
 *   The sticky rail        home/HomeSectionNav.tsx + data/home-sections.ts
 *
 * MissionVision and VisitorIntent are approved too and are unchanged between
 * the two versions. VisitorIntent stays where the old page had it;
 * MissionVision is the same component with the same props and closes the page
 * now — see THE CLOSING STATEMENT on the block itself.
 *
 * ── WHAT COMES FROM THE OLD PAGE, UNTOUCHED ───────────────────────────────
 *   Verticals              the shared-core diagram and the two flagship
 *                          panels SIDE BY SIDE, as designed
 *   HowItWorks             the four-stage pipeline at full height
 *   MovementTeaser         the capture chain as its own section
 *   ResearchCredibility    the research flow diagram, the instrument panel,
 *                          the references and both decision cards
 *   EnvironmentStrip       the two-column environment diagram — the hub,
 *                          the cyan MobilityCare rail and the blue
 *                          SecureVision rail, every environment a node on
 *                          one of them. Restored from `8235eb1^` verbatim;
 *                          the category explorer that briefly replaced it
 *                          is off the page. Counts and rows come from
 *                          `industryUseCases`, so Defence & Armed Forces
 *                          and the current total arrive on their own.
 *   Vision                 unchanged as a component, and no longer a
 *                          section of its own: "Our vision / AI as a
 *                          silent guardian" and the philosophy quote are
 *                          now the chapter the Vision card opens.
 *
 * MISSION AND VISION ARE A PAIR. Each card states a claim and opens the case
 * for it — Mission the demonstration, Vision the argument — and only one
 * chapter is open at a time, because both are section-sized. See CardStories
 * for why that is one state rather than two.
 *   CTA                    unchanged
 *
 * ── ANCHORS ───────────────────────────────────────────────────────────────
 * The rail needs eight targets and the old sections were not built with them.
 * Each one is adapted by ID ONLY — an `id` and the `home-section` scroll
 * offset, never a change to layout, spacing or markup. In the order they are
 * rendered below, which is also the order the rail runs in:
 *
 *   #mobilitycare   Verticals' MobilityCare panel — the `<article>` itself
 *   #securevision   Verticals' SecureVision panel — the `<article>` itself
 *   #products       FeaturedProducts, which carries it already
 *   #technology     HowItWorks (was `how`; the footer links here by name)
 *   #research       ResearchCredibility, which carries it already
 *   #trust          VisitorIntent — see data/home-sections.ts for why this
 *                   one is a judgement call rather than an obvious fit
 *   #use-cases      EnvironmentStrip, adapted by id only (it shipped as
 *                   `#environments`, which nothing links to)
 *   #overview       this file's wrapper around the Motion DNA band and the
 *                   meanings strip, which have no shared parent otherwise —
 *                   last on the page now, and last in the rail with it
 *
 * USE CASES SITS WHERE IT SITS. The old page puts the environments
 * after the research and visitor-intent sections, and the rail follows the
 * page rather than the order the labels were approved in — a rail that lists
 * its destinations in an order the page does not use is a second, conflicting
 * story about the same page. HomeSectionNav re-derives the order from the
 * document on mount, so moving a section here moves its rail item with it.
 *
 * THE TWO FAMILY PANELS SIT SIDE BY SIDE, so `#mobilitycare` and
 * `#securevision` resolve to the same scroll position on a wide screen. Both
 * are still real, separate anchors — the ids are on the two panels, never on
 * the shared GaitAI Core block above them — and the rail no longer tries to
 * tell them apart by geometry, which is impossible when their top edges are
 * identical. See the "two sections on one row" note in HomeSectionNav.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeSectionNav />
      <Verticals />
      <FeaturedProducts />
      <HowItWorks />
      <MovementTeaser />
      <ResearchCredibility />
      <VisitorIntent />
      <EnvironmentStrip />
      <CTA />
      {/* THE CLOSING STATEMENT, and now genuinely the last thing on the page.
          It sat directly under the hero; it reads better under the demo block.
          That block is the ask — request a demo, discuss a pilot, start a
          research collaboration — and this is what the company is for, which
          is the note to leave a reader on rather than something to interrupt
          the ask with.

          The SAME component, moved. Not a copy: same props, same cards, same
          Motion DNA centre, same gait stage, same two chapters behind the same
          two controls, and the `#mission-vision` id it has always carried is
          still the only one of its kind on the page. The wrapper comes with it
          because the wrapper is the `#overview` anchor, nothing more; it adds
          no spacing of its own, so the section's top border lands against the
          demo block's bottom padding. */}
      <section id="overview" className="home-section">
        <MissionVision
          motion="gait"
          missionStory={
            /* The container the section had when it stood on its own, plus
               the bottom air it used to borrow from whatever followed it —
               now the footer. */
            <div className="container-wide pb-14 sm:pb-16 lg:pb-20">
              <MovementMeanings />
            </div>
          }
          visionStory={<Vision />}
        />
      </section>
    </>
  );
}
