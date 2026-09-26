/**
 * ASK GAITAI RUNTIME CONFIG — public/ask/config.json
 * =============================================================================
 * Runs in `prebuild` / `predev`, after `build:knowledge`. Writes the small file
 * the assistant fetches with `cache: "no-store"` every time the panel opens:
 *
 *   { "build": "<12 hex>", "endpoint": "https://…/api/ask", "corpus": "<12 hex>" }
 *
 * WHY. The hosted endpoint is a build-time constant in the JavaScript bundle.
 * A tab that loaded the site before a deploy — or a mobile browser restoring a
 * suspended tab hours later — keeps running the OLD bundle, and Next's hashed
 * chunks cannot help: nothing re-fetches code a page already has. That old
 * bundle answered from records alone while the new one talked to the Worker,
 * and the visitor saw two different assistants until a refresh. The runtime
 * file is the one thing the client re-reads on every open, so a stale bundle
 * still learns the CURRENT endpoint and the CURRENT build id, and can discard
 * persisted state the new build would not understand.
 *
 * WHAT IT CONTAINS. Nothing secret. The endpoint is a public URL the browser
 * has to know anyway; the build id is a hash. It is gitignored because the
 * endpoint differs per machine (empty locally, the Worker URL in CI).
 *
 * The same build id is inlined into the bundle by next.config.mjs as
 * NEXT_PUBLIC_ASK_BUILD_ID, read from this file — one value, two places.
 */

import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CORPUS = path.join(ROOT, "public", "ask", "knowledge.json");
const OUT = path.join(ROOT, "public", "ask", "config.json");

const endpoint = (process.env.NEXT_PUBLIC_ASK_GAITAI_ENDPOINT ?? "").trim();

const corpus = existsSync(CORPUS)
  ? createHash("sha256").update(readFileSync(CORPUS)).digest("hex").slice(0, 12)
  : "";

function commit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

/* The build id changes whenever anything the assistant depends on changes:
   the code (commit), the corpus, or the hosted configuration. A local build
   with no commit still gets a stable id for the same inputs. */
const build = createHash("sha256")
  .update(`${commit()}|${corpus}|${endpoint}`)
  .digest("hex")
  .slice(0, 12);

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ build, endpoint, corpus, generatedAt: new Date().toISOString() }, null, 2) + "\n",
);
console.log(`[ask config] build ${build} · endpoint ${endpoint || "(none — retrieval only)"} · corpus ${corpus} → public/ask/config.json`);
