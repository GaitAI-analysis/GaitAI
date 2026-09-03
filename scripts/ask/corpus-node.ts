/**
 * Load the generated corpus off disk and hand it to the browser modules.
 *
 * The harnesses exercise `src/lib/ask/*` — the same retrieval, the same
 * prompt, the same link allowlist the visitor's browser runs. They are not a
 * second implementation kept in step by hand, which is the failure mode this
 * whole feature is built to avoid.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { seedCorpus, type Knowledge } from "../../src/lib/ask/corpus";
import { resetIndex } from "../../src/lib/ask/retrieval";

const ROOT = path.join(import.meta.dirname, "..", "..");

export function loadCorpusFromDisk(): Knowledge {
  /* The minified copy under public/ and the pretty copy under data/ are
     written from the same payload in the same run, so either is correct.
     public/ is preferred because it is the one the browser actually gets. */
  const candidates = [
    path.join(ROOT, "public", "ask", "knowledge.json"),
    path.join(ROOT, "data", "ask-knowledge.json"),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(candidate, "utf8")) as Knowledge;
      seedCorpus(parsed);
      resetIndex();
      return parsed;
    } catch {
      /* try the next location */
    }
  }

  throw new Error(
    "No corpus found. Run `npm run build:knowledge` at the repository root.",
  );
}
