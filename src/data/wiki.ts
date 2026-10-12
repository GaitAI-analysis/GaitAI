import carePages from "./wiki-pages.json";
/** Public metadata only. Add a product and Markdown pages here to extend the Wiki. */
export const WIKI_ROOT = "/insights/wiki";
export const WIKI_REVIEW_DATE = "2026-10-12";

export interface WikiPage {
  slug: string;
  title: string;
  description: string;
  section: string;
  area: string;
}
export interface WikiProduct {
  slug: string;
  name: string;
  description: string;
  status: "available" | "coming-soon";
  pages: WikiPage[];
  areas?: { slug: string; name: string; description: string }[];
}

export const wikiProducts: WikiProduct[] = [
  {
    slug: "gaitai-care", name: "GaitAI Care", status: "available",
    description: "The architecture behind personal and family health records. From document ingestion to a shared web and mobile experience.",
    pages: carePages,
  },
  { slug: "mobilitycare", name: "MobilityCare", status: "coming-soon", description: "Documentation coming soon. Technical material will be published after source review.", pages: [] },
  { slug: "securevision", name: "SecureVision", status: "coming-soon", description: "Documentation coming soon. Technical material will be published after source review.", pages: [] },
  { slug: "gaitai-core", name: "GaitAI Core / Pose Analysis", status: "coming-soon", description: "Documentation coming soon. Technical material will be published after source review.", pages: [] },
];

export const wikiProductHref = (product: string) => `${WIKI_ROOT}/${product}/`;
export const wikiPageHref = (product: string, page: string) => `${wikiProductHref(product)}${page}/`;
export const availableWikiProducts = wikiProducts.filter((p) => p.status === "available");

export interface WikiSearchEntry {
  title: string;
  product: string;
  section: string;
  href: string;
  text: string;
}

export const wikiAreas = [
  { slug: "web", name: "Web application", description: "Browser experience, frontend architecture, hosting and web delivery." },
  { slug: "android", name: "Android application", description: "Capacitor, native capabilities, verified build artifacts and release readiness." },
  { slug: "backend", name: "Shared backend", description: "The API, data model, private storage and infrastructure used by both clients." },
];

/** New products can supply their own areas; only registered landing pages appear. */
export const wikiAreasFor = (product: WikiProduct) => (product.areas ?? wikiAreas)
  .filter((area) => product.pages.some((page) => page.slug === area.slug));
