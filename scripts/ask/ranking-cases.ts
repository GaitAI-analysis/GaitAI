/**
 * ASK GAITAI — RANKING REGRESSION CASES
 * =============================================================================
 * Where `cases.ts` asks "did the right records REACH the answering layer",
 * these ask "did the right record come FIRST, and was the question read as
 * the right kind of question". They exist because of one screenshot: "who is
 * anubha" answered with a privacy policy, a Trust Center page and a deployment
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

const PERSON = "person:anubha-parashar";
const NOT_A_PERSON_ANSWER: DocType[] = ["policy", "deployment", "page", "product", "use-case"];

export const RANKING_CASES: RankingCase[] = [
  // ── The bug ────────────────────────────────────────────────────────────────
  {
    q: "who is anubha",
    top: PERSON,
    intent: "PERSON",
    notTopTypes: NOT_A_PERSON_ANSWER,
    includesType: "publication",
    answerHas: ["Anubha Parashar", "Related:"],
    /* No policy, Trust or deployment record may answer a person question. A
       co-authored paper whose TITLE contains "privacy" is a legitimate
       related record, so the check names the policy records themselves. */
    answerLacks: ["Privacy policy", "Privacy and security architecture", "Trust Center", "deployment"],
  },
  {
    q: "who is anubha parashar",
    top: PERSON,
    intent: "PERSON",
    notTopTypes: NOT_A_PERSON_ANSWER,
    answerHas: ["Anubha Parashar"],
  },
  {
    q: "tell me about anubha",
    top: PERSON,
    intent: "PERSON",
    notTopTypes: NOT_A_PERSON_ANSWER,
  },
  {
    q: "Who is Dr. Anubha Parashar?",
    top: PERSON,
    intent: "PERSON",
    /* An alias is for MATCHING. The answer must not pick the honorific up as a
       fact: no degree is documented on the site. */
    answerLacks: ["Dr.", "PhD", "Ph.D"],
  },
  { q: "What do you know about Anubha's research?", top: PERSON, intent: "PERSON" },
  { q: "who is anubah", top: PERSON, intent: "PERSON" },
  { q: "who founded gaitai", top: PERSON, intent: "PERSON", notTopTypes: NOT_A_PERSON_ANSWER },
  { q: "who is the founder", top: PERSON, intent: "PERSON" },
  { q: "who is the founder of GaitAI?", top: PERSON, intent: "PERSON" },
  { q: "who works on gaitai research", top: PERSON, intent: "PERSON", notTopTypes: ["policy", "deployment"] },
  {
    q: "Which publications did Anubha Parashar author?",
    top: PERSON,
    intent: "PERSON",
    includesType: "publication",
  },
  // Asked from a page whose own record would otherwise take the lead.
  { q: "who is anubha", path: "/legal/privacy/", top: PERSON, intent: "PERSON" },
  { q: "who is anubha", path: "/trust/", top: PERSON, intent: "PERSON" },

  // ── A second person, sharing a surname ─────────────────────────────────────
  // The Publications page names Apoorva Parashar as a co-author. "Parashar"
  // alone is ambiguous and resolves nobody; either first name resolves the
  // right record, and neither answer offers the other person.
  {
    q: "Who is Apoorva Parashar?",
    top: "person:apoorva-parashar",
    intent: "PERSON",
    notTopTypes: NOT_A_PERSON_ANSWER,
    includesType: "publication",
    answerHas: ["Apoorva Parashar", "co-author"],
    answerLacks: ["founder of GaitAI."],
  },
  { q: "Who is Apoorva?", top: "person:apoorva-parashar", intent: "PERSON", answerHas: ["Apoorva Parashar"] },
  { q: "who is anubha", top: PERSON, intent: "PERSON", answerLacks: ["**Apoorva Parashar**"] },
  { q: "Which papers did Apoorva co-author?", top: "person:apoorva-parashar", intent: "PERSON", includesType: "publication" },

  // ── The empty state ────────────────────────────────────────────────────────
  {
    q: "who is john smith",
    intent: "PERSON",
    miss: true,
    answerHas: ["couldn't find a GaitAI record for", "john smith", "Research", "Publications"],
    answerLacks: ["Privacy"],
  },
  {
    q: "tell me about Priya Sharma.",
    intent: "PERSON",
    miss: true,
    answerHas: ["Priya Sharma"],
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
    topType: "product",
    notTopTypes: ["person", "talk", "insight", "publication", "research"],
    includesType: "product",
    answerHas: [
      "What GaitAI could contribute for military",
      "DefenceMotion",
      "does not document a dedicated military deployment",
      "Relevant capabilities:",
      "Important boundary",
    ],
    answerLacks: ["Anubha", "Talks and presentations", "GaitAI Insights", "Patent 402202", "deployed", "customer:"],
  },
  {
    q: "What can GaitAI do for defence?",
    intent: "DOMAIN_APPLICATION",
    notTopTypes: ["person", "talk", "insight", "publication", "research"],
    answerHas: ["DefenceMotion", "does not document a dedicated defence deployment"],
    answerLacks: ["Anubha", "Talks and presentations"],
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
    answerLacks: ["Relevant capabilities", "Anubha", "Talks"],
  },
  /* A module named in the "for" form keeps its own intent. */
  { q: "What can WalkScan do for a clinic?", intent: "PRODUCT", top: "product:walkscan" },
];
