import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/data/publications";
import { assetPath } from "@/lib/paths";
import { displayDate, topicsFor } from "./topics";

/**
 * Editorial grid card: compact publication visual on a neutral canvas, then
 * date, clamped title, venue and up to three controlled topics. The whole
 * card links to the publication's detail page; the corner arrow is the only
 * call-to-action affordance.
 *
 * Visual priority: a publication's own `figure` asset (graphical abstract,
 * architecture/method figure, representative result or thumbnail) when one
 * exists — rendered `object-contain` so scientific content is never
 * cropped. The first-page capture (`cover`) is only the fallback, keeping
 * its top-anchored crop so the paper masthead stays legible.
 */
export function PublicationCard({
  publication,
  priority = false,
}: {
  publication: Publication;
  priority?: boolean;
}) {
  const topics = topicsFor(publication).slice(0, 3);
  const visual = publication.figure ?? publication.cover;
  const isFigure = Boolean(publication.figure);

  return (
    <Link
      href={`/publications/${publication.id}/`}
      title={publication.title}
      aria-label={`${publication.title} — ${publication.venue}, ${publication.year}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-soft-white/[0.08] bg-gradient-to-b from-soft-white/[0.03] to-transparent transition-all duration-300 hover:-translate-y-[3px] hover:border-cyan-300/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
    >
      {/* Publication visual on a neutral figure canvas. No overlay — the
          image area ends at a clean separation before the card body. */}
      <div className="publication-figure relative h-[210px] w-full overflow-hidden sm:h-[240px]">
        <Image
          src={assetPath(visual)}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className={
            isFigure
              ? "object-contain p-3 transition-transform duration-500 group-hover:scale-[1.015]"
              : "object-cover object-top transition-transform duration-500 group-hover:scale-[1.015]"
          }
        />
        {publication.kind === "patent" && (
          <span className="absolute left-3 top-3 rounded-full border border-amber-300/40 bg-obsidian/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300 backdrop-blur-md">
            Granted patent
          </span>
        )}
      </div>

      {/* Body: year → title (clamped) → venue → topics + corner arrow */}
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

        <div className="flex-1" />

        <div className="mt-4 flex items-end justify-between gap-3">
          {topics.length > 0 ? (
            <div className="text-[11px] leading-relaxed tracking-[0.02em] text-soft-mute">
              {topics.join(" · ")}
            </div>
          ) : (
            <span aria-hidden="true" />
          )}
          <ArrowRight
            aria-hidden="true"
            className="mb-0.5 h-4 w-4 shrink-0 text-soft-mute/70 transition-all duration-300 group-hover:translate-x-[3px] group-hover:text-cyan-300"
          />
        </div>
      </div>
    </Link>
  );
}
