/**
 * THE EDITORIAL SERIES — GaitAI Insights as a publication with recurring
 * strands, not a list of posts.
 *
 * A series is the shelf an article sits on. It says what kind of question the
 * piece answers and how it is meant to be read: the Foundations are a reading
 * PATH (ordered, finite, with a bridge from each essay to the next); the
 * recurring series are open-ended strands a reader can follow by interest;
 * Field Notes are short.
 *
 * SINGLE SOURCE OF TRUTH. An article names its series with the `series` field
 * on its record (`data/insights.ts`), by the exact `name` below. Everything
 * else — the card label ("AI UNDER STRESS · 01"), the series page, the
 * kicker on the article, the bridge at the foot of it, the sitemap route — is
 * derived from that one string through the helpers here. Nothing is
 * hard-coded per page, and a series with no published story simply has no
 * page: routes are generated from the stories that exist.
 *
 * Names are stable identifiers as well as display strings. Rename one and the
 * records must change with it; the checks in scripts/test-insight-content.ts
 * refuse an article whose series is not in this registry.
 */

export type InsightSeriesId =
  | "foundations"
  | "inside-the-signal"
  | "engineering-gaitai"
  | "research-to-reality"
  | "ai-under-stress"
  | "privacy-by-architecture"
  | "movement-stories"
  | "field-notes";

export type SeriesAccent = "amber" | "cyan" | "violet" | "teal";

export interface InsightSeries {
  id: InsightSeriesId;
  /** The exact string an article's `series` field carries. */
  name: string;
  /** Route segment under /insights/series/. Foundations route to /start-here. */
  slug: string;
  /** Short mono label for cards and kickers, set uppercase by CSS. */
  label: string;
  /** One editorial sentence for the series page and the hub. */
  description: string;
  /**
   * How the strand is read. `path` is ordered and finite and gets a bridge
   * between stories; `strand` is open-ended; `notes` is short-form.
   */
  kind: "path" | "strand" | "notes";
  /** Colour family, by the journal's accent semantics: amber = editorial
      hierarchy, cyan = motion and signal, violet = interpretation and
      privacy, teal = measurement and evidence. */
  accent: SeriesAccent;
  /** Display order wherever series are listed. */
  order: number;
}

export const FOUNDATIONS_SERIES = "GaitAI Foundations";

export const INSIGHT_SERIES: InsightSeries[] = [
  {
    id: "foundations",
    name: FOUNDATIONS_SERIES,
    slug: "foundations",
    label: "Foundations",
    description:
      "Five interactive essays on how human movement becomes machine-readable intelligence — read in order, from a walking video to an audited multimodal claim.",
    kind: "path",
    accent: "amber",
    order: 1,
  },
  {
    id: "inside-the-signal",
    name: "Inside the Signal",
    slug: "inside-the-signal",
    label: "Inside the Signal",
    description:
      "One movement signal at a time: what it measures, how it is computed, where it holds and where it breaks.",
    kind: "strand",
    accent: "cyan",
    order: 2,
  },
  {
    id: "engineering-gaitai",
    name: "Engineering GaitAI",
    slug: "engineering-gaitai",
    label: "Engineering GaitAI",
    description:
      "Real engineering problems, failure modes and the tradeoffs behind them — how the system is built, and where it can go wrong.",
    kind: "strand",
    accent: "cyan",
    order: 3,
  },
  {
    id: "research-to-reality",
    name: "Research → Reality",
    slug: "research-to-reality",
    label: "Research → Reality",
    description:
      "Papers, methods and evidence translated into what they mean for a product, a study or a deployment — and what they do not.",
    kind: "strand",
    accent: "teal",
    order: 4,
  },
  {
    id: "ai-under-stress",
    name: "AI Under Stress",
    slug: "ai-under-stress",
    label: "AI Under Stress",
    description:
      "Robustness, occlusion, poor capture, domain shift and failure analysis: what movement AI does when the world stops cooperating.",
    kind: "strand",
    accent: "cyan",
    order: 5,
  },
  {
    id: "privacy-by-architecture",
    name: "Privacy by Architecture",
    slug: "privacy-by-architecture",
    label: "Privacy by Architecture",
    description:
      "Privacy engineering, data minimisation and the identity questions that follow a movement signal through a system.",
    kind: "strand",
    accent: "violet",
    order: 6,
  },
  {
    id: "movement-stories",
    name: "Movement Stories",
    slug: "movement-stories",
    label: "Movement Stories",
    description:
      "Human-centred scenarios from mobility, rehabilitation and safety, told from the movement outward.",
    kind: "strand",
    accent: "teal",
    order: 7,
  },
  {
    id: "field-notes",
    name: "Field Notes",
    slug: "field-notes",
    label: "Field Notes",
    description: "Shorter technical and editorial observations between the major stories.",
    kind: "notes",
    accent: "violet",
    order: 8,
  },
];

const BY_NAME = new Map(INSIGHT_SERIES.map((series) => [series.name, series]));
const BY_SLUG = new Map(INSIGHT_SERIES.map((series) => [series.slug, series]));

/** The registry entry for a series name; undefined for a name not registered
    (a Firestore post may carry a free-text series — it still gets a page). */
export function seriesByName(name: string | undefined | null): InsightSeries | undefined {
  return name ? BY_NAME.get(name) : undefined;
}

export function seriesBySlug(slug: string): InsightSeries | undefined {
  return BY_SLUG.get(slug);
}

/** The same normalisation the topic routes use, so an unregistered series
    still gets a stable, URL-safe segment. Kept here to avoid a data → lib
    import cycle. */
function fallbackSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[’'"`]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Route segment for a series name — the registry's, or a normalised fallback. */
export function seriesSlug(name: string): string {
  return seriesByName(name)?.slug ?? fallbackSlug(name);
}

/** Where "see the whole series" goes. The Foundations have their own page. */
export function seriesHref(name: string): string {
  return name === FOUNDATIONS_SERIES ? "/insights/start-here/" : `/insights/series/${seriesSlug(name)}/`;
}

/**
 * The micro label a card or kicker prints: "AI UNDER STRESS · 01". The label
 * is the registry's short form where the series is registered, and the raw
 * name otherwise; the number is zero-padded to two places.
 */
export function seriesMark(
  name: string | undefined | null,
  order: number | undefined | null,
): { label: string; number: string; accent: SeriesAccent } | null {
  if (!name) return null;
  const series = seriesByName(name);
  return {
    label: series?.label ?? name,
    number: typeof order === "number" && Number.isFinite(order) ? String(order).padStart(2, "0") : "",
    accent: series?.accent ?? "cyan",
  };
}

export function isFoundations(name: string | undefined | null): boolean {
  return (name ?? FOUNDATIONS_SERIES) === FOUNDATIONS_SERIES;
}
