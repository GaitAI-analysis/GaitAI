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
  const fusion = await load("data/fusion-sandbox.ts");
  const privacyLens = await load("data/privacy-lens.ts");

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
  const { labs, LAB_ACTIONS } = labsMod;
  const { unknownFusionChannels } = fusion;
  const { sourcesForProduct, supportingSourcesForProduct } = graph;
  const { privacyStages } = privacyLens;

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

  /* A search entry is a place (`href`) or an action (`action`) — the Atlas
     opens in place and has no URL — and never both or neither. Only the
     places are checked as routes below. Returns true when the entry is an
     action (or malformed) and the route checks should be skipped. */
  const knownActions = new Set(LAB_ACTIONS);
  const isAction = (entry, label) => {
    const hasHref = entry.href !== undefined;
    const hasAction = entry.action !== undefined;
    if (hasHref === hasAction) {
      err(
        "route targets",
        `${label} must carry exactly one of href / action, has ` +
          (hasHref ? "both" : "neither"),
      );
      return true;
    }
    if (hasAction && !knownActions.has(entry.action)) {
      err("route targets", `${label} names unknown action "${entry.action}"`);
    }
    return hasAction;
  };

  for (const entry of searchIndex) {
    if (isAction(entry, `search entry "${entry.id}"`)) continue;
    if (!routable(entry.href)) {
      err(
        "route targets",
        `search entry "${entry.id}" points at unroutable "${entry.href}"`,
      );
    }
    /* TRAILING SLASHES. next.config.mjs sets trailingSlash, so a route without
       one 404s on a hard load or a copied URL even though client-side
       navigation quietly normalises it — which is why 22 talk entries shipped
       with a broken href and nobody noticed. Anchored and query hrefs are
       checked on the path portion only. */
    const [pathOnly] = entry.href.split(/[?#]/);
    if (pathOnly !== "/" && pathOnly.length > 0 && !pathOnly.endsWith("/")) {
      err(
        "route targets",
        `search entry "${entry.id}" href "${entry.href}" has no trailing ` +
          "slash; a hard load of it 404s on the static host",
      );
    }
  }

  // Labs entries are the one place on the site where a broken link would
  // publish a demo that does not exist, which is precisely what the Labs
  // rule forbids. An anchor is not checked here (a static export cannot
  // verify one), but the PAGE it hangs off is. An action lab has no page to
  // check; it is checked for naming an action the site actually has, and for
  // not carrying an href as well — a record that is both would be a link to
  // nowhere dressed as a button.
  for (const lab of labs) {
    if (lab.kind === "action") {
      isAction(lab, `lab "${lab.id}"`);
      continue;
    }
    if (lab.kind !== "route") {
      err("route targets", `lab "${lab.id}" has unknown kind "${lab.kind}"`);
      continue;
    }
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

  // ── 9. Lab instruments ───────────────────────────────────────────────────
  // The two data-driven labs make claims their own data has to support.
  ran.push("lab instruments");

  // Fusion channels are graph signal ids. A renamed signal would otherwise
  // render its own id as a channel label.
  for (const id of unknownFusionChannels) {
    err("lab instruments", `fusion sandbox references unknown signal "${id}"`);
  }

  // The privacy lens asserts exactly one thing numerically: that each stage
  // retains strictly less than the one before. If that ever stops being true
  // the indicator becomes a lie, so it is checked rather than trusted.
  for (let i = 1; i < privacyStages.length; i += 1) {
    if (privacyStages[i].retained >= privacyStages[i - 1].retained) {
      err(
        "lab instruments",
        `privacy lens stage "${privacyStages[i].id}" retains ` +
          `${privacyStages[i].retained}, which is not less than ` +
          `"${privacyStages[i - 1].id}" at ${privacyStages[i - 1].retained}`,
      );
    }
  }
  // The last stage is the terminal one and must drop nothing further.
  const lastStage = privacyStages[privacyStages.length - 1];
  if (lastStage.drops.length > 0) {
    err(
      "lab instruments",
      `privacy lens final stage "${lastStage.id}" lists dropped information, ` +
        "but there is no step after it for the drop to happen at",
    );
  }

  // ── 10. Capture-source coverage ──────────────────────────────────────────
  // Each module states its inputs twice: a one-line summary (systemFactsFor,
  // which the PRIMARY derivation reads) and a prose list in its detail record.
  // Where the prose hedges a source the summary does not name — "optional
  // wearable data", "compatible CCTV where appropriate" — that source is
  // declared on the product record as `supportingSources`.
  //
  // THIS CHECK IS WHERE THE PROSE IS ACTUALLY READ. It used to be read in
  // gaitscape/graph.ts, which put 1,500 lines of product copy into seven
  // client bundles for data none of them render. A regex over English belongs
  // in a build-time check, not in a browser — so the matching lives here, and
  // it runs in both directions:
  //
  //   PROSE → DECLARATION  a hedged source in tech.inputs that is neither
  //                        primary nor declared is a capability the site is
  //                        quietly denying while a product page claims it
  //   DECLARATION → PROSE  a declared supporting source with nothing in
  //                        tech.inputs behind it is a claim with no source
  //
  // Either direction fails the build, so the two can never drift apart again.
  ran.push("capture sources");
  const HEDGED =
    /optional|where available|when available|where included|where appropriate|if available/i;
  const SOURCE_PATTERNS = [
    ["video", /video|walking video/i],
    ["cctv", /cctv|camera feed|cameras|camera analytics|fixed.camera/i],
    ["wearable", /smartwatch|wearable|imu|sensor signals/i],
  ];

  for (const detail of allProductDetails) {
    const primary = sourcesForProduct(detail.slug);
    const declared = supportingSourcesForProduct(detail.slug);
    /* Sources the prose hedges, i.e. names as an addition rather than as the
       thing the module is built around. */
    const hedgedInProse = new Set();
    for (const line of detail.tech?.inputs ?? []) {
      if (!HEDGED.test(line)) continue;
      for (const [source, pattern] of SOURCE_PATTERNS) {
        if (pattern.test(line)) hedgedInProse.add(source);
      }
    }

    for (const source of hedgedInProse) {
      if (primary.includes(source) || declared.includes(source)) continue;
      err(
        "capture sources",
        `module "${detail.slug}" documents "${source}" in tech.inputs but ` +
          "does not declare it in supportingSources — the site denies a " +
          "capability this module's own page claims",
      );
    }
    for (const source of declared) {
      if (hedgedInProse.has(source)) continue;
      err(
        "capture sources",
        `module "${detail.slug}" declares supporting source "${source}" but ` +
          "no line in its tech.inputs names it — remove the declaration or " +
          "document the input",
      );
    }
  }

  // ── 11. No second environment mapping ────────────────────────────────────
  // `product-details*.ts` used to carry an `environments: string[]` of
  // hand-written hero tags, which was a second product-to-environment mapping
  // and disagreed with the canonical one for eleven of twenty-three modules.
  // It was removed. This check exists so it cannot come back by accident: any
  // field on a detail record that looks like a list of environment names is
  // an error, because there is exactly one such list and it lives in
  // products.ts.
  ran.push("single environment mapping");
  for (const detail of allProductDetails) {
    for (const key of ["environments", "settings", "deployments"]) {
      if (Array.isArray(detail[key])) {
        err(
          "single environment mapping",
          `product detail "${detail.slug}" declares "${key}" — the canonical ` +
            "product-to-environment mapping is industryUseCases[].productIds " +
            "in products.ts, and a second one drifts out of step with it",
        );
      }
    }
  }

  // ── 12. Naming consistency (Phase 25) ────────────────────────────────────
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
