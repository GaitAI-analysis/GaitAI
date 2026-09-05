/**
 * THE HOSTED MODEL — one chat completion through Hugging Face Inference Providers.
 * =============================================================================
 * The router at `router.huggingface.co` exposes an OpenAI-compatible
 * `/v1/chat/completions` and forwards the call to whichever inference provider
 * serves the requested model. Nothing here is provider-specific: the model id
 * chooses the model, an optional `:provider` suffix pins a provider, and
 * otherwise the router picks one. A Hugging Face MODEL REPOSITORY does not
 * perform inference; only models with a live provider on the router can be
 * called this way, and there is no GPU endpoint to deploy or pay for idle.
 *
 * WHAT THE MODEL RECEIVES is decided upstream, by the shared prompt module: the
 * system policy, a short history window, and the canonical records in the last
 * user turn. This module adds only sampling settings and a deadline.
 *
 * THE TOKEN arrives as an argument, read by the caller from the Worker's secret
 * binding. It is used in one header and appears nowhere else — not in a log,
 * not in an error, not in a response.
 */

export const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";
/** The router's model catalogue, with per-provider prices. Used by the benchmark only. */
export const HF_MODELS_URL = "https://router.huggingface.co/v1/models";

/**
 * What went wrong at the provider, by class — the browser treats every one the
 * same way (it falls back), but the Worker's status code and log line differ:
 *   timeout           no answer within the deadline
 *   rate_limited      429 — the provider is throttling us
 *   payment_required  402 Payment Required — the account, not the token: a
 *                     token accepted on the previous call receives this when
 *                     inference credit is unavailable or exhausted. Check the
 *                     account's Billing / Inference Providers state; it is NOT
 *                     an auth failure and must not be read as one.
 *   auth              401 / 403 — the token is missing, invalid or not allowed
 *   upstream          any other non-2xx, or a reply that was not JSON
 *   empty             a 2xx with no text in it
 */
export type HfFailure =
  | "timeout"
  | "rate_limited"
  | "payment_required"
  | "auth"
  | "upstream"
  | "empty";

export class HfError extends Error {
  kind: HfFailure;
  status?: number;
  constructor(kind: HfFailure, status?: number) {
    super(`hf:${kind}${status ? `:${status}` : ""}`);
    this.name = "HfError";
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
  /** The router's identifier for the provider it used — for logs, never readers. */
  provider: string;
  usage: { promptTokens: number; completionTokens: number };
  latencyMs: number;
}

/** As close to deterministic as a sampler gets: the answer must not drift. */
export const SAMPLING = { temperature: 0.2, top_p: 0.9 } as const;

/**
 * Hybrid-thinking models (Qwen3 and later) reason at length before answering
 * unless told not to. A grounded lookup over seven supplied records does not
 * need a chain of thought, and a visitor should not wait for one — so thinking
 * is switched off through the chat template where the model family supports
 * it. Whatever slips through is stripped by `cleanModelAnswer`.
 */
const wantsNoThink = (model: string) => /\bqwen3/i.test(model);

export async function chatCompletion(options: {
  token: string;
  model: string;
  messages: ChatMessage[];
  maxTokens: number;
  timeoutMs: number;
  /** Injectable for unit tests; defaults to the platform fetch. */
  fetchImpl?: typeof fetch;
}): Promise<Completion> {
  const { token, model, messages, maxTokens, timeoutMs } = options;
  const doFetch = options.fetchImpl ?? fetch;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
    ...SAMPLING,
  };
  if (wantsNoThink(model)) body.chat_template_kwargs = { enable_thinking: false };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  let response: Response;
  try {
    response = await doFetch(HF_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if ((error as Error)?.name === "AbortError" || controller.signal.aborted) {
      throw new HfError("timeout");
    }
    throw new HfError("upstream");
  }

  let payload: {
    choices?: { message?: { content?: string | null } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    clearTimeout(timer);
    if (controller.signal.aborted) throw new HfError("timeout");
    throw new HfError("upstream", response.status);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new HfError("rate_limited", 429);
  if (response.status === 402) throw new HfError("payment_required", 402);
  if (response.status === 401 || response.status === 403) {
    throw new HfError("auth", response.status);
  }
  if (!response.ok) throw new HfError("upstream", response.status);

  const text = payload?.choices?.[0]?.message?.content ?? "";
  if (typeof text !== "string" || !text.trim()) throw new HfError("empty", response.status);

  return {
    text,
    provider: response.headers.get("x-inference-provider") ?? "",
    usage: {
      promptTokens: payload.usage?.prompt_tokens ?? 0,
      completionTokens: payload.usage?.completion_tokens ?? 0,
    },
    latencyMs: Date.now() - started,
  };
}
