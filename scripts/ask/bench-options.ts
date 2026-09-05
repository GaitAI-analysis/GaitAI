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

// ── Running the suite: when to stop ─────────────────────────────────────────

/**
 * What one attempt at one case produced. The benchmark script does the work
 * (retrieval, the loopback call, scoring) and reports the outcome; the runner
 * below only decides whether to continue — so that decision is testable
 * without a network, a Worker or a model.
 *
 *   answered   a scored answer
 *   skipped    retrieval refused locally; no call was made
 *   failed     the call was made and the provider failed for this case
 *   quota      the account's daily free allocation is exhausted (3036 / 4006)
 *
 * `stopModel` on a `failed` outcome ends that model's run (capacity, a paid or
 * invalid model, a permission error — nothing further would succeed for it)
 * and moves on to the next model. A `quota` outcome ends EVERYTHING: the
 * allocation is account-wide, so every remaining case for every remaining
 * model would fail the same way, and those cases are recorded as unexecuted,
 * never as model failures.
 */
export type AttemptOutcome<R> =
  | { status: "answered"; row: R }
  | { status: "skipped"; row: R }
  | { status: "failed"; row: R; stopModel?: boolean }
  | { status: "quota"; row: R };

export interface ModelRun<R, C> {
  model: string;
  outcomes: AttemptOutcome<R>[];
  /** Cases never attempted for this model, in order. */
  unexecuted: C[];
}

export interface SuiteRun<R, C> {
  runs: ModelRun<R, C>[];
  /** Set when the daily free allocation stopped the suite. */
  quotaStop: { model: string; caseIndex: number } | null;
  /** Models never started because the suite had already stopped. */
  unexecutedModels: string[];
}

export async function executeSuite<R, C>(
  models: string[],
  cases: C[],
  attempt: (model: string, testCase: C, index: number) => Promise<AttemptOutcome<R>>,
  hooks: { onQuotaStop?: (model: string, testCase: C) => void } = {},
): Promise<SuiteRun<R, C>> {
  const runs: ModelRun<R, C>[] = [];
  let quotaStop: SuiteRun<R, C>["quotaStop"] = null;
  const unexecutedModels: string[] = [];

  for (const model of models) {
    if (quotaStop) {
      unexecutedModels.push(model);
      continue;
    }
    const run: ModelRun<R, C> = { model, outcomes: [], unexecuted: [] };
    runs.push(run);

    for (let index = 0; index < cases.length; index++) {
      const testCase = cases[index];
      if (quotaStop) {
        run.unexecuted.push(testCase);
        continue;
      }
      const outcome = await attempt(model, testCase, index);
      run.outcomes.push(outcome);
      if (outcome.status === "quota") {
        quotaStop = { model, caseIndex: index };
        hooks.onQuotaStop?.(model, testCase);
        continue;
      }
      if (outcome.status === "failed" && outcome.stopModel) {
        run.unexecuted.push(...cases.slice(index + 1));
        break;
      }
    }
  }

  return { runs, quotaStop, unexecutedModels };
}
