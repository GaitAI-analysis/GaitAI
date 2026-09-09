/**
 * ASK GAITAI — RETRIEVAL EVALUATION: three systems, one question set
 * =============================================================================
 *   npm run ask:eval                         lexical only (no services needed)
 *   npm run ask:eval -- --systems all        lexical · semantic · hybrid+rerank
 *   npm run ask:eval -- --systems hybrid --json tmp/eval.json
 *   npm run ask:eval -- --bench http://127.0.0.1:8790   (loopback bench Worker)
 *
 * Scores scripts/ask/eval-cases.ts against:
 *   A  lexical           retrieveGaitAIContext alone (the deterministic engine)
 *   B  semantic          cosine similarity of the standalone query alone
 *   C  hybrid + rerank   retrieveHybrid: merge, then the cross-encoder
 *
 * Metrics per system: top-1 relevance, top-3 recall, top-7 recall, wrong-family
 * rate (a noise type leading), refusal correctness, and per-stage latency.
 * Failures are listed per system so the comparison is inspectable, not just a
 * number.
 *
 * B and C need embeddings (data/ask-embeddings.json, built by ask:embed) and a
 * Workers AI path: the loopback bench Worker exposes /embed and /rerank on
 * 127.0.0.1 through the same adapter the production Worker uses. It is started
 * here if not already running; every call spends the account's allocation.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { EVAL_CASES, type EvalCase } from "./ask/eval-cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { ensureBenchWorker, stopBenchWorker, benchServices } from "./ask/bench-client";
import { retrieveGaitAIContext, type RetrievedDoc } from "../src/lib/ask/retrieval";
import {
  loadEmbeddingIndex,
  normalize,
  retrieveHybrid,
  semanticQueryText,
  semanticTopK,
  type EmbeddingFile,
  type EmbeddingIndex,
  type SemanticServices,
} from "../src/lib/ask/semantic";
import { docById } from "../src/lib/ask/corpus";

const ROOT = path.join(import.meta.dirname, "..");
const EMBEDDINGS = path.join(ROOT, "data", "ask-embeddings.json");

const args = process.argv.slice(2);
const flag = (name: string, fallback = ""): string => {
  const at = args.indexOf(name);
  return at >= 0 ? (args[at + 1] ?? fallback) : fallback;
};
const systemsArg = flag("--systems", "lexical");
const systems = systemsArg === "all" ? ["lexical", "semantic", "hybrid"] : systemsArg.split(",").map((s) => s.trim());
const jsonOut = flag("--json");
const benchUrl = flag("--bench", process.env.ASK_BENCH_URL ?? "http://127.0.0.1:8790");
const matchText = flag("--match").toLowerCase();
const embeddingsPath = flag("--embeddings") ? path.join(ROOT, flag("--embeddings")) : EMBEDDINGS;

interface Ranked {
  ids: string[];
  refused: boolean;
  timings: Record<string, number>;
}

interface Score {
  system: string;
  cases: number;
  top1: number;
  top3: number;
  top7: number;
  wrongFamily: number;
  refusalsRight: number;
  refusalsExpected: number;
  meanMs: number;
  failures: { q: string; family: string; got: string[]; note: string }[];
}

function evaluate(system: string, results: Map<string, Ranked>, cases: EvalCase[]): Score {
  const score: Score = { system, cases: cases.length, top1: 0, top3: 0, top7: 0, wrongFamily: 0, refusalsRight: 0, refusalsExpected: 0, meanMs: 0, failures: [] };
  let totalMs = 0;
  const byId = docById();
  for (const testCase of cases) {
    const ranked = results.get(testCase.q + (testCase.history ? "#h" : ""))!;
    totalMs += ranked.timings.totalMs ?? 0;
    if (testCase.expectRefusal) {
      score.refusalsExpected += 1;
      if (ranked.refused) score.refusalsRight += 1;
      else score.failures.push({ q: testCase.q, family: testCase.family, got: ranked.ids.slice(0, 3), note: "should have refused" });
      continue;
    }
    if (ranked.refused) {
      score.failures.push({ q: testCase.q, family: testCase.family, got: [], note: "refused, but an answer exists" });
      continue;
    }
    const relevant = new Set(testCase.relevant);
    const hit1 = ranked.ids.slice(0, 1).some((id) => relevant.has(id));
    const hit3 = ranked.ids.slice(0, 3).some((id) => relevant.has(id));
    const hit7 = ranked.ids.slice(0, 7).some((id) => relevant.has(id));
    if (hit1) score.top1 += 1;
    if (hit3) score.top3 += 1;
    if (hit7) score.top7 += 1;
    const leadType = byId.get(ranked.ids[0] ?? "")?.type;
    const wrong = leadType !== undefined && (testCase.wrongTypes ?? []).includes(leadType);
    if (wrong) score.wrongFamily += 1;
    if (!hit3 || wrong) {
      score.failures.push({
        q: testCase.q,
        family: testCase.family,
        got: ranked.ids.slice(0, 5),
        note: [!hit1 ? "top-1 miss" : "", !hit3 ? "top-3 miss" : "", !hit7 ? "top-7 miss" : "", wrong ? `wrong family (${leadType})` : ""].filter(Boolean).join(", "),
      });
    }
  }
  score.meanMs = Math.round(totalMs / Math.max(cases.length, 1));
  return score;
}

async function main(): Promise<number> {
  const corpus = loadCorpusFromDisk();
  const cases = EVAL_CASES.filter((c) => !matchText || c.q.toLowerCase().includes(matchText));
  console.log(`corpus: ${corpus.docs.length} records · ${cases.length} questions · systems: ${systems.join(", ")}\n`);

  let index: EmbeddingIndex | null = null;
  let services: SemanticServices | null = null;
  const needsServices = systems.includes("semantic") || systems.includes("hybrid");
  if (needsServices) {
    if (!existsSync(embeddingsPath)) {
      console.error(`no ${path.relative(ROOT, embeddingsPath)} — run \`npm run ask:embed\` first`);
      return 1;
    }
    const file = JSON.parse(readFileSync(embeddingsPath, "utf8")) as EmbeddingFile;
    index = loadEmbeddingIndex(file);
    console.log(`embeddings: ${index.ids.length}/${corpus.docs.length} records · ${file.model} · ${file.dim}d · ${file.pooling} pooling`);
    await ensureBenchWorker(benchUrl);
    services = benchServices(benchUrl, file.model, undefined, file.pooling);
  }

  const results: Record<string, Map<string, Ranked>> = {};
  const queryCache = new Map<string, Float32Array>();

  for (const system of systems) {
    const bucket = new Map<string, Ranked>();
    for (const testCase of cases) {
      const key = testCase.q + (testCase.history ? "#h" : "");
      const started = Date.now();
      if (system === "lexical") {
        const r = retrieveGaitAIContext(testCase.q, "/", testCase.history ?? []);
        bucket.set(key, { ids: r.docs.map((d) => d.doc.id), refused: r.lowConfidence, timings: { totalMs: Date.now() - started } });
      } else if (system === "semantic") {
        const r = retrieveGaitAIContext(testCase.q, "/", testCase.history ?? []);
        const query = semanticQueryText(r.understanding);
        let vector = queryCache.get(query);
        if (!vector) {
          const [values] = await services!.embed([query]);
          vector = normalize(Float32Array.from(values));
          queryCache.set(query, vector);
        }
        const hits = semanticTopK(index!, vector, 7);
        bucket.set(key, { ids: hits.map((h) => h.id), refused: r.lowConfidence && r.intent !== "DOMAIN_APPLICATION", timings: { totalMs: Date.now() - started } });
      } else {
        const h = await retrieveHybrid({ question: testCase.q, pathname: "/", history: testCase.history ?? [], services, index, queryCache });
        bucket.set(key, {
          ids: h.final.map((d: RetrievedDoc) => d.doc.id),
          refused: h.degraded.includes("refused-by-retrieval"),
          timings: { totalMs: h.timings.totalMs, embedMs: h.timings.embedMs, rerankMs: h.timings.rerankMs, lexicalMs: h.timings.lexicalMs },
        });
        if (h.degraded.length && !h.degraded.includes("refused-by-retrieval")) console.log(`  degraded (${testCase.q}): ${h.degraded.join("; ")}`);
      }
    }
    results[system] = bucket;
  }

  const scores = systems.map((system) => evaluate(system, results[system], cases));
  const answerable = cases.filter((c) => !c.expectRefusal).length;
  const pct = (n: number, d: number) => `${((100 * n) / Math.max(d, 1)).toFixed(0).padStart(3)}%`;

  console.log("\n" + "system".padEnd(18) + "top1   top3   top7   wrong-fam  refusals   mean ms");
  for (const s of scores) {
    console.log(
      `${s.system.padEnd(18)}${pct(s.top1, answerable)}   ${pct(s.top3, answerable)}   ${pct(s.top7, answerable)}   ${pct(s.wrongFamily, answerable).padStart(6)}     ${s.refusalsRight}/${s.refusalsExpected}       ${String(s.meanMs).padStart(5)}`,
    );
  }
  for (const s of scores) {
    console.log(`\n── failures · ${s.system} (${s.failures.length}) ──`);
    for (const f of s.failures) console.log(`  ${f.q}  [${f.family}]  → ${f.got.join(", ") || "(refused)"}  · ${f.note}`);
  }

  if (jsonOut) {
    mkdirSync(path.dirname(path.join(ROOT, jsonOut)), { recursive: true });
    writeFileSync(path.join(ROOT, jsonOut), JSON.stringify({ generatedAt: new Date().toISOString(), cases: cases.length, answerable, scores }, null, 2));
    console.log(`\nwritten ${jsonOut}`);
  }
  return 0;
}

main()
  .then((code) => {
    stopBenchWorker();
    process.exit(code);
  })
  .catch((error) => {
    console.error(`\nask:eval failed: ${(error as Error).message}\n`);
    stopBenchWorker();
    process.exit(1);
  });
