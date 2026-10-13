#!/usr/bin/env node
/**
 * INDEXNOW SUBMISSION
 * =============================================================================
 * Tells IndexNow-participating search engines (Bing, Yandex, Seznam, Naver —
 * not Google, which has no submission API outside Search Console) which
 * public URLs changed, so they recrawl them within hours instead of weeks.
 * Free, keyless beyond the file this site already hosts, and idempotent: a
 * URL that did not change is simply recrawled.
 *
 *   npm run seo:indexnow                 # every URL in the LIVE sitemap
 *   npm run seo:indexnow -- /securevision/ /mobilitycare/   # just these
 *   npm run seo:indexnow -- --dry-run    # print the payload, send nothing
 *
 * HOW OWNERSHIP IS PROVED. IndexNow verifies the host by fetching
 * https://gaitai.in/<key>.txt and expecting the key as its body. The key file
 * lives in public/ and is part of the deploy; this script reads the key from
 * that file, so there is one copy and it cannot drift. The key is public by
 * design — it authorises nothing except "please recrawl this host".
 *
 * RUN AFTER A DEPLOY IS LIVE, never before: the engine fetches the key file
 * and the URLs immediately, and a URL that 404s at that moment is a wasted
 * submission.
 * =============================================================================
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SITE = "https://gaitai.in";
const ENDPOINT = "https://api.indexnow.org/indexnow";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const requested = args.filter((a) => a.startsWith("/"));

const keyFile = readdirSync(path.resolve("public")).find((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (!keyFile) {
  console.error("No IndexNow key file (public/<32 hex>.txt). See docs/seo.md.");
  process.exit(1);
}
const key = readFileSync(path.resolve("public", keyFile), "utf8").trim();
if (key !== keyFile.replace(/\.txt$/, "")) {
  console.error(`Key file ${keyFile} does not contain its own name.`);
  process.exit(1);
}

async function liveSitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml → HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

const urlList = requested.length ? requested.map((p) => `${SITE}${p}`) : await liveSitemapUrls();
/* The private Wiki gate and the admin console are never submitted, whatever
   the caller passed. */
const urls = urlList.filter((u) => !u.includes("/insights/wiki") && !u.includes("/admin-controlpanel"));

/* Confirm the engine will be able to verify us before asking it to. */
const keyCheck = await fetch(`${SITE}/${keyFile}`);
const keyBody = keyCheck.ok ? (await keyCheck.text()).trim() : "";
if (keyBody !== key) {
  console.error(`Key file is not live yet: ${SITE}/${keyFile} → HTTP ${keyCheck.status}. Deploy first.`);
  process.exit(1);
}

const payload = { host: "gaitai.in", key, keyLocation: `${SITE}/${keyFile}`, urlList: urls };
console.log(`${urls.length} URL(s)${dryRun ? " (dry run)" : ""}`);
for (const u of urls) console.log(`  ${u}`);
if (dryRun) process.exit(0);

const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});
/* 200 OK, 202 Accepted (key not yet verified — it will be on fetch). Anything
   else is a problem with the key file or the host. */
console.log(`IndexNow → HTTP ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
