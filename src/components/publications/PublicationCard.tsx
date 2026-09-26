import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Publication } from "@/data/publications";
import { displayDate, topicsFor } from "./topics";
import { publicationKindLabel } from "./PublicationCoverArt";
import { PublicationPlate } from "./PublicationPlate";

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
export function PublicationCard({
  publication,
  index = 1,
  priority = false,
}: {
  publication: Publication;
  /** Position in the archive, for the plate's record number. */
  index?: number;
  /** First-row cards fetch their art eagerly. */
  priority?: boolean;
}) {
  const topics = topicsFor(publication).slice(0, 3);
  const kind = publicationKindLabel(publication);
  const isPatent = publication.kind === "patent";

  return (
    <Link
      href={`/publications/${publication.id}/`}
      title={publication.title}
      aria-label={`${publication.title} — ${publication.venue}, ${publication.year}`}
      className="card-link group flex h-full flex-col overflow-hidden rounded-2xl border border-soft-white/[0.08] bg-gradient-to-b from-soft-white/[0.03] to-transparent"
    >
      {/* The plate: the record's own art, framed as a technical plate —
          recessed well, shared survey grid, registration marks, a topic-keyed
          accent and a caption strip. See PublicationPlate. */}
      <PublicationPlate
        publication={publication}
        index={index}
        priority={priority}
      />

      {/* Body: year → title → venue → publisher and kind → topics.
          The year leads in the accent because it is what a reader scans an
          archive by, and the "View publication →" footer became the corner
          glyph: the whole card is the link, so a full-width row restating that
          was spending the card's last line on nothing. */}
      <div className="relative flex flex-1 flex-col p-5">
        <span
          aria-hidden="true"
          className="card-corner absolute right-4 top-4"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>

        <div
          className={`pr-8 text-[11px] font-semibold tracking-[0.16em] ${
            isPatent ? "text-amber-300" : "text-cyan-300"
          }`}
        >
          {displayDate(publication)}
        </div>

        {/* No clamp. Two of the nine records run past 140 characters, and a
            three-line clamp cut them mid-phrase — in a research library the
            full title IS the record, so the card grows instead. */}
        <h3 className="mt-2 pr-2 font-display text-[1.2rem] font-semibold leading-[1.3] text-soft-white sm:text-[1.26rem]">
          {publication.title}
        </h3>

        <div className="publication-venue mt-2.5 text-[12.5px] font-medium">
          {publication.venue}
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-soft-mute">
          {publication.publisher}
          <span aria-hidden="true" className="px-1.5 opacity-50">
            ·
          </span>
          {kind}
        </div>

        <div className="flex-1" />

        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
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

        {/* The cue came back, in the record's own language. The corner glyph
            alone left it to the reader to guess whether a card in a research
            library opens a page or is a citation; a patent says what it
            opens, because a patent record is not a paper. */}
        <span aria-hidden="true" className="card-cue mt-4">
          {isPatent ? "View patent record" : "View publication"}
          <span className="card-cue-arrow">&rarr;</span>
        </span>
      </div>
    </Link>
  );
}
