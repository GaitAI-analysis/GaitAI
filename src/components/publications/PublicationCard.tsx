import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/data/publications";
import { assetPath } from "@/lib/paths";
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
 * The visual is now the record's commissioned `artwork` where one exists — a
 * drawn banner of the paper's subject — with `PublicationCoverArt` kept as the
 * fallback for any record that has none. Everything around it still comes from
 * the record: date, title, venue, topics, kind and link. No text inside an
 * artwork is treated as metadata.
 *
 * The kind used to be a pill floating over the top-left of the image. The new
 * artwork puts its first label exactly there — "Pose", "Gait Data",
 * "Traditional Methods" — so the kind moved into the metadata row beside the
 * date, where it reads as what it is: 2024 · Journal article.
 *
 * The image area is a fixed 5:2 box rather than a fixed pixel height, so the
 * art holds one aspect ratio at every card width and the banners keep an even
 * rhythm across the grid instead of growing squarer as the column narrows.
 * 5:2 is the artwork's own proportion: these are left-to-right method
 * diagrams, and a squarer box would crop the flow they exist to show.
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
      <div
        className={`relative aspect-[5/2] w-full overflow-hidden border-b ${
          isPatent ? "border-amber-300/25" : "border-soft-white/[0.07]"
        }`}
      >
        {publication.artwork ? (
          <Image
            src={assetPath(publication.artwork)}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <PublicationCoverArt
            publication={publication}
            className="transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        )}

        {/* The patent is the one record with a different status, so it is the
            one card with a champagne edge — a hairline over the artwork, not a
            second colour scheme. */}
        {isPatent && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
          />
        )}

      </div>

      {/* Body: date → title (clamped) → venue → topics → call to action */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-baseline gap-x-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
          <span>{displayDate(publication)}</span>
          <span aria-hidden="true">·</span>
          <span className={isPatent ? "text-amber-300" : "text-soft-gray"}>
            {kind}
          </span>
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
