// Server-only publication adapters. Firestore's build mirror and the five
// structured editorial essays meet here; pages never maintain parallel lists.

import { insightArticles, insightHref, type InsightArticle } from "@/data/insights";
import type { Post } from "@/lib/posts";
import { readPublishedPosts } from "@/lib/posts-store";
import {
  normalizeTopicSlug,
  sortNewest,
  type PublicationStory,
} from "@/lib/publication";

const CATEGORY_TYPE: Record<Post["category"], string> = {
  research: "research",
  announcement: "announcement",
  documentation: "engineering",
  approval: "announcement",
  blog: "essay",
  demo: "product",
};

const CATEGORY_TOPIC: Record<Post["category"], string> = {
  research: "research",
  announcement: "company-news",
  documentation: "engineering",
  approval: "company-news",
  blog: "movement-intelligence",
  demo: "product-updates",
};

const KNOWN_LEGACY_TOPICS = new Set([
  "movement-intelligence",
  "responsible-ai",
  "mobility",
  "research",
  "engineering",
  "product-updates",
  "company-news",
]);

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(String).map((item) => item.trim()).filter(Boolean))];
}

export function insightToPublicationStory(article: InsightArticle): PublicationStory {
  const topics = article.topics.map(normalizeTopicSlug).filter(Boolean);
  const author = article.author ?? "GaitAI Research";
  return {
    id: `editorial:${article.slug}`,
    slug: article.slug,
    href: insightHref(article.slug),
    source: "editorial",
    title: article.title,
    description: article.excerpt,
    date: article.date,
    updated: article.updated ?? article.date,
    type: article.postType,
    topics,
    author,
    featured: article.featured ?? false,
    coverArtwork: {
      kind: "concept",
      concept: article.cover.concept,
      alt: article.cover.alt,
    },
    tags: article.tags,
    relatedProducts: cleanList(article.relatedProducts),
    relatedResearch: cleanList(article.relatedResearch),
    relatedSlugs: [...article.related],
    series: article.series ?? "GaitAI Foundations",
    seriesOrder: article.seriesOrder ?? article.seriesStep,
  };
}

function postTopics(post: Post): string[] {
  const explicit = cleanList(post.topics)
    .map(normalizeTopicSlug)
    .filter(Boolean);
  if (explicit.length > 0) return explicit;

  // Old records had tags but no topic field. Recognise only the established
  // topic vocabulary; arbitrary tags must not become a 30-chip filter wall.
  const migrated = post.tags
    .map(normalizeTopicSlug)
    .filter((topic) => KNOWN_LEGACY_TOPICS.has(topic));
  return [...new Set(migrated.length > 0 ? migrated : [CATEGORY_TOPIC[post.category]])];
}

export function postToPublicationStory(post: Post): PublicationStory {
  const topics = postTopics(post);
  const type = normalizeTopicSlug(post.type ?? CATEGORY_TYPE[post.category]);
  const artwork = post.coverImageUrl
    ? ({
        kind: "image" as const,
        src: post.coverImageUrl,
        alt: post.coverImageAlt || "",
        width: post.coverImageWidth ?? 1600,
        height: post.coverImageHeight ?? 900,
      })
    : ({ kind: "none" as const });

  return {
    id: `newsroom:${post.id}`,
    slug: post.slug,
    href: `/publications/${post.slug}`,
    source: "newsroom",
    title: post.title,
    description: post.summary,
    date: post.publishedAt,
    updated: post.updatedAt ?? post.publishedAt,
    type,
    topics,
    author: post.author || "GaitAI",
    featured: post.featured ?? false,
    coverArtwork: artwork,
    tags: post.tags,
    relatedProducts: cleanList(post.relatedProducts),
    relatedResearch: cleanList(post.relatedResearch),
    relatedSlugs: [],
    series: post.series?.trim() || undefined,
    seriesOrder:
      typeof post.seriesOrder === "number" && Number.isFinite(post.seriesOrder)
        ? post.seriesOrder
        : undefined,
  };
}

export async function readPublicationStories(): Promise<PublicationStory[]> {
  const posts = await readPublishedPosts();
  const stories = [
    ...insightArticles.map(insightToPublicationStory),
    ...posts.map(postToPublicationStory),
  ];

  // A slug is a stable content identifier. Prefer the versioned editorial
  // record if a Firestore mirror accidentally reuses one of its slugs.
  const unique = new Map<string, PublicationStory>();
  for (const story of stories) {
    if (!unique.has(story.slug)) unique.set(story.slug, story);
  }
  return sortNewest([...unique.values()]);
}
