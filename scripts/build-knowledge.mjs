#!/usr/bin/env node
/**
 * ASK GAITAI — KNOWLEDGE INDEX BUILDER
 * =============================================================================
 * Turns the site's own typed data modules into one flat, retrievable corpus for
 * the Ask GaitAI assistant, and writes it to `public/ask/knowledge.json`.
 *
 * THE RULE THIS SCRIPT EXISTS TO ENFORCE
 * The assistant answers from the SAME records the pages render. Nothing here
 * writes a product description, a research claim, a route or a capability by
 * hand — every field is read out of products.ts, product-details*.ts,
 * usecase-details.ts, publications.ts, evidence.ts, insights.ts,
 * gaitscape/graph.ts, trust.ts, taxonomy.ts and content.ts. Renaming a module
 * or correcting a paper's venue changes the assistant's answer with no edit
 * here, and the assistant can never assert something the site does not.
 *
 * WHY A BUILD STEP AND NOT A RUNTIME IMPORT
 * The data modules import `lucide-react` for their icons, so they cannot be
 * required from a plain Node serverless function. They are also TypeScript.
 * Resolving both at request time would mean shipping React to the backend and
 * paying the cost on every cold start. Instead this runs once, through tsx (the
 * same loader `validate:gaitai` uses), and emits plain JSON the function reads
 * from disk.
 *
 * PROSE PAGES
 * The four /legal routes and the Trust Center hold their content as JSX rather
 * than in a data module. Rather than keep a second hand-written copy of those
 * words — which would drift the first time either side was edited — the script
 * reads each page's own source and strips the markup, so the assistant quotes
 * the page a visitor would read.
 *
 *   npm run build:knowledge
 * =============================================================================
 */

import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
/**
 * The corpus ships to the BROWSER, because that is where retrieval now runs.
 *
 * `public/ask/knowledge.json` becomes a static asset in the export: one
 * cacheable file with its own lifetime, fetched when the assistant is first
 * opened and served from cache afterwards. It is deliberately NOT imported as
 * a module — 293 KB inlined into a JS chunk is 293 KB parsed as source and
 * re-downloaded whenever the bundle hash changes.
 *
 * Two copies, from one payload in one run:
 *   public/ask/knowledge.json   minified — what the browser fetches
 *   data/ask-knowledge.json     pretty   — what a human diffs in review
 */
const OUT = path.join(ROOT, "data", "ask-knowledge.json");
const WEB_OUT = path.join(ROOT, "public", "ask", "knowledge.json");

const load = async (rel) => {
  const abs = path.join(ROOT, "src", rel);
  if (!existsSync(abs)) throw new Error(`missing data module: src/${rel}`);
  return import(pathToFileURL(abs).href);
};

/** Route → absolute site path. Every URL in the corpus ends in a slash, which
 *  is what `trailingSlash: true` actually serves. */
const route = (p) => `${p}/`.replace(/\/{2,}$/, "/").replace(/\/+$/, "/");

const clean = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

/** Join the parts of a section, dropping empties, as one paragraph block. */
const para = (label, body) => {
  const text = Array.isArray(body) ? body.filter(Boolean).join(" · ") : body;
  return text ? `${label}: ${clean(text)}` : "";
};

const block = (...lines) => lines.filter(Boolean).join("\n");

// ---------------------------------------------------------------------------
// JSX PROSE EXTRACTION
// ---------------------------------------------------------------------------
/**
 * Pull the readable sentences out of a route's page component.
 *
 * Deliberately crude and deliberately lossy: it keeps text nodes and drops
 * every tag, attribute and embedded expression. That is the right trade for
 * retrieval material — the assistant needs the page's words, not its markup —
 * and it means the legal pages have exactly one copy of their text, in the
 * page that renders it.
 */
function prosePage(relPath) {
  const abs = path.join(ROOT, "src", relPath);
  if (!existsSync(abs)) return { title: "", description: "", text: "" };
  const source = readFileSync(abs, "utf8");

  const title = clean((source.match(/\btitle:\s*"((?:[^"\\]|\\.)*)"/) ?? [])[1] ?? "");
  const description = clean(
    (source.match(/\bdescription:\s*\n?\s*"((?:[^"\\]|\\.)*)"/) ?? [])[1] ?? "",
  );

  // Everything the component returns, markup removed. Start at the `return`
  // so the component signature is not mistaken for prose.
  const afterDefault = source.slice(source.indexOf("export default"));
  const returnAt = afterDefault.indexOf("return");
  const body = returnAt === -1 ? afterDefault : afterDefault.slice(returnAt + 6);
  const text = body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ") // JSX comments
    .replace(/\{[^{}]*\}/g, " ") // embedded expressions, incl. {" "}
    .replace(/<[^>]+>/g, " ") // tags with their attributes
    .replace(/&nbsp;/g, " ")
    .replace(/&apos;|&rsquo;|&#39;/g, "’")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/[{}]/g, " ")
    .replace(/^[\s(<>]+/, "")
    .replace(/[\s)<>;]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return { title, description, text };
}

// ---------------------------------------------------------------------------

async function main() {
  const products = await load("data/products.ts");
  const details = await load("data/product-details.ts");
  const secureDetails = await load("data/product-details-secure.ts");
  const useCases = await load("data/usecase-details.ts");
  const publications = await load("data/publications.ts");
  const evidence = await load("data/evidence.ts");
  const evidenceStatus = await load("data/evidence-status.ts");
  const insights = await load("data/insights.ts");
  const graph = await load("data/gaitscape/graph.ts");
  const trust = await load("data/trust.ts");
  const responsible = await load("data/responsible-use.ts");
  const taxonomy = await load("data/taxonomy.ts");
  const content = await load("data/content.ts");
  const facets = await load("data/usecase-facets.ts");
  const samples = await load("data/sample-outputs.ts");
  const experimentsMod = await load("data/experiments.ts");
  const labsMod = await load("data/labs.ts");
  const talks = await load("data/talks.ts");

  const docs = [];

  // ── ENTITIES ─────────────────────────────────────────────────────────────
  // The named things a visitor asks about BY NAME: the founder, the company,
  // each module. A record that is one of them carries `entityId` and
  // `aliases`; a record ABOUT one of them carries `relatedEntityIds`. The
  // person record is assembled below from publications.ts and talks.ts —
  // nothing biographical is written here, and the aliases are the name's own
  // parts plus the one role word the site uses for her ("founder").
  const slugify = (value) =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const FOUNDER = publications.FOUNDER_NAME;
  const FOUNDER_ID = slugify(FOUNDER);
  const COMPANY_ID = "gaitai";
  const authoredByFounder = (record) => record.authors.includes(FOUNDER);
  const founderRelated = (records) =>
    records.some(authoredByFounder) ? [FOUNDER_ID] : [];

  const detailBySlug = new Map(
    [...details.productDetails, ...secureDetails.secureProductDetails].map((d) => [
      d.slug,
      d,
    ]),
  );
  const productById = new Map(products.allProducts.map((p) => [p.id, p]));
  const useCaseDetailByCase = new Map(
    useCases.useCaseDetails.map((d) => [d.caseId, d]),
  );

  // ── PRODUCTS ─────────────────────────────────────────────────────────────
  // The 23 modules. Each doc carries the whole answerable surface of the
  // module page: what it takes in, what it emits, how it is deployed, what it
  // explicitly does not establish, and which research reaches it.
  /* Inverted from the canonical environment→product mix, once, so every
     product doc reads the same table the /use-cases pages and the stack
     configurator read. */
  const environmentsByProduct = new Map();
  for (const environment of products.industryUseCases) {
    for (const productId of environment.productIds) {
      const list = environmentsByProduct.get(productId) ?? [];
      list.push(environment.industry);
      environmentsByProduct.set(productId, list);
    }
  }
  const environmentsFor = (productId) =>
    environmentsByProduct.get(productId) ?? [];

  for (const product of products.allProducts) {
    const detail = detailBySlug.get(product.id);
    const chain = taxonomy.taxonomyChainFor(product.id);
    const status = evidenceStatus.evidenceStatusFor(product.id);
    const papersFor = evidence.publicationsForProduct(product.id);
    const sample = samples.sampleOutputFor(product.id);

    docs.push({
      id: `product:${product.id}`,
      type: "product",
      title: product.short,
      slug: product.id,
      url: route(`/${product.vertical}/${product.id}`),
      family: product.vertical,
      category: product.label,
      summary: product.description,
      content: block(
        para("Full name", product.name),
        para("What it is", product.label),
        para("Headline", product.headline),
        para("Description", product.description),
        detail && para("Overview", detail.overview),
        detail &&
          para(
            "At a glance",
            `input — ${detail.glance.input}; analysis — ${detail.glance.analysis}; output — ${detail.glance.output}; user — ${detail.glance.user}`,
          ),
        detail && para("Problem it addresses", detail.problem),
        detail && para("How it works", detail.solution),
        para("Who it is for", product.users),
        detail && para("What the user receives", detail.receives),
        para("Outputs", product.outputs),
        detail && para("Inputs accepted", detail.tech.inputs),
        /* The same primary/supporting split the configurator and the footage
           matcher use. Without it the assistant answered capture-source
           questions from the prose in tech.inputs while those surfaces
           answered from the derivation, so "can FallRisk use a wearable?"
           got yes here and a dropped module there. One table now. */
        para(
          "Primary capture sources",
          graph
            .sourcesForProduct(product.id)
            .map((id) => graph.CAPTURE_SOURCE_LABEL[id]),
        ),
        para(
          "Also documented as usable, where available",
          graph.supportingSourcesForProduct(product.id).length
            ? graph
                .supportingSourcesForProduct(product.id)
                .map((id) => graph.CAPTURE_SOURCE_LABEL[id])
            : "Nothing beyond the primary capture sources above.",
        ),
        detail && para("Processing pipeline", detail.tech.pipeline),
        detail && para("Movement features used", detail.tech.features),
        detail && para("Models", detail.tech.models),
        detail && para("Workflow", detail.workflow),
        detail && para("Deployment", detail.deployment),
        /* Canonical, from the environment records whose own product mix names
           this module — the hand-written `detail.environments` tags this used
           to read contradicted them for eleven of twenty-three modules and
           have been removed. See the note in product-details.ts. */
        para(
          "Documented deployment environments",
          environmentsFor(product.id).length
            ? environmentsFor(product.id)
            : "No environment record in the GaitAI catalogue lists this module in its documented product mix.",
        ),
        detail && para("Integration", detail.tech.integration),
        detail && para("Quality requirements", detail.tech.quality),
        detail && para("Documented limitations", detail.tech.limitations),
        detail && para("Interpretation of outputs", detail.interpretation),
        detail && para("Responsible use and privacy", detail.privacy),
        para("Movement signals sensed", chain.signals.map((s) => s.title)),
        para("AI capabilities used", chain.capabilities.map((c) => c.title)),
        para("Application domains served", chain.domains.map((d) => d.title)),
        para(
          "Published research reaching this module",
          papersFor.length
            ? papersFor.map((p) => `${p.title} (${p.venue}, ${p.year})`)
            : "No publication in the GaitAI record addresses this module specifically.",
        ),
        para(
          "Evidence status",
          status.rows.map(
            (r) => `${r.label} — ${evidenceStatus.EVIDENCE_STATE_LABEL[r.state]}`,
          ),
        ),
        sample &&
          para(
            "Illustrative sample output (example values, not a measured result)",
            sample.tabs.flatMap((t) => t.metrics?.map((m) => `${m.label} ${m.value}`) ?? []),
          ),
        para(
          "Maturity",
          product.status ??
            "Not stated. The GaitAI record documents no deployment, pilot or validation study establishing maturity for this module.",
        ),
      ),
      keywords: [
        product.short,
        product.name,
        product.label,
        ...product.users,
        ...product.outputs,
        ...environmentsFor(product.id),
        ...(detail ? detail.tech.inputs : []),
        /* PRIMARY sources only. Keywords are weighted 5x against content's
           1x, and a hedged secondary input is not what a module is ABOUT —
           adding WalkScan's "compatible CCTV where appropriate" here ranked
           it above every module whose primary input actually is a fixed
           camera, for the question "which products work with CCTV?".
           Supporting sources stay in the content, where they are findable
           without outranking the modules built for the job. */
        ...graph
          .sourcesForProduct(product.id)
          .map((id) => graph.CAPTURE_SOURCE_LABEL[id]),
        ...(detail ? [detail.glance.input, detail.glance.output] : []),
        ...chain.signals.map((s) => s.title),
        ...chain.capabilities.map((c) => c.title),
      ],
      relatedProducts: detail ? [...detail.related] : [],
      relatedResearch: papersFor.map((p) => p.id),
      /* A module is an entity: "what is fallrisk" names it exactly. */
      entityId: product.id,
      aliases: [product.short, product.name],
      tags: [product.vertical],
    });
  }

  // ── USE CASES / ENVIRONMENTS ─────────────────────────────────────────────
  // The canonical environment → product mapping. This is the record the
  // product finder reasons over; there is no second recommendation table.
  for (const entry of products.industryUseCases) {
    const detail = useCaseDetailByCase.get(entry.id);
    const modules = entry.productIds
      .map((id) => productById.get(id))
      .filter(Boolean);

    docs.push({
      id: `use-case:${entry.id}`,
      type: "use-case",
      title: entry.industry,
      slug: detail?.slug ?? entry.id,
      url: detail ? route(`/use-cases/${detail.slug}`) : `/use-cases/#${entry.id}`,
      family: entry.vertical,
      category: "Environment",
      summary: entry.problem,
      content: block(
        para("Environment", entry.industry),
        para("Problem", entry.problem),
        para("What this deployment produces", entry.outcome),
        para(
          "Recommended GaitAI modules",
          modules.map((m) => `${m.short} — ${m.label}`),
        ),
        detail && para("Value proposition", detail.valueProp),
        detail && para("Deployment overview", detail.overview),
        detail && para("Why current workflows fall short", detail.shortfall),
        detail && para("How the modules work together", detail.together),
        detail && para("Example workflow", detail.workflow),
        detail && para("Signals and outputs", detail.signals),
        detail && para("Deployment considerations", detail.deployment),
        detail && para("Responsible use and privacy", detail.privacy),
        para("Output chips", facets.outputChipsFor(entry.id)),
        para(
          "Facets",
          facets.facetsFor(entry.id).map((f) => f.label),
        ),
      ),
      keywords: [
        entry.industry,
        ...modules.flatMap((m) => [m.short, ...m.users]),
        ...(detail ? detail.signals : []),
        ...facets.outputChipsFor(entry.id),
        ...facets.facetsFor(entry.id).map((f) => f.label),
      ],
      relatedProducts: entry.productIds,
      relatedResearch: [],
    });
  }

  // ── PUBLICATIONS ─────────────────────────────────────────────────────────
  for (const record of publications.allPublications) {
    const areas = evidence.researchAreas.filter((a) =>
      a.publications.some((p) => p.id === record.id),
    );
    docs.push({
      id: `publication:${record.id}`,
      type: "publication",
      title: record.title,
      slug: record.id,
      url: route(`/publications/${record.id}`),
      family: "research",
      category: record.kind === "patent" ? "Granted patent" : "Peer-reviewed paper",
      summary: `${record.venue} · ${record.publisher} · ${record.year}`,
      content: block(
        para("Title", record.title),
        para("Type", record.kind === "patent" ? "Granted patent" : "Journal paper"),
        para("Venue", record.venue),
        para("Publisher", record.publisher),
        para("Year", String(record.year)),
        record.date && para("Date", record.date),
        para("Authors", record.authors),
        record.doi && para("DOI", record.doi),
        record.patentNumber && para("Patent number", record.patentNumber),
        record.applicationNumber && para("Application number", record.applicationNumber),
        record.filingDate && para("Filing date", record.filingDate),
        record.grantDate && para("Grant date", record.grantDate),
        record.jurisdiction && para("Jurisdiction", record.jurisdiction),
        record.validityYears && para("Validity", `${record.validityYears} years`),
        record.abstract && para("Abstract", record.abstract),
        record.keywords && para("Keywords", record.keywords),
        para(
          "Research areas it grounds",
          areas.map((a) => a.title),
        ),
        para(
          "Modules reached through those areas",
          areas.flatMap((a) => a.directProducts.map((p) => p.short)),
        ),
        "Note: a publication grounds a capability. It is not, by itself, a product-specific clinical or operational validation of any GaitAI module.",
      ),
      keywords: [
        record.title,
        record.venue,
        record.publisher,
        String(record.year),
        record.kind,
        ...(record.keywords ?? []),
        ...record.authors,
        ...(record.patentNumber ? [record.patentNumber, `patent ${record.patentNumber}`] : []),
      ],
      relatedProducts: areas.flatMap((a) => a.directProducts.map((p) => p.id)),
      relatedResearch: areas.map((a) => a.id),
      /* person → publications, without a second copy of the biography. */
      relatedEntityIds: founderRelated([record]),
    });
  }

  // ── RESEARCH AREAS ───────────────────────────────────────────────────────
  for (const area of evidence.researchAreas) {
    docs.push({
      id: `research:${area.id}`,
      type: "research",
      title: area.title,
      slug: area.id,
      url: `/research/evidence/?area=${area.id}`,
      family: "research",
      category: "Research area",
      summary: area.summary,
      content: block(
        para("Research area", area.title),
        para("Summary", area.summary),
        para(
          "Publications in this area",
          area.publications.map((p) => `${p.title} (${p.venue}, ${p.year})`),
        ),
        para(
          "Capabilities it grounds",
          area.capabilities.map((c) => `${c.title} — ${c.description}`),
        ),
        para(
          "Modules directly informed",
          area.directProducts.map((p) => `${p.short} (${p.label})`),
        ),
        para(
          "Modules related only architecturally (the research does not address them specifically and must not be read as validating them)",
          area.architecturalProducts.map((p) => p.short),
        ),
        area.boundary &&
          block(
            para(area.boundary.foundationLabel, area.boundary.foundation),
            para(area.boundary.controlsLabel, area.boundary.controls),
            para("Boundary", area.boundary.note),
          ),
      ),
      keywords: [
        area.title,
        ...area.capabilities.map((c) => c.title),
        ...area.publications.map((p) => p.title),
        ...area.directProducts.map((p) => p.short),
      ],
      relatedProducts: area.directProducts.map((p) => p.id),
      relatedResearch: area.publications.map((p) => p.id),
      relatedEntityIds: founderRelated(area.publications),
    });
  }

  // ── PEOPLE ───────────────────────────────────────────────────────────────
  // One canonical record per person the site names. Today that is the
  // founder, and every sentence below is lifted from a page a visitor can
  // read: the Publications page (authorship, publishers, the founder-vs-
  // company distinction), the Research page, the home page's "10+ years of
  // founder research" line, and talks.ts (the speaking record and whose it
  // is). Anything the site does not say — degrees, employers, dates, awards —
  // is stated as NOT documented, so the assistant has that in its context too.
  {
    const authored = publications.allPublications.filter(authoredByFounder);
    const authoredPapers = authored.filter((p) => p.kind !== "patent");
    const authoredPatents = authored.filter((p) => p.kind === "patent");
    const publishers = [...new Set(authoredPapers.map((p) => p.publisher))];
    const areasGrounded = evidence.researchAreas.filter((a) =>
      a.publications.some(authoredByFounder),
    );
    const publicationsPage = prosePage("app/publications/page.tsx");
    const speaker = talks.TALKS_SPEAKER === FOUNDER;
    const [firstName, ...restName] = FOUNDER.split(/\s+/);
    const lastName = restName[restName.length - 1] ?? "";
    const patentLine = authoredPatents
      .map(
        (p) =>
          `a granted Indian patent${p.patentNumber ? ` (Patent ${p.patentNumber})` : ""}`,
      )
      .join(" and ");

    docs.push({
      id: `person:${FOUNDER_ID}`,
      type: "person",
      title: FOUNDER,
      slug: FOUNDER_ID,
      url: route("/publications"),
      family: "research",
      category: "Founder",
      summary: clean(
        `${FOUNDER} is the founder of GaitAI. The research record the platform is built on — ${authoredPapers.length} peer-reviewed papers${patentLine ? ` and ${patentLine}` : ""} — was authored by ${FOUNDER} with academic co-authors, across gait recognition, computer vision, biometrics, pose estimation, machine learning and privacy-preserving movement analysis.`,
      ),
      content: block(
        para("Name", FOUNDER),
        para(
          "Role in the GaitAI record",
          `Founder of GaitAI. The site describes GaitAI as founder-led research that became a platform, built on 10+ years of founder research experience in gait and human movement.`,
        ),
        para(
          "Research record",
          `${authoredPapers.length} peer-reviewed papers${patentLine ? ` and ${patentLine}` : ""}, authored with academic co-authors and published with ${publishers.join(", ")}.`,
        ),
        publicationsPage.description &&
          para("How the Publications page describes it", publicationsPage.description),
        para(
          "Provenance",
          "These are academic and individually held records rather than company-produced output. GaitAI does not currently hold company-assigned publications or patents of its own; the product modules are subsequent platform implementations.",
        ),
        para(
          "Publications authored",
          authored.map((p) => `${p.title} (${p.venue}, ${p.year})`),
        ),
        para(
          "Research areas this work grounds",
          areasGrounded.map((a) => a.title),
        ),
        speaker &&
          para(
            "Speaking record",
            `${talks.talkRecords.length} documented appearances listed at ${route("/research/talks")} — ${talks.talkCounts.invitedTalks} invited talks, ${talks.talkCounts.presentations} conference presentations, ${talks.talkCounts.paperPresentations} paper presentations and ${talks.talkCounts.posters} poster${talks.talkCounts.posters === 1 ? "" : "s"} — delivered in an academic and personal research capacity. They are not GaitAI company appearances.`,
          ),
        para(
          "Not documented in the GaitAI record",
          "Academic degrees, job history, institutional affiliations, awards, dates of employment, and any role other than founder and author. None of these may be stated or implied.",
        ),
      ),
      keywords: [
        FOUNDER,
        firstName,
        lastName,
        "founder",
        "gaitai founder",
        "who founded gaitai",
        "author",
        "research record",
        "publications",
        "patent",
        ...(speaker ? ["talks", "speaker", "speaking record"] : []),
      ],
      relatedProducts: [],
      relatedResearch: [
        ...areasGrounded.map((a) => a.id),
        ...authored.map((p) => p.id),
      ],
      entityId: FOUNDER_ID,
      aliases: [
        FOUNDER,
        firstName,
        lastName,
        `dr ${FOUNDER}`,
        `dr. ${FOUNDER}`,
        "founder",
        "the founder",
        "gaitai founder",
        "founder of gaitai",
        "gaitai's founder",
      ],
      relatedEntityIds: [COMPANY_ID],
      tags: ["founder", "author", ...(speaker ? ["speaker"] : [])],
    });
  }

  // ── JOURNAL / INSIGHTS ───────────────────────────────────────────────────
  for (const article of insights.insightArticles) {
    docs.push({
      id: `insight:${article.slug}`,
      type: "insight",
      title: article.title,
      slug: article.slug,
      url: route(`/insights/${article.slug}`),
      family: "journal",
      category: article.category,
      summary: article.deck,
      content: block(
        para("Article", article.title),
        article.subtitle && para("Subtitle", article.subtitle),
        para("Standfirst", article.deck),
        para("Kind", insights.POST_TYPE_LABEL[article.postType]),
        para("Category", article.category),
        para("Topics", article.topics),
        para("Published", article.date),
        para("Reading time", `${insights.readingMinutes(article)} minutes`),
        para("The question it answers", article.question),
        para("Excerpt", article.excerpt),
        para("What the reader takes away", article.hooks),
        para("The two-minute version", article.twoMinute),
        para(
          "Sections",
          article.sections.map((s) => s.heading ?? s.title ?? "").filter(Boolean),
        ),
        para("Reading-path position", `Step ${article.seriesStep} — ${article.seriesTitle}`),
        para("Tags", article.tags),
      ),
      keywords: [
        article.title,
        article.deck,
        article.category,
        article.question,
        ...article.topics,
        ...article.tags,
        ...article.hooks,
      ],
      relatedProducts: [],
      relatedResearch: [],
    });
  }

  // ── CAPABILITIES AND MOVEMENT SIGNALS ────────────────────────────────────
  for (const node of graph.gaitscapeNodes) {
    if (node.type !== "capability" && node.type !== "signal") continue;
    const built = products.allProducts.filter((p) => {
      const map = graph.productMapFor(p.id);
      if (!map) return false;
      return node.type === "capability"
        ? map.capabilities.includes(node.id)
        : map.signals.includes(node.id);
    });
    docs.push({
      id: `capability:${node.id}`,
      type: node.type === "signal" ? "signal" : "capability",
      title: node.title,
      slug: node.id,
      url: `/gaitscape/?focus=${node.id}`,
      family: node.vertical ?? "platform",
      category: node.type === "signal" ? "Movement signal" : "AI capability",
      summary: node.shortDescription,
      content: block(
        para(node.type === "signal" ? "Movement signal" : "AI capability", node.title),
        para("Description", node.shortDescription),
        para(
          node.type === "signal" ? "Modules that sense it" : "Modules built on it",
          built.map((p) => `${p.short} (${p.vertical})`),
        ),
        node.tags && para("Tags", [...node.tags]),
      ),
      keywords: [node.title, node.shortDescription, ...(node.tags ?? [])],
      relatedProducts: built.map((p) => p.id),
      relatedResearch: [],
    });
  }

  // ── DEPLOYMENT FAQ ───────────────────────────────────────────────────────
  for (const [index, fact] of trust.deploymentFacts.entries()) {
    docs.push({
      id: `deployment-faq:${index}`,
      type: "deployment",
      title: fact.question,
      slug: `faq-${index}`,
      url: route("/trust"),
      family: "platform",
      category: "Deployment",
      summary: fact.answer,
      content: block(para("Question", fact.question), para("Answer", fact.answer)),
      keywords: [fact.question, fact.answer],
      relatedProducts: [],
      relatedResearch: [],
    });
  }

  docs.push({
    id: "deployment:process",
    type: "deployment",
    title: "How a GaitAI deployment starts",
    slug: "deployment",
    url: route("/trust"),
    family: "platform",
    category: "Deployment",
    summary:
      "The five steps from defining an environment to running a pilot, and how pilot scope is set.",
    content: block(
      para(
        "Deployment steps",
        trust.deploymentSteps.map((s) => `${s.title} — ${s.desc}`),
      ),
      para("Pilot scope", trust.PILOT_SCOPE),
      para("How to start", `${content.ctas.pilot.label} at ${route(content.ctas.pilot.href.replace(/\/#.*/, ""))}#contact`),
    ),
    keywords: [
      "deployment",
      "pilot",
      "rollout",
      "onboarding",
      "how to start",
      ...trust.deploymentSteps.map((s) => s.title),
    ],
    relatedProducts: [],
    relatedResearch: [],
  });

  // ── PRIVACY, SECURITY AND WHAT IS NOT CLAIMED ────────────────────────────
  docs.push({
    id: "policy:privacy-controls",
    type: "policy",
    title: "Privacy and security architecture",
    slug: "privacy-controls",
    url: route("/legal/security"),
    family: "platform",
    category: "Trust",
    summary:
      "What the GaitAI architecture is designed to support, control area by control area — stated as capability, not as a running deployment.",
    content: block(
      ...trust.privacyControls.map((c) => `${c.topic}: ${c.support} (source: ${c.source})`),
      "",
      para(
        "EXPLICITLY NOT CLAIMED anywhere in the GaitAI record",
        trust.notClaimed,
      ),
    ),
    keywords: [
      "privacy",
      "security",
      "encryption",
      "retention",
      "audit log",
      "consent",
      "role-based access",
      "face blur",
      "skeleton only",
      "anonymity",
      "certification",
      "compliance",
      "HIPAA",
      "GDPR",
      "SOC 2",
      "ISO 27001",
      ...trust.privacyControls.map((c) => c.topic),
      ...trust.notClaimed,
    ],
    relatedProducts: ["privacyguard"],
    relatedResearch: [],
  });

  docs.push({
    id: "policy:responsible-use",
    type: "policy",
    title: "Responsible use boundaries",
    slug: "responsible-use",
    url: route("/legal/responsible-ai"),
    family: "platform",
    category: "Trust",
    summary:
      "The clinical and security boundaries every GaitAI product page states verbatim.",
    content: block(
      para("Shared controls", responsible.RESPONSIBLE_USE_CONTROLS),
      para("MobilityCare boundary", responsible.RESPONSIBLE_USE_CARE),
      para("SecureVision boundary", responsible.RESPONSIBLE_USE_SECURE),
    ),
    keywords: [
      "responsible ai",
      "governance",
      "diagnosis",
      "decision support",
      "identity",
      "biometric",
      "lawful",
      "authorized",
      "watchlist",
      "surveillance",
      "ethics",
    ],
    relatedProducts: ["privacyguard", "watchlist", "reid", "accessmotion"],
    relatedResearch: [],
  });

  // ── PROSE ROUTES ─────────────────────────────────────────────────────────
  // Read from the pages themselves so there is one copy of these words.
  const proseRoutes = [
    ["/legal/privacy", "app/legal/privacy/page.tsx", "Privacy policy"],
    ["/legal/security", "app/legal/security/page.tsx", "Security"],
    ["/legal/responsible-ai", "app/legal/responsible-ai/page.tsx", "Responsible AI"],
    ["/legal/terms", "app/legal/terms/page.tsx", "Terms of use"],
    ["/trust", "app/trust/page.tsx", "Trust Center"],
  ];
  for (const [url, source, fallbackTitle] of proseRoutes) {
    const page = prosePage(source);
    if (!page.text) continue;
    docs.push({
      id: `page:${url}`,
      type: "page",
      title: page.title || fallbackTitle,
      slug: url.split("/").pop(),
      url: route(url),
      family: "platform",
      category: "Policy page",
      summary: page.description || page.text.slice(0, 220),
      content: page.text.slice(0, 6000),
      keywords: [page.title || fallbackTitle, page.description],
      relatedProducts: [],
      relatedResearch: [],
    });
  }

  // ── NAVIGATION / DESTINATION ROUTES ──────────────────────────────────────
  // Where things live. Derived from navLinks and the canonical counters, so a
  // renamed section renames itself here too.
  const nav = [
    {
      url: "/",
      title: "GaitAI",
      category: "Home",
      summary:
        "GaitAI is a research-led AI platform for movement intelligence, organised into two product families.",
      content: block(
        `GaitAI turns human movement into structured intelligence across ${products.productCount} modular products in two families: MobilityCare (${products.mobilityProducts.length} clinical, sports, wearable and rehab modules) and SecureVision (${products.secureProducts.length} privacy-aware security and safety modules).`,
        products.productProposition,
        para(
          "Platform counters",
          content.heroStats.map((s) => `${s.value} ${s.label}`),
        ),
        para(
          "How movement becomes intelligence",
          products.workflowStages.map((s) => `${s.title} — ${s.description ?? ""}`),
        ),
        para("Request a demo, a pilot or a research collaboration", "/#contact"),
      ),
      keywords: ["gaitai", "what is gaitai", "platform", "movement intelligence", "overview", "about"],
      /* The company is an entity too, and it points at its founder — so "who
         founded gaitai" resolves both and ranks the person. */
      entityId: COMPANY_ID,
      aliases: ["gaitai", "gait ai", "gait.ai", "gaitai.in", "the platform", "the company"],
      relatedEntityIds: [FOUNDER_ID],
    },
    {
      url: "/products",
      title: "All products",
      category: "Products",
      summary: `All ${products.productCount} GaitAI modules across both families.`,
      content: block(
        para(
          "MobilityCare modules",
          products.mobilityProducts.map((p) => `${p.short} — ${p.label}`),
        ),
        para(
          "SecureVision modules",
          products.secureProducts.map((p) => `${p.short} — ${p.label}`),
        ),
      ),
      keywords: ["products", "all products", "modules", "catalogue", "list"],
    },
    {
      url: "/mobilitycare",
      title: "MobilityCare",
      category: "Product family",
      summary: `Clinical, sports, wearable and rehab movement intelligence — ${products.mobilityProducts.length} modules.`,
      content: block(
        `MobilityCare is the GaitAI family for clinical, rehabilitation, sports and elderly-care movement intelligence. ${products.mobilityProducts.length} modules.`,
        para(
          "Modules",
          products.mobilityProducts.map((p) => `${p.short} — ${p.label}`),
        ),
        para("Boundary", responsible.RESPONSIBLE_USE_CARE),
      ),
      keywords: [
        "mobilitycare",
        "clinical",
        "healthcare",
        "rehab",
        "physiotherapy",
        "elderly",
        ...products.mobilityProducts.map((p) => p.short),
      ],
    },
    {
      url: "/securevision",
      title: "SecureVision",
      category: "Product family",
      summary: `Privacy-aware movement intelligence for security and safety — ${products.secureProducts.length} modules.`,
      content: block(
        `SecureVision is the GaitAI family for privacy-aware security, safety and operations movement intelligence, built around existing camera and CCTV feeds. ${products.secureProducts.length} modules.`,
        para(
          "Modules",
          products.secureProducts.map((p) => `${p.short} — ${p.label}`),
        ),
        para("Boundary", responsible.RESPONSIBLE_USE_SECURE),
      ),
      keywords: [
        "securevision",
        "security",
        "cctv",
        "camera",
        "surveillance",
        "safety",
        "privacy-aware",
        ...products.secureProducts.map((p) => p.short),
      ],
    },
    {
      url: "/use-cases",
      title: "Use cases",
      category: "Explore",
      summary: "Problems by environment, and the module mix each one calls for.",
      content: para(
        "Environments",
        products.industryUseCases.map((e) => `${e.industry} → ${e.productIds.join(", ")}`),
      ),
      keywords: [
        "use cases",
        "environments",
        "industries",
        "who is it for",
        ...products.industryUseCases.map((e) => e.industry),
      ],
    },
    {
      url: "/research",
      title: "Research",
      category: "Research & IP",
      summary: "The research areas and the published record behind them.",
      content: block(
        para(
          "Research areas",
          evidence.researchAreas.map((a) => `${a.title} — ${a.summary}`),
        ),
        para(
          "Research pillars",
          products.researchPillars.map((p) => p.title ?? p.name ?? ""),
        ),
      ),
      keywords: ["research", "evidence", "science", "papers", "foundation"],
      relatedEntityIds: [FOUNDER_ID],
    },
    {
      url: "/publications",
      title: "Publications",
      category: "Research & IP",
      summary: `${publications.papers.length} peer-reviewed papers and one granted patent.`,
      content: para(
        "Records",
        publications.allPublications.map((p) => `${p.title} (${p.venue}, ${p.year})`),
      ),
      keywords: ["publications", "papers", "patent", "journal", "citations", "where are your papers"],
      relatedEntityIds: founderRelated(publications.allPublications),
    },
    {
      url: "/insights",
      title: "The GaitAI Journal",
      category: "Journal",
      summary: "Long-form essays on movement intelligence. The route is /insights.",
      content: para(
        "Articles",
        insights.insightArticles.map((a) => `${a.title} — ${a.deck}`),
      ),
      keywords: ["journal", "insights", "articles", "blog", "essays", "reading"],
    },
    {
      url: "/gaitscape",
      title: "GaitScape",
      category: "Experience",
      summary: "The interactive human movement intelligence landscape.",
      content:
        "GaitScape is an interactive graph of the GaitAI ecosystem: movement signals, AI capabilities, products, application domains, research areas and outcomes, and the relationships between them.",
      keywords: ["gaitscape", "map", "graph", "landscape", "ecosystem", "explore", "capability matrix"],
    },
    {
      url: "/movement-lab",
      title: "Movement Intelligence Lab",
      category: "Experience",
      summary:
        "Interactive movement-analysis experiments: analyze a clip in your browser, watch the pipeline run stage by stage, and explore the experiments listed at the foot of the page. Previously named the Movement Studio.",
      content: block(
        "The Movement Intelligence Lab is the interactive lab for understanding and experimenting with GaitAI movement analysis. A real pose model runs in the browser on a clip the reader chooses or records; the staged walkthrough then shows movement capture becoming reportable intelligence: pose estimation, gait cycle segmentation, feature extraction, analytics and report generation for MobilityCare; trajectories, density and flow, candidate events and the operator view for SecureVision. The walkthrough is an illustrative demo with example values, not a measured result.",
        /* The experiments are listed at the foot of the page under "Explore
           the Movement Intelligence Lab". They used to be listed on /labs;
           they are derived from data/experiments.ts, the record that section
           renders, so a new experiment enters the corpus with the commit that
           makes it work. */
        experimentsMod.EXPERIMENTS_BLURB,
        experimentsMod.EXPERIMENTS_BOUNDARY,
        para(
          "Experiments listed on this page (Explore the Movement Intelligence Lab)",
          experimentsMod.experiments.map(
            (lab) =>
              `${lab.name} — ${lab.strap}. ${lab.body} Basis: ${
                experimentsMod.LAB_BASIS_LABEL[lab.basis]
              }.${lab.home ? ` ${lab.home}.` : ""}`,
          ),
        ),
        "The interactive experiments are not GaitAI Labs. GaitAI Labs (/labs) is the gait research hub: the Gait Dataset and the Gait Biometrics Lab.",
      ),
      keywords: [
        "movement intelligence lab",
        "movement lab",
        "movement studio",
        "movement intelligence",
        "demo",
        "try",
        "pipeline",
        "pose estimation",
        "stages",
        "how does it work",
        "experiments",
        "experimental",
        "explore the lab",
        ...experimentsMod.experiments.flatMap((lab) => [lab.name, lab.strap]),
      ],
    },
    {
      /* GAITAI LABS — the gait research hub.
         This route used to list the interactive experiments; those now live
         at the foot of /movement-lab and are indexed there. /labs is the home
         of the gait RESEARCH assets — the Gait Dataset and the Gait
         Biometrics Lab — derived from data/labs.ts, the record the page
         renders. The record states no dataset figure and no recognition
         result, so neither does the corpus: an assistant asked for the
         dataset's size must answer that it is not yet published. */
      url: "/labs",
      title: "GaitAI Labs",
      category: "Research",
      summary:
        "GaitAI's gait research assets: the Gait Dataset and the Gait Biometrics Lab. Research infrastructure for gait intelligence.",
      content: block(
        labsMod.GAIT_LABS_BLURB,
        labsMod.GAIT_LABS_BOUNDARY,
        para(
          "The research assets",
          labsMod.gaitLabs.map(
            (lab) =>
              `${lab.name} (${lab.href}) — ${lab.strap}. ${lab.body} Status: ${
                labsMod.GAIT_LAB_STATUS_LABEL[lab.status]
              }.`,
          ),
        ),
        "GaitAI Labs is not the Movement Intelligence Lab. The interactive experiments — Signal Inspector, Footage Check, Movement X-Ray, Privacy Lens, Fusion Sandbox, Mobility Time Machine and the GaitAI Atlas — are in the Movement Intelligence Lab at /movement-lab, listed after the analyzer.",
      ),
      keywords: [
        "labs",
        "gaitai labs",
        "gait research",
        "research infrastructure",
        "gait dataset",
        "dataset",
        "gait biometrics",
        "biometrics lab",
        "biometrics",
        ...labsMod.gaitLabs.flatMap((lab) => [lab.name, lab.strap]),
      ],
    },
    /* Each research asset at its own address, from the same record. */
    ...labsMod.gaitLabs.map((lab) => ({
      url: lab.href.replace(/\/$/, ""),
      title: lab.name,
      category: "Research",
      summary: `${lab.strap}. ${labsMod.GAIT_LAB_STATUS_LABEL[lab.status]}.`,
      content: block(
        lab.body,
        para(
          lab.id === "dataset"
            ? "Fields the dataset card documents, each published only with a citable value"
            : "Modules, in pipeline order",
          lab.facets,
        ),
        labsMod.GAIT_LABS_BOUNDARY,
        lab.id === "dataset"
          ? "No dataset statistic — subjects, sessions, views, sensors, conditions, availability — has been published yet, so none can be stated."
          : "No recognition runs on this page and no accuracy is stated. The analyzer in the Movement Intelligence Lab derives Motion DNA channels from a clip today; signature, covariate and matching modules follow.",
        `Part of GaitAI Labs (/labs), grounded in ${lab.publicationIds.length} published papers.`,
      ),
      keywords: [
        "gaitai labs",
        "gait research",
        lab.name,
        lab.strap,
        ...lab.facets,
      ],
    })),
    {
      url: "/research/talks",
      title: "Talks and presentations",
      category: "Research",
      summary:
        "The speaking record: conference talks, presentations and posters.",
      content: block(
        `The talks route carries GaitAI's speaking record — ${talks.talksNewestFirst.length} presentations, posters and conference talks, each with its venue and year.`,
        para(
          "Most recent",
          talks.talksNewestFirst
            .slice(0, 8)
            .map((talk) => `${talk.title} — ${talk.venue}, ${talk.year}`),
        ),
      ),
      keywords: [
        "talks",
        "presentations",
        "conference",
        "poster",
        "speaking",
        "keynote",
      ],
      relatedEntityIds: talks.TALKS_SPEAKER === FOUNDER ? [FOUNDER_ID] : [],
    },
    {
      url: "/insights/start-here",
      title: "Start here — the blog reading path",
      category: "Editorial",
      summary:
        "An ordered path through the GaitAI blog for a reader arriving for the first time.",
      content:
        "The start-here route orders the GaitAI blog into a reading path, so a first-time reader is not left to pick between articles written months apart. It is a route into the editorial record, not a separate set of claims.",
      keywords: [
        "start here",
        "where to start",
        "reading path",
        "first time",
        "introduction",
      ],
    },
    {
      url: "/insights/archive",
      title: "Blog archive",
      category: "Editorial",
      summary: "Every published GaitAI article, by date.",
      content:
        "The archive route lists every published GaitAI article in date order, including those no longer surfaced on the blog index.",
      keywords: ["archive", "all articles", "every post", "back issues"],
    },
    {
      url: "/investors",
      title: "Investors",
      category: "Company",
      summary: "Investor enquiries.",
      content: "The investor route carries GaitAI's investment enquiry path.",
      keywords: ["investors", "investment", "funding"],
    },
    {
      url: "/#contact",
      title: "Contact, demo and pilot requests",
      category: "Contact",
      summary: "The single contact form for demo, pilot, research and investor enquiries.",
      content: block(
        para(
          "Calls to action",
          Object.values(content.ctas).map((c) => `${c.label} → ${c.href}`),
        ),
        "All four routes lead to the contact form at /#contact.",
      ),
      keywords: ["demo", "contact", "request a demo", "book", "trial", "get in touch", "pilot", "talk to"],
    },
  ];

  for (const page of nav) {
    docs.push({
      id: `page:${page.url}`,
      type: "page",
      title: page.title,
      slug: page.url.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home",
      url: page.url === "/#contact" ? "/#contact" : route(page.url),
      family: "platform",
      category: page.category,
      summary: page.summary,
      content: page.content,
      keywords: page.keywords,
      relatedProducts: [],
      relatedResearch: [],
      ...(page.entityId ? { entityId: page.entityId } : {}),
      ...(page.aliases ? { aliases: page.aliases } : {}),
      ...(page.relatedEntityIds?.length ? { relatedEntityIds: page.relatedEntityIds } : {}),
    });
  }

  // ── NORMALISE ────────────────────────────────────────────────────────────
  const dedupe = (values) =>
    Array.from(
      new Set(
        values
          .filter(Boolean)
          .map((k) => clean(k).toLowerCase())
          .filter((k) => k.length > 1),
      ),
    );
  for (const doc of docs) {
    doc.content = clean(doc.content.replace(/\n/g, "\n")).length
      ? doc.content.split("\n").map(clean).filter(Boolean).join("\n")
      : "";
    doc.summary = clean(doc.summary);
    doc.keywords = dedupe(doc.keywords);
    /* Entity fields are optional and only serialised where they carry
       something, so the 100-odd records without them do not grow. */
    if (doc.aliases) doc.aliases = dedupe(doc.aliases);
    if (doc.tags) doc.tags = dedupe(doc.tags);
    if (doc.relatedEntityIds && doc.relatedEntityIds.length === 0) {
      delete doc.relatedEntityIds;
    }
  }

  const entityIds = new Set(docs.filter((d) => d.entityId).map((d) => d.entityId));
  for (const doc of docs) {
    for (const ref of doc.relatedEntityIds ?? []) {
      if (!entityIds.has(ref)) {
        throw new Error(`${doc.id} points at unknown entity "${ref}"`);
      }
    }
  }

  const ids = new Set();
  for (const doc of docs) {
    if (ids.has(doc.id)) throw new Error(`duplicate knowledge id: ${doc.id}`);
    ids.add(doc.id);
  }

  const payload = {
    generatedAt: new Date().toISOString().slice(0, 10),
    counts: docs.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] ?? 0) + 1;
      return acc;
    }, {}),
    /** Environment → module mapping, lifted verbatim so the backend's product
     *  finder reuses the canonical table instead of inventing a second one. */
    environmentMap: products.industryUseCases.map((e) => ({
      id: e.id,
      industry: e.industry,
      vertical: e.vertical,
      productIds: e.productIds,
      url: useCaseDetailByCase.get(e.id)
        ? route(`/use-cases/${useCaseDetailByCase.get(e.id).slug}`)
        : `/use-cases/#${e.id}`,
    })),
    /** Every route the assistant is allowed to link to. Any URL the model
     *  produces that is not in this set is dropped before it reaches a reader. */
    routes: Array.from(
      new Set([
        /* "/#contact" splits to an empty path — it IS the home route. */
        ...docs.map((d) => d.url.split(/[?#]/)[0] || "/"),
        "/",
        "/products/",
        "/use-cases/",
        "/research/",
        "/research/evidence/",
        "/publications/",
        "/insights/",
        "/gaitscape/",
        "/movement-lab/",
        "/mobilitycare/",
        "/securevision/",
        "/trust/",
        "/investors/",
        "/legal/privacy/",
        "/legal/security/",
        "/legal/terms/",
        "/legal/responsible-ai/",
      ]),
    ).sort(),
    docs,
  };

  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  /* The browser copy: minified, because nobody reads it, and served as a
     static asset so it caches independently of any JS bundle hash. */
  mkdirSync(path.dirname(WEB_OUT), { recursive: true });
  writeFileSync(WEB_OUT, JSON.stringify(payload), "utf8");

  const bytes = Buffer.byteLength(JSON.stringify(payload));
  console.log(
    /* It has not written to functions/ since the cloud function was deleted;
       the log said otherwise, which sent anyone debugging the corpus to a
       gitignored stale artefact. */
    `Ask GaitAI knowledge index` +
      `
  -> ${WEB_OUT} (browser)` +
      `
  -> ${OUT} (review copy)
` +
      `  ${docs.length} documents, ${(bytes / 1024).toFixed(0)} KB\n` +
      Object.entries(payload.counts)
        .sort()
        .map(([type, n]) => `  ${String(n).padStart(3)}  ${type}`)
        .join("\n"),
  );
}

main().catch((error) => {
  console.error(`\nbuild-knowledge failed: ${error.message}\n`);
  process.exit(1);
});
