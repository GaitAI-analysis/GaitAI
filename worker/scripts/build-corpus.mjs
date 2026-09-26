#!/usr/bin/env node
/**
 * THE WORKER'S CANONICAL RECORD MAP — derived, never authored.
 * =============================================================================
 * The browser sends record IDS, not record text, and the Worker must resolve
 * them against the same canonical corpus the site shipped — otherwise a
 * visitor could hand the model anything and call it GaitAI evidence. So the
 * Worker bundles its own copy of the corpus, and this script derives it from
 * `public/ask/knowledge.json`, the file `npm run build:knowledge` writes from
 * the site's typed data modules. Nothing here writes a record; it only copies
 * and trims.
 *
 * What is trimmed, and why it changes nothing the model sees:
 *   · each record's `content` is cut to 2 600 characters plus an ellipsis —
 *     the larger of the two caps `buildContextBlock` applies before a record
 *     reaches the prompt (lead record 2 600, others 1 500), so the prompt is
 *     byte-identical to one built from the full file
 *   · the two policy records keep their full content: the system policy quotes
 *     them
 *   · `environmentMap` is dropped: it is a retrieval aid, and the Worker does
 *     not retrieve
 *
 * Output: worker/src/generated/knowledge.json (gitignored — it is build output,
 * and committing it would let it drift from its source). Run before every
 * typecheck, test, dev and deploy; the npm scripts do.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(here, "..");
const repoRoot = path.resolve(workerDir, "..");

const source = path.join(repoRoot, "public", "ask", "knowledge.json");
const outDir = path.join(workerDir, "src", "generated");
const target = path.join(outDir, "knowledge.json");

/**
 * Mirrors LEAD_DOC_CHARS in src/lib/ask/retrieval.ts — the LARGER of the two
 * prompt budgets (the lead record gets 2 600 characters, the rest 1 500), so
 * whichever position a record lands in, the prompt built here is byte-identical
 * to one built from the full file.
 */
const PER_DOC_CHARS = 2600;
const KEEP_FULL = new Set(["policy:privacy-controls", "policy:responsible-use"]);

if (!existsSync(source)) {
  console.error(
    `\n[worker corpus] ${path.relative(repoRoot, source)} is missing.\n` +
      `Run \`npm run build:knowledge\` at the repository root first — the Worker\n` +
      `resolves record ids against the same generated corpus the browser fetches.\n`,
  );
  process.exit(1);
}

const full = JSON.parse(readFileSync(source, "utf8"));
if (!Array.isArray(full.docs) || full.docs.length === 0) {
  console.error("[worker corpus] the corpus has no records");
  process.exit(1);
}

const compact = {
  generatedAt: full.generatedAt,
  counts: full.counts,
  environmentMap: [],
  routes: full.routes,
  docs: full.docs.map((doc) => ({
    ...doc,
    content:
      KEEP_FULL.has(doc.id) || doc.content.length <= PER_DOC_CHARS
        ? doc.content
        : `${doc.content.slice(0, PER_DOC_CHARS)}…`,
  })),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(target, JSON.stringify(compact), "utf8");

/* THE EMBEDDING INDEX — copied, filtered, never computed here.
   data/ask-embeddings.json is built by `npm run ask:embed` (Workers AI through
   the loopback bench Worker) and committed. This step keeps only the vectors
   whose record is still in the corpus, so a removed page cannot be retrieved
   through a stale vector. A missing file yields an empty index and the Worker
   falls back to lexical retrieval — the semantic stage degrades, never fails. */
const embeddingsSource = path.join(repoRoot, "data", "ask-embeddings.json");
const embeddingsTarget = path.join(outDir, "embeddings.json");
const corpusIds = new Set(full.docs.map((doc) => doc.id));
let embeddings = { model: "", pooling: "cls", dim: 384, generatedAt: "", records: [] };
if (existsSync(embeddingsSource)) {
  try {
    const file = JSON.parse(readFileSync(embeddingsSource, "utf8"));
    embeddings = { ...file, records: (file.records ?? []).filter((record) => corpusIds.has(record.id)) };
  } catch {
    console.warn("[worker corpus] data/ask-embeddings.json is unreadable — semantic stage disabled");
  }
}
writeFileSync(embeddingsTarget, JSON.stringify(embeddings), "utf8");

const kb = (bytes) => (bytes / 1024).toFixed(0);
console.log(
  `[worker corpus] ${compact.docs.length} records, ${compact.routes.length} routes → ` +
    `src/generated/knowledge.json (${kb(statSync(target).size)} KB from ${kb(statSync(source).size)} KB)` +
    `\n[worker corpus] ${embeddings.records.length} vectors${embeddings.model ? ` · ${embeddings.model} · ${embeddings.dim}d` : ""} → ` +
    `src/generated/embeddings.json (${kb(statSync(embeddingsTarget).size)} KB)`,
);
