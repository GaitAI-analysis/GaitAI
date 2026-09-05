/**
 * The Worker's bindings, spelled out.
 *
 * `wrangler types` generates a global `Env` from wrangler.jsonc, but secrets
 * set out of band do not appear there and vars are typed as plain strings. This
 * interface is the contract the code is written against; `readConfig` turns
 * the strings into numbers once, with defaults, so the handler never parses.
 *
 * Naming: the one provider-specific pair is the key and the model. Everything
 * that would survive a provider change — output ceiling, deadline, limits —
 * carries a neutral name.
 */

import type { AskGuard } from "./guard";

export interface AskEnv {
  /** Cloudflare secret. `wrangler secret put GEMINI_API_KEY`. Never in config or Git. */
  GEMINI_API_KEY?: string;
  /** Non-secret var. Empty until the benchmark has chosen a model. */
  GEMINI_MODEL?: string;
  /** Optional Gemini `thinkingLevel` (minimal/low/medium/high). Empty = model default. */
  MODEL_THINKING_LEVEL?: string;
  MODEL_MAX_OUTPUT_TOKENS?: string;
  MODEL_TIMEOUT_MS?: string;
  ALLOWED_ORIGINS?: string;
  ASK_BURST_MAX?: string;
  ASK_HOURLY_MAX?: string;
  ASK_DAILY_BUDGET?: string;
  ASK_GUARD?: DurableObjectNamespace<AskGuard>;
}

export interface AskConfig {
  apiKey: string;
  model: string;
  thinkingLevel: string;
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

const THINKING_LEVELS = new Set(["minimal", "low", "medium", "high"]);

export function readConfig(env: AskEnv): AskConfig {
  const thinking = (env.MODEL_THINKING_LEVEL ?? "").trim().toLowerCase();
  return {
    apiKey: (env.GEMINI_API_KEY ?? "").trim(),
    model: (env.GEMINI_MODEL ?? "").trim(),
    thinkingLevel: THINKING_LEVELS.has(thinking) ? thinking : "",
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
    /* Our own ceiling on hosted calls per UTC day, independent of Google's
       quota. Conservative on purpose while the Free Tier is being evaluated. */
    dailyBudget: int(env.ASK_DAILY_BUDGET, 25),
  };
}
