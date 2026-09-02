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
    <article className="group relative flex gap-5 border-b border-white/[0.06] py-6 transition-colors hover:bg-white/[0.02] sm:gap-6 sm:px-4">
      {/* Thumbnail */}
      <Link
        href={`/publications/${publication.id}/`}
        tabIndex={-1}
        aria-hidden="true"
        className="relative hidden h-[68px] w-[108px] shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-obsidian-100/70 transition-colors group-hover:border-cyan-300/25 sm:block"
      >
        <PublicationCoverArt publication={publication} compact />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={`/publications/${publication.id}/`}
          className="font-display text-base font-semibold leading-snug text-soft-white underline-offset-4 transition-colors hover:text-cyan-100 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70 sm:text-[1.1rem]"
        >
          {publication.title}
        </Link>

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

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <a
            href={publication.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-soft-white transition-all hover:border-white/25 hover:bg-white/[0.06]"
          >
            <ExternalLink className="h-3 w-3" />
            {publication.kind === "patent" ? "Patent record" : "Paper"}
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
          <Link
            href={`/publications/${publication.id}/`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/90 transition-colors hover:text-cyan-200"
          >
            Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
