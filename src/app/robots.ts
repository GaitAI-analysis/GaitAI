import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin-controlpanel/"],
    },
    sitemap: "https://gaitai.in/sitemap.xml",
    host: "https://gaitai.in",
  };
}
