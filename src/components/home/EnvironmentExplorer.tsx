import { SectionHeading } from "@/components/ui/SectionHeading";
import { industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
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
 * A SERVER COMPONENT, separate from the view so that the category and
 * environment records are resolved at build time and only the rendered
 * `{id, name, outcome, href}` rows cross into the client bundle.
 *
 * It also means the whole explorer — seven categories, eighteen environments,
 * every heading and every link — is in the server-rendered HTML, so what a
 * crawler sees is what a reader sees.
 */

/**
 * Where an environment card goes.
 *
 * Identical to the rule the old environment rails used, and deliberately so:
 * an environment with a use-case page lands there, and the family page is the
 * fallback. Changing it here and not there is how two surfaces start
 * disagreeing about where a card goes, which is why there is now only one of
 * them.
 */
const hrefFor = (caseId: string, vertical: Vertical) => {
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

    return {
      id: category.id,
      label: category.label,
      blurb: category.blurb,
      count: categoryCount(category),
      family,
      familyHref: FAMILY_HREF[family],
      familyLabel: FAMILY_LABEL[family],
      cards,
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
