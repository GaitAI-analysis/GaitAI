/**
 * DOMAIN VOCABULARY — what a visitor calls a place, mapped to what the site
 * calls it. RETRIEVAL ONLY.
 * =============================================================================
 * "What can GaitAI do for military?" names a domain the corpus has no record
 * for, in a word the corpus never uses. Lexical retrieval then falls back to
 * whichever pages happen to share "do" and "for" — the home page, Trust, the
 * Insights hub — which is the search-engine dump the assistant must not give.
 *
 * This table says, for each domain a visitor might name, which words the
 * site's OWN records use for the same ground: "military" → restricted zones,
 * perimeter events, access control, authorised watchlists, high-security
 * spaces; "railway station" → the Airports, metro & rail environment. The
 * expansion terms are added to the query at a reduced weight so the records
 * that actually describe those capabilities can score. Nothing here is ever
 * shown to a visitor or handed to the model as a fact.
 *
 * THE LINE THIS FILE MUST NOT CROSS. A concept may point at an ENVIRONMENT
 * record (`environmentIds`) only where the site documents that environment —
 * "railway station" → `airports` ("Airports, metro & rail") is the site's own
 * grouping. A concept with no environment record (defence) points at nothing:
 * retrieval finds the capabilities, and the answer layer says plainly that no
 * dedicated deployment of that kind is documented. The vocabulary can make a
 * module FINDABLE for a question; it can never make a claim about it.
 *
 * Every expansion term below occurs in the generated corpus (checked against
 * public/ask/knowledge.json on 2026-09-09). Broad words that appear in most
 * SecureVision records ("security", "safety") carry a smaller weight so they
 * cannot pull in everything at once.
 */

export type Family = "mobilitycare" | "securevision";

export interface DomainConcept {
  id: string;
  /** Matched against the normalised (lowercase, punctuation-folded) subject. */
  match: RegExp;
  /** Site vocabulary to add to the query, with a per-term weight (query term = 1). */
  terms: { term: string; weight: number }[];
  /** The product family the domain belongs to, when it plainly does. */
  family?: Family;
  /**
   * `industryUseCases` ids the site documents FOR this domain. Only where the
   * environment record genuinely covers it. Empty means: no documented
   * environment — capabilities may be relevant, a deployment is not claimed.
   */
  environmentIds: string[];
}

const t = (term: string, weight = 0.6) => ({ term, weight });

export const DOMAIN_CONCEPTS: readonly DomainConcept[] = [
  {
    id: "defence",
    match:
      /\b(military|militaries|defen[cs]e|armed forces|army|navy|air ?force|soldiers?|barracks|garrison|cantonment|ministry of defen[cs]e|national security|homeland security)\b/,
    terms: [
      t("restricted"),
      t("perimeter"),
      t("access", 0.5),
      t("tailgating"),
      t("watchlist", 0.5),
      t("authorized", 0.5),
      t("defense", 0.6),
      t("high-security"),
      t("critical infrastructure", 0.5),
      t("security", 0.25),
    ],
    family: "securevision",
    environmentIds: [],
  },
  {
    id: "restricted-site",
    match:
      /\b(restricted (?:facilit(?:y|ies)|sites?|areas?|zones?)|high[- ]security|secure facilit(?:y|ies)|government (?:buildings?|facilit(?:y|ies)|sites?)|embass(?:y|ies)|data cent(?:er|re)s?|nuclear|power plants?|critical infrastructure|prisons?|correctional|borders?|checkpoints?)\b/,
    terms: [
      t("restricted"),
      t("perimeter"),
      t("access", 0.5),
      t("tailgating"),
      t("watchlist", 0.4),
      t("high-security"),
      t("critical infrastructure", 0.5),
      t("data centers", 0.5),
      t("security", 0.25),
    ],
    family: "securevision",
    environmentIds: [],
  },
  {
    id: "public-safety",
    match: /\b(public safety|law enforcement|police|policing|civic|municipal|cit(?:y|ies)|smart cit(?:y|ies)|urban)\b/,
    terms: [t("smart cities"), t("public space"), t("crowd"), t("civic", 0.5), t("police", 0.5), t("incident", 0.4), t("safety", 0.3)],
    family: "securevision",
    environmentIds: ["smartcities"],
  },
  {
    id: "transit",
    match: /\b(rail(?:way|road)?s?|trains?|metro|subway|transit|stations?|airports?|terminals?|ports?|transport(?:ation)? hubs?)\b/,
    terms: [t("airport"), t("metro"), t("rail"), t("transit"), t("station"), t("transport hubs"), t("crowd", 0.4)],
    family: "securevision",
    environmentIds: ["airports"],
  },
  {
    id: "campus",
    match: /\b(universit(?:y|ies)|colleges?|campus(?:es)?|corporate offices?|office parks?|it parks?|workplaces?|enterprises?)\b/,
    terms: [t("campus"), t("university"), t("office", 0.5), t("workplace", 0.5)],
    family: "securevision",
    environmentIds: ["campuses"],
  },
  {
    id: "industrial",
    match: /\b(factor(?:y|ies)|warehous(?:e|es|ing)|plants?|industr(?:y|ial)|manufacturing|construction|mining|mines?|logistics|oil|gas|utilities)\b/,
    terms: [t("factory"), t("warehouse"), t("industrial"), t("worker"), t("restricted-zone", 0.5), t("safety", 0.3)],
    family: "securevision",
    environmentIds: ["factories"],
  },
  {
    id: "retail",
    match: /\b(retail(?:ers?)?|shops?|stores?|malls?|supermarkets?|shopping)\b/,
    terms: [t("retail"), t("mall"), t("store"), t("loitering", 0.5), t("queue", 0.4)],
    family: "securevision",
    environmentIds: ["retail"],
  },
  {
    id: "events",
    match: /\b(stadiums?|events?|concerts?|festivals?|rall(?:y|ies)|gatherings?|conferences?|exhibitions?|pilgrimage|religious)\b/,
    terms: [t("event"), t("stadium"), t("crowd"), t("density", 0.4)],
    family: "securevision",
    environmentIds: ["events"],
  },
  {
    id: "hospital",
    match: /\b(hospitals?|wards?|healthcare|health ?care|health systems?|clinics?|clinical)\b/,
    terms: [t("hospital"), t("clinician", 0.5), t("patient", 0.5), t("mobility", 0.4)],
    family: "mobilitycare",
    environmentIds: ["hospitals"],
  },
  {
    id: "elderly",
    match: /\b(elderly|older (?:adults?|people|persons?)|seniors?|aged care|nursing homes?|care homes?|geriatrics?|ageing|aging|eldercare|elder care)\b/,
    terms: [t("elderly"), t("care"), t("fall risk"), t("mobility decline", 0.5), t("caregiver", 0.5)],
    family: "mobilitycare",
    environmentIds: ["elderly"],
  },
  {
    id: "rehabilitation",
    match: /\b(rehab(?:ilitation)?|physio(?:therapy|therapists?)?|recovery|post[- ]?surgery|post[- ]?operative)\b/,
    terms: [t("rehab"), t("physiotherapy"), t("recovery", 0.5), t("progress", 0.4)],
    family: "mobilitycare",
    environmentIds: ["physio"],
  },
  {
    id: "sports",
    match: /\b(sports?|athletes?|athletic|teams?|academ(?:y|ies)|fitness|gyms?|training)\b/,
    terms: [t("sports"), t("athlete"), t("fitness"), t("performance", 0.4)],
    family: "mobilitycare",
    environmentIds: ["sports", "fitness"],
  },
  {
    id: "neurology",
    match: /\b(neurolog(?:y|ical|ists?)|parkinson'?s?|stroke|tremor|neuro)\b/,
    terms: [t("neurology"), t("neurological", 0.5), t("tremor", 0.5)],
    family: "mobilitycare",
    environmentIds: ["neuro"],
  },
  {
    id: "home-care",
    match: /\b(home ?care|telehealth|remote (?:care|monitoring|patients?)|at home)\b/,
    terms: [t("home care"), t("telehealth"), t("remote"), t("caregiver", 0.4)],
    family: "mobilitycare",
    environmentIds: ["homecare"],
  },
  {
    id: "schools",
    match: /\b(schools?|children|kids|pediatric|paediatric|students?)\b/,
    terms: [t("school"), t("children", 0.5), t("pediatric", 0.5)],
    family: "mobilitycare",
    environmentIds: ["schools"],
  },
  {
    id: "insurance",
    match: /\b(insur(?:ance|ers?)|wellness program(?:me)?s?|employers?|corporate wellness)\b/,
    terms: [t("insurance"), t("wellness")],
    family: "mobilitycare",
    environmentIds: ["insurance"],
  },
  {
    id: "trials",
    match: /\b(clinical trials?|pharma(?:ceuticals?)?|trial sponsors?|research stud(?:y|ies)|cro)\b/,
    terms: [t("clinical trials"), t("trial"), t("research", 0.3)],
    family: "mobilitycare",
    environmentIds: ["trials"],
  },
  {
    id: "prosthetics",
    match: /\b(prosthe(?:tic|tics|ses|sis)|orthotic|orthoses|amputees?)\b/,
    terms: [t("prosthetic"), t("orthotic")],
    family: "mobilitycare",
    environmentIds: ["prosthetics"],
  },
];

/** Lowercase, punctuation folded to spaces, one space between words. */
export const normalizeDomainText = (text: string) =>
  ` ${text.toLowerCase().replace(/['’]s\b/g, "").replace(/[^a-z0-9]+/g, " ").trim()} `;

/**
 * The domain concepts a subject names, in table order. "defence campuses"
 * names two; both contribute their vocabulary.
 */
export function matchDomains(subject: string): DomainConcept[] {
  const text = normalizeDomainText(subject);
  return DOMAIN_CONCEPTS.filter((concept) => concept.match.test(text));
}
