/**
 * THE HOSTED MODEL — one chat completion through Hugging Face Inference Providers.
 * =============================================================================
 * The router at `router.huggingface.co` exposes an OpenAI-compatible
 * `/v1/chat/completions` and forwards the call to whichever inference provider
 * serves the requested model (Together, DeepInfra, Novita, Nscale, …). Nothing
 * here is provider-specific: the model id chooses the model, an optional
 * `:provider` suffix pins a provider, and otherwise the router picks one. A
 * Hugging Face MODEL REPOSITORY does not perform inference; only models with
 * a live provider on the router can be called this way, and there is no GPU
 * endpoint to deploy or pay for while idle.
 *
 * WHAT THE MODEL RECEIVES is decided upstream, by `shared/prompt.ts`: the
 * system policy, a short history window, and the retrieved records in the last
 * user turn. This module adds only sampling settings and a deadline.
 *
 * THE TOKEN is a Secret Manager secret injected into this process. It is read
 * from the caller's argument, never from a literal, and never logged.
 */

export const HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions";

export type HfFailure = "timeout" | "rate_limited" | "auth" | "upstream" | "empty";

export class HfError extends Error {
  kind: HfFailure;
  status?: number;
  constructor(kind: HfFailure, status?: number, detail?: string) {
    super(`hf:${kind}${status ? `:${status}` : ""}${detail ? ` ${detail}` : ""}`);
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
  /** The router's own identifiers for this call — for logs, never for readers. */
  provider: string;
  usage: { promptTokens: number; completionTokens: number };
  latencyMs: number;
}

/**
 * Generation settings: as close to deterministic as a sampler gets.
 *
 * The answer must not drift from the records, so the temperature is low. The
 * length ceiling is a parameter because it is the single largest lever on cost
 * and latency; the default is about four tight paragraphs.
 */
export const SAMPLING = {
  temperature: 0.2,
  top_p: 0.9,
} as const;

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
}): Promise<Completion> {
  const { token, model, messages, maxTokens, timeoutMs } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: false,
    ...SAMPLING,
  };
  if (wantsNoThink(model)) {
    body.chat_template_kwargs = { enable_thinking: false };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  let response: Response;
  try {
    response = await fetch(HF_CHAT_URL, {
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
    if ((error as Error)?.name === "AbortError") throw new HfError("timeout");
    throw new HfError("upstream", undefined, (error as Error)?.message);
  }

  let payload: {
    choices?: { message?: { content?: string | null } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    error?: unknown;
  };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    clearTimeout(timer);
    throw new HfError("upstream", response.status, "non-JSON body");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new HfError("rate_limited", 429);
  if (response.status === 401 || response.status === 402 || response.status === 403) {
    throw new HfError("auth", response.status);
  }
  if (!response.ok) {
    const detail =
      typeof payload?.error === "string"
        ? payload.error
        : (payload?.error as { message?: string } | undefined)?.message;
    throw new HfError("upstream", response.status, detail?.slice(0, 200));
  }

  const text = payload.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new HfError("empty", response.status);

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
