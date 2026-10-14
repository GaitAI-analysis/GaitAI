#!/usr/bin/env node
/**
 * NO PRICING ON THE PUBLIC SITE — founder decision, 2026-10-14.
 *
 * The website is product discovery and APK download. Plans, prices, taxes
 * and payment live inside the MobilityCare and SecureVision Android apps
 * (served by the billing Worker's catalogue). This check fails the build if
 * any exported page — or the Ask GaitAI corpus — prints an app price, a plan
 * discount, a subscribe/checkout call to action, or structured-data offers.
 *
 *   node scripts/check-no-pricing.mjs            # against out/
 *   GAITAI_AUDIT_OUT=path node scripts/check-no-pricing.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const OUT = path.resolve(process.env.GAITAI_AUDIT_OUT || "out");
if (!existsSync(OUT)) {
  console.error("out/ not found — run `npm run build` first.");
  process.exit(1);
}

/* Every plan price the billing Worker sells, monthly and per-month-of-annual,
   with or without the rupee sign; the discount line; the calls to action. */
const FORBIDDEN = [
  [/₹\s?(999|1,499|9,590|14,390|799\.20|1,199\.20)\b/, "an app plan price"],
  [/\b(9,590\.40|14,390\.40|959040|1439040|99900|149900)\b/, "an app plan amount"],
  [/save\s+20\s?%/i, "the annual discount"],
  [/\b20% annual saving\b/i, "the annual discount"],
  [/\bsubscribe now\b/i, "a subscribe call to action"],
  [/"offers"\s*:/, "structured-data offers"],
  [/\/v1\/checkout/, "the billing checkout endpoint"],
];

/* The private Wiki is not public and has its own content rules. */
const SKIP = [/^insights[\\/]wiki[\\/]/];

function files(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files(full, acc);
    else if (/\.(html|txt|json)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const problems = [];
let scanned = 0;
for (const file of files(OUT)) {
  const rel = path.relative(OUT, file);
  if (SKIP.some((re) => re.test(rel))) continue;
  /* JSON: only the Ask corpus and config — other JSON is media manifests. */
  if (rel.endsWith(".json") && !/^ask[\\/]/.test(rel)) continue;
  scanned++;
  const text = readFileSync(file, "utf8");
  for (const [re, what] of FORBIDDEN) {
    const m = text.match(re);
    if (m) problems.push(`${rel}  ${what}: "${text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 40).replace(/\s+/g, " ")}"`);
  }
}

if (problems.length) {
  console.error(`check-no-pricing: ${problems.length} problem(s) in ${scanned} files\n` + problems.map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}
console.log(`check-no-pricing: ${scanned} files, no app pricing on the public site.`);
