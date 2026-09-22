import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Use-case environment imagery: the integrity gate.
 *
 * The manifest records a visual review; this asserts that production still
 * matches it. It is deliberately suspicious of the two ways this integration
 * could go quietly wrong:
 *
 *   1. An environment showing another environment's photograph. Every source
 *      file may be selected for exactly one (caseId, role) slot, and every
 *      emitted path may be claimed once.
 *   2. A "light" image that is really the dark one brightened, or a "dark" one
 *      that is the light one dimmed. Both roles must be distinct files with
 *      distinct pixels, and the dark frame must actually be darker — measured
 *      from the source luminance recorded at review time, not asserted in
 *      prose.
 *
 * It also holds the line on rejects: a source the review threw out — a contact
 * sheet, a weapons frame — can never appear in a mapping.
 */

const { industryUseCases } = await import(
  pathToFileURL(path.resolve("src/data/products.ts")).href
);

const manifest = JSON.parse(
  readFileSync("use-case-image-manifest.json", "utf8"),
);
const generated = JSON.parse(
  readFileSync("src/data/use-case-images.generated.json", "utf8"),
);
const roles = ["dark", "light"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

const inventory = new Map(
  manifest.inventory.map((item) => [item.source, item]),
);
assert.equal(
  inventory.size,
  manifest.inventory.length,
  "Duplicate source rows in the inventory",
);
assert.equal(
  manifest.inventory.length,
  manifest.audit.summary.sourceFilesInspected,
  "Inventory length must match the reviewed file count",
);

/* Every environment on the page, and only those, may appear in the manifest. */
const caseIds = industryUseCases.map((entry) => entry.id);
const manifestIds = manifest.useCases.map((record) => record.caseId);
assert.deepEqual(
  [...new Set(manifestIds)],
  manifestIds,
  "Duplicate use case in the manifest",
);
for (const id of manifestIds)
  assert.ok(caseIds.includes(id), `Unknown use case: ${id}`);
const documentedMissing = manifest.missingDedicatedAssets.map(
  (row) => row.caseId,
);
assert.deepEqual(
  [...manifestIds, ...documentedMissing].sort(),
  [...caseIds].sort(),
  "Every environment is either mapped or documented as missing",
);

const usedPaths = new Set();
const usedSources = new Map();
const integrated = [];
let encodedFiles = 0;

for (const record of manifest.useCases) {
  const entry = industryUseCases.find((c) => c.id === record.caseId);
  assert.ok(entry, `Use case not on the page: ${record.caseId}`);
  assert.equal(
    record.industry,
    entry.industry,
    `${record.caseId}: industry label drifted`,
  );
  assert.equal(
    record.vertical,
    entry.vertical,
    `${record.caseId}: vertical drifted`,
  );

  const complete = roles.every(
    (role) =>
      record.sources[role] &&
      record.roleReview[role].status === "selected-clean",
  );
  if (!complete) {
    assert.ok(
      !entry.images,
      `${record.caseId}: incomplete review cannot be integrated`,
    );
    continue;
  }

  assert.equal(record.status, "reviewed");
  assert.equal(record.deploymentStatus, "integrated");
  assert.ok(entry.images, `${record.caseId}: reviewed pair must be integrated`);
  assert.deepEqual(
    entry.images,
    generated[record.caseId],
    `${record.caseId}: record vs registry`,
  );
  assert.equal(entry.images.alt, record.visualDescription);
  assert.deepEqual(entry.images.objectPosition, record.objectPosition);
  for (const role of roles) {
    assert.match(
      entry.images.objectPosition[role],
      /^\d{1,3}% \d{1,3}%$/,
      `${record.caseId}/${role}: object-position must be two percentages`,
    );
  }
  integrated.push(record.caseId);

  const sources = {};
  for (const role of roles) {
    const filename = record.sources[role];
    const source = inventory.get(filename);
    assert.ok(
      source,
      `${record.caseId}/${role}: source is not in the inventory`,
    );
    assert.equal(
      source.sourceKind,
      "clean-photograph",
      `${record.caseId}/${role}: not a photograph`,
    );
    assert.equal(
      source.selection,
      "selected",
      `${record.caseId}/${role}: rejected source in a mapping`,
    );
    assert.ok(
      source.eligibleForMapping,
      `${record.caseId}/${role}: ineligible source`,
    );
    /* A record may declare ONE photograph for both themes (`singlePhotograph`,
       with the reason stated): its source is claimed for "both", and the two
       roles legitimately share the file. Everything else about the ladder is
       still checked per role. */
    const single = Boolean(record.singlePhotograph);
    if (single)
      assert.ok(
        (record.singlePhotograph.reason ?? "").length >= 40,
        `${record.caseId}: a single photograph for both themes needs a stated reason`,
      );
    assert.deepEqual(
      source.selectedFor,
      { caseId: record.caseId, role: single ? "both" : role },
      `${record.caseId}/${role}: the inventory assigns this file elsewhere`,
    );
    assert.equal(record.roleReview[role].reviewId, source.reviewId);
    const claimed = usedSources.get(source.sha256);
    assert.ok(
      !claimed || (single && claimed.startsWith(`${record.caseId}/`)),
      `Source reused: ${filename} already serves ${claimed}`,
    );
    usedSources.set(source.sha256, `${record.caseId}/${role}`);
    sources[role] = source;

    /* The emitted ladder. */
    const asset = entry.images.assets[role];
    assert.equal(
      entry.images[role],
      `/images/use-cases/${record.caseId}/${role}.webp`,
    );
    assert.equal(
      asset.width,
      source.width,
      `${record.caseId}/${role}: width drifted from the source`,
    );
    assert.equal(
      asset.height,
      source.height,
      `${record.caseId}/${role}: height drifted`,
    );
    assert.ok(asset.variants.length >= 1);
    const widths = asset.variants.map((v) => v.width);
    assert.deepEqual(
      widths,
      [...widths].sort((a, b) => a - b),
      "Variants must ascend",
    );
    assert.equal(
      widths.at(-1),
      source.width,
      "The last rung is the native width",
    );
    assert.ok(
      Math.max(...widths) <= source.width,
      `${record.caseId}/${role}: upscaled rung`,
    );
    for (const variant of asset.variants) {
      assert.ok(
        !usedPaths.has(variant.src),
        `Duplicate emitted path: ${variant.src}`,
      );
      usedPaths.add(variant.src);
      const file = path.join("public", variant.src.replace(/^\//, ""));
      assert.ok(existsSync(file), `Missing encoded file: ${variant.src}`);
      const bytes = readFileSync(file);
      assert.equal(bytes.length, variant.bytes, `${variant.src}: size drifted`);
      assert.equal(
        hash(bytes),
        variant.sha256,
        `${variant.src}: content drifted`,
      );
      encodedFiles += 1;
      const ratio = variant.width / variant.height;
      assert.ok(
        Math.abs(ratio - source.width / source.height) < 0.02,
        `${variant.src}: aspect ratio drifted from the source`,
      );
    }
  }

  /* Two real photographs, not one photograph twice — unless the record says
     so and why (`singlePhotograph`). */
  if (record.singlePhotograph) continue;
  assert.notEqual(
    sources.dark.sha256,
    sources.light.sha256,
    `${record.caseId}: same file for both themes`,
  );
  assert.notEqual(
    sources.dark.pixelSha256,
    sources.light.pixelSha256,
    `${record.caseId}: the two themes are pixel-identical`,
  );
  assert.ok(
    sources.dark.meanLuma < sources.light.meanLuma,
    `${record.caseId}: the dark frame is not darker than the light one`,
  );
  assert.ok(
    sources.light.meanLuma - sources.dark.meanLuma > 40,
    `${record.caseId}: the pair is not a genuine day/night pair (Δluma ${(
      sources.light.meanLuma - sources.dark.meanLuma
    ).toFixed(1)})`,
  );
}

/* Rejected sources stay rejected. */
for (const row of manifest.rejections) {
  const source = inventory.get(row.source);
  assert.ok(source, `Rejection names an unknown file: ${row.source}`);
  assert.equal(source.selection, "rejected");
  assert.equal(source.eligibleForMapping, false);
  assert.equal(source.selectedFor, null);
  assert.ok(
    !usedSources.has(source.sha256),
    `Rejected source is in production: ${row.source}`,
  );
  assert.ok(row.reason, `Rejection without a reason: ${row.source}`);
}
assert.equal(
  manifest.inventory.filter((item) => !item.eligibleForMapping).length,
  manifest.rejections.length,
  "Every ineligible source must be listed as a rejection",
);

/* An environment with no imagery must say why, in the manifest. */
for (const row of manifest.missingDedicatedAssets) {
  const entry = industryUseCases.find((c) => c.id === row.caseId);
  assert.ok(
    entry,
    `Missing-asset row names an unknown use case: ${row.caseId}`,
  );
  assert.equal(
    entry.images,
    null,
    `${row.caseId} has imagery but is listed as missing`,
  );
  assert.ok(
    row.reason && row.resolution,
    `${row.caseId}: an absent pair needs a reason and a resolution`,
  );
}

/* No orphan directories, and nothing in the registry that is not on the page. */
assert.deepEqual(
  readdirSync("public/images/use-cases").sort(),
  [...integrated].sort(),
  "Orphan or missing directory under public/images/use-cases",
);
assert.deepEqual(Object.keys(generated).sort(), [...integrated].sort());
for (const entry of industryUseCases) {
  if (integrated.includes(entry.id))
    assert.ok(entry.images, `${entry.id}: lost its imagery`);
  else
    assert.equal(
      entry.images,
      null,
      `${entry.id}: imagery without a reviewed mapping`,
    );
}

const summary = manifest.audit.summary;
assert.equal(summary.useCasesWithCompletePair, integrated.length);
assert.equal(summary.currentlyIntegratedUseCaseSets, integrated.length);
assert.equal(
  summary.currentlyIntegratedPrimaryAssets,
  integrated.length * roles.length,
);
/* `selected` counts inventory FILES; a single-photograph record uses one file
   for two roles. */
const singleFiles = manifest.useCases.filter(
  (record) => record.singlePhotograph && integrated.includes(record.caseId),
).length;
assert.equal(summary.selected, integrated.length * roles.length - singleFiles);
assert.equal(summary.rejected, manifest.rejections.length);
assert.equal(
  summary.useCasesWithoutImagery,
  manifest.missingDedicatedAssets.length,
);

console.log(
  `Use-case imagery OK — ${integrated.length}/${industryUseCases.length} environments, ` +
    `${integrated.length * roles.length} primary assets, ${encodedFiles} encoded files, ` +
    `${manifest.rejections.length} reviewed rejection(s), ` +
    `${manifest.missingDedicatedAssets.length} documented gap(s).`,
);
