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
    answerLacks: ["Privacy", "Trust Center", "deployment"],
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
  { q: "what is walkscan", top: "product:walkscan", intent: "PRODUCT" },
  { q: "What is FallRisk?", top: "product:fallrisk", intent: "PRODUCT" },
  { q: "what is gaitscape", top: "page:/gaitscape" },
  { q: "What is GaitAI?", top: "page:/" },
  /* The brand is in most questions. Naming it must not hand the home page the
     answer to a question about something else. */
  { q: "Where can I try GaitAI?", top: "page:/movement-lab" },
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
  { q: "Where are your publications?", intent: "NAVIGATION", top: "page:/publications" },
];
