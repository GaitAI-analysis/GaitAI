"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ListTree,
  Maximize2,
  Minus,
  PanelLeft,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Waypoints,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CORE_ID,
  NODE_TYPE_LABEL,
  gaitscapeNodes,
  gaitscapeRelationships,
  nodeById,
} from "@/data/gaitscape/graph";
import { gaitscapeChallenges } from "@/data/gaitscape/challenges";
import type {
  GaitscapeNode,
  GaitscapeNodeType,
} from "@/data/gaitscape/types";

// ============================================================================
// VISUAL CONSTANTS — one stable color per node CATEGORY (never per node)
// ============================================================================

const TYPE_COLOR: Record<GaitscapeNodeType, string> = {
  core: "#e7d3a0", // champagne / gold
  vertical: "#5eead4", // overridden per vertical below
  product: "#5b9df5", // blue
  signal: "#4fd1ff", // cyan
  capability: "#6d7ef0", // indigo
  domain: "#6fc3c3", // muted aqua
  research: "#d9c08c", // champagne
  outcome: "#b9a7f2", // soft violet
};

function nodeColor(node: GaitscapeNode): string {
  if (node.type === "vertical") {
    return node.id === "securevision" ? "#8b9cf6" : "#5eead4";
  }
  return TYPE_COLOR[node.type];
}

/** Semantic size hierarchy: core ≫ verticals ≫ mid entities ≫ supporting. */
const TYPE_RADIUS: Record<GaitscapeNodeType, number> = {
  core: 34,
  vertical: 23,
  product: 10,
  domain: 9.5,
  capability: 8.5,
  signal: 8,
  research: 7.5,
  outcome: 7.5,
};

const HUB_SCALE = 1.5;

const GROUP_OPTIONS: { id: GaitscapeNodeType; label: string }[] = [
  { id: "domain", label: "Application Domain" },
  { id: "product", label: "Product" },
  { id: "signal", label: "Movement Signal" },
  { id: "capability", label: "AI Capability" },
  { id: "vertical", label: "Vertical" },
  { id: "research", label: "Research Area" },
  { id: "outcome", label: "Outcome" },
];

const FILTER_FAMILIES: { type: GaitscapeNodeType; label: string }[] = [
  { type: "vertical", label: "Vertical" },
  { type: "domain", label: "Application Domain" },
  { type: "product", label: "Product" },
  { type: "signal", label: "Movement Signal" },
  { type: "capability", label: "AI Capability" },
  { type: "research", label: "Research Area" },
];

const LEGEND_ITEMS: { type: GaitscapeNodeType; label: string }[] = [
  { type: "core", label: "Core intelligence" },
  { type: "vertical", label: "Vertical" },
  { type: "product", label: "Product" },
  { type: "signal", label: "Movement signal" },
  { type: "capability", label: "AI capability" },
  { type: "domain", label: "Application domain" },
  { type: "research", label: "Research" },
  { type: "outcome", label: "Outcome" },
];

const CANVAS_W = 1760;
const CANVAS_H = 1120;

/** Initial camera: focused on the core → verticals story, not the full map. */
const INITIAL_K = 1.5;
const INITIAL_TRANSFORM = {
  k: INITIAL_K,
  x: (CANVAS_W / 2) * (1 - INITIAL_K),
  y: (CANVAS_H / 2) * (1 - INITIAL_K),
};

type Pos = { x: number; y: number };
type Transform = { x: number; y: number; k: number };

// ============================================================================
// GRAPH MATH
// ============================================================================

const fullAdjacency = (() => {
  const map = new Map<string, Set<string>>();
  for (const n of gaitscapeNodes) map.set(n.id, new Set());
  for (const r of gaitscapeRelationships) {
    map.get(r.source)?.add(r.target);
    map.get(r.target)?.add(r.source);
  }
  return map;
})();

function neighborhood(seeds: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const s of seeds) {
    if (!fullAdjacency.has(s)) continue;
    out.add(s);
    for (const n of fullAdjacency.get(s)!) out.add(n);
  }
  return out;
}

/** Assign every visible non-hub node to the hub it shares most links with. */
function assignToHubs(
  visible: readonly GaitscapeNode[],
  hubType: GaitscapeNodeType
) {
  const visibleIds = new Set(visible.map((n) => n.id));
  const hubs = visible.filter((n) => n.type === hubType);
  const hubIds = new Set(hubs.map((h) => h.id));
  const assignment = new Map<string, string | null>();

  for (const node of visible) {
    if (hubIds.has(node.id) || node.type === "core" || node.type === "vertical")
      continue;
    let best: string | null = null;
    let bestScore = 0;
    for (const nb of fullAdjacency.get(node.id) ?? []) {
      if (!hubIds.has(nb) || !visibleIds.has(nb)) continue;
      const hub = nodeById.get(nb);
      const score = 1 + (hub?.vertical && hub.vertical === node.vertical ? 0.5 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = nb;
      }
    }
    assignment.set(node.id, best);
  }

  // Second pass: nodes with no direct hub link follow the hub their
  // most-connected neighbors landed in.
  for (const node of visible) {
    if (
      hubIds.has(node.id) ||
      assignment.get(node.id) ||
      node.type === "core" ||
      node.type === "vertical"
    )
      continue;
    const tally = new Map<string, number>();
    for (const nb of fullAdjacency.get(node.id) ?? []) {
      if (!visibleIds.has(nb)) continue;
      const hub = assignment.get(nb);
      if (hub) tally.set(hub, (tally.get(hub) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [hub, count] of tally) {
      if (count > bestCount) {
        bestCount = count;
        best = hub;
      }
    }
    if (best) assignment.set(node.id, best);
  }

  return { hubs, assignment };
}

/** Which half of the map a hub belongs to, by vertical or product majority. */
function hubSide(hub: GaitscapeNode): "left" | "right" | null {
  if (hub.vertical) return hub.vertical === "mobilitycare" ? "left" : "right";
  let mobility = 0;
  let secure = 0;
  for (const nb of fullAdjacency.get(hub.id) ?? []) {
    const node = nodeById.get(nb);
    if (node?.type !== "product") continue;
    if (node.vertical === "mobilitycare") mobility += 1;
    else if (node.vertical === "securevision") secure += 1;
  }
  if (mobility === secure) return null;
  return mobility > secure ? "left" : "right";
}

function phyllotaxis(center: Pos, index: number, base: number, step: number): Pos {
  const r = base + step * Math.sqrt(index);
  const a = index * 2.399963229728653;
  return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
}

/**
 * Semantic cluster layout — an intentional map, not a force blob:
 * the core sits at the center, the two verticals flank it, and group hubs
 * arc around their vertical's half of the canvas with members nested
 * around each hub.
 */
function clusterLayout(
  visible: readonly GaitscapeNode[],
  hubType: GaitscapeNodeType,
  spread = 1
): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const { hubs, assignment } = assignToHubs(visible, hubType);

  pos.set(CORE_ID, { x: cx, y: cy });
  const verticalX = hubType === "vertical" ? 345 : 300;
  for (const v of visible) {
    if (v.type !== "vertical") continue;
    pos.set(v.id, {
      x: v.id === "mobilitycare" ? cx - verticalX : cx + verticalX,
      y: cy,
    });
  }

  // Non-vertical hubs arc around their side of the map.
  const left: GaitscapeNode[] = [];
  const right: GaitscapeNode[] = [];
  for (const hub of [...hubs].sort((a, b) => a.title.localeCompare(b.title))) {
    if (hub.type === "vertical") continue; // already placed
    const side = hubSide(hub);
    if (side === "left") left.push(hub);
    else if (side === "right") right.push(hub);
    else (left.length <= right.length ? left : right).push(hub);
  }

  const placeArc = (
    list: GaitscapeNode[],
    fromDeg: number,
    toDeg: number
  ) => {
    list.forEach((hub, i) => {
      const t = (i + 0.5) / list.length;
      const a = ((fromDeg + t * (toDeg - fromDeg)) * Math.PI) / 180;
      pos.set(hub.id, {
        x: cx + 655 * Math.cos(a),
        y: cy + 445 * Math.sin(a),
      });
    });
  };
  placeArc(left, 108, 252); // left half, top → bottom
  placeArc(right, -72, 72); // right half, top → bottom

  // Members nest around their hub.
  const memberIndex = new Map<string, number>();
  const centerNodes: GaitscapeNode[] = [];
  const step = (hubType === "vertical" ? 18 : 15) * spread;
  const base = 40 * Math.min(spread, 1.3);
  for (const node of visible) {
    if (pos.has(node.id)) continue;
    const hubId = assignment.get(node.id);
    if (!hubId || !pos.has(hubId)) {
      centerNodes.push(node);
      continue;
    }
    const k = memberIndex.get(hubId) ?? 0;
    memberIndex.set(hubId, k + 1);
    pos.set(node.id, phyllotaxis(pos.get(hubId)!, k + 1, base, step));
  }

  centerNodes
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((node, i) => {
      pos.set(
        node.id,
        phyllotaxis({ x: cx, y: cy }, i + 2, 95 * Math.min(spread, 1.4), 20 * spread)
      );
    });

  return pos;
}

const TREE_ORDER: GaitscapeNodeType[] = [
  "core",
  "vertical",
  "signal",
  "capability",
  "research",
  "product",
  "domain",
  "outcome",
];

function treeLayout(
  visible: readonly GaitscapeNode[],
  hubType: GaitscapeNodeType
): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const { assignment } = assignToHubs(visible, hubType);
  // Left margin leaves room for the core's large centered label.
  const colWidth = (CANVAS_W - 310) / (TREE_ORDER.length - 1);

  TREE_ORDER.forEach((type, colIdx) => {
    const column = visible
      .filter((n) => n.type === type)
      .sort((a, b) => {
        const ga = assignment.get(a.id) ?? "";
        const gb = assignment.get(b.id) ?? "";
        return ga === gb ? a.title.localeCompare(b.title) : ga.localeCompare(gb);
      });
    const x = 200 + colIdx * colWidth;
    const padding = 90;
    column.forEach((node, i) => {
      const y =
        column.length === 1
          ? CANVAS_H / 2
          : padding + (i / (column.length - 1)) * (CANVAS_H - padding * 2);
      pos.set(node.id, { x, y });
    });
  });

  return pos;
}

function edgePath(a: Pos, b: Pos): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const bow = Math.min(34, len * 0.14);
  const nx = (-dy / len) * bow;
  const ny = (dx / len) * bow;
  return `M${a.x} ${a.y} Q${mx + nx} ${my + ny} ${b.x} ${b.y}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function GaitscapeExplorer() {
  const [mode, setMode] = useState<"graph" | "list">("graph");
  const [view, setView] = useState<"cluster" | "tree">("cluster");
  const [groupBy, setGroupBy] = useState<GaitscapeNodeType>("domain");
  const [viewBy, setViewBy] = useState<"intelligence" | "challenges">(
    "intelligence"
  );
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusGroupId, setFocusGroupId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>(INITIAL_TRANSFORM);
  const [animated, setAnimated] = useState(true);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const prevFocusRef = useRef<string | null>(null);

  // Small screens start in the Accessible List — the graph stays one tap away.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setMode("list");
  }, []);

  // ---- visible node set --------------------------------------------------
  const challenge = useMemo(
    () => gaitscapeChallenges.find((c) => c.id === challengeId) ?? null,
    [challengeId]
  );

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      gaitscapeNodes
        .filter((n) => n.title.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [search]);

  // Base visibility (challenge / filters / search) — the grouping panel is
  // computed from this so its group list survives while a group is focused.
  const baseVisibleNodes = useMemo(() => {
    let ids = new Set(gaitscapeNodes.map((n) => n.id));

    if (viewBy === "challenges" && challenge) {
      ids = new Set([
        ...challenge.signalIds,
        ...challenge.capabilityIds,
        ...challenge.productIds,
        ...challenge.researchIds,
        challenge.outcomeId,
        CORE_ID,
      ]);
    }
    if (filters.size > 0) {
      const kept = neighborhood([...filters]);
      ids = new Set([...ids].filter((id) => kept.has(id)));
    }
    if (searchMatches) {
      const kept = neighborhood([...searchMatches]);
      ids = new Set([...ids].filter((id) => kept.has(id)));
    }
    return gaitscapeNodes.filter((n) => ids.has(n.id));
  }, [viewBy, challenge, filters, searchMatches]);

  const visibleNodes = useMemo(() => {
    if (!focusGroupId) return baseVisibleNodes;
    // Two hops from the focused group: the group, everything directly
    // connected (its products), plus those products' signals, capabilities,
    // research and outcomes — the full local story of that group.
    const focus = new Set<string>([focusGroupId]);
    const direct = [...(fullAdjacency.get(focusGroupId) ?? [])];
    for (const id of direct) focus.add(id);
    for (const id of direct) {
      for (const nb of fullAdjacency.get(id) ?? []) {
        const node = nodeById.get(nb);
        if (!node) continue;
        if (node.type === "domain" || node.type === "product") continue;
        focus.add(nb);
      }
    }
    return baseVisibleNodes.filter((n) => focus.has(n.id));
  }, [baseVisibleNodes, focusGroupId]);

  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleRels = useMemo(
    () =>
      gaitscapeRelationships.filter(
        (r) => visibleIds.has(r.source) && visibleIds.has(r.target)
      ),
    [visibleIds]
  );

  // ---- grouping / layout ---------------------------------------------------
  const { hubs, assignment } = useMemo(
    () => assignToHubs(visibleNodes, groupBy),
    [visibleNodes, groupBy]
  );

  // Panel groups & counts ignore the focus filter so the full group list
  // stays available for hopping between clusters.
  const { hubs: panelHubs, assignment: panelAssignment } = useMemo(
    () => assignToHubs(baseVisibleNodes, groupBy),
    [baseVisibleNodes, groupBy]
  );

  const panelCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [, hub] of panelAssignment) {
      if (hub) counts.set(hub, (counts.get(hub) ?? 0) + 1);
    }
    return counts;
  }, [panelAssignment]);

  const positions = useMemo(
    () =>
      view === "cluster"
        ? clusterLayout(
            visibleNodes,
            groupBy,
            focusGroupId || (viewBy === "challenges" && challenge) ? 1.9 : 1
          )
        : treeLayout(visibleNodes, groupBy),
    [visibleNodes, groupBy, view, focusGroupId, viewBy, challenge]
  );

  const hubIds = useMemo(() => new Set(hubs.map((h) => h.id)), [hubs]);

  // Structural edges, layered by importance: spine (core↔vertical),
  // branch (vertical↔hub side), member (node↔hub).
  const baseEdges = useMemo(() => {
    const spine: { a: string; b: string; color: string }[] = [];
    const branch: { a: string; b: string }[] = [];
    const member: { a: string; b: string }[] = [];

    if (view === "cluster") {
      for (const v of visibleNodes) {
        if (v.type !== "vertical") continue;
        if (positions.has(CORE_ID)) {
          spine.push({ a: CORE_ID, b: v.id, color: nodeColor(v) });
        }
      }
      for (const hub of hubs) {
        if (hub.type === "vertical") continue;
        const side = hubSide(hub);
        const verticalId =
          side === "left" ? "mobilitycare" : side === "right" ? "securevision" : null;
        if (verticalId && positions.has(verticalId) && positions.has(hub.id)) {
          branch.push({ a: verticalId, b: hub.id });
        }
      }
      for (const [m, hub] of assignment) {
        if (hub && positions.has(m) && positions.has(hub)) {
          member.push({ a: m, b: hub });
        }
      }
    } else {
      for (const r of visibleRels) {
        if (r.type === "belongs-to" || r.type === "grounded-in") {
          member.push({ a: r.source, b: r.target });
        }
      }
    }
    return { spine, branch, member };
  }, [view, visibleNodes, hubs, assignment, positions, visibleRels]);

  // ---- interaction helpers -------------------------------------------------
  const activeId = hoverId ?? selectedId;
  const activeNeighbors = useMemo(
    () => (activeId ? neighborhood([activeId]) : null),
    [activeId]
  );

  const activeEdges = useMemo(() => {
    if (!activeId) return [];
    return gaitscapeRelationships.filter(
      (r) =>
        (r.source === activeId || r.target === activeId) &&
        visibleIds.has(r.source) &&
        visibleIds.has(r.target)
    );
  }, [activeId, visibleIds]);

  const selected = selectedId ? nodeById.get(selectedId) ?? null : null;
  const hovered = hoverId && hoverId !== selectedId ? nodeById.get(hoverId) ?? null : null;

  // ---- zoom / pan ------------------------------------------------------------
  const zoomBy = useCallback((factor: number) => {
    setAnimated(true);
    setTransform((t) => {
      const k = Math.min(2.8, Math.max(0.45, t.k * factor));
      const cx = CANVAS_W / 2;
      const cy = CANVAS_H / 2;
      return {
        k,
        x: cx - ((cx - t.x) / t.k) * k,
        y: cy - ((cy - t.y) / t.k) * k,
      };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setAnimated(false);
      setTransform((t) => {
        const k = Math.min(2.8, Math.max(0.45, t.k * Math.exp(-event.deltaY * 0.0012)));
        const cx = CANVAS_W / 2;
        const cy = CANVAS_H / 2;
        return {
          k,
          x: cx - ((cx - t.x) / t.k) * k,
          y: cy - ((cy - t.y) / t.k) * k,
        };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, []);

  const fitView = () => {
    setAnimated(true);
    setTransform({ x: 0, y: 0, k: 1 });
  };

  // Cluster opens on the core story; the tree is a full-width diagram and
  // opens fitted.
  useEffect(() => {
    setAnimated(true);
    setTransform(view === "tree" ? { x: 0, y: 0, k: 1 } : INITIAL_TRANSFORM);
  }, [view]);

  const fullReset = () => {
    setAnimated(true);
    setTransform(INITIAL_TRANSFORM);
    setSelectedId(null);
    setHoverId(null);
    setFocusGroupId(null);
    setChallengeId(null);
    setFilters(new Set());
    setSearch("");
  };

  // Focusing a group smoothly zooms the camera to fit that cluster;
  // clearing it returns to the initial story framing.
  useEffect(() => {
    const prev = prevFocusRef.current;
    prevFocusRef.current = focusGroupId;
    if (focusGroupId === prev) return;

    setAnimated(true);
    if (!focusGroupId) {
      setTransform(INITIAL_TRANSFORM);
      return;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of visibleNodes) {
      // Frame the cluster itself — the core and flanking verticals sit far
      // away and would pull the camera off-center.
      if (node.id === CORE_ID || node.type === "vertical") continue;
      const p = positions.get(node.id);
      if (!p) continue;
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    if (!isFinite(minX)) return;
    const pad = 190;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const k = Math.min(2.2, Math.max(0.6, Math.min(CANVAS_W / w, CANVAS_H / h)));
    const bx = (minX + maxX) / 2;
    const by = (minY + maxY) / 2;
    setTransform({ k, x: CANVAS_W / 2 - bx * k, y: CANVAS_H / 2 - by * k });
  }, [focusGroupId, positions, visibleNodes]);

  // Escape closes the detail panel from anywhere in the explorer.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleFilter = (id: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectNode = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const neighborsByType = useCallback((id: string) => {
    const grouped = new Map<GaitscapeNodeType, GaitscapeNode[]>();
    for (const nb of fullAdjacency.get(id) ?? []) {
      const node = nodeById.get(nb);
      if (!node) continue;
      if (!grouped.has(node.type)) grouped.set(node.type, []);
      grouped.get(node.type)!.push(node);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return grouped;
  }, []);

  // Progressive label disclosure — the map stays calm until you engage.
  const labelVisible = useCallback(
    (node: GaitscapeNode, isHub: boolean) => {
      if (node.type === "core" || node.type === "vertical" || isHub) return true;
      // The tree is a structured diagram — every row keeps its label.
      if (view === "tree") return true;
      if (activeNeighbors?.has(node.id)) return true;
      // A search narrows the set to matches + direct relations — label all.
      if (searchMatches) return true;
      if (focusGroupId || (viewBy === "challenges" && challenge)) return true;
      return transform.k >= 1.9;
    },
    [view, activeNeighbors, searchMatches, focusGroupId, viewBy, challenge, transform.k]
  );

  const groupLabel =
    GROUP_OPTIONS.find((g) => g.id === groupBy)?.label ?? "Group";

  const hoveredTooltip = useMemo(() => {
    if (!hovered || mode !== "graph") return null;
    const p = positions.get(hovered.id);
    if (!p) return null;
    const sx = ((p.x * transform.k + transform.x) / CANVAS_W) * 100;
    const sy = ((p.y * transform.k + transform.y) / CANVAS_H) * 100;
    const connected = [...(fullAdjacency.get(hovered.id) ?? [])]
      .map((id) => nodeById.get(id)!)
      .sort((a, b) => TYPE_RADIUS[b.type] - TYPE_RADIUS[a.type])
      .slice(0, 3);
    return { node: hovered, sx, sy, connected };
  }, [hovered, positions, transform, mode]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="gaitscape-explorer" id="explore">
      {/* ---------------- compact header ---------------- */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <span className="eyebrow">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            GaitScape
          </span>
          <h1 className="mt-2.5 font-display text-2xl text-soft-white sm:text-3xl">
            Explore the Human Movement Intelligence{" "}
            <span className="text-gradient">landscape.</span>
          </h1>
        </div>
        <div className="text-xs text-soft-mute" aria-live="polite">
          {focusGroupId ? (
            <>
              <span className="font-semibold text-soft-white">
                {nodeById.get(focusGroupId)?.title}
              </span>{" "}
              · {visibleNodes.length} connected nodes · {visibleRels.length}{" "}
              relationships
            </>
          ) : challenge ? (
            <>
              {visibleNodes.length} nodes · {visibleRels.length} relationships ·{" "}
              {challenge.question}
            </>
          ) : (
            <>
              {visibleNodes.length} nodes · {visibleRels.length} relationships
            </>
          )}
        </div>
      </div>

      {/* ---------------- controls ---------------- */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-soft-mute/80">
            View
          </span>
          <div className="gaitscape-seg" role="tablist" aria-label="Display mode">
            {(
              [
                { id: "graph", label: "Graph", icon: Waypoints },
                { id: "list", label: "List", icon: ListTree },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={mode === m.id}
                onClick={() => setMode(m.id)}
                className={cn("gaitscape-seg-btn", mode === m.id && "gaitscape-seg-btn--on")}
              >
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "graph" && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-soft-mute/80">
              Layout
            </span>
            <div className="gaitscape-seg" role="tablist" aria-label="Layout">
              {(["cluster", "tree"] as const).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={cn("gaitscape-seg-btn capitalize", view === v && "gaitscape-seg-btn--on")}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-soft-mute/80">
          Group by
          <select
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value as GaitscapeNodeType);
              setFocusGroupId(null);
            }}
            className="gaitscape-select normal-case tracking-normal"
          >
            {GROUP_OPTIONS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <div className="gaitscape-seg" role="tablist" aria-label="View by">
          {(
            [
              { id: "intelligence", label: "Intelligence" },
              { id: "challenges", label: "Challenges" },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={viewBy === v.id}
              onClick={() => {
                setViewBy(v.id);
                setChallengeId(null);
                setSelectedId(null);
              }}
              className={cn("gaitscape-seg-btn", viewBy === v.id && "gaitscape-seg-btn--on")}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-soft-mute" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, signals, capabilities…"
            aria-label="Search the landscape"
            className="gaitscape-input w-[250px] pl-9"
          />
        </div>

        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className={cn(
            "gaitscape-seg-btn gaitscape-seg-btn--solo",
            (filtersOpen || filters.size > 0) && "gaitscape-seg-btn--on"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters{filters.size > 0 ? ` · ${filters.size}` : ""}
        </button>
      </div>

      {/* ---------------- filter panel ---------------- */}
      {filtersOpen && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-obsidian-200/80 p-5 backdrop-blur-md">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FILTER_FAMILIES.map((family) => (
              <div key={family.type}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
                  {family.label}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {gaitscapeNodes
                    .filter((n) => n.type === family.type)
                    .map((n) => (
                      <button
                        key={n.id}
                        onClick={() => toggleFilter(n.id)}
                        aria-pressed={filters.has(n.id)}
                        className={cn(
                          "gaitscape-chip",
                          filters.has(n.id) && "gaitscape-chip--on"
                        )}
                      >
                        {n.title}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span className="text-xs text-soft-mute">
              Filtering keeps the selected nodes plus their direct relationships.
            </span>
            <button
              onClick={() => setFilters(new Set())}
              className="text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* ---------------- main area ---------------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[288px_minmax(0,1fr)]">
        {/* side panel: active grouping OR challenges */}
        <aside className="order-2 lg:order-1">
          <button
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            className="gaitscape-seg-btn gaitscape-seg-btn--solo mb-3 w-full justify-center lg:hidden"
          >
            <PanelLeft className="h-3.5 w-3.5" />
            {panelOpen ? "Hide" : "Show"}{" "}
            {viewBy === "intelligence" ? `${groupLabel.toLowerCase()}s` : "challenges"}
          </button>

          <div className={cn(panelOpen ? "block" : "hidden", "lg:block")}>
            {viewBy === "intelligence" ? (
              <div className="rounded-2xl border border-white/[0.07] bg-obsidian-200/45 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
                  {groupLabel}s
                </div>
                <div className="gaitscape-scroll mt-3 max-h-[400px] space-y-0.5 overflow-y-auto pr-1.5">
                  <button
                    onClick={() => setFocusGroupId(null)}
                    className={cn(
                      "gaitscape-group-row",
                      focusGroupId === null && "gaitscape-group-row--on"
                    )}
                  >
                    <span>All {groupLabel.toLowerCase()}s</span>
                    <span className="tabular-nums">{panelHubs.length}</span>
                  </button>
                  {[...panelHubs]
                    .sort(
                      (a, b) =>
                        (panelCounts.get(b.id) ?? 0) - (panelCounts.get(a.id) ?? 0)
                    )
                    .map((hub) => (
                      <button
                        key={hub.id}
                        onClick={() =>
                          setFocusGroupId((prev) => (prev === hub.id ? null : hub.id))
                        }
                        title={hub.title}
                        className={cn(
                          "gaitscape-group-row",
                          focusGroupId === hub.id && "gaitscape-group-row--on"
                        )}
                      >
                        <span className="min-w-0 text-left leading-snug">
                          {hub.title}
                        </span>
                        <span className="tabular-nums">
                          {panelCounts.get(hub.id) ?? 0}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/[0.07] bg-obsidian-200/45 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
                  Challenges
                </div>
                <div className="mt-3 space-y-1.5">
                  {gaitscapeChallenges.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setChallengeId((prev) => (prev === ch.id ? null : ch.id));
                        setSelectedId(null);
                      }}
                      aria-pressed={challengeId === ch.id}
                      className={cn(
                        "block w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-[12.5px] leading-snug text-soft-gray transition-colors hover:bg-white/[0.04] hover:text-soft-white",
                        challengeId === ch.id &&
                          "border-cyan-300/25 bg-cyan-300/[0.06] text-soft-white"
                      )}
                    >
                      {ch.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* legend */}
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-obsidian-200/45 p-4">
              <button
                onClick={() => setLegendOpen((o) => !o)}
                aria-expanded={legendOpen}
                className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute"
              >
                Legend
                <Plus
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    legendOpen && "rotate-45"
                  )}
                />
              </button>
              {legendOpen && (
                <ul className="mt-3 space-y-1.5">
                  {LEGEND_ITEMS.map((item) => (
                    <li
                      key={item.type}
                      className="flex items-center gap-2 text-xs text-soft-gray"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: TYPE_COLOR[item.type] }}
                      />
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>

        {/* graph or list */}
        <div className="order-1 min-w-0 lg:order-2">
          {mode === "graph" ? (
            <div className="gaitscape-stage relative overflow-hidden rounded-3xl border border-white/[0.08]">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                className="block h-[520px] w-full touch-none select-none sm:h-[600px] lg:h-[660px]"
                role="application"
                aria-label="GaitAI intelligence landscape graph. Use Tab to move between nodes, Enter to open details, Escape to close."
                onPointerDown={(e) => {
                  if ((e.target as Element).closest(".gaitscape-node")) return;
                  setAnimated(false);
                  dragRef.current = {
                    x: e.clientX,
                    y: e.clientY,
                    tx: transform.x,
                    ty: transform.y,
                  };
                  (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = dragRef.current;
                  if (!d) return;
                  const svg = svgRef.current!;
                  const scale = CANVAS_W / svg.clientWidth;
                  setTransform((t) => ({
                    ...t,
                    x: d.tx + (e.clientX - d.x) * scale,
                    y: d.ty + (e.clientY - d.y) * scale,
                  }));
                }}
                onPointerUp={() => (dragRef.current = null)}
                onPointerLeave={() => (dragRef.current = null)}
              >
                <g
                  className={cn("gaitscape-canvas", animated && "gaitscape-canvas--animated")}
                  style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                  }}
                >
                  {/* structural edges: member → branch → spine */}
                  <g>
                    {baseEdges.member.map(({ a, b }) => {
                      const pa = positions.get(a);
                      const pb = positions.get(b);
                      if (!pa || !pb) return null;
                      const dimmed =
                        activeNeighbors &&
                        !(activeNeighbors.has(a) && activeNeighbors.has(b));
                      return (
                        <path
                          key={`m-${a}-${b}`}
                          className="gaitscape-edge"
                          d={edgePath(pa, pb)}
                          style={{ opacity: dimmed ? 0.04 : undefined }}
                        />
                      );
                    })}
                    {baseEdges.branch.map(({ a, b }) => {
                      const pa = positions.get(a);
                      const pb = positions.get(b);
                      if (!pa || !pb) return null;
                      const dimmed =
                        activeNeighbors &&
                        !(activeNeighbors.has(a) && activeNeighbors.has(b));
                      return (
                        <path
                          key={`b-${a}-${b}`}
                          className="gaitscape-edge gaitscape-edge--branch"
                          d={edgePath(pa, pb)}
                          style={{ opacity: dimmed ? 0.05 : undefined }}
                        />
                      );
                    })}
                    {baseEdges.spine.map(({ a, b, color }) => {
                      const pa = positions.get(a);
                      const pb = positions.get(b);
                      if (!pa || !pb) return null;
                      return (
                        <path
                          key={`s-${a}-${b}`}
                          className="gaitscape-edge gaitscape-edge--spine"
                          d={edgePath(pa, pb)}
                          style={{ stroke: color }}
                        />
                      );
                    })}
                  </g>

                  {/* active relationship traces */}
                  <g>
                    {activeEdges.map((r) => {
                      const pa = positions.get(r.source);
                      const pb = positions.get(r.target);
                      if (!pa || !pb) return null;
                      const other = r.source === activeId ? r.target : r.source;
                      const color = nodeColor(nodeById.get(other)!);
                      return (
                        <path
                          key={`act-${r.source}-${r.target}-${r.type}`}
                          className="gaitscape-edge gaitscape-edge--active"
                          d={edgePath(pa, pb)}
                          style={{ stroke: color }}
                        />
                      );
                    })}
                  </g>

                  {/* nodes */}
                  <g>
                    {visibleNodes.map((node) => {
                      const p = positions.get(node.id);
                      if (!p) return null;
                      const isHub = hubIds.has(node.id) && view === "cluster";
                      const r = TYPE_RADIUS[node.type] * (isHub ? HUB_SCALE : 1);
                      const color = nodeColor(node);
                      const activeDim =
                        activeNeighbors && !activeNeighbors.has(node.id);
                      const searchDim =
                        searchMatches && !searchMatches.has(node.id);
                      const isSelected = selectedId === node.id;
                      const isMatch = searchMatches?.has(node.id) ?? false;
                      const showLabel = labelVisible(node, isHub);
                      return (
                        <g
                          key={node.id}
                          className="gaitscape-node"
                          transform={`translate(${p.x} ${p.y})`}
                          tabIndex={0}
                          role="button"
                          aria-label={`${NODE_TYPE_LABEL[node.type]}: ${node.title}`}
                          aria-pressed={isSelected}
                          style={{ opacity: activeDim ? 0.2 : searchDim ? 0.55 : 1 }}
                          onMouseEnter={() => setHoverId(node.id)}
                          onMouseLeave={() => setHoverId(null)}
                          onFocus={() => setHoverId(node.id)}
                          onBlur={() => setHoverId(null)}
                          onClick={() => selectNode(node.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              selectNode(node.id);
                            }
                          }}
                        >
                          {/* generous invisible hit area for hover/touch */}
                          <circle r={r + 11} fill="transparent" stroke="none" />
                          {(isSelected || activeId === node.id || isMatch) && (
                            <circle
                              className="gaitscape-node-halo"
                              r={r + 7}
                              style={{ stroke: color }}
                            />
                          )}
                          <circle
                            className="gaitscape-node-dot"
                            r={r}
                            style={{
                              fill: color,
                              fillOpacity:
                                node.type === "core" ||
                                node.type === "vertical" ||
                                isHub
                                  ? 0.22
                                  : 0.15,
                              stroke: color,
                            }}
                          />
                          <circle r={Math.max(2.4, r * 0.3)} fill={color} />
                          {showLabel && (
                            <text
                              className={cn(
                                "gaitscape-node-label",
                                (node.type === "core" ||
                                  node.type === "vertical" ||
                                  isHub) &&
                                  "gaitscape-node-label--major"
                              )}
                              y={r + (node.type === "core" ? 34 : node.type === "vertical" ? 26 : 17)}
                              style={{
                                fontSize:
                                  node.type === "core"
                                    ? 27
                                    : node.type === "vertical"
                                      ? 21
                                      : isHub
                                        ? 14.5
                                        : view === "tree"
                                          ? 13
                                          : 12,
                              }}
                            >
                              {node.title}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                </g>
              </svg>

              {/* focused-group escape hatch */}
              {focusGroupId && (
                <button
                  onClick={() => setFocusGroupId(null)}
                  className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-obsidian-200/85 px-3.5 py-1.5 text-xs font-semibold text-soft-gray backdrop-blur transition-colors hover:text-soft-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Show all {groupLabel.toLowerCase()}s
                </button>
              )}

              {/* hover tooltip */}
              {hoveredTooltip && (
                <div
                  className="gaitscape-tooltip"
                  style={{
                    left: `${Math.min(82, Math.max(4, hoveredTooltip.sx))}%`,
                    top: `${Math.min(86, Math.max(4, hoveredTooltip.sy))}%`,
                  }}
                  role="tooltip"
                >
                  <div className="text-[12.5px] font-semibold text-soft-white">
                    {hoveredTooltip.node.title}
                  </div>
                  <div
                    className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: nodeColor(hoveredTooltip.node) }}
                  >
                    {NODE_TYPE_LABEL[hoveredTooltip.node.type]}
                  </div>
                  {hoveredTooltip.connected.length > 0 && (
                    <div className="mt-1.5 text-[11px] leading-relaxed text-soft-mute">
                      Connected to{" "}
                      {hoveredTooltip.connected.map((c) => c.title).join(" · ")}
                    </div>
                  )}
                </div>
              )}

              {/* toolbar */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                <button className="gaitscape-tool" title="Zoom out" aria-label="Zoom out" onClick={() => zoomBy(0.8)}>
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button className="gaitscape-tool" title="Zoom in" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button className="gaitscape-tool" title="Fit graph" aria-label="Fit graph" onClick={fitView}>
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button className="gaitscape-tool" title="Reset view" aria-label="Reset view" onClick={fullReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* right detail drawer */}
              {selected && (
                <div
                  className="gaitscape-detail absolute inset-y-4 right-4 w-[min(340px,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-white/10 bg-obsidian-200/95 p-5 backdrop-blur-xl"
                  role="dialog"
                  aria-label={`${selected.title} details`}
                >
                  <DetailPanel
                    node={selected}
                    neighborsByType={neighborsByType}
                    onClose={() => setSelectedId(null)}
                    onNavigate={(id) => setSelectedId(id)}
                  />
                </div>
              )}
            </div>
          ) : (
            <AccessibleList
              hubs={hubs}
              assignment={assignment}
              visibleNodes={visibleNodes}
              groupLabel={groupLabel}
              challengeActive={viewBy === "challenges"}
              selectedChallengeId={challengeId}
              onSelect={(id) => setSelectedId(id)}
            />
          )}

          {/* selected-node panel for list mode / mobile */}
          {mode === "list" && selected && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-obsidian-200/80 p-5">
              <DetailPanel
                node={selected}
                neighborsByType={neighborsByType}
                onClose={() => setSelectedId(null)}
                onNavigate={(id) => setSelectedId(id)}
              />
            </div>
          )}

          {/* challenge chain */}
          {challenge && (
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-obsidian-200/70 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Challenge
              </div>
              <h3 className="mt-1.5 font-display text-lg text-soft-white">
                {challenge.question}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-soft-gray">
                {challenge.summary}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {(
                  [
                    { label: "Signals", ids: challenge.signalIds },
                    { label: "Capabilities", ids: challenge.capabilityIds },
                    { label: "Products", ids: challenge.productIds },
                    { label: "Research", ids: challenge.researchIds },
                    { label: "Outcome", ids: [challenge.outcomeId] },
                  ] as const
                ).map((stage, i, arr) => (
                  <div key={stage.label} className="relative">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                      {stage.label}
                      {i < arr.length - 1 && (
                        <span aria-hidden="true" className="ml-2 text-royal-300">
                          ↓
                        </span>
                      )}
                    </div>
                    <ul className="mt-1.5 space-y-1">
                      {stage.ids.map((id) => (
                        <li key={id}>
                          <button
                            onClick={() => setSelectedId(id)}
                            className="text-left text-[12.5px] text-soft-white underline-offset-2 hover:text-cyan-200 hover:underline"
                          >
                            {nodeById.get(id)?.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DETAIL PANEL
// ============================================================================

function DetailPanel({
  node,
  neighborsByType,
  onClose,
  onNavigate,
}: {
  node: GaitscapeNode;
  neighborsByType: (id: string) => Map<GaitscapeNodeType, GaitscapeNode[]>;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const grouped = neighborsByType(node.id);
  const order: GaitscapeNodeType[] = [
    "vertical",
    "product",
    "domain",
    "signal",
    "capability",
    "research",
    "outcome",
  ];
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: nodeColor(node) }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: nodeColor(node) }}
            />
            {NODE_TYPE_LABEL[node.type]}
          </span>
          <h3 className="mt-2 font-display text-xl text-soft-white">{node.title}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 text-soft-mute transition-colors hover:text-soft-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-soft-gray">
        {node.shortDescription}
      </p>

      {order.map((type) => {
        const list = grouped.get(type);
        if (!list || list.length === 0) return null;
        return (
          <div key={type} className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft-mute">
              Connected {NODE_TYPE_LABEL[type].toLowerCase()}s
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {list.map((nb) => (
                <button
                  key={nb.id}
                  onClick={() => onNavigate(nb.id)}
                  className="gaitscape-chip"
                  style={{ color: nodeColor(nb) }}
                >
                  {nb.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {node.href && (
        <Link
          href={node.href}
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Explore {node.title}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// ACCESSIBLE LIST
// ============================================================================

function AccessibleList({
  hubs,
  assignment,
  visibleNodes,
  groupLabel,
  challengeActive,
  selectedChallengeId,
  onSelect,
}: {
  hubs: GaitscapeNode[];
  assignment: Map<string, string | null>;
  visibleNodes: GaitscapeNode[];
  groupLabel: string;
  challengeActive: boolean;
  selectedChallengeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (challengeActive) {
    const list = selectedChallengeId
      ? gaitscapeChallenges.filter((c) => c.id === selectedChallengeId)
      : gaitscapeChallenges;
    return (
      <div className="space-y-6">
        {list.map((ch) => (
          <section
            key={ch.id}
            className="rounded-2xl border border-white/[0.08] bg-obsidian-200/50 p-5"
            aria-label={ch.question}
          >
            <h3 className="font-display text-lg text-soft-white">{ch.question}</h3>
            <p className="mt-1.5 text-sm text-soft-gray">{ch.summary}</p>
            <ul className="mt-3 space-y-2">
              {ch.productIds.map((pid) => {
                const p = nodeById.get(pid);
                if (!p) return null;
                return (
                  <li key={pid}>
                    <ListItem node={p} onSelect={onSelect} />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  const memberIds = new Set(visibleNodes.map((n) => n.id));
  const unassigned = visibleNodes.filter(
    (n) =>
      !hubs.some((h) => h.id === n.id) &&
      !assignment.get(n.id) &&
      n.type !== "core"
  );

  return (
    <div className="space-y-6">
      {[...hubs]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((hub) => {
          const members = [...assignment.entries()]
            .filter(([id, h]) => h === hub.id && memberIds.has(id))
            .map(([id]) => nodeById.get(id)!)
            .sort((a, b) => a.title.localeCompare(b.title));
          return (
            <section
              key={hub.id}
              aria-label={`${groupLabel}: ${hub.title}`}
              className="rounded-2xl border border-white/[0.08] bg-obsidian-200/50 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg text-soft-white">{hub.title}</h3>
                <span className="text-xs text-soft-mute">
                  {members.length} connected
                </span>
              </div>
              <p className="mt-1 text-[13px] text-soft-mute">
                {hub.shortDescription}
              </p>
              <ul className="mt-3 space-y-2">
                {members.map((m) => (
                  <li key={m.id}>
                    <ListItem node={m} onSelect={onSelect} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      {unassigned.length > 0 && (
        <section
          aria-label="Intelligence core"
          className="rounded-2xl border border-white/[0.08] bg-obsidian-200/50 p-5"
        >
          <h3 className="font-display text-lg text-soft-white">Intelligence core</h3>
          <ul className="mt-3 space-y-2">
            {unassigned.map((m) => (
              <li key={m.id}>
                <ListItem node={m} onSelect={onSelect} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ListItem({
  node,
  onSelect,
}: {
  node: GaitscapeNode;
  onSelect: (id: string) => void;
}) {
  const related = [...(fullAdjacency.get(node.id) ?? [])]
    .map((id) => nodeById.get(id)!)
    .filter((n) => n.type === "capability" || n.type === "signal")
    .slice(0, 4);
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-white/[0.12]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => onSelect(node.id)}
          className="text-left text-sm font-semibold text-soft-white underline-offset-2 hover:underline"
        >
          {node.title}
        </button>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: nodeColor(node) }}
        >
          {NODE_TYPE_LABEL[node.type]}
        </span>
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-soft-mute">
        {node.shortDescription}
      </p>
      {related.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {related.map((r) => (
            <span key={r.id} className="gaitscape-chip pointer-events-none">
              {r.title}
            </span>
          ))}
        </div>
      )}
      {node.href && (
        <Link
          href={node.href}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-300 hover:text-cyan-200"
        >
          Explore
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
