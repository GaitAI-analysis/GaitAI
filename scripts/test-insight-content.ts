/**
 * Editorial content checks — the rules every published story is held to.
 *
 *   npx tsx scripts/test-insight-content.ts
 *
 *   · slugs are unique, URL-safe and routable
 *   · every series named on a record is in the series registry, and positions
 *     within a series are unique
 *   · every experience record points at an article that exists, a figure the
 *     registry knows, sections the article has, terms that exist, moments that
 *     use known figures
 *   · every evidence link is a real publication id; every GaitScape door is a
 *     real node id; every related slug and relatedSignal exists
 *   · every social card file exists at the path the record names
 *   · a major story carries a memorable interaction OR says it is editorial
 *   · no record states a fabricated metric (accuracy %, AUC, sensitivity …)
 *   · a long-form article has enough words to be one
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const { insightArticles, articleWordCount } = await import("../src/data/insights");
  const { articleExperiences } = await import("../src/data/insight-experiences");
  const { INSIGHT_SERIES, seriesByName, FOUNDATIONS_SERIES } = await import("../src/data/insight-series");
  const { INSIGHT_TERMS } = await import("../src/data/insight-terms");
  const { allPublications } = await import("../src/data/publications");
  const { gaitscapeNodes } = await import("../src/data/gaitscape/graph");
  const { INSIGHT_PIPELINE } = await import("../src/data/insight-pipeline");

  const root = join(__dirname, "..");
  const slugs = new Set<string>();
  const nodeIds = new Set(gaitscapeNodes.map((node) => node.id));
  const publicationIds = new Set(allPublications.map((publication) => publication.id));
  const FIGURE_KEYS = new Set([
    "video-to-intelligence",
    "one-frame-hold",
    "signal-quality",
    "motion-dna-branches",
    "privacy-transform",
    "privacy-pipeline",
    "longitudinal-trend",
    "fusion-experiment",
    "five-questions",
    "pose-error-explorer",
    "symmetry-explorer",
    "camera-angle-explorer",
    "identity-layers-explorer",
    "system-chain-explorer",
    "baseline-explorer",
  ]);
  const FAKE_METRIC = /\b\d{1,3}(\.\d+)?\s?%|\bAUC\b|\bF1\b|\bsensitivity of\b|\bspecificity of\b|\baccuracy of \d/i;

  for (const article of insightArticles) {
    const where = `article "${article.slug}"`;
    assert.match(article.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${where}: slug is URL-safe`);
    assert.ok(!slugs.has(article.slug), `${where}: slug is unique`);
    slugs.add(article.slug);

    const seriesName = article.series ?? FOUNDATIONS_SERIES;
    assert.ok(seriesByName(seriesName), `${where}: series "${seriesName}" is registered`);

    assert.ok(article.title.includes(article.titleAccent), `${where}: titleAccent is part of the title`);
    assert.ok(article.sections.length >= 3, `${where}: has at least three sections`);
    const sectionIds = new Set(article.sections.map((section) => section.id));
    assert.equal(sectionIds.size, article.sections.length, `${where}: section ids are unique`);

    for (const related of article.related) {
      assert.ok(insightArticles.some((item) => item.slug === related), `${where}: related "${related}" exists`);
    }
    for (const signal of article.relatedSignals ?? []) {
      assert.ok(nodeIds.has(signal), `${where}: relatedSignal "${signal}" is a GaitScape node`);
    }
    assert.ok(existsSync(join(root, "public", article.hero.src)), `${where}: social card exists at ${article.hero.src}`);

    /* The Foundations were written before this rule; the recurring series
       are held to long-form length. */
    const words = articleWordCount(article);
    const minimum = seriesName === FOUNDATIONS_SERIES ? 600 : 900;
    assert.ok(words >= minimum, `${where}: has at least ${minimum} words (has ${words})`);

    const text = JSON.stringify(article);
    const metric = text.match(FAKE_METRIC);
    assert.ok(!metric, `${where}: states no performance metric (found "${metric?.[0]}")`);

    if (seriesName !== FOUNDATIONS_SERIES) {
      assert.ok(
        article.memorableInteraction && article.memorableInteraction.length > 10,
        `${where}: a major story names the interaction a reader will remember, or says it is editorial`,
      );
      assert.ok(article.evidenceLevel, `${where}: states its evidence level`);
    }
  }

  /* Positions within a series are unique. */
  for (const series of INSIGHT_SERIES) {
    const orders = insightArticles
      .filter((article) => (article.series ?? FOUNDATIONS_SERIES) === series.name)
      .map((article) => article.seriesOrder ?? article.seriesStep);
    assert.equal(new Set(orders).size, orders.length, `series "${series.name}": positions are unique (${orders.join(",")})`);
  }

  /* Experiences. */
  for (const [slug, experience] of Object.entries(articleExperiences)) {
    const where = `experience "${slug}"`;
    const article = insightArticles.find((item) => item.slug === slug);
    assert.ok(article, `${where}: article exists`);
    assert.equal(experience.slug, slug, `${where}: slug matches its key`);
    assert.ok(FIGURE_KEYS.has(experience.hero), `${where}: hero "${experience.hero}" is a registered figure`);
    const sectionIds = new Set(article!.sections.map((section) => section.id));
    for (const sectionId of Object.keys(experience.figures)) {
      assert.ok(sectionIds.has(sectionId), `${where}: figures placed in a real section "${sectionId}"`);
      for (const key of experience.figures[sectionId] ?? []) assert.ok(FIGURE_KEYS.has(key), `${where}: figure "${key}" is registered`);
    }
    for (const [sectionId, terms] of Object.entries(experience.terms)) {
      assert.ok(sectionIds.has(sectionId), `${where}: terms placed in a real section "${sectionId}"`);
      for (const term of terms ?? []) assert.ok(INSIGHT_TERMS[term], `${where}: term "${term}" exists`);
    }
    assert.ok(experience.moments.length >= 4, `${where}: the Visual Story has at least four moments`);
    for (const moment of experience.moments) assert.ok(FIGURE_KEYS.has(moment.figure), `${where}: moment "${moment.id}" uses a registered figure`);
    for (const link of experience.links.evidence ?? []) {
      assert.ok(publicationIds.has(link.publication), `${where}: evidence "${link.publication}" is a real publication`);
      assert.ok(link.why.length > 20, `${where}: evidence "${link.publication}" says why`);
    }
    for (const door of experience.links.gaitscape ?? []) {
      assert.ok(nodeIds.has(door.node), `${where}: GaitScape door "${door.node}" is a real node`);
    }
  }

  /* Pipeline entries are intentions only: none may share a slug-like title with a published story. */
  for (const entry of INSIGHT_PIPELINE) {
    assert.ok(INSIGHT_SERIES.some((series) => series.id === entry.series), `pipeline "${entry.title}": series is registered`);
    assert.ok(!insightArticles.some((article) => article.title === entry.title), `pipeline "${entry.title}": not also published`);
  }

  console.log(`Insight content checks passed — ${insightArticles.length} articles, ${Object.keys(articleExperiences).length} experiences, ${INSIGHT_PIPELINE.length} pipeline entries.`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
