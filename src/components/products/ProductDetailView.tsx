"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import { industryUseCases, productById } from "@/data/products";
import { productDetailBySlug, productValueProp } from "@/data/product-details";
import { useCaseDetails } from "@/data/usecase-details";
import { evidenceForProduct } from "@/data/evidence";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductEvidence } from "@/components/products/ProductEvidence";
import { EvidenceStatus } from "@/components/analytics/EvidenceStatus";
import { SampleOutputViewer } from "@/components/analytics/SampleOutputViewer";
import { hasSampleOutput } from "@/data/sample-outputs";
import { cn } from "@/lib/utils";

const familyConfig = {
  mobilitycare: {
    label: "MobilityCare",
    path: "/mobilitycare/",
    gradient: "text-gradient",
  },
  securevision: {
    label: "SecureVision",
    path: "/securevision/",
    gradient: "text-gradient-secure",
  },
} as const;

// ---------------------------------------------------------------------------
// Accent styling per product (mirrors ProductCard's accent map, detail-scale)
// ---------------------------------------------------------------------------
export const accentMap: Record<
  string,
  { text: string; pill: string; dot: string; chip: string }
> = {
  teal: {
    text: "text-teal-300",
    pill: "border-teal-300/30 bg-teal-300/8 text-teal-200",
    dot: "bg-teal-400",
    chip: "border-teal-300/25 bg-teal-300/[0.06]",
  },
  blue: {
    text: "text-royal-300",
    pill: "border-royal-300/30 bg-royal-300/8 text-royal-200",
    dot: "bg-royal-400",
    chip: "border-royal-300/25 bg-royal-300/[0.06]",
  },
  cyan: {
    text: "text-cyan-300",
    pill: "border-cyan-300/30 bg-cyan-300/8 text-cyan-200",
    dot: "bg-cyan-400",
    chip: "border-cyan-300/25 bg-cyan-300/[0.06]",
  },
  violet: {
    text: "text-violet-300",
    pill: "border-violet-300/30 bg-violet-300/8 text-violet-200",
    dot: "bg-violet-400",
    chip: "border-violet-300/25 bg-violet-300/[0.06]",
  },
  gold: {
    text: "text-amber-300",
    pill: "border-amber-300/30 bg-amber-300/8 text-amber-200",
    dot: "bg-amber-400",
    chip: "border-amber-300/25 bg-amber-300/[0.06]",
  },
  emerald: {
    text: "text-emerald-300",
    pill: "border-emerald-300/30 bg-emerald-300/8 text-emerald-200",
    dot: "bg-emerald-400",
    chip: "border-emerald-300/25 bg-emerald-300/[0.06]",
  },
};

type ViewMode = "executive" | "technical";

interface NavItem {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

export function SectionBlock({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section
        id={id}
        className="site-anchor-offset border-t border-white/5 py-10"
      >
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xs tabular-nums text-soft-mute">
            {index}
          </span>
          <h2 className="font-display text-xl font-semibold text-soft-white sm:text-2xl">
            {title}
          </h2>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </Reveal>
  );
}

export function BulletList({ items, dot }: { items: string[]; dot: string }) {
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2.5 text-sm leading-relaxed text-soft-gray"
        >
          <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Numbered vertical step list (workflows). */
export function StepList({ steps, accentText }: { steps: string[]; accentText: string }) {
  return (
    <ol className="grid gap-0">
      {steps.map((step, i) => (
        <li key={step} className="relative flex gap-4 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[13px] top-7 h-[calc(100%-1.4rem)] w-px bg-white/8"
            />
          )}
          <span
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-semibold tabular-nums",
              accentText
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="pt-1 text-sm leading-relaxed text-soft-gray">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** Architecture / pipeline flow, drawn in the existing glass visual language. */
export function PipelineDiagram({
  stages,
  accent,
}: {
  stages: string[];
  accent: { text: string; chip: string };
}) {
  return (
    <div className="card relative overflow-hidden p-6 sm:p-8">
      <div className="ring-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative flex flex-wrap items-center gap-y-3">
        {stages.map((stage, i) => (
          <span key={stage} className="flex items-center">
            <span
              className={cn(
                "rounded-xl border px-3.5 py-2 text-[12px] font-medium leading-snug text-soft-white",
                i === 0 || i === stages.length - 1
                  ? accent.chip
                  : "border-white/8 bg-white/[0.02]"
              )}
            >
              {stage}
            </span>
            {i < stages.length - 1 && (
              <ArrowRight
                aria-hidden
                className={cn("mx-2 h-3.5 w-3.5 shrink-0", accent.text)}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Null-rendering child that mirrors the ?view= search param into state.
 * useSearchParams is reactive to router navigations (including popstate).
 */
export function ViewUrlSync({ onView }: { onView: (v: string | null) => void }) {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  useEffect(() => {
    onView(view);
  }, [view, onView]);
  return null;
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export function ProductDetailView({ slug }: { slug: string }) {
  const product = productById(slug);
  const detail = productDetailBySlug(slug);

  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<ViewMode>("executive");
  const [activeSection, setActiveSection] = useState<string>("overview");

  // Deep-link + back/forward: /mobilitycare/<slug>/?view=technical.
  // The URL is the source of truth (see ViewUrlSync below); the toggle writes
  // it with router.replace so no extra history entries are created.
  const syncFromUrl = useCallback((v: string | null) => {
    setView(v === "technical" ? "technical" : "executive");
  }, []);

  const changeView = useCallback(
    (next: ViewMode) => {
      setView(next); // instant UI response
      router.replace(
        next === "executive" ? pathname : `${pathname}?view=${next}`,
        { scroll: false }
      );
    },
    [router, pathname]
  );

  // Products whose capabilities have peer-reviewed backing get a "Research
  // basis" section; the rest render none rather than a vague gesture.
  const hasEvidence = evidenceForProduct(slug).length > 0;

  /**
   * A synthetic sample output exists for eight of the modules. The rest render
   * no viewer rather than an empty offer — and evidence-status.ts reads the
   * same absence, so the "Interactive demo" row and this section can never
   * disagree.
   */
  const hasSample = hasSampleOutput(slug);

  const navItems = useMemo<NavItem[]>(() => {
    if (!detail) return [];
    const evidenceItem: NavItem[] = hasEvidence
      ? [{ id: "evidence", label: "Research basis" }]
      : [];
    const sampleItem: NavItem[] = hasSample
      ? [{ id: "sample", label: "Sample output" }]
      : [];

    if (view === "executive") {
      return [
        { id: "overview", label: "Overview" },
        { id: "problem", label: "Problem" },
        { id: "solution", label: "What GaitAI does" },
        { id: "who", label: "Who it's for" },
        { id: "outputs", label: "Outputs" },
        { id: "why", label: "Why it matters" },
        { id: "workflow", label: "Workflow" },
        { id: "deployment", label: "Deployment" },
        ...evidenceItem,
        { id: "evidence-status", label: "Evidence status" },
        ...sampleItem,
        { id: "privacy", label: "Privacy" },
        { id: "related", label: "Related products" },
        { id: "pilot", label: "Pilot" },
      ];
    }
    const items: NavItem[] = [
      { id: "overview", label: "Overview" },
      { id: "system", label: "System overview" },
      { id: "inputs", label: "Input modalities" },
      { id: "architecture", label: "Architecture" },
      { id: "features", label: "Gait features" },
      { id: "models", label: "Models" },
      { id: "schema", label: "Output schema" },
    ];
    if (detail.tech.longitudinal)
      items.push({ id: "longitudinal", label: "Longitudinal" });
    items.push(
      { id: "quality", label: "Quality checks" },
      ...evidenceItem,
      { id: "evidence-status", label: "Evidence status" },
      ...sampleItem,
      { id: "privacy", label: "Privacy" },
      { id: "integration", label: "Integration" },
      { id: "limitations", label: "Limitations" },
      { id: "related", label: "Related products" },
      { id: "pilot", label: "Pilot" }
    );
    return items;
  }, [detail, view, hasEvidence, hasSample]);

  /**
   * Section numbers are derived from the contents order rather than hardcoded,
   * so an optional section (Longitudinal, Research basis) can appear or not
   * without any index drifting out of step with the navigator.
   */
  const sectionIndex = useCallback(
    (id: string) => {
      const position = navItems.findIndex((item) => item.id === id);
      return position < 0 ? "" : String(position).padStart(2, "0");
    },
    [navItems]
  );

  // Scrollspy for the contents navigator
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

  if (!product || !detail) return null;

  const a = accentMap[product.accent] ?? accentMap.cyan;
  const family = familyConfig[product.vertical];
  const related = detail.related
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  // Deployment environments that recommend this product in their mix.
  const environments = useCaseDetails
    .filter((uc) => {
      const base = industryUseCases.find((c) => c.id === uc.caseId);
      return base?.productIds.includes(product.id) ?? false;
    })
    .slice(0, 3);

  return (
    <article className="relative w-full pb-24">
      {/* Reads ?view= reactively; isolated in Suspense so useSearchParams
          does not bail the statically exported page out of the HTML. */}
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
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-soft-mute"
          >
            <Link
              href={family.path}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-soft-white"
            >
              <ArrowLeft className="h-3 w-3" />
              {family.label}
            </Link>
            <ChevronRight aria-hidden className="h-3 w-3 opacity-60" />
            <span className="text-soft-gray">{product.short}</span>
          </nav>

          <div className={cn("eyebrow mt-8", a.text)}>
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            GaitAI · {family.label}
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-display-xl text-balance text-soft-white">
            {product.name}
          </h1>
          <p className="mt-4 max-w-2xl font-display text-xl leading-snug text-soft-gray sm:text-2xl">
            {productValueProp(detail.slug)}
          </p>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-soft-gray">
            {detail.overview}
          </p>

          {/* Environment tags */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {detail.environments.map((env) => (
              <span
                key={env}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[10.5px] font-medium",
                  a.pill
                )}
              >
                {env}
              </span>
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

          {/* At a glance */}
          <div className="mt-12 grid gap-2 sm:grid-cols-4">
            {(
              [
                ["Input", detail.glance.input],
                ["Analysis", detail.glance.analysis],
                ["Output", detail.glance.output],
                ["User", detail.glance.user],
              ] as const
            ).map(([label, value], i) => (
              <div
                key={label}
                className="relative rounded-xl border border-white/8 bg-white/[0.02] p-4"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  {label}
                </div>
                <div className="mt-1.5 text-sm font-medium text-soft-white">
                  {value}
                </div>
                {i < 3 && (
                  <ArrowRight
                    aria-hidden
                    className={cn(
                      "absolute -right-[13px] top-1/2 z-10 hidden h-3.5 w-3.5 -translate-y-1/2 sm:block",
                      a.text
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ BODY */}
      <div className="container-wide">
        {/* View toggle */}
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
          {/* ------------------------------ Sections */}
          <div className="min-w-0 max-w-3xl">
            {view === "executive" ? (
              <>
                <SectionBlock id="problem" index={sectionIndex("problem")} title="Problem">
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {detail.problem}
                  </p>
                </SectionBlock>

                <SectionBlock
                  id="solution"
                  index={sectionIndex("solution")}
                  title="What GaitAI does"
                >
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {detail.solution}
                  </p>
                </SectionBlock>

                <SectionBlock id="who" index={sectionIndex("who")} title="Who uses it">
                  <BulletList items={detail.whoFor} dot={a.dot} />
                </SectionBlock>

                <SectionBlock
                  id="outputs"
                  index={sectionIndex("outputs")}
                  title="What they receive"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {detail.receives.map((o) => (
                      <span
                        key={o}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                          a.pill
                        )}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {detail.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl border border-white/8 bg-white/[0.02] p-3.5"
                      >
                        <div
                          className={cn(
                            "font-display text-lg font-semibold",
                            a.text
                          )}
                        >
                          {m.value}
                        </div>
                        <div className="mt-1 text-[10.5px] leading-snug text-soft-mute">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-soft-mute">
                    Example report values — illustrative, not measured
                    performance claims.
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-soft-gray">
                    {detail.interpretation}
                  </p>
                </SectionBlock>

                <SectionBlock
                  id="why"
                  index={sectionIndex("why")}
                  title="Why it matters"
                >
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {detail.whyItMatters}
                  </p>
                </SectionBlock>

                <SectionBlock
                  id="workflow"
                  index={sectionIndex("workflow")}
                  title="Example workflow"
                >
                  <StepList steps={detail.workflow} accentText={a.text} />
                </SectionBlock>

                <SectionBlock
                  id="deployment"
                  index={sectionIndex("deployment")}
                  title="Deployment"
                >
                  <BulletList items={detail.deployment} dot={a.dot} />
                </SectionBlock>
              </>
            ) : (
              <>
                <SectionBlock
                  id="system"
                  index={sectionIndex("system")}
                  title="System overview"
                >
                  <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                    {detail.tech.systemOverview}
                  </p>
                </SectionBlock>

                <SectionBlock
                  id="inputs"
                  index={sectionIndex("inputs")}
                  title="Input modalities"
                >
                  <BulletList items={detail.tech.inputs} dot={a.dot} />
                </SectionBlock>

                <SectionBlock
                  id="architecture"
                  index={sectionIndex("architecture")}
                  title="Processing pipeline"
                >
                  <PipelineDiagram stages={detail.tech.pipeline} accent={a} />
                </SectionBlock>

                <SectionBlock
                  id="features"
                  index={sectionIndex("features")}
                  title="Movement & gait features"
                >
                  <BulletList items={detail.tech.features} dot={a.dot} />
                </SectionBlock>

                <SectionBlock
                  id="models"
                  index={sectionIndex("models")}
                  title="Models & analytical components"
                >
                  <BulletList items={detail.tech.models} dot={a.dot} />
                </SectionBlock>

                <SectionBlock
                  id="schema"
                  index={sectionIndex("schema")}
                  title="Output schema"
                >
                  <div className="overflow-x-auto rounded-xl border border-white/8">
                    <table className="w-full min-w-[420px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/[0.02]">
                          <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                            Field
                          </th>
                          <th className="px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.tech.outputSchema.map((row) => (
                          <tr
                            key={row.field}
                            className="border-b border-white/5 last:border-0"
                          >
                            <td
                              className={cn(
                                "whitespace-nowrap px-4 py-2.5 font-mono text-[12px]",
                                a.text
                              )}
                            >
                              {row.field}
                            </td>
                            <td className="px-4 py-2.5 text-[13px] text-soft-gray">
                              {row.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionBlock>

                {detail.tech.longitudinal && (
                  <SectionBlock
                    id="longitudinal"
                    index={sectionIndex("longitudinal")}
                    title="Longitudinal analysis"
                  >
                    <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
                      {detail.tech.longitudinal}
                    </p>
                  </SectionBlock>
                )}

                <SectionBlock
                  id="quality"
                  index={sectionIndex("quality")}
                  title="Quality & confidence checks"
                >
                  <BulletList items={detail.tech.quality} dot={a.dot} />
                </SectionBlock>
              </>
            )}

            {/* Shared: research basis — only where published work backs the
                capabilities this product is built on. */}
            {hasEvidence && (
              <SectionBlock
                id="evidence"
                index={sectionIndex("evidence")}
                title="Research basis"
              >
                <ProductEvidence productId={slug} accentText={a.text} />
              </SectionBlock>
            )}

            {/* Shared: how far the evidence goes. Rendered for EVERY module,
                including those with no research foundation — the panel's job
                is to state the position, and "not yet published" is a
                position. Every row is derived; see data/evidence-status.ts. */}
            <SectionBlock
              id="evidence-status"
              index={sectionIndex("evidence-status")}
              title="Evidence status"
            >
              <EvidenceStatus productId={slug} />
            </SectionBlock>

            {/* Shared: the module's own output, on synthetic data. Collapsed
                by default; the viewer always renders its own label. */}
            {hasSample && (
              <SectionBlock
                id="sample"
                index={sectionIndex("sample")}
                title="Sample output"
              >
                <SampleOutputViewer productId={slug} family={product.vertical} />
              </SectionBlock>
            )}

            {/* Shared: privacy */}
            <SectionBlock
              id="privacy"
              index={sectionIndex("privacy")}
              title="Privacy & responsible use"
            >
              <div className="card relative overflow-hidden p-6">
                <p className="relative text-sm leading-relaxed text-soft-gray">
                  {detail.privacy}
                </p>
              </div>
            </SectionBlock>

            {view === "technical" && (
              <>
                <SectionBlock
                  id="integration"
                  index={sectionIndex("integration")}
                  title="Integration & deployment"
                >
                  <BulletList items={detail.tech.integration} dot={a.dot} />
                </SectionBlock>

                <SectionBlock
                  id="limitations"
                  index={sectionIndex("limitations")}
                  title="Technical limitations"
                >
                  <BulletList items={detail.tech.limitations} dot={a.dot} />
                </SectionBlock>
              </>
            )}
          </div>

          {/* ------------------------------ Contents navigator */}
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
                      <span className="tabular-nums text-[10px] opacity-70">
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

        {/* ------------------------------ Related products */}
        <Reveal>
          <section
            id="related"
            className="site-anchor-offset border-t border-white/5 pt-14"
          >
            <div className="mt-10 flex items-end justify-between gap-6">
              <h2 className="font-display text-2xl text-soft-white sm:text-3xl">
                Related{" "}
                <span className={family.gradient}>{family.label}</span>{" "}
                products
              </h2>
              <Link
                href={family.path}
                className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-soft-mute transition-colors hover:text-soft-white sm:inline-flex"
              >
                All products
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} compact />
              ))}
            </div>

            {environments.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-soft-mute">
                  Related deployment environments
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {environments.map((uc) => {
                    const base = industryUseCases.find(
                      (c) => c.id === uc.caseId
                    );
                    return (
                      <Link
                        key={uc.slug}
                        href={`/use-cases/${uc.slug}/`}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors hover:text-soft-white",
                          a.pill
                        )}
                      >
                        {base?.industry ?? uc.slug}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </Reveal>

        {/* ------------------------------ CTA */}
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
                    GaitAI · {product.short}
                  </span>
                  <h2 className="mt-5 font-display text-display-md text-balance text-soft-white">
                    {detail.ctaLabel} with your team.
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/#contact" className="btn-primary">
                    {detail.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={family.path} className="btn-ghost">
                    Back to {family.label}
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
