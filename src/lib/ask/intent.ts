/**
 * THE INTENT TAXONOMY — what KIND of thing a question asks for, declared once.
 * =============================================================================
 * Ask GaitAI kept being fixed one sentence at a time: "who is anubha", "what
 * can GaitAI do for military", "does it do surveillance". Each fix was right
 * and none of them generalised, because the knowledge of what a question is
 * about lived in scattered regular expressions and a hand-tuned boost table.
 *
 * This file is that knowledge in ONE place. For every intent family it
 * declares:
 *
 *   triggers   sentence-level patterns, tested on the REFERENCE-RESOLVED text
 *              ("does it do military" has already become "does GaitAI do
 *              military" by the time these run — see understand.ts)
 *   topics     the words a short or elliptical question may consist of and
 *              still be this intent ("CCTV?", "papers?", "founder?")
 *   expand     corpus vocabulary added to the query at a low weight, so a
 *              question phrased in a visitor's words still reaches records
 *              phrased in the site's — every term below occurs in the corpus
 *   prefer /   the record types that answer this kind of question, and the
 *   demote     ones that never do (a talk is not what GaitAI can DO for you)
 *   family     the product family the intent lives in, when it plainly does
 *   policy     how the answer must be shaped — the same sentence the prompt
 *              and the retrieval-only composer follow
 *   examples   phrasings that must classify here; the paraphrase suite adds
 *              many more it has never seen
 *
 * NOTHING HERE IS AN ANSWER. Expansions and boosts decide which canonical
 * records are retrieved; the records decide what is true. A synonym can make
 * SuspiciousMotion findable for "intrusion"; it can never say GaitAI detects
 * intrusion — only the record can.
 *
 * THE FALLBACK RULE. A question nothing matches (GENERAL, low confidence)
 * prefers broadly relevant pages, modules and environments and demotes
 * persons, talks and papers — the noise that used to answer everything.
 */

import type { DocType } from "./corpus";
import type { Family } from "./domains";

export type Intent =
  | "PERSON"
  | "PRODUCT"
  | "ARCHITECTURE"
  | "DOMAIN_APPLICATION"
  | "SECURITY"
  | "HEALTH_MOBILITY"
  | "PUBLICATION"
  | "RESEARCH"
  | "PRIVACY"
  | "DEPLOYMENT"
  | "CAPABILITY"
  | "COMPARISON"
  | "NAVIGATION"
  | "INSIGHTS"
  | "LAB_DATASET"
  | "EVIDENCE"
  | "UNSUPPORTED"
  | "GENERAL";

export interface IntentSpec {
  /** One line: what this family of questions asks for. */
  description: string;
  /** Sentence-level triggers on the reference-resolved text. */
  triggers: RegExp[];
  /** Topic words: an elliptical question made of these is this intent. */
  topics: RegExp | null;
  /** Corpus vocabulary added to the query at a reduced weight. */
  expand: string[];
  /** Record types that answer this kind of question, with their tilt. */
  prefer: Partial<Record<DocType, number>>;
  /** Record types that do not, with their (negative) tilt. */
  demote: Partial<Record<DocType, number>>;
  /** A family scope tilt: records of this family gain a little. */
  family: Family | null;
  /**
   * The hub records for this kind of question — the page or record that
   * consolidates the family's answer (Publications for PUBLICATION, the
   * privacy policy for PRIVACY). Boosted so a short or vague question of the
   * kind lands on the hub rather than on whichever module shares a word.
   */
  hubs: string[];
  /** The answer policy, in one sentence. */
  policy: string;
  /** Phrasings that must land here. */
  examples: string[];
}

/* Shared demotions: the records that answer no operational question. An
   essay is demoted as hard as a paper — "Your Walk Is More Than a Biometric"
   is not the module that analyses a walk. */
const NOT_OPERATIONAL: Partial<Record<DocType, number>> = {
  person: -6,
  talk: -6,
  publication: -3,
  insight: -3.5,
};

export const INTENTS: Record<Intent, IntentSpec> = {
  PERSON: {
    description: "Who someone is, what they authored, who founded or works on GaitAI.",
    triggers: [
      /^\s*(?:(?:so|and|ok|okay|hey|hi)[,\s]+)?who\b/i,
      /\b(founder|founders|co-?founder|founded|creator|created|author|authors|authored|researcher|researchers|scientist|team|people|person|leadership|leads|behind|inventor|invented|wrote)\b.*\b(who|whom|whose)\b|\b(who|whom|whose)\b.*\b(founder|founders|co-?founder|founded|creator|created|author|authors|authored|researcher|researchers|scientist|team|people|person|leadership|leads|behind|inventor|invented|wrote)\b/i,
    ],
    topics: /^(?:founder|founders|team|people|author|authors|who|ceo|leadership|staff)$/i,
    expand: ["founder", "author", "co-author"],
    prefer: { person: 10, publication: 0.5, research: 0.5, talk: 0.5 },
    demote: { policy: -6, deployment: -6, page: -3, product: -2, "use-case": -3, capability: -3, signal: -3, insight: -2 },
    family: null,
    hubs: [],
    policy:
      "Answer from the person record first — the name and what that record documents — then the publications and pages that point at them. Never infer a role, degree or affiliation.",
    examples: ["Who is Anubha?", "who founded gaitai", "tell me about Apoorva", "founder?", "who's behind gaitai"],
  },

  PRODUCT: {
    description: "What a named module is, does, takes in and produces.",
    triggers: [
      /\b(what\s+is|what's|what\s+does|how\s+does\s+\w+\s+work|features?\s+of|tell\s+me\s+about)\b/i,
      /\b(module|modules|product|products|solution|solutions|tool|tools)\b/i,
    ],
    topics: /^(?:products?|modules?|catalogue|catalog|offerings?|solutions?)$/i,
    expand: [],
    prefer: { product: 2, page: 0.5 },
    demote: { talk: -3, person: -3 },
    family: null,
    hubs: ["page:/products"],
    policy: "Name the module, say in one line what it takes in and what it produces, from its record.",
    examples: ["What is WalkScan?", "Tell me about FallRisk", "what does PrivacyGuard do", "products?", "which modules do you have"],
  },

  DOMAIN_APPLICATION: {
    description:
      "What GaitAI can do for an industry, environment or domain — whether documented (Hospitals) or not (military).",
    triggers: [
      /\b(what\s+(?:can|could|does|would|do)\s+\S+\s+(?:do|offer|provide|bring|deliver)\s+(?:for|in|to|at))\b/i,
      /\b(how\s+(?:can|could|would|does|do|might)\s+\S+\s+(?:help|support|serve|assist)|be\s+used\s+(?:in|for|at|by)|work\s+(?:in|for|at|with)|apply\s+(?:to|in)|fit\s+(?:into|in)|relevant\s+(?:to|for)|suitable\s+for|applicable\s+(?:to|in))\b/i,
      /\b(i\s+(?:run|manage|own|operate|work\s+(?:at|in|for)))\b/i,
      /\b(use\s+cases?|environments?|industr(?:y|ies)|sectors?|settings?|deploy\s+in)\b/i,
    ],
    topics: null,
    expand: [],
    prefer: { "use-case": 3, product: 2, deployment: 1.5, capability: 1, signal: 0.5, policy: 0.5 },
    demote: { research: -1, publication: -4, insight: -4, person: -8, talk: -8, page: -2 },
    family: null,
    hubs: ["page:/use-cases"],
    policy:
      "Say whether the domain is a documented environment. If it is, describe it and its modules from the records. If not, say so first, then describe only supported capabilities as potentially relevant applications — never a deployment, customer, clearance or certification.",
    examples: [
      "What can GaitAI do for military?",
      "does it do military",
      "military?",
      "what about defence?",
      "can it be used at a military base?",
      "How can GaitAI help hospitals?",
      "I run a physiotherapy clinic. What should I use?",
      "Does GaitAI work with the military?",
      "Does GaitAI have a military product?",
    ],
  },

  SECURITY: {
    description:
      "Security, surveillance and safety movement capabilities: CCTV, monitoring, restricted areas, suspicious movement, tracking, identification.",
    triggers: [
      /\b(surveillance|cctv|intrusion|intruders?|restricted[- ](?:area|zone|access)s?|suspicious|perimeter|watchlist|re-?identif\w*|loiter\w*|tailgat\w*|forensic|footage|unauthori[sz]ed|access\s+control|threat|incident\s+detection)\b/i,
      /\b(monitor(?:ing|s)?|track(?:ing|s)?|follow(?:ing)?|identify(?:ing)?|recogni[sz]e)\s+(?:people|persons?|someone|individuals?|visitors?|crowds?|a\s+person|everyone|anyone|movement)\b/i,
      /\bcrowds?\b|\bcrowd\s+(?:monitoring|analytics|flow|density|management|intelligence)\b/i,
      /\b(secur(?:e|ity|ed)|encrypt(?:ed|ion)?|role-?based|audit(?:\s+log|able|ability)?|breach|soc\s*2|iso\s*27001|penetration|vulnerab)\b/i,
    ],
    topics: /^(?:surveillance|cctv|security|tracking|monitoring|intrusion|perimeter|watchlist|crowd|crowds|forensics?|footage|cameras?)$/i,
    expand: ["security", "camera", "cctv", "operator", "restricted", "suspicious", "monitoring", "safety"],
    prefer: { product: 2, capability: 1.5, signal: 1, "use-case": 1.5, policy: 1.5, deployment: 1 },
    demote: { ...NOT_OPERATIONAL, page: -1 },
    family: "securevision",
    hubs: ["page:/securevision","policy:responsible-use"],
    policy:
      "Describe the SecureVision capabilities the records document — what they surface for an operator — and carry the responsible-use boundary: governed, lawful, authorised deployments; no identity from movement alone.",
    examples: ["Does GaitAI do surveillance?", "does it do surveillance?", "CCTV?", "can it monitor people?", "can it detect intrusion?", "what about perimeter security?"],
  },

  HEALTH_MOBILITY: {
    description: "Clinical, rehabilitation, elderly-care and mobility capabilities: falls, gait, balance, recovery, monitoring.",
    triggers: [
      /\b(falls?|fall[- ]risk|gait\s+(?:speed|analysis|assessment|metrics?|report)|rehab\w*|elderly|older\s+(?:adults?|people)|mobility|clinical|clinicians?|patients?|parkinson\w*|stroke|dementia|arthritis|balance|walking\s+(?:speed|assessment)|physio\w*|cadence|symmetry|tremor|diagnos\w*|stride|posture|wearables?|smartwatch\w*|recovery|injur\w*|orthop\w*|neurolog\w*|pediatric|paediatric|prosthe\w*|therap\w*)\b/i,
      /\banaly[sz]e\s+(?:\w+\s+)?(?:walk|gait|stride)|\b(?:a|the|someone'?s|my|their|patient'?s|person'?s)\s+(?:walk|gait|stride)\b/i,
    ],
    topics: /^(?:falls?|fall\s+risk|gait|rehab|rehabilitation|elderly|mobility|balance|walking|clinical|patients?|parkinson'?s?|stroke|wearables?|recovery|health|healthcare)$/i,
    expand: ["mobility", "clinician", "gait", "walking", "fall"],
    prefer: { product: 2, capability: 1.5, signal: 1.5, "use-case": 1.5, deployment: 0.5, research: 0.5 },
    demote: { ...NOT_OPERATIONAL, page: -1 },
    family: "mobilitycare",
    hubs: ["page:/mobilitycare"],
    policy:
      "Describe what the MobilityCare module measures and monitors from its record; outputs are AI-generated movement metrics for decision support, never a diagnosis.",
    examples: ["can this detect falls", "Does GaitAI diagnose Parkinson's?", "fall risk?", "does it measure gait speed", "What is gait analysis?", "can it measure cadence"],
  },

  PUBLICATION: {
    description: "Papers, patents, venues, DOIs — the published record.",
    triggers: [
      /\b(paper|papers|publication|publications|publish(?:ed|es)?(?!\s+(?:articles?|blog|posts?|stories))|patent|patents|doi|(?:journal|research|academic|scientific|peer.?reviewed)\s+(?:articles?|work|output)|cite|citation|citations|peer.?reviewed|preprint|proceedings|venue)\b/i,
    ],
    topics: /^(?:papers?|publications?|patents?|citations?|doi|journals?|peer.?reviewed)$/i,
    expand: [],
    prefer: { publication: 2.5, research: 1 },
    /* The founder's record lists every paper; it is not the answer to "what
       publications does GaitAI have". Modules cite the patent; likewise. */
    demote: { person: -6, page: -2, talk: -4, product: -4, "use-case": -4, insight: -4, capability: -1, signal: -1 },
    family: null,
    hubs: ["page:/publications"],
    policy: "List real records — title, venue, year — from the publication records; a paper grounds a capability, it does not validate a module.",
    examples: ["What publications does GaitAI have?", "papers?", "show gait recognition papers", "which patents", "research articles on privacy"],
  },

  RESEARCH: {
    description: "Research areas, the science behind a capability, what GaitAI studies.",
    triggers: [/\b(research|study|studies|scientific|science|academic|findings|literature|foundation|grounded|grounds|what\s+(?:does|do)\s+\S+\s+research)\b/i],
    topics: /^(?:research|science|studies)$/i,
    expand: ["research", "area", "capability"],
    prefer: { research: 2.5, publication: 1.2 },
    /* A conference talk shares the words of every research question and
       answers none of them; the research-area records do. */
    /* A research question wants areas and papers: a module that cites a paper
       and a person who wrote one are pointers, not the answer. */
    demote: { person: -4, page: -2, talk: -6, insight: -2, product: -3, "use-case": -2 },
    family: null,
    /* Not the Research hub itself: its title already carries "research", and a
       hub boost on top lifted it over the research AREA a question names
       ("research on privacy"). The evidence record is a different page. */
    hubs: ["page:/research/evidence"],
    policy: "Answer from the research-area records: what each area covers, which papers ground it, which modules it informs — and that research is not product validation.",
    examples: ["What does GaitAI research?", "research?", "Show me research on privacy.", "what's the science behind it"],
  },

  PRIVACY: {
    description: "How data, video and identity are handled; consent, retention, anonymisation.",
    triggers: [
      /\b(privacy|private|personal\s+data|my\s+(?:video|videos|data|footage|recording|recordings|upload|uploads)|uploaded|upload|store|stored|storage|retain|retained|retention|delete|deleted|deletion|anonymi[sz](?:e|ed|ation)|de-?identif|consent|gdpr|hipaa|dpdp|face\s+blur|skeleton\s+only|who\s+can\s+see|what\s+happens\s+to)\b/i,
    ],
    topics: /^(?:privacy|consent|gdpr|hipaa|retention|anonymisation|anonymization|data)$/i,
    expand: ["privacy", "retention", "consent"],
    prefer: { policy: 3, deployment: 1.5, page: 0 },
    demote: { product: -3, "use-case": -2, page: -1.5, talk: -4, person: -4, insight: -4, publication: -4 },
    family: null,
    hubs: ["page:/legal/privacy","policy:privacy-controls"],
    policy: "Answer from the privacy policy, the Trust Center and the privacy-controls record; state capability, never certification; quote what is explicitly not claimed.",
    examples: ["What does GaitAI say about privacy?", "privacy?", "how is my uploaded video handled", "what about privacy", "do you store faces"],
  },

  DEPLOYMENT: {
    description: "How a deployment runs: inputs, cameras, integration, pilots, where processing happens, how to start.",
    triggers: [
      /\b(deploy\w*|integrat\w*|pilot|install\w*|set\s*up|on-?prem\w*|cloud|edge\s+(?:device|processing|analytics)|api|sdk|webhook|dashboard|hardware|infrastructure|rollout|onboard\w*|get\s+started|how\s+(?:do\s+we|to)\s+start|what\s+(?:input|inputs|data)\s+(?:does|do)\s+\S+\s+need|what\s+(?:does|do)\s+\S+\s+need|(?:does|do|will|would)\s+\S+\s+(?:need|require)\b|need(?:s|ed)?\s+(?:a\s+|an\s+|special\s+)?(?:cameras?|hardware|sensors?|wearables?|video|footage|internet|gpu|servers?|equipment)|where\s+does\s+(?:it|processing|the\s+processing)\s+run|camera\s+requirements?|existing\s+(?:cameras?|cctv))\b/i,
    ],
    topics: /^(?:deployment|integration|pilot|inputs?|api|setup|hardware|onboarding)$/i,
    expand: ["deployment", "integration", "pilot", "input"],
    prefer: { deployment: 3, product: 1, "use-case": 1, policy: 0.5 },
    demote: { ...NOT_OPERATIONAL, page: -1 },
    family: null,
    hubs: ["deployment:process","page:/trust"],
    policy: "Answer from the deployment records and the modules' deployment sections: inputs, where processing runs, integration, how a pilot is scoped — as capability, not as a running deployment.",
    examples: ["How does GaitAI integrate?", "what input does it need?", "does that need a camera?", "how do we start a pilot", "deployment?"],
  },

  ARCHITECTURE: {
    description: "How the platform works as a whole — the pipeline from capture to review, its stages, inputs and outputs.",
    /* The platform as the subject: "how does GaitAI / it / the platform work",
       "end to end", "pipeline", "architecture", "from video to insight". A
       named module keeps PRODUCT ("how does WalkScan work" is that module's
       how-it-works section), which classifyIntent checks before this. */
    triggers: [
      /\bhow\s+(?:does|do|would|will|can)\s+(?:gaitai|gait\s*ai|it|this|everything|the\s+(?:platform|system|whole\s+(?:thing|system|platform)|pipeline|engine|technology|product))\s+(?:actually\s+|really\s+)?(?:work|operate|function|run|fit\s+together|process|analy[sz]e|handle|turn|convert|go)\b/i,
      /\b(?:end[\s-]*to[\s-]*end|pipeline|architecture|workflow|under\s+the\s+hood|behind\s+the\s+scenes|step[\s-]+by[\s-]+step|stages?\s+of\s+(?:the\s+)?(?:process|pipeline|platform|system)|processing\s+(?:chain|steps|stages|flow)|data\s+flow|how\s+it\s+(?:all\s+)?works)\b/i,
      /\bfrom\s+(?:a\s+|the\s+)?(?:walking\s+|raw\s+)?(?:video|camera|clip|footage|sensor|movement|input|capture)s?\s+(?:\S+\s+){0,3}?(?:to|into)\s+(?:an?\s+|the\s+)?(?:insight|report|intelligence|alert|dashboard|output|decision|result)s?\b/i,
      /\b(?:turn|turns|turning|convert|converts|converting|transform|transforms|transforming)\s+(?:\S+\s+){0,3}?(?:video|movement|footage|walk\w*|motion)\s+into\b/i,
      /\bhow\s+(?:does|do|is|are|can)\s+(?:a\s+|the\s+|an?\s+)?(?:camera|video|cctv|sensor|wearable|smartwatch)\s+(?:input|feed|clip|footage|signal|stream)s?\s+(?:become|turn\s+into|turned\s+into|get\s+processed|processed|analy[sz]ed)\b/i,
      /\bwhat\s+happens\s+(?:from|between)\b/i,
    ],
    topics: /^(?:architecture|pipeline|workflow|how\s+it\s+works|end[\s-]*to[\s-]*end|stages|the\s+pipeline)$/i,
    expand: ["pipeline", "pose", "signal", "report", "capture"],
    /* The platform record (type page) and the capability and signal layers
       answer it; an environment, a person or a talk never does. */
    prefer: { page: 0.5, capability: 1.5, signal: 1, policy: 0.5 },
    /* An environment never answers "how does it work": the Smart Cities page
       scored on "end-to-end" and opened the answer that prompted this intent. */
    demote: { "use-case": -6, person: -6, talk: -6, publication: -3, insight: -2.5, product: -0.5, deployment: -1 },
    family: null,
    hubs: ["platform:gaitai-end-to-end"],
    policy:
      "Describe the platform as its published sequence of stages — capture, pose and movement extraction, movement features and signals, analytics and interpretation by the relevant module, a report or alert, human review — in the records' own terms; add the privacy and governance controls the records state; say nothing about deployments, customers or validation unless asked.",
    examples: [
      "How does GaitAI work?",
      "How does GaitAI work end to end?",
      "Explain the GaitAI pipeline",
      "What happens from video to insight?",
      "How does the platform process movement?",
      "How does a camera input become a report?",
      "What's the end-to-end workflow?",
      "How does GaitAI turn walking video into intelligence?",
      "Explain the architecture",
    ],
  },

  CAPABILITY: {
    description: "What the platform can sense, measure or detect — a capability or movement signal.",
    triggers: [
      /\b(capabilit(?:y|ies)|signals?|pose\s+estimation|gait\s+cycle|anomaly\s+detection|feature\s+extraction|detection|recognition|segmentation|estimation|what\s+can\s+it\s+(?:detect|measure|sense|do)|can\s+(?:it|this|\S+)\s+(?:detect|measure|sense|recogni[sz]e|estimate|analy[sz]e)|measures?|senses?)\b/i,
    ],
    topics: /^(?:capabilities|signals?|detection|pose\s+estimation|features?)$/i,
    expand: ["capability", "signal"],
    prefer: { capability: 2, signal: 2, product: 0.5 },
    demote: { talk: -2, person: -3, insight: -1.5 },
    family: null,
    hubs: ["page:/gaitscape"],
    policy: "Answer from the capability and signal records and the modules built on them; a capability is what the architecture is designed to do, not a measured result.",
    examples: ["what can it detect", "capabilities?", "does it do pose estimation", "can it recognise anomalies"],
  },

  COMPARISON: {
    description: "Two modules or families against each other.",
    triggers: [/\b(difference\s+between|compare|comparison|versus|vs\.?|or\s+should\s+i|which\s+is\s+better|better\s+than|instead\s+of|rather\s+than)\b/i],
    topics: null,
    expand: ["compare", "comparison"],
    /* A family page is the record for "MobilityCare versus SecureVision". */
    prefer: { product: 2, page: 1.5 },
    demote: { ...NOT_OPERATIONAL },
    family: null,
    hubs: ["page:/products"],
    policy: "Set the two records side by side on inputs, outputs and audience from their own records; do not rank them on anything the records do not state.",
    examples: ["What is the difference between CrowdSense and SuspiciousMotion?", "WalkScan vs RehabTrack", "compare MobilityCare and SecureVision"],
  },

  NAVIGATION: {
    description: "Where something is on the site, where to try or find it.",
    triggers: [/^\s*(?:where|take\s+me|go\s+to|open\s+the|navigate|link\s+to)\b/i, /\b(where\s+(?:can|do|is|are)|where's|find|show\s+me|link\s+to|page|take\s+me|navigate|go\s+to|located|url|route|open\s+the|section)\b/i],
    topics: /^(?:where|link|page|url|contact|demo|sitemap)$/i,
    expand: [],
    prefer: { page: 1.5 },
    demote: { talk: -2 },
    family: null,
    hubs: [],
    policy: "Name the canonical destination from the records and link it; never a destination the records did not supply.",
    examples: ["Where can I try GaitAI?", "Where are your publications?", "take me to the trust center", "contact?"],
  },

  INSIGHTS: {
    description: "The blog: articles, essays, what is new or worth reading.",
    /* "read" only in its editorial sense — "something to read", "worth
       reading", "reading list" — not "reading how someone walks". */
    triggers: [/\b(articles?|blog|insights?|essays?|(?:something|anything|what)\s+to\s+read|worth\s+reading|reading\s+(?:list|path|material)|read\s+(?:more|about|next|the)|stories|story|posts?|latest|newest|what'?s\s+new|recently\s+published)\b/i],
    topics: /^(?:insights|blog|articles?|essays?|posts?|latest|news)$/i,
    expand: ["article", "insights"],
    prefer: { insight: 2.5, page: 0.5 },
    demote: { person: -3, talk: -3, product: -1 },
    family: null,
    hubs: ["page:/insights"],
    policy: "Point at the articles by title and date from the records, newest first when asked for the latest.",
    examples: ["What are the latest GaitAI Insights?", "articles?", "anything to read on privacy", "what's new on the blog"],
  },

  LAB_DATASET: {
    description: "GaitAI Labs, the gait dataset, the biometrics lab, the Movement Intelligence Lab and its experiments.",
    triggers: [/\b(datasets?|gaitai\s+labs?|biometrics?\s+lab|movement\s+(?:intelligence\s+)?lab|the\s+lab|experiments?|analy[sz]e\s+(?:a|my|this)\s+(?:clip|video|walk)|try\s+(?:it|gaitai|the\s+demo)|demo|atlas|signal\s+inspector|footage\s+check|movement\s+x-?ray|privacy\s+lens|fusion\s+sandbox|time\s+machine)\b/i],
    topics: /^(?:labs?|dataset|demo|experiments?|atlas|biometrics)$/i,
    /* No expansions: "labs" and "dataset" are the hub's own words and would
       lift the hub over the asset page a question names ("the Biometrics Lab"). */
    expand: [],
    prefer: { page: 2.5, capability: 0.5 },
    demote: { ...NOT_OPERATIONAL, product: -1 },
    family: null,
    hubs: [],
    policy: "Answer from the Labs and Movement Intelligence Lab records: what exists, its status, and that no dataset figure or accuracy is published until it can be cited.",
    examples: ["What happens in the Biometrics Lab?", "dataset?", "is there a demo", "what experiments can I try"],
  },

  EVIDENCE: {
    description: "Whether something is validated, accurate, certified, proven — the evidence status.",
    triggers: [/\b(validat\w*|accura\w*|proven|proof|evidence|certif\w*|regulat\w*|fda|ce\s+mark\w*|clinically|peer.?reviewed\s+(?:proof|evidence)|reliab\w*|how\s+(?:good|well)\s+does|does\s+it\s+(?:actually|really)\s+work|error\s+rates?|sensitivity|specificity|benchmark\w*|track\s+record|maturity)\b/i],
    topics: /^(?:accuracy|validation|evidence|certification|proof|reliability|benchmarks?)$/i,
    expand: ["evidence", "validation", "maturity", "not claimed"],
    prefer: { product: 1.5, policy: 2, research: 1.5, publication: 0.5, deployment: 0.5 },
    demote: { person: -4, talk: -4, insight: -2 },
    family: null,
    hubs: ["page:/research/evidence","policy:privacy-controls"],
    policy:
      "Separate published research, platform capability and product validation; state the evidence status the record gives and quote what is explicitly not claimed. Never a figure the records do not state.",
    examples: ["Is WalkScan clinically validated?", "What accuracy does FallRisk achieve?", "accuracy?", "is it certified", "how reliable is it"],
  },

  UNSUPPORTED: {
    description:
      "Questions the public record cannot answer by its nature — pricing, customers, contracts, hiring, finances — or off-topic requests.",
    triggers: [
      /\b(pric\w*|cost\w*|how\s+much|fees?|subscription|licen[cs]e\s+fee|quote|discount|customers?|clients?|who\s+(?:uses|is\s+using|buys)|case\s+stud\w*|fortune\s+500|contracts?|tenders?|jobs?|careers?|hiring|vacanc\w*|salar\w*|revenue|valuation|stock|ipo|funding\s+round|raised|investors?\s+(?:list|names?))\b/i,
      /\b(weather|joke|recipe|poem|translate|lyrics|football|cricket|movie|bitcoin|stock\s+market)\b/i,
    ],
    topics: /^(?:price|pricing|cost|customers|clients|jobs|careers|hiring|revenue|funding)$/i,
    expand: [],
    prefer: { page: 1, product: 0.5, "use-case": 0.5, deployment: 0.5 },
    demote: { person: -6, talk: -6, publication: -4, insight: -2 },
    family: null,
    hubs: ["page:/#contact"],
    policy:
      "Say plainly that the available GaitAI information does not establish it, offer the closest real page (Contact for commercial questions), and describe nothing the records do not state.",
    examples: ["Which Fortune 500 companies use GaitAI?", "how much does it cost", "who are your customers", "are you hiring", "what's the weather", "pricing?"],
  },

  GENERAL: {
    description: "Nothing above matched. The fallback prefers broadly relevant pages, modules and environments over people, talks and papers.",
    triggers: [],
    topics: null,
    expand: [],
    prefer: { page: 0.5, product: 0.5, "use-case": 0.5, deployment: 0.75, capability: 0.25 },
    demote: { person: -2, talk: -2, publication: -1.5 },
    family: null,
    hubs: [],
    policy: "Answer from whatever records genuinely match; if none do, say the available GaitAI information does not establish it.",
    examples: ["What is movement intelligence?", "How does GaitAI use walking video?"],
  },
};

/** Classification priority when several families' triggers fire. */
export const INTENT_ORDER: Intent[] = [
  "PERSON",
  "COMPARISON",
  "DOMAIN_APPLICATION",
  "NAVIGATION",
  "PUBLICATION",
  "UNSUPPORTED",
  "EVIDENCE",
  "INSIGHTS",
  "LAB_DATASET",
  "RESEARCH",
  "PRIVACY",
  "SECURITY",
  "HEALTH_MOBILITY",
  "DEPLOYMENT",
  "ARCHITECTURE",
  "PRODUCT",
  "CAPABILITY",
  "GENERAL",
];

/** Merged tilt table for ranking: prefer + demote. */
export function typeTilt(intent: Intent): Partial<Record<DocType, number>> {
  const spec = INTENTS[intent];
  return { ...spec.prefer, ...spec.demote };
}

// ── Patterns shared with the understanding stage ─────────────────────────────

/** One to four capitalised words, optionally with a trailing period ("Dr."). */
export const LOOKS_LIKE_NAME = /^(?:[A-Z][a-z]+\.?\s*){1,4}$/;

/** A message that opens by asking WHERE something is, before any topic word. */
export const LEADING_NAVIGATION = /^\s*(?:where|take\s+me|go\s+to|open\s+the|navigate|link\s+to)\b/i;

/**
 * "Who is X", "tell me about X", "what do you know about X".
 *
 * Deliberately anchored at the start of the message, so "who is it for" and
 * "which paper tells me about pose" are not mistaken for questions about a
 * person. The captured group is the SUBJECT — what X was — and is what the
 * empty state names when no record for X exists.
 */
export const WHO_PATTERN =
  /^\s*(?:(?:so|and|ok|okay|hey|hi)[,\s]+)?(?:who\s+(?:is|are|was|were|s)|who's|whos|who\s+founded|who\s+created|who\s+started|who\s+built|who\s+made|who\s+leads|who\s+runs|who\s+owns|who\s+(?:is|are)\s+behind|who\s+works?\s+on|who\s+does\s+the\s+research\s+(?:for|at|behind)|tell\s+me\s+(?:something\s+)?about|what\s+do\s+you\s+know\s+about|what\s+can\s+you\s+tell\s+me\s+about|do\s+you\s+know|introduce|background\s+(?:on|of)|bio\s+(?:of|for)|biography\s+(?:of|for)|profile\s+(?:of|for))\s+(.+?)\s*[?.!]*\s*$/i;

/** Words that make a "who" question about a role rather than a named person. */
export const ROLE_WORDS =
  /\b(founder|founders|co-?founder|founded|creator|created|author|authors|authored|researcher|researchers|scientist|team|people|person|leadership|leads|behind|inventor|invented|wrote|works?\s+on)\b/i;

/**
 * A "who is X" whose X is plainly not a person: "who is it for", "who is this
 * product aimed at", "who is GaitAI for". These read as audience questions.
 */
export const AUDIENCE_SUBJECT =
  /^(?:it|this|that|these|those|gaitai|the\s+(?:product|module|platform|site))\b.*\b(?:for|aimed|intended|meant)\b/i;

/**
 * "What can GaitAI do for X", "how can GaitAI help X", "use GaitAI for X",
 * "GaitAI for X", "which GaitAI products for X", "how would GaitAI work in X",
 * "can GaitAI be used in X", "does GaitAI have anything for X".
 *
 * Anchored at the start of the message like WHO_PATTERN. The subject slot
 * accepts the brand, a pronoun (already resolved by understand.ts) or a
 * module name. The captured group is X — the domain.
 */
export const APPLICATION_PATTERN =
  /^\s*(?:(?:so|and|ok|okay|hey|hi)[,\s]+)?(?:what\s+(?:can|could|does|would|do)\s+(?:gaitai|gait\s*ai|you|it|this|the\s+platform|[a-z]+)\s+(?:do|offer|provide|bring|deliver|mean)\s+(?:for|in|to|at)|how\s+(?:can|could|would|does|do|might)\s+(?:gaitai|gait\s*ai|you|it|this|the\s+platform|[a-z]+)\s+(?:help|support|serve|assist|be\s+used\s+(?:in|for|at|by)|work\s+(?:in|for|at)|apply\s+(?:to|in)|fit\s+(?:into|in))|(?:can|could)\s+(?:gaitai|gait\s*ai|you|it|this|[a-z]+)\s+(?:be\s+used\s+(?:in|for|at|by)|be\s+(?:relevant|useful|applied|deployed)\s+(?:to|for|in|at)|help|support|work\s+(?:in|for|at))|(?:how\s+to\s+)?us(?:e|ing)\s+(?:gaitai|gait\s*ai)\s+(?:for|in|at)|(?:gaitai|gait\s*ai)\s+(?:for|in)|which\s+(?:gaitai\s+)?(?:products?|modules?|solutions?)\s+(?:are\s+)?(?:for|suit|fit|work\s+(?:in|for))|what\s+(?:gaitai\s+)?(?:products?|modules?|solutions?)\s+(?:are\s+there\s+)?(?:for|in)|(?:is|are)\s+there\s+(?:anything|something|a\s+(?:product|module|solution))\s+for|does\s+(?:gaitai|gait\s*ai|it|this|[a-z]+)\s+(?:have\s+(?:anything|something|products?|modules?|solutions?|offerings?)\s+for|work\s+(?:in|for|with)|support|cover|serve|address|do\s+anything\s+for))\s+(.+?)\s*[?.!]*\s*$/i;

/** Filler between the pattern and the domain: "a", "the", "an", "a typical". */
export const SUBJECT_FILLER =
  /^(?:(?:a|an|the|my|our|your|typical|large|small|busy|modern|local|use\s+in|deployments?\s+in|sector|settings?|environments?|context)\s+)+/i;
/** Trailing words that are the question, not the domain. */
export const SUBJECT_TAIL =
  /\s+(?:environments?|settings?|sectors?|contexts?|use\s*cases?|applications?|deployments?|industr(?:y|ies)|market|domain|space|scenarios?|use|uses|purposes?|work|needs?|operations?|bases?|facilit(?:y|ies)|sites?)$/i;

/** Trim filler and tail words from an extracted domain. */
export function cleanSubject(raw: string): string {
  return raw.replace(/[?.!,;:]+$/g, "").trim().replace(SUBJECT_FILLER, "").replace(SUBJECT_TAIL, "").trim();
}

/**
 * The domain of a "what can GaitAI do for X" question, or null when the
 * message is not in that shape.
 */
export function applicationSubject(query: string): string | null {
  const match = APPLICATION_PATTERN.exec(query.trim());
  if (!match) return null;
  const subject = cleanSubject(match[1]);
  if (!subject || /^(me|us|you|them|him|her|myself|ourselves|people|someone|anyone|visitors?)$/i.test(subject)) {
    return null;
  }
  return subject;
}

/**
 * The subject of a "who is X" question, for the empty state.
 *
 * "who is anubha?" → "anubha"; "tell me about Dr. Smith." → "Dr. Smith".
 * Null when the question is not in that shape, so the caller falls back to
 * the generic wording.
 */
export function personSubject(query: string): string | null {
  const match = WHO_PATTERN.exec(query.trim());
  if (!match) return null;
  const subject = match[1]
    .replace(/^(?:the|a|an)\s+/i, "")
    .replace(/[?.!,;:]+$/g, "")
    .trim();
  return subject.length ? subject : null;
}

// ── Classification ───────────────────────────────────────────────────────────

/** What the understanding stage already knows, so the rules can use it. */
export interface IntentHints {
  /** A person entity's alias appears in the question. */
  namesPerson?: boolean;
  /** A module's exact title or alias appears in the question. */
  namesProduct?: boolean;
  /** An environment's exact title appears in the question. */
  namesEnvironment?: boolean;
  /** A capability's or signal's exact title appears in the question. */
  namesCapability?: boolean;
  /**
   * The subject of a "who is X" / "tell me about X" contains a word the corpus
   * has never seen. With a capitalised subject that is the signature of a
   * name we do not index — "tell me about Priya Sharma".
   */
  subjectUnknown?: boolean;
  /**
   * The understanding stage found a DOMAIN the question is about — through
   * the "for X" forms, a "does it do X" form, or a bare "X?" whose X is in
   * the domain vocabulary or is an environment's name. Decisive.
   */
  domainSubject?: string | null;
  /** The question is a short topic ("CCTV?", "papers?") rather than a sentence. */
  elliptical?: boolean;
  /** How many distinct modules the question names — two is a comparison. */
  productCount?: number;
  /** At least one word of the question occurs in the corpus at all. */
  knownVocabulary?: boolean;
}

/** The first intent whose TOPIC pattern the whole (short) text matches. */
export function topicIntent(text: string): Intent | null {
  const topic = text.toLowerCase().replace(/^(?:for|about|on|and|in|the|a|an|any|what about|how about)\s+/i, "").replace(/[?.!\s]+$/g, "").trim();
  for (const intent of INTENT_ORDER) {
    const spec = INTENTS[intent];
    if (spec.topics && spec.topics.test(topic)) return intent;
  }
  return null;
}

/**
 * Classify one question — already reference-resolved by understand.ts.
 *
 * ORDER IS THE MODEL. The first rule that fires wins, and the order encodes
 * the priorities a visitor would expect: a named person beats everything
 * (asking "who is Anubha" on any page is about Anubha); a domain names the
 * kind of answer wanted whatever else the sentence contains; a privacy
 * question that mentions a module is still a privacy question; a named module
 * beats the generic hints. The last rules are broad on purpose — they only
 * ever add a small tilt, never a decisive boost.
 */
/** The explicit recommendation openings — the only forms that make a question a
 *  domain question WITHOUT the domain being recognised ("what can GaitAI do for
 *  astronauts" is still that kind of question; "does GaitAI work with CCTV" is
 *  not — CCTV is a capability, and the security rules take it). */
const STRONG_APPLICATION_OPENING =
  /^\s*(?:(?:so|and|ok|okay|hey|hi)[,\s]+)?(?:what\s+(?:can|could|does|would|do)\s+\S+\s+(?:do|offer|provide|bring|deliver)\s+(?:for|in|to|at)|how\s+(?:can|could|would|does|do|might)\s+\S+\s+(?:help|support|serve|assist)|which\s+(?:gaitai\s+)?(?:products?|modules?|solutions?)\s+(?:are\s+)?for|what\s+(?:gaitai\s+)?(?:products?|modules?|solutions?)\s+(?:are\s+there\s+)?for|(?:gaitai|gait\s*ai)\s+for\b|us(?:e|ing)\s+(?:gaitai|gait\s*ai)\s+for)/i;

/** Commercial questions phrased with "who" — "who are your customers" — are
 *  not person questions. */
const COMMERCIAL_WHO = /\b(customers?|clients?|who\s+(?:uses|is\s+using|buys|pays)|case\s+stud\w*|fortune\s+500|pric\w*|cost\w*|how\s+much)\b/i;

export function classifyIntent(query: string, hints: IntentHints = {}): Intent {
  const text = query.trim();
  const who = WHO_PATTERN.exec(text);
  const subject = who?.[1] ?? "";

  if (COMMERCIAL_WHO.test(text) && !hints.namesPerson) return "UNSUPPORTED";
  if (hints.namesPerson) return "PERSON";

  /* Two modules against each other — checked before the short-question rules
     because "WalkScan vs RehabTrack" is three words and no verb. Two named
     modules joined by "or" is a comparison however it is phrased. */
  if (
    (INTENTS.COMPARISON.triggers.some((t) => t.test(text)) &&
      (hints.namesProduct || /\b(mobilitycare|securevision)\b.*\b(mobilitycare|securevision)\b/i.test(text))) ||
    ((hints.productCount ?? 0) >= 2 && /\b(or|vs\.?|versus|and)\b/i.test(text))
  ) {
    return "COMPARISON";
  }

  /* "Where does the processing run" is a deployment question that opens with
     "where"; "where is my video stored" a privacy one. Neither is navigation. */
  if (/\bwhere\s+(?:does|do|is|are|will)\s+(?:it|this|processing|the\s+processing|inference|analysis|the\s+analysis|the\s+model|the\s+ai)\s+(?:run|happen|take\s+place|execute|live)\b/i.test(text)) {
    return "DEPLOYMENT";
  }
  if (/\bwhere\s+(?:does|do|is|are|will)\s+(?:my|the|our)\s+(?:data|video|videos|footage|recordings?|files?)\s+(?:go|stored|kept|end\s+up|held|saved|live)\b/i.test(text)) {
    return "PRIVACY";
  }
  /* "Where has GaitAI been deployed / used / piloted" asks about deployments,
     not for a page; the deployment records and their boundary answer it. */
  if (/\bwhere\s+(?:has|have|is|are|was|were)\s+(?:gaitai|gait\s*ai|it|this|the\s+(?:platform|system))\s+(?:been\s+|already\s+|currently\s+)?(?:deployed|used|installed|running|in\s+use|piloted|live|rolled\s+out|implemented|adopted)\b/i.test(text)) {
    return "DEPLOYMENT";
  }

  if (who && !AUDIENCE_SUBJECT.test(subject)) {
    /* "Who is FallRisk" is a product question phrased loosely; "who is the
       founder" and "who is anubha" are about people. A module name in the
       subject settles it; so does an environment or capability name. */
    if (hints.namesProduct) return "PRODUCT";
    if (hints.namesEnvironment) return "DOMAIN_APPLICATION";
    if (hints.namesCapability) return "CAPABILITY";
    if (/^\s*(?:(?:so|and|ok|okay|hey|hi)[,\s]+)?who/i.test(text) || ROLE_WORDS.test(text)) {
      return "PERSON";
    }
    /* "Tell me about Priya Sharma": a capitalised subject the corpus has no
       word for is a name, and the right answer is the named empty state. */
    if (hints.subjectUnknown && LOOKS_LIKE_NAME.test(subject)) return "PERSON";
  }
  if (ROLE_WORDS.test(text) && /\b(who|whom|whose)\b/i.test(text)) return "PERSON";

  /* A short question that IS a topic word: "papers?", "CCTV?", "founder?". */
  if (hints.elliptical) {
    if (hints.domainSubject && !hints.namesProduct) return "DOMAIN_APPLICATION";
    const byTopic = topicIntent(text);
    if (byTopic) return byTopic;
    if (hints.namesProduct) return "PRODUCT";
    if (hints.namesEnvironment) return "DOMAIN_APPLICATION";
    if (hints.namesCapability) return "CAPABILITY";
  }

  /* A domain — "what can GaitAI do for hospitals", "does GaitAI do military",
     "for defence?" — decides the kind of answer whatever else is said. A
     named module keeps its own intent ("what can WalkScan do for a clinic").
     The explicit recommendation openings count even when the domain is not
     recognised ("what can GaitAI do for astronauts"); the looser "does X work
     with Y" forms count only when Y IS a domain — otherwise "does it work with
     CCTV" is a security question, which it is. */
  if (hints.domainSubject && !hints.namesProduct) return "DOMAIN_APPLICATION";
  if (STRONG_APPLICATION_OPENING.test(text) && applicationSubject(text) !== null && !hints.namesProduct) {
    return "DOMAIN_APPLICATION";
  }

  /* "Where are your publications?" is a navigation question about
     publications, not a publication question — the opening word decides. */
  if (LEADING_NAVIGATION.test(text) && !hints.namesProduct) return "NAVIGATION";

  /* Asking for papers or research ON a topic is a research question even when
     the topic is privacy: "show me research on privacy" wants the research
     area, not the privacy policy. */
  if (INTENTS.PUBLICATION.triggers.some((t) => t.test(text))) return "PUBLICATION";

  /* Commercial and off-topic questions the record cannot answer — before the
     product hints, so "how much does WalkScan cost" is not a product question. */
  if (INTENTS.UNSUPPORTED.triggers.some((t) => t.test(text))) return "UNSUPPORTED";

  /* The platform as a whole — "how does GaitAI work end to end", "explain the
     pipeline", "from video to insight" — before evidence ("does it actually
     work" stays EVIDENCE: its trigger needs "actually/really"), before the
     Insights trigger that "insight" alone would fire, and before PRODUCT. A
     named module keeps PRODUCT: "how does WalkScan work" is its own section. */
  if (INTENTS.ARCHITECTURE.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "ARCHITECTURE";

  if (INTENTS.EVIDENCE.triggers.some((t) => t.test(text))) return "EVIDENCE";
  if (INTENTS.INSIGHTS.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "INSIGHTS";
  if (INTENTS.LAB_DATASET.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "LAB_DATASET";
  if (INTENTS.RESEARCH.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "RESEARCH";

  if (INTENTS.PRIVACY.triggers.some((t) => t.test(text))) return "PRIVACY";
  if (INTENTS.SECURITY.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "SECURITY";
  if (INTENTS.HEALTH_MOBILITY.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "HEALTH_MOBILITY";
  if (INTENTS.DEPLOYMENT.triggers.some((t) => t.test(text)) && !hints.namesProduct) return "DEPLOYMENT";

  if (hints.namesProduct) return "PRODUCT";
  if (hints.namesEnvironment) return "DOMAIN_APPLICATION";
  if (hints.namesCapability) return "CAPABILITY";

  if (INTENTS.DOMAIN_APPLICATION.triggers.some((t) => t.test(text))) return "DOMAIN_APPLICATION";
  if (INTENTS.NAVIGATION.triggers.some((t) => t.test(text))) return "NAVIGATION";
  if (INTENTS.CAPABILITY.triggers.some((t) => t.test(text))) return "CAPABILITY";
  if (INTENTS.PRODUCT.triggers.some((t) => t.test(text))) return "PRODUCT";

  /* Nothing in the question is a word the corpus uses: off-topic. */
  if (hints.knownVocabulary === false) return "UNSUPPORTED";

  return "GENERAL";
}
