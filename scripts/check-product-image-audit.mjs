import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { reviewedSource } from "./product-image-selection.mjs";

const manifest = JSON.parse(readFileSync("product-image-manifest.json", "utf8"));
const { inventory, products, audit } = manifest;
const hash = (data) => createHash("sha256").update(data).digest("hex");
const roles = ["heroDark", "heroLight", "card"];
const names = "WalkScan FallRisk RehabTrack SportsMotion WatchCare NeuroMotion OrthoMotion SeniorCare PediatricMotion ProstheticFit RemoteCare ClinicalTrials SuspiciousMotion CrowdSense IndustrialSafety PrivacyGuard CampusShield EventShield RetailGuard ForensicSearch ReID AccessMotion Watchlist DefenceMotion".split(" ");
assert.equal(manifest.schemaVersion, 2);
assert.deepEqual(products.map((p) => p.product), names);
assert.equal(inventory.length, audit.summary.filesInspected);
assert.equal(new Set(inventory.map((r) => r.source)).size, inventory.length);
assert.equal(new Set(inventory.map((r) => r.reviewId)).size, inventory.length);
const byName = new Map(inventory.map((r) => [r.source, r]));
const byId = new Map(inventory.map((r) => [r.reviewId, r]));
const hashGroups = new Map();
for (const record of inventory) {
  assert.ok(record.width > 0 && record.height > 0 && record.visualNote);
  assert.ok(Math.abs(record.aspectRatio - record.width / record.height) < 0.000001);
  assert.match(record.sha256, /^[a-f0-9]{64}$/);
  assert.match(record.phash, /^[a-f0-9]{16}$/);
  assert.match(record.dhash, /^[a-f0-9]{16}$/);
  assert.ok(Array.isArray(record.candidateProducts));
  assert.ok(record.candidateProducts.every((name) => names.includes(name)));
  assert.ok(record.candidateRole === null || roles.includes(record.candidateRole));
  const members = hashGroups.get(record.sha256) ?? [];
  members.push(record.reviewId);
  hashGroups.set(record.sha256, members);
}
const duplicateGroups = [...hashGroups.values()].filter((group) => group.length > 1);
assert.deepEqual(duplicateGroups, audit.exactDuplicateGroups);
assert.equal(inventory.length - hashGroups.size, audit.summary.exactDuplicateExtraFiles);
for (const pair of audit.similarityCandidates) {
  assert.ok(byId.has(pair.a) && byId.has(pair.b));
  assert.ok(pair.reviewResult && pair.reviewNote);
}

const selected = new Map();
const counts = { heroDark: 0, heroLight: 0, card: 0 };
const missing = [];
const missingClean = [];
const cleanCounts = { heroDark: 0, heroLight: 0, card: 0 };
let clean = 0, posters = 0, complete = 0, shared = 0;
for (const product of products) {
  let assigned = 0;
  for (const role of roles) {
    const source = product.sources[role];
    if (!source) {
      assert.equal(product.roleReview[role].status, "missing");
      missing.push(`${product.slug}:${role}`);
      missingClean.push(`${product.slug}:${role}`);
      continue;
    }
    const record = reviewedSource(manifest, product, role);
    if (selected.has(record.sha256)) assert.equal(selected.get(record.sha256), source, "Duplicate exports cannot be counted separately");
    selected.set(record.sha256, source);
    if (product.roleReview[role].sharedFrom) shared++;
    if (record.sourceKind === "single-product-poster") {
      assert.equal(product.roleReview[role].status, "selected-poster");
      assert.ok(product.warnings?.[role]?.length, "Selected poster must retain its warning");
      posters++;
      missingClean.push(`${product.slug}:${role}`);
    } else {
      assert.equal(record.sourceKind, "clean-photograph");
      assert.equal(product.roleReview[role].status, "selected-clean");
      cleanCounts[role]++;
      clean++;
    }
    assigned++;
    counts[role]++;
  }
  assert.equal(product.status, assigned === 3 ? "reviewed" : assigned ? "partial-source-set" : "missing-source-set");
  if (assigned === 3) complete++;
}
assert.deepEqual(missing, manifest.missingAssets.map((item) => `${item.slug}:${item.role}`));
assert.deepEqual(missingClean, manifest.missingCleanAssets.map((item) => `${item.slug}:${item.role}`));
assert.equal(clean + missingClean.length, 72);
for (const role of roles) assert.equal(counts[role], audit.summary[role]);
assert.equal(clean + posters, audit.summary.totalValidMapped);
assert.equal(selected.size, audit.summary.uniqueSelectedSourceAssets);
assert.equal(shared, audit.summary.sharedSourceAssignments);
assert.equal(clean, audit.summary.selectedCleanAssets);
assert.equal(posters, audit.summary.selectedPosterAssets);
assert.equal(complete, audit.summary.completeProductSets);
assert.equal(missing.length, audit.summary.missingAssets);
assert.equal(clean + posters + missing.length, 72);
assert.deepEqual(manifest.missingDedicatedAssets.map((item) => `${item.slug}:${item.role}`), products.flatMap((p) => roles.filter((role) => p.roleReview[role].sharedFrom || !p.sources[role]).map((role) => `${p.slug}:${role}`)));
const kinds = { "contact-sheet-or-collage": "contactSheetsCollages", "unrelated-rejected": "unrelatedRejected", "single-product-poster": "singleProductPosters", "clean-photograph": "validStandalonePhotographicCandidates" };
for (const [kind, metric] of Object.entries(kinds)) assert.equal(inventory.filter((r) => r.sourceKind === kind).length, audit.summary[metric]);
assert.equal(audit.summary.validStandaloneCandidates, audit.summary.validStandalonePhotographicCandidates + audit.summary.singleProductPosters);
assert.equal(inventory.filter((r) => r.sourceKind === "clean-photograph" && r.confidence === "ambiguous").length, audit.summary.ambiguousPhotographicCandidates);
for (const historical of manifest.history) assert.equal(hash(readFileSync(historical.snapshot)), historical.sha256, "Historical manifest changed");

const sourceIndex = process.argv.indexOf("--source-dir");
if (sourceIndex >= 0) {
  const sourceRoot = path.resolve(process.argv[sourceIndex + 1]);
  const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  const actualNames = walk(sourceRoot).map((file) => path.relative(sourceRoot, file).replaceAll("\\", "/")).sort();
  assert.deepEqual(actualNames, [...byName.keys()].sort(), "Folder changed since audit");
  for (const record of inventory) assert.equal(hash(readFileSync(path.join(sourceRoot, record.source))), record.sha256, record.source);
  console.log(`All ${inventory.length} current source files match the audited SHA-256 hashes.`);
}
console.log(`AUDIT PASS: ${inventory.length} files; ${duplicateGroups.length} exact duplicate groups / ${audit.summary.exactDuplicateExtraFiles} extra copies; ${audit.similarityCandidates.length} similarity pairs visually reviewed.`);
console.log(`Role coverage: Dark ${counts.heroDark}/24, Light ${counts.heroLight}/24, Card ${counts.card}/24 = ${clean + posters}/72 (${clean} clean + ${posters} flagged poster); ${missing.length} missing roles.`);
console.log(`Distinct selected sources: ${selected.size}; explicitly shared semantic assignments: ${shared}; missing dedicated roles: ${manifest.missingDedicatedAssets.length}.`);
console.log(`Clean coverage: Dark ${cleanCounts.heroDark}/24, Light ${cleanCounts.heroLight}/24, Card ${cleanCounts.card}/24 = ${clean}/72; ${missingClean.length} missing clean roles. Posters do not qualify for integration.`);
