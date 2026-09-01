import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Publication } from "@/data/publications";
import { publisherAccent } from "@/data/publications";
import { assetPath } from "@/lib/paths";
import { displayDate, topicsFor } from "./topics";

/**
 * Editorial grid card: large real publication visual (the paper's first
 * page / the patent certificate) on a neutral canvas, then date, title,
 * venue and up to three controlled topics. The whole card links to the
 * publication's detail page.
 */
export function PublicationCard({
  publication,
  priority = false,
}: {
  publication: Publication;
  priority?: boolean;
}) {
  const accent = publisherAccent[publication.publisher];
  const topics = topicsFor(publication).slice(0, 3);

  return (
    <Link
      href={`/publications/${publication.id}/`}
      aria-label={`${publication.title} — ${publication.venue}, ${publication.year}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16] hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
    >
      {/* Publication visual — the real first-page capture, top-anchored so
          the masthead and title block stay legible without distortion. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-white/[0.06] bg-obsidian-100/70">
        <Image
          src={assetPath(publication.cover)}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.015]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian-200/70 via-transparent to-transparent" />
        {publication.kind === "patent" && (
          <span className="absolute left-3 top-3 rounded-full border border-amber-300/40 bg-obsidian/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300 backdrop-blur-md">
            Granted patent
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
          {displayDate(publication)}
        </div>
        <h3 className="mt-2.5 font-display text-[1.16rem] font-semibold leading-snug text-soft-white sm:text-[1.28rem]">
          {publication.title}
        </h3>
        <div className={`mt-2.5 text-[12.5px] font-medium ${accent.text}`}>
          {publication.venue}
        </div>

        <div className="flex-1" />

        {topics.length > 0 && (
          <div className="mt-4 text-[11px] tracking-[0.02em] text-soft-mute">
            {topics.join(" · ")}
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-1.5 border-t border-white/[0.06] pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/90 transition-colors group-hover:text-cyan-200">
          View publication
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
