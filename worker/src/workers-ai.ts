/**
 * THE HOSTED MODEL — one `env.AI.run()` call to Cloudflare Workers AI.
 * =============================================================================
 * Contract, verified against developers.cloudflare.com on 2026-09-05:
 *
 *   wrangler.jsonc   { "ai": { "binding": "AI" } }
 *   runtime          await env.AI.run(model, { messages, max_completion_tokens,
 *                                             temperature, top_p })
 *   messages         [{ role: "system" | "user" | "assistant", content }]
 *   output           OpenAI-compatible for the Free-plan candidates:
 *                    { choices: [{ message: { content } }], usage: {...} }
 *                    (older text-generation models answer { response: string };
 *                    both are read, defensively)
 *
 * WHAT THE MODEL RECEIVES is decided upstream by the shared prompt module —
 * the system policy, a bounded history, the canonical records and, last, the
 * visitor's question. This module only hands that conversation to the binding
 * with conservative sampling and a deadline, and reads the text back.
 *
 * NO SECRET, NO TOKEN, NO EXTERNAL API. The binding is the Worker's own
 * environment; there is nothing to leak. That also means, per Cloudflare's
 * docs, that every call — including one from `wrangler dev` — runs against the
 * account and spends its daily Neuron allocation. The tests mock `env.AI`.
 *
 * WHAT IS DELIBERATELY NOT SENT. No `tools`, no images, no files: `messages`
 * carry text only, and the Worker's validator has already dropped anything
 * else. If a model returns a `reasoning_content` field it is ignored, and
 * `cleanModelAnswer` strips any trace that leaks into the text.
 *
 * REASONING EFFORT. The Free-plan candidates are reasoning models and their
 * schemas document `reasoning_effort: "low" | "medium" | "high"`. Left to
 * their default they spend the completion budget thinking: the first real
 * calls returned an EMPTY answer at 450 tokens and, at 1 200, seventeen visible
 * words after exactly 1 200 completion tokens. So the effort is a config knob
 * (MODEL_REASONING_EFFORT, production "low") and is sent only when set.
 */

/**
 * What went wrong at the provider, by class — the browser treats every one
 * the same way (it falls back), but the Worker's status code and log line
 * differ. Mapped from the documented Workers AI error codes:
 *   free_quota       3036 / 429 — the account's daily 10,000-Neuron free
 *                    allocation is used up (resets 00:00 UTC)
 *   capacity         3040 / 429 — "No more data centers to forward the request to"
 *   paid_model       5035 / 403 — the model requires the Workers Paid plan
 *   permission       3023 / 403 account blocked · 5016 / 403 model agreement
 *                    not accepted · 5018, 3041 / 403 account not allowed
 *   invalid_model    5007 / 400 no such model or task · 3042 / 404 invalid id
 *   invalid_request  any other 4xx the binding reports
 *   timeout          3007 / 408 from the provider, or our own deadline
 *   malformed        a result that is not the documented shape
 *   empty            a result with no answer text
 *   upstream         anything else — a 5xx, an unclassified exception
 */
export type WorkersAiFailure =
  | "free_quota"
  | "capacity"
  | "paid_model"
  | "permission"
  | "invalid_model"
  | "invalid_request"
  | "timeout"
  | "malformed"
  | "empty"
  | "upstream";

/**
 * SAFE STRUCTURAL METADATA about a model result — shape, lengths and counts,
 * never text. This is what the benchmark prints when a model comes back with
 * nothing visible, and what the Worker logs on such a failure. Every field is
 * either a number, a boolean, a short enum-like string the provider emitted
 * (`finish_reason`), a key name, or `null` when the provider did not supply
 * it. By construction there is no way to put prompt text, record text, the
 * visitor's question, generated prose or reasoning text into this object.
 */
export interface ResultDiagnostics {
  model: string;
  elapsedMs: number;
  /** `typeof result`, or "array" / "null". */
  resultType: string;
  /** Top-level keys of an object result; empty otherwise. */
  topLevelKeys: string[];
  choicesCount: number | null;
  finishReason: string | null;
  /** Keys of `choices[0].message`, when present. */
  messageKeys: string[];
  /** Length of the visible answer text; 0 when absent. */
  contentChars: number;
  /** Length of `reasoning_content` ONLY — its text is never read out. */
  reasoningChars: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  /** Whether an older-style `{ response }` field exists, and its length. */
  hasLegacyResponse: boolean;
  legacyResponseChars: number | null;
}

/** Truncate an opaque key name so a hostile provider cannot smuggle text in. */
const keyName = (key: string) => key.slice(0, 40);
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;
const textLength = (value: unknown): number | null =>
  typeof value === "string" ? value.length : null;

/**
 * Describe a result without reading any of its text out. The only string
 * values copied are `finish_reason` (an enum-like token, truncated) and key
 * names (truncated); everything else is a length, a count or a boolean.
 */
export function describeResult(
  result: unknown,
  context: { model: string; elapsedMs: number },
): ResultDiagnostics {
  const base: ResultDiagnostics = {
    model: context.model,
    elapsedMs: context.elapsedMs,
    resultType: result === null ? "null" : Array.isArray(result) ? "array" : typeof result,
    topLevelKeys: [],
    choicesCount: null,
    finishReason: null,
    messageKeys: [],
    contentChars: 0,
    reasoningChars: null,
    promptTokens: null,
    completionTokens: null,
    totalTokens: null,
    hasLegacyResponse: false,
    legacyResponseChars: null,
  };
  if (!result || typeof result !== "object" || Array.isArray(result)) return base;

  const record = result as Record<string, unknown>;
  base.topLevelKeys = Object.keys(record).slice(0, 20).map(keyName);

  const choices = record.choices;
  if (Array.isArray(choices)) {
    base.choicesCount = choices.length;
    const first = choices[0];
    if (first && typeof first === "object") {
      const choice = first as Record<string, unknown>;
      const finish = choice.finish_reason;
      base.finishReason = typeof finish === "string" ? finish.slice(0, 32) : null;
      const message = choice.message;
      if (message && typeof message === "object") {
        const m = message as Record<string, unknown>;
        base.messageKeys = Object.keys(m).slice(0, 20).map(keyName);
        base.contentChars = textLength(m.content) ?? 0;
        base.reasoningChars = textLength(m.reasoning_content) ?? textLength(m.reasoning);
      }
    }
  }

  if ("response" in record) {
    base.hasLegacyResponse = true;
    base.legacyResponseChars = textLength(record.response);
    if (base.contentChars === 0) base.contentChars = base.legacyResponseChars ?? 0;
  }

  const usage = record.usage;
  if (usage && typeof usage === "object") {
    const u = usage as Record<string, unknown>;
    base.promptTokens = finite(u.prompt_tokens) ?? finite(u.input_tokens);
    base.completionTokens = finite(u.completion_tokens) ?? finite(u.output_tokens);
    base.totalTokens = finite(u.total_tokens);
  }
  return base;
}

export class WorkersAiError extends Error {
  kind: WorkersAiFailure;
  /** Cloudflare's numeric error code, when one was present. For logs only. */
  code?: number;
  /** Safe structural metadata about the result, for `malformed` and `empty`. */
  diagnostics?: ResultDiagnostics;
  constructor(kind: WorkersAiFailure, code?: number, diagnostics?: ResultDiagnostics) {
    super(`workers-ai:${kind}${code ? `:${code}` : ""}`);
    this.name = "WorkersAiError";
    this.kind = kind;
    this.code = code;
    this.diagnostics = diagnostics;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Completion {
  text: string;
  latencyMs: number;
  /** Token counts when the model reports them; zeros otherwise. Neurons are
   *  not reported by the inference API and are never estimated here. */
  usage: { promptTokens: number; completionTokens: number };
  /** Safe structural metadata about the result — lengths and counts, no text. */
  diagnostics: ResultDiagnostics;
}

/** As close to deterministic as a sampler gets: the answer must not drift. */
export const SAMPLING = { temperature: 0.2, top_p: 0.9 } as const;

/** The smallest surface of the binding this module needs; the real `Ai` type
 *  from worker-configuration.d.ts satisfies it, and so does a test mock. */
export interface AiRunner {
  run(model: string, inputs: Record<string, unknown>, options?: Record<string, unknown>): Promise<unknown>;
}

export type ReasoningEffort = "low" | "medium" | "high";
const REASONING_EFFORTS = new Set<string>(["low", "medium", "high"]);

/**
 * The input every Free-plan candidate documents. `reasoning_effort` is added
 * ONLY when a valid level is configured; an empty or unknown value sends
 * nothing and leaves the model's own default in place.
 */
export function toWorkersAiInput(
  messages: ChatMessage[],
  options: { maxOutputTokens: number; reasoningEffort?: string },
): Record<string, unknown> {
  const input: Record<string, unknown> = {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    max_completion_tokens: options.maxOutputTokens,
    ...SAMPLING,
  };
  const effort = (options.reasoningEffort ?? "").trim().toLowerCase();
  if (REASONING_EFFORTS.has(effort)) input.reasoning_effort = effort as ReasoningEffort;
  return input;
}

/**
 * Cloudflare surfaces inference errors from the binding as thrown errors whose
 * message carries the numeric code, e.g. "3036: You have used up your daily
 * free allocation of 10,000 neurons…" (the exact prefix varies by runtime
 * version: "AiError: 3036: …", "InferenceUpstreamError: …"). The number is the
 * stable part, so it is what is matched; the text is never forwarded.
 */
const CODE_CLASS: Record<number, WorkersAiFailure> = {
  3036: "free_quota",
  3040: "capacity",
  5035: "paid_model",
  3023: "permission",
  5016: "permission",
  5018: "permission",
  3041: "permission",
  5007: "invalid_model",
  3042: "invalid_model",
  3007: "timeout",
};

export function classifyError(error: unknown): WorkersAiError {
  if (error instanceof WorkersAiError) return error;
  const message = error instanceof Error ? error.message : String(error ?? "");
  const name = error instanceof Error ? error.name : "";
  if (name === "AbortError") return new WorkersAiError("timeout");

  const code = Number(/\b(\d{4})\b/.exec(message)?.[1]);
  if (Number.isFinite(code) && CODE_CLASS[code]) return new WorkersAiError(CODE_CLASS[code], code);

  /* An HTTP status without a Cloudflare code — keep the class honest. */
  const status = Number(/\b(4\d\d|5\d\d)\b/.exec(message)?.[1]);
  if (status === 429) return new WorkersAiError("capacity");
  if (status === 408) return new WorkersAiError("timeout");
  if (status === 403) return new WorkersAiError("permission");
  if (status === 400 || status === 404) return new WorkersAiError("invalid_request");
  return new WorkersAiError("upstream", Number.isFinite(code) ? code : undefined);
}

interface OpenAiShape {
  choices?: { message?: { content?: unknown } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number };
}
interface LegacyShape {
  response?: unknown;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * Read the answer text out of either documented result shape. A `malformed` or
 * `empty` failure carries the safe diagnostics of the result that caused it,
 * so the benchmark can say WHY nothing came back without seeing any text.
 */
export function extractText(
  result: unknown,
  context: { model: string; elapsedMs: number } = { model: "", elapsedMs: 0 },
): { text: string; usage: Completion["usage"] } {
  const diagnostics = describeResult(result, context);
  if (!result || typeof result !== "object") throw new WorkersAiError("malformed", undefined, diagnostics);
  const openai = result as OpenAiShape;
  const legacy = result as LegacyShape;

  let text: unknown;
  if (Array.isArray(openai.choices)) {
    text = openai.choices[0]?.message?.content;
  } else if ("response" in legacy) {
    text = legacy.response;
  } else {
    throw new WorkersAiError("malformed", undefined, diagnostics);
  }
  if (text !== undefined && text !== null && typeof text !== "string") {
    throw new WorkersAiError("malformed", undefined, diagnostics);
  }
  if (typeof text !== "string" || !text.trim()) throw new WorkersAiError("empty", undefined, diagnostics);

  const usage = openai.usage ?? legacy.usage ?? {};
  return {
    text,
    usage: {
      promptTokens: usage.prompt_tokens ?? (usage as { input_tokens?: number }).input_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? (usage as { output_tokens?: number }).output_tokens ?? 0,
    },
  };
}

export async function generate(options: {
  ai: AiRunner;
  model: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
  /** "low" | "medium" | "high"; omitted or unknown → the model's default. */
  reasoningEffort?: string;
}): Promise<Completion> {
  const { ai, model, messages, maxOutputTokens, timeoutMs, reasoningEffort } = options;
  const started = Date.now();

  /* The binding takes no AbortSignal, so the deadline is a race: when the
     timer wins, the caller gets `timeout` and whatever the binding eventually
     returns is discarded. */
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new WorkersAiError("timeout")), timeoutMs);
  });

  let result: unknown;
  try {
    result = await Promise.race([
      ai.run(model, toWorkersAiInput(messages, { maxOutputTokens, reasoningEffort })),
      deadline,
    ]);
  } catch (error) {
    throw classifyError(error);
  } finally {
    /* Typed for both the Workers runtime and Node (the benchmark script imports
       this module's types), neither of which accepts `null` here. */
    if (timer !== undefined) clearTimeout(timer);
  }

  const latencyMs = Date.now() - started;
  const { text, usage } = extractText(result, { model, elapsedMs: latencyMs });
  return { text, usage, latencyMs, diagnostics: describeResult(result, { model, elapsedMs: latencyMs }) };
}
