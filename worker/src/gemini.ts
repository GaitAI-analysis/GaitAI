/**
 * THE HOSTED MODEL — one `generateContent` call to the Google Gemini Developer API.
 * =============================================================================
 * Contract, verified against ai.google.dev/api/generate-content and
 * ai.google.dev/gemini-api/docs/api-key on 2026-09-05:
 *
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 *   x-goog-api-key: <GEMINI_API_KEY>
 *   { systemInstruction: { parts: [{ text }] },
 *     contents: [{ role: "user" | "model", parts: [{ text }] }],
 *     generationConfig: { temperature, topP, maxOutputTokens, candidateCount } }
 *   → { candidates: [{ content: { parts: [{ text }] }, finishReason }],
 *       promptFeedback?: { blockReason }, usageMetadata: { promptTokenCount, candidatesTokenCount } }
 *
 * WHAT THE MODEL RECEIVES is decided upstream by the shared prompt module —
 * the system policy, a bounded history, the canonical records and, last, the
 * visitor's question. This module only maps that conversation onto Gemini's
 * shape, adds conservative sampling and a deadline, and reads the text back.
 *
 * WHAT IS DELIBERATELY NOT SENT. No `tools` — in particular no Google Search
 * grounding: GaitAI's own canonical records, not the web, define what the
 * assistant may claim. No images, audio, video or files: `parts` carry text
 * only, and the Worker's validator has already dropped anything else.
 *
 * THE KEY arrives as an argument, read by the caller from the Worker's secret
 * binding. It is used in one request header and appears nowhere else — not in
 * a URL, not in a log, not in an error, not in a response.
 *
 * FREE TIER. This is built to run on the Gemini API Free Tier: an API key, no
 * billing account, no Vertex AI. Google states that content submitted on the
 * Free Tier may be used to improve its products — one more reason the request
 * is text-only and Movement Lab material never reaches this module.
 */

export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const geminiUrl = (model: string) =>
  `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`;

/**
 * What went wrong at the provider, by class — the browser treats every one
 * the same way (it falls back), but the Worker's status code and log line
 * differ. Mapped from the documented Gemini API errors (api-errors page):
 *   auth             401 UNAUTHENTICATED / 403 PERMISSION_DENIED — the key is
 *                    missing, invalid, expired or lacks permission
 *   quota            429 RESOURCE_EXHAUSTED — per-minute rate limit or the
 *                    daily Free Tier quota; the Worker's own daily budget is
 *                    meant to trip first
 *   invalid_request  400 INVALID_ARGUMENT / FAILED_PRECONDITION (e.g. Free
 *                    Tier not available in the project's region), 404 (model
 *                    name), 416 — our request or configuration is wrong
 *   upstream         500 / 503 / 504 and anything else the provider returns
 *   malformed        a reply that was not JSON, or not the documented shape
 *   blocked          the prompt or the candidate was blocked (safety,
 *                    recitation, prohibited content, blocklist, SPII)
 *   empty            a 200 with no candidate text
 *   timeout          no answer within the deadline
 */
export type GeminiFailure =
  | "auth"
  | "quota"
  | "invalid_request"
  | "upstream"
  | "malformed"
  | "blocked"
  | "empty"
  | "timeout";

export class GeminiError extends Error {
  kind: GeminiFailure;
  status?: number;
  constructor(kind: GeminiFailure, status?: number) {
    super(`gemini:${kind}${status ? `:${status}` : ""}`);
    this.name = "GeminiError";
    this.kind = kind;
    this.status = status;
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface Completion {
  text: string;
  finishReason: string;
  usage: { promptTokens: number; completionTokens: number };
  latencyMs: number;
}

/** As close to deterministic as a sampler gets: the answer must not drift. */
export const SAMPLING = { temperature: 0.2, topP: 0.9 } as const;

/** finishReason values that mean the answer was withheld, not written. */
const BLOCKED_FINISH = new Set(["SAFETY", "RECITATION", "LANGUAGE", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"]);

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

/**
 * The shared prompt is OpenAI-shaped (system / user / assistant). Gemini takes
 * the system text separately and calls the assistant "model". Roles must
 * alternate and the last turn must be the user's — the shared builder already
 * guarantees both.
 */
export function toGeminiBody(
  messages: ChatMessage[],
  options: { maxOutputTokens: number; thinkingLevel?: string },
): Record<string, unknown> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  const generationConfig: Record<string, unknown> = {
    ...SAMPLING,
    maxOutputTokens: options.maxOutputTokens,
    candidateCount: 1,
  };
  /* Optional, off by default: a `thinkingLevel` for models that expose one
     (the docs list minimal/low/medium/high per model). Left unset, the model
     uses its own default. Thought text is never requested and never read. */
  if (options.thinkingLevel) {
    generationConfig.thinkingConfig = { thinkingLevel: options.thinkingLevel };
  }

  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
    generationConfig,
  };
}

export async function generate(options: {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  maxOutputTokens: number;
  timeoutMs: number;
  thinkingLevel?: string;
  /** Injectable for unit tests; defaults to the platform fetch. */
  fetchImpl?: typeof fetch;
}): Promise<Completion> {
  const { apiKey, model, messages, maxOutputTokens, timeoutMs, thinkingLevel } = options;
  const doFetch = options.fetchImpl ?? fetch;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  let response: Response;
  try {
    response = await doFetch(geminiUrl(model), {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toGeminiBody(messages, { maxOutputTokens, thinkingLevel })),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if ((error as Error)?.name === "AbortError" || controller.signal.aborted) {
      throw new GeminiError("timeout");
    }
    throw new GeminiError("upstream");
  }

  let payload: GeminiResponse;
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new GeminiError("timeout");
    throw new GeminiError("malformed", response.status);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) throw new GeminiError("auth", response.status);
  if (response.status === 429) throw new GeminiError("quota", 429);
  if (response.status === 400 || response.status === 404 || response.status === 416) {
    throw new GeminiError("invalid_request", response.status);
  }
  if (!response.ok) throw new GeminiError("upstream", response.status);

  if (!payload || typeof payload !== "object") throw new GeminiError("malformed", response.status);
  if (payload.promptFeedback?.blockReason) throw new GeminiError("blocked", response.status);

  const candidate = Array.isArray(payload.candidates) ? payload.candidates[0] : undefined;
  const finishReason = candidate?.finishReason ?? "";
  if (BLOCKED_FINISH.has(finishReason)) throw new GeminiError("blocked", response.status);

  const parts = candidate?.content?.parts;
  if (candidate && parts !== undefined && !Array.isArray(parts)) {
    throw new GeminiError("malformed", response.status);
  }
  /* Thought parts are never requested; if one arrives it is not the answer. */
  const text = (parts ?? [])
    .filter((part) => part && !part.thought && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("");
  if (!text.trim()) throw new GeminiError("empty", response.status);

  return {
    text,
    finishReason,
    usage: {
      promptTokens: payload.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
    },
    latencyMs: Date.now() - started,
  };
}
