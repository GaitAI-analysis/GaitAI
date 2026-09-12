import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { researchAreas } from "@/data/evidence";
import { papers } from "@/data/publications";

/**
 * "WHY SHOULD I BELIEVE IT?" — a gateway, not the Research page.
 * =============================================================================
 * What stood here was about 2,600px of research argument: the capture → engine
 * → capability chain drawn at 1000×470, the founder record with its four dials,
 * the three most recent references, two decision cards and the responsible-
 * deployment statement. All of it true, and — apart from the drawing — all of
 * it a second copy of a page that already existed:
 *
 *   headline + lede      /research's own <h1> and hero lede, word for word
 *   the four dials       /research's telemetry readout
 *   three references     /research's publication ledger, which shows five
 *   "evidence map" card  the evidence map itself, further down /research
 *   founder attribution  /publications, which names the publishers too
 *   privacy + deployment /legal/responsible-ai and /trust
 *
 * The drawing was the one thing with no equivalent, so the drawing moved to
 * /research (section 01, "The record, drawn") and the copies were deleted
 * rather than transplanted. What is left here is a gateway: the claim, the four
 * subjects the record covers, and the door.
 *
 * IT STILL CANNOT OVERSTATE THE RECORD. The subjects come from `researchAreas`
 * and the paper count from `publications.ts`, so this section names exactly the
 * areas that have published work behind them — the same source the diagram it
 * replaced was reading.
 *
 * THE RAIL STILL STOPS HERE. `id="research"` and `home-section` are unchanged,
 * so the sticky section navigator's Research item scrolls to this gateway.
 */

/** The four subjects, in the order the record lists them. */
const subjects = researchAreas.map((area) => area.title);

export function ResearchGateway() {
  return (
    <section
      id="research"
      aria-label="Research basis"
      className="home-section section relative overflow-hidden bg-obsidian-300/30"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[8%] top-[15%] h-72 w-72 rounded-full bg-radial-violet opacity-40 blur-3xl" />
        <div className="absolute bottom-[15%] right-[8%] h-72 w-72 rounded-full bg-radial-cyan opacity-40 blur-3xl" />
      </div>
      <div className="res-dotfield pointer-events-none absolute inset-0 -z-10" />

      <div className="container-wide">
        <SectionHeading
          eyebrow="Research basis · Responsible AI"
          title={
            <>
              Built on a{" "}
              <span className="text-gradient">published research record.</span>
            </>
          }
          align="left"
        />

        {/* The four subjects as one line of hairline type — the shape of the
            record, not a restatement of it. Each is a research area with
            published work behind it; the page that lists that work is one
            link away. */}
        <ul className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] leading-snug text-soft-gray sm:text-[13.5px]">
          {subjects.map((subject, i) => (
            <li key={subject} className="flex items-center gap-3">
              {i > 0 && (
                <span aria-hidden="true" className="text-soft-mute/60">
                  ·
                </span>
              )}
              {subject}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-white/[0.07] pt-7">
          <Link
            href="/research/"
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
          >
            Explore Research
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/publications/"
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-white transition-colors hover:text-cyan-200"
          >
            All {papers.length} papers &amp; the granted patent
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
