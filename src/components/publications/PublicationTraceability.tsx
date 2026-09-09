import Link from "next/link";
import { researchAreas } from "@/data/evidence";
import { gaitscapeRelationships, nodeById } from "@/data/gaitscape/graph";
import type { Publication } from "@/data/publications";

/** Provenance reuses the graph's scope-qualified evidence, never a parallel map. */
export function PublicationTraceability({ publication }: { publication: Publication }) {
  const areas = researchAreas.filter((area) => area.publications.some((paper) => paper.id === publication.id));
  if (!areas.length) return null;

  return (
    <section className="mt-14 border-y border-white/10 py-8" aria-labelledby="publication-lineage">
      <h2 id="publication-lineage" className="font-display text-xl text-soft-white">Research → capability → product</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-soft-mute">
        This publication informs a research foundation. Connections below describe GaitAI&apos;s documented architecture; they do not establish product accuracy, clinical validation or regulatory clearance.
      </p>
      {areas.map((area) => (
        <div key={area.id} className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-soft-white">{area.title}</h3>
            <Link className="text-xs font-semibold text-cyan-300 underline underline-offset-4" href={`/gaitscape/?focus=${area.id}`}>See this paper in GaitScape →</Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Research capabilities">
            {area.capabilities.map((capability) => <Link key={capability.id} className="gaitscape-chip" href={`/gaitscape/?focus=${capability.id}`}>{capability.title}</Link>)}
          </div>
          {area.directProducts.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-soft-gray">Modules directly informed at capability level</p>
              <div className="mt-3 flex flex-wrap gap-x-7 gap-y-4">
                {area.directProducts.map((product) => {
                  const signals = gaitscapeRelationships.filter((rel) => rel.source === product.id && rel.type === "senses")
                    .map((rel) => nodeById.get(rel.target)).filter(Boolean);
                  return (
                    <div key={product.id} className="max-w-xs">
                      <Link href={product.href} className="text-sm font-semibold text-cyan-300 underline underline-offset-4">{product.short}</Link>
                      <p className="mt-1 text-xs leading-relaxed text-soft-mute">{product.label}</p>
                      {signals.length > 0 && <p className="mt-1 text-xs leading-relaxed text-soft-mute">Product signals: {signals.map((signal) => signal!.title).join(" · ")}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {area.architecturalProducts.length > 0 && (
            <details className="mt-5 text-xs text-soft-mute">
              <summary className="min-h-11 cursor-pointer py-3 text-soft-gray">Shared architecture · {area.architecturalProducts.length} additional modules</summary>
              <p className="mb-3 max-w-3xl leading-relaxed">These modules share platform capabilities. The publication does not directly address their applications.</p>
              <div className="flex flex-wrap gap-2">{area.architecturalProducts.map((product) => <Link key={product.id} href={product.href} className="gaitscape-chip">{product.short}</Link>)}</div>
            </details>
          )}
          {area.boundary && <p className="mt-4 max-w-3xl text-xs leading-relaxed text-soft-mute">{area.boundary.note}</p>}
        </div>
      ))}
      <Link href="/research/evidence/" className="mt-6 inline-block text-xs font-semibold text-cyan-300 underline underline-offset-4">Inspect the evidence index →</Link>
    </section>
  );
}
