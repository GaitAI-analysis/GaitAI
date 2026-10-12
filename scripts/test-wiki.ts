import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { availableWikiProducts, wikiProducts, wikiAreasFor, wikiPageHref } from "../src/data/wiki";
import { readWikiPage, wikiSearchEntries } from "../src/lib/wiki-content";
import { searchWiki, wikiSearchExcerpt } from "../src/lib/wiki-search";
import { navLinks } from "../src/data/content";
import { siteRoutes } from "../src/data/site-map";
import { diagramNames } from "../src/components/wiki/diagrams/registry";
// Replays every figure's geometry: connectors meet their boxes, labels fit, ids are unique.
import "./check-wiki-diagrams";

const routes = new Set(siteRoutes());
const diagramsUsed = new Set<string>();
const search = wikiSearchEntries();
for (const [query, area] of [["android keystore", "android"], ["web sessions", "web"], ["backend PostgreSQL", "backend"]]) {
  const matches = searchWiki(search, query);
  assert(matches.length > 0, `Search must find ${query}`);
  assert(matches[0].href.includes(`/${area}/`), `Search ranks the requested platform: ${query}`);
}
assert.equal(searchWiki(search, "Android Architecture and Stack")[0].title, "Android Architecture and Stack", "Exact page title ranks first");
assert.equal(searchWiki(search, "zzzz-no-such-topic").length, 0);
assert.equal(searchWiki(search, " ").length, 0);
assert(wikiSearchExcerpt("Introductory context. ".repeat(30) + "Keystore protects session data.", "keystore").includes("Keystore"), "Excerpt includes a match beyond the opening paragraph");
const blog = navLinks.find((n) => n.label === "Blog");
const care = availableWikiProducts.find((product) => product.slug === "gaitai-care");
assert(care, "Preserve the published Care documentation");
assert.deepEqual(Object.fromEntries(["overview", "web", "android", "backend"].map((area) => [area, care.pages.filter((page) => page.area === area).length])), { overview: 4, web: 12, android: 17, backend: 14 });
// Preserve the pre-Wiki reading paths, including active-route ownership.
assert.deepEqual(blog?.children, [
  { label: "Latest Stories", href: "/insights", description: "Recent articles, research notes and GaitAI updates", exact: true, owns: ["/insights/page"] },
  { label: "GaitAI Foundations", href: "/insights/start-here", description: "The five ideas behind movement-intelligence thinking", owns: ["/insights/series"] },
  { label: "Archive", href: "/insights/archive", description: "Everything GaitAI has published" },
  { label: "Wiki", href: "/insights/wiki", description: "Product architecture and technical documentation" },
]);
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
      const approvedApp = target === "https://care.gaitai.in/";
      assert(approvedApp || target.startsWith("/insights/wiki/") || target === "/gaitai-care/" || target === "/gaitai-care/download/", `Unreviewed external or relative link: ${target}`);
      if (!approvedApp) assert(routes.has(target.split("#")[0]), `Unresolved link: ${target}`);
      links++;
    }
    for (const match of markdown.matchAll(/```diagram\n([^\n]+)\n```/g)) { assert(diagramNames.includes(match[1]), `Unknown diagram ${match[1]} in ${href}`); diagramsUsed.add(match[1]); }
    headings += toc.length; guides++;
  }
}
// No source archive, extra unpublished page or binary can accidentally join the corpus.
function files(dir: string): string[] { return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
assert.equal(files("content/wiki").length, guides);
assert(files("content/wiki").every((f) => f.endsWith(".md")));
for (const name of diagramNames) assert(diagramsUsed.has(name), `Registered diagram ${name} is not placed in any guide`);
console.log(`Wiki validation passed: ${guides} guides, ${headings} headings, ${links} internal content links, ${search.length} search entries, ${diagramsUsed.size} diagrams in use; navigation, sitemap and publication-safety checks passed.`);
