import type { Pt, Side } from "./geometry";

/** A component, store, device or actor drawn as a box. Coordinates are SVG user units. */
export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Primary label. Use "\n" for a manual line break. */
  title: string;
  /** Smaller, muted label under the title. "\n" allowed. */
  subtitle?: string;
  kind?: "component" | "store" | "external" | "actor" | "function" | "artifact" | "device" | "job";
  /** Accent marks the shared trust boundary (one or two nodes per figure); muted is for passive artefacts. */
  tone?: "default" | "accent" | "muted";
  /** Small-caps tag in the top-right corner, e.g. a protocol or runtime. */
  tag?: string;
}

/** A boundary: network zone, process, device or trust domain. Drawn behind nodes. */
export interface DiagramGroup {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  subtitle?: string;
  tone?: "client" | "app" | "data" | "external" | "ci" | "device" | "neutral";
  /** Title alignment inside the boundary. */
  align?: "left" | "right";
}

/** A directed relationship between two nodes, routed orthogonally. */
export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  fromSide?: Side;
  toSide?: Side;
  /** Offset along the departure side as a fraction of its length (−0.5 … 0.5). */
  fromAt?: number;
  toAt?: number;
  label?: string;
  /** Second, smaller label line (protocol, cardinality, timing). */
  sublabel?: string;
  /** Position of the label along the route (0 … 1). Defaults to the middle of the longest segment. */
  labelAt?: number;
  style?: "solid" | "dashed" | "dotted";
  arrow?: "end" | "both" | "none";
  tone?: "default" | "accent" | "muted";
  /** Coordinate of the middle leg for two-bend routes: x for horizontal departures, y for vertical. */
  via?: number;
  /** Explicit intermediate waypoints; replaces automatic routing. */
  points?: Pt[];
}

export interface DiagramNote {
  id: string;
  x: number;
  y: number;
  /** Lines of text; each entry is one line. */
  text: string[];
  /** Maximum width used by the geometry check. */
  w: number;
  align?: "left" | "right";
}

export interface LegendItem { style: "solid" | "dashed" | "dotted" | "accent" | "box-external" | "box-store" | "box-function"; label: string }

export interface ArchitectureSpec {
  kind: "architecture";
  id: string;
  title: string;
  /** One or two sentences read by assistive technology and shown under the figure. */
  description: string;
  /** Plain-language relationships for the text alternative. */
  relationships: string[];
  width: number;
  height: number;
  groups?: DiagramGroup[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  notes?: DiagramNote[];
  legend?: LegendItem[];
}

export interface SequenceParticipant {
  id: string;
  label: string;
  sublabel?: string;
  kind?: "actor" | "system" | "external" | "store";
}

export type SequenceStep =
  | { type: "message"; from: string; to: string; label: string; detail?: string; style?: "call" | "return" | "async"; activate?: boolean; deactivate?: boolean }
  | { type: "self"; at: string; label: string; detail?: string }
  | { type: "note"; over: string | [string, string]; text: string[] }
  | { type: "divider"; label: string }
  | { type: "fragment"; kind: "alt" | "opt" | "loop" | "par"; label: string; steps: SequenceStep[]; alternatives?: { label: string; steps: SequenceStep[] }[] };

export interface SequenceSpec {
  kind: "sequence";
  id: string;
  title: string;
  description: string;
  relationships: string[];
  width: number;
  participants: SequenceParticipant[];
  steps: SequenceStep[];
  legend?: LegendItem[];
}

export type Cardinality = "1" | "0..1" | "1..*" | "0..*";

export interface ErColumn {
  name: string;
  type?: string;
  key?: "PK" | "FK" | "PK FK" | "UQ";
  /** Column stores a hash or ciphertext rather than the plain value. */
  protected?: boolean;
}

export interface ErEntity {
  id: string;
  x: number;
  y: number;
  w?: number;
  name: string;
  columns: ErColumn[];
  /** e.g. "+ 9 more columns" */
  more?: string;
  tone?: "default" | "accent" | "muted";
}

export interface ErRelation {
  id: string;
  from: string;
  to: string;
  fromCard: Cardinality;
  toCard: Cardinality;
  label?: string;
  fromSide?: Side;
  toSide?: Side;
  fromAt?: number;
  toAt?: number;
  labelAt?: number;
  via?: number;
  points?: Pt[];
  style?: "solid" | "dashed";
}

export interface ErSpec {
  kind: "er";
  id: string;
  title: string;
  description: string;
  relationships: string[];
  width: number;
  height: number;
  groups?: DiagramGroup[];
  entities: ErEntity[];
  relations: ErRelation[];
  notes?: DiagramNote[];
  legend?: LegendItem[];
}

export type DiagramSpec = ArchitectureSpec | SequenceSpec | ErSpec;
