/**
 * ASK GAITAI — HOSTED MODEL BENCHMARK (Cloudflare Workers AI)
 * =============================================================================
 * Scores candidate Workers AI models against the site's OWN questions — the
 * twelve the migration brief names plus the 25 acceptance cases — through the
 * real retrieval, the real system policy and the real post-processing.
 * Reputation does not enter into it; the only question is which model answers
 * GaitAI's questions better, and how fast.
 *
 * TWO HALVES, ONE IMPLEMENTATION. Workers AI is reachable only through the
 * `AI` binding, i.e. from inside a Worker. So:
 *
 *   1. in one shell:   cd worker && npm run bench:serve
 *      — `wrangler dev` on the local-only benchmark Worker (src/bench-entry.ts,
 *        wrangler.bench.jsonc), which exposes the PRODUCTION adapter
 *        `generate()` from worker/src/workers-ai.ts on http://127.0.0.1:8788
 *   2. in another:     npm run ask:bench
 *      — this script runs retrieval and `buildMessages()` from the shared
 *        modules, POSTs the grounded messages to the loopback Worker, and
 *        scores what comes back
 *
 * Nothing is duplicated: grounding is the shared code, the provider call is
 * the Worker's own. Cloudflare documents that Workers AI "always accesses your
 * Cloudflare account … even in local development", so a run spends the
 * account's daily Neuron allocation (10,000 on Workers Free). That is why the
 * default is the twelve brief questions, one call at a time, four seconds
 * apart, and why a free-allocation or capacity error stops that model's run
 * instead of retrying. No neuron count is reported: the inference API does not
 * return one, and this script does not invent one. Cost is "Workers Free".
 *
 *   npm run ask:bench                                       # the Free-plan candidates, 12 brief questions
 *   npm run ask:bench -- --all                              # brief + the 25 acceptance cases
 *   npm run ask:bench -- --models @cf/zai-org/glm-4.7-flash # one model
 *   npm run ask:bench -- --json tmp/bench.json              # machine-readable
 *   npm run ask:bench -- --endpoint http://127.0.0.1:8788   # a different bench Worker port
 *
 * WHAT IS SCORED, per model
 *   grounding      the answer names the record(s) retrieval surfaced for it
 *   hallucination  a percentage or figure the retrieved context does not contain
 *   boundaries     forbidden claim shapes: diagnosis, certification, customers,
 *                  invented credentials (the brief's own list)
 *   invented names module-shaped names the corpus does not have
 *   instruction    no bare URL, no self-authored Sources block, no reasoning
 *                  trace survives; length inside the policy's ceiling
 *   source support `selectSources()` finds at least one canonical source
 *   latency        wall clock per answer, mean, median and p90
 *   failures       provider errors by class, never retried silently
 *
 * Questions retrieval refuses locally (low confidence, an unknown person, the
 * injection attempt) never reach a model in production, so they are skipped
 * here and counted as local refusals — exactly as the browser behaves.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BENCH_CASES, BRIEF_CASES, type BenchCase } from "./ask/bench-cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { buildContextBlock, retrieveGaitAIContext } from "../src/lib/ask/retrieval";
import { buildMessages } from "../src/lib/ask/prompt";
import { cleanModelAnswer, selectSources } from "../src/lib/ask/answer";

// ── Arguments ────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

/**
 * The comparison set — the models Cloudflare's docs identify as remaining
 * available on Workers Free (checked 2026-09-05). Deliberately three, so a
 * full run does not burn the daily allocation. Models Cloudflare lists as
 * requiring a paid billing method are not candidates.
 */
const DEFAULT_MODELS = [
  "@cf/zai-org/glm-4.7-flash",
  "@cf/google/gemma-4-26b-a4b-it",
  "@cf/nvidia/nemotron-3-120b-a12b",
];

const endpoint = (arg("endpoint") ?? "http://127.0.0.1:8788").replace(/\/+$/, "");
const models = (arg("models") ?? DEFAULT_MODELS.join(",")).split(",").map((m) => m.trim()).filter(Boolean);
const cases: BenchCase[] = flag("all") ? BENCH_CASES : BRIEF_CASES;
const limit = Number(arg("limit") ?? cases.length);
const jsonOut = arg("json");
const maxOutputTokens = Number(arg("max-tokens") ?? 450);
/** One call at a time, spaced out: this is a shared daily allocation. */
const PAUSE_MS = Number(arg("pause-ms") ?? 4_000);
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
  promptTokens: number;
  completionTokens: number;
  sources: string[];
  mentionsExpected: boolean;
  shouldMentionMissing: string[];
  hallucinations: string[];
  boundaryBreaches: string[];
  inventedNames: string[];
  instructionFaults: string[];
  /** Provider failure class (and Cloudflare code) when the call produced no answer. */
  failure?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
};

// ── The call: through the benchmark Worker, which runs the production adapter ─

interface BenchCompletion {
  text: string;
  latencyMs: number;
  usage: { promptTokens: number; completionTokens: number };
}

class BenchFailure extends Error {
  kind: string;
  code: number | null;
  constructor(kind: string, code: number | null) {
    super(`${kind}${code ? `:${code}` : ""}`);
    this.kind = kind;
    this.code = code;
  }
}

async function complete(
  model: string,
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<BenchCompletion> {
  const response = await fetch(`${endpoint}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, maxOutputTokens, timeoutMs: TIMEOUT_MS }),
  });
  const payload = (await response.json()) as Partial<BenchCompletion> & { error?: string; code?: number | null };
  if (!response.ok || payload.error) throw new BenchFailure(payload.error ?? `http_${response.status}`, payload.code ?? null);
  if (typeof payload.text !== "string") throw new BenchFailure("malformed", null);
  return {
    text: payload.text,
    latencyMs: payload.latencyMs ?? 0,
    usage: payload.usage ?? { promptTokens: 0, completionTokens: 0 },
  };
}

async function assertBenchWorker(): Promise<void> {
  try {
    const probe = await fetch(`${endpoint}/generate`, { method: "GET" });
    if (probe.status !== 404) throw new Error(`unexpected status ${probe.status}`);
  } catch (error) {
    console.error(
      `\nThe benchmark Worker is not answering at ${endpoint}.\n` +
        `Start it first, in another shell:\n\n    cd worker && npm run bench:serve\n\n` +
        `It runs the production Workers AI adapter locally through \`wrangler dev\`, which\n` +
        `signs in to the Cloudflare account and spends its daily Neuron allocation.\n` +
        `(${error instanceof Error ? error.message : String(error)})\n`,
    );
    process.exit(2);
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  await assertBenchWorker();

  console.log(`\nAsk GaitAI hosted-model benchmark — Cloudflare Workers AI (Workers Free)`);
  console.log(`  corpus    ${corpus.docs.length} records, built ${corpus.generatedAt}`);
  console.log(`  cases     ${Math.min(limit, cases.length)} (${flag("all") ? "brief + acceptance" : "brief"})`);
  console.log(`  models    ${models.join(", ")}`);
  console.log(`  ceiling   ${maxOutputTokens} output tokens`);
  console.log(`  pacing    ${PAUSE_MS} ms between calls · via ${endpoint}\n`);

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
        promptTokens: 0,
        completionTokens: 0,
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

      const messages = buildMessages({ question: testCase.q, result, pathname, pageTitle: "", history: [] });

      let call: BenchCompletion;
      try {
        call = await complete(model, messages);
      } catch (error) {
        const failure = error instanceof BenchFailure ? error.message : "unknown";
        modelRows.push({ ...base, failure });
        console.log(`ERR   ${testCase.q}  ${failure}`);
        const kind = error instanceof BenchFailure ? error.kind : "";
        if (kind === "free_quota" || kind === "capacity" || kind === "paid_model" || kind === "permission" || kind === "invalid_model") {
          console.log(`      ${kind} — stopping this model's run rather than retrying.`);
          break;
        }
        await sleep(PAUSE_MS);
        continue;
      }

      const raw = call.text;
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
        if (["gaitai", "mobilitycare", "securevision"].includes(key)) return false;
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
        promptTokens: call.usage.promptTokens,
        completionTokens: call.usage.completionTokens,
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
        `${flags.length ? "FLAG" : "ok  "}  ${testCase.q}  (${call.latencyMs} ms · ${words} words · ${call.usage.promptTokens}+${call.usage.completionTokens} tok)`,
      );
      if (flags.length) console.log(`      ${flags.join(", ")}`);
      if (testCase.check) console.log(`      check: ${testCase.check}`);
      await sleep(PAUSE_MS);
    }

    const answered = modelRows.filter((r) => !r.skipped && !r.failure);
    const latencies = answered.map((r) => r.latencyMs);
    const n = answered.length;
    const failures = modelRows.filter((r) => r.failure).map((r) => r.failure as string);
    const summary = {
      model,
      cost: "Workers Free (daily Neuron allocation; count not reported by the API)",
      cases: modelRows.length,
      answered: n,
      skippedLocalRefusals: modelRows.filter((r) => r.skipped).length,
      failures: failures.length,
      failureClasses: [...new Set(failures)],
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
    };
    summaries.push(summary);
    rows.push(...modelRows);

    console.log(`\n${"─".repeat(72)}`);
    console.log(`model                 ${summary.model}`);
    console.log(`cost                  ${summary.cost}`);
    console.log(`answered              ${summary.answered}/${summary.cases} (${summary.skippedLocalRefusals} local refusals, ${summary.failures} failures${summary.failureClasses.length ? `: ${summary.failureClasses.join(", ")}` : ""})`);
    console.log(`grounded              ${summary.groundedAnswers}/${n}`);
    console.log(`hallucinated figures  ${summary.hallucinationAnswers}/${n}`);
    console.log(`boundary breaches     ${summary.boundaryBreachAnswers}/${n}`);
    console.log(`invented names        ${summary.inventedNameAnswers}/${n}`);
    console.log(`instruction faults    ${summary.instructionFaultAnswers}/${n}`);
    console.log(`answers with a source ${summary.answersWithSource}/${n}`);
    console.log(`words (mean)          ${summary.meanWords} (target ≤ ${CONCISE_TARGET_WORDS})`);
    console.log(`latency               mean ${summary.meanLatencyMs} ms · median ${summary.medianLatencyMs} ms · p90 ${summary.p90LatencyMs} ms`);
    console.log(`tokens (mean)         ${summary.meanPromptTokens} in · ${summary.meanCompletionTokens} out (when the model reports them)`);
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
