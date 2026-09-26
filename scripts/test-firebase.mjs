/**
 * Firebase integration acceptance test — run with:  npm run test:firebase
 *
 * Verifies the live Firestore setup for this project WITHOUT needing a login,
 * by exercising the public paths through the Firestore REST API and asserting
 * that the admin-only paths are correctly locked down.
 *
 * What it proves:
 *   1. The Firebase project + web API key are valid.
 *   2. The Firestore database actually exists (not-found = never created).
 *   3. Security rules are published (public reads allowed on posts/comments).
 *   4. A visitor CAN submit a comment, and it lands in the moderation queue.
 *   5. A visitor CANNOT read the queue or publish posts (admin-gated).
 *
 * Nothing here needs a service account — it uses only the public web key.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ---- env ---------------------------------------------------------------- */
const fileEnv = {};
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) fileEnv[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const env = (k) => process.env[k] || fileEnv[k] || "";

const projectId = env("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
const apiKey = env("NEXT_PUBLIC_FIREBASE_API_KEY");
const BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

/* ---- pretty output ------------------------------------------------------ */
const C = {
  reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m",
};
let passed = 0, failed = 0;
const pass = (msg, extra = "") => { passed++; console.log(`  ${C.green}✓${C.reset} ${msg}${extra ? ` ${C.dim}${extra}${C.reset}` : ""}`); };
const fail = (msg, hint = "") => { failed++; console.log(`  ${C.red}✗${C.reset} ${msg}`); if (hint) console.log(`    ${C.yellow}↳ ${hint}${C.reset}`); };
const head = (t) => console.log(`\n${C.bold}${C.cyan}${t}${C.reset}`);

/* ---- helpers ------------------------------------------------------------ */
const url = (path, qs = "") => `${BASE}/${path}?key=${apiKey}${qs ? `&${qs}` : ""}`;

async function req(method, path, body, qs) {
  try {
    const res = await fetch(url(path, qs), {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    let json = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, ok: res.ok, json };
  } catch (err) {
    return { status: 0, ok: false, networkError: err.message };
  }
}

const S = (v) => ({ stringValue: String(v) });
const NULL = { nullValue: null };

/* ---- test ids ----------------------------------------------------------- */
const stamp = Date.now().toString(36);
const TEST_SLUG = "why-movement-is-the-next-biometric";
const TEST_COMMENT_ID = `test_${stamp}`;
const TEST_NAME = "GaitAI Integration Test";

/* ---- run ---------------------------------------------------------------- */
async function main() {
  console.log(`\n${C.bold}GaitAI · Firebase integration test${C.reset}`);
  console.log(`${C.dim}project: ${projectId || "(missing)"}${C.reset}`);

  if (!projectId || !apiKey) {
    fail("Missing NEXT_PUBLIC_FIREBASE_* env vars", "Check .env.local");
    return summary();
  }

  /* 1 — database reachable ------------------------------------------------ */
  head("1. Database & credentials");
  const probe = await req("GET", "posts", null, "pageSize=1");

  if (probe.networkError) {
    fail("Could not reach Firestore", `Network error: ${probe.networkError}`);
    return summary();
  }
  if (probe.status === 403 && /API key not valid/i.test(JSON.stringify(probe.json))) {
    fail("API key rejected", "The key in .env.local is invalid for this project.");
    return summary();
  }
  if (probe.status === 404) {
    fail("Firestore database NOT found", "Console → Build → Firestore Database → Create database (Production mode).");
    return summary();
  }
  if (probe.status === 403) {
    fail("Public read on `posts` was DENIED", "Publish firestore.rules — the posts block needs `allow read: if true`.");
  } else if (probe.ok) {
    pass("Firebase project + API key valid");
    pass("Firestore database exists and is reachable");
    pass("Security rules published — public can read `posts`");
  } else {
    fail(`Unexpected status ${probe.status}`, JSON.stringify(probe.json).slice(0, 160));
  }

  /* 2 — content ----------------------------------------------------------- */
  head("2. Posts / blogs content");
  const all = await req("GET", "posts", null, "pageSize=300");
  const count = (all.json?.documents || []).length;
  if (count > 0) {
    pass(`${count} post(s) live in Firestore`);
    const first = all.json.documents[0]?.fields || {};
    console.log(`    ${C.dim}e.g. "${first.title?.stringValue ?? "?"}"${C.reset}`);
  } else {
    console.log(`  ${C.yellow}!${C.reset} No posts in Firestore yet ${C.dim}(expected before you import)${C.reset}`);
    console.log(`    ${C.dim}Importing requires admin login — see the note at the end.${C.reset}`);
  }

  /* 3 — public comment read ---------------------------------------------- */
  head("3. Public comment reads");
  const approved = await req("GET", `postComments/${TEST_SLUG}/comments`, null, "pageSize=5");
  if (approved.ok) {
    pass(`Approved comments readable`, `(${(approved.json?.documents || []).length} on the test post)`);
  } else if (approved.status === 403) {
    fail("Reading approved comments DENIED", "postComments needs `allow read: if true` in the rules.");
  } else {
    fail(`Unexpected status ${approved.status}`);
  }

  /* 4 — public comment submit (the real write path) ----------------------- */
  head("4. Visitor comment submission");
  const now = new Date().toISOString();
  const fields = {
    commentId: S(TEST_COMMENT_ID),
    postId: S(TEST_SLUG),
    contentId: S(TEST_SLUG),
    contentType: S("blog"),
    userName: S(TEST_NAME),
    email: NULL,
    message: S(`Automated integration test — safe to reject. (${now})`),
    createdAt: { timestampValue: now },
    status: S("pending"),
    approvedAt: NULL,
    approvedBy: NULL,
    parentCommentId: NULL,
    userId: NULL,
  };

  const pendingWrite = await req(
    "POST",
    `pendingComments/${TEST_SLUG}/comments`,
    { fields },
    `documentId=${TEST_COMMENT_ID}`,
  );
  if (pendingWrite.ok) pass("Comment accepted into `pendingComments`");
  else if (pendingWrite.status === 403)
    fail("Comment write DENIED", "Rules not published, or pendingFieldsValid() rejected the payload.");
  else fail(`Comment write failed (${pendingWrite.status})`, JSON.stringify(pendingWrite.json).slice(0, 200));

  const queueWrite = await req(
    "POST",
    "pendingCommentQueue",
    { fields },
    `documentId=${TEST_SLUG}__${TEST_COMMENT_ID}`,
  );
  if (queueWrite.ok) pass("Comment mirrored into the moderation queue");
  else fail(`Queue write failed (${queueWrite.status})`, JSON.stringify(queueWrite.json).slice(0, 200));

  /* 5 — validation is enforced ------------------------------------------- */
  head("5. Rules reject invalid data");
  const bad = await req(
    "POST",
    "pendingCommentQueue",
    { fields: { ...fields, status: S("approved") } }, // self-approval attempt
    `documentId=evil_${stamp}`,
  );
  if (bad.status === 403) pass("Self-approved comment correctly REJECTED");
  else fail("A comment claiming status:approved was accepted!", "Re-check pendingFieldsValid() in firestore.rules.");

  /* 6 — admin surfaces are locked ---------------------------------------- */
  head("6. Admin-only paths are locked");
  const readQueue = await req("GET", "pendingCommentQueue", null, "pageSize=1");
  if (readQueue.status === 403) pass("Moderation queue is NOT publicly readable");
  else fail("Moderation queue is publicly readable!", "pendingCommentQueue must be `allow read: if isAdmin()`.");

  const writePost = await req(
    "POST",
    "posts",
    { fields: { id: S(`evil_${stamp}`), slug: S(`evil-${stamp}`), title: S("Unauthorized"), category: S("blog"), summary: S(""), body: S(""), tags: { arrayValue: { values: [] } }, publishedAt: S(now), author: S("attacker"), featured: { booleanValue: false } } },
    `documentId=evil_${stamp}`,
  );
  if (writePost.status === 403) pass("Anonymous post publishing is BLOCKED");
  else fail("Anyone can publish posts!", "The posts block must be `allow create, update: if isAdmin() && ...`.");

  summary();
}

function summary() {
  console.log(`\n${C.bold}────────────────────────────────────────${C.reset}`);
  console.log(`${C.bold}Result:${C.reset} ${C.green}${passed} passed${C.reset}${failed ? `, ${C.red}${failed} failed${C.reset}` : ""}`);
  if (!failed) {
    console.log(`${C.green}Firebase integration is working.${C.reset}`);
    console.log(`${C.dim}A test comment was left in the moderation queue — you can see it in
the Firebase console under pendingCommentQueue, and delete it there.${C.reset}`);
  }
  console.log("");
  process.exit(failed ? 1 : 0);
}

main();
