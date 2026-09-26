import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlatformHub } from "@/components/visuals/PlatformHub";
import { EnvironmentBranch } from "@/components/home/EnvironmentBranch";
import { industryUseCases } from "@/data/products";

/**
 * Where GaitAI is used — drawn as the graph it actually is.
 *
 * A central hub carries the platform statement and two trunk branches leave
 * it: cyan/teal down the left to MobilityCare, royal/violet down the right to
 * SecureVision. Each trunk lands on its column's rail, and every environment
 * hangs off that rail on its own glowing node with a short connector lead, so
 * the panels are visibly wired to the hub. A slow pulse travels each rail in
 * turn, in the same direction the branch flows.
 *
 * The two rails are deliberately mirrored — MobilityCare's runs down the left
 * edge, SecureVision's down the right — which keeps the fan symmetric at every
 * breakpoint: side by side on desktop, stacked on mobile, the trunks always
 * arrive where the rail begins.
 *
 * Both columns open on five environments and keep the rest one click away in
 * the same column. Eleven rows against seven made the two sides visibly
 * uneven, and the breadth is still stated — by the count beside each heading,
 * which reads "5 of 11 environments" until the column is open, and by the
 * control itself. Every row is in the HTML either way; see
 * home/EnvironmentBranch. Content per row stays light (name and outcome
 * only); /use-cases still owns the problem-led treatment, the product mix and
 * the detail.
 *
 * Both columns read from `industryUseCases`, so nothing here is restated by
 * hand, and each environment's scene is drawn line art rather than stock
 * photography. The columns are top-aligned and finish at their own heights:
 * closed they match, and open they end where their own content does rather
 * than being padded out to a shared height.
 */

export function EnvironmentStrip() {
  const careCount = industryUseCases.filter((u) => u.vertical === "mobilitycare").length;
  const secureCount = industryUseCases.filter((u) => u.vertical === "securevision").length;

  return (
    <section
      id="use-cases"
      className="home-section section env-section relative overflow-hidden bg-obsidian-300/40"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="env-ambient env-ambient--care" />
        <div className="env-ambient env-ambient--secure" />
      </div>
      <div className="env-dotfield pointer-events-none absolute inset-0 -z-10" />

      <div className="container-wide">
        <SectionHeading
          eyebrow="Where it is used"
          title={
            <>
              {industryUseCases.length} environments,{" "}
              <span className="text-gradient">each with its own question.</span>
            </>
          }
          description="Every environment brings a different problem, a different product mix and a different output. Pick the one that looks like yours."
          align="left"
        />

        {/* The hub, and the two families leaving it. */}
        <Reveal delay={0.06}>
          <figure className="env-hub-stage">
            <PlatformHub
              careCount={careCount}
              secureCount={secureCount}
              total={industryUseCases.length}
              className="hidden sm:block"
            />
            <PlatformHub
              careCount={careCount}
              secureCount={secureCount}
              total={industryUseCases.length}
              compact
              className="sm:hidden"
            />
          </figure>
        </Reveal>

        <div className="env-grid">
          <EnvironmentBranch
            vertical="mobilitycare"
            label="MobilityCare"
            accent="care"
          />
          <EnvironmentBranch
            vertical="securevision"
            label="SecureVision"
            accent="secure"
          />
        </div>

        <div className="mt-12">
          <Link
            href="/use-cases"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
          >
            See the full problem-led breakdown
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
