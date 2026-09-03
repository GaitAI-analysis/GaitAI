"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { industryUseCases, productById } from "@/data/products";
import { useCaseDetails, getUseCaseDetail } from "@/data/usecase-details";
import {
  accentMap,
  BulletList,
  PipelineDiagram,
  SectionBlock,
  StepList,
  ViewUrlSync,
} from "@/components/products/ProductDetailView";
import { ProductCard } from "@/components/products/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type ViewMode = "executive" | "technical";

const familyConfig = {
  mobilitycare: {
    label: "MobilityCare",
    eyebrow: "GaitAI · Application environment",
    gradient: "text-gradient",
  },
  securevision: {
    label: "SecureVision",
    eyebrow: "GaitAI · Application environment",
    gradient: "text-gradient-secure",
  },
} as const;

export function UseCaseDetailView({ slug }: { slug: string }) {
  const detail = getUseCaseDetail(slug);
  const base = industryUseCases.find((c) => c.id === detail?.caseId);

  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<ViewMode>("executive");
  const [activeSection, setActiveSection] = useState<string>("overview");

  const syncFromUrl = useCallback((v: string | null) => {
    setView(v === "technical" ? "technical" : "executive");
  }, []);

  const changeView = useCallback(
    (next: ViewMode) => {
      setView(next);
      router.replace(
        next === "executive" ? pathname : `${pathname}?view=${next}`,
        { scroll: false }
      );
    },
    [router, pathname]
  );

  const navItems = useMemo(() => {
    if (view === "executive") {
      return [
        { id: "overview", label: "Overview" },
        { id: "problem", label: "Operational problem" },
        { id: "shortfall", label: "Why workflows fall short" },
        { id: "mix", label: "Product mix" },
        { id: "workflow", label: "Example workflow" },
        { id: "outcome", label: "Expected outputs" },
        { id: "privacy", label: "Privacy" },
        { id: "related", label: "Related use cases" },
        { id: "pilot", label: "Pilot" },
      ];
    }
    return [
      { id: "overview", label: "Overview" },
      { id: "together", label: "How products work together" },
      { id: "pipeline", label: "Combined pipeline" },
      { id: "signals", label: "Signals & outputs" },
      { id: "deployment", label: "Deployment configuration" },
      { id: "privacy", label: "Privacy" },
      { id: "related", label: "Related use cases" },
      { id: "pilot", label: "Pilot" },
    ];
  }, [view]);

  useEffect(() => {
    const sections = navItems
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navItems]);

  if (!detail || !base) return null;

  const a = accentMap[base.accent] ?? accentMap.cyan;
  const family = familyConfig[detail.family];
  const products = base.productIds
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const related = detail.related
    .map((s) => useCaseDetails.find((d) => d.slug === s))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  // Combined pipeline: the recommended products as one deployment chain.
  const combinedPipeline = [
    "Capture / streams",
    ...products.map((p) => p.short),
    "Dashboards + reports",
    "Team acts",
  ];

  return (
    <article className="relative w-full pb-24">
      <Suspense fallback={null}>
        <ViewUrlSync onView={syncFromUrl} />
      </Suspense>

      {/* ------------------------------------------------ HERO */}
      <header
        id="overview"
        className="site-page-intro-compact site-anchor-offset relative isolate overflow-hidden pb-14 sm:pb-16"
      >
        <div className="ring-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-obsidian/30 via-obsidian/60 to-obsidian" />
        <div className="container-wide relative">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-soft-mute"
          >
            <Link
              href="/use-cases/"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-soft-white"
            >
              <ArrowLeft className="h-3 w-3" />
              Use Cases
            </Link>
            <ChevronRight aria-hidden className="h-3 w-3 opacity-60" />
            <span className="text-soft-gray">{base.industry}</span>
          </nav>

          <div className={cn("eyebrow mt-8", a.text)}>
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            {family.eyebrow}
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-display-xl text-balance text-soft-white">
            {base.industry}
          </h1>
          <p className="mt-4 max-w-2xl font-display text-xl leading-snug text-soft-gray sm:text-2xl">
            {detail.valueProp}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            {detail.overview}
          </p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em]",
                a.pill
              )}
            >
              {family.label}
            </span>
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/${p.vertical}/${p.id}/`}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10.5px] font-medium transition-colors hover:text-soft-white",
                  a.pill
                )}
              >
                {p.short}
              </Link>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/#contact" className="btn-primary">
              Request a pilot
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() =>
                changeView(view === "technical" ? "executive" : "technical")
              }
              className="btn-ghost"
            >
              {view === "technical" ? "Executive view" : "Technical view"}
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ BODY */}
      <div className="container-wide">
        <div
          role="tablist"
          aria-label="Detail view"
          className="glass inline-flex rounded-full p-1"
        >
          {(
            [
              ["executive", "Executive View"],
              ["technical", "Technical View"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={view === mode}
              onClick={() => changeView(mode)}
              className={cn(
                "rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all",
                view === mode
                  ? "bg-white/[0.08] text-soft-white shadow-[0_0_20px_-6px_rgba(79,209,255,0.45)]"
                  : "text-soft-mute hover:text-soft-gray"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0 max-w-3xl">
            {view === "executive" ? (
              <>
                <SectionBlock id="problem" index="01" title="The operational problem">
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {base.problem}
                  </p>
                </SectionBlock>

                <SectionBlock
                  id="shortfall"
                  index="02"
                  title="Why current workflows fall short"
                >
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {detail.shortfall}
                  </p>
                </SectionBlock>

                <SectionBlock
                  id="mix"
                  index="03"
                  title="Recommended GaitAI product mix"
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.map((p, i) => (
                      <ProductCard key={p.id} product={p} index={i} compact />
                    ))}
                  </div>
                </SectionBlock>

                <SectionBlock id="workflow" index="04" title="Example workflow">
                  <StepList steps={detail.workflow} accentText={a.text} />
                </SectionBlock>

                <SectionBlock
                  id="outcome"
                  index="05"
                  title="Expected operational outputs"
                >
                  <div className="card relative overflow-hidden p-6">
                    <p className="relative text-sm leading-relaxed text-soft-white sm:text-base">
                      {detail.outcome}
                    </p>
                  </div>
                </SectionBlock>
              </>
            ) : (
              <>
                <SectionBlock
                  id="together"
                  index="01"
                  title="How the products work together"
                >
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {detail.together}
                  </p>
                </SectionBlock>

                <SectionBlock id="pipeline" index="02" title="Combined pipeline">
                  <PipelineDiagram stages={combinedPipeline} accent={a} />
                </SectionBlock>

                <SectionBlock id="signals" index="03" title="Signals & outputs">
                  <BulletList items={detail.signals} dot={a.dot} />
                </SectionBlock>

                <SectionBlock
                  id="deployment"
                  index="04"
                  title="Deployment configuration"
                >
                  <BulletList items={detail.deployment} dot={a.dot} />
                </SectionBlock>
              </>
            )}

            <SectionBlock
              id="privacy"
              index={view === "executive" ? "06" : "05"}
              title="Privacy & responsible use"
            >
              <div className="card relative overflow-hidden p-6">
                <p className="relative text-sm leading-relaxed text-soft-gray">
                  {detail.privacy}
                </p>
                <div className="relative mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/[0.06] pt-4">
                  <Link
                    href="/legal/security"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    Privacy &amp; security controls
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/research#areas"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition-colors hover:text-cyan-200"
                  >
                    Research basis
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </SectionBlock>
          </div>

          {/* Contents navigator */}
          <aside className="hidden lg:block">
            <nav
              aria-label="On this page"
              className="site-sticky-below-header border-l border-white/8 pl-5"
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
                Contents
              </div>
              <ul className="mt-4 space-y-2.5">
                {navItems.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={cn(
                        "flex items-baseline gap-2 text-xs transition-colors",
                        activeSection === item.id
                          ? cn("font-medium", a.text)
                          : "text-soft-mute hover:text-soft-gray"
                      )}
                    >
                      <span aria-hidden="true" className="tabular-nums text-[10px] opacity-70">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>

        {/* ------------------------------------------------ Related use cases */}
        <Reveal>
          <section
            id="related"
            className="site-anchor-offset border-t border-white/5 pt-14"
          >
            <div className="mt-10 flex items-end justify-between gap-6">
              <h2 className="font-display text-2xl text-soft-white sm:text-3xl">
                Related <span className={family.gradient}>use cases</span>
              </h2>
              <Link
                href="/use-cases/"
                className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-mute transition-colors hover:text-soft-white sm:inline-flex"
              >
                All use cases
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => {
                const rBase = industryUseCases.find((c) => c.id === r.caseId);
                const rA = accentMap[rBase?.accent ?? "cyan"] ?? accentMap.cyan;
                return (
                  <div
                    key={r.slug}
                    className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-6 transition-[border-color,background-color,box-shadow] duration-300 hover:border-cyan-300/30 hover:bg-white/[0.04] focus-within:border-cyan-300/40"
                  >
                    <Link
                      href={`/use-cases/${r.slug}/`}
                      aria-label={`Explore ${rBase?.industry ?? r.slug} deployment`}
                      className="absolute inset-0 z-10 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300/70"
                      onKeyDown={(e) => {
                        if (e.key === " ") {
                          e.preventDefault();
                          e.currentTarget.click();
                        }
                      }}
                    >
                      <span className="sr-only">
                        Explore {rBase?.industry ?? r.slug}
                      </span>
                    </Link>
                    <div
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-[0.18em]",
                        rA.text
                      )}
                    >
                      GaitAI · Application environment
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-soft-white">
                      {rBase?.industry ?? r.slug}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-soft-mute">
                      {r.valueProp}
                    </p>
                    <div
                      aria-hidden
                      className={cn(
                        "mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60 transition-opacity duration-300 group-hover:opacity-100",
                        rA.text
                      )}
                    >
                      Explore deployment
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>

        {/* ------------------------------------------------ CTA */}
        <Reveal>
          <section id="pilot" className="site-anchor-offset mt-20">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14">
              <div
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-3xl"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(79,209,255,0.22), transparent 70%)",
                }}
              />
              <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
                <div>
                  <span className="eyebrow">
                    <span className="h-1 w-6 rounded-full bg-gradient-brand" />
                    GaitAI · {base.industry}
                  </span>
                  <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                    Pilot this deployment with your team.
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/#contact" className="btn-primary">
                    Request a pilot
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/use-cases/" className="btn-ghost">
                    All use cases
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>
    </article>
  );
}
