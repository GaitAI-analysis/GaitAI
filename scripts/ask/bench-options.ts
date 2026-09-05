/**
 * Benchmark-only flag resolution for how much the model may think.
 *
 * Two flags exist for backwards compatibility — `--reasoning <effort>` (the
 * older knob) and `--thinking <mode>` (the explicit one) — and supplying both
 * is rejected rather than guessed at: the experiment they steer is exactly
 * about which of these the model honours, so precedence must never be silent.
 *
 *   --thinking default   send nothing                          (model default)
 *   --thinking low       reasoning_effort: "low"
 *   --thinking off       chat_template_kwargs: { enable_thinking: false }
 *   --reasoning <x>      reasoning_effort: <x> when x is low|medium|high, "" = nothing
 *   neither              --thinking low
 */

export type ThinkingMode = "default" | "low" | "off";

export interface ThinkingChoice {
  /** Sent to the benchmark Worker as `thinking`, when the mode route is used. */
  thinking?: ThinkingMode;
  /** Sent as `reasoningEffort`, when the older route is used. */
  reasoningEffort?: string;
  /** What the header prints. */
  label: string;
}

export class BenchOptionError extends Error {}

export function resolveThinking(options: {
  thinking?: string;
  reasoning?: string;
}): ThinkingChoice {
  const hasThinking = options.thinking !== undefined;
  const hasReasoning = options.reasoning !== undefined;

  if (hasThinking && hasReasoning) {
    throw new BenchOptionError(
      "Pass either --thinking <default|low|off> or --reasoning <low|medium|high>, not both — " +
        "the two steer the same behaviour and their precedence must not be guessed.",
    );
  }

  if (hasThinking) {
    const mode = (options.thinking ?? "").trim().toLowerCase();
    if (mode === "off") return { thinking: "off", label: "off (chat_template_kwargs.enable_thinking=false)" };
    if (mode === "low") return { thinking: "low", label: "low (reasoning_effort=low)" };
    if (mode === "default") return { thinking: "default", label: "default (model default; nothing sent)" };
    throw new BenchOptionError(`--thinking must be one of default, low, off (got "${options.thinking}").`);
  }

  if (hasReasoning) {
    const effort = (options.reasoning ?? "").trim().toLowerCase();
    if (effort === "") return { reasoningEffort: "", label: "default (model default; nothing sent)" };
    if (effort === "low" || effort === "medium" || effort === "high") {
      return { reasoningEffort: effort, label: `${effort} (reasoning_effort=${effort})` };
    }
    throw new BenchOptionError(`--reasoning must be one of low, medium, high, or "" (got "${options.reasoning}").`);
  }

  return { thinking: "low", label: "low (reasoning_effort=low)" };
}
