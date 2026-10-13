#!/usr/bin/env node
/**
 * SEO CONTRACT CHECK
 * =============================================================================
 * Reads every page of the static export in `out/` and verifies the things a
 * search engine reads before it reads the content. It runs after `next build`
 * in CI (see .github/workflows/deploy.yml) and locally:
 *
 *   node scripts/check-seo.mjs              # against out/
 *   node scripts/check-seo.mjs --report     # also print a title/description table
 *   GAITAI_AUDIT_OUT=path node scripts/check-seo.mjs
 *
 * WHAT IT CHECKS, per indexable page
 *   · exactly one <title>, 10–70 characters, unique across the export
 *   · one meta description, 50–320 characters, unique across the export
 *   · one canonical, absolute, https://gaitai.in, trailing slash, and equal
 *     to the page's own path — a page may not declare itself a copy of
 *     another unless it is a pagination or series page that says so by
 *     also carrying noindex
 *   · og:title, og:description, og:url (== canonical) and og:image present;
 *     og:image points at a file that exists in the export
 *   · exactly one <h1>
 *   · every JSON-LD block parses, has @context and a @type (or @graph)
 *   · no `noindex` outside the allowed set (admin console, the private Wiki
 *     gate, unsubscribe, overflow pagination)
 *   · the private Wiki is not in sitemap.xml and robots.txt still advertises
 *     the sitemap
 *
 * WHAT IT DOES NOT DO
 *   No network, no browser. Rendering and Core Web Vitals are a separate
 *   audit (scripts/audit-browser.mjs; Lighthouse). This is the contract that
 *   must hold on every deploy, cheap enough to run on all of them.
 * =============================================================================
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.env.GAITAI_AUDIT_OUT || "out");
const SITE = "https://gaitai.in";
const REPORT = process.argv.includes("--report");

if (!existsSync(OUT)) {
  console.error("out/ not found — run `npm run build` first.");
  process.exit(1);
}

/** Routes that are allowed to be noindex. Anything else that says noindex is
 *  a page that silently fell out of Google. */
const NOINDEX_ALLOWED = [
  /^\/admin-controlpanel\//,
  /^\/insights\/wiki\//,
  /^\/insights\/unsubscribe\//,
  /^\/insights\/series\//,
  /* Pagination pages beyond the last real one render "No older stories"
     with noindex — generated for the route table, pointed at by nothing. */
  /^\/insights\/page\/\d+\/$/,
  /^\/insights\/topic\/[^/]+\/page\/\d+\/$/,
  /^\/404\/$/,
];

const problems = [];
const warnings = [];
const fail = (route, what) => problems.push(`${route}  ${what}`);
const warn = (route, what) => warnings.push(`${route}  ${what}`);

function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name === "index.html") acc.push(full);
  }
  return acc;
}

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

/** Attribute value from a tag that matches `tagPattern`, in document order. */
function metaContent(head, attr, value) {
  const re = new RegExp(`<meta[^>]*\\b${attr}="${value}"[^>]*>`, "g");
  const out = [];
  for (const tag of head.match(re) || []) {
    const m = tag.match(/\bcontent="([^"]*)"/);
    out.push(m ? decode(m[1]) : "");
  }
  return out;
}

function assetExists(url) {
  const clean = url.replace(/^https?:\/\/[^/]+/, "").split(/[?#]/)[0];
  const file = path.join(OUT, decodeURIComponent(clean));
  return existsSync(file) && statSync(file).isFile();
}

const pages = htmlFiles(OUT).map((file) => {
  const rel = path.relative(OUT, path.dirname(file)).split(path.sep).join("/");
  const route = rel === "" ? "/" : `/${rel}/`;
  return { route, html: readFileSync(file, "utf8") };
});

const titles = new Map();
const descriptions = new Map();
const rows = [];
let indexable = 0;

for (const { route, html } of pages) {
  /* Next.js 404 export lives at out/404.html, not index.html; the dynamic
     chunk directories ([slug]) never contain index.html. */
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : html;

  const robots = metaContent(head, "name", "robots");
  const noindex = robots.some((v) => /noindex/i.test(v));
  const allowedNoindex = NOINDEX_ALLOWED.some((re) => re.test(route));
  if (noindex && !allowedNoindex) fail(route, `noindex on a public route (${robots.join(" | ")})`);
  if (!noindex && route.startsWith("/insights/wiki/")) fail(route, "private Wiki gate is indexable");
  if (!noindex && route.startsWith("/admin-controlpanel/")) fail(route, "admin console is indexable");

  const titleTags = head.match(/<title>([\s\S]*?)<\/title>/gi) || [];
  const title = titleTags.length ? decode(titleTags[0].replace(/<\/?title>/gi, "")).trim() : "";
  const descs = metaContent(head, "name", "description");
  const canonicals = [...head.matchAll(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/g)].map((m) => decode(m[1]));
  const ogTitle = metaContent(head, "property", "og:title")[0];
  const ogDesc = metaContent(head, "property", "og:description")[0];
  const ogUrl = metaContent(head, "property", "og:url")[0];
  const ogImage = metaContent(head, "property", "og:image")[0];
  const twitterCard = metaContent(head, "name", "twitter:card")[0];
  const h1s = (html.match(/<h1[\s>]/g) || []).length;

  rows.push({ route, title, description: descs[0] || "", noindex });

  if (noindex) continue; // the contract below is for pages we WANT indexed
  indexable++;

  if (titleTags.length !== 1) fail(route, `${titleTags.length} <title> tags`);
  if (title.length < 10 || title.length > 70) warn(route, `title length ${title.length}: "${title}"`);
  if (titles.has(title)) fail(route, `duplicate title (also ${titles.get(title)}): "${title}"`);
  titles.set(title, route);

  if (descs.length !== 1) fail(route, `${descs.length} meta descriptions`);
  const desc = descs[0] || "";
  if (desc.length < 50 || desc.length > 320) warn(route, `description length ${desc.length}`);
  if (descriptions.has(desc)) fail(route, `duplicate description (also ${descriptions.get(desc)})`);
  descriptions.set(desc, route);

  if (canonicals.length !== 1) fail(route, `${canonicals.length} canonical tags`);
  const canonical = canonicals[0] || "";
  const expected = `${SITE}${route}`;
  if (canonical !== expected) fail(route, `canonical "${canonical}" ≠ "${expected}"`);

  if (!ogTitle) fail(route, "no og:title");
  if (!ogDesc) fail(route, "no og:description");
  /* A missing og:url falls back to the fetched URL on every network; a WRONG
     one claims the page is a different page. */
  if (!ogUrl) warn(route, "no og:url (networks fall back to the page URL)");
  else if (ogUrl !== expected) fail(route, `og:url "${ogUrl}" ≠ canonical`);
  if (!ogImage) fail(route, "no og:image");
  else if (!assetExists(ogImage)) fail(route, `og:image missing from export: ${ogImage}`);
  if (!twitterCard) warn(route, "no twitter:card");

  if (h1s !== 1) fail(route, `${h1s} <h1> elements`);

  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (blocks.length === 0) warn(route, "no JSON-LD");
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw);
    } catch (error) {
      fail(route, `JSON-LD does not parse: ${error.message}`);
      continue;
    }
    const nodes = Array.isArray(data) ? data : [data];
    for (const node of nodes) {
      if (!node["@context"]) fail(route, "JSON-LD node without @context");
      if (!node["@type"] && !node["@graph"]) fail(route, "JSON-LD node without @type");
      const types = JSON.stringify(node);
      /* Nothing in this repository documents a rating, review, price or
         certification; markup that claims one is invented. */
      for (const forbidden of ["aggregateRating", "\"review\"", "\"offers\"", "hasCredential", "award"]) {
        if (types.includes(forbidden)) fail(route, `JSON-LD asserts undocumented ${forbidden.replace(/"/g, "")}`);
      }
    }
  }
}

/* Site-level files. */
const sitemapPath = path.join(OUT, "sitemap.xml");
const robotsPath = path.join(OUT, "robots.txt");
if (!existsSync(sitemapPath)) fail("/sitemap.xml", "missing");
else {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (locs.some((loc) => loc.includes("/insights/wiki"))) fail("/sitemap.xml", "lists the private Wiki");
  if (locs.some((loc) => loc.includes("/admin-controlpanel"))) fail("/sitemap.xml", "lists the admin console");
  for (const loc of locs) {
    if (!loc.startsWith(SITE)) fail("/sitemap.xml", `foreign host: ${loc}`);
    if (!loc.endsWith("/")) fail("/sitemap.xml", `no trailing slash: ${loc}`);
    const route = loc.slice(SITE.length);
    const page = pages.find((p) => p.route === route);
    if (!page) fail("/sitemap.xml", `lists a route that was not exported: ${route}`);
    else if (/<meta name="robots" content="[^"]*noindex/.test(page.html)) fail("/sitemap.xml", `lists a noindex route: ${route}`);
  }
  const indexableRoutes = pages.filter((p) => !/<meta name="robots" content="[^"]*noindex/.test(p.html)).map((p) => p.route);
  const locRoutes = new Set(locs.map((l) => l.slice(SITE.length)));
  for (const route of indexableRoutes) {
    if (!locRoutes.has(route) && !/^\/(404|insights\/page|insights\/topic\/[^/]+\/page|publications\/[^/]+)\//.test(route)) {
      warn("/sitemap.xml", `indexable route not listed: ${route}`);
    }
  }
  console.log(`sitemap.xml: ${locs.length} URLs`);
}
if (!existsSync(robotsPath)) fail("/robots.txt", "missing");
else {
  const robots = readFileSync(robotsPath, "utf8");
  if (!/Sitemap:\s*https:\/\/gaitai\.in\/sitemap\.xml/.test(robots)) fail("/robots.txt", "does not advertise the sitemap");
  if (/Disallow:\s*\/\s*$/m.test(robots)) fail("/robots.txt", "disallows the whole site");
  if (!/Disallow:\s*\/admin-controlpanel\//.test(robots)) warn("/robots.txt", "admin console not disallowed");
}

if (REPORT) {
  console.log("\nroute\ttitle\tdescription");
  for (const row of rows.sort((a, b) => a.route.localeCompare(b.route))) {
    console.log(`${row.route}${row.noindex ? " (noindex)" : ""}\t${row.title}\t${row.description}`);
  }
}

console.log(`\nchecked ${pages.length} pages (${indexable} indexable)`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log("SEO contract holds.");
