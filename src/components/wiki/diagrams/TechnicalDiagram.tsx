import { DiagramFrame } from "./DiagramFrame";
import { ArchitectureSvg } from "./render-architecture";
import { ErSvg } from "./render-er";
import { SequenceSvg } from "./render-sequence";
import { diagramRegistry, type DiagramEntry } from "./registry";
import styles from "./diagrams.module.css";

const KIND_LABEL = { architecture: "ARCHITECTURE", sequence: "SEQUENCE", er: "ENTITY RELATIONSHIP" } as const;

/**
 * Server-rendered technical figure. The SVG is in the static HTML (no JavaScript
 * needed to read it); the client frame only adds enlarge and download tools.
 */
export function TechnicalDiagram({ name, index }: { name: string; index: number }) {
  const entry: DiagramEntry | undefined = diagramRegistry[name];
  if (!entry) throw new Error(`Unknown Wiki diagram: ${name}`);
  const { spec } = entry;
  const id = `figure-${spec.id}`;
  const idPrefix = `${id}-svg`;
  const svg = spec.kind === "architecture" ? <ArchitectureSvg spec={spec} idPrefix={idPrefix} /> : spec.kind === "sequence" ? <SequenceSvg spec={spec} idPrefix={idPrefix} /> : <ErSvg spec={spec} idPrefix={idPrefix} />;
  return <DiagramFrame
    id={id}
    title={spec.title}
    minWidth={entry.minWidth}
    kicker={<><b>FIGURE {index}</b> · {KIND_LABEL[spec.kind]} · {entry.scope.toUpperCase()}</>}
    caption={<figcaption className={styles.caption}><b>Figure {index}. {spec.title}.</b> {spec.description} <span>Sources reviewed: {entry.sources.join(", ")}.</span></figcaption>}
    alternative={<details className={styles.alt}><summary>Text description of this diagram</summary><ul>{spec.relationships.map((line) => <li key={line}>{line}</li>)}</ul></details>}
  >{svg}</DiagramFrame>;
}
