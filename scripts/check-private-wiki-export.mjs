import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const routes = JSON.parse(fs.readFileSync("src/data/wiki-legacy-routes.json", "utf8"));
for (const route of routes) {
  const html = fs.readFileSync(path.join("out", route, "index.html"), "utf8");
  assert(html.includes("Private technical documentation"), `Missing gate: ${route}`);
  assert(html.includes("gaitai-wiki.gait-ai-founder.workers.dev"), `Missing private destination: ${route}`);
  assert(!/<article|<figure|<pre[ >]|On this page|Documentation pages|wikiSearchEntries/.test(html), `Documentation leaked into public gate: ${route}`);
  assert(html.includes('name="robots" content="noindex, nofollow"'), `Gate can be indexed: ${route}`);
}
function files(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? files(path.join(directory, e.name)) : [path.join(directory, e.name)]); }
const forbidden = ["Source-reviewed product documentation", "The rationale, benefits and trade-offs behind the current system.", "supabase-storage", "data-frame-svg", "cf-access-jwt-assertion"];
let checked = 0;
for (const name of files("out")) {
  if (!/\.(html|txt|json|js|css|svg|md|mdx)$/.test(name)) continue;
  assert(!/(?:^|[/\\])wiki[/\\].*\.(md|mdx)$/.test(name), `Private documentation source: ${name}`);
  const text = fs.readFileSync(name, "utf8");
  for (const marker of forbidden) assert(!text.includes(marker), `Private Wiki marker in ${name}: ${marker}`);
  checked++;
}
const sitemap = fs.readFileSync("out/sitemap.xml", "utf8");
assert(!sitemap.includes("/insights/wiki"), "Private routes remain in the public sitemap");
console.log(`Public export boundary passed: ${routes.length} content-free gates and ${checked} text assets checked; no Wiki content markers or sitemap entries.`);
