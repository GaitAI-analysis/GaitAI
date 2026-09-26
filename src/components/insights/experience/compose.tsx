import type { ArticleExperience } from "@/data/insight-experiences";
import { INSIGHT_TERMS, type InsightTerm } from "@/data/insight-terms";
import { Figure } from "./registry";
import type { VisualMoment } from "./VisualStory";

/**
 * Server-side glue between an article's experience record and the client
 * figures. The page calls these; nothing here holds state.
 */

export function ArticleHero({ experience }: { experience: ArticleExperience }) {
  return <Figure figure={experience.hero} articleSlug={experience.slug} />;
}

export function SectionFigures({
  experience,
  sectionId,
}: {
  experience: ArticleExperience;
  sectionId: string;
}) {
  const keys = experience.figures[sectionId];
  if (!keys || keys.length === 0) return null;
  return (
    <>
      {keys.map((key) => (
        <Figure key={key} figure={key} articleSlug={experience.slug} />
      ))}
    </>
  );
}

export function termsFor(experience: ArticleExperience | undefined, sectionId: string): InsightTerm[] {
  if (!experience) return [];
  return (experience.terms[sectionId] ?? [])
    .map((id) => INSIGHT_TERMS[id])
    .filter((term): term is InsightTerm => Boolean(term));
}

export function buildMoments(experience: ArticleExperience): VisualMoment[] {
  return experience.moments.map((moment) => ({
    id: moment.id,
    title: moment.title,
    text: moment.text,
    visual: <Figure figure={moment.figure} articleSlug={experience.slug} presentation={moment.state} />,
  }));
}
