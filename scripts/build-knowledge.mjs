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
 * SEMANTIC CHUNKS
 * A long article or policy page is not one record. Each becomes a PARENT
 * record (the overview: title, standfirst, topics, section list) plus one
 * CHILD record per section — `insight:<slug>#<section-id>`,
 * `page:/legal/privacy#<heading-slug>` — carrying that section's own words,
 * its `sectionTitle`, a deep-link `url` and `parentId`. Ids are derived from
 * the section's own anchor or heading, so they are stable across builds and
 * retrieval can hand the model the paragraph that answers rather than the
 * first 1 500 characters of a 9 000-character essay. A section longer than
 * the per-record budget is split on paragraph boundaries into `…#id`,
 * `…#id-2`, ….
 *
 * PEOPLE
 * One record per person the public site names: the founder (from
 * publications.ts + talks.ts) and every co-author on the Publications page.
 * A co-author record states co-authorship and nothing else — no role, no
 * affiliation, no degree — because that is all the site documents.
 *
 * NEWSROOM POSTS
 * `data/posts.json` is the Firestore mirror `sync-posts.mjs` refreshes in the
 * same predev/prebuild hook that runs this script. Posts marked `verified`
 * render publicly under /publications/<slug>/ and are indexed here, chunked
 * by their markdown headings; drafts never enter the corpus.
 *
 *   npm run build:knowledge
 * =============================================================================
 */

import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, openSync, writeSync, closeSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/**
 * Per-record character budget for CHUNKED content. Mirrors PER_DOC_CHARS in
 * src/lib/ask/retrieval.ts (1 500) with headroom for the "Article:" and
 * "Section:" header lines, so a chunk reaches the model whole rather than
 * being cut mid-sentence by the prompt builder.
 */
const CHUNK_CHARS = 1400;

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Split a list of paragraphs into runs of at most `max` characters, never
 * breaking inside a paragraph. One paragraph longer than `max` stands alone
 * (the prompt builder will cap it) rather than being cut mid-sentence.
 */
function splitParagraphs(paragraphs, max = CHUNK_CHARS) {
  const parts = [];
  let current = [];
  let size = 0;
  for (const paragraph of paragraphs.map(clean).filter(Boolean)) {
    if (current.length && size + paragraph.length + 1 > max) {
      parts.push(current.join("\n"));
      current = [];
      size = 0;
    }
    current.push(paragraph);
    size += paragraph.length + 1;
  }
  if (current.length) parts.push(current.join("\n"));
  return parts;
}

/** The first sentence or two of a passage, for a chunk's summary line. */
function lead(text, max = 240) {
  const flat = clean(text);
  if (flat.length <= max) return flat;
  const window = flat.slice(0, max);
  const stop = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "));
  if (stop > max * 0.4) return window.slice(0, stop + 1);
  const space = window.lastIndexOf(" ");
  return `${window.slice(0, space > 0 ? space : max)}…`;
}

/**
 * Inline markdown the journal allows in its text — **bold** and
 * [label](/href) — and the light markdown a newsroom post body uses, folded
 * to plain words. Links keep their label; the route is carried by the record.
 */
const unmark = (text) =>
  String(text ?? "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "");
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
/** JSX → the words a visitor reads. */
const stripJsx = (markup) =>
  markup
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

function prosePage(relPath) {
  const abs = path.join(ROOT, "src", relPath);
  if (!existsSync(abs)) return { title: "", description: "", text: "", sections: [] };
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
  const text = stripJsx(body);

  /* SECTIONS, by the page's own <h2> headings. The heading text is the
     section title; everything up to the next <h2> is its body. A page with
     no <h2> yields no sections and stays one record. */
  const sections = [];
  const pieces = body.split(/<h2\b[^>]*>/);
  for (const piece of pieces.slice(1)) {
    const close = piece.indexOf("</h2>");
    if (close === -1) continue;
    const heading = stripJsx(piece.slice(0, close));
    const rest = stripJsx(piece.slice(close + 5));
    if (heading && rest) sections.push({ heading, text: rest });
  }

  return { title, description, text, sections };
}

// ---------------------------------------------------------------------------
// JOURNAL BLOCKS → TEXT
// ---------------------------------------------------------------------------
/**
 * The words in one InsightBlock (see data/insights.ts). Diagrams and drawn
 * figures keep their captions and labels — those are the only words they
 * have — and inline markdown is folded to plain text.
 */
function blockText(block) {
  switch (block.type) {
    case "lead":
    case "p":
    case "h3":
    case "quote":
    case "note":
    case "matters":
      return unmark(block.text);
    case "list":
      return block.items.map(unmark).join(" · ");
    case "callout":
      return `${unmark(block.title)}: ${unmark(block.text)}`;
    case "flow":
      return [block.steps.map(unmark).join(" → "), block.caption && unmark(block.caption)]
        .filter(Boolean)
        .join(" ");
    case "compare":
      return [
        block.caption && unmark(block.caption),
        ...block.columns.map(
          (column) => `${column.label} — ${unmark(column.title)}: ${column.points.map(unmark).join("; ")}`,
        ),
      ]
        .filter(Boolean)
        .join(" ");
    case "states":
      return [
        block.caption && unmark(block.caption),
        ...block.items.map((item) => `${item.label} ${item.name}: ${unmark(item.note)}`),
      ]
        .filter(Boolean)
        .join(" ");
    case "trend":
      return [block.caption && unmark(block.caption), block.points.join(" → ")]
        .filter(Boolean)
        .join(" ");
    case "gaitcycle":
      return block.caption ? unmark(block.caption) : "";
    default:
      return typeof block.text === "string" ? unmark(block.text) : "";
  }
}

const blocksText = (blocks) => (blocks ?? []).map(blockText).map(clean).filter(Boolean);

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
  const insightTopics = await load("data/insight-topics.ts");
  const comparisons = await load("data/comparisons.ts");
  const labDemo = await load("data/lab-demo.ts");
  const captureSources = await load("data/capture-sources.ts");

  const docs = [];

  // ── ENTITIES ─────────────────────────────────────────────────────────────
  // The named things a visitor asks about BY NAME: the founder, the company,
  // each module. A record that is one of them carries `entityId` and
  // `aliases`; a record ABOUT one of them carries `relatedEntityIds`. The
  // person record is assembled below from publications.ts and talks.ts —
  // nothing biographical is written here, and the aliases are the name's own
  // parts plus the one role word the site uses for her ("founder").
  const FOUNDER = publications.FOUNDER_NAME;
  const FOUNDER_ID = slugify(FOUNDER);
  const COMPANY_ID = "gaitai";
  const authoredByFounder = (record) => record.authors.includes(FOUNDER);
  const founderRelated = (records) =>
    records.some(authoredByFounder) ? [FOUNDER_ID] : [];
  /* Every person named on the Publications page gets a person record below,
     so a publication points at ALL its authors — the founder and each
     co-author — through `relatedEntityIds`. A name spelled two ways on the
     page ("Rajveer S. Shekhawat" / "Rajveer Singh Shekhawat") is one person:
     the entity id is built from the longest spelling that shares the first
     and last word, exactly as the co-author records below are. */
  const allAuthorNames = [...new Set(publications.allPublications.flatMap((p) => p.authors))];
  const personId = (name) => {
    const words = name.split(/\s+/);
    const key = `${words[0]} ${words[words.length - 1]}`.toLowerCase();
    const same = allAuthorNames.filter((other) => {
      const w = other.split(/\s+/);
      return `${w[0]} ${w[w.length - 1]}`.toLowerCase() === key;
    });
    const canonical = [...same].sort((a, b) => b.length - a.length)[0] ?? name;
    return slugify(canonical);
  };
  const authorEntities = (records) =>
    [...new Set(records.flatMap((record) => record.authors.map(personId)))];

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

    const parentId = `product:${product.id}`;
    const productUrl = route(`/${product.vertical}/${product.id}`);
    const familyName = product.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision";
    const primarySources = graph
      .sourcesForProduct(product.id)
      .map((id) => graph.CAPTURE_SOURCE_LABEL[id]);
    const supportingSources = graph
      .supportingSourcesForProduct(product.id)
      .map((id) => graph.CAPTURE_SOURCE_LABEL[id]);

    /* The record's sections, as named blocks, so the parent and its three
       facet chunks are composed from ONE set of lines and cannot disagree. */
    const identity = block(
      para("Full name", product.name),
      para("Product family", familyName),
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
      /* What it takes in is identity, not detail: "which products work with
         CCTV" is answered by the modules whose own record says CCTV. */
      detail && para("Inputs accepted", detail.tech.inputs),
      para("Primary capture sources", primarySources),
    );
    const howItWorks = block(
      detail && para("Inputs accepted", detail.tech.inputs),
      /* The same primary/supporting split the configurator and the footage
         matcher use. Without it the assistant answered capture-source
         questions from the prose in tech.inputs while those surfaces
         answered from the derivation, so "can FallRisk use a wearable?"
         got yes here and a dropped module there. One table now. */
      para("Primary capture sources", primarySources),
      para(
        "Also documented as usable, where available",
        supportingSources.length
          ? supportingSources
          : "Nothing beyond the primary capture sources above.",
      ),
      detail && para("Processing pipeline", detail.tech.pipeline),
      detail && para("Movement features used", detail.tech.features),
      detail && para("Models", detail.tech.models),
      detail && para("Quality requirements", detail.tech.quality),
    );
    const deployment = block(
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
    );
    const maturity = para(
      "Maturity",
      product.status ??
        "Not stated. The GaitAI record documents no deployment, pilot or validation study establishing maturity for this module.",
    );
    const limitsAndPrivacy = block(
      detail && para("Documented limitations", detail.tech.limitations),
      detail && para("Interpretation of outputs", detail.interpretation),
      detail && para("Responsible use and privacy", detail.privacy),
    );
    const evidenceBlock = block(
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
      maturity,
    );

    const productTopics = [familyName, ...chain.domains.map((d) => d.title)];
    const shared = {
      slug: product.id,
      url: productUrl,
      family: product.vertical,
      category: product.label,
      relatedProducts: detail ? [...detail.related] : [],
      relatedResearch: papersFor.map((p) => p.id),
      tags: [product.vertical],
      topics: productTopics,
    };

    /* THE PARENT: what the module is. Carries the entity and the retrieval
       keywords, so a question that names the module lands here first. */
    docs.push({
      id: parentId,
      type: "product",
      title: product.short,
      ...shared,
      summary: product.description,
      content: block(
        identity,
        maturity,
        para(
          "Further sections of this module's record",
          ["How it works and what it needs", "Deployment and integration", "Limits, interpretation and privacy", "Signals, capabilities, research and evidence"],
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
        ...primarySources,
        ...(detail ? [detail.glance.input, detail.glance.output] : []),
        ...chain.signals.map((s) => s.title),
        ...chain.capabilities.map((c) => c.title),
      ],
      /* A module is an entity: "what is fallrisk" names it exactly. */
      entityId: product.id,
      aliases: [product.short, product.name],
    });

    /* THE FACET CHUNKS: the rest of the module page, in three sections a
       question actually asks for. No entity id — the parent is the module;
       these are about it — and a per-parent cap in retrieval keeps one
       module from filling every slot. */
    const facetChunks = [
      {
        anchor: "how-it-works",
        title: "How it works and what it needs",
        content: howItWorks,
        /* PRIMARY sources only, for the same reason as the parent's keywords:
           a hedged secondary input ("compatible CCTV where appropriate") is
           in the content, findable, and must not rank WalkScan above the
           modules built for a fixed camera. */
        keywords: [
          "how does it work", "pipeline", "inputs", "input data", "models", "features", "capture", "quality",
          ...(detail ? detail.tech.inputs : []),
          ...primarySources,
        ],
      },
      {
        anchor: "deployment",
        title: "Deployment and integration",
        content: deployment,
        keywords: ["deployment", "deploy", "integration", "integrate", "workflow", "environments", "where is it used", "api", "rollout", ...environmentsFor(product.id)],
      },
      {
        anchor: "limits-and-privacy",
        title: "Limits, interpretation and privacy",
        content: limitsAndPrivacy,
        keywords: ["limitations", "limits", "interpretation", "interpret", "privacy", "responsible use", "consent", "anonymisation", "does not diagnose", "decision support"],
      },
      {
        anchor: "evidence",
        title: "Signals, capabilities, research and evidence",
        content: evidenceBlock,
        keywords: ["evidence", "validation", "validated", "accuracy", "research", "papers", "maturity", "signals", "capabilities", "sample output", ...chain.signals.map((s) => s.title), ...chain.capabilities.map((c) => c.title)],
      },
    ];
    for (const facet of facetChunks) {
      if (!facet.content) continue;
      docs.push({
        id: `${parentId}#${facet.anchor}`,
        type: "product",
        title: product.short,
        sectionTitle: facet.title,
        ...shared,
        summary: `${product.short} — ${facet.title.toLowerCase()}. ${product.description}`,
        content: block(
          para("Module", `${product.short} (${product.name}) — ${product.label}`),
          para("Section", facet.title),
          facet.content,
        ),
        keywords: [product.short, product.name, facet.title, ...facet.keywords],
        parentId,
      });
    }
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
        /* The workflow, signals, deployment considerations and responsible-use
           text are the environment's second chunk (below), not repeated here. */
        detail && para("Further sections of this environment's record", ["Deployment, signals and responsible use"]),
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
      topics: [entry.industry, entry.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision"],
    });

    /* The second half of the environment page — how a deployment runs and
       what it must not do — as its own chunk, so the parent's first 1 500
       characters (problem, outcome, modules, value) are not all the model
       ever sees of it. */
    if (detail) {
      docs.push({
        id: `use-case:${entry.id}#deployment`,
        type: "use-case",
        title: entry.industry,
        sectionTitle: "Deployment, signals and responsible use",
        slug: detail.slug,
        url: route(`/use-cases/${detail.slug}`),
        family: entry.vertical,
        category: "Environment",
        summary: `${entry.industry} — how the deployment runs, what it produces and its responsible-use boundary.`,
        content: block(
          para("Environment", entry.industry),
          para("Section", "Deployment, signals and responsible use"),
          para("How the modules work together", detail.together),
          para("Example workflow", detail.workflow),
          para("Signals and outputs", detail.signals),
          para("Deployment considerations", detail.deployment),
          para("Responsible use and privacy", detail.privacy),
        ),
        keywords: [entry.industry, "deployment", "workflow", "signals", "outputs", "responsible use", "privacy", ...detail.signals],
        relatedProducts: entry.productIds,
        relatedResearch: [],
        parentId: `use-case:${entry.id}`,
        topics: [entry.industry, entry.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision"],
      });
    }
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
      /* person → publications, without a second copy of the biography. Every
         author, so "which papers did Apoorva co-author" assembles the same
         way the founder's do. */
      relatedEntityIds: authorEntities([record]),
      topics: [...(record.keywords ?? []), ...areas.map((a) => a.title)],
      date: record.date ?? `${record.year}-01-01`,
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
      topics: ["gait research", ...area.capabilities.map((c) => c.title)],
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
        /* Last, because it is the longest line and each paper is also its own
           record: if a budget cuts this record, it cuts the list, not the
           facts above it. */
        para(
          "Publications authored",
          authored.map((p) => `${p.title} (${p.venue}, ${p.year})`),
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
      topics: ["gait research", "movement intelligence", ...areasGrounded.map((a) => a.title)],
    });
  }

  // ── CO-AUTHORS ───────────────────────────────────────────────────────────
  // Every other name on the Publications page. The site documents exactly one
  // fact about each: which records they co-authored, with whom. The record
  // says that, lists the papers, and states that nothing else — role,
  // affiliation, degree, employer — is documented, so the assistant can
  // answer "who is Apoorva" from the record instead of inferring from an
  // author list.
  {
    /* One person, one record — even when the Publications page spells a name
       two ways ("Rajveer S. Shekhawat" / "Rajveer Singh Shekhawat"). Names
       sharing first and last word are one person; the longest spelling is
       the title and every spelling is an alias, so either finds the record.
       `authorEntities` above resolves each spelling the same way. */
    const spellings = new Map();
    for (const name of new Set(publications.allPublications.flatMap((p) => p.authors))) {
      if (name === FOUNDER) continue;
      const words = name.split(/\s+/);
      const key = `${words[0]} ${words[words.length - 1]}`.toLowerCase();
      spellings.set(key, [...(spellings.get(key) ?? []), name]);
    }

    for (const names of spellings.values()) {
      const name = [...names].sort((a, b) => b.length - a.length)[0];
      const id = personId(name);
      const authored = publications.allPublications.filter((p) =>
        p.authors.some((author) => names.includes(author)),
      );
      const papers = authored.filter((p) => p.kind !== "patent");
      const patents = authored.filter((p) => p.kind === "patent");
      const areasGrounded = evidence.researchAreas.filter((a) =>
        a.publications.some((p) => p.authors.includes(name)),
      );
      const publishers = [...new Set(authored.map((p) => p.publisher))];
      const [firstName, ...restName] = name.split(/\s+/);
      const lastName = restName[restName.length - 1] ?? "";
      const count = `${papers.length} peer-reviewed paper${papers.length === 1 ? "" : "s"}${
        patents.length ? ` and ${patents.length} granted patent${patents.length === 1 ? "" : "s"}` : ""
      }`;

      docs.push({
        id: `person:${id}`,
        type: "person",
        title: name,
        slug: id,
        url: route("/publications"),
        family: "research",
        category: "Co-author",
        summary: clean(
          `${name} is a co-author, with GaitAI founder ${FOUNDER}, of ${count} in the research record listed on the GaitAI Publications page — across ${areasGrounded.map((a) => a.title.toLowerCase()).join(", ") || "the published record"}.`,
        ),
        content: block(
          para("Name", name),
          para(
            "Role in the GaitAI record",
            `Co-author. ${name} appears as an author on ${authored.length} of the ${publications.allPublications.length} records on the GaitAI Publications page, each co-authored with ${FOUNDER}, the founder of GaitAI.`,
          ),
          para("Research record", `${count}, published with ${publishers.join(", ")}.`),
          names.length > 1 &&
            para("Also listed on the Publications page as", names.filter((n) => n !== name)),
          para(
            "Publications co-authored",
            authored.map((p) => `${p.title} (${p.venue}, ${p.year})`),
          ),
          para("Research areas this work grounds", areasGrounded.map((a) => a.title)),
          para(
            "Provenance",
            "These are academic and individually held records rather than company-produced output. Co-authorship of a paper is not a role at GaitAI.",
          ),
          para(
            "Not documented in the GaitAI record",
            `Any role at GaitAI, job title, employer, institutional affiliation, academic degree, dates, awards, or relationship to ${FOUNDER} beyond co-authorship. None of these may be stated or implied.`,
          ),
        ),
        keywords: [...names, firstName, lastName, "co-author", "coauthor", "author"],
        relatedProducts: [],
        relatedResearch: [...areasGrounded.map((a) => a.id), ...authored.map((p) => p.id)],
        entityId: id,
        aliases: [...names, firstName, lastName, `dr ${name}`, `dr. ${name}`],
        relatedEntityIds: [FOUNDER_ID],
        tags: ["co-author", "author"],
        topics: ["gait research", ...areasGrounded.map((a) => a.title)],
      });
    }
  }

  // ── TALKS ────────────────────────────────────────────────────────────────
  // One record per documented appearance, from talks.ts — the founder's
  // academic speaking record. Each carries the provenance line the page
  // carries: a personal research appearance, not a GaitAI company one.
  for (const talk of talks.talkRecords) {
    const area = talk.researchAreaId
      ? evidence.researchAreas.find((a) => a.id === talk.researchAreaId)
      : null;
    docs.push({
      id: `talk:${talk.id}`,
      type: "talk",
      title: talk.title,
      slug: talk.id,
      url: `/research/talks/#${talk.id}`,
      family: "research",
      category: talks.TALK_KIND_LABEL[talk.kind],
      summary: clean(
        `${talks.TALK_KIND_LABEL[talk.kind]} by ${talks.TALKS_SPEAKER}${talk.event ? ` at ${talk.event}` : ""}${talk.venue ? `, ${talk.venue}` : ""} (${talk.date ?? talk.year}).`,
      ),
      content: block(
        para("Title", talk.title),
        para("Kind", talks.TALK_KIND_LABEL[talk.kind]),
        para("Speaker", `${talks.TALKS_SPEAKER}, in an academic and personal research capacity. Not a GaitAI company appearance.`),
        para("Date", talk.date ?? String(talk.year)),
        talk.event && para("Event", talk.event),
        talk.venue && para("Venue", talk.venue),
        talk.description && para("Description", talk.description),
        area
          ? para("GaitAI research area this work belongs to", area.title)
          : "GaitAI research area: none — this appearance is part of the speaker's wider record, not GaitAI's research lineage.",
      ),
      keywords: [talk.title, talks.TALK_KIND_LABEL[talk.kind], talk.event, talk.venue, String(talk.year), "talk", "presentation"],
      relatedProducts: [],
      relatedResearch: area ? [area.id] : [],
      relatedEntityIds: talks.TALKS_SPEAKER === FOUNDER ? [FOUNDER_ID] : [],
      topics: area ? [area.title] : [],
      date: `${talk.year}-01-01`,
    });
  }

  // ── JOURNAL / INSIGHTS ───────────────────────────────────────────────────
  // A parent record per article (what it is, what it argues, its sections),
  // then one child record per section carrying the section's own words. The
  // child id is the section's anchor — the same `id` the on-page navigation
  // uses — so it is stable for as long as the section is.
  const topicLabel = (topic) => insightTopics.INSIGHT_TOPIC_CONFIG[topic]?.label ?? topic;
  for (const article of insights.insightArticles) {
    const parentId = `insight:${article.slug}`;
    const articleUrl = route(`/insights/${article.slug}`);
    const topicNames = article.topics.map(topicLabel);
    docs.push({
      id: parentId,
      type: "insight",
      title: article.title,
      slug: article.slug,
      url: articleUrl,
      family: "journal",
      category: article.category,
      summary: article.deck,
      content: block(
        para("Article", article.title),
        article.subtitle && para("Subtitle", article.subtitle),
        para("Standfirst", article.deck),
        para("Kind", insights.POST_TYPE_LABEL[article.postType]),
        para("Category", article.category),
        para("Topics", topicNames),
        para("Published", article.date),
        para("Author", article.author ?? insights.INSIGHTS_AUTHOR),
        para("Reading time", `${insights.readingMinutes(article)} minutes`),
        para("The question it answers", article.question),
        para("Excerpt", article.excerpt),
        para("Opening", blocksText(article.intro)),
        para("What the reader takes away", article.hooks),
        para("The two-minute version", article.twoMinute),
        para(
          "Sections",
          article.sections.map((s) => `${s.number} ${s.title}`),
        ),
        para("Reading-path position", `Step ${article.seriesStep} — ${article.seriesTitle}`),
        para("Tags", article.tags),
      ),
      keywords: [
        article.title,
        article.deck,
        article.category,
        article.question,
        "insights",
        "gaitai insights",
        "article",
        insights.POST_TYPE_LABEL[article.postType],
        ...article.topics,
        ...topicNames,
        ...article.tags,
        ...article.hooks,
      ],
      relatedProducts: [...(article.relatedProducts ?? [])],
      relatedResearch: [...(article.relatedResearch ?? [])],
      topics: topicNames,
      date: article.updated ?? article.date,
    });

    const sections = [
      ...article.sections.map((section) => ({
        id: section.id,
        title: section.title,
        number: section.number,
        navLabel: section.navLabel,
        paragraphs: blocksText(section.blocks),
      })),
      /* The closing blocks are the article's conclusion; they read as one
         more section under the article's own title. */
      ...(article.closing?.length
        ? [
            {
              id: "closing",
              title: "Closing",
              number: "",
              navLabel: "Closing",
              paragraphs: blocksText(article.closing),
            },
          ]
        : []),
    ];

    for (const section of sections) {
      const parts = splitParagraphs(section.paragraphs);
      parts.forEach((text, index) => {
        const suffix = index === 0 ? "" : `-${index + 1}`;
        docs.push({
          id: `${parentId}#${section.id}${suffix}`,
          type: "insight",
          title: article.title,
          sectionTitle: section.title,
          slug: article.slug,
          url: `${articleUrl}#${section.id}`,
          family: "journal",
          category: article.category,
          summary: lead(text),
          content: block(
            para("Article", article.title),
            para("Section", `${section.number ? `${section.number} ` : ""}${section.title}${parts.length > 1 ? ` (part ${index + 1} of ${parts.length})` : ""}`),
            text,
          ),
          keywords: [
            article.title,
            section.title,
            section.navLabel,
            ...article.topics,
            ...topicNames,
          ],
          relatedProducts: [...(article.relatedProducts ?? [])],
          relatedResearch: [...(article.relatedResearch ?? [])],
          parentId,
          topics: topicNames,
          date: article.updated ?? article.date,
        });
      });
    }
  }

  // ── NEWSROOM POSTS ───────────────────────────────────────────────────────
  // Firestore-managed posts, mirrored to data/posts.json by sync-posts.mjs in
  // the same prebuild hook. Only `verified` posts render publicly, at
  // /publications/<slug>/ (see lib/publication-store.ts), so only those are
  // indexed. The body is markdown; it is chunked by its own headings.
  {
    const postsFile = path.join(ROOT, "data", "posts.json");
    let posts = [];
    if (existsSync(postsFile)) {
      try {
        const parsed = JSON.parse(readFileSync(postsFile, "utf8"));
        posts = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.posts) ? parsed.posts : [];
      } catch {
        posts = [];
      }
    }
    const published = posts.filter(
      (post) => post && post.publicationStatus === "verified" && post.slug && post.title,
    );

    for (const post of published) {
      const parentId = `post:${post.slug}`;
      const postUrl = route(`/publications/${post.slug}`);
      const topicNames = (post.topics ?? []).map(topicLabel);
      /* Markdown → sections on `##`/`###` headings; the text before the first
         heading is the opening. */
      const sections = [];
      let current = { heading: "", paragraphs: [] };
      for (const raw of String(post.body ?? "").split(/\r?\n/)) {
        const heading = raw.match(/^\s*#{2,3}\s+(.+?)\s*$/);
        if (heading) {
          if (current.paragraphs.length) sections.push(current);
          current = { heading: unmark(heading[1]), paragraphs: [] };
          continue;
        }
        const line = clean(unmark(raw));
        if (line) current.paragraphs.push(line);
      }
      if (current.paragraphs.length) sections.push(current);

      docs.push({
        id: parentId,
        type: "insight",
        title: post.title,
        slug: post.slug,
        url: postUrl,
        family: "journal",
        category: post.category,
        summary: clean(post.summary || sections[0]?.paragraphs[0] || post.title),
        content: block(
          para("Post", post.title),
          para("Summary", post.summary),
          para("Category", post.category),
          para("Topics", topicNames),
          para("Published", String(post.publishedAt).slice(0, 10)),
          para("Author", post.author),
          para("Tags", post.tags),
          para("Sections", sections.map((s) => s.heading).filter(Boolean)),
        ),
        keywords: [post.title, post.summary, post.category, "insights", "post", ...(post.tags ?? []), ...topicNames],
        relatedProducts: [...(post.relatedProducts ?? [])],
        relatedResearch: [...(post.relatedResearch ?? [])],
        topics: topicNames,
        date: String(post.updatedAt ?? post.publishedAt).slice(0, 10),
      });

      sections.forEach((section, sectionIndex) => {
        const anchor = section.heading ? slugify(section.heading) : "opening";
        const parts = splitParagraphs(section.paragraphs);
        parts.forEach((text, index) => {
          const suffix = index === 0 ? "" : `-${index + 1}`;
          docs.push({
            id: `${parentId}#${anchor || `section-${sectionIndex + 1}`}${suffix}`,
            type: "insight",
            title: post.title,
            sectionTitle: section.heading || "Opening",
            slug: post.slug,
            url: postUrl,
            family: "journal",
            category: post.category,
            summary: lead(text),
            content: block(
              para("Post", post.title),
              para("Section", section.heading || "Opening"),
              text,
            ),
            keywords: [post.title, section.heading, ...(post.tags ?? [])],
            relatedProducts: [],
            relatedResearch: [],
            parentId,
            topics: topicNames,
            date: String(post.updatedAt ?? post.publishedAt).slice(0, 10),
          });
        });
      });
    }
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

  // ── HOW GAITAI WORKS, END TO END ─────────────────────────────────────────
  // One canonical record for "how does GaitAI work" / "explain the pipeline"
  // / "from video to insight". The architecture is described on the site in
  // pieces — the home page's workflow stages and movement story, the Try
  // GaitAI walkthrough, the Movement Intelligence Lab's staged pipelines, the
  // capture sources, GaitScape's capability and signal layers, the Trust
  // Center's deployment steps and the privacy controls — and a question about
  // the whole pipeline used to be answered by whichever use case shared the
  // most words. This record assembles ONLY those published statements, in
  // sequence, and states nothing they do not.
  {
    const stages = (relPath, nameKey, textKeys) => {
      const abs = path.join(ROOT, "src", relPath);
      if (!existsSync(abs)) return [];
      const source = readFileSync(abs, "utf8").replace(/\r\n/g, "\n");
      const field = (chunk, key) => chunk.match(new RegExp(`\\b${key}:\\s*"([^"]+)"`))?.[1] ?? "";
      const out = [];
      /* One object literal per stage: split on "{", read the named fields. */
      for (const chunk of source.split(/\{/)) {
        const name = field(chunk, nameKey);
        if (!name) continue;
        const text = textKeys.map((key) => field(chunk, key)).filter(Boolean).join(" ");
        out.push({ name, text });
      }
      return out;
    };
    const tryStages = stages("components/home/TryGaitAI.tsx", "name", ["insight", "note"]);
    /* The home page's "One movement. Many meanings." strip. It replaced the
       five-step movement story that used to be scraped from MovementStory.tsx:
       the pipeline narrative that told is still in this record twice over — the
       Try GaitAI walkthrough above and the two Lab pipelines below — and what
       the home page teaches now is what the SAME signal means depending on
       what is being asked of it. Read from the component that renders it, so
       a reading added there reaches Ask without a second list. */
    const meanings = stages("components/home/MotionDNAThread.tsx", "label", ["note", "reads"]);
    const capabilityTitles = graph.gaitscapeNodes.filter((n) => n.type === "capability").map((n) => n.title);
    const signalTitles = graph.gaitscapeNodes.filter((n) => n.type === "signal").map((n) => n.title);
    const engineStep = trust.deploymentSteps.find((step) => /movement-processing engine/i.test(step.desc));
    const skeletonControl = trust.privacyControls.find((c) => /non-identifying|skeleton/i.test(c.topic));
    const edgeControl = trust.privacyControls.find((c) => /processing location|edge/i.test(c.topic));
    docs.push({
      id: "platform:gaitai-end-to-end",
      type: "page",
      title: "How GaitAI works end to end",
      slug: "how-gaitai-works",
      /* The Lab's staged walkthrough is where the pipeline is shown running.
         The anchor also keeps this record distinct from page:/movement-lab,
         whose exact URL reserves the current-page slot on that route. */
      url: `${route("/movement-lab")}#walkthrough`,
      family: "platform",
      category: "Platform architecture",
      summary:
        "GaitAI works as a movement-intelligence pipeline: movement is captured from a video, camera or wearable signal, understood as pose and movement signals, measured as gait and movement features, interpreted by the relevant MobilityCare or SecureVision module, and returned as a report, dashboard or alert for a clinician or operator to review.",
      content: block(
        para(
          "The pipeline in four steps (as the home page states it)",
          products.workflowStages.map((s, i) => `${i + 1}. ${s.title} — ${s.desc ?? ""}`),
        ),
        tryStages.length
          ? para(
              "The five stages of the Try GaitAI walkthrough",
              tryStages.map((s, i) => `${i + 1}. ${s.name} — ${s.text}`),
            )
          : "",
        meanings.length
          ? para(
              "One movement signal, and what each reading of it looks for (the home page's \"One movement. Many meanings.\")",
              meanings.map((s) => `${s.name} — ${s.text}`),
            )
          : "",
        para(
          "Inputs GaitAI can start from",
          captureSources.CAPTURE_SOURCES.map((c) => `${c.label} — ${c.note}`),
        ),
        para(
          "MobilityCare pipeline, stage by stage (Movement Intelligence Lab)",
          labDemo.MOBILITY_STAGES.map((s) => `${s.name} — ${s.note}`).join(" → "),
        ),
        para(
          "SecureVision pipeline, stage by stage (Movement Intelligence Lab)",
          labDemo.SECURE_STAGES.map((s) => `${s.name} — ${s.note}`).join(" → "),
        ),
        para("Movement signals the platform reads", signalTitles.join(" · ")),
        para("AI capabilities the modules are built on", capabilityTitles.join(" · ")),
        para(
          "One engine, two product families",
          [
            engineStep ? engineStep.desc : "",
            `MobilityCare (${products.mobilityProducts.length} clinical, rehabilitation, sports, wearable and elderly-care modules) and SecureVision (${products.secureProducts.length} privacy-aware security, safety and operations modules) are the product layer on the same movement-intelligence core.`,
          ].filter(Boolean),
        ),
        para(
          "Privacy and governance built into the pipeline",
          [
            skeletonControl ? `${skeletonControl.topic}: ${skeletonControl.support}` : "",
            edgeControl ? `${edgeControl.topic}: ${edgeControl.support}` : "",
            responsible.RESPONSIBLE_USE_CONTROLS,
          ].filter(Boolean),
        ),
        para(
          "Where a human decides",
          "GaitAI outputs are decision support for a clinician, therapist, caregiver, researcher or security operator, who reviews the movement evidence behind them. MobilityCare outputs do not diagnose; SecureVision outputs are not autonomous enforcement.",
        ),
        para("What this describes", "The published architecture and the illustrative Movement Intelligence Lab walkthrough — how the platform is designed to work, not a measured result or a validation claim."),
      ),
      keywords: [
        "how gaitai works",
        "how it works",
        "end to end",
        "end-to-end",
        "pipeline",
        "architecture",
        "workflow",
        "platform",
        "from video to insight",
        "from walking video to intelligence",
        "turn walking video into intelligence",
        "video to report",
        "camera input to report",
        "movement processing",
        "how the platform processes movement",
        "capture",
        "pose estimation",
        "gait cycle",
        "movement features",
        "analytics",
        "report",
        "dashboard",
        "alert",
        "clinician",
        "operator",
        "movement-processing engine",
        ...products.workflowStages.map((s) => s.title),
        ...labDemo.MOBILITY_STAGES.map((s) => s.name),
        ...labDemo.SECURE_STAGES.map((s) => s.name),
      ],
      relatedProducts: [],
      relatedResearch: [],
      /* Deliberately NOT bound to the GaitAI entity: the entity boost would lift
         this record for every question that names GaitAI, including the
         deployment and validation questions it must not answer. Its own title,
         keywords and the ARCHITECTURE hub boost are what rank it. */
      aliases: ["how gaitai works", "the gaitai pipeline", "end to end", "end-to-end workflow", "the end-to-end pipeline"],
    });
  }

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
    const parentId = `page:${url}`;
    const title = page.title || fallbackTitle;
    docs.push({
      id: parentId,
      type: "page",
      title,
      slug: url.split("/").pop(),
      url: route(url),
      family: "platform",
      category: "Policy page",
      summary: page.description || page.text.slice(0, 220),
      /* The overview: the page's opening (before its first heading) and the
         list of its sections. The sections' own words are the chunks below. */
      content: page.sections.length
        ? block(
            page.text.slice(0, 1800),
            para("Sections", page.sections.map((s) => s.heading)),
          )
        : page.text.slice(0, 6000),
      keywords: [title, page.description, ...page.sections.map((s) => s.heading)],
      relatedProducts: [],
      relatedResearch: [],
      topics: ["privacy", "governance", "trust"],
    });

    for (const section of page.sections) {
      const anchor = slugify(section.heading);
      const parts = splitParagraphs(section.text.split(/(?<=[.!?])\s+(?=[A-Z])/), CHUNK_CHARS);
      parts.forEach((text, index) => {
        const suffix = index === 0 ? "" : `-${index + 1}`;
        docs.push({
          id: `${parentId}#${anchor}${suffix}`,
          type: "page",
          title,
          sectionTitle: section.heading,
          slug: url.split("/").pop(),
          url: route(url),
          family: "platform",
          category: "Policy page",
          summary: lead(text),
          content: block(
            para("Page", title),
            para("Section", `${section.heading}${parts.length > 1 ? ` (part ${index + 1} of ${parts.length})` : ""}`),
            text,
          ),
          keywords: [title, section.heading],
          relatedProducts: [],
          relatedResearch: [],
          parentId,
          topics: ["privacy", "governance", "trust"],
        });
      });
    }
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
          products.workflowStages.map((s) => `${s.title} — ${s.desc ?? s.description ?? ""}`),
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
      /* A family is an entity: "does it use CCTV" after "what is
         SecureVision" resolves "it" to the family, and the family record
         must be findable by that name. */
      entityId: "mobilitycare",
      aliases: ["mobilitycare", "mobility care", "the mobilitycare family", "the clinical family"],
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
      entityId: "securevision",
      aliases: ["securevision", "secure vision", "the securevision family", "the security family"],
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
      content: block(
        para(
          "Records",
          publications.allPublications.map((p) => `${p.title} (${p.venue}, ${p.year})`),
        ),
        para(
          "Authors named on this page",
          [...new Set(publications.allPublications.flatMap((p) => p.authors))],
        ),
      ),
      keywords: ["publications", "papers", "patent", "journal", "citations", "where are your papers"],
      relatedEntityIds: authorEntities(publications.allPublications),
    },
    {
      url: "/research/evidence",
      title: "Full evidence record",
      category: "Research & IP",
      summary: `Every paper mapped to every capability: ${publications.papers.length} peer-reviewed papers and the granted patent, each mapped to the capabilities it informs and the modules built on them.`,
      content: block(
        "The full evidence record behind GaitAI, filterable by year and record type. Every mapping comes from the research areas; a record grounds a capability and is never, by itself, a validation of a module.",
        para(
          "Research areas and their records",
          evidence.researchAreas.map(
            (a) => `${a.title}: ${a.publications.map((p) => `${p.title} (${p.year})`).join("; ")}`,
          ),
        ),
      ),
      keywords: ["evidence", "evidence record", "full record", "papers mapped", "research areas", "capabilities"],
      relatedEntityIds: [FOUNDER_ID],
    },
    {
      url: "/insights",
      title: "GaitAI Insights",
      category: "Journal",
      summary: `The GaitAI blog: ${insights.insightArticles.length} long-form articles on movement intelligence, newest first. The route is /insights.`,
      content: block(
        "GaitAI Insights is the site's blog and editorial record — technical articles, research notes and updates on how movement becomes measurable, interpretable signal. Ordered newest first.",
        para(
          "Articles, newest first",
          [...insights.insightArticles]
            .sort((a, b) => String(b.date).localeCompare(String(a.date)))
            .map((a) => `${a.title} (${a.date}) — ${a.deck}`),
        ),
        para(
          "Topics",
          [...new Set(insights.insightArticles.flatMap((a) => a.topics))].map(topicLabel),
        ),
      ),
      keywords: ["gaitai insights", "insights", "journal", "articles", "blog", "essays", "reading", "latest", "recent", "new", "posts"],
    },
    {
      url: "/insights/topics",
      title: "Insights topics",
      category: "Journal",
      summary: "The subjects GaitAI writes about, each with its own topic page.",
      content: para(
        "Topics",
        [...new Set(insights.insightArticles.flatMap((a) => a.topics))].map(
          (topic) =>
            `${topicLabel(topic)} (/insights/topic/${topic}/) — ${
              insightTopics.INSIGHT_TOPIC_CONFIG[topic]?.description ?? ""
            }`,
        ),
      ),
      keywords: ["topics", "subjects", "what does gaitai write about", "insights topics"],
    },
    ...[...new Set(insights.insightArticles.flatMap((a) => a.topics))].map((topic) => ({
      url: `/insights/topic/${topic}`,
      title: `${topicLabel(topic)} — Insights topic`,
      category: "Journal",
      summary:
        insightTopics.INSIGHT_TOPIC_CONFIG[topic]?.description ??
        `GaitAI Insights articles filed under ${topicLabel(topic)}.`,
      content: para(
        `Articles filed under ${topicLabel(topic)}`,
        insights.insightArticles
          .filter((a) => a.topics.includes(topic))
          .map((a) => `${a.title} — ${a.deck}`),
      ),
      keywords: [topicLabel(topic), topic, "topic", "insights"],
    })),
    ...comparisons.productComparisons.map((comparison) => {
      const [a, b] = comparison.pair.map((id) => productById.get(id)).filter(Boolean);
      return {
        id: `comparison:${comparison.id}`,
        url: comparisons.comparisonHref(comparison),
        title: `${a?.short ?? comparison.pair[0]} vs ${b?.short ?? comparison.pair[1]}`,
        category: "Comparison",
        summary: comparison.question,
        content: block(
          para("The question this comparison answers", comparison.question),
          a && para(a.short, `${a.label}. ${a.description}`),
          b && para(b.short, `${b.label}. ${b.description}`),
          "The comparison table on /products reads both modules' records live: inputs, outputs, capabilities, environments and research. Nothing about either module is restated here.",
        ),
        keywords: ["compare", "comparison", "difference", "versus", "vs", a?.short, b?.short],
        relatedProducts: comparison.pair,
      };
    }),
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
    /* A comparison lives at /products/?compare=a,b#compare: the record id is
       the path plus query so two comparisons never share an id. */
    const idPath = page.url.replace(/\?.*$/, "");
    docs.push({
      id: page.id ?? `page:${idPath}`,
      type: "page",
      title: page.title,
      slug: (page.id ?? idPath).replace(/^[a-z-]+:/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home",
      url: page.url === "/#contact" ? "/#contact" : page.url.includes("?") ? page.url : route(page.url),
      family: "platform",
      category: page.category,
      summary: page.summary,
      content: page.content,
      keywords: page.keywords,
      relatedProducts: page.relatedProducts ?? [],
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
    /* Chunk metadata: serialised only where it says something. Topics keep
       their case (they are shown, not only matched). */
    if (doc.topics) {
      doc.topics = Array.from(new Set(doc.topics.filter(Boolean).map(clean).filter(Boolean)));
      if (!doc.topics.length) delete doc.topics;
    }
    if (doc.sectionTitle !== undefined) {
      doc.sectionTitle = clean(doc.sectionTitle);
      if (!doc.sectionTitle) delete doc.sectionTitle;
    }
    if (doc.date !== undefined) {
      doc.date = clean(doc.date);
      if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(doc.date)) delete doc.date;
    }
    if (doc.parentId === undefined) delete doc.parentId;
    /* Chunk ids must survive the Worker's id validator: [a-z-]+:[A-Za-z0-9/#._-]+ */
    if (!/^[a-z-]+:[A-Za-z0-9/#._-]+$/.test(doc.id) || doc.id.length > 120) {
      throw new Error(`record id is not a valid canonical id: ${doc.id}`);
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
  for (const doc of docs) {
    if (doc.parentId && !ids.has(doc.parentId)) {
      throw new Error(`${doc.id} points at unknown parent "${doc.parentId}"`);
    }
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
        "/research/talks/",
        "/publications/",
        "/insights/",
        "/insights/archive/",
        "/insights/start-here/",
        "/insights/topics/",
        "/labs/",
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

  /* The browser copy first: minified, because nobody reads it, and served as
     a static asset so it caches independently of any JS bundle hash. It is
     the copy that matters — the site and the Worker both derive from it. */
  mkdirSync(path.dirname(WEB_OUT), { recursive: true });
  /* A file watcher or scanner can hold the previous copy for a moment on this
     shared checkout (Windows reports it as UNKNOWN/EBUSY). Retry briefly
     before giving up; the browser copy must land. */
  const writeWithRetry = (target, text, attempts = 5) => {
    for (let attempt = 1; ; attempt += 1) {
      try {
        writeFileSync(target, text, "utf8");
        return;
      } catch (error) {
        /* Windows refuses to TRUNCATE or RENAME a file another process holds
           as a memory-mapped section ("UNKNOWN: unknown error, open" from
           Node; a Vite/esbuild dev server elsewhere on this machine mapping
           the old copy did exactly this). It still allows writing in place
           and extending. JSON ignores trailing whitespace, so the new payload
           is written from offset 0 and padded with spaces up to the old length
           — a valid file, no truncation, and every reader sees the new corpus. */
        if (error.code === "UNKNOWN" || error.code === "EBUSY" || error.code === "EPERM") {
          try {
            const previous = existsSync(target) ? statSync(target).size : 0;
            const bytes = Buffer.from(text, "utf8");
            const padded =
              bytes.length < previous ? Buffer.concat([bytes, Buffer.alloc(previous - bytes.length, 0x20)]) : bytes;
            const fd = openSync(target, "r+");
            try {
              writeSync(fd, padded, 0, padded.length, 0);
            } finally {
              closeSync(fd);
            }
            console.warn(
              `[build-knowledge] ${path.relative(ROOT, target)} is memory-mapped by another process; written in place${
                padded.length > bytes.length ? ` (padded ${padded.length - bytes.length} bytes)` : ""
              }.`,
            );
            return;
          } catch {
            /* fall through to the retry */
          }
        }
        if (attempt >= attempts) throw error;
        const until = Date.now() + 400 * attempt;
        while (Date.now() < until) {
          /* busy-wait: the script is synchronous and short-lived */
        }
      }
    }
  };
  writeWithRetry(WEB_OUT, JSON.stringify(payload));

  /* The review copy is a convenience for diffing. A locked file (an editor
     holding it open, another process mid-write on this shared checkout) must
     not fail the build that the browser copy has already served. */
  let reviewCopyNote = "";
  try {
    mkdirSync(path.dirname(OUT), { recursive: true });
    writeWithRetry(OUT, `${JSON.stringify(payload, null, 2)}\n`, 3);
  } catch (error) {
    reviewCopyNote = `\n  !! review copy not written (${error.code ?? "error"}: ${path.relative(ROOT, OUT)} is locked?) — browser copy is current`;
  }

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
        .join("\n") +
      reviewCopyNote,
  );
}

main().catch((error) => {
  console.error(`\nbuild-knowledge failed: ${error.message}\n`);
  process.exit(1);
});
