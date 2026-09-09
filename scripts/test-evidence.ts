import assert from "node:assert/strict";
import { allModuleEvidence, EVIDENCE_REVIEWED_AT } from "../src/data/evidence-status";
import { allProducts } from "../src/data/products";
import { allPublications } from "../src/data/publications";
import { allProductDetails } from "../src/data/product-details";
import { hasSampleOutput } from "../src/data/sample-outputs";
import { benchmarksByProduct } from "../src/data/benchmarks";

const products = new Map(allProducts.map((product) => [product.id, product]));
const publicationPaths = new Set(allPublications.map((paper) => `/publications/${paper.id}/`));
const details = new Set(allProductDetails.map((detail) => detail.slug));

assert.equal(allModuleEvidence.length, products.size, "Every published module needs an evidence inventory");
assert.ok(Number.isFinite(Date.parse(EVIDENCE_REVIEWED_AT)), "Review date must be explicit and valid");

for (const evidence of allModuleEvidence) {
  const product = products.get(evidence.productId);
  assert.ok(product, `Unknown module ${evidence.productId}`);
  assert.equal(new Set(evidence.rows.map((row) => row.id)).size, evidence.rows.length, "No duplicate evidence categories");
  assert.equal(evidence.total, evidence.rows.length);
  const row = (id: string) => evidence.rows.find((entry) => entry.id === id);
  assert.equal(row("regulatory-status")?.state, "not-claimed", "No regulatory clearance has been published");
  for (const id of ["product-implementation", "product-validation", "clinical-validation", "case-study"]) {
    assert.equal(row(id)?.state, "not-published", `${evidence.productId}: ${id} has no published record`);
  }
  const direct = row("research-foundation");
  const architectural = row("architectural-research");
  assert.ok(direct && architectural, "Both research tiers must be stated");
  const directIds = new Set(direct!.sources.map((source) => source.href));
  for (const source of architectural!.sources) {
    assert.ok(!directIds.has(source.href), `${evidence.productId}: a paper cannot be both direct and architectural`);
  }
  for (const entry of evidence.rows) {
    assert.ok(entry.applicability && entry.limitation, "Evidence needs an applicability boundary");
    if (entry.state === "available") assert.ok(entry.sources.length, "Available evidence must have a source");
    for (const source of entry.sources) {
      if (source.kind === "publication") assert.ok(publicationPaths.has(source.href), `Unknown publication: ${source.href}`);
      if (source.kind === "specification") assert.ok(details.has(evidence.productId));
      if (source.kind === "prototype") assert.ok(hasSampleOutput(evidence.productId));
      assert.ok(source.href.startsWith("/"), "Evidence sources must use canonical local records");
    }
  }
}

for (const [productId, benchmark] of Object.entries(benchmarksByProduct)) {
  assert.ok(products.has(productId));
  assert.ok(benchmark.source.href && benchmark.dataset && benchmark.hardware && benchmark.environment && benchmark.method);
  assert.ok(Number.isInteger(benchmark.sampleCount) && benchmark.sampleCount > 0);
  assert.ok(benchmark.metrics.length > 0 && benchmark.limitations.length > 0);
}

console.log(`Evidence inventory passed for ${products.size} modules; ${Object.keys(benchmarksByProduct).length} published product benchmarks.`);
