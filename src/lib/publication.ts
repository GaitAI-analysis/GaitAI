/* CLIENT-SAFE: the publication index, query helpers and recommendation model. */

import { INSIGHT_TOPIC_CONFIG } from "@/data/insight-topics";
import type { CoverConcept, PostType } from "@/data/insights";

export const PUBLICATION_PAGE_SIZE = 12;
export const HOME_LATEST_SIZE = 9;
export const VISIBLE_TOPIC_COUNT = 4;

export type PublicationArtwork =
  | { kind: "concept"; concept: CoverConcept; alt: string }
  | {
      kind: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
    }
  | { kind: "none" };

export interface PublicationStory {
  id: string;
  slug: string;
  href: string;
  source: "editorial" | "newsroom";
  title: string;
  description: string;
  date: string;
  updated: string;
  type: PostType | string;
  topics: string[];
  author: string;
  featured: boolean;
  coverArtwork: PublicationArtwork;
  tags: string[];
  relatedProducts: string[];
  relatedResearch: string[];
  relatedSlugs: string[];
  series?: string;
  seriesOrder?: number;
}

const TYPE_LABELS: Record<string, { singular: string; plural: string }> = {
  essay: { singular: "Article", plural: "Articles" },
  research: { singular: "Research note", plural: "Research notes" },
  product: { singular: "Product update", plural: "Product updates" },
  engineering: { singular: "Engineering note", plural: "Engineering notes" },
  update: { singular: "GaitAI update", plural: "GaitAI updates" },
  announcement: { singular: "Announcement", plural: "Announcements" },
};

export function normalizeTopicSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[’'"`]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function humanizeSlug(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\bai\b/gi, "AI")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function topicLabel(topic: string): string {
  return INSIGHT_TOPIC_CONFIG[topic]?.label ?? humanizeSlug(topic);
}

export function topicDescription(topic: string): string {
  return (
    INSIGHT_TOPIC_CONFIG[topic]?.description ??
    `Stories, notes and updates filed under ${topicLabel(topic)}.`
  );
}

export function topicPriority(topic: string): number {
  return INSIGHT_TOPIC_CONFIG[topic]?.priority ?? 0;
}

export function publicationTypeLabel(type: string, plural = false): string {
  const known = TYPE_LABELS[type];
  if (known) return plural ? known.plural : known.singular;
  const label = humanizeSlug(type);
  return plural ? `${label}s` : label;
}

export function formatPublicationDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function sortNewest<T extends Pick<PublicationStory, "date" | "slug">>(
  stories: T[],
): T[] {
  return [...stories].sort(
    (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
  );
}

export function sortOldest<T extends Pick<PublicationStory, "date" | "slug">>(
  stories: T[],
): T[] {
  return [...stories].sort(
    (a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug),
  );
}

export function selectCoverStory(
  stories: PublicationStory[],
  now = new Date(),
): PublicationStory | undefined {
  const suitable = stories.filter((story) => {
    const date = new Date(story.date);
    return Number.isNaN(date.getTime()) || date.getTime() <= now.getTime();
  });
  const pool = suitable.length > 0 ? suitable : stories;
  return sortNewest(pool.filter((story) => story.featured))[0] ?? sortNewest(pool)[0];
}

export interface TopicCount {
  slug: string;
  label: string;
  count: number;
  priority: number;
}

export function publicationTopics(stories: PublicationStory[]): TopicCount[] {
  const counts = new Map<string, number>();
  for (const story of stories) {
    for (const topic of new Set(story.topics)) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({
      slug,
      label: topicLabel(slug),
      count,
      priority: topicPriority(slug),
    }))
    .sort(
      (a, b) =>
        b.priority - a.priority || b.count - a.count || a.label.localeCompare(b.label),
    );
}

export function publicationTypes(stories: PublicationStory[]): string[] {
  return [...new Set(stories.map((story) => story.type))].sort((a, b) =>
    publicationTypeLabel(a, true).localeCompare(publicationTypeLabel(b, true)),
  );
}

export function filterPublicationStories(
  stories: PublicationStory[],
  filters: { query?: string; type?: string; topic?: string },
): PublicationStory[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? "";
  return stories.filter((story) => {
    if (filters.type && filters.type !== "all" && story.type !== filters.type) return false;
    if (filters.topic && filters.topic !== "all" && !story.topics.includes(filters.topic)) return false;
    return !query || publicationSearchText(story).includes(query);
  });
}

export function publicationSearchText(story: PublicationStory): string {
  return [
    story.title,
    story.description,
    story.type,
    publicationTypeLabel(story.type),
    story.topics.join(" "),
    story.topics.map(topicLabel).join(" "),
    story.tags.join(" "),
    story.author,
  ].join(" ").toLocaleLowerCase();
}

export interface PublicationMonthGroup {
  key: string;
  label: string;
  stories: PublicationStory[];
}

export interface PublicationYearGroup {
  year: string;
  months: PublicationMonthGroup[];
}

export function buildArchiveGroups(stories: PublicationStory[]): PublicationYearGroup[] {
  const years = new Map<string, Map<string, PublicationMonthGroup>>();
  for (const story of sortNewest(stories)) {
    const parsed = new Date(story.date);
    const date = Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
    const year = String(date.getUTCFullYear());
    const key = `${year}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const months = years.get(year) ?? new Map<string, PublicationMonthGroup>();
    if (!years.has(year)) years.set(year, months);
    const month = months.get(key) ?? {
      key,
      label: new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date),
      stories: [],
    };
    if (!months.has(key)) months.set(key, month);
    month.stories.push(story);
  }
  return [...years.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([year, months]) => ({
      year,
      months: [...months.values()].sort((a, b) => b.key.localeCompare(a.key)),
    }));
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = Math.max(0, page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function progressivePageCount(
  total: number,
  firstPageSize: number,
  laterPageSize = PUBLICATION_PAGE_SIZE,
): number {
  if (total <= firstPageSize) return 1;
  return 1 + Math.ceil((total - firstPageSize) / laterPageSize);
}

export function progressivePage<T>(
  items: T[],
  page: number,
  firstPageSize: number,
  laterPageSize = PUBLICATION_PAGE_SIZE,
): T[] {
  if (page <= 1) return items.slice(0, firstPageSize);
  const start = firstPageSize + (page - 2) * laterPageSize;
  return items.slice(start, start + laterPageSize);
}

export function pageHref(basePath: string, page: number): string {
  const base = basePath.replace(/\/$/, "");
  return page <= 1 ? base || "/" : `${base}/page/${page}`;
}

function overlap(a: string[], b: string[]): number {
  const right = new Set(b);
  return new Set(a.filter((value) => right.has(value))).size;
}

/**
 * Lightweight, deterministic recommendations. Explicit curation and series
 * relationships lead; shared topics, products and research records provide
 * secondary evidence. Date and slug make every tie stable across builds.
 */
export function relatedStories(
  current: PublicationStory,
  stories: PublicationStory[],
  limit = 3,
): PublicationStory[] {
  return stories
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => {
      let score = 0;
      if (current.relatedSlugs.includes(candidate.slug)) score += 120;
      if (current.series && current.series === candidate.series) score += 90;
      score += overlap(current.topics, candidate.topics) * 24;
      score += overlap(current.relatedProducts, candidate.relatedProducts) * 14;
      score += overlap(current.relatedResearch, candidate.relatedResearch) * 14;
      if (current.type === candidate.type) score += 3;
      return { candidate, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.candidate.date.localeCompare(a.candidate.date) ||
        a.candidate.slug.localeCompare(b.candidate.slug),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export function seriesNeighbors(
  current: PublicationStory,
  stories: PublicationStory[],
): {
  ordered: PublicationStory[];
  previous?: PublicationStory;
  next?: PublicationStory;
} {
  if (!current.series || typeof current.seriesOrder !== "number") return { ordered: [] };
  const ordered = stories
    .filter(
      (story) =>
        story.series === current.series && typeof story.seriesOrder === "number",
    )
    .sort(
      (a, b) =>
        (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0) || a.slug.localeCompare(b.slug),
    );
  const index = ordered.findIndex((story) => story.id === current.id);
  return {
    ordered,
    previous: index > 0 ? ordered[index - 1] : undefined,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined,
  };
}
