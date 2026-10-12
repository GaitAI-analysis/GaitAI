/**
 * Pure layout code shared by the SVG renderers and the geometry check. Nothing
 * here touches React or CSS, so `scripts/check-wiki-diagrams.ts` can replay the
 * exact coordinates the pages render.
 */
import { along, anchor, longestSegmentMid, route, textWidth, type Pt, type Side } from "./geometry";
import type { DiagramEdge, DiagramNode, ErEntity, ErRelation, ErSpec, SequenceParticipant, SequenceSpec, SequenceStep } from "./types";

/** Typography used by every renderer, in SVG user units. */
export const FONT = { title: 13, subtitle: 11, tag: 9, label: 11, sublabel: 9.5, group: 10, note: 10.5, column: 10.5 } as const;

// ---------------------------------------------------------------- architecture

export interface ResolvedEdge { edge: DiagramEdge; points: Pt[]; label?: { p: Pt; vertical: boolean } }

export const boxesOf = (nodes: DiagramNode[]) => new Map(nodes.map((n) => [n.id, n]));

function defaultSide(from: { x: number; y: number; w: number; h: number }, to: { x: number; y: number; w: number; h: number }): Side {
  const dx = (to.x + to.w / 2) - (from.x + from.w / 2);
  const dy = (to.y + to.h / 2) - (from.y + from.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "bottom" : "top";
}

export function resolveEdge(edge: DiagramEdge, boxes: Map<string, DiagramNode>): ResolvedEdge {
  const from = boxes.get(edge.from);
  const to = boxes.get(edge.to);
  if (!from || !to) throw new Error(`Diagram edge ${edge.id} references an unknown node (${edge.from} → ${edge.to})`);
  const fromSide: Side = edge.fromSide ?? defaultSide(from, to);
  const toSide: Side = edge.toSide ?? defaultSide(to, from);
  const a = anchor(from, fromSide, edge.fromAt);
  const b = anchor(to, toSide, edge.toAt);
  const points = route(a, fromSide, b, toSide, edge.via, edge.points);
  const label = edge.label ? along(points, edge.labelAt ?? longestSegmentMid(points)) : undefined;
  return { edge, points, label };
}

// ------------------------------------------------------------------------- ER

export const ER = { width: 196, header: 26, row: 17, pad: 8, more: 15 } as const;

export interface ErBox { entity: ErEntity; x: number; y: number; w: number; h: number }

export const erBoxes = (spec: ErSpec): Map<string, ErBox> => new Map(spec.entities.map((entity) => {
  const w = entity.w ?? ER.width;
  const h = ER.header + entity.columns.length * ER.row + (entity.more ? ER.more : 0) + ER.pad;
  return [entity.id, { entity, x: entity.x, y: entity.y, w, h }];
}));

export interface ResolvedRelation { relation: ErRelation; points: Pt[]; label?: Pt }

export function resolveRelation(relation: ErRelation, boxes: Map<string, ErBox>): ResolvedRelation {
  const from = boxes.get(relation.from);
  const to = boxes.get(relation.to);
  if (!from || !to) throw new Error(`ER relation ${relation.id} references an unknown entity`);
  const fromSide: Side = relation.fromSide ?? (to.x > from.x + from.w ? "right" : to.x + to.w < from.x ? "left" : to.y > from.y ? "bottom" : "top");
  const toSide: Side = relation.toSide ?? (from.x > to.x + to.w ? "right" : from.x + from.w < to.x ? "left" : from.y > to.y ? "bottom" : "top");
  const a = anchor(from, fromSide, relation.fromAt);
  const b = anchor(to, toSide, relation.toAt);
  const points = route(a, fromSide, b, toSide, relation.via, relation.points);
  const label = relation.label ? along(points, relation.labelAt ?? longestSegmentMid(points)).p : undefined;
  return { relation, points, label };
}

// ------------------------------------------------------------------- sequence

const MARGIN = 16;
const HEADER_H = 46;
const TOP = 14;
export const SEQ = { MARGIN, HEADER_H, TOP } as const;

export interface SeqMessage { y: number; from: string; to: string; x1: number; x2: number; label: string; detail?: string; style: "call" | "return" | "async" }
export interface SeqSelf { y: number; at: string; x: number; label: string; detail?: string }
export interface SeqNote { y: number; x1: number; x2: number; text: string[] }
export interface SeqDivider { y: number; label: string }
export interface SeqFragment { x1: number; y1: number; x2: number; y2: number; kind: string; label: string; dividers: { y: number; label: string }[] }
export interface SeqActivation { at: string; x: number; y1: number; y2: number }
export interface SequenceLayout {
  width: number;
  height: number;
  columns: { participant: SequenceParticipant; x: number; w: number; cx: number }[];
  lifelineTop: number;
  messages: SeqMessage[];
  selfs: SeqSelf[];
  notes: SeqNote[];
  dividers: SeqDivider[];
  fragments: SeqFragment[];
  activations: SeqActivation[];
}

/** Deterministic layout shared by the renderer and the geometry check. */
export function layoutSequence(spec: SequenceSpec): SequenceLayout {
  const n = spec.participants.length;
  const slot = (spec.width - MARGIN * 2) / n;
  const w = Math.min(176, slot - 12);
  const columns = spec.participants.map((participant, i) => {
    const x = MARGIN + i * slot + (slot - w) / 2;
    return { participant, x, w, cx: x + w / 2 };
  });
  const cxOf = (id: string) => {
    const column = columns.find((c) => c.participant.id === id);
    if (!column) throw new Error(`Sequence ${spec.id}: unknown participant ${id}`);
    return column.cx;
  };
  const hasSub = spec.participants.some((p) => p.sublabel);
  const lifelineTop = TOP + HEADER_H + (hasSub ? 10 : 0);
  const out: SequenceLayout = { width: spec.width, height: 0, columns, lifelineTop, messages: [], selfs: [], notes: [], dividers: [], fragments: [], activations: [] };
  const open = new Map<string, number>();
  let y = lifelineTop + 26;

  const walk = (steps: SequenceStep[], depth: number): { minX: number; maxX: number } => {
    let minX = Infinity;
    let maxX = -Infinity;
    const touch = (...xs: number[]) => { for (const x of xs) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } };
    for (const step of steps) {
      switch (step.type) {
        case "message": {
          const x1 = cxOf(step.from);
          const x2 = cxOf(step.to);
          y += step.detail ? 10 : 0;
          if (step.activate && !open.has(step.to)) open.set(step.to, y);
          const dir = x2 > x1 ? 1 : -1;
          const startPad = open.has(step.from) ? 5 : 0;
          const endPad = open.has(step.to) ? 5 : 0;
          out.messages.push({ y, from: step.from, to: step.to, x1: x1 + dir * startPad, x2: x2 - dir * endPad, label: step.label, detail: step.detail, style: step.style ?? "call" });
          if (step.deactivate && open.has(step.from)) { out.activations.push({ at: step.from, x: x1, y1: open.get(step.from)!, y2: y }); open.delete(step.from); }
          touch(x1, x2);
          y += step.detail ? 40 : 32;
          break;
        }
        case "self": {
          const x = cxOf(step.at);
          out.selfs.push({ y, at: step.at, x: x + (open.has(step.at) ? 5 : 0), label: step.label, detail: step.detail });
          touch(x, x + 140);
          y += step.detail ? 50 : 40;
          break;
        }
        case "note": {
          const ids = Array.isArray(step.over) ? step.over : [step.over, step.over];
          const a = cxOf(ids[0]);
          const b = cxOf(ids[1]);
          const widest = Math.max(...step.text.map((t) => textWidth(t, FONT.note))) + 24;
          const span = Array.isArray(step.over) ? Math.max(Math.abs(b - a) + 60, widest) : widest;
          const centre = (a + b) / 2;
          out.notes.push({ y, x1: centre - span / 2, x2: centre + span / 2, text: step.text });
          touch(centre - span / 2, centre + span / 2);
          y += step.text.length * 14 + 22;
          break;
        }
        case "divider":
          out.dividers.push({ y: y + 4, label: step.label });
          y += 36;
          break;
        case "fragment": {
          const y1 = y;
          y += 34;
          const extents = [walk(step.steps, depth + 1)];
          const dividers: { y: number; label: string }[] = [];
          for (const alternative of step.alternatives ?? []) {
            dividers.push({ y: y - 4, label: alternative.label });
            y += 30;
            extents.push(walk(alternative.steps, depth + 1));
          }
          y += 6;
          const inset = 34 - depth * 8;
          const x1 = Math.max(MARGIN + 2 + depth * 8, Math.min(...extents.map((e) => e.minX)) - inset);
          const x2 = Math.min(spec.width - MARGIN - 2 - depth * 8, Math.max(...extents.map((e) => e.maxX)) + inset);
          out.fragments.push({ x1, y1, x2, y2: y, kind: step.kind, label: step.label, dividers });
          touch(x1, x2);
          y += 14;
          break;
        }
      }
    }
    return { minX, maxX };
  };
  walk(spec.steps, 0);
  for (const [at, y1] of open) out.activations.push({ at, x: cxOf(at), y1, y2: y - 10 });
  out.height = y + 12;
  return out;
}
