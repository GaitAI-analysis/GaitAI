"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck } from "lucide-react";
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
    Icon: HeartPulse,
    tone: styles.toneCare,
  },
  {
    id: "secure",
    family: "securevision" as const,
    label: "SecureVision · Privacy-aware public safety",
    title: "Safety & public-space environments",
    blurb:
      "Privacy-aware movement intelligence for transport hubs, smart cities, campuses, factories, retail floors and large events.",
    Icon: ShieldCheck,
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
    <div>
      <div className={styles.stickyBar}>
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
                <span className={styles.groupLabel}>
                  <group.Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {group.label}
                </span>
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
