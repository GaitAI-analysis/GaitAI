import assert from "node:assert/strict";
import fs from "node:fs";
import routes from "../src/data/wiki-legacy-routes.json";
import { navLinks } from "../src/data/content";
import { siteRoutes } from "../src/data/site-map";

const privateRoot = "https://gaitai-wiki.gait-ai-founder.workers.dev/insights/wiki";
const blog = navLinks.find((item) => item.label === "Blog")!;
assert.deepEqual(blog.children?.map(({ label, href, description }) => ({ label, href, description })), [
  { label: "Latest Stories", href: "/insights", description: "Recent articles, research notes and GaitAI updates" },
  { label: "GaitAI Foundations", href: "/insights/start-here", description: "The five ideas behind movement-intelligence thinking" },
  { label: "Archive", href: "/insights/archive", description: "Everything GaitAI has published" },
  { label: "Wiki", href: privateRoot, description: "Product architecture and technical documentation" },
]);
assert.equal(routes.length, 49);
assert.equal(new Set(routes).size, 49);
assert(routes.every((route) => route.startsWith("/insights/wiki/") && route.endsWith("/")));
for (const name of ["content/wiki", "src/components/wiki", "src/data/wiki-pages.json", "src/data/wiki.ts", "src/lib/wiki-content.ts", "src/lib/wiki-search.ts"]) {
  assert(!fs.existsSync(name), `Private Wiki source returned to the public repository: ${name}`);
}
assert(!siteRoutes().some((route) => route.startsWith("/insights/wiki/gaitai-care/")), "Global public indexes must not include guide metadata");
console.log("Private Wiki public-boundary checks passed: original Blog labels/order/descriptions; private destination; 49 content-free entry routes; private source excluded.");
