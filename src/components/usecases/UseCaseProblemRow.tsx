import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { industryUseCases, productById } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";

const accentStyles: Record<string, { text: string; pill: string; rule: string }> = {
  teal: {
    text: "text-teal-300",
    pill: "border-teal-300/30 bg-teal-300/[0.08] text-teal-200",
    rule: "bg-teal-300/40",
  },
  blue: {
    text: "text-royal-300",
    pill: "border-royal-300/30 bg-royal-300/[0.08] text-royal-200",
    rule: "bg-royal-300/40",
  },
  cyan: {
    text: "text-cyan-300",
    pill: "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-200",
    rule: "bg-cyan-300/40",
  },
  violet: {
    text: "text-violet-300",
    pill: "border-violet-300/30 bg-violet-300/[0.08] text-violet-200",
    rule: "bg-violet-300/40",
  },
  gold: {
    text: "text-amber-300",
    pill: "border-amber-300/30 bg-amber-300/[0.08] text-amber-200",
    rule: "bg-amber-300/40",
  },
  emerald: {
    text: "text-emerald-300",
    pill: "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-200",
    rule: "bg-emerald-300/40",
  },
};

/**
 * Problem-led use-case row for /use-cases.
 *
 * The page answers "what problem do I have?", so each environment reads
 * Problem → GaitAI approach → relevant products → outputs, rather than
 * repeating the product cards that /mobilitycare and /securevision already
 * own. Every string comes from canonical data: the operational problem and
 * product mix from `industryUseCases`, the approach and outputs from the
 * matching `useCaseDetails` record. Product names are chips linking to the
 * product pages — never full descriptions restated here.
 */
export function UseCaseProblemRow({ caseId }: { caseId: string }) {
  const base = industryUseCases.find((c) => c.id === caseId);
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  if (!base) return null;

  const a = accentStyles[base.accent] ?? accentStyles.cyan;
  const products = base.productIds
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const href = detail ? `/use-cases/${detail.slug}/` : `/${base.vertical}/`;
  const outputs = detail?.signals.slice(0, 4) ?? [];

  return (
    <Reveal>
      <article
        id={base.id}
        className="grid gap-x-12 gap-y-6 border-t border-white/[0.08] py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
      >
        {/* Problem + approach */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className={`h-1 w-6 rounded-full ${a.rule}`} />
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${a.text}`}
            >
              {base.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision"}
            </span>
          </div>

          <h3 className="mt-3 font-display text-2xl text-soft-white sm:text-3xl">
            {base.industry}
          </h3>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                The problem
              </dt>
              <dd className="mt-1.5 max-w-prose text-sm leading-relaxed text-soft-gray">
                {base.problem}
              </dd>
            </div>
            {detail && (
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  The GaitAI approach
                </dt>
                <dd className="mt-1.5 max-w-prose text-sm leading-relaxed text-soft-gray">
                  {detail.together}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Products + outputs + CTA */}
        <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
            Relevant products
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/${p.vertical}/${p.id}/`}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:text-soft-white ${a.pill}`}
              >
                {p.short}
              </Link>
            ))}
          </div>

          {outputs.length > 0 && (
            <>
              <div className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                What it produces
              </div>
              <ul className="mt-3 space-y-1.5">
                {outputs.map((output) => (
                  <li
                    key={output}
                    className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-soft-white"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${a.rule}`}
                    />
                    {output}
                  </li>
                ))}
              </ul>
            </>
          )}

          <Link
            href={href}
            className={`mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors hover:text-soft-white ${a.text}`}
          >
            Explore {base.industry}
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </article>
    </Reveal>
  );
}
