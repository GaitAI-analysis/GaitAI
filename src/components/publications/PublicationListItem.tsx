import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { FOUNDER_NAME, type Publication } from "@/data/publications";
import { publisherAccent } from "@/data/publications";
import { publicAuthors, topicsFor } from "./topics";
import { PublicationCoverArt } from "./PublicationCoverArt";

/**
 * Compact scholarly list row — the citation-friendly view: thumbnail,
 * title, muted authors, venue · year, topics and the real external
 * actions for the record.
 *
 * The thumbnail is the same drawn cover art the grid card uses, in compact
 * mode (motif and frame, no label or record number — both are illegible at
 * 84px). The grid and the list are two views of one library, so they had to
 * stop showing two different kinds of picture.
 */
export function PublicationListItem({
  publication,
}: {
  publication: Publication;
}) {
  const accent = publisherAccent[publication.publisher];
  const topics = topicsFor(publication).slice(0, 3);

  return (
    /* The whole row opens the record. It used to take three separate links —
       thumbnail, title, "Details" — so two thirds of a 100px-tall row did
       nothing when clicked. `row-link` stretches one anchor across it and the
       real external actions sit above that anchor on `card-raise`, which is
       why they are still their own destinations rather than being swallowed
       by the row. A row washes rather than lifts: a list where every row
       rises 2px under the pointer ripples. */
    <article className="row-surface group flex gap-5 border-b border-white/[0.06] py-6 sm:gap-6 sm:px-4">
      <Link
        href={`/publications/${publication.id}/`}
        aria-label={`View publication: ${publication.title}`}
        className="card-hit"
      />

      {/* Thumbnail — decorative here; the row's own link carries the name. */}
      <div
        aria-hidden="true"
        className="relative hidden h-[68px] w-[108px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-obsidian-100/70 transition-colors group-hover:border-cyan-300/25 sm:block"
      >
        <PublicationCoverArt publication={publication} compact />
      </div>

      <div className="relative min-w-0 flex-1">
        <h3 className="font-display text-base font-semibold leading-snug text-soft-white transition-colors group-hover:text-cyan-100 sm:text-[1.1rem]">
          {publication.title}
        </h3>

        {publicAuthors(publication).length > 0 && (
        <div className="mt-2 text-[12.5px] leading-relaxed text-soft-mute">
          {publicAuthors(publication).map((author, i) => (
            <span key={author}>
              {i > 0 && ", "}
              <span
                className={
                  author.includes(FOUNDER_NAME)
                    ? "font-semibold text-soft-gray"
                    : undefined
                }
              >
                {author}
              </span>
            </span>
          ))}
        </div>
        )}

        <div className="mt-1.5 text-[12.5px]">
          <span className={`font-medium ${accent.text}`}>
            {publication.venue}
          </span>
          <span className="text-soft-mute"> · {publication.year}</span>
          {topics.length > 0 && (
            <span className="text-soft-mute"> · {topics.join(" · ")}</span>
          )}
        </div>

        <div className="card-raise mt-3.5 flex flex-wrap items-center gap-2">
          {/* Two real external destinations, and the row's own cue. The
              "Details" link went: it pointed where the row already points. */}
          <a
            href={publication.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-soft-white transition-all hover:border-white/25 hover:bg-white/[0.06]"
          >
            <ExternalLink className="h-3 w-3" />
            {publication.kind === "patent" ? "Patent record" : "Read paper"}
          </a>
          {publication.doi && (
            <a
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-soft-gray transition-all hover:border-white/25 hover:bg-white/[0.06]"
            >
              DOI
            </a>
          )}
          <span aria-hidden="true" className="card-cue ml-1">
            View publication
            <ArrowRight className="card-cue-arrow h-3 w-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
