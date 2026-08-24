import type { MetadataRoute } from "next";
import { readPublishedPosts } from "@/lib/posts-store";

const siteUrl = "https://gaitai.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await readPublishedPosts();
  const routes = [
    "",
    "/about",
    "/mobilitycare",
    "/securevision",
    "/products",
    "/use-cases",
    "/research",
    "/publications",
    "/insights",
    "/legal/privacy",
    "/legal/security",
    "/legal/terms",
    "/legal/responsible-ai",
  ];

  return [
    ...routes.map((route) => ({
      url: `${siteUrl}${route}`,
      changeFrequency: route === "" ? ("monthly" as const) : ("yearly" as const),
      priority: route === "" ? 1 : route.startsWith("/legal/") ? 0.3 : 0.7,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/publications/${post.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
