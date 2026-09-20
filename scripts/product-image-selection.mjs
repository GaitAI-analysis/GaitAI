import assert from "node:assert/strict";

/** Shared imagery is permitted only by an explicit, reviewed semantic mapping.
 * The source still has one primary owner; aliases never invent new source files.
 */
export function reviewedSource(manifest, product, role) {
  const filename = product.sources[role];
  const source = manifest.inventory.find((item) => item.source === filename);
  const review = product.roleReview[role];
  assert.ok(source?.eligibleForMapping, `Ineligible source: ${filename}`);
  assert.equal(source.selection, "selected");
  assert.equal(review.reviewId, source.reviewId);
  assert.ok(source.candidateProducts.includes(product.product));
  const owner = review.sharedFrom ?? { product: product.product, role };
  assert.deepEqual(source.selectedFor, owner, `Undeclared source sharing: ${product.product}/${role}`);
  assert.equal(source.candidateRole, owner.role);
  if (review.sharedFrom) {
    assert.equal(manifest.semanticSharingPolicy?.enabled, true);
    assert.ok(review.reason && product.mappingNote, "Semantic matches need an explicit explanation");
    const primary = manifest.products.find((item) => item.product === owner.product);
    assert.equal(primary?.sources[owner.role], filename, "Shared source must reference its current primary selection");
    assert.ok(!primary.roleReview[owner.role].sharedFrom, "Shared mappings cannot form chains");
    assert.equal(source.sourceKind, "clean-photograph");
  }
  return source;
}
