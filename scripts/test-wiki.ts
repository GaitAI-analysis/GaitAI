import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { availableWikiProducts, wikiProducts, wikiAreasFor, wikiPageHref } from "../src/data/wiki";
import { readWikiPage, wikiSearchEntries } from "../src/lib/wiki-content";
import { navLinks } from "../src/data/content";
import { siteRoutes } from "../src/data/site-map";

const routes = new Set(siteRoutes());
const search = wikiSearchEntries();
const blog = navLinks.find((n) => n.label === "Blog");
assert.deepEqual(blog?.children?.map((n) => n.label), ["Insights", "Archive", "Wiki"]);
let guides = 0, links = 0, headings = 0;
for (const product of wikiProducts) {
  if (product.status === "coming-soon") { assert.equal(product.pages.length, 0); continue; }
  assert(availableWikiProducts.includes(product));
  const slugs = new Set(product.pages.map((p) => p.slug));
  assert.equal(slugs.size, product.pages.length, "Duplicate page route");
  for (const area of wikiAreasFor(product)) assert(slugs.has(area.slug), `Missing ${area.slug} landing`);
  for (const page of product.pages) {
    assert.match(page.slug, /^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/);
    const { markdown, headings: toc } = readWikiPage(product, page);
    const href = wikiPageHref(product.slug, page.slug);
    assert(routes.has(href), `Missing sitemap/Atlas route: ${href}`);
    assert(search.some((e) => e.href === href), `Missing searchable page: ${href}`);
    assert(markdown.split(/\s+/).length >= 100, `Guide is incomplete: ${href}`);
    assert(toc.length >= 2, `Missing article sections: ${href}`);
    assert.equal(new Set(toc.map((h) => h.id)).size, toc.length, `Duplicate heading: ${href}`);
    assert(!/^# /m.test(markdown), `Article H1 belongs to metadata: ${href}`);
    assert(!/\[\[|<script|<iframe|javascript:/i.test(markdown), `Unsafe or unconverted Markdown: ${href}`);
    // Fail closed on known confidential source patterns. This supplements editorial review.
    assert(!/(?:[A-Z]:\\Users\\|\/Users\/|\/home\/|\.onrender\.com|\.supabase\.co|\.web\.app|github\.com\/GaitAI-analysis\/gaitai-care|BEGIN [A-Z ]*PRIVATE KEY|(?:ghp_|github_pat_|sk_live_)[\w-]+|(?:[A-F0-9]{2}:){15,}|BABYCARE_[A-Z_]+|GAITAI_CARE_KEYSTORE|smtp\.hostinger\.com)/i.test(markdown), `Potential private operational material: ${href}`);
    for (const match of markdown.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      assert(target.startsWith("/insights/wiki/"), `Unreviewed external or relative link: ${target}`);
      assert(routes.has(target.split("#")[0]), `Unresolved link: ${target}`);
      links++;
    }
    for (const match of markdown.matchAll(/```diagram\n([^\n]+)\n```/g)) assert(["system", "web", "android", "ingestion", "email", "data"].includes(match[1]), `Unknown diagram ${match[1]}`);
    headings += toc.length; guides++;
  }
}
// No source archive, extra unpublished page or binary can accidentally join the corpus.
function files(dir: string): string[] { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
assert.equal(files("content/wiki").length, guides);
assert(files("content/wiki").every((f) => f.endsWith(".md")));
console.log(`Wiki validation passed: ${guides} guides, ${headings} headings, ${links} internal content links, ${search.length} search entries; navigation, sitemap and publication-safety checks passed.`);
