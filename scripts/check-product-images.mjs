import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { allProducts, mobilityProducts, secureProducts } = await import(pathToFileURL(path.resolve("src/data/products.ts")).href);

const manifest = JSON.parse(readFileSync("product-image-manifest.json", "utf8"));
const generated = JSON.parse(readFileSync("src/data/product-images.generated.json", "utf8"));
const names = "WalkScan FallRisk RehabTrack SportsMotion WatchCare NeuroMotion OrthoMotion SeniorCare PediatricMotion ProstheticFit RemoteCare ClinicalTrials SuspiciousMotion CrowdSense IndustrialSafety PrivacyGuard CampusShield EventShield RetailGuard ForensicSearch ReID AccessMotion Watchlist DefenceMotion".split(" ");
const roles = { heroDark: "dark-hero", heroLight: "light-hero", card: "card" };
const usedPaths = new Set();
const usedSourceHashes = new Set();
const usedOutputHashes = new Set();
const missing = [];
const totals = { heroDark: 0, heroLight: 0, card: 0 };
const inventory = new Map(manifest.inventory.map((item) => [item.source, item]));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

assert.deepEqual(allProducts.map((p) => p.short), names, "Canonical 24-product order");
assert.equal(mobilityProducts.length, 12);
assert.equal(secureProducts.length, 12);
assert.deepEqual(manifest.products.map((p) => p.product), names, "Manifest product order");
assert.deepEqual(Object.keys(generated).sort(), allProducts.filter((p) => p.images).map((p) => p.id).sort());
assert.deepEqual(readdirSync("public/images/products").sort(), Object.keys(generated).sort(), "Product directory capitalization / orphan directories");

for (const product of allProducts) {
  const record = manifest.products.find((p) => p.slug === product.id);
  assert.equal(record.vertical, product.vertical);
  if (!product.images) {
    assert.equal(record.status, "missing-source-set");
    assert.ok(Object.values(record.sources).every((source) => source === null));
    missing.push(product.short);
    continue;
  }
  assert.equal(record.status, "reviewed");
  assert.deepEqual(product.images, generated[product.id]);
  const expectedFiles = [];
  for (const [role, basename] of Object.entries(roles)) {
    const url = product.images[role];
    const asset = product.images.assets[role];
    assert.equal(url, `/images/products/${product.id}/${basename}.webp`);
    assert.ok(!usedPaths.has(url), `Duplicate assignment: ${url}`);
    usedPaths.add(url);
    const source = inventory.get(record.sources[role]);
    assert.ok(source, `Source provenance missing: ${product.id}/${role}`);
    assert.ok(!usedSourceHashes.has(source.sha256), `Source assigned twice: ${record.sources[role]}`);
    usedSourceHashes.add(source.sha256);
    assert.equal(asset.width, source.width, `Source width was lost: ${url}`);
    assert.equal(asset.height, source.height, `Source height was lost: ${url}`);
    assert.ok(asset.width >= 1440 && asset.height >= 800, `Undersized master: ${url}`);
    assert.equal(asset.variants.at(-1).src, url);
    assert.deepEqual(record.outputs[role], asset, `Manifest drift: ${url}`);
    let previousWidth = 0;
    for (const variant of asset.variants) {
      assert.ok(variant.width > previousWidth && variant.width <= source.width);
      previousWidth = variant.width;
      assert.equal(variant.height, Math.round(source.height * variant.width / source.width));
      const filename = path.join("public", variant.src);
      assert.ok(existsSync(filename), `Broken URL: ${variant.src}`);
      const bytes = readFileSync(filename);
      assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      assert.equal(bytes.length, variant.bytes);
      assert.equal(hash(bytes), variant.sha256, `Changed file: ${variant.src}`);
      assert.ok(!usedOutputHashes.has(variant.sha256), `Duplicate encoded image: ${variant.src}`);
      usedOutputHashes.add(variant.sha256);
      expectedFiles.push(path.basename(variant.src));
    }
    totals[role]++;
  }
  assert.deepEqual(readdirSync(`public/images/products/${product.id}`).sort(), expectedFiles.sort(), `Unregistered files: ${product.id}`);
}

console.log(`Registry: ${allProducts.length}/24 products; dark heroes: ${totals.heroDark}/24; light heroes: ${totals.heroLight}/24; cards: ${totals.card}/24.`);
console.log(`Verified ${usedPaths.size}/72 primary assignments and ${usedOutputHashes.size} encoded files: paths, case, hashes, uniqueness, dimensions, srcset ladders and provenance.`);
if (missing.length) {
  console.warn(`MISSING SOURCE SETS: ${missing.join(", ")}.`);
  if (!process.argv.includes("--allow-incomplete")) process.exitCode = 1;
}
