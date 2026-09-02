import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { evidenceForProduct } from "@/data/evidence";
import { cn } from "@/lib/utils";

/**
 * Research basis for one product — the peer-reviewed work and IP behind the
 * capabilities it is built on.
 *
 * Deliberately scoped to CAPABILITIES, not outcomes. The published record
 * covers gait recognition, pose-based gait analysis, privacy-preserving gait
 * data and edge inference; it contains no clinical validation study, accuracy
 * benchmark or trial result. So this block says "this capability rests on
 * these papers" and never implies that a fall-risk, injury-risk, safety or
 * identification *outcome* has been validated. Products whose capabilities
 * have no published backing render nothing at all rather than a vague nod.
 *
 * Renders only on product detail pages — a meaningful decision point — so
 * cards and grids elsewhere stay uncluttered.
 */
export function ProductEvidence({
  productId,
  accentText,
}: {
  productId: string;
  accentText: string;
}) {
  const evidence = evidenceForProduct(productId);
  if (evidence.length === 0) return null;

  const publications = new Map(
    evidence.flatMap((entry) =>
      entry.areas.flatMap((area) =>
        area.publications.map((publication) => [publication.id, publication] as const)
      )
    )
  );

  return (
    <div className="card relative overflow-hidden p-6">
      <p className="text-sm leading-relaxed text-soft-gray">
        Published work is the <span className="text-soft-white">research
        foundation</span> for the capabilities this product is built on. That
        record covers the movement-analysis methods themselves — it is{" "}
        <span className="text-soft-white">not a validation</span> of this
        product&apos;s outputs, and there is no clinical validation study,
        accuracy benchmark or trial result behind them.
      </p>

      <dl className="mt-5 space-y-4">
        {evidence.map((entry) => (
          <div key={entry.capabilityId}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
              {entry.capabilityTitle}
            </dt>
            <dd className="mt-1.5 text-[12.5px] leading-relaxed text-soft-gray">
              {entry.areas.map((area) => area.title).join(" · ")}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
          {publications.size === 1
            ? "Research foundation · 1 record"
            : `Research foundation · ${publications.size} records`}
        </div>
        <ul className="mt-3 space-y-2.5">
          {Array.from(publications.values())
            .sort((a, b) => b.year - a.year)
            .map((publication) => (
              <li key={publication.id}>
                <Link
                  href={`/publications/${publication.id}/`}
                  className="group block"
                >
                  <span className="block text-[12.5px] leading-snug text-soft-white transition-colors group-hover:text-cyan-300">
                    {publication.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-soft-mute">
                    {publication.venue} · {publication.year}
                    {publication.kind === "patent"
                      ? ` · Patent ${publication.patentNumber}`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
        </ul>
      </div>

      <Link
        href="/research#areas"
        className={cn(
          "mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:text-soft-white",
          accentText
        )}
      >
        Full evidence map
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
