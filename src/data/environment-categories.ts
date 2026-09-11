// ============================================================================
// ENVIRONMENT CATEGORIES — the home page's use-case explorer
// ----------------------------------------------------------------------------
// The home page used to list every environment vertically: eighteen panels in
// two long rails, which is the full catalogue and reads as one. The breadth is
// real and worth stating, but stating it as a scroll asks a visitor to read
// eighteen things to find the one that looks like theirs.
//
// These seven categories are the index over the same eighteen records. Nothing
// is dropped, nothing is duplicated, and nothing is new content: a category is
// a grouping of `industryUseCases` ids, and every card it shows renders that
// environment's own `industry` and `outcome` strings.
//
// THE RULES THIS MODULE ENFORCES
//
//   COMPLETE      Every environment belongs to exactly one category.
//                 `uncategorisedEnvironmentIds` is what a stray record shows
//                 up in, and `validate:gaitai` fails the build on a non-empty
//                 list — so adding an environment without placing it is a
//                 build error rather than a card nobody can reach.
//   ONE HOME      A record in two categories would be counted twice and the
//                 category counts would no longer add up to the total, so
//                 `duplicateEnvironmentIds` is an error too.
//   DERIVED       The family a category belongs to comes from its own
//                 environments' `vertical`, never from a second hand-written
//                 assertion that can drift.
//
// DEFENCE IS ONE PRODUCT, NOT FOUR. Army, Navy and Air Force are service modes
// of GaitAI DefenceMotion — configurations of one movement pipeline and one set
// of privacy controls. They are rendered as contexts of the single Defence
// environment card, from `productDetailBySlug("defencemotion").modes`, and
// never as separate environments or separate products. See ServiceModes on the
// product page, which is the same three modes in full.
// ============================================================================

import { industryUseCases, type Vertical } from "./products";

export interface EnvironmentCategory {
  id: string;
  /** Rail label. Short — the control is a row of chips, not a menu. */
  label: string;
  /** One line: the question this group of environments brings. */
  blurb: string;
  /** `industryUseCases` ids, in the order the cards are shown. */
  environmentIds: string[];
}

export const environmentCategories: EnvironmentCategory[] = [
  {
    id: "healthcare",
    label: "Healthcare",
    blurb:
      "Clinical movement review, where the question is how someone walks and what has changed since last time.",
    environmentIds: ["physio", "hospitals", "neuro", "prosthetics"],
  },
  {
    id: "sports",
    label: "Sports & wellness",
    blurb:
      "Training and performance settings, where movement quality is tracked across a programme rather than a visit.",
    environmentIds: ["sports", "fitness", "schools"],
  },
  {
    id: "care",
    label: "Care & home",
    blurb:
      "Longitudinal care outside the clinic, where the signal has to arrive without a person having to attend an appointment.",
    environmentIds: ["elderly", "homecare", "insurance"],
  },
  {
    id: "public",
    label: "Public spaces",
    blurb:
      "Shared spaces at scale, where the useful reading is movement in the space and identity is deliberately not required.",
    environmentIds: ["airports", "smartcities", "retail", "events"],
  },
  {
    id: "industry",
    label: "Industry & campuses",
    blurb:
      "Operating sites with their own safety and access questions, and a known population moving through them.",
    environmentIds: ["factories", "campuses"],
  },
  {
    id: "defence",
    label: "Defence",
    blurb:
      "One product, three service modes — personnel readiness, rehabilitation, facility safety and authorised access.",
    environmentIds: ["defence"],
  },
  {
    id: "research",
    label: "Research",
    blurb:
      "Study settings, where the requirement is a repeatable measure and an exportable record of how it was taken.",
    environmentIds: ["trials"],
  },
];

/** The environment record behind a category entry, or undefined if it moved. */
export const environmentById = (id: string) =>
  industryUseCases.find((entry) => entry.id === id);

/**
 * Which family a category sits in, derived from its own environments. A
 * category whose environments span both families reports "mixed" rather than
 * picking one.
 */
export function familyForCategory(
  category: EnvironmentCategory,
): Vertical | "mixed" {
  const families = new Set(
    category.environmentIds
      .map((id) => environmentById(id)?.vertical)
      .filter((vertical): vertical is Vertical => Boolean(vertical)),
  );
  if (families.size === 1) return [...families][0];
  return "mixed";
}

/** How many environments a category carries — always from the id list. */
export const categoryCount = (category: EnvironmentCategory) =>
  category.environmentIds.length;

/**
 * Environments no category claims. Must be empty: `validate:gaitai` fails the
 * build otherwise, because an unplaced environment is unreachable from the
 * home page's explorer.
 */
export const uncategorisedEnvironmentIds: string[] = industryUseCases
  .map((entry) => entry.id)
  .filter(
    (id) =>
      !environmentCategories.some((category) =>
        category.environmentIds.includes(id),
      ),
  );

/** Ids more than one category claims, which would double-count the total. */
export const duplicateEnvironmentIds: string[] = (() => {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const category of environmentCategories) {
    for (const id of category.environmentIds) {
      if (seen.has(id)) twice.add(id);
      seen.add(id);
    }
  }
  return [...twice];
})();

/** Category ids referencing an environment that no longer exists. */
export const unknownEnvironmentReferences: string[] = environmentCategories
  .flatMap((category) =>
    category.environmentIds.map((id) => ({ category: category.id, id })),
  )
  .filter((entry) => !environmentById(entry.id))
  .map((entry) => `${entry.category} → ${entry.id}`);
