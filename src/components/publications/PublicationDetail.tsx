import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  ExternalLink,
} from "lucide-react";
import { FOUNDER_NAME, type Publication } from "@/data/publications";
import { publisherAccent } from "@/data/publications";
import { assetPath } from "@/lib/paths";
import {
  displayDate,
  formatCitation,
  relatedPublications,
  topicsFor,
} from "./topics";
import { PublicationCard } from "./PublicationCard";

/**
 * Publication detail template. Renders ONLY what the record documents:
 * bibliographic metadata, the real first-page/certificate figure, the
 * external links that exist, a citation assembled from the record's own
 * fields, patent registry details where applicable, and related work by
 * shared topics. No abstracts, methods or results are invented.
 */
export function PublicationDetail({
  publication,
}: {
  publication: Publication;
}) {
  const accent = publisherAccent[publication.publisher];
  const topics = topicsFor(publication);
  const related = relatedPublications(publication);
  const isPatent = publication.kind === "patent";

  return (
    <article className="relative w-full overflow-hidden pb-24">
      <header className="site-page-intro-compact relative overflow-hidden pb-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-[-20%] h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                "radial-gradient(closest-side, rgba(79,209,255,0.14), transparent 70%)",
            }}
          />
        </div>

        <div className="container-wide">
          <Link
            href="/publications"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to publications
          </Link>

          <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
            <span className={accent.text}>{publication.venue}</span>
            <span className="text-soft-mute">·</span>
            <span className="text-soft-mute">{displayDate(publication)}</span>
            {isPatent && (
              <>
                <span className="text-soft-mute">·</span>
                <span className="text-amber-300">Granted patent</span>
              </>
            )}
          </div>

          <h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold text-balance leading-tight text-soft-white sm:text-4xl">
            {publication.title}
          </h1>

          <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-soft-gray">
            {publication.authors.map((author, i) => (
              <span key={author}>
                {i > 0 && ", "}
                <span
                  className={
                    author.includes(FOUNDER_NAME)
                      ? "font-semibold text-soft-white"
                      : undefined
                  }
                >
                  {author}
                </span>
              </span>
            ))}
          </p>

          <div className="mt-3 text-sm text-soft-mute">
            {publication.venue} · {publication.publisher}
            {publication.date ? ` · ${publication.date}` : ` · ${publication.year}`}
          </div>

          {/* Primary actions — only links that actually exist */}
          <div className="mt-7 flex flex-wrap gap-2.5">
            <a
              href={publication.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-200 transition-all hover:border-cyan-300/60 hover:bg-cyan-300/15"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {isPatent ? "Patent record" : "Read paper"}
            </a>
            {publication.doi && (
              <a
                href={`https://doi.org/${publication.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 font-mono text-xs text-soft-white transition-all hover:border-white/25 hover:bg-white/[0.06]"
              >
                DOI · {publication.doi}
              </a>
            )}
            {isPatent && (
              <a
                href={assetPath(publication.cover)}
                download="GaitAI-Patent-Certificate.jpg"
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-200 transition-all hover:border-amber-300/60 hover:bg-amber-300/15"
              >
                <Download className="h-3.5 w-3.5" />
                Download certificate
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="container-wide">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
          {/* Figure — full page shown, never cropped, on a neutral canvas */}
          <figure className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-obsidian-100/70 p-4 sm:p-5">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[420px] overflow-hidden rounded-lg">
                <Image
                  src={assetPath(publication.cover)}
                  alt={`${publication.title} — first page`}
                  fill
                  sizes="(min-width: 1024px) 420px, 90vw"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <figcaption className="mt-3 text-center text-[11px] text-soft-mute">
              {isPatent
                ? "Patent certificate · Government of India"
                : `First page · ${publication.venue}`}
            </figcaption>
          </figure>

          <div className="min-w-0">
            {/* Bibliographic record */}
            <DetailSection label="Publication record">
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <RecordField label="Venue" value={publication.venue} />
                <RecordField label="Publisher" value={publication.publisher} />
                <RecordField
                  label={isPatent ? "Granted" : "Published"}
                  value={publication.date ?? String(publication.year)}
                />
                <RecordField
                  label="Authors"
                  value={publication.authors.join(", ")}
                />
                {isPatent && publication.patentNumber && (
                  <RecordField
                    label="Patent number"
                    value={publication.patentNumber}
                    mono
                  />
                )}
                {isPatent && publication.applicationNumber && (
                  <RecordField
                    label="Application number"
                    value={publication.applicationNumber}
                    mono
                  />
                )}
                {isPatent && publication.filingDate && (
                  <RecordField label="Filed" value={publication.filingDate} />
                )}
                {isPatent && publication.jurisdiction && (
                  <RecordField
                    label="Jurisdiction"
                    value={`${publication.jurisdiction} · valid ${publication.validityYears} years from filing`}
                  />
                )}
              </dl>
            </DetailSection>

            {/* Topics */}
            {topics.length > 0 && (
              <DetailSection label="Research topics">
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1 text-xs text-soft-gray"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Keywords, exactly as recorded */}
            {publication.keywords && publication.keywords.length > 0 && (
              <DetailSection label="Author keywords">
                <div className="text-sm leading-relaxed text-soft-mute">
                  {publication.keywords.join(" · ")}
                </div>
              </DetailSection>
            )}

            {/* Citation */}
            <DetailSection label="Cite this work">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 font-mono text-[12.5px] leading-relaxed text-soft-gray">
                {formatCitation(publication)}
              </div>
            </DetailSection>

            <div className="mt-8 text-[12.5px] leading-relaxed text-soft-mute">
              The full text, abstract and figures are available from the{" "}
              {isPatent ? "official patent registry" : "publisher"} via the
              links above.
            </div>
          </div>
        </div>

        {/* Related work */}
        {related.length > 0 && (
          <section className="mt-20">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-soft-mute">
                Related publications
              </h2>
              <Link
                href="/publications"
                className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300/90 transition-colors hover:text-cyan-200"
              >
                All publications
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PublicationCard key={p.id} publication={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-soft-mute">
        {label}
      </h2>
      {children}
    </section>
  );
}

function RecordField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm leading-relaxed text-soft-white ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
