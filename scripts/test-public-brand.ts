import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allPublications, papers, patent, ACADEMIC_REFERENCES } from "../src/data/publications";
import { talkRecords } from "../src/data/talks";
import { topicsFor, formatCitation } from "../src/components/publications/topics";
import { loadCorpusFromDisk } from "./ask/corpus-node";
import { retrieveGaitAIContext } from "../src/lib/ask/retrieval";
import { composeExtractiveAnswer } from "../src/lib/ask/extractive";
import { PUBLIC_IDENTITY_RESPONSE } from "../src/lib/ask/public-scope";

assert.equal(papers.length, 8, "Retain all paper records");
assert.equal(allPublications.length, 9, "Retain the patent reference");
assert.equal(patent.patentNumber, "402202");
assert.equal(talkRecords.length, 21, "Retain every current talk record");
for (const record of allPublications) {
  assert.ok(record.title && record.venue && record.publisher && record.year && record.abstract);
  assert.ok(topicsFor(record).length > 0);
  assert.ok(!("authors" in record) && !("founderIndex" in record));
  assert.ok(!record.cover.startsWith("/publications/"), "No document or certificate scans");
  assert.match(record.externalUrl, /^https:\/\/(doi\.org|www\.sciencedirect\.com|ipindiaservices\.gov\.in)\//);
  assert.ok(formatCitation(record).startsWith(`"${record.title}."`));
}
assert.match(ACADEMIC_REFERENCES.scope, /does not imply GaitAI authorship, ownership/);
for (const talk of talkRecords) {
  assert.ok(!("speaker" in talk));
  for (const link of talk.evidence) assert.ok(!link.href.includes("github.io"), "No personal portfolio evidence");
}
const corpus = loadCorpusFromDisk();
assert.equal(corpus.docs.filter(doc => doc.type === "person").length, 0);
assert.ok(corpus.docs.every(doc => !doc.relatedEntityIds?.some(id => id.startsWith("person:"))));
for (const question of ["Who founded GaitAI?", "Who owns GaitAI?", "Who authored these papers?", "Founder?", "Who is Casey Example?"]) {
  for (const route of ["/", "/publications/", "/trust/", "/research/talks/"]) {
    const result = retrieveGaitAIContext(question, route);
    assert.equal(result.intent, "PERSON");
    assert.equal(result.docs.length, 0);
    assert.equal(composeExtractiveAnswer(result), PUBLIC_IDENTITY_RESPONSE);
  }
}
// The account policy stays equivalent while public files carry only digests.
const config = readFileSync("src/lib/comments/config.ts", "utf8");
const hashes = config.match(/[a-f0-9]{64}/g)!;
assert.equal(hashes.length, 2);
assert.ok(!/[\w.+-]+@[\w.-]+\.[a-z]+/i.test(config));
for (const file of ["firestore.rules", "storage.rules"]) {
  const rule = readFileSync(file, "utf8");
  assert.match(rule, /hashing\.sha256\(request\.auth\.token\.email\)\.toHexString\(\)/);
  assert.deepEqual(rule.match(/[a-f0-9]{64}/g), hashes);
  assert.match(rule, /email_verified == true/);
}
console.log("Public brand checks passed: 9 research records, 21 talks, no person profiles, 20 identity queries, unchanged moderator account digests.");
