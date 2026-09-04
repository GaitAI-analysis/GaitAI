/**
 * ASK GAITAI — RANKING REGRESSION SUITE, NO MODEL AND NO NETWORK
 * =============================================================================
 *   npm run ask:rank              rank-order and intent assertions (CI runs this)
 *   npm run ask:rank -- --answers also print the retrieval-only answer
 *
 * `ask:test` asserts that the right records are RETRIEVED. This asserts that
 * the right record is FIRST, that the question was classified as the right
 * kind, and that a person the corpus does not know produces the empty state
 * rather than the nearest policy page. Both run the same retrieval the
 * browser runs — see scripts/ask/corpus-node.ts.
 */

import { RANKING_CASES } from "./ask/ranking-cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { retrieveGaitAIContext } from "../src/lib/ask/retrieval";
import { composeFinalExtractiveAnswer } from "../src/lib/ask/extractive";
import { sanitizeLinks } from "../src/lib/ask/answer";

const showAnswers = process.argv.includes("--answers");

const corpus = loadCorpusFromDisk();
const personRecords = corpus.docs.filter((doc) => doc.type === "person");
console.log(
  `corpus: ${corpus.docs.length} records, ${personRecords.length} person record(s): ${personRecords
    .map((doc) => doc.id)
    .join(", ")}\n`,
);

let failures = 0;

for (const testCase of RANKING_CASES) {
  const result = retrieveGaitAIContext(testCase.q, testCase.path ?? "/");
  const top = result.docs[0];
  const answer = sanitizeLinks(composeFinalExtractiveAnswer(result));
  const problems: string[] = [];

  if (testCase.top && top?.doc.id !== testCase.top) {
    problems.push(`top is ${top?.doc.id ?? "nothing"}, expected ${testCase.top}`);
  }
  if (testCase.topType && top?.doc.type !== testCase.topType) {
    problems.push(`top type is ${top?.doc.type ?? "nothing"}, expected ${testCase.topType}`);
  }
  if (testCase.notTopTypes && top && testCase.notTopTypes.includes(top.doc.type)) {
    problems.push(`top is a ${top.doc.type} record (${top.doc.id}), which must not answer this`);
  }
  if (testCase.intent && result.intent !== testCase.intent) {
    problems.push(`intent is ${result.intent}, expected ${testCase.intent}`);
  }
  if (
    testCase.includesType &&
    !result.docs.some((item) => item.doc.type === testCase.includesType)
  ) {
    problems.push(`no ${testCase.includesType} record in the set`);
  }
  if (testCase.miss === true && !result.entityMiss) {
    problems.push("expected an entity miss, got an answer");
  }
  if (testCase.miss === false && result.entityMiss) {
    problems.push(`unexpected entity miss for "${result.entityMiss}"`);
  }
  for (const needle of testCase.answerHas ?? []) {
    if (!answer.includes(needle)) problems.push(`answer lacks "${needle}"`);
  }
  for (const needle of testCase.answerLacks ?? []) {
    if (answer.includes(needle)) problems.push(`answer contains "${needle}"`);
  }

  if (problems.length) failures += 1;

  console.log(
    `${problems.length ? "FAIL" : "ok  "}  ${testCase.q}${
      testCase.path ? `   [${testCase.path}]` : ""
    }`,
  );
  console.log(
    `      intent: ${result.intent}${result.entity ? `  entity: ${result.entity.entityId} (${result.entity.alias})` : ""}${
      result.entityMiss ? `  miss: "${result.entityMiss}"` : ""
    }`,
  );
  console.log(
    `      top: ${result.docs
      .slice(0, 5)
      .map((d) => `${d.doc.id}(${d.score.toFixed(1)})`)
      .join(", ")}`,
  );
  for (const problem of problems) console.log(`      PROBLEM: ${problem}`);
  if (showAnswers) {
    console.log(`\n      ${answer.split("\n").join("\n      ")}\n`);
  }
  console.log();
}

console.log("─".repeat(72));
console.log(`${RANKING_CASES.length - failures}/${RANKING_CASES.length} ranking expectations met`);
console.log("─".repeat(72));

process.exit(failures ? 1 : 0);
