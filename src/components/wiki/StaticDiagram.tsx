import { TechnicalDiagram } from "./diagrams/TechnicalDiagram";

/**
 * Markdown entry point for the ```diagram fences in content/wiki. The body of the
 * fence names an entry in src/components/wiki/diagrams/registry.ts. Figures are
 * numbered per article by WikiMarkdown.
 */
export function StaticDiagram({ name, index = 1 }: { name: string; index?: number }) {
  return <TechnicalDiagram name={name} index={index} />;
}
