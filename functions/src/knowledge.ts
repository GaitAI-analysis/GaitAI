/**
 * The GaitAI knowledge corpus, as loaded by the function.
 *
 * `knowledge.json` is GENERATED — never edit it. `npm run build:knowledge` at
 * the repository root writes it from the site's own typed data modules, and
 * `scripts/sync-shared.mjs` copies it here before every build, so the function
 * answers from the same records the browser fetches and the pages render.
 *
 * Read once per instance, at cold start, and handed to the shared modules
 * through `seedCorpus` — the same entry point the Node test harnesses use.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { corpusReady, knowledge, seedCorpus, type Knowledge } from "./shared/corpus";
import { resetIndex } from "./shared/retrieval";

/** Compiled to lib/knowledge.js; the JSON sits one level up, beside lib/. */
const CORPUS_PATH = path.join(__dirname, "..", "knowledge.json");

export function ensureCorpus(): Knowledge {
  if (corpusReady()) return knowledge();
  const parsed = JSON.parse(readFileSync(CORPUS_PATH, "utf8")) as Knowledge;
  if (!Array.isArray(parsed.docs) || parsed.docs.length === 0) {
    throw new Error("knowledge.json is empty — run `npm run build:knowledge` at the root");
  }
  seedCorpus(parsed);
  resetIndex();
  return parsed;
}
