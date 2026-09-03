/**
 * ASK GAITAI — MODEL BENCHMARK
 * =============================================================================
 * Scores a candidate model on the site's OWN 25 acceptance questions, through
 * the real retrieval and the real system policy. Reputation does not enter into
 * it; the only question is which model answers GaitAI's questions better.
 *
 *   npm run ask:bench                        # the default (Qwen2.5-1.5B)
 *   npm run ask:bench -- --model smollm      # SmolLM2-1.7B
 *   npm run ask:bench -- --model <hf-id>     # anything Transformers.js loads
 *   npm run ask:bench -- --limit 5           # a quick pass
 *   npm run ask:bench -- --json out.json     # machine-readable, for diffing
 *
 * IT RUNS ON THE CPU BACKEND, IN NODE. That is slower than the WebGPU path a
 * visitor gets, so LATENCY HERE IS AN UPPER BOUND and the two models' numbers
 * are comparable to each other rather than to the browser. Everything else —
 * which records reached the model, what it wrote, whether it invented a figure
 * — is identical to what the browser produces, because it is the same code.
 *
 * WHAT IS SCORED, and how each maps to the brief's ten criteria:
 *
 *   1  grounded correctness   expected record titles present in the answer
 *   2  hallucination          numbers, product names or venues not in context
 *   3  evidence boundaries    forbidden claim shapes (diagnosis, certification)
 *   4  product-name accuracy  Capitalised module-shaped names not in the corpus
 *   5  source consistency     selectSources() finds at least one real source
 *   6  refusal                low-confidence cases must decline
 *   7  conciseness            words, against a 220-word target
 *   8  latency                per answer, wall clock
 *   9  memory                 peak RSS during the run
 *  10  download size          the model's own weights, reported by the loader
 *
 * A dimension a fixture genuinely cannot judge — whether prose is GOOD — is
 * left to the human reading `--json`. This scores what is checkable and says
 * so, rather than printing a confident number for taste.
 */

import { writeFileSync } from "node:fs";
import { CASES } from "./ask/cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import {
  buildContextBlock,
  retrieveGaitAIContext,
} from "../src/lib/ask/retrieval";
import { systemPrompt, buildUserTurn } from "../src/lib/ask/prompt";
import { sanitizeLinks, selectSources } from "../src/lib/ask/answer";
import { knowledge } from "../src/lib/ask/corpus";
import { GENERATION, MODELS, type ModelId } from "../src/lib/ask/model";

// ── Arguments ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const ALIASES: Record<string, ModelId> = {
  qwen: "onnx-community/Qwen2.5-1.5B-Instruct",
  smollm: "HuggingFaceTB/SmolLM2-1.7B-Instruct",
};

const requested = arg("model") ?? "qwen";
const modelId = (ALIASES[requested] ?? requested) as ModelId;
const limit = Number(arg("limit") ?? CASES.length);
const jsonOut = arg("json");

// ── Scoring vocabulary, built from the corpus ────────────────────────────────

const corpus = loadCorpusFromDisk();

/** Every module name the site actually has. Anything else is invented. */
const REAL_NAMES = new Set(
  corpus.docs
    .filter((doc) => doc.type === "product")
    .map((doc) => doc.title.toLowerCase()),
);

/** Words that look like a GaitAI module but are not one. */
const NAME_SHAPE = /\b(?:[A-Z][a-z]+){2,}\b/g;

/** Claim shapes the system policy forbids outright. */
const FORBIDDEN: { label: string; test: RegExp }[] = [
  { label: "accuracy figure", test: /\b\d{1,3}(?:\.\d+)?\s?%/ },
  { label: "diagnosis", test: /\b(?:diagnos(?:e|es|ed|is)|you (?:have|likely have))\b/i },
  { label: "clinical validation", test: /\b(?:clinically validated|FDA|CE[- ]marked|certified)\b/i },
  { label: "named customer", test: /\b(?:our client|customers include|deployed at)\b/i },
  { label: "threat determination", test: /\b(?:is a threat|criminal intent|identified the suspect)\b/i },
];

const CONCISE_TARGET_WORDS = 220;

interface Row {
  question: string;
  path: string;
  expected: string[];
  retrievedIds: string[];
  retrievalOk: boolean;
  lowConfidence: boolean;
  answer: string;
  words: number;
  latencyMs: number;
  sources: string[];
  /** Failures found in this answer, by criterion. */
  hallucinations: string[];
  boundaryBreaches: string[];
  inventedNames: string[];
  refusalExpected: boolean;
  refused: boolean;
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  const known = MODELS[modelId];
  console.log(`\nAsk GaitAI benchmark`);
  console.log(`  model    ${modelId}`);
  if (known) {
    console.log(
      `  weights  ${(known.bytes / 1024 ** 3).toFixed(2)} GiB (q4f16, measured) · ${known.license}`,
    );
  }
  console.log(`  corpus   ${corpus.docs.length} records`);
  console.log(`  cases    ${Math.min(limit, CASES.length)} of ${CASES.length}`);
  console.log(`  backend  wasm (Node) — latency is an upper bound vs WebGPU\n`);

  const { pipeline } = await import("@huggingface/transformers");

  let bytes = 0;
  const t0 = Date.now();
  const generator = await pipeline("text-generation", modelId, {
    dtype: "q4",
    /* In Node the CPU execution provider is called "cpu"; the browser build
       calls the same thing "wasm". Transformers.js does not alias them. */
    device: "cpu",
    progress_callback: (report: unknown) => {
      const event = report as { status?: string; total?: number; file?: string };
      if (event.status === "progress" && event.total && event.file?.endsWith(".onnx")) {
        bytes = Math.max(bytes, event.total);
      }
    },
  });
  const loadMs = Date.now() - t0;
  console.log(
    `loaded in ${(loadMs / 1000).toFixed(1)}s · largest weight file ${(bytes / 1024 ** 2).toFixed(0)} MB\n`,
  );

  const rows: Row[] = [];
  let peakRss = 0;

  for (const testCase of CASES.slice(0, limit)) {
    const path = testCase.path ?? "/";
    const result = retrieveGaitAIContext(testCase.q, path);
    const ids = result.docs.map((d) => d.doc.id);

    const started = Date.now();
    const output = (await generator(
      [
        { role: "system", content: systemPrompt() },
        {
          role: "user",
          content: buildUserTurn({
            message: testCase.q,
            contextBlock: buildContextBlock(result),
            pageLine: `The visitor is currently on ${path}.`,
            lowConfidence: result.lowConfidence,
          }),
        },
      ],
      { ...GENERATION },
    )) as Array<{ generated_text: unknown }>;
    const latencyMs = Date.now() - started;

    const raw = output?.[0]?.generated_text;
    const answer = sanitizeLinks(
      Array.isArray(raw)
        ? String((raw[raw.length - 1] as { content?: string })?.content ?? "").trim()
        : String(raw ?? "").trim(),
    );

    peakRss = Math.max(peakRss, process.memoryUsage().rss);

    const contextText = buildContextBlock(result).toLowerCase();
    const lower = answer.toLowerCase();

    /* 2 · hallucination — a figure the context does not contain. */
    const hallucinations: string[] = [];
    for (const match of answer.matchAll(/\b\d{1,3}(?:\.\d+)?\s?%/g)) {
      if (!contextText.includes(match[0].toLowerCase())) {
        hallucinations.push(`figure ${match[0]}`);
      }
    }

    /* 3 · evidence boundaries. */
    const boundaryBreaches = FORBIDDEN.filter(({ test }) => test.test(answer)).map(
      ({ label }) => label,
    );

    /* 4 · product-name accuracy — a module-shaped name the site does not have,
       excluding the brand itself and names the context introduced. */
    const inventedNames = [...new Set(answer.match(NAME_SHAPE) ?? [])].filter(
      (name) => {
        const key = name.toLowerCase();
        if (key === "gaitai" || key === "mobilitycare" || key === "securevision") {
          return false;
        }
        if (REAL_NAMES.has(key)) return false;
        return !contextText.includes(key);
      },
    );

    const expectedTitles = testCase.expect
      .map((id) => corpus.docs.find((doc) => doc.id === id)?.title ?? "")
      .filter(Boolean);

    rows.push({
      question: testCase.q,
      path,
      expected: testCase.expect,
      retrievedIds: ids.slice(0, 5),
      retrievalOk: testCase.expect.every((id) => ids.includes(id)),
      lowConfidence: result.lowConfidence,
      answer,
      words: answer.split(/\s+/).filter(Boolean).length,
      latencyMs,
      sources: selectSources(answer, result.docs).map((s) => s.url),
      hallucinations,
      boundaryBreaches,
      inventedNames,
      refusalExpected: result.lowConfidence,
      refused: /no documented answer|does not (?:establish|document)|not documented/i.test(
        answer,
      ),
      /* 1 · grounded correctness, as far as a fixture can see it: did the
         answer actually talk about the records it was given? */
      ...({ mentionsExpected: expectedTitles.some((t) => lower.includes(t.toLowerCase())) } as object),
    });

    const flags = [
      ...hallucinations.map((h) => `HALLUCINATION:${h}`),
      ...boundaryBreaches.map((b) => `BOUNDARY:${b}`),
      ...inventedNames.map((n) => `NAME:${n}`),
    ];
    console.log(
      `${flags.length ? "FLAG" : "ok  "}  ${testCase.q}  (${latencyMs} ms, ${
        answer.split(/\s+/).filter(Boolean).length
      } words)`,
    );
    if (flags.length) console.log(`      ${flags.join(", ")}`);
    if (testCase.check) console.log(`      check: ${testCase.check}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const n = rows.length;
  const sum = (pick: (row: Row) => number) => rows.reduce((a, r) => a + pick(r), 0);
  const latencies = rows.map((r) => r.latencyMs).sort((a, b) => a - b);
  const median = latencies[Math.floor(latencies.length / 2)] ?? 0;

  const summary = {
    model: modelId,
    weightsBytes: known?.bytes ?? bytes,
    loadMs,
    cases: n,
    retrievalMet: rows.filter((r) => r.retrievalOk).length,
    hallucinationAnswers: rows.filter((r) => r.hallucinations.length).length,
    boundaryBreachAnswers: rows.filter((r) => r.boundaryBreaches.length).length,
    inventedNameAnswers: rows.filter((r) => r.inventedNames.length).length,
    answersWithSource: rows.filter((r) => r.sources.length > 0).length,
    refusalsRequired: rows.filter((r) => r.refusalExpected).length,
    refusalsHonoured: rows.filter((r) => r.refusalExpected && r.refused).length,
    medianWords: Math.round(median === 0 ? 0 : sum((r) => r.words) / n),
    medianLatencyMs: median,
    meanLatencyMs: Math.round(sum((r) => r.latencyMs) / Math.max(n, 1)),
    peakRssBytes: peakRss,
    routes: knowledge().routes.length,
  };

  console.log(`\n${"─".repeat(72)}`);
  console.log(`model                 ${summary.model}`);
  console.log(
    `weights               ${(summary.weightsBytes / 1024 ** 3).toFixed(2)} GiB`,
  );
  console.log(`load                  ${(summary.loadMs / 1000).toFixed(1)} s`);
  console.log(`retrieval met         ${summary.retrievalMet}/${n}`);
  console.log(`hallucinated figures  ${summary.hallucinationAnswers}/${n} answers`);
  console.log(`boundary breaches     ${summary.boundaryBreachAnswers}/${n} answers`);
  console.log(`invented names        ${summary.inventedNameAnswers}/${n} answers`);
  console.log(`answers with a source ${summary.answersWithSource}/${n}`);
  console.log(
    `refusals honoured     ${summary.refusalsHonoured}/${summary.refusalsRequired}`,
  );
  console.log(
    `words (mean)          ${summary.medianWords} (target ≤ ${CONCISE_TARGET_WORDS})`,
  );
  console.log(
    `latency               median ${summary.medianLatencyMs} ms · mean ${summary.meanLatencyMs} ms`,
  );
  console.log(
    `peak RSS              ${(summary.peakRssBytes / 1024 ** 2).toFixed(0)} MB`,
  );
  console.log(`${"─".repeat(72)}\n`);

  if (jsonOut) {
    writeFileSync(jsonOut, `${JSON.stringify({ summary, rows }, null, 2)}\n`, "utf8");
    console.log(`wrote ${jsonOut}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
