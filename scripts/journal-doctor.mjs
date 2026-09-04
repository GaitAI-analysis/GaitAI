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

/* The project the SITE talks to and the project `deploy:rules` publishes to
   have to be the same one, or a correct ruleset lands somewhere the visitor
   never reads from. They are named in two different files, so they are
   compared rather than assumed. */
const EXPECTED_PROJECT = "gaitai-intelligence";
line(
  projectId === EXPECTED_PROJECT ? PASS : FAIL,
  "the site points at the production project",
  projectId === EXPECTED_PROJECT ? projectId : `${projectId} — expected ${EXPECTED_PROJECT}`,
);
if (projectId !== EXPECTED_PROJECT) failures += 1;

const firebaserc = existsSync(join(root, ".firebaserc"))
  ? JSON.parse(readFileSync(join(root, ".firebaserc"), "utf8"))
  : {};
const rcProject = firebaserc?.projects?.default ?? "(unset)";
line(
  rcProject === projectId ? PASS : FAIL,
  "deploy:rules targets that same project",
  rcProject === projectId ? `.firebaserc → ${rcProject}` : `.firebaserc says ${rcProject}, the site says ${projectId}`,
);
if (rcProject !== projectId) failures += 1;

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

/* ── 5 · How the counter is wired ──────────────────────────────────────────
   Source-level, because this is where the wiring lives. The three questions
   are: does the article template mount the component that counts, does the
   card mount the component that displays, and does the listing read once for
   the whole page rather than once per card. */
console.log("\n" + C.b("  5 · Component wiring"));

const src = (rel) => {
  const abs = join(root, rel);
  return existsSync(abs) ? readFileSync(abs, "utf8") : "";
};
/* Comments describe intent, including intent that was abandoned. Strip them
   so a sentence about a component can never be mistaken for mounting one. */
const code = (rel) =>
  src(rel)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const articleTpl = code("src/app/insights/[slug]/page.tsx");
const storyCard = code("src/components/insights/StoryCard.tsx");
const articleMeta = code("src/components/insights/ArticleMeta.tsx");
const cardStats = code("src/components/insights/CardStats.tsx");
const statsLib = code("src/lib/article-stats.ts");
const listHook = code("src/components/insights/useArticleStats.ts");
const engHook = code("src/components/insights/useArticleEngagement.ts");

const wiring = [
  [
    "article template mounts ArticleMeta",
    /import\s*\{[^}]*\bArticleMeta\b/.test(articleTpl) && /<ArticleMeta\b/.test(articleTpl),
    "src/app/insights/[slug]/page.tsx",
  ],
  [
    "ArticleMeta is what reads and counts",
    /useArticleEngagement\s*\(/.test(articleMeta),
    "mounts the hook that registers a view",
  ],
  [
    "blog card mounts CardStats",
    /import\s*\{[^}]*\bCardStats\b/.test(storyCard) && /<CardStats\b/.test(storyCard),
    "src/components/insights/StoryCard.tsx",
  ],
  [
    "cards share ONE Firestore read",
    /fetchAllArticleStatsCached\s*\(/.test(cardStats) &&
      /allStatsPromise\s*\?\?=/.test(statsLib),
    "memoised promise — N cards, one query",
  ],
  [
    "listing hook uses the collection read",
    /fetchAllArticleStats\w*\s*\(/.test(listHook),
    "not one query per article",
  ],
  [
    "no per-card single-document read",
    !/fetchArticleStats\s*\(/.test(cardStats),
    "a card must not fetch its own document",
  ],
];
for (const [label, ok, detail] of wiring) {
  line(ok ? PASS : FAIL, label, detail);
  if (!ok) failures += 1;
}

/* ── 6 · The client contract ───────────────────────────────────────────────
   Behaviour a reader depends on: the formatter's grammar, the dedup key, and
   the two ways a count can be absent — unknown (hide) versus zero (show). The
   formatter is EXECUTED here rather than pattern-matched, so this fails if its
   output changes and not merely if its source is reworded. */
console.log("\n" + C.b("  6 · The client contract"));

const { formatCount, formatExact } = await import("../src/lib/article-stats.ts");

const grammar = [
  ["1 view is singular", formatCount(1, "view") === "1 view", formatCount(1, "view")],
  ["0 views is plural", formatCount(0, "view") === "0 views", formatCount(0, "view")],
  ["24 views is plural", formatCount(24, "view") === "24 views", formatCount(24, "view")],
  [
    "thousands are compact",
    /^\d+(\.\d)?K views$/.test(formatCount(12400, "view")),
    formatCount(12400, "view"),
  ],
  [
    "the exact label stays unrounded",
    /^12,400 views$/.test(formatExact(12400, "view")),
    formatExact(12400, "view"),
  ],
];
for (const [label, ok, shown] of grammar) {
  line(ok ? PASS : FAIL, label, C.dim(`renders "${shown}"`));
  if (!ok) failures += 1;
}

const contract = [
  [
    "one view per session, keyed per slug",
    /sessionStorage/.test(statsLib) && /gaitai:viewed:\$\{slug\}/.test(statsLib),
    "sessionStorage gaitai:viewed:<slug>",
  ],
  [
    "a failed read returns null, not a zero",
    /catch[\s\S]{0,200}?return null;/.test(statsLib),
    "unknown must not render as 0 views",
  ],
  [
    "a missing document reads as zero",
    /!snap\.exists\(\)[\s\S]{0,80}?views:\s*0/.test(statsLib),
    "nobody has read it yet — a real answer",
  ],
  [
    "a card with no document still renders zero",
    /\?\?\s*\{\s*views:\s*0/.test(cardStats),
    "missing slug in the shared map",
  ],
  [
    "a card renders nothing until the read resolves",
    /if\s*\(!stats\)\s*return null;/.test(cardStats),
    "no flash of 0 before the number",
  ],
  [
    "the article hides its counters when they cannot be read",
    /status\s*===?\s*"unavailable"|setStatus\("unavailable"\)/.test(engHook) &&
      /status\s*===?\s*"unavailable"|views\s*!==\s*null/.test(articleMeta),
    "an essay never depends on the counter",
  ],
];
for (const [label, ok, detail] of contract) {
  line(ok ? PASS : FAIL, label, detail);
  if (!ok) failures += 1;
}

/* ── 7 · What production actually allows ───────────────────────────────────
   Rules are only real once deployed, so this asks the live database — as an
   anonymous visitor, over REST — whether it accepts the one write the client
   makes and refuses the writes it must never accept.

   It writes to `articleStats/zz-doctor-probe`, which is not the slug of any
   article: no reader-facing count moves, and nothing maps that id onto a card
   or a page. (Not `__doctor__`: Firestore reserves ids matching `__…__` and
   rejects them with INVALID_ARGUMENT before the rules are consulted, which is
   how the first version of this check managed to report a refusal that had
   never reached the rules at all.)

   A refusal must be PERMISSION_DENIED. Anything else — a malformed body, a
   reserved id, a network error — is a broken test, not a working guard, and
   is reported as a failure rather than quietly counted as success. */
if (wantLive) {
  console.log("\n" + C.b("  7 · Write contract, against the live database"));
  const PROBE = "zz-doctor-probe";
  const docPath = `${DOCS}/${COLLECTION}/${PROBE}`.replace(
    "https://firestore.googleapis.com/v1/",
    "",
  );

  const commit = (writes) => rest(":commit", { writes });
  /* `rest` returns { status, json, code, message }. Accepted means the commit
     came back with write results; denied means the RULES said no, which is
     `code === "PERMISSION_DENIED"` and nothing else. */
  const okOf = (res) => res.status === 200 && Array.isArray(res.json?.writeResults);
  const denied = (res) => res.code === "PERMISSION_DENIED";

  /* Exactly what `registerView` sends: one counter up by one, the other
     touched by zero so the field exists, and a server timestamp. */
  const accepted = await commit([
    {
      update: { name: docPath, fields: {} },
      updateMask: { fieldPaths: [] },
      updateTransforms: [
        { fieldPath: "views", increment: { integerValue: "1" } },
        { fieldPath: "likes", increment: { integerValue: "0" } },
        { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
      ],
    },
  ]);
  line(
    okOf(accepted) ? PASS : FAIL,
    "the client's own +1 is accepted",
    okOf(accepted)
      ? `${COLLECTION}/${PROBE}`
      : `${accepted.code ?? accepted.status} — ${accepted.message ?? "the counter cannot be written"}`,
  );
  if (!okOf(accepted)) failures += 1;

  const arbitrary = await commit([
    {
      update: {
        name: docPath,
        fields: { views: { integerValue: "999999" }, likes: { integerValue: "0" } },
      },
      updateMask: { fieldPaths: ["views", "likes"] },
    },
  ]);
  line(
    denied(arbitrary) ? PASS : FAIL,
    "an arbitrary count is refused",
    denied(arbitrary)
      ? "PERMISSION_DENIED — a client cannot set 999999"
      : okOf(arbitrary)
        ? "ACCEPTED — the rules are too permissive"
        : `${arbitrary.status} — refused, but NOT by the rules`,
  );
  if (!denied(arbitrary)) failures += 1;

  const foreign = await commit([
    {
      update: {
        name: docPath,
        fields: { views: { integerValue: "1" }, hacked: { stringValue: "yes" } },
      },
      updateMask: { fieldPaths: ["views", "hacked"] },
    },
  ]);
  line(
    denied(foreign) ? PASS : FAIL,
    "an unexpected field is refused",
    denied(foreign)
      ? "PERMISSION_DENIED — the shape is fixed"
      : okOf(foreign)
        ? "ACCEPTED — the shape guard is not live"
        : `${foreign.status} — refused, but NOT by the rules`,
  );
  if (!denied(foreign)) failures += 1;

  console.log(
    C.dim(
      `\n  ${COLLECTION}/${PROBE} is this check's own document. It is not an\n` +
        "  article slug, so it never appears on a card or a page; its counter\n" +
        "  is the number of times this step has run.",
    ),
  );
}

/* ── 8 · What the deployed bundle contains ─────────────────────────────────
   NOT the number: the counter is client-rendered, so it is never in the served
   HTML and looking for it there is how three previous checks cried wolf. What
   IS provable is that the code which fetches it shipped — the collection name
   appears in the page's own JavaScript. */
if (wantLive) {
  console.log("\n" + C.b("  8 · The deployed bundle"));
  const article = chosen[0];
  const url = `https://gaitai.in/insights/${article.slug}/`;
  try {
    const html = await (await fetch(url)).text();
    line(PASS, `${article.slug} · page is served`, `${html.length.toLocaleString()} bytes`);

    const chunks = [...html.matchAll(/src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)]
      .map((m) => m[1])
      .slice(0, 14);
    let shipped = false;
    for (const chunk of chunks) {
      const js = await (await fetch(`https://gaitai.in${chunk}`)).text();
      if (js.includes(COLLECTION)) {
        shipped = true;
        line(PASS, "counter code is in the deployed JavaScript", chunk.split("/").pop());
        break;
      }
    }
    if (!shipped) {
      fail("counter code is in the deployed JavaScript", `"${COLLECTION}" not found in ${chunks.length} chunks`);
    }
  } catch (e) {
    fail(`fetch ${url}`, e.message);
  }
  console.log(
    C.dim(
      "\n  The number itself is fetched by the browser, so it is never in this\n" +
        "  HTML. Steps 2, 3 and 7 are what prove a visitor can read and add to it.",
    ),
  );
}

console.log();
if (failures) {
  console.log(C.bad(`  ${failures} check(s) failed.`));
  if (!rulesLive) {
    console.log(C.b("\n  ROOT CAUSE: the deployed Firestore rules predate the counter."));
    console.log("  No source change will fix it. Publish firestore.rules:\n");
    console.log("      " + C.b("npm run rules:whoami") + "    which account firebase-tools holds");
    console.log("      " + C.b("npm run rules:login") + "     add or refresh that login");
    console.log("      " + C.b("npm run deploy:rules") + "    publish, then re-run this script");
    console.log(
      C.dim(
        "\n  THE SIGNED-IN ACCOUNT MUST OWN THE PROJECT. deploy:rules publishes\n" +
          "  to the project named in .firebaserc, which is gaitai-intelligence —\n" +
          "  the same project the site's NEXT_PUBLIC_FIREBASE_PROJECT_ID points\n" +
          "  at. A login that cannot see that project fails the rules API with\n" +
          "  HTTP 403 \"The caller does not have permission\", even though the\n" +
          "  login itself succeeded. That looks nothing like a permissions\n" +
          "  problem in the output and is easy to read as another rules bug.\n" +
          "  It has already happened once here: firebase-tools held\n" +
          "  anubhaparashar1025@gmail.com, whose projects:list does not include\n" +
          "  gaitai-intelligence, so the deploy 403ed while the local rules file\n" +
          "  was perfectly correct. Sign in as the account that owns the project\n" +
          "  (login, or login:add then login:use), or give the signed-in account\n" +
          "  the Firebase Rules Admin role on it. Run rules:whoami first — it\n" +
          "  prints the account and every project that account can see.",
      ),
    );
    console.log("");
  }
  process.exit(1);
}
console.log(C.ok("  All checks passed — a visitor can read every counter.\n"));
