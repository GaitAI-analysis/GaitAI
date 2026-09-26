/**
 * ASK GAITAI — PARAPHRASE SUITE, NO MODEL AND NO NETWORK
 * =============================================================================
 *   npm run ask:paraphrase              every family, every phrasing (CI)
 *   npm run ask:paraphrase -- --verbose print each phrasing's understanding
 *   npm run ask:paraphrase -- --match military   only phrasings containing the text
 *
 * `ask:test` asserts that named records are retrieved; `ask:rank` that the
 * right record leads. This asserts that FAMILIES of phrasings converge: a
 * polished question, its telegraphic form, its pronoun form and its follow-up
 * form must classify to the same intents and draw on the same evidence
 * families, and never on the noise types (person, talk, publication, essay)
 * unless asked for them. It also checks the taxonomy's own hygiene: every
 * example in intent.ts classifies to its intent, and every expansion term
 * exists in the corpus — a synonym that matches nothing is a typo, and one
 * that is not the site's word is an invented claim waiting to happen.
 */

import { PARAPHRASE_FAMILIES } from "./ask/paraphrase-cases";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { retrieveGaitAIContext } from "../src/lib/ask/retrieval";
import { INTENTS, type Intent } from "../src/lib/ask/intent";
import { DOMAIN_CONCEPTS } from "../src/lib/ask/domains";
import { understand } from "../src/lib/ask/understand";
import { tokenize } from "../src/lib/ask/text";
import { knowledge } from "../src/lib/ask/corpus";

const verbose = process.argv.includes("--verbose");
const matchIndex = process.argv.indexOf("--match");
const match = matchIndex >= 0 ? (process.argv[matchIndex + 1] ?? "").toLowerCase() : "";

const corpus = loadCorpusFromDisk();
console.log(`corpus: ${corpus.docs.length} records, built ${corpus.generatedAt}\n`);

let questions = 0;
let failures = 0;

// ── Taxonomy hygiene ─────────────────────────────────────────────────────────

const vocabulary = new Set<string>();
for (const doc of knowledge().docs) {
  for (const term of tokenize(`${doc.title} ${doc.sectionTitle ?? ""} ${doc.keywords.join(" ")} ${doc.summary} ${doc.content}`)) vocabulary.add(term);
}
const hygiene: string[] = [];
for (const [intent, spec] of Object.entries(INTENTS) as [Intent, (typeof INTENTS)[Intent]][]) {
  for (const term of spec.expand) {
    if (!tokenize(term).every((token) => vocabulary.has(token))) hygiene.push(`${intent}: expansion "${term}" is not corpus vocabulary`);
  }
  for (const example of spec.examples) {
    const got = understand(example).intent;
    /* Examples are the family's own phrasings; a few legitimately land on a
       neighbour (a "who" about a product is PRODUCT). Only a NOISE mismatch
       counts — an example that classifies to PERSON or PUBLICATION when it
       should not, or vice versa. */
    if (got !== intent && intent !== "GENERAL" && !(intent === "PRODUCT" && got === "CAPABILITY")) {
      hygiene.push(`${intent}: example "${example}" classified as ${got}`);
    }
  }
}
for (const concept of DOMAIN_CONCEPTS) {
  for (const { term } of concept.terms) {
    if (!tokenize(term).every((token) => vocabulary.has(token))) hygiene.push(`domain ${concept.id}: expansion "${term}" is not corpus vocabulary`);
  }
  for (const id of concept.environmentIds) {
    if (!knowledge().docs.some((doc) => doc.id === `use-case:${id}`)) hygiene.push(`domain ${concept.id}: environment "${id}" has no record`);
  }
}
if (hygiene.length) {
  failures += hygiene.length;
  console.log("TAXONOMY HYGIENE");
  for (const line of hygiene) console.log(`  PROBLEM: ${line}`);
  console.log();
}

// ── The matrix ───────────────────────────────────────────────────────────────

for (const family of PARAPHRASE_FAMILIES) {
  const members = family.questions.filter((q) => !match || q.toLowerCase().includes(match));
  if (!members.length) continue;
  console.log(`▸ ${family.name}  (${members.length} phrasings → ${family.intents.join(" | ")})`);

  for (const q of members) {
    questions += 1;
    const result = retrieveGaitAIContext(q, "/", family.history ?? []);
    const u = result.understanding;
    const ids = result.docs.map((item) => item.doc.id);
    const types = result.docs.map((item) => item.doc.type);
    const problems: string[] = [];

    if (!family.intents.includes(result.intent)) problems.push(`intent ${result.intent}, expected ${family.intents.join("|")}`);
    if (family.domain) {
      const subject = u.domain?.subject ?? "";
      const ok = typeof family.domain === "string" ? subject.toLowerCase().includes(family.domain.toLowerCase()) : family.domain.test(subject);
      if (!ok) problems.push(`domain "${subject || "none"}" does not match ${family.domain}`);
    }
    if (family.entity && u.entity.id !== family.entity) problems.push(`entity ${u.entity.id} (${u.entity.via}), expected ${family.entity}`);
    if (family.lowConfidence !== undefined && result.lowConfidence !== family.lowConfidence) {
      problems.push(family.lowConfidence ? "expected a graceful refusal (low confidence)" : "unexpected LOW confidence");
    }
    if (!result.lowConfidence) {
      if (family.topTypes && types[0] && !family.topTypes.includes(types[0])) problems.push(`top record is a ${types[0]} (${ids[0]})`);
      for (const type of family.neverTop ?? []) {
        const at = types.slice(0, 3).indexOf(type);
        if (at >= 0) problems.push(`a ${type} record (${ids[at]}) is in the top three`);
      }
      for (const type of family.neverPresent ?? []) {
        const at = types.indexOf(type);
        if (at >= 0) problems.push(`a ${type} record (${ids[at]}) was retrieved`);
      }
      if (family.anyOf && !family.anyOf.some((id) => ids.includes(id))) problems.push(`none of ${family.anyOf.slice(0, 4).join(", ")}… retrieved`);
      for (const id of family.mustInclude ?? []) if (!ids.includes(id)) problems.push(`missing ${id}`);
    }

    if (problems.length) failures += 1;
    const mark = problems.length ? "FAIL" : "ok  ";
    console.log(`  ${mark}  ${q}`);
    if (verbose || problems.length) {
      console.log(`        → ${u.intent} (${u.confidence}) · entity ${u.entity.title} [${u.entity.via}]${u.domain ? ` · domain ${u.domain.subject} (${u.askType})` : ""}${u.pronoun ? ` · "${u.pronoun}"` : ""}${u.continuation ? " · follow-up" : ""}${result.lowConfidence ? " · LOW" : ""}`);
      console.log(`        → "${u.normalized}"`);
      console.log(`        → ${result.docs.slice(0, 5).map((d) => `${d.doc.id}(${d.score.toFixed(1)})`).join(", ")}`);
    }
    for (const problem of problems) console.log(`        PROBLEM: ${problem}`);
  }
  console.log();
}

console.log("─".repeat(72));
console.log(`${questions - (failures - hygiene.length)}/${questions} phrasings converged · ${hygiene.length} taxonomy problem(s)`);
console.log("─".repeat(72));
process.exit(failures ? 1 : 0);
