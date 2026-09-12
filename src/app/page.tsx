import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { MissionVision } from "@/components/sections/about/MissionVision";
import { MovementMeanings } from "@/components/home/MovementMeanings";
import { Verticals } from "@/components/sections/Verticals";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { PrivacyPipeline } from "@/components/home/PrivacyPipeline";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { VisitorIntent } from "@/components/home/VisitorIntent";
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

 * THERE IS NO SECTION RAIL. The home page carried one for a while — first a
 * horizontal bar under the header, then a vertical timeline, then a small
 * right-hand index — and it is gone along with the gutter that reserved room
 * for it, so the content is back at its full width. The section ids below all
 * remain: they are what `/#research` resolves against, what the footer links
 * to and what the search index points at. An anchor does not need a widget
 * pointing at it to work.
 *
 * MissionVision and VisitorIntent are approved too and are unchanged between
 * the two versions. VisitorIntent stays where the old page had it;
 * MissionVision is the same component with the same props and has been moved
 * to the end of the page — see MISSION & VISION CLOSES THE PAGE below.
 *
 * ── WHAT COMES FROM THE OLD PAGE, UNTOUCHED ───────────────────────────────
 *   Verticals              the shared-core diagram and the two flagship
 *                          panels SIDE BY SIDE, as designed
 *   HowItWorks             the four-stage pipeline at full height
 *   MovementTeaser         the capture chain as its own section
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
 * The rail needs its targets and the old sections were not built with them.
 * Each one is adapted by ID ONLY — an `id` and the `home-section` scroll
 * offset, never a change to layout, spacing or markup. In the order they are
 * rendered below, which is also the order the rail runs in:
 *
 *   #mobilitycare   Verticals' MobilityCare panel — the `<article>` itself
 *   #securevision   Verticals' SecureVision panel — the `<article>` itself
 *   #products       FeaturedProducts, which carries it already
 *   #privacy        PrivacyPipeline, a new section built with this anchor —
 *                   the privacy-aware capture argument, placed directly after
 *                   the products it applies to and before the workflow that
 *                   consumes what it produces. See the component for why it
 *                   is a representation selector rather than a third pipeline
 *   #technology     HowItWorks (was `how`; the footer links here by name)
 *   #trust          VisitorIntent — the page has no trust section of its
 *                   own, so this one is a judgement call rather than an
 *                   obvious fit
 *   #use-cases      EnvironmentStrip, adapted by id only (it shipped as
 *                   `#environments`, which nothing links to)
 *   #mission-vision MissionVision's own gait row, which has always carried
 *                   this id — it only needed the `home-section` offset once
 *                   the wrapper that used to supply it was removed
 *
 * THERE IS NO RESEARCH SECTION ON THIS PAGE, and `#research` is no longer an
 * anchor here. It was a full section — first a 2,600px research argument, then
 * a shorter gateway — and both were a second telling of /research. What the
 * home page owes a reader is that the record exists and where to read it,
 * which is one line of type under the workflow control: see the research
 * credit in sections/HowItWorks.tsx. Nothing links to `/#research`; the
 * footer, the search index and the navigation all point at `/research/`, the
 * page that actually holds the record.
 *
 * MISSION & VISION CLOSES THE PAGE. It used to sit directly under the hero,
 * where a philosophy statement interrupted the product story before the
 * product had been made. Read last, the same three cards are the argument the
 * page has spent its whole length earning, and the CTA immediately under them
 * — request a demo, discuss a pilot, start a research collaboration — is what
 * to do about it. The block moved verbatim: same cards, same Motion DNA
 * centre, same gait stage, same two chapters behind the same two controls.
 * The only thing that did not come with it is the `<section id="overview">`
 * wrapper, which held nothing else and was an anchor, not a layout.
 *
 * USE CASES SITS WHERE IT SITS. The old page puts the environments
 * after the research and visitor-intent sections, and the rail follows the
 * page rather than the order the labels were approved in — a rail that lists
 * its destinations in an order the page does not use is a second, conflicting
 * story about the same page.
 *
 * THE TWO FAMILY PANELS SIT SIDE BY SIDE, so `#mobilitycare` and
 * `#securevision` resolve to the same scroll position on a wide screen. Both
 * are still real, separate anchors — the ids are on the two panels, never on
 * the shared GaitAI Core block above them — and the rail no longer tries to
 * tell them apart by geometry, which is impossible when their top edges are
 * identical. Nothing tries to tell them apart by geometry any more.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <Verticals />
      <FeaturedProducts />
      <PrivacyPipeline />
      <HowItWorks />
      <VisitorIntent />
      <EnvironmentStrip />
      <CTA />
      {/* THE CLOSING STATEMENT, and now genuinely the last thing on the page.
          It sat above the demo block; it reads better under it. The demo block
          is the ask — talk to us, run a pilot, collaborate — and this is what
          the company is for, which is the note to leave a reader on rather
          than something to interrupt the ask with.

          The SAME component, moved. Not a copy: it still carries its own
          `#mission-vision` anchor, its own `border-y`, its own gait stage and
          its own two chapters, and the ids that point at it are unchanged.

          It needs no spacing of its own here. The section's top border lands
          against the demo block's bottom padding, which is a stated edge
          rather than a collision, and its `lg:min-h-[440px]` gives it the
          presence a closing statement wants without opening a gap. */}
      <MissionVision
        motion="gait"
        missionStory={
          /* The container the section had when it stood on its own, plus the
             bottom air it used to borrow from whatever followed it — now the
             footer. */
          <div className="container-wide pb-14 sm:pb-16 lg:pb-20">
            <MovementMeanings />
          </div>
        }
        visionStory={<Vision />}
      />
    </>
  );
}
