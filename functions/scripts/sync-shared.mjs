#!/usr/bin/env node
/**
 * ONE RETRIEVAL, TWO RUNTIMES.
 * =============================================================================
 * The function must run EXACTLY the retrieval the browser runs — the same BM25
 * weights, the same entity resolver, the same intent classifier, the same link
 * allowlist and the same extractive floor — over EXACTLY the corpus the site
 * shipped. Two implementations kept in step by hand is the failure mode this
 * whole feature is built to avoid, so there is one implementation, in
 * `src/lib/ask/`, and this script copies it here before every build.
 *
 * What is copied:
 *   src/lib/ask/{corpus,retrieval,intent,entities,prompt,answer,extractive}.ts
 *       → functions/src/shared/          (compiled by tsc like any other source)
 *   public/ask/knowledge.json
 *       → functions/knowledge.json        (deployed alongside lib/, read at start)
 *
 * What is deliberately NOT copied: `engine.ts` and `hosted.ts`, which are the
 * browser's side of the wire and carry "use client".
 *
 * Both destinations are gitignored. They are build output, and committing them
 * would let them drift from their source.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const functionsDir = path.resolve(here, "..");
const repoRoot = path.resolve(functionsDir, "..");

const SHARED = [
  "corpus.ts",
  "retrieval.ts",
  "intent.ts",
  "entities.ts",
  "prompt.ts",
  "answer.ts",
  "extractive.ts",
];

const sourceDir = path.join(repoRoot, "src", "lib", "ask");
const targetDir = path.join(functionsDir, "src", "shared");
const corpusSource = path.join(repoRoot, "public", "ask", "knowledge.json");
const corpusTarget = path.join(functionsDir, "knowledge.json");

if (!existsSync(corpusSource)) {
  console.error(
    `\n[sync-shared] ${path.relative(repoRoot, corpusSource)} is missing.\n` +
      `Run \`npm run build:knowledge\` at the repository root first — the function\n` +
      `ships the same generated corpus the browser fetches, never a second copy.\n`,
  );
  process.exit(1);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });

for (const name of SHARED) {
  const from = path.join(sourceDir, name);
  if (!existsSync(from)) {
    console.error(`[sync-shared] missing shared module: ${from}`);
    process.exit(1);
  }
  copyFileSync(from, path.join(targetDir, name));
}

/* Anything else left in shared/ from an older list would compile too. */
for (const stray of readdirSync(targetDir)) {
  if (!SHARED.includes(stray)) rmSync(path.join(targetDir, stray), { force: true });
}

copyFileSync(corpusSource, corpusTarget);

const kb = (statSync(corpusTarget).size / 1024).toFixed(0);
console.log(
  `[sync-shared] ${SHARED.length} shared modules → functions/src/shared/, corpus ${kb} KB → functions/knowledge.json`,
);
