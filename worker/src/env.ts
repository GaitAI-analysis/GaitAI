/**
 * The Worker's bindings, spelled out.
 *
 * `wrangler types` generates a global `Env` from wrangler.jsonc, but secrets
 * set out of band do not appear there and vars are typed as plain strings. This
 * interface is the contract the code is written against; `readConfig` turns
 * the strings into numbers once, with defaults, so the handler never parses.
 */

import type { AskGuard } from "./guard";

export interface AskEnv {
  /** Cloudflare secret. `wrangler secret put HF_TOKEN`. Never in config or Git. */
  HF_TOKEN?: string;
  /** Non-secret var. Empty until the benchmark has chosen a model. */
  HF_MODEL?: string;
  HF_MAX_TOKENS?: string;
  HF_TIMEOUT_MS?: string;
  ALLOWED_ORIGINS?: string;
  ASK_BURST_MAX?: string;
  ASK_HOURLY_MAX?: string;
  ASK_DAILY_BUDGET?: string;
  ASK_GUARD?: DurableObjectNamespace<AskGuard>;
}

export interface AskConfig {
  token: string;
  model: string;
  maxTokens: number;
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
    token: (env.HF_TOKEN ?? "").trim(),
    model: (env.HF_MODEL ?? "").trim(),
    maxTokens: Math.min(int(env.HF_MAX_TOKENS, 450), 1200),
    timeoutMs: Math.min(int(env.HF_TIMEOUT_MS, 22_000), 25_000),
    allowedOrigins: new Set(
      (env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
    burstMax: int(env.ASK_BURST_MAX, 8),
    hourlyMax: int(env.ASK_HOURLY_MAX, 40),
    dailyBudget: int(env.ASK_DAILY_BUDGET, 1500),
  };
}
