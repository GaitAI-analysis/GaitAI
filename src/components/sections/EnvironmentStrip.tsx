import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";

/**
 * Compact environment strip for the home page — "where is this used?".
 *
 * Deliberately not a card grid, and deliberately not the full list:
 * /use-cases owns the complete problem-led treatment, so this shows the first
 * few per vertical as dense rows (name + the outcome it produces), says how
 * many more there are, and links out. Both columns read from
 * `industryUseCases`, so nothing is restated.
 */
/** How many environments each column shows before deferring to /use-cases. */
const TEASER_PER_VERTICAL = 5;

const hrefFor = (caseId: string, vertical: Vertical) => {
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  return detail ? `/use-cases/${detail.slug}/` : `/${vertical}/`;
};

function EnvironmentColumn({
  vertical,
  label,
  accent,
}: {
  vertical: Vertical;
  label: string;
  accent: "care" | "secure";
}) {
  const all = industryUseCases.filter((u) => u.vertical === vertical);
  // A teaser, not the index: /use-cases carries all of them, problem-led.
  const entries = all.slice(0, TEASER_PER_VERTICAL);
  const tone =
    accent === "care"
      ? {
          label: "text-teal-300",
          rule: "bg-teal-300/40",
          hover: "hover:border-teal-300/30",
        }
      : {
          label: "text-royal-300",
          rule: "bg-royal-300/40",
          hover: "hover:border-royal-300/30",
        };

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`h-1 w-6 rounded-full ${tone.rule}`}
        />
        <h3
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone.label}`}
        >
          {label}
        </h3>
        <span className="text-[11px] text-soft-mute">
          {all.length} environments
        </span>
      </div>

      <ul className="mt-4 border-t border-white/[0.06]">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={hrefFor(entry.id, entry.vertical)}
              className={`group flex items-baseline justify-between gap-4 border-b border-white/[0.06] py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${tone.hover}`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-soft-white">
                  {entry.industry}
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-soft-mute">
                  {entry.outcome}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className={`mt-1 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${tone.label}`}
              />
            </Link>
          </li>
        ))}
      </ul>

      {all.length > entries.length && (
        <p className="mt-4 text-[12px] text-soft-mute">
          + {all.length - entries.length} more {label} environments
        </p>
      )}
    </div>
  );
}

export function EnvironmentStrip() {
  return (
    <section id="environments" className="section bg-obsidian-300/40">
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

        <Reveal>
          <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <EnvironmentColumn
              vertical="mobilitycare"
              label="MobilityCare"
              accent="care"
            />
            <EnvironmentColumn
              vertical="securevision"
              label="SecureVision"
              accent="secure"
            />
          </div>
        </Reveal>

        <div className="mt-10">
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
