/**
 * Geometry check for the Wiki's technical diagrams.
 *
 * Replays the same layout code the pages render with and asserts, for every
 * registered figure: unique ids, no overlapping boxes, every connector endpoint
 * on the boundary of the box it names, no connector running through an
 * unrelated box, every label narrower than the box or gap that holds it, and
 * a usable text alternative. Run through `npm run test:wiki`.
 */
import assert from "node:assert/strict";
import { lines, textWidth, type Pt } from "../src/components/wiki/diagrams/geometry";
import { boxesOf, erBoxes, FONT, layoutSequence, resolveEdge, resolveRelation } from "../src/components/wiki/diagrams/layout";
import { diagramRegistry } from "../src/components/wiki/diagrams/registry";
import type { DiagramNode } from "../src/components/wiki/diagrams/types";

interface Rect { id: string; x: number; y: number; w: number; h: number }
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const onBoundary = (p: Pt, r: Rect) => (Math.abs(p.x - r.x) < 0.01 || Math.abs(p.x - r.x - r.w) < 0.01) && p.y >= r.y - 0.01 && p.y <= r.y + r.h + 0.01
  || (Math.abs(p.y - r.y) < 0.01 || Math.abs(p.y - r.y - r.h) < 0.01) && p.x >= r.x - 0.01 && p.x <= r.x + r.w + 0.01;
const inside = (p: Pt, r: Rect, pad = 0.5) => p.x > r.x + pad && p.x < r.x + r.w - pad && p.y > r.y + pad && p.y < r.y + r.h - pad;

/** Does the segment a→b (axis-aligned) pass through the interior of r? */
function segmentCrosses(a: Pt, b: Pt, r: Rect): boolean {
  const steps = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (inside({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, r, 1)) return true;
  }
  return false;
}

let figures = 0, boxes = 0, connectors = 0, labels = 0;
const problems: string[] = [];
const report = (figure: string, message: string) => problems.push(`${figure}: ${message}`);

function checkNodeText(figure: string, node: DiagramNode) {
  const inner = node.w - 14;
  for (const line of lines(node.title)) { labels++; if (textWidth(line, FONT.title, 600) > inner) report(figure, `title "${line}" is wider than node ${node.id} (${Math.round(textWidth(line, FONT.title, 600))} > ${inner})`); }
  for (const line of lines(node.subtitle)) { labels++; if (textWidth(line, FONT.subtitle) > inner) report(figure, `subtitle "${line}" is wider than node ${node.id} (${Math.round(textWidth(line, FONT.subtitle))} > ${inner})`); }
  const block = lines(node.title).length * 15 + (node.subtitle ? lines(node.subtitle).length * 13 + 3 : 0) + (node.kind === "actor" ? 40 : 0);
  if (block > node.h - 8) report(figure, `node ${node.id} text block (${block}) taller than the box (${node.h})`);
}

for (const [name, entry] of Object.entries(diagramRegistry)) {
  const { spec } = entry;
  figures++;
  assert.equal(spec.id, name, `registry key ${name} must equal spec id ${spec.id}`);
  assert(spec.title && spec.description.length > 60, `${name}: title and description`);
  assert(spec.relationships.length >= 4, `${name}: text alternative needs at least four relationships`);
  assert(entry.sources.length >= 3, `${name}: list the reviewed sources`);
  const ids = new Set<string>();
  const unique = (id: string) => { assert(!ids.has(id), `${name}: duplicate id ${id}`); ids.add(id); };

  if (spec.kind === "architecture") {
    const rects: Rect[] = spec.nodes;
    spec.nodes.forEach((n) => { unique(n.id); boxes++; checkNodeText(name, n); });
    spec.groups?.forEach((g) => { unique(g.id); labels++; if (textWidth(g.title.toUpperCase(), FONT.group, 600) + (g.subtitle ? 0 : 0) > g.w - 28) report(name, `group title ${g.id} too wide`); if (g.subtitle && textWidth(g.subtitle, FONT.group) > g.w - 28) report(name, `group subtitle ${g.id} too wide`); });
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (overlaps(rects[i], rects[j])) report(name, `nodes ${rects[i].id} and ${rects[j].id} overlap`);
    for (const group of spec.groups ?? []) {
      for (const node of spec.nodes) {
        const fully = node.x >= group.x && node.y >= group.y && node.x + node.w <= group.x + group.w && node.y + node.h <= group.y + group.h;
        if (overlaps(node, group) && !fully) report(name, `node ${node.id} straddles group ${group.id}`);
      }
      // Nodes must sit below the group header band so the title stays readable.
      for (const node of spec.nodes) if (node.x >= group.x && node.x + node.w <= group.x + group.w && node.y >= group.y && node.y < group.y + (group.subtitle ? 38 : 24) && node.y + node.h <= group.y + group.h) report(name, `node ${node.id} covers the header of group ${group.id}`);
    }
    const map = boxesOf(spec.nodes);
    for (const edge of spec.edges) {
      unique(edge.id); connectors++;
      const { points, label } = resolveEdge(edge, map);
      const from = map.get(edge.from)!; const to = map.get(edge.to)!;
      if (!onBoundary(points[0], from)) report(name, `edge ${edge.id} does not start on ${edge.from}`);
      if (!onBoundary(points[points.length - 1], to)) report(name, `edge ${edge.id} does not end on ${edge.to}`);
      for (let i = 1; i < points.length; i++) {
        if (Math.abs(points[i].x - points[i - 1].x) > 0.01 && Math.abs(points[i].y - points[i - 1].y) > 0.01) report(name, `edge ${edge.id} has a diagonal segment`);
        for (const other of spec.nodes) if (other.id !== edge.from && other.id !== edge.to && segmentCrosses(points[i - 1], points[i], other)) report(name, `edge ${edge.id} runs through node ${other.id}`);
      }
      if (label && edge.label) {
        labels++;
        const w = Math.max(textWidth(edge.label, FONT.label), edge.sublabel ? textWidth(edge.sublabel, FONT.sublabel) : 0) + 12;
        const h = edge.sublabel ? 30 : 18;
        const halo: Rect = { id: edge.id, x: label.p.x - w / 2, y: label.p.y - h / 2, w, h };
        for (const other of spec.nodes) if (overlaps(halo, other)) report(name, `label "${edge.label}" of ${edge.id} overlaps node ${other.id}`);
        if (halo.x < 0 || halo.x + w > spec.width || halo.y < 0) report(name, `label "${edge.label}" leaves the canvas`);
      }
    }
    for (const note of spec.notes ?? []) { unique(note.id); for (const line of note.text) { labels++; if (textWidth(line, FONT.note) > note.w) report(name, `note ${note.id} line too wide: "${line.slice(0, 40)}…"`); } }
    for (const node of spec.nodes) if (node.x < 0 || node.y < 0 || node.x + node.w > spec.width || node.y + node.h > spec.height) report(name, `node ${node.id} leaves the canvas`);
  }

  if (spec.kind === "sequence") {
    const layout = layoutSequence(spec);
    spec.participants.forEach((p) => { unique(p.id); boxes++; });
    for (const column of layout.columns) { labels++; if (textWidth(column.participant.label, FONT.title, 600) > column.w - 10) report(name, `participant ${column.participant.id} label too wide`); if (column.participant.sublabel && textWidth(column.participant.sublabel, FONT.subtitle) > column.w - 8) report(name, `participant ${column.participant.id} sublabel too wide`); }
    for (const message of layout.messages) {
      connectors++; labels++;
      const span = Math.abs(message.x2 - message.x1);
      if (textWidth(message.label, FONT.label) > span + 60) report(name, `message "${message.label}" is wider than its span (${Math.round(textWidth(message.label, FONT.label))} > ${span + 60})`);
      if (message.detail && textWidth(message.detail, FONT.sublabel) > span + 80) report(name, `detail "${message.detail}" is wider than its span`);
      if (message.x1 === message.x2) report(name, `message "${message.label}" has zero length`);
    }
    for (const self of layout.selfs) { labels++; if (self.x + 34 + textWidth(self.label, FONT.label) > layout.width - 8) report(name, `self message "${self.label}" leaves the canvas`); if (self.detail && self.x + 34 + textWidth(self.detail, FONT.sublabel) > layout.width - 8) report(name, `self detail "${self.detail}" leaves the canvas`); }
    for (const note of layout.notes) { if (note.x1 < 0 || note.x2 > layout.width) report(name, `note "${note.text[0]}" leaves the canvas`); }
    for (const fragment of layout.fragments) { if (fragment.x1 < 0 || fragment.x2 > layout.width || fragment.x2 - fragment.x1 < 120) report(name, `fragment ${fragment.label} is malformed`); if (textWidth(`[${fragment.label}]`, FONT.sublabel) + 56 > fragment.x2 - fragment.x1) report(name, `fragment label "${fragment.label}" is wider than its box`); }
    assert(layout.height < 2200, `${name}: sequence is too tall (${layout.height})`);
  }

  if (spec.kind === "er") {
    const map = erBoxes(spec);
    const rects: Rect[] = [...map.values()].map((b) => ({ id: b.entity.id, x: b.x, y: b.y, w: b.w, h: b.h }));
    spec.entities.forEach((e) => { unique(e.id); boxes++; });
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (overlaps(rects[i], rects[j])) report(name, `entities ${rects[i].id} and ${rects[j].id} overlap`);
    for (const box of map.values()) {
      labels++;
      if (textWidth(box.entity.name, 12, 600) > box.w - 20) report(name, `entity name ${box.entity.name} too wide`);
      for (const column of box.entity.columns) {
        labels++;
        const used = (column.key ? 42 : 10) + textWidth(column.name, FONT.column) + (column.type ? textWidth(column.type, 9.5) + 14 : 0) + 9;
        if (used > box.w) report(name, `column ${box.entity.id}.${column.name} does not fit (${Math.round(used)} > ${box.w})`);
      }
      if (box.entity.more && textWidth(box.entity.more, 9.5) > box.w - 20) report(name, `"${box.entity.more}" too wide in ${box.entity.id}`);
      if (box.y + box.h > spec.height) report(name, `entity ${box.entity.id} leaves the canvas`);
    }
    for (const group of spec.groups ?? []) for (const box of map.values()) if (overlaps(group, { id: box.entity.id, x: box.x, y: box.y, w: box.w, h: box.h }) && !(box.x >= group.x && box.y >= group.y + 38 && box.x + box.w <= group.x + group.w && box.y + box.h <= group.y + group.h)) report(name, `entity ${box.entity.id} straddles group ${group.id}`);
    for (const relation of spec.relations) {
      unique(relation.id); connectors++;
      const { points, label } = resolveRelation(relation, map);
      const from = rects.find((r) => r.id === relation.from)!; const to = rects.find((r) => r.id === relation.to)!;
      if (!onBoundary(points[0], from)) report(name, `relation ${relation.id} does not start on ${relation.from}`);
      if (!onBoundary(points[points.length - 1], to)) report(name, `relation ${relation.id} does not end on ${relation.to}`);
      const first = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
      const last = Math.hypot(points[points.length - 1].x - points[points.length - 2].x, points[points.length - 1].y - points[points.length - 2].y);
      if (points.length === 2 ? first < 48 : first < 26 || last < 26) report(name, `relation ${relation.id} leaves no room for its cardinality glyphs (${Math.round(first)}, ${Math.round(last)})`);
      for (let i = 1; i < points.length; i++) {
        if (Math.abs(points[i].x - points[i - 1].x) > 0.01 && Math.abs(points[i].y - points[i - 1].y) > 0.01) report(name, `relation ${relation.id} has a diagonal segment`);
        for (const other of rects) if (other.id !== relation.from && other.id !== relation.to && segmentCrosses(points[i - 1], points[i], other)) report(name, `relation ${relation.id} runs through ${other.id}`);
      }
      if (label && relation.label) { labels++; const w = textWidth(relation.label, FONT.label) + 12; const halo: Rect = { id: relation.id, x: label.x - w / 2, y: label.y - 9, w, h: 18 }; for (const other of rects) if (overlaps(halo, other)) report(name, `label "${relation.label}" overlaps ${other.id}`); }
    }
    for (const note of spec.notes ?? []) { unique(note.id); for (const line of note.text) { labels++; if (textWidth(line, FONT.note) > note.w) report(name, `note line too wide: "${line.slice(0, 50)}…"`); } }
  }
}

if (problems.length) {
  console.error(problems.map((p) => ` - ${p}`).join("\n"));
  throw new Error(`${problems.length} diagram geometry problem(s)`);
}
console.log(`Diagram geometry passed: ${figures} figures, ${boxes} boxes, ${connectors} connectors, ${labels} labels measured.`);
