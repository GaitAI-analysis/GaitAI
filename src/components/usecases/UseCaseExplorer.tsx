"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industryUseCases, productById } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
import { facetsFor, outputChipsFor, type UseCaseFacet } from "@/data/usecase-facets";
import { UseCaseCard } from "./UseCaseCard";
import { UseCaseFilterBar, type FamilyFilter } from "./UseCaseFilterBar";
import styles from "./usecases.module.css";

/**
 * The environment explorer: discovery controls over the two family groups.
 *
 * Both groups stay on one page with a sticky subnav rather than becoming a
 * tab that hides half the catalogue — someone who does not yet know which
 * family they belong to is exactly the reader this page is for, and hiding one
 * of the two answers is the wrong default. The family tabs narrow the grid
 * when a reader has decided; "All environments" is the initial state.
 *
 * SEARCH matches the environment name, its problem statement, its product
 * names and its output chips, so "queue" finds retail and airports and
 * "watchcare" finds every wearable deployment.
 */

const GROUPS = [
  {
    id: "mobility",
    family: "mobilitycare" as const,
    label: "MobilityCare · Healthcare, sports & wearable",
    title: "Healthcare, sports & wearable environments",
    blurb:
      "Camera and wearable movement intelligence for clinics, rehabilitation, sports, elderly care, home care and research.",
    tone: styles.toneCare,
  },
  {
    id: "secure",
    family: "securevision" as const,
    label: "SecureVision · Privacy-aware public safety",
    title: "Safety & public-space environments",
    blurb:
      "Privacy-aware movement intelligence for transport hubs, smart cities, campuses, factories, retail floors and large events.",
    tone: styles.toneSecure,
  },
];

export function UseCaseExplorer() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<FamilyFilter>("all");
  const [facet, setFacet] = useState<UseCaseFacet | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);

  /**
   * A deep link to #physio (or any environment id) should land on an open
   * card, not a collapsed one — those anchors were addressable before this
   * page gained progressive disclosure and are linked from elsewhere.
   */
  useEffect(() => {
    const target = window.location.hash.replace(/^#/, "");
    if (target && industryUseCases.some((c) => c.id === target)) {
      setOpenId(target);
    }
  }, []);

  /** Everything a search should be able to match, built once per record. */
  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of industryUseCases) {
      const detail = useCaseDetails.find((d) => d.caseId === c.id);
      map.set(
        c.id,
        [
          c.industry,
          c.problem,
          ...c.productIds.map((id) => productById(id)?.short ?? ""),
          ...outputChipsFor(c.id),
          ...facetsFor(c.id),
          detail?.together ?? "",
        ]
          .join(" ")
          .toLowerCase(),
      );
    }
    return map;
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return industryUseCases.filter((c) => {
      if (family !== "all" && c.vertical !== family) return false;
      if (facet !== "all" && !facetsFor(c.id).includes(facet)) return false;
      if (q && !(haystacks.get(c.id) ?? "").includes(q)) return false;
      return true;
    });
  }, [query, family, facet, haystacks]);

  const matchIds = useMemo(() => new Set(matches.map((c) => c.id)), [matches]);

  /* See the sentinel below for why this exists and what it may change. */
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const mark = sentinel.current;
    if (!mark || typeof IntersectionObserver === "undefined") return;
    /* Measured, not assumed: --site-header-height is authored in rem and a
       reader at 125% browser zoom has a taller header than the token's 90px
       reads as. */
    const header = document.querySelector("header.site-header");
    const offset = header?.getBoundingClientRect().height ?? 90;
    const observer = new IntersectionObserver(
      ([entry]) =>
        /* "Not intersecting" is true on BOTH sides of the viewport: a sentinel
           that has gone up behind the header, and one that is still below the
           fold on a freshly loaded page. Only the first is parked. Without the
           second test the bar rendered compact and opaque before the reader
           had ever reached it, then un-parked as it scrolled into view. */
        setStuck(
          !entry.isIntersecting && entry.boundingClientRect.top < offset,
        ),
      { rootMargin: `-${Math.round(offset)}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(mark);
    return () => observer.disconnect();
  }, []);

  const counts = useMemo(
    () => ({
      all: industryUseCases.length,
      mobilitycare: industryUseCases.filter((c) => c.vertical === "mobilitycare")
        .length,
      securevision: industryUseCases.filter((c) => c.vertical === "securevision")
        .length,
    }),
    [],
  );

  const reset = () => {
    setQuery("");
    setFamily("all");
    setFacet("all");
  };

  return (
    /* `data-stuck` lives on the wrapper, not on the toolbar, because the shell
       and the panel inside it both read it: the panel loses padding, the
       shell keeps the footprint. */
    <div className={styles.explorer} data-stuck={stuck ? "true" : undefined}>
      {/*
       * The sentinel that tells the toolbar it has parked under the navbar.
       *
       * `position: sticky` gives you the behaviour and none of the state:
       * there is no `:stuck` selector, so the only cheap way to know is to
       * watch a zero-height marker sitting immediately above the toolbar and
       * see when it passes behind the header. `rootMargin` pulls the
       * observer's top edge down by the header's real measured height, so the
       * flip happens on the exact pixel the toolbar stops moving — no scroll
       * handler, no rAF, two callbacks for a whole page of scrolling.
       *
       * It sits ABOVE the toolbar, so nothing the toolbar does to its own
       * height can move it, and the two states cannot oscillate.
       */}
      <div ref={sentinel} aria-hidden="true" className={styles.stickySentinel} />

      {/*
       * THE TOOLBAR: a shell and a panel.
       *
       * The SHELL is the sticky element and the only thing that holds a place
       * in flow. Its footprint is the toolbar's resting height and never
       * changes — parked or not, at every width — so the document never gets
       * shorter or longer as the reader scrolls past, and the grid below it
       * never moves.
       *
       * The PANEL is the visible bar: the border, the controls, the ground.
       * It is what tightens when it parks (131px → 109px on a desktop), and
       * the room it gives up stays inside the shell, underneath it, as a band
       * of opaque page ground. That band is the point of the split: content
       * scrolling up under a sticky bar has to come out somewhere, and here it
       * comes out below a strip of clean ground rather than flush against
       * the toolbar's border. No card pixel can appear inside the shell.
       */}
      <div className={styles.toolbarShell}>
        <div className={styles.toolbarPanel}>
          <div className="container-wide">
            <UseCaseFilterBar
              query={query}
              onQuery={setQuery}
              family={family}
              onFamily={setFamily}
              facet={facet}
              onFacet={setFacet}
              counts={counts}
              shown={matches.length}
              total={industryUseCases.length}
              onReset={reset}
            />
          </div>
        </div>
      </div>

      {matches.length === 0 && (
        <div className="container-wide">
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              No environment matches those filters.
            </p>
            <p className={styles.emptyBody}>
              Every GaitAI deployment starts from a movement question rather
              than a product, so an environment that is not listed is not
              necessarily out of scope.
            </p>
            <div className={styles.emptyActions}>
              <button type="button" onClick={reset} className="btn-ghost">
                Clear filters
              </button>
              <Link href="/#contact" className="btn-primary">
                Describe your environment
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {GROUPS.map((group) => {
        const inGroup = industryUseCases.filter(
          (c) => c.vertical === group.family,
        );
        const visible = inGroup.filter((c) => matchIds.has(c.id));
        /* The section stays in the DOM with its heading even when filtered
           out, so the two families remain a stable landmark and #mobility /
           #secure keep resolving. */
        return (
          <section
            key={group.id}
            id={group.id}
            hidden={visible.length === 0}
            className={`${styles.group} ${group.tone} site-anchor-offset`}
          >
            <div className="container-wide">
              <header className={styles.groupHead}>
                {/* No glyph: the label is accent-coloured per family, which
                    is what the icon beside it was doing. */}
                <span className={styles.groupLabel}>{group.label}</span>
                <h2 className={styles.groupTitle}>{group.title}</h2>
                <p className={styles.groupBlurb}>{group.blurb}</p>
                <p className={styles.groupCount}>
                  {visible.length === inGroup.length
                    ? `${inGroup.length} environments`
                    : `${visible.length} of ${inGroup.length} environments`}
                </p>
              </header>

              <div className={styles.grid}>
                {inGroup.map((c) => (
                  <div key={c.id} hidden={!matchIds.has(c.id)}>
                    <UseCaseCard
                      caseId={c.id}
                      open={openId === c.id}
                      onToggle={() =>
                        setOpenId((cur) => (cur === c.id ? null : c.id))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
