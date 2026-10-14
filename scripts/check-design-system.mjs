#!/usr/bin/env node
/**
 * THE DESIGN-SYSTEM GUARD — every page is one GaitAI website.
 *
 * Fails when a stylesheet or component brings its own visual identity
 * instead of the site's (docs/design-system.md):
 *
 *   colour   a hex / rgb() / hsl() / oklch() literal or `white`/`black` in a
 *            component stylesheet — colours come from `--ui-*` or the
 *            semantic tokens in globals.css / light-theme.css;
 *   font     a `font-family` that is not `var(--ui-font-*)`, `var(--font-*)`
 *            or `inherit`, or a `next/font` import outside app/layout.tsx;
 *   theme    `:global(.dark)` — the site's light branch is `:root.light`;
 *            a module that flips on `.dark` is a light-first palette.
 *
 * The token owners (globals.css, light-theme.css, interactions.css,
 * mobile.css, design-system.css) are exempt. Stylesheets that predate the
 * guard are held at their 2026-10-14 counts by scripts/design-system-baseline.json:
 * a count may go down, never up, and a file not in the baseline must be clean.
 *
 *   node scripts/check-design-system.mjs            check
 *   node scripts/check-design-system.mjs --report   per-file counts
 *   node scripts/check-design-system.mjs --lower    rewrite the baseline with
 *                                                   counts that went DOWN only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");
const baselinePath = path.join(root, "scripts", "design-system-baseline.json");
const TOKEN_OWNERS = new Set([
  "src/app/globals.css",
  "src/app/light-theme.css",
  "src/app/interactions.css",
  "src/app/mobile.css",
  "src/app/design-system.css",
]);
const FONT_OWNER = "src/app/layout.tsx";

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (f) => path.relative(root, f).split(path.sep).join("/");
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const COLOUR = [
  /#[0-9a-fA-F]{3,8}\b/g,
  /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(\s*[-\d.]/g,
  /:\s*(?:white|black)\s*[;}]/g,
];
const FONT_DECL = /font-family\s*:\s*([^;}]+)/g;
const FONT_OK = /^\s*(?:var\(--(?:ui-font|font)-[\w-]+\)|inherit)(?![\w-])/;
const DARK_FLIP = /:global\(\s*\.dark\s*\)/g;

function measureCss(text) {
  const css = stripComments(text);
  let colours = 0;
  for (const re of COLOUR) colours += (css.match(re) || []).length;
  let fonts = 0;
  for (const m of css.matchAll(FONT_DECL)) if (!FONT_OK.test(m[1])) fonts += 1;
  const darkFlips = (css.match(DARK_FLIP) || []).length;
  return { colours, fonts, darkFlips };
}

const files = walk(src);
const results = {};
for (const f of files) {
  const r = rel(f);
  if (r.endsWith(".css") && !TOKEN_OWNERS.has(r)) {
    const m = measureCss(fs.readFileSync(f, "utf8"));
    if (m.colours || m.fonts || m.darkFlips) results[r] = m;
  }
  if (/\.(tsx?|jsx?|mjs)$/.test(r) && r !== FONT_OWNER) {
    const text = fs.readFileSync(f, "utf8");
    const imports = (text.match(/from\s+["']next\/font\/(?:google|local)["']/g) || []).length;
    if (imports) results[r] = { ...(results[r] || { colours: 0, fonts: 0, darkFlips: 0 }), fontImports: imports };
  }
}

const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, "utf8")).files : {};
const args = new Set(process.argv.slice(2));

if (args.has("--report")) {
  for (const [f, m] of Object.entries(results).sort()) console.log(f, JSON.stringify(m), baseline[f] ? "(baseline)" : "(NEW)");
}

const failures = [];
const lowered = {};
for (const [f, m] of Object.entries(results)) {
  const b = baseline[f] || { colours: 0, fonts: 0, darkFlips: 0, fontImports: 0 };
  for (const key of ["colours", "fonts", "darkFlips", "fontImports"]) {
    const now = m[key] || 0;
    const allowed = b[key] || 0;
    if (now > allowed) failures.push(`${f}: ${now} ${key} (allowed ${allowed})`);
  }
}
for (const [f, b] of Object.entries(baseline)) {
  const m = results[f] || { colours: 0, fonts: 0, darkFlips: 0, fontImports: 0 };
  const next = {};
  let lower = false;
  for (const key of ["colours", "fonts", "darkFlips", "fontImports"]) {
    const now = Math.min(m[key] || 0, b[key] || 0);
    if (b[key] !== undefined || now) next[key] = now;
    if (now < (b[key] || 0)) lower = true;
  }
  if (lower) lowered[f] = next;
}

if (args.has("--lower") && Object.keys(lowered).length) {
  const doc = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  for (const [f, next] of Object.entries(lowered)) {
    if (Object.values(next).every((v) => !v)) delete doc.files[f];
    else doc.files[f] = next;
  }
  fs.writeFileSync(baselinePath, JSON.stringify(doc, null, 2) + "\n");
  console.log(`check:design-system: baseline lowered for ${Object.keys(lowered).length} file(s).`);
}

if (failures.length) {
  console.error("check:design-system FAILED — a page is bringing its own visual identity.\n");
  for (const line of failures) console.error("  " + line);
  console.error(
    "\nUse the site's tokens and classes instead: --ui-* (src/app/design-system.css), .btn-primary /" +
      "\n.btn-ghost, .card, .eyebrow, .pill; fonts via var(--ui-font-*); light via :root.light." +
      "\nSee docs/design-system.md. Do not raise the baseline to make this pass.",
  );
  process.exit(1);
}
const legacy = Object.keys(baseline).length;
console.log(
  `check:design-system: OK — no new colours, fonts or theme flips outside the tokens (${legacy} legacy file(s) held at their baseline).`,
);
if (!args.has("--lower") && Object.keys(lowered).length) {
  console.log(`  ${Object.keys(lowered).length} legacy file(s) are below baseline — run with --lower to ratchet it down.`);
}
