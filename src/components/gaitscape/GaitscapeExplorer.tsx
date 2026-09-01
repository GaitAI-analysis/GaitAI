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
  ArrowUpRight,
  ListTree,
  Maximize2,
  Minus,
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
// VISUAL CONSTANTS — restrained GaitAI palette per node family
// ============================================================================

const TYPE_COLOR: Record<GaitscapeNodeType, string> = {
  core: "#e7d3a0",
  vertical: "#5eead4",
  product: "#38bdf8",
  signal: "#7fb2f7",
  capability: "#6d7ef0",
  domain: "#8ea8c3",
  research: "#d4b483",
  outcome: "#9fe8c9",
};

function nodeColor(node: GaitscapeNode): string {
  if (node.type === "vertical") {
    return node.id === "securevision" ? "#8b9cf6" : "#5eead4";
  }
  if (node.type === "product") {
    return node.vertical === "securevision" ? "#7c8ef5" : "#2fc4de";
  }
  if (node.type === "domain") {
    return node.vertical === "securevision" ? "#9aa8d8" : "#8fbfc9";
  }
  return TYPE_COLOR[node.type];
}

const TYPE_RADIUS: Record<GaitscapeNodeType, number> = {
  core: 24,
  vertical: 17,
  product: 10.5,
  signal: 8,
  capability: 9,
  domain: 8.5,
  research: 9,
  outcome: 8,
};

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

const CANVAS_W = 1760;
const CANVAS_H = 1120;

type Pos = { x: number; y: number };

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
    if (hubIds.has(node.id)) continue;
    let best: string | null = null;
    let bestScore = 0;
    for (const nb of fullAdjacency.get(node.id) ?? []) {
      if (!hubIds.has(nb) || !visibleIds.has(nb)) continue;
      // score = shared link count is 1 per hub here; prefer same vertical
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
  // most-connected neighbors landed in (e.g. a movement signal settles next
  // to the domain cluster whose products read it), instead of piling up in
  // the middle of the canvas.
  for (const node of visible) {
    if (hubIds.has(node.id) || assignment.get(node.id) || node.type === "core")
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

function phyllotaxis(center: Pos, index: number, base: number, step: number): Pos {
  const r = base + step * Math.sqrt(index);
  const a = index * 2.399963229728653;
  return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
}

function clusterLayout(
  visible: readonly GaitscapeNode[],
  hubType: GaitscapeNodeType
): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  const { hubs, assignment } = assignToHubs(visible, hubType);

  // hubs on one or two elliptical rings
  const sorted = [...hubs].sort((a, b) => a.title.localeCompare(b.title));
  const outerCount = sorted.length > 12 ? Math.ceil(sorted.length * 0.62) : sorted.length;
  sorted.forEach((hub, i) => {
    if (sorted.length === 1) {
      pos.set(hub.id, { x: cx, y: cy - 300 });
      return;
    }
    const onOuter = i < outerCount;
    const ringIndex = onOuter ? i : i - outerCount;
    const ringTotal = onOuter ? outerCount : sorted.length - outerCount;
    const [rx, ry] = onOuter ? [660, 430] : [370, 235];
    const angle = -Math.PI / 2 + (ringIndex / Math.max(1, ringTotal)) * Math.PI * 2;
    pos.set(hub.id, {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    });
  });

  // members around their hub
  const memberIndex = new Map<string, number>();
  const centerNodes: GaitscapeNode[] = [];
  for (const node of visible) {
    if (pos.has(node.id)) continue;
    const hubId = assignment.get(node.id);
    if (!hubId) {
      centerNodes.push(node);
      continue;
    }
    const k = memberIndex.get(hubId) ?? 0;
    memberIndex.set(hubId, k + 1);
    const hubPos = pos.get(hubId)!;
    pos.set(node.id, phyllotaxis(hubPos, k + 1, 34, 13));
  }

  // unassigned nodes cluster around the middle (core first)
  centerNodes.sort((a, b) =>
    a.type === "core" ? -1 : b.type === "core" ? 1 : a.title.localeCompare(b.title)
  );
  centerNodes.forEach((node, i) => {
    if (node.type === "core") {
      pos.set(node.id, { x: cx, y: cy });
    } else {
      pos.set(node.id, phyllotaxis({ x: cx, y: cy }, i + 2, 72, 19));
    }
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
  const colWidth = (CANVAS_W - 220) / (TREE_ORDER.length - 1);

  TREE_ORDER.forEach((type, colIdx) => {
    const column = visible
      .filter((n) => n.type === type)
      .sort((a, b) => {
        const ga = assignment.get(a.id) ?? "";
        const gb = assignment.get(b.id) ?? "";
        return ga === gb ? a.title.localeCompare(b.title) : ga.localeCompare(gb);
      });
    const x = 110 + colIdx * colWidth;
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
  // A gently bowed trace — reads as a sampled motion trajectory rather
  // than a straight wire.
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusGroupId, setFocusGroupId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  // Small screens start in the Accessible List — the graph stays one tap away.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) setMode("list");
  }, []);

  // ---- visible node set --------------------------------------------------
  const challenge = useMemo(
    () => gaitscapeChallenges.find((c) => c.id === challengeId) ?? null,
    [challengeId]
  );

  const visibleNodes = useMemo(() => {
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
    if (focusGroupId) {
      const focus = neighborhood([focusGroupId]);
      ids = new Set([...ids].filter((id) => focus.has(id)));
    }
    if (filters.size > 0) {
      const kept = neighborhood([...filters]);
      ids = new Set([...ids].filter((id) => kept.has(id)));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      const matches = gaitscapeNodes
        .filter((n) => n.title.toLowerCase().includes(q))
        .map((n) => n.id);
      const kept = neighborhood(matches);
      ids = new Set([...ids].filter((id) => kept.has(id)));
    }
    return gaitscapeNodes.filter((n) => ids.has(n.id));
  }, [viewBy, challenge, focusGroupId, filters, search]);

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

  const positions = useMemo(
    () =>
      view === "cluster"
        ? clusterLayout(visibleNodes, groupBy)
        : treeLayout(visibleNodes, groupBy),
    [visibleNodes, groupBy, view]
  );

  const hubIds = useMemo(() => new Set(hubs.map((h) => h.id)), [hubs]);

  // Structural edges: cluster shows member→hub; tree shows the spine.
  const baseEdges = useMemo(() => {
    if (view === "cluster") {
      const edges: { a: string; b: string }[] = [];
      for (const [member, hub] of assignment) {
        if (hub && positions.has(member) && positions.has(hub)) {
          edges.push({ a: member, b: hub });
        }
      }
      return edges;
    }
    return visibleRels
      .filter((r) => r.type === "belongs-to" || r.type === "grounded-in")
      .map((r) => ({ a: r.source, b: r.target }));
  }, [view, assignment, positions, visibleRels]);

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

  const groupCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [, hub] of assignment) {
      if (hub) counts.set(hub, (counts.get(hub) ?? 0) + 1);
    }
    return counts;
  }, [assignment]);

  // ---- zoom / pan ------------------------------------------------------------
  const zoomBy = useCallback((factor: number) => {
    setTransform((t) => {
      const k = Math.min(2.6, Math.max(0.45, t.k * factor));
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
      zoomBy(Math.exp(-event.deltaY * 0.0012));
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  const resetTransform = () => setTransform({ x: 0, y: 0, k: 1 });

  const fullReset = () => {
    resetTransform();
    setSelectedId(null);
    setHoverId(null);
    setFocusGroupId(null);
    setChallengeId(null);
    setFilters(new Set());
    setSearch("");
  };

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

  // ---- neighbor lists for panels --------------------------------------------
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

  const groupLabel =
    GROUP_OPTIONS.find((g) => g.id === groupBy)?.label ?? "Group";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="gaitscape-explorer" id="explore">
      {/* ---------------- controls ---------------- */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="gaitscape-seg" role="tablist" aria-label="Display mode">
          {(
            [
              { id: "graph", label: "Graph", icon: Waypoints },
              { id: "list", label: "Accessible List", icon: ListTree },
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

        {mode === "graph" && (
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
        )}

        <label className="flex items-center gap-2 text-xs text-soft-mute">
          Group by
          <select
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value as GaitscapeNodeType);
              setFocusGroupId(null);
            }}
            className="gaitscape-select"
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
            placeholder="Search the landscape"
            aria-label="Search nodes"
            className="gaitscape-input pl-9"
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

      {/* ---------------- counts ---------------- */}
      <div className="mt-3 text-xs text-soft-mute" aria-live="polite">
        {visibleNodes.length} nodes · {visibleRels.length} relationships
        {challenge ? ` · challenge: ${challenge.question}` : ""}
        {focusGroupId ? ` · focused on ${nodeById.get(focusGroupId)?.title}` : ""}
      </div>

      {/* ---------------- main area ---------------- */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* side panel: active grouping OR challenges */}
        <aside className="order-2 lg:order-1">
          {viewBy === "intelligence" ? (
            <div className="rounded-2xl border border-white/[0.08] bg-obsidian-200/60 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-soft-mute">
                Active grouping
              </div>
              <div className="mt-1 text-sm font-semibold text-soft-white">
                {groupLabel}s
              </div>
              <div className="mt-3 max-h-[380px] space-y-0.5 overflow-y-auto pr-1">
                <button
                  onClick={() => setFocusGroupId(null)}
                  className={cn(
                    "gaitscape-group-row",
                    focusGroupId === null && "gaitscape-group-row--on"
                  )}
                >
                  <span>All {groupLabel.toLowerCase()}s</span>
                  <span>{hubs.length}</span>
                </button>
                {[...hubs]
                  .sort((a, b) => (groupCounts.get(b.id) ?? 0) - (groupCounts.get(a.id) ?? 0))
                  .map((hub) => (
                    <button
                      key={hub.id}
                      onClick={() =>
                        setFocusGroupId((prev) => (prev === hub.id ? null : hub.id))
                      }
                      className={cn(
                        "gaitscape-group-row",
                        focusGroupId === hub.id && "gaitscape-group-row--on"
                      )}
                    >
                      <span className="truncate">{hub.title}</span>
                      <span>{groupCounts.get(hub.id) ?? 0}</span>
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-obsidian-200/60 p-4">
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
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-obsidian-200/60 p-4">
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
                {(Object.keys(NODE_TYPE_LABEL) as GaitscapeNodeType[])
                  .filter((t) => t !== "core")
                  .map((t) => (
                    <li key={t} className="flex items-center gap-2 text-xs text-soft-gray">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: TYPE_COLOR[t] }}
                      />
                      {NODE_TYPE_LABEL[t]}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </aside>

        {/* graph or list */}
        <div className="order-1 min-w-0 lg:order-2">
          {mode === "graph" ? (
            <div className="gaitscape-stage relative overflow-hidden rounded-3xl border border-white/[0.08]">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                className="block h-[520px] w-full touch-none select-none sm:h-[600px] lg:h-[680px]"
                role="application"
                aria-label="GaitAI intelligence landscape graph. Use Tab to move between nodes, Enter to open details, Escape to close."
                onPointerDown={(e) => {
                  if ((e.target as Element).closest(".gaitscape-node")) return;
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
                <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
                  {/* base structural edges */}
                  <g>
                    {baseEdges.map(({ a, b }) => {
                      const pa = positions.get(a);
                      const pb = positions.get(b);
                      if (!pa || !pb) return null;
                      const dimmed =
                        activeNeighbors &&
                        !(activeNeighbors.has(a) && activeNeighbors.has(b));
                      return (
                        <path
                          key={`${a}-${b}`}
                          className="gaitscape-edge"
                          d={edgePath(pa, pb)}
                          style={{ opacity: dimmed ? 0.05 : undefined }}
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
                      const r =
                        TYPE_RADIUS[node.type] * (isHub ? 1.55 : 1);
                      const color = nodeColor(node);
                      const dimmed =
                        activeNeighbors && !activeNeighbors.has(node.id);
                      const isSelected = selectedId === node.id;
                      return (
                        <g
                          key={node.id}
                          className="gaitscape-node"
                          transform={`translate(${p.x} ${p.y})`}
                          tabIndex={0}
                          role="button"
                          aria-label={`${NODE_TYPE_LABEL[node.type]}: ${node.title}`}
                          aria-pressed={isSelected}
                          style={{ opacity: dimmed ? 0.18 : 1 }}
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
                          {(isSelected || activeId === node.id) && (
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
                                node.type === "core" || node.type === "vertical" || isHub
                                  ? 0.24
                                  : 0.16,
                              stroke: color,
                            }}
                          />
                          <circle r={Math.max(2.4, r * 0.3)} fill={color} />
                          <text
                            className="gaitscape-node-label"
                            y={r + 13}
                            style={{
                              fontSize:
                                node.type === "core"
                                  ? 15
                                  : node.type === "vertical"
                                    ? 13
                                    : isHub
                                      ? 11.5
                                      : 9.5,
                            }}
                          >
                            {node.title}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </g>
              </svg>

              {/* toolbar */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                <button className="gaitscape-tool" aria-label="Zoom out" onClick={() => zoomBy(0.8)}>
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button className="gaitscape-tool" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button className="gaitscape-tool" aria-label="Fit view" onClick={resetTransform}>
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button className="gaitscape-tool" aria-label="Reset explorer" onClick={fullReset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* detail panel */}
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
    "signal",
    "capability",
    "product",
    "domain",
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
              {NODE_TYPE_LABEL[type]}s
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
