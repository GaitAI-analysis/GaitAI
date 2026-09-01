"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { industryUseCases, productById } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
import { Reveal } from "@/components/ui/Reveal";

const accentStyles: Record<
  string,
  { text: string; pill: string; border: string }
> = {
  teal: {
    text: "text-teal-300",
    pill: "border-teal-300/30 bg-teal-300/8 text-teal-200",
    border: "hover:border-teal-300/40",
  },
  blue: {
    text: "text-royal-300",
    pill: "border-royal-300/30 bg-royal-300/8 text-royal-200",
    border: "hover:border-royal-300/40",
  },
  cyan: {
    text: "text-cyan-300",
    pill: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
    border: "hover:border-cyan-300/40",
  },
  violet: {
    text: "text-violet-300",
    pill: "border-violet-300/30 bg-violet-300/8 text-violet-200",
    border: "hover:border-violet-300/40",
  },
  gold: {
    text: "text-amber-300",
    pill: "border-amber-300/30 bg-amber-300/8 text-amber-200",
    border: "hover:border-amber-300/40",
  },
  emerald: {
    text: "text-emerald-300",
    pill: "border-emerald-300/30 bg-emerald-300/8 text-emerald-200",
    border: "hover:border-emerald-300/40",
  },
};

/**
 * Use-case card for /use-cases. The whole card opens the deployment detail
 * page (Enter natively, Space handled explicitly); the product chips remain
 * independent links to their own product pages, layered above the stretched
 * link so they never accidentally open the card.
 */
export function UseCaseCard({
  caseId,
  delay = 0,
}: {
  caseId: string;
  delay?: number;
}) {
  const u = industryUseCases.find((c) => c.id === caseId);
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  if (!u) return null;

  const a = accentStyles[u.accent];
  const products = u.productIds
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const href = detail ? `/use-cases/${detail.slug}/` : `/${u.vertical}/`;

  return (
    <Reveal delay={delay} className="h-full">
      <div
        id={u.id}
        className={`group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-[border-color,background-color,box-shadow,transform] duration-300 ${a.border} hover:-translate-y-[3px] hover:bg-white/[0.04] hover:shadow-[0_16px_40px_-20px_rgba(79,209,255,0.28)] focus-within:border-cyan-300/40`}
      >
        {/* Whole-card link (stretched). */}
        <Link
          href={href}
          aria-label={`Explore ${u.industry} deployment`}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
        >
          <span className="sr-only">Explore {u.industry} deployment</span>
        </Link>

        <span
          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${a.pill}`}
        >
          {u.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision"}
        </span>

        <h3 className="mt-4 font-display text-xl text-soft-white">
          {u.industry}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-soft-mute">
          {u.problem}
        </p>

        {/* Product chips stay independently clickable above the overlay. */}
        <div className="relative z-20 mt-4 flex flex-wrap gap-1.5">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/${p.vertical}/${p.id}/`}
              className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors hover:text-soft-white ${a.pill}`}
            >
              {p.short}
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
            Outcome
          </div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-soft-white">
            {u.outcome}
          </div>
        </div>

        <div
          aria-hidden
          className={`mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${a.text} opacity-60 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100`}
        >
          Explore deployment
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Reveal>
  );
}
