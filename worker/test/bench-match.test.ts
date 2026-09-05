/**
 * The benchmark's --match filter — benchmark tooling only, but cheap to prove:
 * a case-insensitive substring over the question, so one failing question can
 * be re-run alone without spending the daily allocation on the whole suite.
 */

import { describe, expect, it } from "vitest";
import { BENCH_CASES, BRIEF_CASES, matchCases } from "../../scripts/ask/bench-cases";
import { BenchOptionError, resolveThinking } from "../../scripts/ask/bench-options";

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
