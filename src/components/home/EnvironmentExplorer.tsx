import { SectionHeading } from "@/components/ui/SectionHeading";
import { industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
import { productDetailBySlug } from "@/data/product-details";
import {
  categoryCount,
  environmentById,
  environmentCategories,
  familyForCategory,
} from "@/data/environment-categories";
import {
  EnvironmentExplorerView,
  type ExplorerCategory,
} from "./EnvironmentExplorerView";

/**
 * The data half of the home page's use-case explorer.
 *
 * A SERVER COMPONENT, and that is the whole reason it is a separate file from
 * the view. Resolving a Defence context means reading `product-details.ts`,
 * which is about 1,500 lines of product copy; importing it from a `"use
 * client"` module would ship every word of it to every visitor's browser to
 * render three chips. Here it is read at build time and three `{id, name}`
 * pairs cross into the client bundle.
 *
 * It also means the whole explorer — seven categories, eighteen environments,
 * every heading and every link — is in the server-rendered HTML, so what a
 * crawler sees is what a reader sees.
 */

/**
 * Where an environment card goes.
 *
 * Identical to the rule the old environment rails used, and deliberately so:
 * an environment that IS one product (Defence & Armed Forces → DefenceMotion)
 * lands on that product, anything with a use-case page lands there, and the
 * family page is the fallback. Changing it here and not there is how two
 * surfaces start disagreeing about where a card goes, which is why there is
 * now only one of them.
 */
const hrefFor = (caseId: string, vertical: Vertical) => {
  const landing = industryUseCases.find((entry) => entry.id === caseId)?.landing;
  if (landing) return landing;
  const detail = useCaseDetails.find((entry) => entry.caseId === caseId);
  return detail ? `/use-cases/${detail.slug}/` : `/${vertical}/`;
};

const FAMILY_LABEL: Record<Vertical | "mixed", string> = {
  mobilitycare: "All MobilityCare environments",
  securevision: "All SecureVision environments",
  mixed: "Both product families",
};

const FAMILY_HREF: Record<Vertical | "mixed", string> = {
  mobilitycare: "/mobilitycare/",
  securevision: "/securevision/",
  mixed: "/use-cases/",
};

/**
 * Army, Navy and Air Force, read from DefenceMotion's own record.
 *
 * Three CONFIGURATIONS of one product — the product page's `ServiceModes`
 * renders the same three in full. They are chips rather than cards because a
 * card in this grid means an environment with its own product mix, and
 * claiming three more of those would claim three products GaitAI does not
 * have. If DefenceMotion ever loses its modes, this returns nothing and the
 * chips disappear rather than going stale.
 */
function defenceContexts() {
  const detail = productDetailBySlug("defencemotion");
  if (!detail?.modes?.length) return undefined;
  /* `#modes` is the id the product page's "Service modes" block carries. */
  return detail.modes.map((mode) => ({
    id: mode.id,
    name: mode.name,
    href: "/securevision/defencemotion/#modes",
  }));
}

export function EnvironmentExplorer() {
  const categories: ExplorerCategory[] = environmentCategories.map((category) => {
    const family = familyForCategory(category);
    const cards = category.environmentIds.flatMap((id) => {
      const entry = environmentById(id);
      if (!entry) return [];
      return [
        {
          id: entry.id,
          name: entry.industry,
          outcome: entry.outcome,
          href: hrefFor(entry.id, entry.vertical),
        },
      ];
    });

    const contexts = category.id === "defence" ? defenceContexts() : undefined;

    return {
      id: category.id,
      label: category.label,
      blurb: category.blurb,
      count: categoryCount(category),
      family,
      familyHref: FAMILY_HREF[family],
      familyLabel: FAMILY_LABEL[family],
      cards,
      contexts,
      contextNote: contexts
        ? "One product, three service modes — not three products. Each configures the same movement pipeline and the same privacy controls."
        : undefined,
    };
  });

  return (
    <section
      id="use-cases"
      aria-label="Where GaitAI is used"
      className="home-section home-compact section env-section relative overflow-hidden bg-obsidian-300/40"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="env-ambient env-ambient--care" />
        <div className="env-ambient env-ambient--secure" />
      </div>
      <div className="env-dotfield pointer-events-none absolute inset-0 -z-10" />

      <div className="container-wide">
        <SectionHeading
          eyebrow="Where it is used"
          title={
            <>
              {industryUseCases.length} environments,{" "}
              <span className="text-gradient">each with its own question.</span>
            </>
          }
          description="Every environment brings a different problem, a different product mix and a different output. Start with the kind of place you work in."
          align="left"
          size="lg"
        />
        <EnvironmentExplorerView
          categories={categories}
          allHref="/use-cases/"
          total={industryUseCases.length}
        />
      </div>
    </section>
  );
}
