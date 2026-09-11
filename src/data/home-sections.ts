// ============================================================================
// THE HOME PAGE'S SECTION REGISTRY
// ----------------------------------------------------------------------------
// One list, read by three things that must never disagree:
//
//   1. the sticky section navigator          (the labels and the links)
//   2. the sections themselves               (the id each one carries)
//   3. the IntersectionObserver              (what it watches)
//
// A nav item whose `id` has no section on the page is a link to nowhere, and a
// section the navigator does not know about can never be highlighted. Both
// used to be possible because the anchors were written by hand in two places;
// they are now impossible, because `homeSections` is the only place either
// exists and `HomeSectionNav` derives its observer targets from the same array
// it renders.
//
// EVERY ENTRY IS A REAL ANCHOR. `/#products` pasted into a fresh tab has to
// land on the products section, so the ids below are attached to elements that
// are always in the document — never to a panel that a tab has hidden. Where a
// section has an inner selector (the product families, the environment
// categories), the id belongs to the section, and the selector reads the hash
// to choose which panel opens. See HomeSectionNav and the two explorers.
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
  { id: "use-cases", label: "Use cases", description: "Where GaitAI is used, by category" },
  { id: "technology", label: "Technology", description: "How the platform works" },
  { id: "research", label: "Research", description: "The published research record" },
  { id: "trust", label: "Trust", description: "Privacy, oversight and lawful deployment" },
];

/** `#overview`, `#mobilitycare`, … — the selector the observer watches. */
export const homeSectionIds = homeSections.map((section) => section.id);
