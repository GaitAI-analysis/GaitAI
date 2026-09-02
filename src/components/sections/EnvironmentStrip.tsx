import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlatformHub } from "@/components/visuals/PlatformHub";
import { EnvironmentScene } from "@/components/visuals/EnvironmentScenes";
import { industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";

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
 * Content stays a teaser: name and outcome only. /use-cases owns the
 * problem-led treatment, the product mix and the detail. Both columns read
 * from `industryUseCases`, so nothing here is restated by hand — and each
 * environment's scene is drawn line art rather than stock photography.
 */

/**
 * How many environments each column shows before deferring to /use-cases —
 * the teaser cap kept from the previous strip (null would show all of them).
 * The hub still states each family's real count, so the diagram is complete
 * even though the list is a sample.
 */
const SHOWN_PER_VERTICAL: number | null = 5;

const hrefFor = (caseId: string, vertical: Vertical) => {
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  return detail ? `/use-cases/${detail.slug}/` : `/${vertical}/`;
};

/** Full class names, written out — Tailwind drops @layer rules it can't find. */
const COLUMN_CLASS = {
  care: "env-column env-column--care",
  secure: "env-column env-column--secure",
} as const;

const BRANCH_CLASS = {
  care: "env-branch env-branch--care",
  secure: "env-branch env-branch--secure",
} as const;

function EnvironmentBranch({
  vertical,
  label,
  accent,
}: {
  vertical: Vertical;
  label: string;
  accent: "care" | "secure";
}) {
  const all = industryUseCases.filter((u) => u.vertical === vertical);
  const entries = SHOWN_PER_VERTICAL ? all.slice(0, SHOWN_PER_VERTICAL) : all;

  return (
    <div className={COLUMN_CLASS[accent]}>
      <div className="env-column-head">
        <span aria-hidden="true" className="env-column-node" />
        <h3 className="env-column-title">{label}</h3>
        <span className="env-column-count">{all.length} environments</span>
      </div>

      <div className={BRANCH_CLASS[accent]}>
        <ul className="env-list">
          {entries.map((entry, i) => (
            <li key={entry.id} className="env-item" style={{ "--env-i": i } as CSSProperties}>
              <Link href={hrefFor(entry.id, entry.vertical)} className="env-panel">
                <span aria-hidden="true" className="env-scene">
                  <EnvironmentScene id={entry.id} />
                </span>
                <span className="env-copy">
                  <span className="env-name">{entry.industry}</span>
                  <span className="env-outcome">{entry.outcome}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className="env-arrow" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {all.length > entries.length && (
        <p className="env-column-more">
          + {all.length - entries.length} more {label} environments
        </p>
      )}
    </div>
  );
}

export function EnvironmentStrip() {
  const careCount = industryUseCases.filter((u) => u.vertical === "mobilitycare").length;
  const secureCount = industryUseCases.filter((u) => u.vertical === "securevision").length;

  return (
    <section
      id="environments"
      className="section env-section relative overflow-hidden bg-obsidian-300/40"
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
