/**
 * One-time seeding of the repo's starter posts into Firestore — run with:
 *   npm run seed:posts
 *
 * Normally posts are published from the admin control panel, which requires a
 * signed-in moderator. This script exists so you can populate the `posts`
 * collection BEFORE enabling Google sign-in.
 *
 * Because firestore.rules gates post writes behind isAdmin(), this script will
 * be denied until you briefly open that rule. It prints the exact temporary
 * rule to paste, and reminds you to revert. Safe to re-run — it skips posts
 * that already exist.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const C = { reset: "\x1b[0m", dim: "\x1b[2m", bold: "\x1b[1m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m" };

const TEMP_RULE = `
    match /posts/{postId} {
      allow read: if true;
      allow create, update, delete: if true;   // ← TEMPORARY, revert after seeding
    }`;

function toValue(value) {
  if (value == null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toValue) } };
  }
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value)
            .filter(([, nested]) => nested !== undefined)
            .map(([key, nested]) => [key, toValue(nested)]),
        ),
      },
    };
  }
  return { stringValue: String(value) };
}

function toFields(post) {
  const f = {
    id: { stringValue: post.id },
    slug: { stringValue: post.slug },
    title: { stringValue: post.title },
    category: { stringValue: post.category },
    summary: { stringValue: post.summary ?? "" },
    body: { stringValue: post.body ?? "" },
    tags: { arrayValue: { values: (post.tags || []).map((t) => ({ stringValue: String(t) })) } },
    publishedAt: { stringValue: post.publishedAt },
    author: { stringValue: post.author ?? "GaitAI" },
    featured: { booleanValue: Boolean(post.featured ?? false) },
    publicationStatus: {
      stringValue: post.publicationStatus === "verified" ? "verified" : "draft",
    },
  };
  if (post.subscriberOnly != null) f.subscriberOnly = { booleanValue: Boolean(post.subscriberOnly) };
  if (post.externalUrl) f.externalUrl = { stringValue: post.externalUrl };
  if (post.attachmentUrl) f.attachmentUrl = { stringValue: post.attachmentUrl };
  if (post.attachmentName) f.attachmentName = { stringValue: post.attachmentName };
  if (post.coverImageUrl) f.coverImageUrl = { stringValue: post.coverImageUrl };
  if (post.coverImagePath) f.coverImagePath = { stringValue: post.coverImagePath };
  if (post.coverImageAlt) f.coverImageAlt = { stringValue: post.coverImageAlt };
  if (post.coverImageName) f.coverImageName = { stringValue: post.coverImageName };
  if (post.coverImageSize) f.coverImageSize = toValue(post.coverImageSize);
  if (post.coverImageWidth) f.coverImageWidth = toValue(post.coverImageWidth);
  if (post.coverImageHeight) f.coverImageHeight = toValue(post.coverImageHeight);
  if (Array.isArray(post.attachments) && post.attachments.length) {
    f.attachments = toValue(post.attachments);
  }
  return f;
}

async function main() {
  if (!projectId || !apiKey) {
    console.log(`${C.red}Missing NEXT_PUBLIC_FIREBASE_* env vars in .env.local${C.reset}`);
    process.exit(1);
  }

  const seed = JSON.parse(readFileSync(join(root, "data", "posts.json"), "utf8")).posts || [];
  console.log(`\n${C.bold}Seeding ${seed.length} starter post(s) → ${projectId}${C.reset}\n`);

  // Which slugs already exist?
  const existingRes = await fetch(`${BASE}/posts?pageSize=300&key=${apiKey}`).catch((e) => ({ err: e }));
  if (existingRes.err) {
    console.log(`${C.red}Network error: ${existingRes.err.message}${C.reset}`);
    process.exit(1);
  }
  const existingJson = await existingRes.json().catch(() => ({}));
  const existingSlugs = new Set(
    (existingJson.documents || []).map((d) => d.fields?.slug?.stringValue).filter(Boolean),
  );

  let written = 0, skipped = 0, denied = false;

  for (const post of seed) {
    if (existingSlugs.has(post.slug)) {
      console.log(`  ${C.dim}skip${C.reset}  ${post.slug} ${C.dim}(already in Firestore)${C.reset}`);
      skipped++;
      continue;
    }
    const res = await fetch(`${BASE}/posts?documentId=${encodeURIComponent(post.id)}&key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: toFields(post) }),
    });
    if (res.ok) {
      console.log(`  ${C.green}✓${C.reset}     ${post.slug}`);
      written++;
    } else if (res.status === 403) {
      denied = true;
      break;
    } else {
      const t = await res.text();
      console.log(`  ${C.red}✗${C.reset}     ${post.slug} — HTTP ${res.status} ${C.dim}${t.slice(0, 140)}${C.reset}`);
    }
  }

  if (denied) {
    console.log(`\n${C.yellow}${C.bold}Permission denied — this is your security rules working correctly.${C.reset}`);
    console.log(`\nPosts can only be written by a signed-in admin. Two ways forward:\n`);
    console.log(`${C.bold}Option A (recommended):${C.reset} enable Google sign-in (Console → Authentication →`);
    console.log(`  Sign-in method → Google → Enable), then publish posts from /admin-controlpanel.\n`);
    console.log(`${C.bold}Option B (no login):${C.reset} in Console → Firestore → Rules, temporarily replace the`);
    console.log(`  posts block with:${C.dim}${TEMP_RULE}${C.reset}`);
    console.log(`  Publish → re-run ${C.bold}npm run seed:posts${C.reset} → then REVERT the rule back to`);
    console.log(`  ${C.dim}allow create, update: if isAdmin() && postFieldsValid(request.resource.data);${C.reset}`);
    console.log(`  ${C.red}Do not leave it open${C.reset} — anyone could publish to your site.\n`);
    process.exit(1);
  }

  console.log(`\n${C.green}${C.bold}Done — ${written} written, ${skipped} skipped.${C.reset}`);
  console.log(`${C.dim}Run \`npm run dev\` and open /insights to see them live.${C.reset}\n`);
}

main();
