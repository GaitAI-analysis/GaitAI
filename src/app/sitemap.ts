import type { MetadataRoute } from "next";
import { readPublishedPosts } from "@/lib/posts-store";
import { readPublicationStories } from "@/lib/publication-store";
import { HOME_LATEST_SIZE, PUBLICATION_PAGE_SIZE, normalizeTopicSlug, pageCount, progressivePageCount, publicationTopics, selectCoverStory } from "@/lib/publication";
import { siteRoutes } from "@/data/site-map";

const siteUrl = "https://gaitai.in";

/**
 * `trailingSlash: true` means the served URL and every canonical tag end in
 * a slash. The sitemap advertised the slashless form, so each route was
 * offered to crawlers in one shape and self-declared in another.
 */
const loc = (route: string) => `${siteUrl}${route}/`.replace(/\/{2,}$/, "/");

/**
 * ONE SOURCE FOR THE SITE'S SHAPE. Every static route here comes from
 * `siteRoutes()` in `data/site-map.ts` — the same tree the Atlas and the
 * location trail read — so a page cannot appear in the map and be missing
 * from the sitemap, or the reverse. This file used to keep its own hand-typed
 * list of seventeen routes beside four `.map()` calls over content data; that
 * list is what went stale (the nine research records were absent from it for
 * a while, and /research/talks was added to the nav without being added here).
 *
 * Priorities are assigned by shape rather than listed: the root, then
 * sections, then leaves, with legal lowest.
 *
 * Firestore-published posts stay separate. They are dynamic and only this
 * file can await them, so the static tree does not pretend to know them.
 */
function priorityFor(route: string): number {
  if (route === "/") return 1;
  if (route.startsWith("/legal/")) return 0.3;
  /* A leaf has three or more segments: /mobilitycare/walkscan/ */
  const depth = route.split("/").filter(Boolean).length;
  return depth > 1 ? 0.6 : 0.7;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, stories] = await Promise.all([readPublishedPosts(), readPublicationStories()]);
  const staticRoutes = siteRoutes();
  const staticRouteSet = new Set(staticRoutes.map((route) => route.replace(/\/$/, "") || "/"));

  /* Article dates are the one piece of freshness the tree does not carry. */
  const lastModified = new Map(
    stories.map((story) => [
      `${story.href.replace(/\/$/, "")}/`,
      new Date(story.updated),
    ]),
  );

  const cover = selectCoverStory(stories);
  const mainPageTotal = progressivePageCount(stories.length - (cover ? 1 : 0), HOME_LATEST_SIZE);
  const topics = publicationTopics(stories);
  /* The blog's three standing destinations beside the feed itself. They are
     the same three the navbar's Blog dropdown points at, which is the point:
     a crawler and a reader should be offered the same map. */
  const discoveryRoutes = ["/insights/start-here", "/insights/topics", "/insights/archive"];
  const paginationRoutes = Array.from({ length: Math.max(0, mainPageTotal - 1) }, (_, index) => `/insights/page/${index + 2}`);
  const topicRoutes = topics.flatMap((topic) => {
    const total = pageCount(stories.filter((story) => story.topics.includes(topic.slug)).length, PUBLICATION_PAGE_SIZE);
    return [
      `/insights/topic/${topic.slug}`,
      ...Array.from({ length: Math.max(0, total - 1) }, (_, index) => `/insights/topic/${topic.slug}/page/${index + 2}`),
    ];
  });
  const seriesRoutes = [...new Set(stories.map((story) => story.series).filter((series): series is string => Boolean(series)))]
    .filter((series) => series !== "GaitAI Foundations")
    .map((series) => `/insights/series/${normalizeTopicSlug(series)}`);

  return [
    ...staticRoutes.map((route) => ({
      url: loc(route),
      lastModified: lastModified.get(route),
      changeFrequency: route === "" || route === "/"
        ? ("monthly" as const)
        : ("yearly" as const),
      priority: priorityFor(route),
    })),
    ...posts.map((post) => ({
      url: loc(`/publications/${post.slug}`),
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...[...discoveryRoutes, ...paginationRoutes, ...topicRoutes, ...seriesRoutes]
      .filter((route) => !staticRouteSet.has(route.replace(/\/$/, "") || "/"))
      .map((route) => ({
      url: loc(route),
      changeFrequency: route === "/insights/archive" || route === "/insights/topics" ? ("weekly" as const) : ("monthly" as const),
      priority: route.includes("/page/") ? 0.4 : 0.5,
    })),
  ];
}
