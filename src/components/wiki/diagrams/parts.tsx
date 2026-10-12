import { lines, pathOf, textWidth, type Pt } from "./geometry";
import { FONT, type ResolvedEdge } from "./layout";
import type { DiagramGroup, DiagramNode, DiagramNote, LegendItem } from "./types";
import styles from "./diagrams.module.css";

export function Defs({ id }: { id: string }) {
  const marker = (tone: string, open = false) => <marker key={tone + (open ? "-open" : "")} id={`${id}-arrow-${tone}${open ? "-open" : ""}`} viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
    {open ? <path d="M 1 1 L 11 6 L 1 11" className={`${styles.arrowOpen} ${styles[`tone-${tone}`]}`} /> : <path d="M 0 0.5 L 12 6 L 0 11.5 Z" className={`${styles.arrowHead} ${styles[`tone-${tone}`]}`} />}
  </marker>;
  return <defs>{["default", "accent", "muted"].flatMap((tone) => [marker(tone), marker(tone, true)])}</defs>;
}

/** Boundary frame, drawn behind everything. */
export function Group({ group }: { group: DiagramGroup }) {
  return <g className={`${styles.group} ${styles[`group-${group.tone ?? "neutral"}`]}`} data-group={group.id}>
    <rect x={group.x} y={group.y} width={group.w} height={group.h} rx={10} />
  </g>;
}

/** Boundary title on a knock-out tab, drawn after the connectors so a line crossing the header passes behind the text. */
export function GroupTitle({ group }: { group: DiagramGroup }) {
  const right = group.align === "right";
  const tx = right ? group.x + group.w - 14 : group.x + 14;
  const width = Math.max(textWidth(group.title.toUpperCase(), FONT.group, 600) * 1.14, group.subtitle ? textWidth(group.subtitle, FONT.group) : 0) + 16;
  const height = group.subtitle ? 32 : 18;
  return <g className={styles.groupTitleTab} data-group-title={group.id}>
    <rect x={right ? group.x + group.w - 6 - width : group.x + 6} y={group.y + 6} width={width} height={height} rx={4} className={styles.halo} />
    <text x={tx} y={group.y + 19} textAnchor={right ? "end" : "start"} className={styles.groupTitle}>{group.title.toUpperCase()}</text>
    {group.subtitle && <text x={tx} y={group.y + 33} textAnchor={right ? "end" : "start"} className={styles.groupSubtitle}>{group.subtitle}</text>}
  </g>;
}

function Shape({ node }: { node: DiagramNode }) {
  const { x, y, w, h } = node;
  switch (node.kind) {
    case "store": {
      const ry = 7;
      return <>
        <path d={`M${x} ${y + ry} A${w / 2} ${ry} 0 0 1 ${x + w} ${y + ry} V${y + h - ry} A${w / 2} ${ry} 0 0 1 ${x} ${y + h - ry} Z`} className={styles.shape} />
        <path d={`M${x} ${y + ry} A${w / 2} ${ry} 0 0 0 ${x + w} ${y + ry}`} className={styles.shapeLine} />
      </>;
    }
    case "artifact":
      return <path d={`M${x} ${y} H${x + w - 12} L${x + w} ${y + 12} V${y + h} H${x} Z M${x + w - 12} ${y} V${y + 12} H${x + w}`} className={styles.shape} />;
    case "function":
      return <><rect x={x} y={y} width={w} height={h} rx={6} className={styles.shape} /><rect x={x} y={y + 8} width={3} height={h - 16} className={styles.accentBar} /></>;
    case "device":
      return <><rect x={x} y={y} width={w} height={h} rx={14} className={styles.shape} /><rect x={x + 8} y={y + 8} width={w - 16} height={h - 16} rx={6} className={styles.shapeInner} /></>;
    case "actor":
      return <><circle cx={x + w / 2} cy={y + 11} r={7} className={styles.shape} /><path d={`M${x + w / 2 - 14} ${y + 34} C${x + w / 2 - 14} ${y + 22} ${x + w / 2 + 14} ${y + 22} ${x + w / 2 + 14} ${y + 34}`} className={styles.shape} /></>;
    case "job":
      return <rect x={x} y={y} width={w} height={h} rx={h / 2} className={styles.shape} />;
    case "external":
      return <rect x={x} y={y} width={w} height={h} rx={6} className={`${styles.shape} ${styles.shapeExternal}`} />;
    default:
      return <rect x={x} y={y} width={w} height={h} rx={6} className={styles.shape} />;
  }
}

export function Node({ node }: { node: DiagramNode }) {
  const title = lines(node.title);
  const subtitle = lines(node.subtitle);
  const actor = node.kind === "actor";
  const store = node.kind === "store";
  const lineHeight = 15;
  const subHeight = 13;
  const block = title.length * lineHeight + (subtitle.length ? subtitle.length * subHeight + 3 : 0);
  const top = actor ? node.y + 50 : node.y + (node.h - block) / 2 + (store ? 4 : 0) + 11;
  const cx = node.x + node.w / 2;
  return <g className={`${styles.node} ${styles[`node-${node.kind ?? "component"}`]} ${styles[`tone-${node.tone ?? "default"}`]}`} data-node={node.id}>
    <Shape node={node} />
    {node.tag && <text x={node.x + node.w - 9} y={node.y + 13} textAnchor="end" className={styles.tag}>{node.tag.toUpperCase()}</text>}
    {title.map((line, i) => <text key={`t${i}`} x={cx} y={top + i * lineHeight} textAnchor="middle" className={styles.nodeTitle}>{line}</text>)}
    {subtitle.map((line, i) => <text key={`s${i}`} x={cx} y={top + title.length * lineHeight + 2 + i * subHeight} textAnchor="middle" className={styles.nodeSubtitle}>{line}</text>)}
  </g>;
}

export function Edge({ resolved, diagramId }: { resolved: ResolvedEdge; diagramId: string }) {
  const { edge, points, label } = resolved;
  const tone = edge.tone ?? "default";
  const open = edge.style === "dashed" || edge.style === "dotted";
  const marker = `url(#${diagramId}-arrow-${tone}${open ? "-open" : ""})`;
  const arrow = edge.arrow ?? "end";
  return <g className={`${styles.edge} ${styles[`edge-${edge.style ?? "solid"}`]} ${styles[`tone-${tone}`]}`} data-edge={edge.id}>
    <path d={pathOf(points)} markerEnd={arrow === "none" ? undefined : marker} markerStart={arrow === "both" ? marker : undefined} />
    {label && edge.label && <EdgeLabel p={label.p} label={edge.label} sublabel={edge.sublabel} />}
  </g>;
}

/** Connector label with a knock-out halo so it reads over the line it describes. */
export function EdgeLabel({ p, label, sublabel }: { p: Pt; label: string; sublabel?: string }) {
  const w = Math.max(textWidth(label, FONT.label), sublabel ? textWidth(sublabel, FONT.sublabel) : 0) + 12;
  const h = sublabel ? 30 : 18;
  return <g className={styles.edgeLabel}>
    <rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} rx={3} className={styles.halo} />
    <text x={p.x} y={p.y + (sublabel ? -2 : 4)} textAnchor="middle" className={styles.labelText}>{label}</text>
    {sublabel && <text x={p.x} y={p.y + 10} textAnchor="middle" className={styles.sublabelText}>{sublabel}</text>}
  </g>;
}

export function Note({ note }: { note: DiagramNote }) {
  const right = note.align === "right";
  return <g className={styles.note} data-note={note.id}>
    {!right && <rect x={note.x} y={note.y - 10} width={2} height={note.text.length * 14 + 6} className={styles.noteRule} />}
    {note.text.map((line, i) => <text key={i} x={right ? note.x + note.w : note.x + 10} y={note.y + i * 14} textAnchor={right ? "end" : "start"}>{line}</text>)}
  </g>;
}

export function Legend({ items, x, y, width }: { items: LegendItem[]; x: number; y: number; width: number }) {
  let cursor = x;
  const columns = items.map((item) => {
    const w = textWidth(item.label, FONT.sublabel) + 44;
    const entry = { item, x: cursor, w };
    cursor += w;
    return entry;
  });
  const scale = cursor - x > width ? width / (cursor - x) : 1;
  return <g className={styles.legend}>
    {columns.map(({ item, x: ix }) => {
      const lx = x + (ix - x) * scale;
      return <g key={item.label}>
        {item.style.startsWith("box") ? <rect x={lx} y={y - 6} width={20} height={12} rx={3} className={`${styles.legendBox} ${styles[`legend-${item.style}`]}`} /> : <path d={`M${lx} ${y} H${lx + 22}`} className={`${styles.legendLine} ${styles[`legend-${item.style}`]}`} />}
        <text x={lx + 30} y={y + 3.5}>{item.label}</text>
      </g>;
    })}
  </g>;
}
