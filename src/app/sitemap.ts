import type { MetadataRoute } from "next";
import { readPublishedPosts } from "@/lib/posts-store";
import { productDetails } from "@/data/product-details";
import { secureProductDetails } from "@/data/product-details-secure";
import { useCaseDetails } from "@/data/usecase-details";
import { insightArticles } from "@/data/insights";
import { allPublications } from "@/data/publications";

const siteUrl = "https://gaitai.in";

/**
 * `trailingSlash: true` means the served URL and every canonical tag end in
 * a slash. The sitemap advertised the slashless form, so each route was
 * offered to crawlers in one shape and self-declared in another.
 */
const loc = (route: string) => `${siteUrl}${route}/`.replace(/\/{2,}$/, "/");

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
    "/research/evidence",
    "/publications",
    "/insights",
    "/investors",
    "/trust",
    "/legal/privacy",
    "/legal/security",
    "/legal/terms",
    "/legal/responsible-ai",
  ];

  return [
    ...routes.map((route) => ({
      url: loc(route),
      changeFrequency: route === "" ? ("monthly" as const) : ("yearly" as const),
      priority: route === "" ? 1 : route.startsWith("/legal/") ? 0.3 : 0.7,
    })),
    ...productDetails.map((d) => ({
      url: loc(`/mobilitycare/${d.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...secureProductDetails.map((d) => ({
      url: loc(`/securevision/${d.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...useCaseDetails.map((d) => ({
      url: loc(`/use-cases/${d.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...insightArticles.map((article) => ({
      url: loc(`/insights/${article.slug}`),
      lastModified: new Date(article.date),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    /* The nine research records. Previously absent: the only /publications
       entry mapped Firestore posts, of which there are currently none, so
       every paper and the patent were missing from the sitemap. */
    ...allPublications.map((record) => ({
      url: loc(`/publications/${record.id}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: loc(`/publications/${post.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
