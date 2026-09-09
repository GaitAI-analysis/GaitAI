"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BookOpenCheck, Compass, MousePointerClick, ThumbsUp, Waypoints } from "lucide-react";
import { insightArticles } from "@/data/insights";
import { articleExperiences } from "@/data/insight-experiences";
import { FOUNDATIONS_SERIES, INSIGHT_SERIES, seriesByName } from "@/data/insight-series";
import { INSIGHT_PIPELINE } from "@/data/insight-pipeline";
import {
  aggregateInsightCounts,
  breakdown,
  eventTotal,
  eventWith,
  fetchInsightCounts,
  periodStart,
  share,
  siteTotal,
  type InsightAggregate,
  type InsightCountDoc,
  type Period,
} from "@/lib/insight-analytics-read";
import { EmptyState, StatCard } from "./ui";

/**
 * INSIGHTS ANALYTICS — what readers did with the Blog, as counts.
 *
 * Reads `insightEventCounts` (admin-only) and shows aggregates: opens, how far
 * stories were read, whether the interactive figures were started and
 * finished, where readers went next, and whether they said a story helped.
 * Every number is a sum of the day × article × event counters the sink
 * writes; there is no per-reader row anywhere to drill into, by design.
 *
 * Empty is a real state. Until the first counter lands — or when the rules
 * for the collection have not been deployed — the view says so instead of
 * drawing zeros as if they were measurements.
 */

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: "all", label: "All time" },
];

const EMPTY = "No analytics recorded for this period yet.";

/** Human labels for the closed dimension vocabularies. */
const DIMENSION_LABEL: Record<string, Record<string, string>> = {
  reading_mode_changed: { read: "Read", essentials: "Essentials", story: "Visual story" },
  next_story_clicked: { bridge: "Series bridge", series: "Series list", related: "Related", selector: "Foundations selector", cover: "Cover story" },
  article_helpful_reason: { "too-technical": "Too technical", "visual-unclear": "Visual unclear", "more-examples": "Wanted more examples", other: "Other" },
  time_to_first: { "0-2s": "0–2 s", "2-5s": "2–5 s", "5-10s": "5–10 s", ">10s": "over 10 s", "-10s": "over 10 s" },
  research_opened: { publications: "Publications", research: "Research", lab: "Movement Lab" },
  ask_gaitai_article_opened: { current: "From a section", none: "From the article" },
  insight_impression: { hub: "Hub card", cover: "Cover story", series: "Series list", related: "Related", explorer: "Foundations explorer" },
};

const labelFor = (event: string, dimension: string) => DIMENSION_LABEL[event]?.[dimension] ?? dimension.replace(/-/g, " ");

/** The figure-specific interaction events, and the article each belongs to. */
const FIGURE_EVENTS: Array<{ event: string; title: string; slug: string }> = [
  { event: "pipeline_stage_changed", title: "Pipeline stage reached", slug: "from-walking-video-to-movement-intelligence" },
  { event: "motion_dna_branch_selected", title: "Motion DNA branch selected", slug: "your-walk-is-more-than-a-biometric" },
  { event: "privacy_stage_selected", title: "Privacy stage selected", slug: "movement-intelligence-without-identification" },
  { event: "trend_assessment_added", title: "Trend assessments added", slug: "fall-risk-is-a-trend-not-a-number" },
  { event: "fusion_stream_changed", title: "Fusion stream state", slug: "when-fusion-looks-better-than-it-is" },
  { event: "pose_issue_selected", title: "Pose issue selected", slug: "when-pose-estimation-lies" },
  { event: "pose_view_toggled", title: "AI view / original frame", slug: "when-pose-estimation-lies" },
  { event: "symmetry_adjusted", title: "Symmetry state reached", slug: "what-does-gait-symmetry-actually-mean" },
  { event: "camera_angle_changed", title: "Camera angle bucket", slug: "camera-angle-changes-what-ai-sees" },
  { event: "privacy_representation_changed", title: "Representation chosen", slug: "can-a-skeleton-still-reveal-identity" },
  { event: "system_component_failed", title: "Chain link broken", slug: "a-good-model-can-still-be-a-bad-system" },
  { event: "baseline_mode_changed", title: "Reference chosen", slug: "what-is-a-personal-movement-baseline" },
];

export function InsightsAnalyticsView() {
  const [period, setPeriod] = useState<Period>(30);
  const [docs, setDocs] = useState<InsightCountDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* One fetch per period; "all" is the superset, so it is fetched once and
     narrower periods are folded from it in memory. */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchInsightCounts(null)
      .then((rows) => {
        if (!alive) return;
        setDocs(rows);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const code = typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : "";
        setError(
          code === "permission-denied"
            ? "Could not read insightEventCounts: the Firestore rules for this collection have not been deployed, or this account is not on the admin allowlist. Run npm run deploy:rules."
            : "Could not read insightEventCounts. Check the connection and try again.",
        );
        setDocs([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const aggregate = useMemo(() => aggregateInsightCounts(docs ?? [], periodStart(period)), [docs, period]);
  const empty = aggregate.total === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-soft-white">Insights analytics</h2>
          <p className="mt-1 max-w-2xl text-[12.5px] text-soft-mute">
            Aggregate counts from <code>insightEventCounts</code>: one number per day, story and event. Nothing here is a
            reader, a session or a device; readers with Do Not Track are not counted at all.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-white/[0.03] p-1 ring-1 ring-white/10" role="radiogroup" aria-label="Period">
          {PERIODS.map((item) => (
            <button
              key={String(item.value)}
              type="button"
              role="radio"
              aria-checked={period === item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                period === item.value ? "bg-cyan-300/[0.12] text-cyan-200 ring-1 ring-cyan-300/30" : "text-soft-mute hover:text-soft-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="rounded-xl border border-amber-300/20 bg-amber-300/[0.05] px-4 py-3 text-[12.5px] text-amber-200/90">{error}</p>}

      {loading && docs === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : empty ? (
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title={EMPTY}
          body="Counts appear here once readers open stories and use the figures. Nothing is invented in the meantime."
        />
      ) : (
        <>
          <Overview aggregate={aggregate} />
          <ArticleTable aggregate={aggregate} />
          <div className="grid gap-6 xl:grid-cols-2">
            <FigureTable aggregate={aggregate} />
            <TimeToFirst aggregate={aggregate} />
          </div>
          <FoundationsFunnel aggregate={aggregate} />
          <div className="grid gap-6 xl:grid-cols-2">
            <InteractionBreakdowns aggregate={aggregate} />
            <Destinations aggregate={aggregate} />
          </div>
          <Feedback aggregate={aggregate} />
        </>
      )}

      <Pipeline />
    </div>
  );
}

/* ── overview cards ─────────────────────────────────────────────────────── */

function Overview({ aggregate }: { aggregate: InsightAggregate }) {
  const opens = siteTotal(aggregate, "insight_open");
  const read75 = siteTotal(aggregate, "article_scroll_75");
  const starts = siteTotal(aggregate, "interactive_figure_start");
  const completes = siteTotal(aggregate, "interactive_figure_complete");
  const next = siteTotal(aggregate, "next_story_clicked");
  const yes = siteTotal(aggregate, "article_helpful_yes");
  const no = siteTotal(aggregate, "article_helpful_no");
  const helpful = share(yes, yes + no);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard icon={<BookOpenCheck className="h-4 w-4" />} label="Story opens" value={fmt(opens)} hint={`${aggregate.days} ${aggregate.days === 1 ? "day" : "days"} with activity`} tone="cyan" />
      <StatCard icon={<Activity className="h-4 w-4" />} label="Read to 75%" value={fmt(read75)} hint={pct(share(read75, opens), "of opens")} tone="emerald" />
      <StatCard icon={<MousePointerClick className="h-4 w-4" />} label="Figures started" value={fmt(starts)} hint={pct(share(starts, opens), "of opens")} tone="violet" />
      <StatCard icon={<Waypoints className="h-4 w-4" />} label="Figures completed" value={fmt(completes)} hint={pct(share(completes, starts), "of starts")} tone="violet" />
      <StatCard icon={<Compass className="h-4 w-4" />} label="Next story clicks" value={fmt(next)} hint={pct(share(next, opens), "of opens")} tone="cyan" />
      <StatCard icon={<ThumbsUp className="h-4 w-4" />} label="Found it helpful" value={helpful === null ? "—" : `${helpful}%`} hint={yes + no > 0 ? `${fmt(yes + no)} answers` : "No answers yet"} tone="amber" />
    </div>
  );
}

/* ── per-article table ──────────────────────────────────────────────────── */

function ArticleTable({ aggregate }: { aggregate: InsightAggregate }) {
  const rows = insightArticles
    .map((article) => {
      const counts = aggregate.byArticle[article.slug];
      const opens = eventTotal(counts, "insight_open");
      const yes = eventTotal(counts, "article_helpful_yes");
      const no = eventTotal(counts, "article_helpful_no");
      return {
        slug: article.slug,
        title: article.title,
        series: seriesByName(article.series ?? FOUNDATIONS_SERIES)?.label ?? article.series ?? FOUNDATIONS_SERIES,
        order: article.seriesOrder ?? article.seriesStep ?? 0,
        opens,
        read75: eventTotal(counts, "article_scroll_75"),
        read100: eventTotal(counts, "article_scroll_100"),
        starts: eventTotal(counts, "interactive_figure_start"),
        completes: eventTotal(counts, "interactive_figure_complete"),
        next: eventTotal(counts, "next_story_clicked"),
        helpful: share(yes, yes + no),
        answers: yes + no,
      };
    })
    .filter((row) => row.opens + row.starts + row.read75 + row.next + row.answers > 0)
    .sort((a, b) => b.opens - a.opens || a.title.localeCompare(b.title));

  return (
    <Section title="By story" sub="Stories with no activity in the period are left out rather than listed at zero.">
      {rows.length === 0 ? (
        <p className="text-[12.5px] text-soft-mute">{EMPTY}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.16em] text-soft-mute">
                <th className="pb-2 font-semibold">Story</th>
                <th className="pb-2 text-right font-semibold">Opens</th>
                <th className="pb-2 text-right font-semibold">Read 75%</th>
                <th className="pb-2 text-right font-semibold">Read 100%</th>
                <th className="pb-2 text-right font-semibold">Figure start</th>
                <th className="pb-2 text-right font-semibold">Complete</th>
                <th className="pb-2 text-right font-semibold">Next story</th>
                <th className="pb-2 text-right font-semibold">Helpful</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-b border-white/[0.05]">
                  <td className="py-2.5 pr-4">
                    <span className="block text-[13px] text-soft-white">{row.title}</span>
                    <span className="block text-[10.5px] uppercase tracking-[0.14em] text-soft-mute">
                      {row.series} · {String(row.order).padStart(2, "0")}
                    </span>
                  </td>
                  <Num value={row.opens} />
                  <Num value={row.read75} of={row.opens} />
                  <Num value={row.read100} of={row.opens} />
                  <Num value={row.starts} of={row.opens} />
                  <Num value={row.completes} of={row.starts} />
                  <Num value={row.next} of={row.opens} />
                  <td className="py-2.5 text-right font-mono text-[13px] text-soft-white">
                    {row.helpful === null ? <span className="text-soft-mute">—</span> : `${row.helpful}%`}
                    {row.answers > 0 && <span className="ml-1 text-[11px] text-soft-mute">({row.answers})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* ── figures: seen → start → complete ───────────────────────────────────── */

function FigureTable({ aggregate }: { aggregate: InsightAggregate }) {
  const rows = Object.values(articleExperiences)
    .map((experience) => {
      const counts = aggregate.byArticle[experience.slug];
      const article = insightArticles.find((item) => item.slug === experience.slug);
      return {
        id: experience.hero,
        title: article?.title ?? experience.slug,
        seen: eventWith(counts, "interactive_figure_seen", experience.hero),
        start: eventWith(counts, "interactive_figure_start", experience.hero),
        complete: eventWith(counts, "interactive_figure_complete", experience.hero),
      };
    })
    .filter((row) => row.seen + row.start + row.complete > 0)
    .sort((a, b) => b.start - a.start);
  return (
    <Section title="Hero figures" sub="Seen is the figure scrolling into view; start is the first touch; complete is the figure's own definition of having been understood.">
      {rows.length === 0 ? (
        <p className="text-[12.5px] text-soft-mute">{EMPTY}</p>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-[0.16em] text-soft-mute">
              <th className="pb-2 font-semibold">Figure</th>
              <th className="pb-2 text-right font-semibold">Seen</th>
              <th className="pb-2 text-right font-semibold">Started</th>
              <th className="pb-2 text-right font-semibold">Completed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-white/[0.05]">
                <td className="py-2.5 pr-4">
                  <span className="block text-[13px] text-soft-white">{row.title}</span>
                  <span className="block font-mono text-[10.5px] text-soft-mute">{row.id}</span>
                </td>
                <Num value={row.seen} />
                <Num value={row.start} of={row.seen} />
                <Num value={row.complete} of={row.start} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
}

function TimeToFirst({ aggregate }: { aggregate: InsightAggregate }) {
  const buckets = breakdown(aggregate, "interactive_figure_start", { secondary: "time_to_first" });
  const total = buckets.reduce((sum, item) => sum + item.count, 0);
  const order = ["0-2s", "2-5s", "5-10s", ">10s", "-10s"];
  const sorted = [...buckets].sort((a, b) => order.indexOf(a.dimension) - order.indexOf(b.dimension));
  return (
    <Section title="Time to first interaction" sub="How long after a figure came into view a reader first touched it. Readers who never touch it appear as seen-but-not-started above.">
      {total === 0 ? <p className="text-[12.5px] text-soft-mute">{EMPTY}</p> : <Bars rows={sorted.map((item) => ({ label: labelFor("time_to_first", item.dimension), count: item.count }))} total={total} />}
    </Section>
  );
}

/* ── the Foundations path ───────────────────────────────────────────────── */

function FoundationsFunnel({ aggregate }: { aggregate: InsightAggregate }) {
  const foundations = insightArticles
    .filter((article) => (article.series ?? FOUNDATIONS_SERIES) === FOUNDATIONS_SERIES)
    .sort((a, b) => (a.seriesOrder ?? a.seriesStep ?? 0) - (b.seriesOrder ?? b.seriesStep ?? 0));
  const rows = foundations.map((article) => {
    const counts = aggregate.byArticle[article.slug];
    const order = article.seriesOrder ?? article.seriesStep ?? 0;
    return {
      slug: article.slug,
      order,
      title: article.title,
      opens: eventTotal(counts, "insight_open"),
      progressed: eventWith(counts, "foundation_progressed", String(order)),
      finished: eventTotal(counts, "article_scroll_100"),
      next: eventTotal(counts, "next_story_clicked"),
    };
  });
  const max = Math.max(1, ...rows.map((row) => row.opens));
  const any = rows.some((row) => row.opens + row.progressed > 0);
  return (
    <Section title="Foundations path" sub="Opens per Foundation in order, and how many of them were reached from another Foundation in the same session (progressed).">
      {!any ? (
        <p className="text-[12.5px] text-soft-mute">{EMPTY}</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((row) => (
            <li key={row.slug} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[13px] text-soft-white">
                    <span className="mr-2 font-mono text-[11px] text-amber-300">{String(row.order).padStart(2, "0")}</span>
                    {row.title}
                  </span>
                  <span className="font-mono text-[12px] text-soft-white">{fmt(row.opens)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full bg-amber-300/70" style={{ width: `${Math.round((row.opens / max) * 100)}%` }} />
                </div>
              </div>
              <div className="flex gap-4 font-mono text-[11px] text-soft-mute sm:w-[300px] sm:justify-end">
                <span>progressed {fmt(row.progressed)}</span>
                <span>finished {fmt(row.finished)}</span>
                <span>next {fmt(row.next)}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}

/* ── article-specific interactions ──────────────────────────────────────── */

function InteractionBreakdowns({ aggregate }: { aggregate: InsightAggregate }) {
  const groups = FIGURE_EVENTS.map((item) => ({ ...item, rows: breakdown(aggregate, item.event, { articles: [item.slug] }) })).filter((item) => item.rows.length > 0);
  const modes = breakdown(aggregate, "reading_mode_changed");
  const covers = breakdown(aggregate, "hub_card_interaction");
  return (
    <Section title="Interaction detail" sub="Which states readers actually reached inside each figure. Dimensions are the figures' own closed vocabularies.">
      {groups.length === 0 && modes.length === 0 && covers.length === 0 ? (
        <p className="text-[12.5px] text-soft-mute">{EMPTY}</p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.event}>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">{group.title}</p>
              <Bars rows={group.rows.map((row) => ({ label: labelFor(group.event, row.dimension), count: row.count }))} total={group.rows.reduce((sum, row) => sum + row.count, 0)} />
            </div>
          ))}
          {modes.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">Reading mode chosen</p>
              <Bars rows={modes.map((row) => ({ label: labelFor("reading_mode_changed", row.dimension), count: row.count }))} total={modes.reduce((sum, row) => sum + row.count, 0)} />
            </div>
          )}
          {covers.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">Hub cards touched</p>
              <Bars rows={covers.map((row) => ({ label: labelFor("hub_card_interaction", row.dimension), count: row.count }))} total={covers.reduce((sum, row) => sum + row.count, 0)} />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

/* ── destinations ───────────────────────────────────────────────────────── */

function Destinations({ aggregate }: { aggregate: InsightAggregate }) {
  const items = [
    { title: "GaitScape nodes opened", event: "gaitscape_opened" },
    { title: "Research destinations", event: "research_opened" },
    { title: "Citations opened", event: "citation_opened" },
    { title: "Product pages opened", event: "product_opened" },
    { title: "Ask GaitAI opened from a story", event: "ask_gaitai_article_opened" },
    { title: "Next story via", event: "next_story_clicked" },
    { title: "Shared", event: "insight_shared" },
    { title: "Newsletter sign-ups by source", event: "newsletter_submitted" },
  ]
    .map((item) => ({ ...item, rows: breakdown(aggregate, item.event) }))
    .filter((item) => item.rows.length > 0);
  return (
    <Section title="Where readers went" sub="Clicks out of a story, by destination. Counts of link clicks — never the pages a reader visited afterwards.">
      {items.length === 0 ? (
        <p className="text-[12.5px] text-soft-mute">{EMPTY}</p>
      ) : (
        <div className="space-y-5">
          {items.map((item) => (
            <div key={item.event}>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">{item.title}</p>
              <Bars rows={item.rows.slice(0, 8).map((row) => ({ label: labelFor(item.event, row.dimension), count: row.count }))} total={item.rows.reduce((sum, row) => sum + row.count, 0)} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ── feedback ───────────────────────────────────────────────────────────── */

function Feedback({ aggregate }: { aggregate: InsightAggregate }) {
  const yes = siteTotal(aggregate, "article_helpful_yes");
  const no = siteTotal(aggregate, "article_helpful_no");
  const reasons = breakdown(aggregate, "article_helpful_reason");
  return (
    <Section title="“Did this help you understand the idea?”" sub="Two answers and four fixed reasons. There is no free-text field, so nothing a reader typed can appear here.">
      {yes + no === 0 ? (
        <p className="text-[12.5px] text-soft-mute">{EMPTY}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <Bars
            rows={[
              { label: "Yes", count: yes },
              { label: "Not quite", count: no },
            ]}
            total={yes + no}
          />
          {reasons.length > 0 && (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">Why not quite</p>
              <Bars rows={reasons.map((row) => ({ label: labelFor("article_helpful_reason", row.dimension), count: row.count }))} total={reasons.reduce((sum, row) => sum + row.count, 0)} />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

/* ── the pipeline ───────────────────────────────────────────────────────── */

function Pipeline() {
  return (
    <Section title="Editorial pipeline" sub="Stories that exist as intentions only — data in src/data/insight-pipeline.ts, nothing routed. Choose the next one against what readers did with the last.">
      <ul className="divide-y divide-white/[0.05]">
        {INSIGHT_PIPELINE.map((entry) => {
          const series = INSIGHT_SERIES.find((item) => item.id === entry.series);
          return (
            <li key={entry.title} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <p className="text-[13px] text-soft-white">{entry.title}</p>
                <p className="mt-0.5 text-[12px] text-soft-mute">{entry.thesis}</p>
                <p className="mt-1 text-[11px] text-cyan-200/80">Remember: {entry.memory}</p>
              </div>
              <div className="text-right font-mono text-[10.5px] uppercase tracking-[0.14em] text-soft-mute">
                <span className="block">{series?.label ?? entry.series}</span>
                <span className="block text-amber-300/80">{entry.status}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ── primitives ─────────────────────────────────────────────────────────── */

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h3 className="font-display text-lg text-soft-white">{title}</h3>
      <p className="mt-1 text-[12.5px] text-soft-mute">{sub}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Num({ value, of }: { value: number; of?: number }) {
  const ratio = of === undefined ? null : share(value, of);
  return (
    <td className="py-2.5 text-right font-mono text-[13px] text-soft-white">
      {fmt(value)}
      {ratio !== null && value > 0 && <span className="ml-1 text-[11px] text-soft-mute">{ratio}%</span>}
    </td>
  );
}

function Bars({ rows, total }: { rows: Array<{ label: string; count: number }>; total: number }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ul className="mt-2 space-y-1.5">
      {rows.map((row) => (
        <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[12.5px] text-soft-gray">{row.label}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div className="h-full rounded-full bg-cyan-300/60" style={{ width: `${Math.round((row.count / max) * 100)}%` }} />
            </div>
          </div>
          <span className="w-[84px] text-right font-mono text-[12px] text-soft-white">
            {fmt(row.count)}
            <span className="ml-1 text-[10.5px] text-soft-mute">{share(row.count, total) ?? 0}%</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (value: number | null, of: string) => (value === null ? "Nothing to compare yet" : `${value}% ${of}`);
