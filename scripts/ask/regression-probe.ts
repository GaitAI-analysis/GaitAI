/**
 * ASK GAITAI — ranking probe for the migration's regression questions.
 *
 *   npx tsx scripts/ask/regression-probe.ts
 *
 * Prints, for each question, the intent, the resolved entity and the top three
 * records, and asserts the public-scope rule: identity questions receive
 * the fixed response with no personal records or attribution. Exits non-zero on a violation. Read-only; no model.
 */

import { loadCorpusFromDisk } from "./corpus-node";
import { retrieveGaitAIContext } from "../../src/lib/ask/retrieval";
import { composeExtractiveAnswer } from "../../src/lib/ask/extractive";


const QUESTIONS: { q: string; personFirst?: boolean }[] = [
  { q: "who is Example Researcher", personFirst: true },
  { q: "who is Example Researcher", personFirst: true },
  { q: "who founded gaitai", personFirst: true },
  { q: "Who authored these papers?", personFirst: true },
  { q: "what is walkscan" },
  { q: "what is fallrisk" },
  { q: "what is privacyguard" },
  { q: "what is gaitscape" },
  { q: "difference between mobilitycare and securevision" },
  { q: "show gait recognition research" },
  { q: "what products are for hospitals" },
  { q: "what products are for elderly care" },
  { q: "does fallrisk predict that I will fall" },
  { q: "does gaitai identify everyone in CCTV" },
  { q: "how is my uploaded video handled" },
];

const corpus = loadCorpusFromDisk();
console.log(`corpus: ${corpus.docs.length} records, built ${corpus.generatedAt}\n`);

let failures = 0;
for (const { q, personFirst } of QUESTIONS) {
  const result = retrieveGaitAIContext(q, "/");
  const problems: string[] = [];
  if (personFirst) {
    if (result.docs.length || !result.lowConfidence) problems.push("personal identity reached retrieval");
    if (!composeExtractiveAnswer(result).includes("outside its public scope")) problems.push("missing public-scope response");
  }
  if (result.lowConfidence && !personFirst) problems.push("low confidence — would refuse locally");
  if (problems.length) failures += 1;

  console.log(`${problems.length ? "FAIL" : "ok  "}  ${q}`);
  console.log(
    `      intent ${result.intent}${result.entity ? ` · entity ${result.entity.entityId}` : ""} · top: ${result.docs
      .slice(0, 3)
      .map((d) => `${d.doc.id}(${d.score.toFixed(1)})`)
      .join(", ")}`,
  );
  for (const p of problems) console.log(`      PROBLEM: ${p}`);
  if (process.argv.includes("--answers")) {
    console.log(`      ${composeExtractiveAnswer(result).split("\n")[0].slice(0, 160)}`);
  }
}
console.log(`\n${QUESTIONS.length - failures}/${QUESTIONS.length} probes passed`);
process.exit(failures ? 1 : 0);
