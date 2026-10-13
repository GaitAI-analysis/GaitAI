import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { industryUseCases, productById, type Vertical } from "@/data/products";
/* Aliased: the data helper's `use` prefix trips the rules-of-hooks lint
   when it is called inside the list callback below, and it is not a hook. */
import { useCaseHrefById as environmentHref } from "@/data/usecase-details";

/**
 * IN PLAIN TERMS — the section that says what a product family does in the
 * words a buyer types into a search box.
 * =============================================================================
 * The suite pages describe SecureVision and MobilityCare in the platform's
 * own vocabulary ("privacy-aware movement intelligence", "longitudinal
 * care"). A security manager searches for "AI CCTV analytics" and a
 * physiotherapist for "gait analysis software", and neither phrase appeared
 * on the page that answers it. This section bridges the two: each entry is
 * the everyday name for a capability, one honest paragraph on what GaitAI
 * does about it, and links to the modules and environments that back the
 * claim — so the explanation is also the page's internal map.
 *
 * SERVER-RENDERED, STATIC, NO MOTION. It exists to be read by a crawler and
 * by a visitor who skims, so it is plain markup: a definition list, every
 * link a real route. Module and environment names are resolved from the
 * registry, never typed, so a renamed module cannot leave a stale name here.
 *
 * NOTHING IS ASSERTED THAT THE MODULE RECORDS DO NOT CARRY. The paragraphs
 * paraphrase `description` fields from data/products.ts and the governance
 * language already on the page; no accuracy figure, certification, customer
 * or approval is claimed.
 */

export interface PlainTerm {
  /** The everyday phrase — what the capability is called outside GaitAI. */
  term: string;
  /** What GaitAI does about it, in one paragraph. */
  body: string;
  /** Module ids from data/products.ts that deliver it. */
  modules: string[];
  /** `industryUseCases` ids where it is deployed. */
  environments?: string[];
}

const FAMILY = {
  securevision: {
    chip: "border-royal-300/30 bg-royal-300/8 text-royal-200 hover:border-royal-300/60 hover:bg-royal-300/15",
    env: "text-royal-300 hover:text-royal-200",
    hover: "hover:border-royal-300/30",
  },
  mobilitycare: {
    chip: "border-teal-300/30 bg-teal-300/8 text-teal-200 hover:border-teal-300/60 hover:bg-teal-300/15",
    env: "text-teal-300 hover:text-teal-200",
    hover: "hover:border-teal-300/30",
  },
} as const;

export function InPlainTerms({
  id,
  family,
  eyebrow,
  title,
  description,
  terms,
}: {
  id: string;
  family: Vertical;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  terms: PlainTerm[];
}) {
  const tone = FAMILY[family];
  return (
    <section id={id} className="section site-anchor-offset" aria-labelledby={`${id}-title`}>
      <div className="container-wide">
        <SectionHeading
          eyebrow={eyebrow}
          title={<span id={`${id}-title`}>{title}</span>}
          description={description}
          align="left"
          size="lg"
        />
        <dl className="mt-12 grid gap-4 md:grid-cols-2">
          {terms.map((entry) => {
            const modules = entry.modules
              .map((moduleId) => productById(moduleId))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            const environments = (entry.environments ?? [])
              .map((caseId) => industryUseCases.find((c) => c.id === caseId))
              .filter((c): c is NonNullable<typeof c> => Boolean(c));
            return (
              <div
                key={entry.term}
                className={`relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-colors ${tone.hover}`}
              >
                <dt className="font-display text-xl text-soft-white">{entry.term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-soft-gray">{entry.body}</dd>
                {modules.length > 0 && (
                  <dd className="mt-4">
                    <span className="sr-only">Modules: </span>
                    <ul className="flex flex-wrap gap-1.5">
                      {modules.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/${p.vertical}/${p.id}/`}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${tone.chip}`}
                            title={p.label}
                          >
                            {p.short}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </dd>
                )}
                {environments.length > 0 && (
                  <dd className="mt-4 text-[12.5px] leading-relaxed text-soft-mute">
                    Deployed in{" "}
                    {environments.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && (i === environments.length - 1 ? " and " : ", ")}
                        <Link
                          href={environmentHref(c.id)}
                          className={`inline-flex items-center gap-0.5 font-medium underline decoration-white/20 underline-offset-2 transition-colors ${tone.env}`}
                        >
                          {c.industry.toLowerCase()}
                          <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                        </Link>
                      </span>
                    ))}
                    .
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
