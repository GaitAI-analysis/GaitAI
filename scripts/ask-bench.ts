/**
 * ASK GAITAI — HOSTED MODEL BENCHMARK
 * =============================================================================
 * Scores candidate models on Hugging Face Inference Providers against the
 * site's OWN questions — the twelve the migration brief names plus the 25
 * acceptance cases — through the real retrieval, the real system policy and
 * the real post-processing. Reputation and parameter count do not enter into
 * it; the only question is which model answers GaitAI's questions better, and
 * at what latency and cost.
 *
 *   HF_TOKEN=… npm run ask:bench                                  # the default candidates
 *   HF_TOKEN=… npm run ask:bench -- --models Qwen/Qwen3-8B,google/gemma-3-12b-it
 *   HF_TOKEN=… npm run ask:bench -- --brief                        # the 12 brief questions only
 *   HF_TOKEN=… npm run ask:bench -- --json tmp/bench.json          # machine-readable
 *
 * THE PROVIDER CALL IS THE WORKER'S. `chatCompletion` is imported from
 * worker/src/hf.ts — the same function, the same headers, the same sampling,
 * the same thinking switch — so the benchmark measures the deployed call path
 * and no provider or auth code exists anywhere but the Worker.
 *
 * WHAT IS SCORED, per model
 *   grounding      the answer names the record(s) retrieval surfaced for it
 *   hallucination  a percentage or figure the retrieved context does not contain
 *   boundaries     forbidden claim shapes: diagnosis, certification, customers,
 *                  invented credentials (the brief's own list)
 *   invented names module-shaped names the corpus does not have
 *   instruction    no bare URL, no self-authored Sources block, no reasoning
 *                  trace survives; length inside the policy's ceiling
 *   latency        wall clock per answer, median and p90
 *   cost           tokens × the provider's published price, from the router
 *
 * Questions retrieval refuses locally (low confidence, an unknown person, the
 * injection attempt) never reach a model in production, so they are skipped
 * here and counted as local refusals — exactly as the browser behaves.
 *
 * The prompt the model sees is `buildMessages()` from src/lib/ask/prompt.ts —
 * the same function the Worker imports. What is benchmarked is byte-for-byte
 * what is deployed.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BENCH_CASES, BRIEF_CASES, type BenchCase } from "./ask/bench-cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { buildContextBlock, retrieveGaitAIContext } from "../src/lib/ask/retrieval";
import { buildMessages } from "../src/lib/ask/prompt";
import { cleanModelAnswer, selectSources } from "../src/lib/ask/answer";
import { chatCompletion, HF_MODELS_URL } from "../worker/src/hf";

// ── Arguments ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const DEFAULT_MODELS = [
  "Qwen/Qwen3-8B",
  "meta-llama/Llama-3.1-8B-Instruct",
  "google/gemma-3-12b-it",
];

const token = process.env.HF_TOKEN ?? "";
if (!token) {
  console.error(
    "\nHF_TOKEN is not set. The benchmark calls Hugging Face Inference Providers and needs a\n" +
      "read token with Inference Providers enabled. It is a shell variable here and a Cloudflare\n" +
      "Worker secret in production — never a NEXT_PUBLIC_ variable and never committed.\n",
  );
  process.exit(2);
}

const models = (arg("models") ?? DEFAULT_MODELS.join(",")).split(",").map((m) => m.trim()).filter(Boolean);
const cases: BenchCase[] = flag("brief") ? BRIEF_CASES : BENCH_CASES;
const limit = Number(arg("limit") ?? cases.length);
const jsonOut = arg("json");
const maxTokens = Number(arg("max-tokens") ?? 450);
const TIMEOUT_MS = 40_000;

// ── Scoring vocabulary, built from the corpus ────────────────────────────────

const corpus = loadCorpusFromDisk();

const REAL_NAMES = new Set(
  corpus.docs.filter((doc) => doc.type === "product").map((doc) => doc.title.toLowerCase()),
);
const NAME_SHAPE = /\b(?:[A-Z][a-z]+){2,}\b/g;

const FORBIDDEN: { label: string; test: RegExp }[] = [
  { label: "diagnosis", test: /\b(?:GaitAI|NeuroMotion|it|which|that)\s+(?:can|does|will)\s+diagnose\b(?!\s*(?:,|\.)?\s*(?:but|however|no|not|nor|—))/i },
  { label: "clinical validation", test: /\b(?:clinically validated|FDA[- ]cleared|FDA approved|CE[- ]marked|ISO 27001 certified|HIPAA compliant|SOC 2 certified)\b/i },
  { label: "named customer", test: /\b(?:our client|customers include|deployed at|is used by)\b/i },
  { label: "threat determination", test: /\b(?:is a threat|criminal intent|identified the suspect)\b/i },
  { label: "invented credential", test: /\b(?:PhD|Ph\.D|holds a doctorate|professor at|graduated from|studied at)\b/i },
];

const CONCISE_TARGET_WORDS = 260;

interface Row {
  model: string;
  question: string;
  path: string;
  skipped: "local-refusal" | null;
  expected: string[];
  retrievedIds: string[];
  retrievalOk: boolean;
  answer: string;
  words: number;
  latencyMs: number;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  sources: string[];
  mentionsExpected: boolean;
  shouldMentionMissing: string[];
  hallucinations: string[];
  boundaryBreaches: string[];
  inventedNames: string[];
  instructionFaults: string[];
  error?: string;
}

// ── Provider pricing, from the router's own model list ───────────────────────

interface ProviderInfo {
  provider: string;
  status: string;
  pricing?: { input: number; output: number };
  first_token_latency_ms?: number;
}

async function pricing(): Promise<Map<string, ProviderInfo[]>> {
  const map = new Map<string, ProviderInfo[]>();
  try {
    const response = await fetch(HF_MODELS_URL);
    const payload = (await response.json()) as { data?: { id: string; providers?: ProviderInfo[] }[] };
    for (const entry of payload.data ?? []) map.set(entry.id, entry.providers ?? []);
  } catch {
    /* Cost column stays at zero; everything else still runs. */
  }
  return map;
}

/** USD for one call, given the provider the router actually used. */
function costFor(
  providers: ProviderInfo[] | undefined,
  provider: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const match =
    providers?.find((p) => p.provider === provider && p.pricing) ??
    providers?.find((p) => p.pricing);
  if (!match?.pricing) return 0;
  /* Router prices are USD per million tokens. */
  return (promptTokens * match.pricing.input + completionTokens * match.pricing.output) / 1_000_000;
}

// ── One call — the Worker's own ─────────────────────────────────────────────

async function complete(model: string, messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const result = await chatCompletion({ token, model, messages, maxTokens, timeoutMs: TIMEOUT_MS });
  return {
    raw: result.text,
    latencyMs: result.latencyMs,
    provider: result.provider,
    promptTokens: result.usage.promptTokens,
    completionTokens: result.usage.completionTokens,
  };
}

// ── Run ──────────────────────────────────────────────────────────────────────

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

async function main() {
  const prices = await pricing();
  console.log(`\nAsk GaitAI hosted-model benchmark`);
  console.log(`  corpus   ${corpus.docs.length} records, built ${corpus.generatedAt}`);
  console.log(`  cases    ${Math.min(limit, cases.length)} (${flag("brief") ? "brief" : "brief + acceptance"})`);
  console.log(`  models   ${models.join(", ")}`);
  console.log(`  ceiling  ${maxTokens} output tokens\n`);

  const rows: Row[] = [];
  const summaries: Record<string, unknown>[] = [];

  for (const model of models) {
    console.log(`${"═".repeat(72)}\n${model}\n${"═".repeat(72)}`);
    const modelRows: Row[] = [];

    for (const testCase of cases.slice(0, limit)) {
      const pathname = testCase.path ?? "/";
      const result = retrieveGaitAIContext(testCase.q, pathname);
      const ids = result.docs.map((d) => d.doc.id);
      const expectedTitles = testCase.expect
        .map((id) => corpus.docs.find((doc) => doc.id === id)?.title ?? "")
        .filter(Boolean);

      const base: Row = {
        model,
        question: testCase.q,
        path: pathname,
        skipped: null,
        expected: testCase.expect,
        retrievedIds: ids.slice(0, 5),
        retrievalOk: testCase.expect.every((id) => ids.includes(id)),
        answer: "",
        words: 0,
        latencyMs: 0,
        provider: "",
        promptTokens: 0,
        completionTokens: 0,
        costUsd: 0,
        sources: [],
        mentionsExpected: false,
        shouldMentionMissing: [],
        hallucinations: [],
        boundaryBreaches: [],
        inventedNames: [],
        instructionFaults: [],
      };

      if (result.lowConfidence || result.docs.length === 0) {
        modelRows.push({ ...base, skipped: "local-refusal" });
        console.log(`skip  ${testCase.q}  (retrieval refuses locally — no model call in production)`);
        continue;
      }

      const messages = buildMessages({
        question: testCase.q,
        result,
        pathname,
        pageTitle: "",
        history: [],
      });

      let raw = "";
      let call: Awaited<ReturnType<typeof complete>> | null = null;
      try {
        call = await complete(model, messages);
        raw = call.raw;
      } catch (error) {
        modelRows.push({ ...base, error: (error as Error).message });
        console.log(`ERR   ${testCase.q}  ${(error as Error).message}`);
        continue;
      }

      const answer = cleanModelAnswer(raw);
      const contextText = buildContextBlock(result).toLowerCase();
      const lower = answer.toLowerCase();

      const hallucinations: string[] = [];
      for (const match of answer.matchAll(/\b\d{1,3}(?:\.\d+)?\s?%/g)) {
        if (!contextText.includes(match[0].toLowerCase())) hallucinations.push(`figure ${match[0]}`);
      }

      const boundaryBreaches = [
        ...FORBIDDEN.filter(({ test }) => test.test(answer)).map(({ label }) => label),
        ...(testCase.mustNot ?? []).filter((re) => re.test(answer)).map(() => "brief:mustNot"),
      ];

      const inventedNames = [...new Set(answer.match(NAME_SHAPE) ?? [])].filter((name) => {
        const key = name.toLowerCase();
        if (["gaitai", "mobilitycare", "securevision", "webgpu"].includes(key)) return false;
        if (REAL_NAMES.has(key)) return false;
        return !contextText.includes(key);
      });

      const instructionFaults: string[] = [];
      if (/https?:\/\//i.test(raw)) instructionFaults.push("bare URL");
      if (/^\s*(?:#{1,6}\s*)?\**\s*sources?\s*:?\s*\**\s*$/im.test(raw)) instructionFaults.push("own Sources block");
      if (/<think>/i.test(raw)) instructionFaults.push("reasoning trace");
      if (/^\s*great question/i.test(raw)) instructionFaults.push("preamble");
      const words = answer.split(/\s+/).filter(Boolean).length;
      if (words > CONCISE_TARGET_WORDS) instructionFaults.push(`long (${words} words)`);
      if (!answer) instructionFaults.push("empty after cleaning");

      const shouldMentionMissing = (testCase.shouldMention ?? []).filter(
        (phrase) => !lower.includes(phrase.toLowerCase()),
      );

      const row: Row = {
        ...base,
        answer,
        words,
        latencyMs: call.latencyMs,
        provider: call.provider,
        promptTokens: call.promptTokens,
        completionTokens: call.completionTokens,
        costUsd: costFor(prices.get(model.split(":")[0]), call.provider, call.promptTokens, call.completionTokens),
        sources: selectSources(answer, result.docs).map((s) => s.url),
        mentionsExpected:
          expectedTitles.length === 0 || expectedTitles.some((t) => lower.includes(t.toLowerCase())),
        shouldMentionMissing,
        hallucinations,
        boundaryBreaches,
        inventedNames,
        instructionFaults,
      };
      modelRows.push(row);

      const flags = [
        ...(!row.mentionsExpected ? ["GROUNDING:expected record not named"] : []),
        ...shouldMentionMissing.map((s) => `GROUNDING:missing "${s}"`),
        ...hallucinations.map((h) => `HALLUCINATION:${h}`),
        ...boundaryBreaches.map((b) => `BOUNDARY:${b}`),
        ...inventedNames.map((n) => `NAME:${n}`),
        ...instructionFaults.map((f) => `INSTRUCTION:${f}`),
      ];
      console.log(
        `${flags.length ? "FLAG" : "ok  "}  ${testCase.q}  (${call.latencyMs} ms · ${words} words · ${call.provider || "?"} · $${row.costUsd.toFixed(5)})`,
      );
      if (flags.length) console.log(`      ${flags.join(", ")}`);
      if (testCase.check) console.log(`      check: ${testCase.check}`);
    }

    const answered = modelRows.filter((r) => !r.skipped && !r.error);
    const latencies = answered.map((r) => r.latencyMs);
    const n = answered.length;
    const summary = {
      model,
      cases: modelRows.length,
      answered: n,
      skippedLocalRefusals: modelRows.filter((r) => r.skipped).length,
      errors: modelRows.filter((r) => r.error).length,
      groundedAnswers: answered.filter((r) => r.mentionsExpected && r.shouldMentionMissing.length === 0).length,
      hallucinationAnswers: answered.filter((r) => r.hallucinations.length).length,
      boundaryBreachAnswers: answered.filter((r) => r.boundaryBreaches.length).length,
      inventedNameAnswers: answered.filter((r) => r.inventedNames.length).length,
      instructionFaultAnswers: answered.filter((r) => r.instructionFaults.length).length,
      answersWithSource: answered.filter((r) => r.sources.length > 0).length,
      meanWords: n ? Math.round(answered.reduce((a, r) => a + r.words, 0) / n) : 0,
      meanLatencyMs: n ? Math.round(latencies.reduce((a, b) => a + b, 0) / n) : 0,
      medianLatencyMs: percentile(latencies, 50),
      p90LatencyMs: percentile(latencies, 90),
      meanPromptTokens: n ? Math.round(answered.reduce((a, r) => a + r.promptTokens, 0) / n) : 0,
      meanCompletionTokens: n ? Math.round(answered.reduce((a, r) => a + r.completionTokens, 0) / n) : 0,
      meanCostUsd: n ? answered.reduce((a, r) => a + r.costUsd, 0) / n : 0,
      providers: [...new Set(answered.map((r) => r.provider).filter(Boolean))],
    };
    summaries.push(summary);
    rows.push(...modelRows);

    console.log(`\n${"─".repeat(72)}`);
    console.log(`model                 ${summary.model}`);
    console.log(`answered              ${summary.answered}/${summary.cases} (${summary.skippedLocalRefusals} local refusals, ${summary.errors} errors)`);
    console.log(`grounded              ${summary.groundedAnswers}/${n}`);
    console.log(`hallucinated figures  ${summary.hallucinationAnswers}/${n}`);
    console.log(`boundary breaches     ${summary.boundaryBreachAnswers}/${n}`);
    console.log(`invented names        ${summary.inventedNameAnswers}/${n}`);
    console.log(`instruction faults    ${summary.instructionFaultAnswers}/${n}`);
    console.log(`answers with a source ${summary.answersWithSource}/${n}`);
    console.log(`words (mean)          ${summary.meanWords} (target ≤ ${CONCISE_TARGET_WORDS})`);
    console.log(`latency               mean ${summary.meanLatencyMs} ms · median ${summary.medianLatencyMs} ms · p90 ${summary.p90LatencyMs} ms`);
    console.log(`tokens (mean)         ${summary.meanPromptTokens} in · ${summary.meanCompletionTokens} out`);
    console.log(`cost (mean per call)  $${summary.meanCostUsd.toFixed(5)}  via ${summary.providers.join(", ") || "n/a"}`);
    console.log(`${"─".repeat(72)}\n`);
  }

  if (jsonOut) {
    mkdirSync(path.dirname(jsonOut), { recursive: true });
    writeFileSync(jsonOut, `${JSON.stringify({ summaries, rows }, null, 2)}\n`, "utf8");
    console.log(`wrote ${jsonOut}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
