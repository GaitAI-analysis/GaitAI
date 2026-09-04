#!/usr/bin/env node
/**
 * GaitAI DATA-INTEGRITY VALIDATOR
 * =============================================================================
 * The site's facts live in typed data modules and every surface derives from
 * them. TypeScript proves the SHAPES are right; nothing proved the
 * RELATIONSHIPS were. A capability id typo'd in one mapping, a product
 * referenced from an environment after being renamed, a publication missing a
 * DOI — all of those compiled cleanly and failed silently at runtime, or worse,
 * rendered a quietly wrong count.
 *
 * This script closes that gap. It reads the real modules through tsx (so it
 * validates the same data the site renders, not a copy) and fails the build on
 * integrity errors while reporting cosmetic problems as warnings.
 *
 * ERRORS fail the build — a broken reference or a duplicate id is a bug that
 * will render wrong. WARNINGS do not — an orphan capability may be deliberate
 * groundwork, and a missing optional field is not a defect.
 *
 * Run through tsx (see the npm script) so the .ts data modules import
 * natively as ESM. Registering the loader in-process instead makes Node treat
 * them as require(esm) and misreport the clean data DAG as a cycle.
 *
 *   npm run validate:gaitai
 *   npm run validate:gaitai -- --strict   treat warnings as errors too
 * =============================================================================
 */

import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const STRICT = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const err = (check, message) => errors.push({ check, message });
const warn = (check, message) => warnings.push({ check, message });

/** Registered checks, so the summary can list what actually ran. */
const ran = [];

async function main() {
  const root = process.cwd();
  const load = async (rel) => {
    const abs = path.join(root, "src", rel);
    if (!existsSync(abs)) throw new Error(`missing data module: src/${rel}`);
    return import(pathToFileURL(abs).href);
  };

  const products = await load("data/products.ts");
  const graph = await load("data/gaitscape/graph.ts");
  const publications = await load("data/publications.ts");
  const evidence = await load("data/evidence.ts");
  const useCases = await load("data/usecase-details.ts");
  const details = await load("data/product-details.ts");
  const insights = await load("data/insights.ts");
  const samples = await load("data/sample-outputs.ts");
  const searchIdx = await load("data/search-index.ts");
  const comparisons = await load("data/comparisons.ts");
  const labsMod = await load("data/labs.ts");

  const { allProducts, industryUseCases } = products;
  const { gaitscapeNodes, gaitscapeRelationships } = graph;
  const { allPublications } = publications;
  const { researchAreas } = evidence;
  const { useCaseDetails } = useCases;
  const { allProductDetails } = details;
  const { insightArticles } = insights;
  const { sampleOutputs } = samples;
  const { searchIndex } = searchIdx;
  const { productComparisons } = comparisons;
  const { labs } = labsMod;

  const productIds = new Set(allProducts.map((p) => p.id));
  const nodeIds = new Set(gaitscapeNodes.map((n) => n.id));
  const publicationIds = new Set(allPublications.map((p) => p.id));
  const capabilityIds = new Set(
    gaitscapeNodes.filter((n) => n.type === "capability").map((n) => n.id),
  );

  // ── 1. Duplicate ids ─────────────────────────────────────────────────────
  ran.push("duplicate ids");
  const dupes = (label, ids) => {
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) err("duplicate ids", `${label}: "${id}" appears twice`);
      seen.add(id);
    }
  };
  dupes("product", allProducts.map((p) => p.id));
  dupes("graph node", gaitscapeNodes.map((n) => n.id));
  dupes("publication", allPublications.map((p) => p.id));
  dupes("environment", industryUseCases.map((e) => e.id));
  dupes("use-case slug", useCaseDetails.map((d) => d.slug));
  dupes("product-detail slug", allProductDetails.map((d) => d.slug));
  dupes("insight slug", insightArticles.map((a) => a.slug));
  dupes("search entry", searchIndex.map((e) => e.id));

  // ── 2. Cross-references resolve ──────────────────────────────────────────
  ran.push("cross-references");
  for (const environment of industryUseCases) {
    for (const id of environment.productIds) {
      if (!productIds.has(id)) {
        err(
          "cross-references",
          `environment "${environment.id}" references unknown product "${id}"`,
        );
      }
    }
  }
  for (const detail of useCaseDetails) {
    if (!industryUseCases.some((e) => e.id === detail.caseId)) {
      err(
        "cross-references",
        `use-case detail "${detail.slug}" references unknown environment "${detail.caseId}"`,
      );
    }
    for (const related of detail.related) {
      if (!useCaseDetails.some((d) => d.slug === related)) {
        err(
          "cross-references",
          `use-case "${detail.slug}" relates to unknown use-case "${related}"`,
        );
      }
    }
  }
  for (const detail of allProductDetails) {
    if (!productIds.has(detail.slug)) {
      err(
        "cross-references",
        `product detail "${detail.slug}" has no matching product record`,
      );
    }
    for (const related of detail.related) {
      if (!productIds.has(related)) {
        err(
          "cross-references",
          `product "${detail.slug}" relates to unknown product "${related}"`,
        );
      }
    }
  }
  for (const sample of sampleOutputs) {
    if (!productIds.has(sample.productId)) {
      err(
        "cross-references",
        `sample output references unknown product "${sample.productId}"`,
      );
    }
  }

  // ── 3. GaitScape graph integrity ─────────────────────────────────────────
  ran.push("graph integrity");
  for (const rel of gaitscapeRelationships) {
    if (!nodeIds.has(rel.source)) {
      err(
        "graph integrity",
        `relationship source "${rel.source}" is not a graph node (→ ${rel.target})`,
      );
    }
    if (!nodeIds.has(rel.target)) {
      err(
        "graph integrity",
        `relationship target "${rel.target}" is not a graph node (${rel.source} →)`,
      );
    }
  }
  // Duplicate edges: the same triple twice means a count is inflated somewhere.
  const edgeSeen = new Set();
  for (const rel of gaitscapeRelationships) {
    const key = `${rel.source}|${rel.target}|${rel.type}`;
    if (edgeSeen.has(key)) {
      warn("graph integrity", `duplicate edge ${key.replace(/\|/g, " → ")}`);
    }
    edgeSeen.add(key);
  }
  // Every product must exist as a graph node, or GaitScape silently drops it.
  for (const product of allProducts) {
    if (!nodeIds.has(product.id)) {
      err("graph integrity", `product "${product.id}" has no graph node`);
    }
  }

  // ── 4. Research relationships ────────────────────────────────────────────
  ran.push("research relationships");
  const { RESEARCH_MAP } = graph;
  for (const [researchId, caps] of Object.entries(RESEARCH_MAP)) {
    if (!nodeIds.has(researchId)) {
      err(
        "research relationships",
        `RESEARCH_MAP key "${researchId}" is not a graph node`,
      );
    }
    for (const cap of caps) {
      if (!capabilityIds.has(cap)) {
        err(
          "research relationships",
          `research "${researchId}" maps to unknown capability "${cap}"`,
        );
      }
    }
  }
  for (const node of gaitscapeNodes) {
    if (!node.publicationIds) continue;
    for (const id of node.publicationIds) {
      if (!publicationIds.has(id)) {
        err(
          "research relationships",
          `node "${node.id}" cites unknown publication "${id}"`,
        );
      }
    }
  }
  for (const area of researchAreas) {
    if (area.publications.length === 0) {
      warn(
        "research relationships",
        `research area "${area.id}" resolves to no publications`,
      );
    }
    if (area.capabilities.length === 0) {
      warn(
        "research relationships",
        `research area "${area.id}" informs no capability`,
      );
    }
  }

  // ── 5. Publication metadata ──────────────────────────────────────────────
  ran.push("publication metadata");
  const currentYear = new Date().getFullYear();
  for (const p of allPublications) {
    const where = `publication "${p.id}"`;
    if (!p.title?.trim()) err("publication metadata", `${where} has no title`);
    if (!p.venue?.trim()) err("publication metadata", `${where} has no venue`);
    if (!p.publisher) err("publication metadata", `${where} has no publisher`);
    if (!Number.isInteger(p.year) || p.year < 1990 || p.year > currentYear + 1) {
      err("publication metadata", `${where} has implausible year "${p.year}"`);
    }
    if (!Array.isArray(p.authors) || p.authors.length === 0) {
      err("publication metadata", `${where} has no authors`);
    }
    if (!p.externalUrl?.startsWith("http")) {
      err("publication metadata", `${where} has no absolute externalUrl`);
    }
    // DOI is optional, but a malformed one is worse than none.
    if (p.doi && !/^10\.\d{4,9}\/\S+$/.test(p.doi)) {
      err("publication metadata", `${where} has malformed DOI "${p.doi}"`);
    }
    if (p.kind === "paper" && !p.doi) {
      warn("publication metadata", `${where} is a paper with no DOI`);
    }
    if (p.kind === "patent" && !p.patentNumber) {
      err("publication metadata", `${where} is a patent with no patentNumber`);
    }
    if (p.cover && !existsSync(path.join(root, "public", p.cover))) {
      warn("publication metadata", `${where} cover asset missing: ${p.cover}`);
    }
  }

  // ── 6. Orphans ───────────────────────────────────────────────────────────
  ran.push("orphans");
  const usedCapabilities = new Set(
    gaitscapeRelationships
      .filter((r) => r.type === "powered-by")
      .map((r) => r.target),
  );
  for (const id of capabilityIds) {
    if (!usedCapabilities.has(id)) {
      warn("orphans", `capability "${id}" is used by no product`);
    }
  }
  const citedPublications = new Set(
    gaitscapeNodes.flatMap((n) => n.publicationIds ?? []),
  );
  for (const id of publicationIds) {
    if (!citedPublications.has(id)) {
      warn("orphans", `publication "${id}" is mapped to no research area`);
    }
  }
  for (const product of allProducts) {
    if (!industryUseCases.some((e) => e.productIds.includes(product.id))) {
      warn("orphans", `product "${product.id}" appears in no environment`);
    }
  }

  // ── 7. Internal route targets ────────────────────────────────────────────
  // Every href the search index hands the router must correspond to a route
  // this app can actually serve.
  ran.push("route targets");
  const staticRoutes = new Set([
    "/", "/products", "/mobilitycare", "/securevision", "/use-cases",
    "/gaitscape", "/research", "/research/evidence", "/research/talks",
    "/publications",
    "/insights", "/investors", "/movement-lab", "/labs", "/trust",
    "/legal/privacy", "/legal/security", "/legal/terms",
    "/legal/responsible-ai",
  ]);
  const dynamicOk = (p) =>
    /^\/(mobilitycare|securevision)\/[a-z0-9-]+\/$/.test(p) ||
    /^\/use-cases\/[a-z0-9-]+\/$/.test(p) ||
    /^\/publications\/[a-z0-9-]+\/$/.test(p) ||
    /^\/insights\/[a-z0-9-]+\/$/.test(p);

  const routable = (href) => {
    const [pathOnly] = href.split(/[?#]/);
    const bare = pathOnly.replace(/\/$/, "") || "/";
    return staticRoutes.has(bare) || dynamicOk(pathOnly);
  };

  for (const entry of searchIndex) {
    if (!routable(entry.href)) {
      err(
        "route targets",
        `search entry "${entry.id}" points at unroutable "${entry.href}"`,
      );
    }
  }
  // Labs entries are the one place on the site where a broken link would
  // publish a demo that does not exist, which is precisely what the Labs
  // rule forbids. An anchor is not checked here (a static export cannot
  // verify one), but the PAGE it hangs off is.
  for (const lab of labs) {
    if (!routable(lab.href)) {
      err("route targets", `lab "${lab.id}" points at unroutable "${lab.href}"`);
    }
  }

  // ── 8. Named comparisons ─────────────────────────────────────────────────
  // A pair must reference two real modules of the same family, and must not
  // pit a module against itself. A typo here would render a table with an
  // empty column instead of failing, so it fails here.
  ran.push("comparisons");
  dupes("comparison", productComparisons.map((c) => c.id));
  const productFamily = new Map(allProducts.map((p) => [p.id, p.vertical]));
  for (const comparison of productComparisons) {
    if (comparison.pair.length !== 2) {
      err(
        "comparisons",
        `comparison "${comparison.id}" has ${comparison.pair.length} members, expected 2`,
      );
      continue;
    }
    const [left, right] = comparison.pair;
    for (const id of comparison.pair) {
      if (!productIds.has(id)) {
        err(
          "comparisons",
          `comparison "${comparison.id}" references unknown product "${id}"`,
        );
      }
    }
    if (left === right) {
      err("comparisons", `comparison "${comparison.id}" compares "${left}" with itself`);
    }
    const familyLeft = productFamily.get(left);
    const familyRight = productFamily.get(right);
    if (familyLeft && familyRight && familyLeft !== familyRight) {
      err(
        "comparisons",
        `comparison "${comparison.id}" crosses families ` +
          `(${left}=${familyLeft}, ${right}=${familyRight}) — the two are not alternatives`,
      );
    }
    if (!comparison.question?.trim()) {
      err("comparisons", `comparison "${comparison.id}" has no question`);
    }
  }

  // ── 9. Naming consistency (Phase 25) ─────────────────────────────────────
  // One entity must not become two through capitalisation drift.
  ran.push("naming consistency");
  const CANON = ["MobilityCare", "SecureVision", "GaitScape", "WalkScan", "FallRisk"];
  const haystack = searchIndex.map((e) => `${e.title} ${e.detail}`).join(" ");
  for (const name of CANON) {
    const wrong = new RegExp(`\\b${name.replace(/([A-Z])/g, "[$1]")}\\b`, "g");
    for (const found of haystack.match(wrong) ?? []) {
      if (found !== name) {
        warn(
          "naming consistency",
          `"${found}" should be "${name}"`,
        );
      }
    }
  }

  // ── Report ───────────────────────────────────────────────────────────────
  const line = "─".repeat(72);
  console.log(`\n${line}\nGaitAI data integrity\n${line}`);
  console.log(
    `  ${allProducts.length} products · ${industryUseCases.length} environments · ` +
      `${capabilityIds.size} capabilities · ${allPublications.length} publications\n` +
      `  ${gaitscapeNodes.length} graph nodes · ${gaitscapeRelationships.length} relationships · ` +
      `${searchIndex.length} search entries\n` +
      `  checks: ${ran.join(", ")}`,
  );

  if (warnings.length) {
    console.log(`\n  ${warnings.length} warning(s)`);
    for (const w of warnings) console.log(`    · [${w.check}] ${w.message}`);
  }

  if (errors.length) {
    console.log(`\n  ${errors.length} ERROR(S)`);
    for (const e of errors) console.log(`    ✗ [${e.check}] ${e.message}`);
    console.log(`\n${line}\nFAILED — fix the errors above.\n${line}\n`);
    process.exit(1);
  }

  if (STRICT && warnings.length) {
    console.log(`\n${line}\nFAILED (--strict): warnings treated as errors.\n${line}\n`);
    process.exit(1);
  }

  console.log(`\n${line}\nPASSED — no integrity errors.\n${line}\n`);
}

main().catch((e) => {
  console.error("\nvalidate:gaitai crashed:\n", e);
  process.exit(1);
});
