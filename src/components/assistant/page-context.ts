/**
 * PAGE AWARENESS
 * =============================================================================
 * What the assistant knows about where the visitor is standing, and what it
 * offers them before they type anything.
 *
 * WHY THE TITLE COMES FROM `document.title`
 * The opening line on a module page names the module — "Questions about
 * FallRisk?" — which needs the record's display name. Importing products.ts to
 * get it would pull the whole 23-module catalogue and its lucide icons into
 * every route's bundle, for one string. Next already writes the exact name into
 * the document title on every route, so it is read from there: correct by
 * construction, free, and it cannot drift from the page.
 *
 * Only safe, structural context is ever read: the pathname, the page title and
 * the page type. No DOM contents, no selection, no referrer, no form values.
 *
 * WHERE IT GOES. The pathname and the title travel with a question to
 * `askGaitai`, the project's own Cloud Function, so the hosted model can
 * resolve "this" against the page — see lib/ask/hosted.ts for the whole of
 * what crosses the wire. That is exactly why the restraint above matters: what
 * the assistant knows about the page is auditable in one short function, and
 * it is never more than a route and a title.
 */

export type PageType =
  | "home"
  | "product"
  | "family"
  | "products"
  | "use-case"
  | "use-cases"
  | "publication"
  | "publications"
  | "insight"
  | "insights"
  | "research"
  | "gaitscape"
  | "movement-lab"
  | "trust"
  | "legal"
  | "other";

export interface PageContext {
  pathname: string;
  pageType: PageType;
  /** Product / publication / insight / use-case slug, when the route has one. */
  slug: string;
  /** "mobilitycare" | "securevision" | "" */
  family: string;
  /** Display name of the record on this page, from the document title. */
  title: string;
}

/** "FallRisk | GaitAI" → "FallRisk". The template lives in app/layout.tsx. */
function recordTitle(): string {
  if (typeof document === "undefined") return "";
  return document.title.replace(/\s*[|·—]\s*GaitAI\s*$/i, "").trim();
}

export function readPageContext(pathname: string): PageContext {
  const parts = pathname.split("/").filter(Boolean);
  const title = recordTitle();
  const base = { pathname, slug: "", family: "", title };

  if (!parts.length) return { ...base, pageType: "home" };

  const [first, second] = parts;

  if (first === "mobilitycare" || first === "securevision") {
    return second
      ? { ...base, pageType: "product", slug: second, family: first }
      : { ...base, pageType: "family", slug: first, family: first };
  }
  if (first === "products") return { ...base, pageType: "products" };
  if (first === "use-cases") {
    return second
      ? { ...base, pageType: "use-case", slug: second }
      : { ...base, pageType: "use-cases" };
  }
  if (first === "publications") {
    return second
      ? { ...base, pageType: "publication", slug: second }
      : { ...base, pageType: "publications" };
  }
  if (first === "insights") {
    return second
      ? { ...base, pageType: "insight", slug: second }
      : { ...base, pageType: "insights" };
  }
  if (first === "research") return { ...base, pageType: "research", slug: second ?? "" };
  if (first === "gaitscape") return { ...base, pageType: "gaitscape" };
  if (first === "movement-lab") return { ...base, pageType: "movement-lab" };
  if (first === "trust") return { ...base, pageType: "trust" };
  if (first === "legal") return { ...base, pageType: "legal", slug: second ?? "" };

  return { ...base, pageType: "other" };
}

// ── Opening state ───────────────────────────────────────────────────────────

export interface Opening {
  /** One line, the assistant's own framing of where the visitor is. */
  lead: string;
  /** Optional second line naming what can be asked. */
  detail?: string;
  /** Starters. Four at most — a wall of buttons is a menu, not an offer. */
  prompts: string[];
}

/** The four universal starters, used wherever the route has nothing sharper. */
const DEFAULT_PROMPTS = [
  "Find the right product",
  "Explore research",
  "Ask about a use case",
  "How does GaitAI work?",
];

/**
 * What the panel says before the first question.
 *
 * Every variant is written against a route that exists, and none of them
 * asserts a capability — they name the things the site documents and invite a
 * question about them.
 */
export function openingFor(context: PageContext): Opening {
  const name = context.title || "this module";

  switch (context.pageType) {
    case "product":
      return {
        lead: `Questions about ${name}?`,
        detail: "Inputs, outputs, workflow, related modules, deployment.",
        prompts: [
          `What data does ${name} need?`,
          `What does ${name} produce?`,
          `How is ${name} deployed?`,
          "Which research reaches this module?",
        ],
      };

    case "family":
      return context.family === "securevision"
        ? {
            lead: "Explore SecureVision.",
            detail: "Products, privacy architecture, use cases and deployment.",
            prompts: [
              "Which products work with CCTV?",
              "How does privacy-aware analysis work?",
              "What is the difference between CrowdSense and SuspiciousMotion?",
              "Which module fits my environment?",
            ],
          }
        : {
            lead: "Explore MobilityCare.",
            detail: "Clinical, rehab, sports and elderly-care movement intelligence.",
            prompts: [
              "Which MobilityCare product fits my use case?",
              "What input data can GaitAI use?",
              "How does gait analysis work?",
              "Which modules work with just a walking video?",
            ],
          };

    case "products":
      return {
        lead: "23 modules, two families.",
        detail: "Describe your environment and I'll narrow it down.",
        prompts: [
          "Which product fits my environment?",
          "Which products use wearables?",
          "Which products work with existing CCTV?",
          "What is the difference between MobilityCare and SecureVision?",
        ],
      };

    case "use-case":
      return {
        lead: `Questions about ${name}?`,
        detail: "The module mix, the workflow, the signals and what deployment involves.",
        prompts: [
          "Which modules does this environment use?",
          "What does the workflow look like?",
          "What does this deployment produce?",
          "What would a pilot involve?",
        ],
      };

    case "use-cases":
      return {
        lead: "Tell me about your environment.",
        detail: "I'll map it to the modules GaitAI documents for it.",
        prompts: [
          "I run a hospital",
          "I run a sports academy",
          "I manage a factory",
          "Help me choose a product",
        ],
      };

    case "publication":
      return {
        lead: "Questions about this research?",
        detail:
          "I can explain its focus, its research area, and the GaitAI capabilities and modules it connects to.",
        prompts: [
          "Explain this publication",
          "Show related research",
          "Which capability does this ground?",
          "Does this validate a product?",
        ],
      };

    case "publications":
      return {
        lead: "Eight peer-reviewed papers and one granted patent.",
        detail: "Ask about any of them, or about what they do and don't establish.",
        prompts: [
          "Which publications support gait biometrics?",
          "What does Patent 402202 cover?",
          "How does research map to products?",
          "Show me research on privacy",
        ],
      };

    case "research":
      return {
        lead: "The research record, and where it reaches.",
        detail: "Research areas, the papers behind them, and the modules they inform.",
        prompts: [
          "Which publications support gait biometrics?",
          "What does Patent 402202 cover?",
          "How does research map to products?",
          "Does research validate a product?",
        ],
      };

    case "insight":
      return {
        lead: "Questions about this article?",
        detail: "The concept, the argument, and what to read next.",
        prompts: [
          "Explain this concept",
          "What should I read next?",
          "Which products relate to this?",
          "Recommend an article",
        ],
      };

    case "insights":
      return {
        lead: "The GaitAI blog.",
        detail: "Five long-form essays. I can tell you which one to start with.",
        prompts: [
          "Recommend an article",
          "Which article should I read first?",
          "Do you have anything about multimodal AI?",
          "Do you have an article about privacy?",
        ],
      };

    case "gaitscape":
      return {
        lead: "Reading the landscape.",
        detail: "Signals, capabilities, modules, domains and how they connect.",
        prompts: [
          "What is a movement signal?",
          "Which capabilities power WalkScan?",
          "How does research connect to products?",
          "Find the right product",
        ],
      };

    case "movement-lab":
      return {
        lead: "Want to understand what you're seeing?",
        detail:
          "Ask about the stages from movement capture to reportable intelligence.",
        prompts: [
          "Explain this stage",
          "What happens after pose estimation?",
          "How does a report get generated?",
          "Is this real data?",
        ],
      };

    case "trust":
    case "legal":
      return {
        lead: "Evidence, privacy and responsible deployment.",
        detail: "What the record establishes — and what GaitAI does not claim.",
        prompts: [
          "How does privacy-aware analysis work?",
          "What does GaitAI not claim?",
          "How are identity features governed?",
          "Where does processing run?",
        ],
      };

    default:
      return {
        lead: "What would you like to understand?",
        prompts: DEFAULT_PROMPTS,
      };
  }
}
