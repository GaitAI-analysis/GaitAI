/**
 * site:doctor — does the LIVE site match what this repository says?
 *
 *   npm run site:doctor
 *   npm run site:doctor -- --local     (check the built out/ instead)
 *
 * WHY THIS EXISTS. Three separate rounds of corrections have been reported as
 * "still showing on the live site" when the repository was already clean and
 * the fix had already deployed. Reading the source cannot settle that, and
 * neither can a browser with a warm cache. This fetches the deployed HTML for
 * every public route and counts the exact strings that are supposed to be
 * gone — so "is it live yet" becomes a command instead of an argument.
 *
 * It checks four things the repo genuinely cannot see:
 *
 *   1. Forbidden wording in the SERVED html, hidden DOM and JSON-LD included.
 *   2. Which public routes actually exist in production.
 *   3. Whether the contact addresses the legal pages publish can receive mail
 *      — a privacy policy naming a mailbox with no MX record is a dead
 *      data-subject channel, and nothing in the codebase can reveal that.
 *   4. Whether the article view counters are readable by an anonymous
 *      visitor (the detail lives in journal:doctor; this reports the verdict).
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const useLocal = args.includes("--local");
const BASE = "https://gaitai.in";

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
};
const PASS = C.ok("PASS");
const FAIL = C.bad("FAIL");
const WARN = C.warn("WARN");
let failures = 0;

const line = (m, label, detail) =>
  console.log(`  ${m}  ${label}${detail ? "  " + C.dim(detail) : ""}`);
const fail = (label, detail) => {
  failures += 1;
  line(FAIL, label, detail);
};

/* Every public route, in the order the checklist lists them. */
const ROUTES = [
  "/", "/products/", "/mobilitycare/", "/securevision/", "/use-cases/",
  "/research/", "/research/evidence/", "/research/talks/", "/publications/",
  "/insights/", "/movement-lab/", "/gaitscape/", "/labs/", "/labs/dataset/",
  "/labs/biometrics/", "/investors/", "/trust/",
  "/legal/privacy/", "/legal/terms/", "/legal/security/",
  "/legal/responsible-ai/",
];

/* Routes that have been requested but are not built. Listed so the report
   says "not implemented" rather than silently passing. */
const PLANNED = [
  "/evidence/", "/developers/", "/reports/", "/signals/", "/glossary/",
  "/compare/", "/solution-builder/", "/releases/",
];

/*
 * Wording that must not appear on any public page.
 *
 * "synthetic data" is the one with a carve-out: it is a legitimate phrase
 * inside a cited paper title, so a hit is reported with its surrounding text
 * and judged rather than assumed wrong. A title must not be falsified to
 * satisfy this check.
 *
 * The rule is about claiming a RESULT rests on synthetic data. Saying plainly
 * that a demo's figures are invented — as sample-outputs.ts and the
 * illustrative badges do — is the thing the site is supposed to do, and is
 * not what this pattern is looking for.
 */
const FORBIDDEN = [
  ["synthetic data", /synthetic[ _\-]?(?:data|values|dataset)/gi],
  ["17 deployments", /17\s+deployments/gi],
  ['"where X is deployed"', /where\s+\w+\s+is\s+deployed/gi],
  ["23 shipped products", /23\s+shipped/gi],
  ["clinical-grade", /clinical[\s\-]grade/gi],
  ["research-validated", /research[\s\-]validated/gi],
  ["98.7%", /98\.7\s*%/gi],
  ["<40 ms", /[<]\s*40\s*ms\b/gi],
  ["industry-leading", /industry[\s\-]leading/gi],
  ["best-in-class", /best[\s\-]in[\s\-]class/gi],
  ["trusted by", /trusted\s+by/gi],
  ["duplicated brand title", /\| GaitAI \| GaitAI/gi],
  ["editorial section called Insights", />\s*Insights\s*</gi],
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "gaitai-site-doctor" } });
  return { status: res.status, text: res.status === 200 ? await res.text() : "" };
}

function localHtml(route) {
  const p = join(root, "out", route.replace(/^\//, ""), "index.html");
  const q = join(root, "out", route === "/" ? "index.html" : "");
  const file = existsSync(p) ? p : existsSync(q) ? q : null;
  return file ? { status: 200, text: readFileSync(file, "utf8") } : { status: 404, text: "" };
}

console.log();
console.log(C.b(useLocal ? "  GaitAI · site doctor (local out/)" : "  GaitAI · site doctor (LIVE)"));
console.log(C.dim(`  ${useLocal ? join(root, "out") : BASE}`));

/* ── 1 · Routes ─────────────────────────────────────────────────────────── */
console.log("\n" + C.b("  1 · Public routes"));
const pages = new Map();
for (const route of ROUTES) {
  const r = useLocal ? localHtml(route) : await fetchText(BASE + route);
  pages.set(route, r.text);
  if (r.status === 200) line(PASS, route, `${Math.round(r.text.length / 1024)} KB`);
  else fail(route, `HTTP ${r.status}`);
}

console.log("\n" + C.b("  2 · Requested but not built"));
for (const route of PLANNED) {
  const r = useLocal ? localHtml(route) : await fetchText(BASE + route);
  if (r.status === 200) line(PASS, route, "now live");
  else line(WARN, route, "not implemented");
}

/* ── 3 · Forbidden wording ──────────────────────────────────────────────── */
console.log("\n" + C.b("  3 · Wording that must not be public"));
const hits = new Map();
for (const [route, html] of pages) {
  for (const [label, rx] of FORBIDDEN) {
    const found = html.match(rx);
    if (found) {
      if (!hits.has(label)) hits.set(label, []);
      hits.get(label).push(`${route} x${found.length}`);
    }
  }
}
for (const [label] of FORBIDDEN) {
  const where = hits.get(label);
  if (!where) line(PASS, label, "0 occurrences");
  else fail(label, where.join(", "));
}
if (hits.has("synthetic data")) {
  console.log(
    C.dim("      note: check each hit — the phrase is legitimate inside a cited\n" +
          "      paper title, and a title must not be falsified to satisfy this."),
  );
}

/* ── 4 · Contact addresses ──────────────────────────────────────────────── */
console.log("\n" + C.b("  4 · Can the published contact addresses receive mail?"));
/* Form placeholders are not contact channels — `you@org.com` is the hint
   text in the contact form's email field, and reporting it as a published
   address makes the real finding harder to see. */
const PLACEHOLDER = /^(you|name|first\.last|email|user)@(org|example|domain|company)\./i;
const addresses = new Set();
for (const html of pages.values()) {
  for (const m of html.matchAll(/[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) {
    const a = m[0].toLowerCase();
    if (!a.startsWith("@") && !PLACEHOLDER.test(a)) addresses.add(a);
  }
}
const domains = new Set([...addresses].map((a) => a.split("@")[1]));
for (const domain of domains) {
  let mx = [];
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      headers: { accept: "application/dns-json" },
    });
    const d = await res.json();
    mx = (d.Answer ?? []).map((a) => a.data);
  } catch {
    line(WARN, domain, "MX lookup failed (offline?)");
    continue;
  }
  const users = [...addresses].filter((a) => a.endsWith("@" + domain)).sort();
  if (mx.length) line(PASS, `${domain} accepts mail`, `${mx.length} MX · ${users.join(", ")}`);
  else {
    fail(
      `${domain} has NO MX record`,
      `${users.join(", ")} cannot receive email`,
    );
    console.log(
      C.warn("      ▸ These addresses are published as contact channels, and the\n") +
      C.warn("        privacy policy names one for data-subject requests. Either\n") +
      C.warn("        add an MX record / mail forwarder for the domain, or replace\n") +
      C.warn("        them with an address that is actually monitored."),
    );
  }
}

/* ── 5 · Article view counters ──────────────────────────────────────────── */
console.log("\n" + C.b("  5 · Article view counters (anonymous read)"));
const envPath = join(root, ".env.local");
const fileEnv = {};
if (existsSync(envPath)) {
  for (const l of readFileSync(envPath, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) fileEnv[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fileEnv.NEXT_PUBLIC_FIREBASE_API_KEY;
const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fileEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!key || !project) {
  line(WARN, "skipped", "no NEXT_PUBLIC_FIREBASE_* in env");
} else {
  const url =
    `https://firestore.googleapis.com/v1/projects/${project}` +
    `/databases/(default)/documents/articleStats?pageSize=1&key=${key}`;
  const res = await fetch(url);
  if (res.ok) line(PASS, "articleStats is publicly readable", "counters will render");
  else {
    const body = await res.json().catch(() => ({}));
    const code = body?.error?.status ?? res.status;
    fail("articleStats is publicly readable", `${code}`);
    console.log(
      C.warn("      ▸ Not a code fault. The deployed Firestore rules predate the\n") +
      C.warn("        counter. Run: npm run rules:login && npm run deploy:rules\n") +
      C.warn("        Then: npm run journal:doctor"),
    );
  }
}

console.log();
if (failures) {
  console.log(C.bad(`  ${failures} check(s) failed.`));
  process.exit(1);
}
console.log(C.ok("  Live site matches the repository on every checked item.\n"));
