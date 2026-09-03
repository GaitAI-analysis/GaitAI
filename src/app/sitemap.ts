import type { MetadataRoute } from "next";
import { readPublishedPosts } from "@/lib/posts-store";
import { insightArticles } from "@/data/insights";
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
  const posts = await readPublishedPosts();

  /* Article dates are the one piece of freshness the tree does not carry. */
  const lastModified = new Map(
    insightArticles.map((article) => [
      `/insights/${article.slug}/`,
      new Date(article.date),
    ]),
  );

  return [
    ...siteRoutes().map((route) => ({
      url: loc(route),
      lastModified: lastModified.get(route),
      changeFrequency: route === "" || route === "/"
        ? ("monthly" as const)
        : ("yearly" as const),
      priority: priorityFor(route),
    })),
    ...posts.map((post) => ({
      url: loc(`/publications/${post.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
