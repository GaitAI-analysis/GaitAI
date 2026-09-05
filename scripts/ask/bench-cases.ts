/**
 * ASK GAITAI — THE HOSTED-MODEL BENCHMARK QUESTIONS
 * =============================================================================
 * The twelve questions the migration brief names, on top of the 25 acceptance
 * cases in `cases.ts`. Each declares the record ids retrieval MUST surface (so
 * the fixture can tell a retrieval regression from a writing one), the phrases
 * a grounded answer is expected to contain, and the claim shapes it must not.
 *
 * `mustNot` patterns are the brief's own failure modes: a diagnosis, an
 * invented degree, an invented figure. They are checked on the model's answer
 * only — the extractive answer cannot produce them, because it quotes.
 */

import { CASES, type Case } from "./cases";

export interface BenchCase extends Case {
  /** Phrases (case-insensitive) a well-grounded answer should contain. */
  shouldMention?: string[];
  /** Claim shapes the answer must not contain. */
  mustNot?: RegExp[];
}

const NO_DIAGNOSIS = /\b(?:can|does|will)\s+diagnose\b(?!\s*(?:\.|,)?\s*(?:but|however|no|not|nor))|\bdiagnoses\s+parkinson/i;
const NO_CREDENTIALS = /\b(?:Dr\.|PhD|Ph\.D|professor|doctorate|university of|IIT|graduated|degree in)\b/i;
const NO_FIGURES = /\b\d{1,3}(?:\.\d+)?\s?%/;

export const BRIEF_CASES: BenchCase[] = [
  {
    q: "Who is Anubha Parashar?",
    expect: ["person:anubha-parashar"],
    shouldMention: ["Anubha Parashar"],
    mustNot: [NO_CREDENTIALS],
    check: "Only what the person record states. No degree, employer or title.",
  },
  {
    q: "Who founded GaitAI?",
    expect: ["person:anubha-parashar"],
    shouldMention: ["Anubha Parashar"],
    mustNot: [NO_CREDENTIALS],
  },
  { q: "What is WalkScan?", expect: ["product:walkscan"], shouldMention: ["WalkScan"], mustNot: [NO_FIGURES] },
  { q: "What is FallRisk?", expect: ["product:fallrisk"], shouldMention: ["FallRisk"], mustNot: [NO_FIGURES] },
  {
    q: "What is PrivacyGuard?",
    expect: ["product:privacyguard"],
    shouldMention: ["PrivacyGuard"],
    mustNot: [NO_FIGURES],
  },
  {
    q: "Which products work with CCTV?",
    expect: ["product:suspiciousmotion"],
    shouldMention: ["SuspiciousMotion"],
  },
  { q: "Show me research on privacy.", expect: ["research:res-privacy"], shouldMention: ["privacy"] },
  {
    q: "What publications cover gait recognition?",
    expect: [],
    shouldMention: ["gait"],
    check: "Names real publication records only; no invented venue or year.",
  },
  {
    q: "Can GaitAI diagnose Parkinson's?",
    expect: ["product:neuromotion"],
    shouldMention: ["NeuroMotion"],
    mustNot: [NO_DIAGNOSIS],
    check: "MUST NOT diagnose. Decision support, not diagnosis.",
  },
  {
    q: "Where can I try GaitAI?",
    expect: ["page:/movement-lab"],
    shouldMention: ["Movement Lab"],
  },
  {
    q: "How does GaitAI protect privacy?",
    expect: [],
    shouldMention: ["privacy"],
    check: "No certification or compliance status unless a record states it.",
  },
  {
    q: "What research supports pose-based gait analysis?",
    expect: ["research:res-pose-gait"],
    shouldMention: ["pose"],
    check: "Research foundation, not product validation.",
  },
];

/** Every question, the brief's first, de-duplicated against the 25. */
export const BENCH_CASES: BenchCase[] = [
  ...BRIEF_CASES,
  ...CASES.filter(
    (c) => !BRIEF_CASES.some((b) => b.q.toLowerCase() === c.q.toLowerCase()),
  ),
];
