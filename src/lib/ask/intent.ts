/**
 * QUERY INTENT — what KIND of thing a question is asking for.
 * =============================================================================
 * A deterministic, local classifier: a handful of regular expressions and the
 * entity resolver's verdict, nothing downloaded and nothing sampled. It runs
 * before retrieval and answers one question — "should a person record, a
 * module record or a policy record be favoured for this?" — so that ranking
 * can boost the record TYPES that fit and penalise the ones that plainly do
 * not. "Who is Anubha" should never be answered by a privacy policy because
 * the policy happens to contain the word "who".
 *
 * WHY NOT A MODEL. Ten labels over a controlled vocabulary is exactly the case
 * where a rule is more predictable than a classifier: it is inspectable, it is
 * the same in the test harness as in the browser, and it costs nothing on the
 * request path. The labels are coarse on purpose; retrieval still does the
 * ranking, intent only tilts it.
 */

export type Intent =
  | "PERSON"
  | "PRODUCT"
  | "CAPABILITY"
  | "RESEARCH"
  | "PUBLICATION"
  | "USE_CASE"
  | "PRIVACY"
  | "SECURITY"
  | "NAVIGATION"
  | "GENERAL";

/** What the caller already knows from the corpus, so the rules can use it. */
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
}

/** One to four capitalised words, optionally with a trailing period ("Dr."). */
const LOOKS_LIKE_NAME = /^(?:[A-Z][a-z]+\.?\s*){1,4}$/;

/** A message that opens by asking WHERE something is, before any topic word. */
const LEADING_NAVIGATION = /^\s*(?:where|take\s+me|go\s+to|open\s+the|navigate|link\s+to)\b/i;

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
const ROLE_WORDS =
  /\b(founder|founders|co-?founder|founded|creator|created|author|authors|authored|researcher|researchers|scientist|team|people|person|leadership|leads|behind|inventor|invented|wrote|works?\s+on)\b/i;

/**
 * A "who is X" whose X is plainly not a person: "who is it for", "who is this
 * product aimed at", "who is GaitAI for". These read as audience questions.
 */
const AUDIENCE_SUBJECT =
  /^(?:it|this|that|these|those|gaitai|the\s+(?:product|module|platform|site))\b.*\b(?:for|aimed|intended|meant)\b/i;

const PRIVACY_HINTS =
  /\b(privacy|private|personal\s+data|my\s+(?:video|videos|data|footage|recording|recordings|upload|uploads)|uploaded|upload|store|stored|storage|retain|retained|retention|delete|deleted|deletion|anonymi[sz](?:e|ed|ation)|de-?identif|consent|gdpr|hipaa|dpdp|face\s+blur|skeleton\s+only|who\s+can\s+see|what\s+happens\s+to)\b/i;

const SECURITY_HINTS =
  /\b(secur(?:e|ity|ed)|encrypt(?:ed|ion)?|access\s+control|role-?based|audit(?:\s+log|able|ability)?|breach|soc\s*2|iso\s*27001|certif(?:ied|ication)|complian(?:ce|t)|penetration|vulnerab)\b/i;

const PUBLICATION_HINTS =
  /\b(paper|papers|publication|publications|published|patent|patents|doi|journal\s+article|cite|citation|citations|peer.?reviewed|preprint|proceedings|venue)\b/i;

const RESEARCH_HINTS =
  /\b(research|study|studies|evidence|scientific|science|academic|findings|literature|foundation|grounded|grounds)\b/i;

const CAPABILITY_HINTS =
  /\b(capabilit(?:y|ies)|signal|signals|pose\s+estimation|gait\s+cycle|re-?identification|anomaly\s+detection|feature\s+extraction|tracking|detection|recognition|segmentation|estimation|what\s+can\s+it\s+(?:detect|measure|sense)|measure|measures|senses?)\b/i;

const USE_CASE_HINTS =
  /\b(hospital|hospitals|clinic|clinics|physio(?:therapy)?|rehab(?:ilitation)?|elderly|care\s+(?:home|homes|center|centre|facility)|nursing|factory|factories|warehouse|stadium|airport|station|campus|school|retail|mall|smart\s+cit(?:y|ies)|sports?\s+(?:team|club|academy)|gym|fitness|environment|environments|industry|industries|deploy\s+in|sector|setting|i\s+(?:run|manage|own|operate|work\s+(?:at|in|for)))\b/i;

const PRODUCT_HINTS =
  /\b(module|modules|product|products|solution|solutions|tool|tools|what\s+is|what\s+does|what's|how\s+does\s+\w+\s+work|features?\s+of|compare|difference\s+between|versus|vs\.?)\b/i;

const NAVIGATION_HINTS =
  /\b(where\s+(?:can|do|is|are)|where's|find|show\s+me|link\s+to|page|take\s+me|navigate|go\s+to|located|url|route|open\s+the|section)\b/i;

/**
 * Classify one question.
 *
 * ORDER IS THE MODEL. The first rule that fires wins, and the order encodes
 * the priorities a visitor would expect: a named person beats everything
 * (asking "who is Anubha" on any page is about Anubha); a privacy question
 * that mentions a module is still a privacy question; a named module beats
 * the generic hints. The last three rules are broad on purpose — they only
 * ever add a small tilt, never a decisive boost.
 */
export function classifyIntent(query: string, hints: IntentHints = {}): Intent {
  const text = query.trim();
  const who = WHO_PATTERN.exec(text);
  const subject = who?.[1] ?? "";

  if (hints.namesPerson) return "PERSON";

  if (who && !AUDIENCE_SUBJECT.test(subject)) {
    /* "Who is FallRisk" is a product question phrased loosely; "who is the
       founder" and "who is anubha" are about people. A module name in the
       subject settles it; so does an environment or capability name. */
    if (hints.namesProduct) return "PRODUCT";
    if (hints.namesEnvironment) return "USE_CASE";
    if (hints.namesCapability) return "CAPABILITY";
    /* "tell me about privacy" / "tell me about your research" are topical,
       not personal, and the topic rules below are the right ones. "who is X"
       forms, and role words anywhere, stay personal. */
    if (/^\s*(?:(?:so|and|ok|okay|hey|hi)[,\s]+)?who/i.test(text) || ROLE_WORDS.test(text)) {
      return "PERSON";
    }
    /* "Tell me about Priya Sharma": a capitalised subject the corpus has no
       word for is a name, and the right answer is the named empty state. */
    if (hints.subjectUnknown && LOOKS_LIKE_NAME.test(subject)) return "PERSON";
  }
  if (ROLE_WORDS.test(text) && /\b(who|whom|whose)\b/i.test(text)) return "PERSON";

  /* "Where are your publications?" is a navigation question about
     publications, not a publication question — the opening word decides. */
  if (LEADING_NAVIGATION.test(text) && !hints.namesProduct) return "NAVIGATION";

  /* Asking for papers or research ON a topic is a research question even when
     the topic is privacy: "show me research on privacy" wants the research
     area, not the privacy policy. */
  if (PUBLICATION_HINTS.test(text)) return "PUBLICATION";
  if (RESEARCH_HINTS.test(text) && !hints.namesProduct) return "RESEARCH";

  if (PRIVACY_HINTS.test(text)) return "PRIVACY";
  if (SECURITY_HINTS.test(text) && !hints.namesProduct) return "SECURITY";

  if (hints.namesProduct) return "PRODUCT";
  if (hints.namesEnvironment) return "USE_CASE";

  if (hints.namesCapability) return "CAPABILITY";
  if (USE_CASE_HINTS.test(text)) return "USE_CASE";
  if (NAVIGATION_HINTS.test(text)) return "NAVIGATION";
  if (CAPABILITY_HINTS.test(text)) return "CAPABILITY";
  if (PRODUCT_HINTS.test(text)) return "PRODUCT";

  return "GENERAL";
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
