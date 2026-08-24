/**
 * Pull the live `posts` collection from Firestore into `data/posts.json` at
 * dev/build time, so the statically-exported Insights & Publications pages are
 * generated from the same content the admin control panel manages.
 *
 * Reads are public (firestore.rules → posts allow read: if true), so this uses
 * the Firestore REST API with the public web API key — no service account.
 *
 * data/posts.json is an exact MIRROR of Firestore — including when Firestore is
 * empty. Anything deleted in the control panel disappears from the build too.
 * The file is only left untouched when Firestore can't be reached at all
 * (network/HTTP failure), so a blip can't wipe the site's content.
 *
 * Runs automatically via the `predev` / `prebuild` npm hooks.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- Load .env.local (real process env wins) -------------------------------
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

const OUT = join(root, "data", "posts.json");

function keep(reason) {
  console.log(`[sync-posts] ${reason} — keeping existing data/posts.json.`);
  process.exit(0);
}

if (!projectId || !apiKey) keep("Missing Firebase env vars");

/** Convert a Firestore REST value object into a plain JS value. */
function fromValue(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
  return null;
}

function fromFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = fromValue(v);
  return out;
}

function toPost(doc) {
  const f = fromFields(doc.fields || {});
  return {
    id: String(f.id ?? ""),
    slug: String(f.slug ?? ""),
    title: String(f.title ?? "Untitled"),
    category: String(f.category ?? "blog"),
    summary: String(f.summary ?? ""),
    body: String(f.body ?? ""),
    tags: Array.isArray(f.tags) ? f.tags.map(String) : [],
    publishedAt: String(f.publishedAt ?? new Date().toISOString()),
    author: String(f.author ?? "GaitAI"),
    ...(f.featured != null ? { featured: Boolean(f.featured) } : {}),
    ...(f.publicationStatus === "draft" || f.publicationStatus === "verified"
      ? { publicationStatus: f.publicationStatus }
      : {}),
    ...(f.subscriberOnly != null ? { subscriberOnly: Boolean(f.subscriberOnly) } : {}),
    ...(f.externalUrl ? { externalUrl: String(f.externalUrl) } : {}),
    ...(f.attachmentUrl ? { attachmentUrl: String(f.attachmentUrl) } : {}),
    ...(f.attachmentName ? { attachmentName: String(f.attachmentName) } : {}),
  };
}

async function main() {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts`;
  const docs = [];
  let pageToken = "";

  try {
    do {
      const url = `${base}?pageSize=300&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) keep(`Firestore returned HTTP ${res.status}`);
      const json = await res.json();
      (json.documents || []).forEach((d) => docs.push(d));
      pageToken = json.nextPageToken || "";
    } while (pageToken);
  } catch (err) {
    keep(`Fetch failed (${err?.message || err})`);
  }

  const posts = docs
    .map(toPost)
    .filter((p) => p.id && p.slug)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify({ posts }, null, 2));
  console.log(`[sync-posts] Wrote ${posts.length} post(s) from Firestore → data/posts.json`);
}

main();
