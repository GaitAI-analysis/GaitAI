import type { Publication } from "@/data/publications";
import { PublicationPlate } from "./PublicationPlate";
import { topicsFor } from "./topics";

/** A neutral reference card, not a reproduction or alteration of a paper. */
export function PublicationReferencePreview({ publication }: { publication: Publication }) {
  return (
    <div className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-obsidian-100/70">
      <PublicationPlate publication={publication} index={1} />
      <div className="flex flex-1 flex-col p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
          {publication.kind === "patent" ? "Patent reference" : "Academic research reference"} · {publication.year}
        </p>
        <p className="mt-4 font-display text-lg font-semibold leading-snug text-soft-white sm:text-xl">
          {publication.title}
        </p>
        <p className="mt-4 text-xs leading-relaxed text-soft-gray">{publication.venue} · {publication.publisher}</p>
        <p className="mt-auto pt-5 text-[11px] leading-relaxed text-soft-mute">{topicsFor(publication).join(" · ")}</p>
      </div>
    </div>
  );
}
