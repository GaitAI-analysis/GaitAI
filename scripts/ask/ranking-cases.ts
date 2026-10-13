/**
 * ASK GAITAI — RANKING REGRESSION CASES
 * =============================================================================
 * Where `cases.ts` asks "did the right records REACH the answering layer",
 * these ask "did the right record come FIRST, and was the question read as
 * the right kind of question". They exist because of one screenshot: "who is
 * Example Researcher" answered with a privacy policy, a Trust Center page and a deployment
 * note, because nothing in the ranking knew that a name is decisive.
 *
 * Each case may assert any of:
 *   top          the record id that must rank first
 *   topType      the record TYPE that must rank first (when the exact id is
 *                a judgement call, e.g. "which CCTV module")
 *   notTopTypes  record types that must NOT rank first — the mismatch the
 *                brief names: a policy record answering a person question
 *   intent       the intent the classifier must return
 *   includesType a record type that must appear somewhere in the set
 *   miss         true when the question names a person the corpus has no
 *                record for, and the empty state must say so
 *   answerHas    substrings the retrieval-only answer must contain
 *   answerLacks  substrings it must not contain
 */

import type { DocType } from "../../src/lib/ask/corpus";
import type { Intent } from "../../src/lib/ask/intent";

export interface RankingCase {
  q: string;
  path?: string;
  top?: string;
  topType?: DocType;
  notTopTypes?: DocType[];
  intent?: Intent;
  includesType?: DocType;
  miss?: boolean;
  answerHas?: string[];
  answerLacks?: string[];
  /**
   * The canonical destination NAME the model-facing answer contract must
   * require for a where-to-go question (see `canonicalDestination` in
   * prompt.ts), or null to assert that no destination line is produced.
   */
  destination?: string | null;
}

const PERSON = "person:Example Researcher";
const NOT_A_PERSON_ANSWER: DocType[] = ["policy", "deployment", "page", "product", "use-case"];

export const RANKING_CASES: RankingCase[] = [
  ...["Who founded GaitAI?", "Who owns GaitAI?", "Who authored these papers?", "Founder?"].map(q => ({ q, intent: "PERSON" as const, miss: true, answerHas: ["outside its public scope"], answerLacks: ["## Person"] })),

  // ── The empty state ────────────────────────────────────────────────────────
  {
    q: "who is john smith",
    intent: "PERSON",
    miss: true,
    answerHas: ["outside its public scope", "Publications"],
    answerLacks: ["Privacy"],
  },
  {
    q: "tell me about Priya Sharma.",
    intent: "PERSON",
    miss: true,
    answerHas: ["outside its public scope"],
  },
  // A "who" that is about an audience, not a person, must not be a miss.
  { q: "who is it for", miss: false, notTopTypes: ["person"] },
  { q: "Who is GaitAI for?", miss: false, notTopTypes: ["person"] },

  // ── Exact product queries rank their product first ─────────────────────────
  { q: "what is privacyguard", top: "product:privacyguard", intent: "PRODUCT" },
  /* Not a where-question: no destination line, even with a page record near the top. */
  { q: "what is walkscan", top: "product:walkscan", intent: "PRODUCT", destination: null },
  { q: "What is FallRisk?", top: "product:fallrisk", intent: "PRODUCT" },
  { q: "what is gaitscape", top: "page:/gaitscape" },
  { q: "What is GaitAI?", top: "page:/" },
  /* The brand is in most questions. Naming it must not hand the home page the
     answer to a question about something else. */
  /* A where-to-go question whose lead record is a site page: the answer
     contract must require the literal canonical destination name — here the
     short name the site uses for /movement-lab/, derived from the record. */
  { q: "Where can I try GaitAI?", top: "page:/movement-lab", destination: "Movement Lab" },
  { q: "Does GaitAI diagnose Parkinson's?", top: "product:neuromotion" },
  { q: "who is fallrisk", top: "product:fallrisk", intent: "PRODUCT" },
  { q: "Tell me about WalkScan", top: "product:walkscan", intent: "PRODUCT" },
  { q: "Which products work with CCTV?", topType: "product" },

  // ── Topic intents keep their record types ──────────────────────────────────
  {
    q: "how is my uploaded video handled",
    intent: "PRIVACY",
    notTopTypes: ["person", "publication", "research"],
  },
  /* "store" is also what RetailGuard watches. A privacy question is answered
     by a policy, legal or deployment record, never by a module or environment
     that merely shares the word. */
  {
    q: "how do you store my video",
    intent: "PRIVACY",
    notTopTypes: ["person", "product", "use-case", "publication", "research"],
  },
  {
    q: "How does PrivacyGuard protect privacy?",
    intent: "PRIVACY",
    top: "product:privacyguard",
  },
  { q: "show gait recognition papers", intent: "PUBLICATION", topType: "publication" },
  { q: "papers on gait recognition", intent: "PUBLICATION", topType: "publication" },
  { q: "Show me research on privacy.", intent: "RESEARCH", top: "research:res-privacy" },
  { q: "Where are your publications?", intent: "NAVIGATION", top: "page:/publications", destination: "Publications" },

  // ── The RAG acceptance set: what leads ─────────────────────────────────────
  { q: "What is MobilityCare?", top: "page:/mobilitycare" },
  { q: "What is SecureVision?", top: "page:/securevision" },
  { q: "What is GaitScape?", top: "page:/gaitscape" },
  { q: "What publications does GaitAI have?", intent: "PUBLICATION", top: "page:/publications", notTopTypes: ["person"] },
  { q: "What happens in the Biometrics Lab?", top: "page:/labs/biometrics" },
  /* A GaitAI-level privacy question is answered by the privacy policy and the
     governance records, never by whichever module's privacy section shares
     the word. */
  { q: "What does GaitAI say about privacy?", intent: "PRIVACY", notTopTypes: ["product", "use-case", "person", "talk"] },
  /* "latest": the hub first, then the articles, newest first. */
  { q: "What are the latest GaitAI Insights?", top: "page:/insights", includesType: "insight" },
  /* A conference-talk title that shares a word is not the answer to a
     module question. */
  { q: "Does GaitAI diagnose Parkinson's?", notTopTypes: ["talk", "person"] },

  // ── "What can GaitAI do for X" ─────────────────────────────────────────────
  // The bug: "what can GaitAI do for military" answered with the Insights
  // hub, a patent, the Talks page and the founder's record. An application
  // question is answered by environments, modules and deployment facts, and
  // by a plain boundary where the domain is not a documented deployment.
  {
    q: "What can GaitAI do for military?",
    intent: "DOMAIN_APPLICATION",
    topType: "use-case",
    notTopTypes: ["person", "talk", "insight", "publication", "research"],
    includesType: "product",
    answerHas: [
      "What GaitAI could contribute for military",
      "Defence & Armed Forces",
      "Relevant capabilities:",
      "Important boundary",
    ],
    answerLacks: ["Example Researcher", "Talks and presentations", "GaitAI Insights", "Patent 402202", "deployed", "customer:"],
  },
  {
    q: "What can GaitAI do for defence?",
    intent: "DOMAIN_APPLICATION",
    notTopTypes: ["person", "talk", "insight", "publication", "research"],
    answerHas: ["Defence & Armed Forces", "Important boundary"],
    answerLacks: ["Example Researcher", "Talks and presentations"],
  },
  {
    q: "What can GaitAI do for a hospital?",
    intent: "DOMAIN_APPLICATION",
    top: "use-case:hospitals",
    includesType: "product",
    answerHas: ["GaitAI documents **Hospitals** as a deployment environment", "Relevant capabilities:"],
  },
  { q: "What can GaitAI do for elderly care?", intent: "DOMAIN_APPLICATION", top: "use-case:elderly", includesType: "product" },
  { q: "What can GaitAI do for an airport?", intent: "DOMAIN_APPLICATION", top: "use-case:airports", includesType: "product" },
  { q: "What can GaitAI do for a factory?", intent: "DOMAIN_APPLICATION", top: "use-case:factories", includesType: "product" },
  {
    q: "What can GaitAI do for a railway station?",
    intent: "DOMAIN_APPLICATION",
    top: "use-case:airports",
    answerHas: ["Airports, metro & rail"],
  },
  { q: "What can GaitAI do for a university campus?", intent: "DOMAIN_APPLICATION", top: "use-case:campuses", includesType: "product" },
  { q: "What can GaitAI do for public safety?", intent: "DOMAIN_APPLICATION", top: "use-case:smartcities" },
  { q: "What can GaitAI do for rehabilitation?", intent: "DOMAIN_APPLICATION", top: "use-case:physio" },
  /* Other forms of the same question. */
  { q: "How can GaitAI help hospitals?", intent: "DOMAIN_APPLICATION", top: "use-case:hospitals" },
  { q: "Which GaitAI products for factories?", intent: "DOMAIN_APPLICATION", top: "use-case:factories" },
  { q: "GaitAI for elderly care", intent: "DOMAIN_APPLICATION", top: "use-case:elderly" },
  /* An unknown domain refuses rather than listing every environment. */
  {
    q: "What can GaitAI do for astronauts?",
    intent: "DOMAIN_APPLICATION",
    answerHas: ["no documented answer"],
    answerLacks: ["Relevant capabilities", "Example Researcher", "Talks"],
  },
  /* A module named in the "for" form keeps its own intent. */
  { q: "What can WalkScan do for a clinic?", intent: "PRODUCT", top: "product:walkscan" },

  /* ── The platform as a mechanism, and the neighbours it must not collapse into ──
     "How does GaitAI work end to end" once answered with a Smart Cities use
     case and a deployment disclaimer. It is an ARCHITECTURE question: the
     platform record leads; environments, people and talks do not appear on
     top. Deployment, validation, domain and product questions keep their own
     intents. */
  { q: "Tell me about GaitAI", intent: "PRODUCT", top: "page:/", notTopTypes: ["use-case", "person", "talk", "insight"] },
  { q: "How does GaitAI work?", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end", notTopTypes: ["use-case", "person", "talk", "publication", "insight"] },
  { q: "How does GaitAI work end to end?", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end", notTopTypes: ["use-case", "person", "talk", "publication", "insight"] },
  { q: "What happens from walking video to insight?", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end", notTopTypes: ["use-case", "person", "talk"] },
  { q: "Explain the GaitAI pipeline", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end" },
  { q: "How does a camera input become a report?", intent: "ARCHITECTURE", includesType: "page", notTopTypes: ["use-case", "person", "talk", "publication", "insight"] },
  { q: "What's the end-to-end workflow?", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end" },
  { q: "How does GaitAI turn walking video into intelligence?", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end" },
  { q: "Explain the architecture", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end" },
  { q: "How does the platform process movement?", intent: "ARCHITECTURE", top: "platform:gaitai-end-to-end" },
  { q: "Where has GaitAI been deployed?", intent: "DEPLOYMENT", topType: "deployment", notTopTypes: ["use-case", "person", "talk", "insight"] },
  { q: "Has GaitAI been validated in hospitals?", intent: "EVIDENCE", notTopTypes: ["person", "talk", "insight"] },
  { q: "What can GaitAI do for hospitals?", intent: "DOMAIN_APPLICATION", top: "use-case:hospitals" },
  { q: "What is MobilityCare?", intent: "PRODUCT", top: "page:/mobilitycare" },
  /* A named module's "how does it work" is that module's section, not the platform. */
  { q: "How does WalkScan work?", intent: "PRODUCT", top: "product:walkscan" },
];
