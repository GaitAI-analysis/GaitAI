/**
 * journal:doctor — why is an article's view count not showing?
 *
 *   npm run journal:doctor
 *   npm run journal:doctor -- from-walking-video-to-movement-intelligence
 *   npm run journal:doctor -- --live      (also read the deployed page's DOM)
 *
 * WHY THIS EXISTS. The view counter was implemented correctly and shipped
 * three times, and the live page still showed nothing, because the failure is
 * not in the code — it is in the deployed Firestore security rules, which are
 * not in the repository and which no build, lint, typecheck or diff can see.
 * Reading the source can never find that. Asking the live database can, and
 * that is all this script does.
 *
 * IT TALKS TO PRODUCTION, ANONYMOUSLY, OVER REST. No Firebase SDK, no login,
 * no admin credentials: it sends exactly the request a visitor's browser
 * sends, with the same public web API key, so a PASS here means a real
 * visitor can read the counter. The distinction it exists to draw:
 *
 *   403 PERMISSION_DENIED → the rules reject the read. Nothing to do with the
 *                           document, the slug, or the component.
 *   404 NOT_FOUND         → the read was ALLOWED. The document simply does
 *                           not exist yet, which is the normal state before
 *                           the first view, and displays as "0 views".
 *   200                   → allowed and present; the actual counter is shown.
 *
 * Those three are indistinguishable in the browser, which is why every
 * previous attempt guessed.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const wantLive = args.includes("--live");
const only = args.filter((a) => !a.startsWith("--"));

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
const line = (mark, label, detail) =>
  console.log(`  ${mark}  ${label}${detail ? "  " + C.dim(detail) : ""}`);
const fail = (label, detail) => {
  failures += 1;
  line(FAIL, label, detail);
};

/* ── The same config the client gets ───────────────────────────────────── */
const fileEnv = {};
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  for (const l of readFileSync(envPath, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) fileEnv[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const env = (k) => process.env[k] || fileEnv[k] || "";
const apiKey = env("NEXT_PUBLIC_FIREBASE_API_KEY");
const projectId = env("NEXT_PUBLIC_FIREBASE_PROJECT_ID");

/* ── The slugs, from the one source the pages are generated from ───────── */
const { insightArticles } = await import("../src/data/insights.ts");

const COLLECTION = "articleStats"; // must match src/lib/article-stats.ts
const DOCS = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

async function rest(path, body) {
  const url = `${DOCS}${path}${path.includes("?") ? "&" : "?"}key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    const err = Array.isArray(json) ? json[0]?.error : json?.error;
    return { status: res.status, json, code: err?.status, message: err?.message };
  } catch (e) {
    return { status: 0, message: `network: ${e.message}` };
  }
}

const intOf = (doc, field) => {
  const v = doc?.fields?.[field];
  if (!v) return null;
  return v.integerValue !== undefined ? Number(v.integerValue) : null;
};

console.log();
console.log(C.b("  GaitAI Journal · stats doctor"));
console.log(
  C.dim(
    `  project ${projectId || "(unset)"} · collection ${COLLECTION} · ` +
      `key ${apiKey ? apiKey.slice(0, 8) + "…" : "(unset)"}`,
  ),
);

/* ── 1 · Config ────────────────────────────────────────────────────────── */
console.log("\n" + C.b("  1 · Client configuration"));
if (!apiKey || !projectId) {
  fail(
    "NEXT_PUBLIC_FIREBASE_* present",
    "copy .env.example to .env.local — without these the client cannot read anything",
  );
  process.exit(1);
}
line(PASS, "NEXT_PUBLIC_FIREBASE_API_KEY / _PROJECT_ID present");

/* ── 2 · Is the rules deployment current? ──────────────────────────────── */
console.log("\n" + C.b("  2 · Deployed Firestore rules (the usual culprit)"));

const commentsProbe = await rest(":runQuery", {
  structuredQuery: {
    from: [{ collectionId: "comments" }],
    where: {
      fieldFilter: {
        field: { fieldPath: "hidden" },
        op: "EQUAL",
        value: { booleanValue: false },
      },
    },
    limit: 1,
  },
});
if (commentsProbe.status === 200) {
  line(PASS, "comments are publicly readable", "so Firestore is reachable and some rules are live");
} else {
  line(WARN, "comments are NOT readable", `${commentsProbe.code || commentsProbe.status} — the whole rules file may be stale`);
}

const statsList = await rest(`/${COLLECTION}?pageSize=1`);
let rulesLive = false;
if (statsList.status === 200) {
  rulesLive = true;
  line(PASS, `${COLLECTION} is publicly readable`, "the deployed rules include the block");
} else if (statsList.code === "PERMISSION_DENIED") {
  fail(
    `${COLLECTION} is publicly readable`,
    "PERMISSION_DENIED — the deployed rules do NOT contain the articleStats block",
  );
  console.log();
  console.log(C.warn("      ▸ THIS IS THE FIX, AND IT IS NOT A CODE CHANGE:"));
  console.log(C.warn("          npm run rules:login     (once, opens a browser)"));
  console.log(C.warn("          npm run deploy:rules"));
  console.log(
    C.dim(
      "        (or paste firestore.rules into Firebase Console →\n" +
        "         Firestore Database → Rules → Publish). firestore.rules is\n" +
        "         correct in this repo; the live project is running an older\n" +
        "         copy of it that predates the counter.",
    ),
  );
} else {
  fail(`${COLLECTION} is publicly readable`, `${statsList.code || statsList.status} ${statsList.message || ""}`);
}

/* ── 3 · Per-article: key, document, value ─────────────────────────────── */
console.log("\n" + C.b("  3 · Per article: slug → document → views"));

const chosen = only.length
  ? insightArticles.filter((a) => only.includes(a.slug))
  : insightArticles;

if (only.length && chosen.length !== only.length) {
  const missing = only.filter((s) => !insightArticles.some((a) => a.slug === s));
  for (const m of missing) fail(`article "${m}" exists in src/data/insights.ts`, "unknown slug");
}

for (const article of chosen) {
  const slug = article.slug;
  console.log(`\n  ${C.b(slug)}`);
  line(PASS, "article exists", `Issue ${String(article.seriesStep).padStart(2, "0")} · ${article.date}`);
  /* The document id IS the slug, with no prefix, no slash and no extension —
     the mismatch this script was asked to rule out. */
  line(PASS, "stats key", `${COLLECTION}/${slug}`);

  const doc = await rest(`/${COLLECTION}/${slug}`);
  if (doc.status === 200) {
    const views = intOf(doc.json, "views");
    const likes = intOf(doc.json, "likes");
    line(PASS, "stats document exists", `views=${views} likes=${likes}`);
    if (views === null) fail("views is an integer", "field missing or wrong type");
    else line(PASS, "views readable by an anonymous visitor", `renders as "${views} views"`);
  } else if (doc.code === "NOT_FOUND") {
    line(PASS, "read allowed", "document not created yet — the first view creates it");
    line(PASS, "renders as", '"0 views" (explicit zero, not hidden)');
  } else if (doc.code === "PERMISSION_DENIED") {
    fail("views readable by an anonymous visitor", "PERMISSION_DENIED — see step 2");
  } else {
    fail("stats document readable", `${doc.code || doc.status} ${doc.message || ""}`);
  }

  const comments = await rest(":runQuery", {
    structuredQuery: {
      from: [{ collectionId: "comments" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            { fieldFilter: { field: { fieldPath: "slug" }, op: "EQUAL", value: { stringValue: slug } } },
            { fieldFilter: { field: { fieldPath: "hidden" }, op: "EQUAL", value: { booleanValue: false } } },
          ],
        },
      },
    },
  });
  if (comments.status === 200) {
    const n = (comments.json || []).filter((e) => e.document).length;
    line(PASS, "approved comment count reachable", `${n} approved`);
  } else {
    fail("approved comment count reachable", `${comments.code || comments.status}`);
  }
}

/* ── 4 · The increment path ────────────────────────────────────────────── */
console.log("\n" + C.b("  4 · View-increment path"));
const rules = existsSync(join(root, "firestore.rules"))
  ? readFileSync(join(root, "firestore.rules"), "utf8")
  : "";
const hasBlock = /match\s+\/articleStats\/\{/.test(rules);
const hasStep = /statsStepValid|delta/.test(rules);
line(hasBlock ? PASS : FAIL, "firestore.rules declares articleStats", hasBlock ? "" : "block missing from the local file");
if (!hasBlock) failures += 1;
line(hasStep ? PASS : WARN, "single-step increment guard present", hasStep ? "a client can only ask for +1" : "no delta guard found");
line(
  rulesLive ? PASS : FAIL,
  "guard is actually live",
  rulesLive ? "" : "the local file is right; the deployed copy is not — npm run deploy:rules",
);
if (!rulesLive) failures += 1;

/* ── 5 · Stale reader-facing metadata ──────────────────────────────────── */
console.log("\n" + C.b("  5 · Stale metadata in the article template"));
const tplRaw = readFileSync(join(root, "src/app/insights/[slug]/page.tsx"), "utf8");
/* Strip comments first. The template DOCUMENTS that `readMinutes` still
   exists as a record field, and matching that sentence reported a render that
   does not happen — a doctor that cries wolf is worse than none. */
const tpl = tplRaw
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
for (const [label, re] of [
  ['"min read" rendered', /min read/],
  ["readMinutes rendered", /\{\s*[^}]*\breadMinutes\b/],
  ["postType label rendered", /\{\s*(article\.)?postTypeLabel/],
]) {
  const hit = re.test(tpl);
  line(hit ? FAIL : PASS, label.replace(" rendered", " absent from the template"), hit ? "still present" : "");
  if (hit) failures += 1;
}
line(
  /articleSection: article\.category/.test(tpl) ? WARN : PASS,
  "category appears only as JSON-LD articleSection",
  "structured data for search engines — invisible to readers",
);

/* ── 6 · Optional: what the deployed page actually renders ─────────────── */
if (wantLive) {
  console.log("\n" + C.b("  6 · The deployed page's own markup"));
  for (const article of chosen) {
    const url = `https://gaitai.in/insights/${article.slug}/`;
    try {
      const html = await (await fetch(url)).text();
      const hasRow = /engagement_row__/.test(html);
      const minRead = /min read/.test(html);
      line(hasRow ? PASS : FAIL, `${article.slug} · engagement row is in the markup`, hasRow ? "" : "component not mounted on this template");
      if (!hasRow) failures += 1;
      line(minRead ? FAIL : PASS, `${article.slug} · no "min read"`, minRead ? "still deployed" : "");
      if (minRead) failures += 1;
    } catch (e) {
      fail(`${article.slug} · fetch ${url}`, e.message);
    }
  }
  console.log(
    C.dim(
      "\n  The number itself is fetched by the browser, so it is never in this\n" +
        "  HTML. Steps 2–3 are what prove a visitor can read it.",
    ),
  );
}

console.log();
if (failures) {
  console.log(C.bad(`  ${failures} check(s) failed.`));
  if (!rulesLive) {
    console.log(C.b("\n  ROOT CAUSE: the deployed Firestore rules predate the counter."));
    console.log(
      "  Run " + C.b("npm run rules:login") + " once, then " + C.b("npm run deploy:rules") + ",",
    );
    console.log("  then re-run this script. No source change will fix it.\n");
  }
  process.exit(1);
}
console.log(C.ok("  All checks passed — a visitor can read every counter.\n"));
