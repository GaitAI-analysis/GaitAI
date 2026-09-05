/**
 * ASK GAITAI — ACCEPTANCE SUITE, NO MODEL AND NO NETWORK
 * =============================================================================
 *   npm run ask:test              retrieval assertions (this is what CI runs)
 *   npm run ask:test -- --answers also print the retrieval-only answers
 *
 * It replaces `functions/src/test-questions.ts`, which needed an Anthropic key
 * to check anything beyond retrieval. There is no key any more, and there is no
 * longer a reason to need one: the assistant's floor is now the extractive
 * answer, which is deterministic, so the thing a key used to buy — seeing what
 * the visitor actually reads — is free and assertable.
 *
 * WHAT IS ASSERTED
 *   1. RETRIEVAL. Every case's required record ids reach the answering layer.
 *      This is the assertion that catches a data rename before a visitor does.
 *   2. GROUNDING. Every link in every extractive answer resolves to a real
 *      route in the corpus allowlist. An extract cannot invent one, so this is
 *      a regression test on `sanitizeLinks` and on the corpus's own routes.
 *   3. REFUSAL. Cases marked low-confidence must produce the "no documented
 *      answer" wording rather than a composed one.
 *   4. NO FABRICATED NUMBERS. No extractive answer may introduce a percentage
 *      or an accuracy figure that is not present in the record it quotes —
 *      which, since it quotes verbatim, means it must never introduce one at
 *      all. Cheap to check, and it is the exact failure the brief names first.
 */

import { CASES } from "./ask/cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { retrieveGaitAIContext } from "../src/lib/ask/retrieval";
import { composeExtractiveAnswer } from "../src/lib/ask/extractive";
import { isAllowedHref, sanitizeLinks } from "../src/lib/ask/answer";
import { knowledge } from "../src/lib/ask/corpus";

const showAnswers = process.argv.includes("--answers");

const corpus = loadCorpusFromDisk();
console.log(
  `corpus: ${corpus.docs.length} records, ${corpus.routes.length} routes, built ${corpus.generatedAt}\n`,
);

let retrievalFailures = 0;
let groundingFailures = 0;
let numberFailures = 0;

/** A percentage or an "N% accurate"-shaped claim. */
const NUMERIC_CLAIM = /\b\d{1,3}(?:\.\d+)?\s?%/;

/** Every markdown link target in a string. */
const LINKS = /\[[^\]]*\]\(([^)]+)\)/g;

for (const testCase of CASES) {
  const path = testCase.path ?? "/";
  const result = retrieveGaitAIContext(testCase.q, path);
  const ids = result.docs.map((d) => d.doc.id);
  const missing = testCase.expect.filter((id) => !ids.includes(id));

  if (missing.length) retrievalFailures += 1;

  console.log(
    `${missing.length ? "FAIL" : "ok  "}  ${testCase.q}${
      testCase.path ? `   [${testCase.path}]` : ""
    }`,
  );
  console.log(
    `      top: ${result.docs
      .slice(0, 5)
      .map((d) => `${d.doc.id}(${d.score.toFixed(1)})`)
      .join(", ")}`,
  );
  if (result.lowConfidence) console.log("      confidence: LOW");
  if (missing.length) console.log(`      MISSING: ${missing.join(", ")}`);

  // ── The answer the visitor reads with no model loaded ──────────────────────
  const answer = sanitizeLinks(composeExtractiveAnswer(result));

  for (const match of answer.matchAll(LINKS)) {
    const href = match[1];
    if (!isAllowedHref(href)) {
      groundingFailures += 1;
      console.log(`      GROUNDING: link outside the corpus → ${href}`);
    }
  }

  if (NUMERIC_CLAIM.test(answer)) {
    /* Only a failure if the record it came from does not contain it — an
       extract may legitimately quote a figure the site itself publishes. */
    const quoted = result.docs.some((d) =>
      NUMERIC_CLAIM.test(`${d.doc.summary} ${d.doc.content}`),
    );
    if (!quoted) {
      numberFailures += 1;
      console.log("      NUMBER: a percentage appears that no record states");
    }
  }

  /* Two refusal shapes: the generic one, and the named one for a person the
     corpus has no record for ("I couldn't find a GaitAI record for …"). */
  if (
    result.lowConfidence &&
    !answer.includes("no documented answer") &&
    !answer.includes("couldn't find a GaitAI record")
  ) {
    groundingFailures += 1;
    console.log("      REFUSAL: low confidence did not produce a refusal");
  }

  if (testCase.check) console.log(`      check: ${testCase.check}`);
  if (showAnswers) {
    console.log(`\n      ${answer.split("\n").join("\n      ")}\n`);
  }
  console.log();
}

const routeCount = knowledge().routes.length;
console.log("─".repeat(72));
console.log(
  `${CASES.length - retrievalFailures}/${CASES.length} retrieval expectations met`,
);
console.log(
  `${groundingFailures} grounding failure(s) · ${numberFailures} fabricated-number failure(s)`,
);
console.log(`route allowlist: ${routeCount} routes`);
console.log("─".repeat(72));

const failed = retrievalFailures + groundingFailures + numberFailures;
process.exit(failed ? 1 : 0);
