/**
 * ASK GAITAI — BUILD-TIME EMBEDDINGS, INCREMENTAL
 * =============================================================================
 *   npm run ask:embed                    embed new/changed records, reuse the rest
 *   npm run ask:embed -- --force         re-embed everything (model change)
 *   npm run ask:embed -- --bench http://127.0.0.1:8790
 *
 * Reads the generated corpus (public/ask/knowledge.json), builds each record's
 * semantic search text (semantic.ts `embeddingText`), hashes it, and compares
 * against data/ask-embeddings.json:
 *
 *   hash unchanged  → the stored vector is reused (no call)
 *   hash changed    → the record is re-embedded
 *   new record      → embedded
 *   removed record  → its vector is dropped
 *
 * Vectors are int8-quantised with a per-vector scale and stored as base64, so
 * 331 records × 384 dimensions is ~170 KB of JSON rather than ~1 MB of floats.
 * The file is COMMITTED: it is derived, like a lockfile, but deriving it costs
 * Workers AI calls, so a CI build without Workers AI access still ships the
 * last committed vectors (worker/scripts/build-corpus.mjs copies the ones the
 * current corpus still has into the Worker bundle).
 *
 * Embeddings come from Cloudflare Workers AI through the loopback bench Worker
 * (POST /embed), the same adapter the production Worker uses — no API token,
 * no external provider. Every call spends the account's daily allocation.
 */

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { benchServices, ensureBenchWorker, stopBenchWorker } from "./ask/bench-client";
import { knowledge } from "../src/lib/ask/corpus";
import {
  contentHash,
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_POOLING,
  embeddingText,
  quantize,
  type EmbeddingFile,
  type StoredEmbedding,
} from "../src/lib/ask/semantic";

const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(ROOT, "data", "ask-embeddings.json");

const args = process.argv.slice(2);
const force = args.includes("--force");
const benchAt = args.indexOf("--bench");
const benchUrl = benchAt >= 0 ? args[benchAt + 1] : process.env.ASK_BENCH_URL ?? "http://127.0.0.1:8790";
const modelAt = args.indexOf("--model");
/** `--model @cf/baai/bge-base-en-v1.5` or EMBEDDING_MODEL to evaluate another model. */
const model = (modelAt >= 0 ? args[modelAt + 1] : "") || process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_MODEL;
const outAt = args.indexOf("--out");
const OUT_FILE = outAt >= 0 ? path.join(ROOT, args[outAt + 1]) : OUT;
/* The bge-en family takes a pooling parameter; bge-m3 does not. */
const pooling: "cls" | "none" = /bge-(?:small|base|large)-en/.test(model) ? EMBEDDING_POOLING : "none";
const BATCH = 50;

async function main(): Promise<number> {
  const corpus = loadCorpusFromDisk();
  const docs = knowledge().docs;

  let previous: EmbeddingFile | null = null;
  if (existsSync(OUT_FILE)) {
    try {
      previous = JSON.parse(readFileSync(OUT_FILE, "utf8")) as EmbeddingFile;
    } catch {
      previous = null;
    }
  }
  let dim = previous && previous.model === model ? previous.dim : 0;
  const reusable = new Map<string, StoredEmbedding>();
  if (previous && !force && previous.model === model && previous.pooling === pooling) {
    for (const record of previous.records) reusable.set(record.id, record);
  }

  const wanted = docs.map((doc) => ({ id: doc.id, text: embeddingText(doc), hash: contentHash(embeddingText(doc)) }));
  const todo = wanted.filter((item) => reusable.get(item.id)?.hash !== item.hash);
  const kept = wanted.filter((item) => reusable.get(item.id)?.hash === item.hash).map((item) => reusable.get(item.id)!);
  const removed = previous ? previous.records.filter((record) => !docs.some((doc) => doc.id === record.id)).length : 0;

  console.log(
    `corpus ${corpus.docs.length} records · model ${model} · ${dim}d · pooling ${pooling}\n` +
      `  reuse ${kept.length} · embed ${todo.length} · drop ${removed}${force ? " (forced)" : ""}`,
  );

  const fresh: StoredEmbedding[] = [];
  if (todo.length) {
    await ensureBenchWorker(benchUrl);
    const services = benchServices(benchUrl, model, undefined, pooling);
    const started = Date.now();
    for (let i = 0; i < todo.length; i += BATCH) {
      const batch = todo.slice(i, i + BATCH);
      const vectors = await services.embed(batch.map((item) => item.text));
      batch.forEach((item, index) => {
        const vector = vectors[index];
        if (!vector?.length) throw new Error(`${item.id}: empty embedding`);
        if (!dim) dim = vector.length;
        if (vector.length !== dim) throw new Error(`${item.id}: embedding has ${vector.length} dimensions, expected ${dim}`);
        fresh.push({ id: item.id, hash: item.hash, ...quantize(vector) });
      });
      console.log(`  embedded ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    }
    console.log(`  ${todo.length} vectors in ${Date.now() - started} ms`);
  }

  const records = [...kept, ...fresh].sort((a, b) => a.id.localeCompare(b.id));
  const file: EmbeddingFile = {
    model,
    pooling,
    dim: dim,
    generatedAt: new Date().toISOString().slice(0, 10),
    records,
  };
  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(file)}\n`, "utf8");
  console.log(`  -> ${path.relative(ROOT, OUT_FILE)} · ${records.length} vectors · ${(statSync(OUT_FILE).size / 1024).toFixed(0)} KB`);
  const missing = docs.filter((doc) => !records.some((record) => record.id === doc.id));
  if (missing.length) console.log(`  !! ${missing.length} records have no vector: ${missing.slice(0, 5).map((d) => d.id).join(", ")}${missing.length > 5 ? "…" : ""}`);
  return 0;
}

main()
  .then((code) => {
    stopBenchWorker();
    process.exit(code);
  })
  .catch((error) => {
    console.error(`\nask:embed failed: ${(error as Error).message}\n`);
    stopBenchWorker();
    process.exit(1);
  });
