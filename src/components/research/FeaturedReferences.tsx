import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { allPublications, papers } from "@/data/publications";
import styles from "./research.module.css";

/**
 * Featured references — the newest records, as an editorial strip.
 *
 * Hierarchy is year → venue → title, with the year set large and monospaced
 * on the left so the strip can be scanned down that column alone. The hover
 * state is a growing accent bar and a small indent rather than a background
 * fill, which keeps it quiet enough to sit under the evidence map without
 * competing with it.
 *
 * The granted patent is pinned first regardless of date, because it is the
 * one record that is not a paper and the page's whole point is not to blur
 * that distinction. Everything else is newest-first.
 */

const FEATURED = 4;

const featured = (() => {
  const patentRecord = allPublications.find((p) => p.kind === "patent");
  const newest = [...papers].sort((a, b) => b.year - a.year);
  const rest = newest.slice(0, patentRecord ? FEATURED - 1 : FEATURED);
  return patentRecord ? [patentRecord, ...rest] : rest;
})();

export function FeaturedReferences() {
  return (
    <section id="references" className="section">
      <div className="container-wide">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading
            eyebrow="Featured references"
            title={
              <>
                The records, <span className="text-gradient">in full.</span>
              </>
            }
            description="The granted patent and the most recent papers. Every record links to its own page, with the venue, year and a route to the publisher of record."
            align="left"
            className="w-full lg:max-w-2xl"
          />

          <Link
            href="/publications"
            className="group inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
          >
            All {papers.length + 1} research outputs
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>

        <Reveal>
          <ol className="mt-12">
            {featured.map((record) => (
              <li key={record.id}>
                <Link
                  href={`/publications/${record.id}/`}
                  className={`${styles.refRow} group grid gap-x-8 gap-y-3 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-baseline`}
                >
                  <span
                    className={`${styles.refYear} font-mono text-[1.25rem] leading-none sm:text-[1.375rem]`}
                  >
                    {record.year}
                  </span>

                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                      <span>{record.venue}</span>
                      {record.kind === "patent" && record.patentNumber && (
                        <>
                          <span aria-hidden="true" className="text-white/20">
                            ·
                          </span>
                          <span className="text-amber-300/85">
                            Patent {record.patentNumber}
                          </span>
                        </>
                      )}
                    </span>
                    <span className="mt-2.5 block font-display text-[1.0625rem] leading-snug text-soft-gray transition-colors duration-300 group-hover:text-soft-white sm:text-[1.1875rem]">
                      {record.title}
                    </span>
                  </span>

                  <span className="flex items-center gap-3 sm:justify-end">
                    <span
                      aria-hidden="true"
                      className="block h-px w-6 bg-cyan-300/35 transition-all duration-500 ease-smooth group-hover:w-12 group-hover:bg-cyan-300/60"
                    />
                    <span className="whitespace-nowrap text-[11.5px] font-medium text-cyan-300/75 transition-colors duration-300 group-hover:text-cyan-300">
                      View record
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
