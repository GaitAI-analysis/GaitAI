// ============================================================================
// THE HOME PAGE'S SECTION REGISTRY
// ----------------------------------------------------------------------------
// One list, read by four things that must never disagree:
//
//   1. the sticky section navigator          (the labels and the links)
//   2. the href of every rail item           (`id` → `#id`)
//   3. the active-section logic              (which id is lit)
//   4. the IntersectionObserver              (what it watches)
//
// A nav item whose `id` has no section on the page is a link to nowhere, and a
// section the navigator does not know about can never be highlighted. Both
// used to be possible because the anchors were written by hand in two places;
// they are now impossible, because `homeSections` is the only place either
// exists and `HomeSectionNav` derives its observer targets, its hrefs and its
// active state from the same array it renders.
//
// EVERY ENTRY IS A REAL ANCHOR. `/#products` pasted into a fresh tab has to
// land on the products section, so the ids below are attached to elements that
// are always in the document — never to a panel that a tab has hidden, and
// never to a shared parent standing in for two sections. `#mobilitycare` and
// `#securevision` are the two flagship panels' own `<article>` elements, not
// the GaitAI Core block that contains them. Where a section has an inner
// selector (the product families, the environment categories), the id belongs
// to the section, and the selector reads the hash to choose which panel opens.
// See HomeSectionNav and the two explorers.
//
// THE ORDER BELOW IS PAGE ORDER, and it is not trusted to stay that way. It is
// written here so the rail's first paint is already correct, and re-derived
// from `compareDocumentPosition` on mount, so moving a section in page.tsx
// moves its rail item with it and cannot leave the rail telling a story the
// page does not tell. The order that follows is the home page as it renders
// today:
//
//   overview → mobilitycare → securevision → products → technology →
//   research → trust → use-cases
//
// Two of those deserve a note, because both look like mistakes and are not:
//
//   TRUST comes before USE CASES because VisitorIntent really is rendered
//   before EnvironmentExplorer. The labels were approved in the other order;
//   the page was not rebuilt to match, so the rail follows the page.
//
//   TRUST POINTS AT THE VISITOR-INTENT SECTION. The page has no trust section
//   of its own — what it says about privacy, oversight and lawful deployment
//   is said inside the research section. "What brings you to GaitAI?" is the
//   section that was captured and approved under the TRUST label, so that is
//   where the item leads. If a real trust section is ever added, move this.
//
// Sections deliberately NOT in the rail: the hero, #movement-chain, #vision
// and #contact. The rail is a set of destinations, not a table of contents.
// ============================================================================

export interface HomeSection {
  /** The element id, and therefore the hash: `#overview` → `/#overview`. */
  id: string;
  /** What the navigator shows. Short — this is a rail, not a menu. */
  label: string;
  /**
   * Longer name for assistive technology, where "Products" alone is thin.
   * Used as the link's accessible name when it differs from `label`.
   */
  description: string;
}

export const homeSections: HomeSection[] = [
  { id: "overview", label: "Overview", description: "What GaitAI reads in movement" },
  { id: "mobilitycare", label: "MobilityCare", description: "MobilityCare — clinical movement intelligence" },
  { id: "securevision", label: "SecureVision", description: "SecureVision — privacy-aware spatial intelligence" },
  { id: "products", label: "Products", description: "Featured products across both families" },
  { id: "technology", label: "Technology", description: "How the platform works" },
  { id: "research", label: "Research", description: "The published research record" },
  { id: "trust", label: "Trust", description: "Privacy, oversight and lawful deployment" },
  { id: "use-cases", label: "Use cases", description: "Where GaitAI is used, by category" },
];

/** `#overview`, `#mobilitycare`, … — the elements the observer watches. */
export const homeSectionIds = homeSections.map((section) => section.id);

/** The registry keyed by id, for resolving an element back to its entry. */
export const homeSectionById = new Map(
  homeSections.map((section) => [section.id, section] as const),
);
