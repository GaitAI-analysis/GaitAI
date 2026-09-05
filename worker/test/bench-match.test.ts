/**
 * The benchmark's --match filter — benchmark tooling only, but cheap to prove:
 * a case-insensitive substring over the question, so one failing question can
 * be re-run alone without spending the daily allocation on the whole suite.
 */

import { describe, expect, it } from "vitest";
import { BENCH_CASES, BRIEF_CASES, matchCases } from "../../scripts/ask/bench-cases";
import { BenchOptionError, executeSuite, resolveThinking, type AttemptOutcome } from "../../scripts/ask/bench-options";

describe("benchmark runner: the daily free allocation stops everything", () => {
  type Row = { model: string; q: string };
  const cases = ["a", "b", "c", "d"].map((q) => ({ q }));
  const models = ["m1", "m2", "m3"];

  /** A scripted attempt: returns the outcome keyed by model+question, records every call. */
  const scripted = (plan: Record<string, AttemptOutcome<Row>["status"]>) => {
    const calls: string[] = [];
    const attempt = async (model: string, testCase: { q: string }): Promise<AttemptOutcome<Row>> => {
      calls.push(`${model}:${testCase.q}`);
      const status = plan[`${model}:${testCase.q}`] ?? "answered";
      return { status, row: { model, q: testCase.q } } as AttemptOutcome<Row>;
    };
    return { calls, attempt };
  };

  it("stops after the first free-quota outcome and makes no further calls for any model", async () => {
    const { calls, attempt } = scripted({ "m1:b": "quota" });
    const stops: string[] = [];
    const run = await executeSuite(models, cases, attempt, { onQuotaStop: (m, c) => stops.push(`${m}:${c.q}`) });

    expect(calls).toEqual(["m1:a", "m1:b"]);
    expect(stops).toEqual(["m1:b"]);
    expect(run.quotaStop).toEqual({ model: "m1", caseIndex: 1 });

    const m1 = run.runs[0];
    expect(m1.outcomes.map((o) => o.status)).toEqual(["answered", "quota"]);
    expect(m1.unexecuted.map((c) => c.q)).toEqual(["c", "d"]);
    expect(run.runs).toHaveLength(1);
    expect(run.unexecutedModels).toEqual(["m2", "m3"]);
  });

  it("records unexecuted cases as unexecuted — never as failures — and never scores them", async () => {
    const { attempt } = scripted({ "m1:a": "quota" });
    const run = await executeSuite(models, cases, attempt);
    const m1 = run.runs[0];
    expect(m1.outcomes.filter((o) => o.status === "failed")).toHaveLength(0);
    expect(m1.outcomes).toHaveLength(1);
    expect(m1.unexecuted).toHaveLength(3);
    expect(run.unexecutedModels).toEqual(["m2", "m3"]);
  });

  it("a model-level stop (capacity, paid, permission, invalid model) ends only that model's run", async () => {
    const calls: string[] = [];
    const attempt = async (model: string, testCase: { q: string }): Promise<AttemptOutcome<Row>> => {
      calls.push(`${model}:${testCase.q}`);
      if (model === "m1" && testCase.q === "b") return { status: "failed", row: { model, q: testCase.q }, stopModel: true };
      return { status: "answered", row: { model, q: testCase.q } };
    };
    const run = await executeSuite(models, cases, attempt);
    expect(run.quotaStop).toBeNull();
    expect(run.runs[0].outcomes.map((o) => o.status)).toEqual(["answered", "failed"]);
    expect(run.runs[0].unexecuted.map((c) => c.q)).toEqual(["c", "d"]);
    expect(run.runs[1].outcomes).toHaveLength(4);
    expect(run.runs[2].outcomes).toHaveLength(4);
    expect(calls).toHaveLength(2 + 4 + 4);
    expect(run.unexecutedModels).toEqual([]);
  });

  it("runs everything when nothing stops it, and local refusals are not calls", async () => {
    const { calls, attempt } = scripted({ "m1:c": "skipped", "m2:a": "failed" });
    const run = await executeSuite(models, cases, attempt);
    expect(calls).toHaveLength(12);
    expect(run.quotaStop).toBeNull();
    expect(run.runs.every((r) => r.unexecuted.length === 0)).toBe(true);
    expect(run.runs[0].outcomes.map((o) => o.status)).toEqual(["answered", "answered", "skipped", "answered"]);
    expect(run.runs[1].outcomes.map((o) => o.status)).toEqual(["failed", "answered", "answered", "answered"]);
  });
});

describe("benchmark --thinking / --reasoning", () => {
  it("maps --thinking off to the non-reasoning route with the documented header label", () => {
    expect(resolveThinking({ thinking: "off" })).toEqual({
      thinking: "off",
      label: "off (chat_template_kwargs.enable_thinking=false)",
    });
  });

  it("maps --thinking low and default, case-insensitively", () => {
    expect(resolveThinking({ thinking: "LOW" })).toEqual({ thinking: "low", label: "low (reasoning_effort=low)" });
    expect(resolveThinking({ thinking: "default" })).toEqual({ thinking: "default", label: "default (model default; nothing sent)" });
  });

  it("keeps the older --reasoning knob working on its own", () => {
    expect(resolveThinking({ reasoning: "medium" })).toEqual({ reasoningEffort: "medium", label: "medium (reasoning_effort=medium)" });
    expect(resolveThinking({ reasoning: "" })).toEqual({ reasoningEffort: "", label: "default (model default; nothing sent)" });
  });

  it("defaults to low when neither flag is given", () => {
    expect(resolveThinking({})).toEqual({ thinking: "low", label: "low (reasoning_effort=low)" });
  });

  it("rejects both flags together instead of guessing precedence", () => {
    expect(() => resolveThinking({ thinking: "off", reasoning: "low" })).toThrow(BenchOptionError);
    expect(() => resolveThinking({ thinking: "off", reasoning: "low" })).toThrow(/not both/);
  });

  it("rejects values outside the documented sets", () => {
    expect(() => resolveThinking({ thinking: "none" })).toThrow(/default, low, off/);
    expect(() => resolveThinking({ thinking: "" })).toThrow(BenchOptionError);
    expect(() => resolveThinking({ reasoning: "none" })).toThrow(/low, medium, high/);
    expect(() => resolveThinking({ reasoning: "turbo" })).toThrow(BenchOptionError);
  });
});

describe("benchmark --match", () => {
  it("selects only the cases whose question contains the needle, case-insensitively", () => {
    const hits = matchCases(BRIEF_CASES, "publications cover gait recognition");
    expect(hits.map((c) => c.q)).toEqual(["What publications cover gait recognition?"]);
    expect(matchCases(BRIEF_CASES, "PROTECT PRIVACY").map((c) => c.q)).toEqual(["How does GaitAI protect privacy?"]);
  });

  it("keeps every case when the needle is empty or absent", () => {
    expect(matchCases(BRIEF_CASES, "")).toHaveLength(BRIEF_CASES.length);
    expect(matchCases(BRIEF_CASES, "   ")).toHaveLength(BRIEF_CASES.length);
    expect(matchCases(BENCH_CASES, undefined)).toHaveLength(BENCH_CASES.length);
  });

  it("returns nothing for a needle no question contains", () => {
    expect(matchCases(BENCH_CASES, "no such question ever")).toHaveLength(0);
  });

  it("can select more than one case when the substring is shared", () => {
    const hits = matchCases(BENCH_CASES, "gaitai");
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.length).toBeLessThan(BENCH_CASES.length);
    for (const c of hits) expect(c.q.toLowerCase()).toContain("gaitai");
  });
});
