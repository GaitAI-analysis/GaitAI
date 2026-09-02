import type { MetadataRoute } from "next";
import { readPublishedPosts } from "@/lib/posts-store";
import { productDetails } from "@/data/product-details";
import { secureProductDetails } from "@/data/product-details-secure";
import { useCaseDetails } from "@/data/usecase-details";
import { insightArticles } from "@/data/insights";

const siteUrl = "https://gaitai.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await readPublishedPosts();
  const routes = [
    "",
    "/mobilitycare",
    "/securevision",
    "/products",
    "/use-cases",
    "/gaitscape",
    "/movement-lab",
    "/research",
    "/publications",
    "/insights",
    "/investors",
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
    ...productDetails.map((d) => ({
      url: `${siteUrl}/mobilitycare/${d.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...secureProductDetails.map((d) => ({
      url: `${siteUrl}/securevision/${d.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...useCaseDetails.map((d) => ({
      url: `${siteUrl}/use-cases/${d.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...insightArticles.map((article) => ({
      url: `${siteUrl}/insights/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/publications/${post.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
