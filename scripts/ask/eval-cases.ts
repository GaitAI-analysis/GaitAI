/**
 * ASK GAITAI — THE RETRIEVAL EVALUATION SET
 * =============================================================================
 * Natural-language questions with the canonical records that count as a
 * relevant answer, used to score retrieval SYSTEMS against each other:
 *
 *   A  lexical           the deterministic engine alone
 *   B  semantic          embedding similarity alone
 *   C  hybrid + rerank   both, merged, then reranked
 *
 * `relevant` is ANY-OF: a question about the founder is answered by her record;
 * a question about surveillance by any of the SecureVision modules that surface
 * suspicious movement, or the family page, or the CCTV deployment FAQ. Ids are
 * taken from the generated corpus (public/ask/knowledge.json), never guessed.
 * `wrongTypes` are the record types that must not lead the answer — the noise
 * these questions used to retrieve. `history` supplies the conversation for
 * follow-up forms, oldest first.
 *
 * Metrics (scripts/ask-eval.ts): top-1 relevance, top-3 recall, top-7 recall,
 * wrong-family rate, refusal behaviour. Families are deliberately broad —
 * people, products, health, security, domains, privacy, publications,
 * research, labs, inputs, comparisons, short phrases, pronouns, misspellings,
 * follow-ups — so a system cannot win by memorising one phrasing.
 */

import type { DocType } from "../../src/lib/ask/corpus";

export interface EvalTurn {
  role: "user" | "assistant";
  content: string;
}

export interface EvalCase {
  q: string;
  family: string;
  /** Any of these ids in the top k counts as a hit. */
  relevant: string[];
  /** Record types that must not lead. */
  wrongTypes?: DocType[];
  /** The question should REFUSE (low confidence) rather than answer. */
  expectRefusal?: boolean;
  history?: EvalTurn[];
}

const NOISE: DocType[] = ["person", "talk", "publication", "insight"];
const SECURE = [
  "page:/securevision",
  "product:suspiciousmotion",
  "product:accessmotion",
  "product:watchlist",
  "product:reid",
  "product:crowdsense",
  "product:campusshield",
  "product:forensicsearch",
  "product:industrialsafety",
  "product:eventshield",
  "product:retailguard",
  "product:privacyguard",
];
const DEFENCE = ["product:suspiciousmotion", "product:accessmotion", "product:watchlist", "page:/securevision", "product:campusshield"];
const CCTV = ["deployment-faq:1", "product:suspiciousmotion", "product:crowdsense", "product:reid", "product:forensicsearch", "product:campusshield", "page:/securevision", "capability:cap-anomaly", "capability:cap-trajectory"];
const TRACKING = ["product:reid", "product:suspiciousmotion", "product:forensicsearch", "capability:cap-reid", "capability:cap-trajectory", "capability:sig-trajectory", "policy:responsible-use", "page:/securevision"];
const FALLS = ["product:fallrisk", "product:seniorcare", "product:watchcare", "product:industrialsafety", "capability:sig-fall-risk", "capability:cap-risk", "use-case:elderly"];
const ELDERLY = ["use-case:elderly", "product:fallrisk", "product:seniorcare", "product:watchcare", "use-case:homecare", "page:/mobilitycare"];
const HOSPITALS = ["use-case:hospitals", "product:fallrisk", "product:neuromotion", "product:orthomotion", "page:/mobilitycare"];
const AIRPORTS = ["use-case:airports", "product:crowdsense", "product:reid", "product:suspiciousmotion"];
const FACTORIES = ["use-case:factories", "product:industrialsafety", "product:suspiciousmotion"];
const PUBLIC_SAFETY = ["use-case:smartcities", "product:crowdsense", "product:eventshield", "use-case:events", "product:forensicsearch", "product:privacyguard", "page:/securevision"];
const PUBS = ["page:/publications", "publication:patent-covariate-gait-edge", "publication:dsp-2024", "publication:iet-pose-2022", "publication:ai-review-2023", "publication:eaai-2024", "publication:neurocomputing-2022", "publication:prl-2023", "publication:ivc-2023", "publication:iet-privacy-2022"];
const PRIVACY = ["page:/legal/privacy", "policy:privacy-controls", "page:/trust", "page:/legal/security", "product:privacyguard", "deployment-faq:3"];
const RESEARCH = ["page:/research", "page:/research/evidence", "research:res-privacy", "research:res-pose-gait", "research:res-gait-biometrics", "research:res-edge"];
const LABS = ["page:/labs", "page:/labs/biometrics", "page:/labs/dataset", "page:/movement-lab"];
const INPUTS = ["deployment-faq:0", "deployment-faq:1", "deployment-faq:2", "deployment-faq:3", "deployment-faq:5", "deployment:process", "page:/trust"];

export const EVAL_CASES: EvalCase[] = [
  // ── People ────────────────────────────────────────────────────────────────
  { q: "Who is Anubha?", family: "people", relevant: ["person:anubha-parashar"], wrongTypes: ["policy", "deployment", "page", "product", "use-case", "talk"] },
  { q: "who founded gaitai", family: "people", relevant: ["person:anubha-parashar"], wrongTypes: ["policy", "deployment", "page", "product", "use-case", "talk"] },
  { q: "founder?", family: "people", relevant: ["person:anubha-parashar"], wrongTypes: ["policy", "deployment", "product", "use-case", "talk"] },
  { q: "who is anubah", family: "people · misspelt", relevant: ["person:anubha-parashar"], wrongTypes: ["policy", "deployment", "page", "product", "use-case", "talk"] },
  { q: "Who is Apoorva?", family: "people", relevant: ["person:apoorva-parashar"], wrongTypes: ["policy", "deployment", "page", "product", "use-case", "talk"] },
  { q: "who is behind this company", family: "people", relevant: ["person:anubha-parashar", "page:/"], wrongTypes: ["talk", "publication"] },

  // ── Products ──────────────────────────────────────────────────────────────
  { q: "What is WalkScan?", family: "products", relevant: ["product:walkscan"], wrongTypes: NOISE },
  { q: "walkscan", family: "products · bare", relevant: ["product:walkscan"], wrongTypes: NOISE },
  { q: "what does PrivacyGuard do", family: "products", relevant: ["product:privacyguard"], wrongTypes: NOISE },
  { q: "tell me about fallrisk", family: "products", relevant: ["product:fallrisk"], wrongTypes: NOISE },
  { q: "How does ReID work?", family: "products", relevant: ["product:reid", "product:reid#how-it-works"], wrongTypes: NOISE },
  { q: "What is MobilityCare?", family: "products · family", relevant: ["page:/mobilitycare"], wrongTypes: NOISE },
  { q: "What is SecureVision?", family: "products · family", relevant: ["page:/securevision"], wrongTypes: NOISE },
  { q: "What is GaitAI?", family: "products · company", relevant: ["page:/"], wrongTypes: NOISE },
  { q: "which product turns a walking video into a report", family: "products · described", relevant: ["product:walkscan"], wrongTypes: NOISE },
  { q: "is there a module for prosthetic fitting", family: "products · described", relevant: ["product:prostheticfit", "use-case:prosthetics"], wrongTypes: NOISE },

  // ── Health / mobility ─────────────────────────────────────────────────────
  { q: "can this detect falls", family: "health", relevant: FALLS, wrongTypes: NOISE },
  { q: "fall risk?", family: "health · short", relevant: FALLS, wrongTypes: NOISE },
  { q: "Does GaitAI diagnose Parkinson's?", family: "health", relevant: ["product:neuromotion", "use-case:neuro"], wrongTypes: NOISE },
  { q: "does it measure walking speed", family: "health · pronoun", relevant: ["capability:sig-walking-speed", "product:walkscan", "product:seniorcare", "product:rehabtrack"], wrongTypes: NOISE },
  { q: "can it help elderly people?", family: "health · pronoun", relevant: ELDERLY, wrongTypes: NOISE },
  { q: "rehab progress tracking", family: "health · short", relevant: ["product:rehabtrack", "capability:sig-rehab-progress", "use-case:physio"], wrongTypes: NOISE },
  { q: "what can it do for stroke recovery", family: "health · pronoun", relevant: ["product:neuromotion", "product:rehabtrack", "use-case:neuro", "use-case:physio"], wrongTypes: NOISE },

  // ── Security ──────────────────────────────────────────────────────────────
  { q: "does GaitAI do surveillance?", family: "security", relevant: SECURE, wrongTypes: NOISE },
  { q: "surveillance?", family: "security · short", relevant: SECURE, wrongTypes: NOISE },
  { q: "does it track people?", family: "security · pronoun", relevant: TRACKING, wrongTypes: NOISE },
  { q: "can it use CCTV?", family: "security · pronoun", relevant: CCTV, wrongTypes: NOISE },
  { q: "can it detect intrusion?", family: "security · pronoun", relevant: ["product:suspiciousmotion", "product:campusshield", "product:industrialsafety", "capability:cap-anomaly"], wrongTypes: NOISE },
  { q: "what about perimeter security?", family: "security · follow-up form", relevant: ["product:suspiciousmotion", "product:campusshield", "page:/securevision"], wrongTypes: NOISE },
  { q: "can it monitor a crowd", family: "security · pronoun", relevant: ["product:crowdsense", "product:eventshield", "capability:sig-crowd-flow", "use-case:events", "use-case:smartcities"], wrongTypes: NOISE },
  { q: "searching recorded footage after an incident", family: "security · described", relevant: ["product:forensicsearch"], wrongTypes: NOISE },
  { q: "loitering detection", family: "security · short", relevant: ["product:suspiciousmotion", "product:retailguard", "capability:cap-anomaly", "capability:sig-behaviour"], wrongTypes: NOISE },

  // ── Domains ───────────────────────────────────────────────────────────────
  { q: "does it do military", family: "domain · defence", relevant: DEFENCE, wrongTypes: NOISE },
  { q: "military?", family: "domain · defence", relevant: DEFENCE, wrongTypes: NOISE },
  { q: "what about defence", family: "domain · defence", relevant: DEFENCE, wrongTypes: NOISE },
  { q: "what can GaitAI do for military?", family: "domain · defence", relevant: DEFENCE, wrongTypes: NOISE },
  { q: "Does GaitAI work with the military?", family: "domain · defence · relationship", relevant: DEFENCE, wrongTypes: NOISE },
  { q: "can it be used at an army base", family: "domain · defence", relevant: DEFENCE, wrongTypes: NOISE },
  { q: "what about hospitals?", family: "domain · health", relevant: HOSPITALS, wrongTypes: NOISE },
  { q: "can it work in hospitals", family: "domain · health", relevant: HOSPITALS, wrongTypes: NOISE },
  { q: "what can it do in airports?", family: "domain · transit", relevant: AIRPORTS, wrongTypes: NOISE },
  { q: "railway stations?", family: "domain · transit · short", relevant: AIRPORTS, wrongTypes: NOISE },
  { q: "can it work in factories?", family: "domain · industrial", relevant: FACTORIES, wrongTypes: NOISE },
  { q: "warehouse safety", family: "domain · industrial · short", relevant: FACTORIES, wrongTypes: NOISE },
  { q: "what does it do for public safety?", family: "domain · public safety", relevant: PUBLIC_SAFETY, wrongTypes: NOISE },
  { q: "smart city?", family: "domain · public safety · short", relevant: ["use-case:smartcities", "product:crowdsense", "product:privacyguard"], wrongTypes: NOISE },
  { q: "I run a physiotherapy clinic. What should I use?", family: "domain · health", relevant: ["use-case:physio", "product:walkscan", "product:rehabtrack"], wrongTypes: NOISE },
  { q: "universities?", family: "domain · campus · short", relevant: ["use-case:campuses", "product:campusshield", "product:accessmotion"], wrongTypes: NOISE },
  { q: "stadium crowd risk", family: "domain · events · short", relevant: ["use-case:events", "product:eventshield", "product:crowdsense"], wrongTypes: NOISE },
  { q: "retail loss prevention", family: "domain · retail · short", relevant: ["use-case:retail", "product:retailguard"], wrongTypes: NOISE },

  // ── Privacy ───────────────────────────────────────────────────────────────
  { q: "What does GaitAI say about privacy?", family: "privacy", relevant: PRIVACY, wrongTypes: ["person", "talk", "publication", "insight", "product", "use-case"] },
  { q: "privacy?", family: "privacy · short", relevant: PRIVACY, wrongTypes: ["person", "talk", "publication", "insight", "product", "use-case"] },
  { q: "what happens to my video", family: "privacy · pronoun", relevant: PRIVACY, wrongTypes: ["person", "talk", "publication", "insight"] },
  { q: "do you store faces", family: "privacy", relevant: [...PRIVACY, "product:privacyguard"], wrongTypes: ["person", "talk", "publication", "insight"] },
  { q: "is the data anonymised", family: "privacy", relevant: [...PRIVACY, "capability:cap-privacy"], wrongTypes: ["person", "talk", "publication", "insight"] },

  // ── Publications ──────────────────────────────────────────────────────────
  { q: "What publications does GaitAI have?", family: "publications", relevant: PUBS, wrongTypes: ["person", "talk", "product", "use-case", "policy"] },
  { q: "papers?", family: "publications · short", relevant: PUBS, wrongTypes: ["person", "talk", "product", "use-case", "policy"] },
  { q: "which patents does gaitai hold", family: "publications", relevant: ["publication:patent-covariate-gait-edge", "page:/publications"], wrongTypes: ["person", "talk", "product", "use-case", "policy"] },
  { q: "papers on gait recognition", family: "publications", relevant: ["publication:dsp-2024", "publication:iet-pose-2022", "publication:ai-review-2023", "publication:eaai-2024", "publication:neurocomputing-2022", "publication:prl-2023", "publication:ivc-2023", "research:res-gait-biometrics", "page:/publications"], wrongTypes: ["person", "talk", "product", "use-case", "policy"] },

  // ── Research ──────────────────────────────────────────────────────────────
  { q: "What does GaitAI research?", family: "research", relevant: RESEARCH, wrongTypes: ["person", "talk", "policy", "product"] },
  { q: "research?", family: "research · short", relevant: RESEARCH, wrongTypes: ["person", "talk", "policy", "product"] },
  { q: "Show me research on privacy.", family: "research", relevant: ["research:res-privacy"], wrongTypes: ["person", "talk", "policy", "product"] },
  { q: "what's the science behind gait recognition", family: "research", relevant: ["research:res-gait-biometrics", "research:res-pose-gait", "capability:cap-gait", "capability:cap-biometrics", "page:/research"], wrongTypes: ["person", "talk", "policy"] },

  // ── Labs ──────────────────────────────────────────────────────────────────
  { q: "What happens in the Biometrics Lab?", family: "labs", relevant: ["page:/labs/biometrics", "page:/labs"], wrongTypes: NOISE },
  { q: "dataset?", family: "labs · short", relevant: ["page:/labs/dataset", "page:/labs"], wrongTypes: NOISE },
  { q: "is there a demo I can try", family: "labs", relevant: ["page:/movement-lab", "page:/labs"], wrongTypes: NOISE },

  // ── Inputs / deployment ───────────────────────────────────────────────────
  { q: "what input does it need?", family: "inputs · pronoun", relevant: INPUTS, wrongTypes: NOISE },
  { q: "does that need a camera?", family: "inputs · pronoun", relevant: INPUTS, wrongTypes: NOISE },
  { q: "can we use our existing cameras", family: "inputs", relevant: INPUTS, wrongTypes: NOISE },
  { q: "where does the processing run", family: "inputs", relevant: ["deployment-faq:3", "page:/trust", "page:/legal/security"], wrongTypes: NOISE },
  { q: "how do we start a pilot", family: "inputs", relevant: ["deployment:process", "deployment-faq:7", "page:/trust", "page:/#contact"], wrongTypes: NOISE },
  { q: "does it work with wearables", family: "inputs · pronoun", relevant: ["deployment-faq:2", "product:watchcare", "capability:cap-fusion"], wrongTypes: NOISE },

  // ── Comparisons ───────────────────────────────────────────────────────────
  { q: "What is the difference between CrowdSense and SuspiciousMotion?", family: "comparison", relevant: ["product:crowdsense", "product:suspiciousmotion", "comparison:suspiciousmotion-crowdsense"], wrongTypes: NOISE },
  { q: "WalkScan vs RehabTrack", family: "comparison · short", relevant: ["product:walkscan", "product:rehabtrack", "comparison:walkscan-rehabtrack"], wrongTypes: NOISE },
  { q: "MobilityCare versus SecureVision", family: "comparison · families", relevant: ["page:/mobilitycare", "page:/securevision"], wrongTypes: NOISE },

  // ── Insights ──────────────────────────────────────────────────────────────
  { q: "What are the latest GaitAI Insights?", family: "insights", relevant: ["page:/insights", "insight:from-walking-video-to-movement-intelligence", "insight:your-walk-is-more-than-a-biometric"], wrongTypes: ["person", "talk", "product"] },
  { q: "anything to read about fusion", family: "insights", relevant: ["insight:when-fusion-looks-better-than-it-is", "page:/insights", "capability:cap-fusion"], wrongTypes: ["person", "talk"] },

  // ── Described, not named — the words a visitor uses, not the site's ──────
  // No module name, no taxonomy keyword: the case semantic retrieval exists for.
  { q: "someone keeps wandering around the storage area at night", family: "described · security", relevant: ["product:suspiciousmotion", "product:industrialsafety", "product:campusshield", "product:retailguard", "capability:sig-behaviour", "capability:cap-anomaly"], wrongTypes: NOISE },
  { q: "we want to know if patients are getting steadier after surgery", family: "described · health", relevant: ["product:rehabtrack", "product:walkscan", "product:orthomotion", "capability:sig-rehab-progress", "capability:sig-balance", "use-case:physio", "use-case:hospitals"], wrongTypes: NOISE },
  { q: "can you tell if a shopper is behaving oddly", family: "described · retail", relevant: ["product:retailguard", "product:suspiciousmotion", "use-case:retail", "capability:cap-anomaly", "capability:sig-behaviour"], wrongTypes: NOISE },
  { q: "spot the same person on two different cameras", family: "described · reid", relevant: ["product:reid", "capability:cap-reid", "product:forensicsearch"], wrongTypes: NOISE },
  { q: "my grandmother lives alone, can this warn us if something is wrong", family: "described · home care", relevant: ["product:seniorcare", "product:watchcare", "use-case:homecare", "use-case:elderly", "product:fallrisk", "product:remotecare"], wrongTypes: NOISE },
  { q: "checking whether an athlete moves symmetrically", family: "described · sports", relevant: ["product:sportsmotion", "capability:sig-step-symmetry", "use-case:sports", "use-case:fitness"], wrongTypes: NOISE },
  { q: "figure out where people bunch up in a stadium", family: "described · crowd", relevant: ["product:crowdsense", "product:eventshield", "capability:sig-crowd-flow", "use-case:events"], wrongTypes: NOISE },
  { q: "reading how someone walks from a smartwatch", family: "described · wearable", relevant: ["product:watchcare", "deployment-faq:2", "capability:cap-fusion"], wrongTypes: NOISE },
  { q: "does the model run on the device or in the cloud", family: "described · edge", relevant: ["deployment-faq:3", "capability:cap-edge", "research:res-edge", "page:/trust"], wrongTypes: NOISE },
  { q: "checking the fit of an artificial leg", family: "described · prosthetics", relevant: ["product:prostheticfit", "use-case:prosthetics"], wrongTypes: NOISE },
  { q: "let people through a door based on how they walk", family: "described · access", relevant: ["product:accessmotion", "capability:cap-biometrics", "capability:sig-gait-identity"], wrongTypes: NOISE },
  { q: "who wrote the science this is built on", family: "described · people", relevant: ["person:anubha-parashar", "page:/research", "page:/publications"], wrongTypes: ["talk", "product", "use-case"] },
  { q: "kids with walking difficulties", family: "described · pediatric", relevant: ["product:pediatricmotion", "use-case:schools"], wrongTypes: NOISE },
  { q: "measuring how shaky someone's hands and steps are", family: "described · neuro", relevant: ["product:neuromotion", "capability:sig-tremor-neuro", "use-case:neuro"], wrongTypes: NOISE },
  { q: "keeping workers safe around heavy machinery", family: "described · industrial", relevant: ["product:industrialsafety", "use-case:factories"], wrongTypes: NOISE },
  { q: "can it tell a real fall from someone sitting down quickly", family: "described · falls", relevant: FALLS, wrongTypes: NOISE },

  // ── Refusals ──────────────────────────────────────────────────────────────
  { q: "Which Fortune 500 companies use GaitAI?", family: "refusal · customers", relevant: [], expectRefusal: true },
  { q: "how much does it cost", family: "refusal · pricing", relevant: [], expectRefusal: true },
  { q: "what's the weather today", family: "refusal · off-topic", relevant: [], expectRefusal: true },
  { q: "who is john smith", family: "refusal · unknown person", relevant: [], expectRefusal: true },

  // ── Follow-ups ────────────────────────────────────────────────────────────
  {
    q: "does it use CCTV?",
    family: "follow-up · SecureVision",
    relevant: [...CCTV, "page:/securevision"],
    wrongTypes: NOISE,
    history: [
      { role: "user", content: "What is SecureVision?" },
      { role: "assistant", content: "SecureVision is the GaitAI family for privacy-aware security movement intelligence." },
    ],
  },
  {
    q: "can it help elderly people?",
    family: "follow-up · MobilityCare",
    relevant: ELDERLY,
    wrongTypes: NOISE,
    history: [
      { role: "user", content: "Tell me about MobilityCare" },
      { role: "assistant", content: "MobilityCare is the clinical family." },
    ],
  },
  {
    q: "what about military?",
    family: "follow-up · domain change",
    relevant: DEFENCE,
    wrongTypes: NOISE,
    history: [
      { role: "user", content: "What can GaitAI do for hospitals?" },
      { role: "assistant", content: "GaitAI documents Hospitals as a deployment environment." },
    ],
  },
  {
    q: "what papers did she write?",
    family: "follow-up · she",
    relevant: ["person:anubha-parashar", ...PUBS.slice(1)],
    wrongTypes: ["policy", "deployment", "product", "use-case", "talk"],
    history: [
      { role: "user", content: "Who is Anubha?" },
      { role: "assistant", content: "Anubha Parashar is the founder of GaitAI." },
    ],
  },
  {
    q: "and for elderly people?",
    family: "follow-up · and",
    relevant: ELDERLY,
    wrongTypes: NOISE,
    history: [
      { role: "user", content: "What can GaitAI do for hospitals?" },
      { role: "assistant", content: "GaitAI documents Hospitals as a deployment environment." },
    ],
  },
];
