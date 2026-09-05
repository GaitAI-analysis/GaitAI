/**
 * The Worker's bindings, spelled out.
 *
 * `wrangler types` generates a global `Env` from wrangler.jsonc (and the `Ai`
 * type for the binding). This interface is the contract the code is written
 * against — vars typed as the strings they are, the AI binding as the runtime
 * type Wrangler generates — and `readConfig` turns the strings into numbers
 * once, with defaults, so the handler never parses.
 *
 * There is no secret in this environment. Workers AI is reached through the
 * `AI` binding, which needs no key, token or external provider account.
 */

import type { AskGuard } from "./guard";

export interface AskEnv {
  /** Workers AI, from `"ai": { "binding": "AI" }` in wrangler.jsonc. */
  AI?: Ai;
  /** Non-secret var. Empty until the benchmark has chosen a Free-plan model. */
  WORKERS_AI_MODEL?: string;
  /**
   * Non-secret var: "" | "low" | "medium" | "high". Reasoning-capable models
   * spend the completion budget on reasoning before they write; the first
   * real calls came back empty at 450 tokens because of it. "low" asks for
   * the minimum. Empty leaves the model's default. Anything else is ignored.
   */
  MODEL_REASONING_EFFORT?: string;
  MODEL_MAX_OUTPUT_TOKENS?: string;
  MODEL_TIMEOUT_MS?: string;
  ALLOWED_ORIGINS?: string;
  ASK_BURST_MAX?: string;
  ASK_HOURLY_MAX?: string;
  ASK_DAILY_BUDGET?: string;
  ASK_GUARD?: DurableObjectNamespace<AskGuard>;
}

export type ReasoningEffort = "" | "low" | "medium" | "high";
const REASONING_EFFORTS = new Set<ReasoningEffort>(["", "low", "medium", "high"]);

/** "" | low | medium | high; anything else falls back to "" (model default). */
export function readReasoningEffort(value: string | undefined): ReasoningEffort {
  const normalised = (value ?? "").trim().toLowerCase();
  return REASONING_EFFORTS.has(normalised as ReasoningEffort) ? (normalised as ReasoningEffort) : "";
}

export interface AskConfig {
  model: string;
  reasoningEffort: ReasoningEffort;
  maxOutputTokens: number;
  timeoutMs: number;
  allowedOrigins: Set<string>;
  burstMax: number;
  hourlyMax: number;
  dailyBudget: number;
}

const int = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export function readConfig(env: AskEnv): AskConfig {
  return {
    model: (env.WORKERS_AI_MODEL ?? "").trim(),
    reasoningEffort: readReasoningEffort(env.MODEL_REASONING_EFFORT),
    maxOutputTokens: Math.min(int(env.MODEL_MAX_OUTPUT_TOKENS, 450), 1200),
    timeoutMs: Math.min(int(env.MODEL_TIMEOUT_MS, 22_000), 25_000),
    allowedOrigins: new Set(
      (env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
    burstMax: int(env.ASK_BURST_MAX, 8),
    hourlyMax: int(env.ASK_HOURLY_MAX, 40),
    /* Our own ceiling on hosted calls per UTC day, independent of Cloudflare's
       Neuron allocation. Conservative on purpose while Workers AI is being
       evaluated on the Free plan. */
    dailyBudget: int(env.ASK_DAILY_BUDGET, 25),
  };
}
