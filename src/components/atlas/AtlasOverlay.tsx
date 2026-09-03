"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  atlasTrail,
  siteMap,
  type AtlasNode,
} from "@/data/site-map";
import { ATLAS_EVENT } from "./atlas-event";
import styles from "./atlas.module.css";

/**
 * GAITAI ATLAS — the whole website, as a map you can walk.
 *
 * The second level of the orientation system: the trail says where you are,
 * this says what else there is and how it is arranged. It answers "where am
 * I on the website?" — which is not the question GaitScape answers, and the
 * two link to each other rather than overlapping.
 *
 * WHY AN INDENTED TREE AND NOT A FREE-FORM GRAPH. Three reasons, in order of
 * weight:
 *
 *   1. The accessible representation and the visual one are then the same
 *      object. A node-and-edge canvas needs a parallel list for screen
 *      readers, and a parallel list is a second source of truth that goes
 *      stale. This is one `role="tree"` with real links in it.
 *   2. It holds still. Seventy nodes laid out by force would drift, reflow on
 *      expansion and land somewhere different each visit; a reader who opened
 *      the map twice would be reading a different picture.
 *   3. The mental model survives the breakpoint. The brief's phone sketch IS
 *      an indented tree, and using it on both means the map a visitor learns
 *      on a laptop is the map they meet on a phone.
 *
 * The map feeling comes from the nodes, the branch hairlines and the family
 * accents rather than from a layout algorithm.
 *
 * WHAT OPENS EXPANDED. The current branch, all the way down: on WalkScan the
 * map opens with Products → MobilityCare → WalkScan revealed and lit, every
 * MobilityCare sibling beside it, and SecureVision collapsed as
 * "SecureVision · 11". Everything off the path recedes but stays legible and
 * clickable.
 *
 * SEARCH IS FOR LOCATION. "Find a page" filters the tree by label and reveals
 * matches in place — it never leaves the map. Ctrl/⌘ K remains the way to
 * search CONTENT, and this deliberately does not duplicate it.
 */

const FOCUS_SELECTOR =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

const norm = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export function AtlasOverlay() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    const onRequest = () => setOpen(true);
    window.addEventListener(ATLAS_EVENT, onRequest);
    return () => window.removeEventListener(ATLAS_EVENT, onRequest);
  }, []);

  /* A route change means the reader used the map: it has done its job. */
  useEffect(() => setOpen(false), [pathname]);

  if (!open) return null;
  return (
    <AtlasSheet
      pathname={pathname}
      onClose={() => setOpen(false)}
      onNavigate={(route) => {
        setOpen(false);
        router.push(route);
      }}
    />
  );
}

function AtlasSheet({
  pathname,
  onClose,
  onNavigate,
}: {
  pathname: string;
  onClose: () => void;
  onNavigate: (route: string) => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const trail = useMemo(() => atlasTrail(pathname), [pathname]);
  const currentId = trail[trail.length - 1]?.id ?? "root";
  const onPath = useMemo(() => new Set(trail.map((node) => node.id)), [trail]);

  /* Open on the current branch. Every ancestor of the current page, and the
     page's own node if it has children of its own. */
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(trail.map((node) => node.id)),
  );

  /** The node whose detail the side panel shows. Starts on the current page. */
  const [selected, setSelected] = useState<string>(currentId);

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ── Search: which nodes match, and what has to open to show them ── */
  const { hits, revealed } = useMemo(() => {
    const q = norm(query);
    if (q.length < 2) return { hits: new Set<string>(), revealed: new Set<string>() };
    const found = new Set<string>();
    const reveal = new Set<string>();
    const walk = (node: AtlasNode, ancestors: string[]) => {
      const haystack = norm(`${node.label} ${node.description ?? ""} ${node.meta ?? ""}`);
      if (haystack.includes(q)) {
        found.add(node.id);
        ancestors.forEach((id) => reveal.add(id));
      }
      node.children?.forEach((child) => walk(child, [...ancestors, node.id]));
    };
    walk(siteMap, []);
    return { hits: found, revealed: reveal };
  }, [query]);

  const searching = norm(query).length >= 2;

  /* ── Modal behaviour: Escape closes, focus is trapped, focus returns ── */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    sheet?.querySelector<HTMLElement>("input")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(FOCUS_SELECTOR),
      ).filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  const selectedNode = useMemo(() => {
    let found: AtlasNode | undefined;
    const walk = (node: AtlasNode) => {
      if (node.id === selected) found = node;
      node.children?.forEach(walk);
    };
    walk(siteMap);
    return found ?? siteMap;
  }, [selected]);

  return (
    <div
      className={`${styles.scope} ${styles.scrim}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="atlas-title"
        onClick={(event) => event.stopPropagation()}
        className={styles.sheet}
      >
        <header className={styles.head}>
          <div>
            <h2 id="atlas-title" className={styles.title}>
              GaitAI Atlas
            </h2>
            <p className={styles.subtitle}>
              The whole website, and where you are in it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the Atlas"
            className={styles.close}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </header>

        <div className={styles.find}>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a page…"
            aria-label="Find a page in the site map"
            className={styles.findInput}
          />
          <p className={styles.findNote} role="status">
            {searching
              ? `${hits.size} ${hits.size === 1 ? "page" : "pages"} match`
              : "Location, not content — press Ctrl K to search the site"}
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.treeWrap}>
            <ul role="tree" aria-label="GaitAI site map" className={styles.tree}>
              <AtlasBranch
                nodes={[siteMap]}
                depth={0}
                currentId={currentId}
                onPath={onPath}
                expanded={expanded}
                toggle={toggle}
                selected={selected}
                setSelected={setSelected}
                onNavigate={onNavigate}
                searching={searching}
                hits={hits}
                revealed={revealed}
              />
            </ul>
          </div>

          {/* The detail panel. Small on purpose: this is navigation, and the
              page itself is one click away. */}
          <aside className={styles.panel} data-family={selectedNode.family}>
            <p className={styles.panelKind}>
              {selectedNode.id === currentId ? "You are here" : "Destination"}
            </p>
            <p className={styles.panelTitle}>{selectedNode.label}</p>
            {selectedNode.description && (
              <p className={styles.panelDesc}>{selectedNode.description}</p>
            )}
            {selectedNode.meta && (
              <p className={styles.panelMeta}>{selectedNode.meta}</p>
            )}
            {selectedNode.children && (
              <p className={styles.panelMeta}>
                {selectedNode.children.length}{" "}
                {selectedNode.children.length === 1 ? "page" : "pages"} inside
              </p>
            )}
            {selectedNode.route && selectedNode.id !== currentId && (
              <Link
                href={selectedNode.route}
                className={styles.panelOpen}
                onClick={onClose}
              >
                Open page <span aria-hidden="true">→</span>
              </Link>
            )}
          </aside>
        </div>

        <div className={styles.foot}>
          <span>This map is the website.</span>
          <Link href="/gaitscape/" className={styles.footLink} onClick={onClose}>
            Explore intelligence relationships → GaitScape
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ONE BRANCH
   A real <ul role="group"> under a real <li role="treeitem">, with
   aria-expanded on the ones that have children and aria-current on the page
   you are on. The disclosure control and the destination are separate
   controls, because a node that both navigates and expands can do neither
   predictably.
   ══════════════════════════════════════════════════════════════════════════ */

function AtlasBranch({
  nodes,
  depth,
  currentId,
  onPath,
  expanded,
  toggle,
  selected,
  setSelected,
  onNavigate,
  searching,
  hits,
  revealed,
}: {
  nodes: AtlasNode[];
  depth: number;
  currentId: string;
  onPath: Set<string>;
  expanded: Set<string>;
  toggle: (id: string) => void;
  selected: string;
  setSelected: (id: string) => void;
  onNavigate: (route: string) => void;
  searching: boolean;
  hits: Set<string>;
  revealed: Set<string>;
}) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        /* While searching, the tree opens itself along the paths that lead to
           a match and nothing else. */
        const isOpen = searching
          ? revealed.has(node.id) || hits.has(node.id)
          : expanded.has(node.id);
        const isCurrent = node.id === currentId;
        const isOnPath = onPath.has(node.id);
        const state = searching
          ? hits.has(node.id)
            ? styles.hit
            : styles.offPath
          : isCurrent
            ? styles.isCurrent
            : isOnPath
              ? styles.onPath
              : styles.offPath;

        return (
          <li
            key={node.id}
            role="treeitem"
            aria-expanded={hasChildren ? isOpen : undefined}
            /* The tree does have a selection — the node the detail panel is
               describing — so `aria-selected` states it rather than being
               added to satisfy the role. `aria-current="page"` separately
               marks the page the reader is actually on. */
            aria-selected={node.id === selected}
            aria-current={isCurrent ? "page" : undefined}
            data-family={node.family}
            className={`${styles.item} ${state} ${
              isCurrent ? styles.isCurrent : ""
            }`}
          >
            <div className={styles.row}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} ${node.label}`}
                  className={styles.toggle}
                >
                  <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
              ) : (
                <span aria-hidden="true" className={styles.togglePlaceholder} />
              )}

              <span aria-hidden="true" className={styles.dot} />

              {node.route ? (
                <Link
                  href={node.route}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(node.route as string);
                  }}
                  onMouseEnter={() => setSelected(node.id)}
                  onFocus={() => setSelected(node.id)}
                  title={node.description ?? node.label}
                  className={styles.label}
                >
                  {node.label}
                </Link>
              ) : (
                /* A grouping node. It selects — so its description can be
                   read — and it expands, but it never pretends to be a page. */
                <button
                  type="button"
                  onClick={() => toggle(node.id)}
                  onMouseEnter={() => setSelected(node.id)}
                  onFocus={() => setSelected(node.id)}
                  className={`${styles.label} ${styles.groupLabel}`}
                >
                  {node.label}
                </button>
              )}

              {hasChildren && !isOpen && (
                <span aria-hidden="true" className={styles.count}>
                  · {node.children?.length}
                </span>
              )}

              {isCurrent && (
                <span aria-hidden="true" className={styles.hereTag}>
                  You are here
                </span>
              )}
            </div>

            {hasChildren && isOpen && (
              <ul role="group" className={styles.branch}>
                <AtlasBranch
                  nodes={node.children as AtlasNode[]}
                  depth={depth + 1}
                  currentId={currentId}
                  onPath={onPath}
                  expanded={expanded}
                  toggle={toggle}
                  selected={selected}
                  setSelected={setSelected}
                  onNavigate={onNavigate}
                  searching={searching}
                  hits={hits}
                  revealed={revealed}
                />
              </ul>
            )}
          </li>
        );
      })}
    </>
  );
}
