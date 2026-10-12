import fs from "node:fs";
import path from "node:path";
import GithubSlugger from "github-slugger";
import { availableWikiProducts, wikiPageHref, type WikiPage, type WikiProduct, type WikiSearchEntry } from "@/data/wiki";

export interface WikiHeading { id: string; title: string; depth: number }

export function readWikiPage(product: WikiProduct, page: WikiPage) {
  // Both segments must come from the public registry, never directly from a URL.
  if (!availableWikiProducts.includes(product) || !product.pages.includes(page)) throw new Error("Unregistered Wiki page");
  const markdown = fs.readFileSync(path.join(process.cwd(), "content/wiki", product.slug, `${page.slug}.md`), "utf8").replace(/\r\n?/g, "\n");
  const slugger = new GithubSlugger();
  let fenced = false;
  const headings: WikiHeading[] = [];
  for (const line of markdown.split("\n")) {
    if (/^```/.test(line)) { fenced = !fenced; continue; }
    const match = !fenced && /^(#{2,3}) (.+)$/.exec(line);
    if (match) headings.push({ id: slugger.slug(match[2]), title: match[2], depth: match[1].length });
  }
  return { markdown, headings, minutes: Math.max(1, Math.ceil(markdown.split(/\s+/).length / 200)) };
}

export function wikiSearchEntries(): WikiSearchEntry[] {
  return availableWikiProducts.flatMap((product) => product.pages.flatMap((page) => {
    const { markdown, headings } = readWikiPage(product, page);
    const sections = markdown.split(/^## /m);
    const base = { product: product.name, section: page.section };
    return [
      { ...base, title: page.title, href: wikiPageHref(product.slug, page.slug), text: page.description },
      ...sections.slice(1).map((section) => {
        const newline = section.indexOf("\n");
        const title = section.slice(0, newline);
        const heading = headings.find((h) => h.title === title && h.depth === 2);
        return { ...base, title: `${page.title} · ${title}`, href: `${wikiPageHref(product.slug, page.slug)}#${heading?.id ?? ""}`, text: section.slice(newline + 1).replace(/```[\s\S]*?```/g, " ").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[|*#>\[\]`]/g, " ").replace(/\s+/g, " ").trim() };
      }),
    ];
  }));
}
