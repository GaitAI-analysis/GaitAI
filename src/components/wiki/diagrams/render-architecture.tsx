import { boxesOf, resolveEdge } from "./layout";
import { Defs, Edge, Group, GroupTitle, Legend, Node, Note } from "./parts";
import type { ArchitectureSpec } from "./types";

export function ArchitectureSvg({ spec, idPrefix }: { spec: ArchitectureSpec; idPrefix: string }) {
  const boxes = boxesOf(spec.nodes);
  const legendHeight = spec.legend ? 30 : 0;
  return <svg viewBox={`0 0 ${spec.width} ${spec.height + legendHeight}`} role="img" aria-labelledby={`${idPrefix}-title ${idPrefix}-desc`} data-diagram={spec.id}>
    <title id={`${idPrefix}-title`}>{spec.title}</title>
    <desc id={`${idPrefix}-desc`}>{spec.description}</desc>
    <Defs id={idPrefix} />
    {spec.groups?.map((group) => <Group key={group.id} group={group} />)}
    {spec.edges.map((edge) => <Edge key={edge.id} resolved={resolveEdge(edge, boxes)} diagramId={idPrefix} />)}
    {spec.groups?.map((group) => <GroupTitle key={group.id} group={group} />)}
    {spec.nodes.map((node) => <Node key={node.id} node={node} />)}
    {spec.notes?.map((note) => <Note key={note.id} note={note} />)}
    {spec.legend && <Legend items={spec.legend} x={16} y={spec.height + 14} width={spec.width - 32} />}
  </svg>;
}
