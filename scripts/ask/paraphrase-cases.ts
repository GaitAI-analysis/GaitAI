/**
 * ASK GAITAI — THE PARAPHRASE MATRIX
 * =============================================================================
 * Families of questions that must converge on the same intent and the same
 * evidence families, however they are phrased: polished, telegraphic,
 * conversational, misspelt, with pronouns, as follow-ups. None of these
 * sentences is special-cased anywhere in the code; they exercise the
 * understanding stage (understand.ts), the taxonomy (intent.ts) and the
 * ranking (retrieval.ts) together, and the point of the suite is that adding
 * a phrasing here should PASS without a code change. When one does not, the
 * fix belongs in a pattern, a vocabulary entry or a boost — never in a
 * sentence.
 *
 * Each family declares:
 *   intents       the intents any member may classify as
 *   topTypes      record types the FIRST record must be one of
 *   neverTop      record types that must not appear in the first three
 *   neverPresent  record types that must not appear at all (unless the
 *                 question explicitly asks for them — it never does here)
 *   anyOf         record ids of which at least one must be retrieved
 *   history       prior turns for follow-up forms (oldest first)
 *   domain        the domain the understanding must extract (for domain families)
 *   entity        the entity a pronoun must resolve to
 */

import type { DocType } from "../../src/lib/ask/corpus";
import type { Intent } from "../../src/lib/ask/intent";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface ParaphraseFamily {
  name: string;
  intents: Intent[];
  topTypes?: DocType[];
  neverTop?: DocType[];
  neverPresent?: DocType[];
  anyOf?: string[];
  mustInclude?: string[];
  domain?: string | RegExp;
  entity?: string;
  /** Every member must be low confidence (graceful refusal), or must not be. */
  lowConfidence?: boolean;
  history?: Turn[];
  questions: string[];
}

const NOISE: DocType[] = ["person", "talk", "publication", "insight"];
const SECURE_MODULES = [
  "product:suspiciousmotion",
  "product:accessmotion",
  "product:watchlist",
  "product:reid",
  "product:crowdsense",
  "product:campusshield",
  "product:forensicsearch",
  "product:privacyguard",
  "product:industrialsafety",
  "product:eventshield",
  "product:retailguard",
];

export const PARAPHRASE_FAMILIES: ParaphraseFamily[] = [
  // ── Domain: military / defence — nothing documented, capabilities relevant ──
  {
    name: "domain · military / defence",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["product", "use-case", "page"],
    neverTop: NOISE,
    neverPresent: ["person", "talk"],
    anyOf: ["product:defencemotion", "product:suspiciousmotion", "product:accessmotion", "product:watchlist"],
    domain: /military|defen[cs]e|army|armed forces|bases?|restricted/i,
    lowConfidence: false,
    questions: [
      "What can GaitAI do for military?",
      "What could GaitAI do for the military?",
      "does it do military",
      "Does it do military?",
      "military?",
      "for military?",
      "Military use?",
      "army?",
      "defence?",
      "defense?",
      "what about defence",
      "How about defence?",
      "can this work for defence?",
      "Can it work for defence",
      "can it be used at a military base?",
      "Could it be used on an army base?",
      "does GaitAI have defence applications?",
      "Does GaitAI have any defense applications",
      "could SecureVision be relevant to restricted facilities?",
      "Is GaitAI relevant to the armed forces?",
      "gaitai for defence",
      "Would this be useful for the military?",
      "can you help the army",
      "Does GaitAI work with the military?",
      "Does GaitAI have a military product?",
      "is there a defence product",
      "any military deployments?",
      "how would gaitai work in a defence environment",
      "what can u do for military",
      "military bases?",
    ],
  },

  // ── Domain: healthcare environments ─────────────────────────────────────────
  {
    name: "domain · hospitals",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    neverPresent: ["person", "talk"],
    mustInclude: ["use-case:hospitals"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for a hospital?",
      "can it work in hospitals?",
      "hospital?",
      "for hospitals?",
      "How can GaitAI help hospitals?",
      "does it do hospitals",
      "GaitAI for hospitals",
      "would this work in a hospital ward",
      "Can GaitAI be used in a hospital setting?",
      "what about hospitals?",
      "Hospital use?",
      "I run a hospital. What should I use?",
      "is gaitai suitable for hospitals",
    ],
  },
  {
    name: "domain · elderly care",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    neverPresent: ["person", "talk"],
    mustInclude: ["use-case:elderly"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for elderly care?",
      "what about elderly?",
      "for elderly people?",
      "elderly?",
      "can it help elderly people",
      "does it do aged care",
      "GaitAI for nursing homes",
      "Can GaitAI help in a care home?",
      "how can gaitai help older adults",
      "senior care?",
    ],
  },
  {
    name: "domain · rehabilitation",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    mustInclude: ["use-case:physio"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for rehabilitation?",
      "for rehab?",
      "rehab?",
      "can it be used in physiotherapy?",
      "does it do rehab",
      "GaitAI for physio clinics",
      "how would gaitai work in a rehab centre",
      "I run a physiotherapy clinic. What should I use?",
    ],
  },

  // ── Domain: transport, industry, campus, retail, events, public safety ─────
  {
    name: "domain · airports, rail, transit",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    neverPresent: ["person", "talk"],
    mustInclude: ["use-case:airports"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for an airport?",
      "airports?",
      "for railway stations?",
      "What can GaitAI do for a railway station?",
      "does it do metro stations",
      "can it work in a train station?",
      "what about transit hubs",
      "GaitAI for public transport",
      "how about airports",
      "railway?",
    ],
  },
  {
    name: "domain · factories & warehouses",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    mustInclude: ["use-case:factories"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for a factory?",
      "factories?",
      "for warehouses?",
      "does it do industrial sites",
      "can it work in a manufacturing plant?",
      "Which GaitAI products for factories?",
      "what about warehouses",
      "GaitAI for logistics",
    ],
  },
  {
    name: "domain · campuses",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    mustInclude: ["use-case:campuses"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for a university campus?",
      "campus?",
      "for universities?",
      "does it do corporate campuses",
      "can it work at a university",
      "what about office parks",
      "GaitAI for colleges",
    ],
  },
  {
    name: "domain · retail, events, public safety",
    intents: ["DOMAIN_APPLICATION"],
    topTypes: ["use-case", "product"],
    neverTop: NOISE,
    anyOf: ["use-case:retail", "use-case:events", "use-case:smartcities"],
    lowConfidence: false,
    questions: [
      "What can GaitAI do for retail?",
      "shopping malls?",
      "for stadiums?",
      "does it do concerts",
      "What can GaitAI do for public safety?",
      "smart cities?",
      "can it help the police",
      "GaitAI for large events",
      "what about supermarkets",
    ],
  },

  // ── Security capabilities ───────────────────────────────────────────────────
  {
    name: "security · surveillance, CCTV, monitoring, intrusion, tracking",
    intents: ["SECURITY", "DEPLOYMENT", "CAPABILITY", "PRODUCT"],
    topTypes: ["product", "use-case", "capability", "signal", "policy", "deployment", "page"],
    neverTop: NOISE,
    neverPresent: ["person", "talk"],
    anyOf: [...SECURE_MODULES, "deployment-faq:1", "policy:responsible-use", "page:/securevision"],
    lowConfidence: false,
    questions: [
      "Does GaitAI do surveillance?",
      "does it do surveillance?",
      "surveillance?",
      "can it monitor people?",
      "Can GaitAI monitor people in a building?",
      "CCTV?",
      "does this work with CCTV?",
      "Does it use CCTV?",
      "can it detect intrusion?",
      "what about perimeter security?",
      "Can it detect someone entering a restricted area?",
      "does it track people",
      "Can GaitAI track a person across cameras?",
      "suspicious movement?",
      "can it spot loitering",
      "does it identify people",
      "security cameras?",
      "can it watch a perimeter",
      "tailgating detection?",
      "Does GaitAI do crowd monitoring?",
    ],
  },

  // ── Health / mobility capabilities ──────────────────────────────────────────
  {
    name: "health · falls, gait, mobility",
    intents: ["HEALTH_MOBILITY", "CAPABILITY", "PRODUCT", "DOMAIN_APPLICATION"],
    topTypes: ["product", "use-case", "capability", "signal", "page"],
    neverTop: NOISE,
    neverPresent: ["talk"],
    anyOf: [
      "product:fallrisk",
      "product:seniorcare",
      "product:watchcare",
      "product:walkscan",
      "product:rehabtrack",
      "product:neuromotion",
      "capability:sig-fall-risk",
      "capability:sig-balance",
      "capability:sig-walking-speed",
      "capability:cap-gait",
      "use-case:elderly",
    ],
    lowConfidence: false,
    questions: [
      "can this detect falls",
      "Can it detect falls?",
      "fall risk?",
      "can it help with fall risk?",
      "Does GaitAI measure fall risk?",
      "does it measure gait speed",
      "can it assess balance",
      "walking speed?",
      "Does GaitAI diagnose Parkinson's?",
      "can it monitor mobility decline",
      "does it track rehab progress",
      "gait analysis?",
      "can it analyse someone's walk",
      "what about balance problems",
    ],
  },

  // ── People ─────────────────────────────────────────────────────────────────
  {
    name: "person · the founder",
    intents: ["PERSON"],
    topTypes: ["person"],
    neverTop: ["policy", "deployment", "page", "product", "use-case", "talk"],
    mustInclude: ["person:anubha-parashar"],
    lowConfidence: false,
    questions: [
      "Who is Anubha?",
      "who is anubha parashar",
      "founder?",
      "Who founded GaitAI?",
      "who's behind gaitai",
      "tell me about the founder",
      "Who is Dr. Anubha Parashar?",
      "who runs gaitai",
      "who is anubah",
      "Who created this?",
    ],
  },
  {
    name: "person · a co-author",
    intents: ["PERSON"],
    topTypes: ["person"],
    mustInclude: ["person:apoorva-parashar"],
    lowConfidence: false,
    questions: ["Who is Apoorva?", "who is apoorva parashar", "tell me about Apoorva Parashar", "Apoorva?"],
  },

  // ── Publications ───────────────────────────────────────────────────────────
  {
    name: "publication · papers, patents",
    intents: ["PUBLICATION"],
    topTypes: ["publication", "page", "research"],
    neverTop: ["person", "talk", "product", "policy"],
    anyOf: ["page:/publications", "publication:patent-covariate-gait-edge", "publication:dsp-2024", "publication:iet-pose-2022"],
    lowConfidence: false,
    questions: [
      "What publications does GaitAI have?",
      "papers?",
      "publications?",
      "show me your papers",
      "which patents does gaitai hold",
      "research articles on gait recognition",
      "any peer-reviewed work?",
      "what has gaitai published",
      "list the publications",
      "patent?",
    ],
  },

  // ── Research ───────────────────────────────────────────────────────────────
  {
    name: "research · areas and science",
    intents: ["RESEARCH", "PUBLICATION", "CAPABILITY"],
    topTypes: ["research", "page", "publication", "capability"],
    neverTop: ["person", "talk", "policy"],
    anyOf: ["page:/research", "research:res-privacy", "research:res-pose-gait", "research:res-gait-biometrics", "research:res-edge", "page:/research/evidence"],
    lowConfidence: false,
    questions: [
      "What does GaitAI research?",
      "research?",
      "what's the science behind gaitai",
      "Show me research on privacy.",
      "what research areas does gaitai cover",
      "is there research on pose-based gait",
      "what studies back this",
    ],
  },

  // ── Privacy ────────────────────────────────────────────────────────────────
  {
    name: "privacy · data handling",
    intents: ["PRIVACY"],
    topTypes: ["page", "policy", "deployment"],
    neverTop: ["person", "talk", "product", "use-case", "publication", "research"],
    anyOf: ["page:/legal/privacy", "policy:privacy-controls", "page:/trust", "page:/legal/security"],
    lowConfidence: false,
    questions: [
      "What does GaitAI say about privacy?",
      "privacy?",
      "what about privacy",
      "how is my uploaded video handled",
      "do you store faces",
      "Is my data anonymised?",
      "how long is footage retained",
      "does it need consent",
      "what happens to my video",
      "GDPR?",
    ],
  },

  // ── Deployment ─────────────────────────────────────────────────────────────
  {
    name: "deployment · inputs, integration, pilots",
    intents: ["DEPLOYMENT", "CAPABILITY", "PRODUCT", "SECURITY"],
    topTypes: ["deployment", "product", "use-case", "page", "policy"],
    neverTop: NOISE,
    anyOf: ["deployment-faq:0", "deployment-faq:1", "deployment-faq:2", "deployment-faq:3", "deployment-faq:5", "deployment-faq:7", "deployment:process", "page:/trust"],
    lowConfidence: false,
    questions: [
      "How does GaitAI integrate?",
      "what input does it need?",
      "does that need a camera?",
      "how do we start a pilot",
      "deployment?",
      "where does the processing run",
      "can we use our existing cameras",
      "is there an API",
      "how does a deployment start",
      "what hardware is required",
    ],
  },

  // ── Insights ───────────────────────────────────────────────────────────────
  {
    name: "insights · the blog",
    intents: ["INSIGHTS", "NAVIGATION"],
    topTypes: ["page", "insight"],
    neverTop: ["person", "talk", "product"],
    anyOf: ["page:/insights", "insight:from-walking-video-to-movement-intelligence", "insight:your-walk-is-more-than-a-biometric", "insight:movement-intelligence-without-identification"],
    lowConfidence: false,
    questions: [
      "What are the latest GaitAI Insights?",
      "articles?",
      "what's new on the blog",
      "anything to read about privacy?",
      "latest insights",
      "show me the blog",
      "recent articles",
    ],
  },

  // ── Labs / dataset ─────────────────────────────────────────────────────────
  {
    name: "labs · dataset, biometrics lab, demo",
    intents: ["LAB_DATASET", "NAVIGATION", "PRODUCT"],
    topTypes: ["page"],
    neverTop: NOISE,
    anyOf: ["page:/labs", "page:/labs/biometrics", "page:/labs/dataset", "page:/movement-lab"],
    lowConfidence: false,
    questions: [
      "What happens in the Biometrics Lab?",
      "dataset?",
      "is there a demo",
      "what experiments can I try",
      "tell me about GaitAI Labs",
      "can I try it in my browser",
      "gait dataset?",
      "what is the movement lab",
    ],
  },

  // ── Evidence ───────────────────────────────────────────────────────────────
  {
    name: "evidence · validation, accuracy, certification",
    intents: ["EVIDENCE"],
    topTypes: ["product", "policy", "page", "research", "deployment"],
    neverTop: ["person", "talk", "insight"],
    lowConfidence: false,
    questions: [
      "Is WalkScan clinically validated?",
      "What accuracy does FallRisk achieve?",
      "accuracy?",
      "is it certified",
      "how reliable is it",
      "is gaitai FDA approved",
      "has this been validated",
      "what's the evidence for fall detection",
    ],
  },

  // ── Comparison ─────────────────────────────────────────────────────────────
  {
    name: "comparison · two modules or families",
    intents: ["COMPARISON"],
    topTypes: ["product", "page"],
    neverTop: NOISE,
    lowConfidence: false,
    questions: [
      "What is the difference between CrowdSense and SuspiciousMotion?",
      "WalkScan vs RehabTrack",
      "compare FallRisk and SeniorCare",
      "MobilityCare versus SecureVision",
      "should I use ReID or ForensicSearch",
    ],
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  {
    name: "navigation · where things are",
    intents: ["NAVIGATION"],
    topTypes: ["page"],
    neverTop: ["person", "talk"],
    lowConfidence: false,
    questions: ["Where can I try GaitAI?", "Where are your publications?", "take me to the trust center", "where is the contact form", "where can I find the use cases"],
  },

  // ── Products ───────────────────────────────────────────────────────────────
  {
    name: "product · named modules",
    intents: ["PRODUCT"],
    topTypes: ["product"],
    neverTop: NOISE,
    lowConfidence: false,
    questions: ["What is WalkScan?", "walkscan?", "tell me about fallrisk", "what does PrivacyGuard do", "How does ReID work?", "SuspiciousMotion?", "explain CrowdSense"],
  },

  // ── Unsupported ────────────────────────────────────────────────────────────
  {
    name: "unsupported · pricing, customers, off-topic",
    intents: ["UNSUPPORTED"],
    neverTop: ["person", "talk"],
    lowConfidence: true,
    questions: [
      "Which Fortune 500 companies use GaitAI?",
      "how much does it cost",
      "pricing?",
      "who are your customers",
      "are you hiring",
      "what's the weather today",
      "tell me a joke",
      "how much is a licence",
    ],
  },

  // ── Follow-ups: the conversation decides what "it" and "what about" mean ────
  {
    name: "follow-up · 'it' is SecureVision",
    intents: ["SECURITY", "DEPLOYMENT", "CAPABILITY", "PRODUCT"],
    entity: "securevision",
    neverTop: NOISE,
    anyOf: ["page:/securevision", ...SECURE_MODULES, "deployment-faq:1"],
    lowConfidence: false,
    history: [
      { role: "user", content: "What is SecureVision?" },
      { role: "assistant", content: "SecureVision is the GaitAI family for privacy-aware security, safety and operations movement intelligence." },
    ],
    questions: ["Does it use CCTV?", "does it work with existing cameras", "can it track people?", "what does it detect"],
  },
  {
    name: "follow-up · 'it' is MobilityCare",
    intents: ["HEALTH_MOBILITY", "DOMAIN_APPLICATION", "CAPABILITY", "PRODUCT"],
    entity: "mobilitycare",
    neverTop: NOISE,
    anyOf: ["page:/mobilitycare", "use-case:elderly", "product:fallrisk", "product:seniorcare", "product:watchcare"],
    lowConfidence: false,
    history: [
      { role: "user", content: "Tell me about MobilityCare." },
      { role: "assistant", content: "MobilityCare is the GaitAI family for clinical, rehabilitation, sports and elderly-care movement intelligence." },
    ],
    questions: ["Can it help elderly people?", "does it detect falls", "can it be used in rehab?"],
  },
  {
    name: "follow-up · domain changes, intent carries",
    intents: ["DOMAIN_APPLICATION"],
    domain: /military|defen[cs]e|army/i,
    neverTop: NOISE,
    neverPresent: ["person", "talk"],
    anyOf: ["product:suspiciousmotion", "product:accessmotion", "product:watchlist"],
    lowConfidence: false,
    history: [
      { role: "user", content: "What can GaitAI do for hospitals?" },
      { role: "assistant", content: "GaitAI documents Hospitals as a deployment environment with FallRisk, NeuroMotion and OrthoMotion." },
    ],
    questions: ["What about military?", "and defence?", "how about the army", "military?"],
  },
  {
    name: "follow-up · 'she' is Anubha",
    intents: ["PERSON"],
    entity: "anubha-parashar",
    topTypes: ["person"],
    mustInclude: ["person:anubha-parashar"],
    lowConfidence: false,
    history: [
      { role: "user", content: "Who is Anubha?" },
      { role: "assistant", content: "Anubha Parashar is the founder of GaitAI." },
    ],
    questions: ["What papers did she write?", "which publications did she author", "what has she published", "tell me more about her research"],
  },
  {
    name: "follow-up · 'it' with no prior entity is GaitAI",
    intents: ["DOMAIN_APPLICATION", "SECURITY", "HEALTH_MOBILITY", "CAPABILITY", "DEPLOYMENT"],
    entity: "gaitai",
    neverTop: NOISE,
    lowConfidence: false,
    questions: ["does it do military", "can it work in hospitals", "does it use CCTV", "can this detect falls", "does it track people", "does that need a camera?"],
  },

  // ── The platform as a mechanism: how it works, end to end ──────────────────
  {
    name: "architecture — how the platform works",
    intents: ["ARCHITECTURE"],
    topTypes: ["page"],
    /* The essay "From walking video to movement intelligence" is a legitimate
       neighbour of these questions; people, talks, papers and environments
       are not. */
    neverTop: ["person", "talk", "publication", "use-case", "deployment"],
    anyOf: ["platform:gaitai-end-to-end"],
    lowConfidence: false,
    questions: [
      "How does GaitAI work?",
      "How does GaitAI work end to end?",
      "how does it work end to end",
      "Explain the GaitAI pipeline",
      "explain the pipeline",
      "What happens from walking video to insight?",
      "What happens from video to report?",
      "How does the platform process movement?",
      "How does a camera input become a report?",
      "What's the end-to-end workflow?",
      "How does GaitAI turn walking video into intelligence?",
      "Explain the architecture",
      "how does the whole system fit together",
      "walk me through the pipeline step by step",
      "what are the stages of the pipeline",
      "how does gaitai convert movement into a report",
      "pipeline?",
      "architecture?",
    ],
  },
];
