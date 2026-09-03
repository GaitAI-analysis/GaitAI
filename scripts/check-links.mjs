#!/usr/bin/env node
/**
 * INTERNAL LINK CHECKER
 * =============================================================================
 * Crawls the built static export in `out/` and verifies that every internal
 * href resolves to a file the host will actually serve. On a static export a
 * broken internal link is a hard 404 for a real visitor, and nothing in the
 * build catches it — `next build` happily emits a link to a route that does not
 * exist.
 *
 * WHAT IT CHECKS
 *   · every internal href resolves to out/<path>/index.html (or a real file)
 *   · trailing-slash consistency, since next.config sets trailingSlash: true
 *     and a missing slash costs a redirect on most hosts
 *   · local asset references (src / poster / href to /assets, /brand, …)
 *   · empty, "#", and javascript: hrefs
 *
 * WHAT IT DOES NOT DO
 *   External links are collected and counted but never fetched, so the check
 *   is offline, deterministic and safe in CI. Verifying them needs the network
 *   and would make the build flaky.
 *
 *   node scripts/check-links.mjs
 * =============================================================================
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");

if (!existsSync(OUT)) {
  console.error("out/ not found — run `npm run build` first.");
  process.exit(1);
}

/** Every built HTML page. */
function htmlFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) htmlFiles(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

const pages = htmlFiles(OUT);
const problems = [];
const warnings = [];
let internalChecked = 0;
let externalSeen = 0;
const assetsChecked = new Set();

/** Does this internal path exist in the export? */
function resolves(p) {
  // Next emits dynamic-route chunk paths percent-encoded ("%5Bslug%5D"); on
  // disk they are literal "[slug]" directories, so decode before resolving.
  const clean = decodeURIComponent(p.split(/[?#]/)[0]);
  if (clean === "/" || clean === "") return existsSync(path.join(OUT, "index.html"));
  const rel = clean.replace(/^\//, "");
  const asDir = path.join(OUT, rel, "index.html");
  const asFile = path.join(OUT, rel);
  if (existsSync(asDir)) return true;
  if (existsSync(asFile) && statSync(asFile).isFile()) return true;
  // /foo -> foo.html (Next emits this shape for some routes)
  if (existsSync(path.join(OUT, `${rel}.html`))) return true;
  return false;
}

/** Route-ish (needs trailing slash) vs file-ish (has an extension). */
// Long extensions count too — ".webmanifest" is a file, not a route, and
// treating it as one produced a trailing-slash warning on every page.
const hasExtension = (p) => /\.[a-z0-9]{2,12}$/i.test(p.split(/[?#]/)[0]);

for (const file of pages) {
  const rel = path.relative(OUT, file).replace(/\\/g, "/");
  const html = readFileSync(file, "utf8");

  // href on anchors/links, plus src/poster on media.
  const refs = [
    ...html.matchAll(/\shref="([^"]*)"/g),
    ...html.matchAll(/\ssrc="([^"]*)"/g),
    ...html.matchAll(/\sposter="([^"]*)"/g),
  ].map((m) => m[1]);

  for (const raw of refs) {
    const href = raw.trim();

    if (!href) {
      problems.push(`${rel}: empty href/src`);
      continue;
    }
    if (href.startsWith("javascript:")) {
      problems.push(`${rel}: javascript: URL "${href}"`);
      continue;
    }
    if (href === "#") {
      warnings.push(`${rel}: bare "#" href`);
      continue;
    }
    // In-page anchors, data URIs, protocol-relative and absolute externals.
    if (href.startsWith("#") || href.startsWith("data:") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (/^https?:\/\//i.test(href) || href.startsWith("//")) {
      externalSeen += 1;
      continue;
    }
    if (!href.startsWith("/")) continue; // relative — Next emits absolute

    if (hasExtension(href)) {
      // A local asset. Check once; a missing one is a broken image or video.
      if (!assetsChecked.has(href)) {
        assetsChecked.add(href);
        if (!resolves(href)) problems.push(`missing asset: ${href}  (first seen in ${rel})`);
      }
      continue;
    }

    internalChecked += 1;
    if (!resolves(href)) {
      problems.push(`${rel}: broken internal link "${href}"`);
    } else if (!href.endsWith("/") && !href.includes("#") && !href.includes("?")) {
      // trailingSlash: true is configured, so a slashless route link costs a
      // redirect for every visitor who follows it.
      warnings.push(`${rel}: "${href}" is missing its trailing slash`);
    }
  }
}

const line = "─".repeat(72);
console.log(`\n${line}\nInternal link check\n${line}`);
console.log(
  `  ${pages.length} pages · ${internalChecked} internal links · ` +
    `${assetsChecked.size} distinct local assets · ${externalSeen} external (not fetched)`,
);

// Collapse repeats — one missing asset referenced on 70 pages is one problem.
const uniq = (list) => [...new Set(list)];
const p = uniq(problems);
const w = uniq(warnings);

if (w.length) {
  console.log(`\n  ${w.length} warning(s)`);
  for (const item of w.slice(0, 25)) console.log(`    · ${item}`);
  if (w.length > 25) console.log(`    … and ${w.length - 25} more`);
}

if (p.length) {
  console.log(`\n  ${p.length} PROBLEM(S)`);
  for (const item of p) console.log(`    ✗ ${item}`);
  console.log(`\n${line}\nFAILED\n${line}\n`);
  process.exit(1);
}

console.log(`\n${line}\nPASSED — every internal link and local asset resolves.\n${line}\n`);
