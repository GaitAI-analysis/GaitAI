import { pathOf, type Pt } from "./geometry";
import { ER, erBoxes, resolveRelation } from "./layout";
import { Defs, EdgeLabel, Group, GroupTitle, Legend, Note } from "./parts";
import type { Cardinality, ErSpec } from "./types";
import styles from "./diagrams.module.css";

const GLYPH = 24;

/** Crow's-foot notation at an endpoint; `d` points from the entity edge into the connector. */
function CardinalityGlyph({ p, d, card }: { p: Pt; d: Pt; card: Cardinality }) {
  const n = { x: -d.y, y: d.x };
  const at = (k: number) => ({ x: p.x + d.x * k, y: p.y + d.y * k });
  const bar = (k: number) => { const c = at(k); return `M${c.x + n.x * 6} ${c.y + n.y * 6} L${c.x - n.x * 6} ${c.y - n.y * 6}`; };
  const foot = () => { const c = at(14); return `M${c.x} ${c.y} L${p.x + n.x * 6} ${p.y + n.y * 6} M${c.x} ${c.y} L${p.x - n.x * 6} ${p.y - n.y * 6} M${c.x} ${c.y} L${p.x} ${p.y}`; };
  const many = card.endsWith("*");
  const optional = card.startsWith("0");
  return <g className={styles.cardinality}>
    {many ? <path d={foot()} /> : <path d={`${bar(8)} ${card === "1" ? bar(13) : ""}`} />}
    {many && !optional && <path d={bar(19)} />}
    {optional && <circle cx={at(many ? 22 : 16).x} cy={at(many ? 22 : 16).y} r={4} />}
  </g>;
}

const unit = (a: Pt, b: Pt): Pt => { const l = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; };

export function ErSvg({ spec, idPrefix }: { spec: ErSpec; idPrefix: string }) {
  const boxes = erBoxes(spec);
  const legendHeight = spec.legend ? 30 : 0;
  return <svg viewBox={`0 0 ${spec.width} ${spec.height + legendHeight}`} role="img" aria-labelledby={`${idPrefix}-title ${idPrefix}-desc`} data-diagram={spec.id}>
    <title id={`${idPrefix}-title`}>{spec.title}</title>
    <desc id={`${idPrefix}-desc`}>{spec.description}</desc>
    <Defs id={idPrefix} />
    {spec.groups?.map((group) => <Group key={group.id} group={group} />)}
    {spec.relations.map((relation) => {
      const { points, label } = resolveRelation(relation, boxes);
      const first = points[0];
      const last = points[points.length - 1];
      const dStart = unit(first, points[1]);
      const dEnd = unit(last, points[points.length - 2]);
      const trimmed = [{ x: first.x + dStart.x * GLYPH, y: first.y + dStart.y * GLYPH }, ...points.slice(1, -1), { x: last.x + dEnd.x * GLYPH, y: last.y + dEnd.y * GLYPH }];
      return <g key={relation.id} className={`${styles.relation} ${relation.style === "dashed" ? styles["edge-dashed"] : ""}`} data-relation={relation.id}>
        <path d={pathOf(trimmed)} />
        <CardinalityGlyph p={first} d={dStart} card={relation.fromCard} />
        <CardinalityGlyph p={last} d={dEnd} card={relation.toCard} />
        {label && relation.label && <EdgeLabel p={label} label={relation.label} />}
      </g>;
    })}
    {spec.groups?.map((group) => <GroupTitle key={group.id} group={group} />)}
    {[...boxes.values()].map(({ entity, x, y, w, h }) => <g key={entity.id} className={`${styles.entity} ${styles[`tone-${entity.tone ?? "default"}`]}`} data-entity={entity.id}>
      <rect x={x} y={y} width={w} height={h} rx={5} className={styles.shape} />
      <path d={`M${x + 5} ${y} H${x + w - 5} A5 5 0 0 1 ${x + w} ${y + 5} V${y + ER.header} H${x} V${y + 5} A5 5 0 0 1 ${x + 5} ${y} Z`} className={styles.entityHeader} />
      <path d={`M${x} ${y + ER.header} H${x + w}`} className={styles.shapeLine} />
      <text x={x + 10} y={y + 17} className={styles.entityName}>{entity.name}</text>
      {entity.columns.map((column, i) => {
        const cy = y + ER.header + i * ER.row + 12;
        return <g key={column.name} className={column.protected ? styles.protectedColumn : undefined}>
          {column.key && <text x={x + 9} y={cy} className={`${styles.keyBadge} ${column.key.startsWith("PK") ? styles.keyPrimary : ""}`}>{column.key}</text>}
          <text x={x + (column.key ? 42 : 10)} y={cy} className={styles.columnName}>{column.name}</text>
          {column.type && <text x={x + w - 9} y={cy} textAnchor="end" className={styles.columnType}>{column.type}</text>}
        </g>;
      })}
      {entity.more && <text x={x + 10} y={y + ER.header + entity.columns.length * ER.row + 11} className={styles.columnMore}>{entity.more}</text>}
    </g>)}
    {spec.notes?.map((note) => <Note key={note.id} note={note} />)}
    {spec.legend && <Legend items={spec.legend} x={16} y={spec.height + 14} width={spec.width - 32} />}
  </svg>;
}
