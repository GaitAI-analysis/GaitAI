import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/data/publications";
import { displayDate, topicsFor } from "./topics";
import {
  PublicationCoverArt,
  publicationKindLabel,
} from "./PublicationCoverArt";

/**
 * Editorial grid card: drawn research cover art, then date, clamped title,
 * venue, topics and the call to action. The whole card links to the
 * publication's detail page.
 *
 * The visual used to be the paper's own first page (`publication.cover`, a
 * PDF capture) with the graphical abstract (`figure`) preferred when present.
 * No record ever set `figure`, so in practice every card showed a document
 * screenshot: bulky at card size, and nine near-identical white pages down
 * the grid. That is now `PublicationCoverArt`, which draws a motif specific to
 * each paper's subject. `cover` is untouched in the data and still carries the
 * detail page's first-page view and the patent-certificate hero — it is only
 * no longer the grid's visual.
 *
 * The image area is a fixed 16:10 box rather than a fixed pixel height, so the
 * art holds one aspect ratio at every card width and the covers keep an even
 * rhythm across the grid instead of growing squarer as the column narrows.
 */
export function PublicationCard({ publication }: { publication: Publication }) {
  const topics = topicsFor(publication).slice(0, 3);
  const kind = publicationKindLabel(publication);
  const isPatent = publication.kind === "patent";

  return (
    <Link
      href={`/publications/${publication.id}/`}
      title={publication.title}
      aria-label={`${publication.title} — ${publication.venue}, ${publication.year}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-soft-white/[0.08] bg-gradient-to-b from-soft-white/[0.03] to-transparent transition-all duration-300 hover:-translate-y-[3px] hover:border-cyan-300/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
    >
      {/* Cover art. The scale is deliberately tiny — the art is a fixed
          composition, and a large zoom would push the motif out of frame. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-soft-white/[0.07]">
        <PublicationCoverArt
          publication={publication}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />

        <span
          className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur-md ${
            isPatent
              ? "border-amber-300/40 bg-obsidian/80 text-amber-300"
              : "border-soft-white/15 bg-obsidian/70 text-soft-gray"
          }`}
        >
          {kind}
        </span>
      </div>

      {/* Body: date → title (clamped) → venue → topics → call to action */}
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
          {displayDate(publication)}
        </div>
        <h3 className="mt-2 line-clamp-3 font-display text-[1.2rem] font-semibold leading-[1.3] text-soft-white sm:text-[1.26rem]">
          {publication.title}
        </h3>
        <div className="publication-venue mt-2 text-[12.5px] font-medium">
          {publication.venue}
        </div>

        {topics.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span
                key={t}
                className="rounded-full border border-soft-white/10 bg-soft-white/[0.03] px-2 py-0.5 text-[10.5px] text-soft-mute"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        <div className="mt-4 flex items-center gap-1.5 border-t border-soft-white/[0.06] pt-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-soft-mute transition-colors group-hover:text-cyan-300">
          {isPatent ? "View patent record" : "View publication"}
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-[3px]"
          />
        </div>
      </div>
    </Link>
  );
}
