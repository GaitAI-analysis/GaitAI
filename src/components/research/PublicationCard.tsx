import Link from "next/link";
import type { Publication } from "@/data/publications";
import styles from "./evidence.module.css";

/**
 * One research record as a compact card: index, title, venue, publisher and
 * year, and a single arrow affordance.
 *
 * The previous rows put the title, the metadata and a separate "View
 * publication" link in the same block, so each record read as two competing
 * calls to action for the same destination. The whole card is now one link —
 * the arrow is decoration, not a second target — and the record page is where
 * the external publisher link lives.
 */
export function PublicationCard({
  publication,
  index,
}: {
  publication: Publication;
  index: number;
}) {
  const isPatent = publication.kind === "patent";

  return (
    <Link
      href={`/publications/${publication.id}/`}
      className={`${styles.pubCard} group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian`}
    >
      <span
        aria-hidden="true"
        className={`${styles.pubIndex} pt-[2px] font-mono text-[11px]`}
      >
        {String(index).padStart(2, "0")}
      </span>

      <span className="min-w-0">
        <span className="block font-display text-[0.9375rem] leading-snug text-soft-gray transition-colors duration-300 group-hover:text-soft-white">
          {publication.title}
        </span>
        <span className="mt-2 block text-[11.5px] leading-snug text-soft-mute">
          {publication.venue}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-soft-mute/85">
          <span>{publication.publisher}</span>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <span className="tabular-nums">{publication.year}</span>
          {isPatent && publication.patentNumber && (
            <>
              <span aria-hidden="true" className="text-white/20">
                ·
              </span>
              <span className="text-amber-300/85">
                Patent {publication.patentNumber}
              </span>
            </>
          )}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`${styles.pubArrow} pt-[2px] text-[13px]`}
      >
        ↗
      </span>
    </Link>
  );
}
