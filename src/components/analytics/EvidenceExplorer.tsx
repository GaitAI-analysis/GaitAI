"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChipScroller, SegmentTabs } from "./controls";
import { parseOne, useQueryState } from "./useQueryState";
import styles from "./analytics.module.css";

/**
 * RESEARCH EVIDENCE EXPLORER — /research
 *
 * The evidence map above it lets a reader pick one pillar. This is the
 * analytical view of the whole record: filter it by area, year, capability,
 * product family and record type, and read the result either as the
 * five-stage relationship chain or as a timeline of the published record.
 *
 * THE CHAIN IS THE POINT, AND ITS ORDER IS NOT NEGOTIABLE
 *
 *   published research    the papers and the granted patent, as published
 *          ↓
 *   research foundation   what that record actually establishes
 *          ↓
 *   capability informed   the capability the record's own keywords map to
 *          ↓
 *   product using it      modules documented as built on that capability,
 *                         split into directly informed and architecturally
 *                         relevant — because a shared platform capability is
 *                         not evidence for a module the paper never addressed
 *          ↓
 *   product validation    a separate step, per product and per deployment
 *
 * The fifth stage exists so the chain cannot be read as "paper → product =
 * product validated". It states the boundary the page states elsewhere in
 * prose; it does not restate the validation-gap list that was removed from
 * this route at the owner's request.
 *
 * All counts are derived. No paper count, capability count or product count on
 * this surface is written by hand.
 */

export interface ExplorerRecord {
  id: string;
  title: string;
  venue: string;
  publisher: string;
  year: number;
  kind: string;
  href: string;
  keywords: string[];
}

export interface ExplorerCapability {
  id: string;
  title: string;
  description: string;
}

export interface ExplorerProduct {
  id: string;
  short: string;
  label: string;
  family: string;
  href: string;
}

export interface ExplorerArea {
  id: string;
  title: string;
  summary: string;
  records: ExplorerRecord[];
  capabilities: ExplorerCapability[];
  directProducts: ExplorerProduct[];
  architecturalProducts: ExplorerProduct[];
  /** The research-principle / implementation-control split, where one exists. */
  boundary?: {
    foundationLabel: string;
    foundation: string[];
    controlsLabel: string;
    controls: string[];
    note: string;
  };
}

const KEYS = ["area", "year", "capability", "family", "kind", "view"] as const;

const FAMILY_NAME: Record<string, string> = {
  mobilitycare: "MobilityCare",
  securevision: "SecureVision",
};

export function EvidenceExplorer({ areas }: { areas: ExplorerArea[] }) {
  const { values, setQuery, hydrated } = useQueryState(KEYS);

  const [view, setView] = useState<"chain" | "timeline">("chain");
  const [areaId, setAreaId] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();
  const [capabilityId, setCapabilityId] = useState<string | undefined>();
  const [family, setFamily] = useState<string | undefined>();
  const [kind, setKind] = useState<string | undefined>();

  /** The filter vocabularies, all derived from the records themselves. */
  const years = useMemo(
    () =>
      Array.from(
        new Set(areas.flatMap((area) => area.records.map((r) => r.year))),
      ).sort((a, b) => a - b),
    [areas],
  );
  const capabilities = useMemo(() => {
    const map = new Map<string, ExplorerCapability>();
    for (const area of areas) {
      for (const capability of area.capabilities) map.set(capability.id, capability);
    }
    return Array.from(map.values());
  }, [areas]);
  const kinds = useMemo(
    () =>
      Array.from(
        new Set(areas.flatMap((area) => area.records.map((r) => r.kind))),
      ),
    [areas],
  );

  const AREA_IDS = areas.map((area) => area.id);
  const CAPABILITY_IDS = capabilities.map((capability) => capability.id);

  useEffect(() => {
    if (!hydrated) return;
    setAreaId(parseOne(values.area, AREA_IDS));
    setYear(parseOne(values.year, years.map(String)));
    setCapabilityId(parseOne(values.capability, CAPABILITY_IDS));
    setFamily(parseOne(values.family, ["mobilitycare", "securevision"]));
    setKind(parseOne(values.kind, kinds));
    setView(values.view === "timeline" ? "timeline" : "chain");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, values]);

  const toggle = useCallback(
    (
      key: (typeof KEYS)[number],
      current: string | undefined,
      next: string,
      apply: (value: string | undefined) => void,
    ) => {
      const value = current === next ? undefined : next;
      apply(value);
      setQuery({ [key]: value }, { push: true });
    },
    [setQuery],
  );

  /**
   * Areas that survive the filters, with their records and products narrowed
   * to what was asked for. An area that keeps no record at all drops out.
   */
  const filtered = useMemo(
    () =>
      areas
        .filter((area) => (areaId ? area.id === areaId : true))
        .filter((area) =>
          capabilityId
            ? area.capabilities.some((c) => c.id === capabilityId)
            : true,
        )
        .map((area) => ({
          ...area,
          records: area.records
            .filter((record) => (year ? String(record.year) === year : true))
            .filter((record) => (kind ? record.kind === kind : true)),
          directProducts: area.directProducts.filter((product) =>
            family ? product.family === family : true,
          ),
          architecturalProducts: area.architecturalProducts.filter((product) =>
            family ? product.family === family : true,
          ),
        }))
        .filter((area) => area.records.length > 0),
    [areas, areaId, capabilityId, year, kind, family],
  );

  const totals = useMemo(() => {
    const records = new Set<string>();
    const caps = new Set<string>();
    const products = new Set<string>();
    for (const area of filtered) {
      area.records.forEach((record) => records.add(record.id));
      area.capabilities.forEach((capability) => caps.add(capability.id));
      area.directProducts.forEach((product) => products.add(product.id));
    }
    return { records: records.size, capabilities: caps.size, products: products.size };
  }, [filtered]);

  /** Timeline rows: one per year present in the filtered record. */
  const timeline = useMemo(() => {
    const byYear = new Map<
      number,
      { records: (ExplorerRecord & { areaTitle: string })[]; capabilities: Set<string> }
    >();
    for (const area of filtered) {
      for (const record of area.records) {
        const row =
          byYear.get(record.year) ??
          { records: [], capabilities: new Set<string>() };
        row.records.push({ ...record, areaTitle: area.title });
        area.capabilities.forEach((capability) => row.capabilities.add(capability.title));
        byYear.set(record.year, row);
      }
    }
    return Array.from(byYear.entries()).sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  const clearAll = () => {
    setAreaId(undefined);
    setYear(undefined);
    setCapabilityId(undefined);
    setFamily(undefined);
    setKind(undefined);
    setQuery(
      {
        area: undefined,
        year: undefined,
        capability: undefined,
        family: undefined,
        kind: undefined,
      },
      { push: true },
    );
  };

  const anyFilter = Boolean(areaId || year || capabilityId || family || kind);

  return (
    <div className={`${styles.lab} ${styles.famCare}`} id="evidence-explorer">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          {/* The section label above already names this surface; a second
              eyebrow here read as a repeated heading. */}
          <h3 className="max-w-2xl font-display text-[1.75rem] leading-[1.15] tracking-[-0.025em] text-balance text-soft-white sm:text-[2.125rem]">
            Filter the published record, and trace{" "}
            <span className="text-gradient">what it informs.</span>
          </h3>
          <p className="mt-4 max-w-2xl text-[13.5px] leading-relaxed text-soft-mute">
            Every chain below runs published record → research foundation →
            capability informed → module built on that capability → and then
            stops, at product-specific validation, which is a separate step.
          </p>
        </div>
        <SegmentTabs
          label="View"
          value={view}
          onChange={(next) => {
            setView(next as "chain" | "timeline");
            setQuery({ view: next === "timeline" ? "timeline" : undefined });
          }}
          options={[
            { id: "chain", label: "Chain" },
            { id: "timeline", label: "Timeline" },
          ]}
        />
      </div>

      {/* ── FILTERS ── */}
      <div className={`${styles.panel} mt-7`}>
        <div className={styles.panelHead}>
          <span className={styles.label}>Filter the record</span>
          <span className={`${styles.label} ml-auto`}>
            {totals.records} records · {totals.capabilities} capabilities ·{" "}
            {totals.products} modules directly informed
          </span>
        </div>
        <div className={`${styles.panelBody} grid gap-5`}>
          <ChipScroller
            label="Research area"
            multi
            options={areas.map((area) => ({
              id: area.id,
              label: area.title,
              count: area.records.length,
            }))}
            selected={areaId ? [areaId] : []}
            onSelect={(id) => toggle("area", areaId, id, setAreaId)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <ChipScroller
              label="Year"
              multi
              options={years.map((value) => ({
                id: String(value),
                label: String(value),
                count: areas
                  .flatMap((area) => area.records)
                  .filter((record) => record.year === value).length,
              }))}
              selected={year ? [year] : []}
              onSelect={(id) => toggle("year", year, id, setYear)}
            />
            <ChipScroller
              label="Record type"
              multi
              options={kinds.map((value) => ({
                id: value,
                label: value === "patent" ? "Patent" : "Journal paper",
                count: areas
                  .flatMap((area) => area.records)
                  .filter((record) => record.kind === value).length,
              }))}
              selected={kind ? [kind] : []}
              onSelect={(id) => toggle("kind", kind, id, setKind)}
            />
          </div>
          <ChipScroller
            label="Capability informed"
            multi
            options={capabilities.map((capability) => ({
              id: capability.id,
              label: capability.title,
            }))}
            selected={capabilityId ? [capabilityId] : []}
            onSelect={(id) => toggle("capability", capabilityId, id, setCapabilityId)}
          />
          <ChipScroller
            label="Product family"
            multi
            options={Object.entries(FAMILY_NAME).map(([id, label]) => ({
              id,
              label,
            }))}
            selected={family ? [family] : []}
            onSelect={(id) => toggle("family", family, id, setFamily)}
            action={
              anyFilter ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[9.5px] uppercase tracking-[0.18em] text-cyan-300"
                >
                  Clear all
                </button>
              ) : undefined
            }
          />
        </div>
      </div>

      {/* ── RESULT ── */}
      <div className="mt-4" aria-live="polite">
        {filtered.length === 0 ? (
          <div className={styles.panel}>
            <div className={styles.panelBody}>
              <p className={styles.note}>
                No record matches that combination. The published record covers
                four areas across {years[0]}–{years[years.length - 1]}; clearing
                a filter will bring it back.
              </p>
            </div>
          </div>
        ) : view === "timeline" ? (
          <ol className={`${styles.panel} ${styles.enter}`}>
            {timeline.map(([value, row], index) => (
              <li
                key={value}
                className={
                  index < timeline.length - 1
                    ? "border-b border-white/[0.07]"
                    : undefined
                }
              >
                <div className="grid gap-4 p-[1.1rem] sm:grid-cols-[5.5rem_minmax(0,1fr)]">
                  <div>
                    <p className={styles.statValue}>{value}</p>
                    <p className={styles.statLabel}>
                      {row.records.length} record
                      {row.records.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <ul className="grid gap-3">
                      {row.records.map((record) => (
                        <li key={record.id}>
                          <Link
                            href={record.href}
                            className="block text-[13.5px] font-medium leading-snug text-soft-white transition-colors hover:text-cyan-300"
                          >
                            {record.title}
                          </Link>
                          <p className={`${styles.label} mt-1`}>
                            {record.venue} ·{" "}
                            {record.kind === "patent" ? "Patent" : "Journal"} ·{" "}
                            {record.areaTitle}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className={`${styles.note} mt-3`}>
                      <span className={styles.label}>Capabilities informed </span>
                      {Array.from(row.capabilities).join(" · ")}
                    </p>
                  </div>
                </div>
              </li>
            ))}
            <li className="border-t border-white/[0.07] p-[1.1rem]">
              <p className={styles.note}>
                Dated from the published record only — the papers&apos; years
                of publication and the patent&apos;s year of grant. The earlier
                research direction is described in the research journey above.
              </p>
            </li>
          </ol>
        ) : (
          <div className={`${styles.enter} grid gap-4`}>
            {filtered.map((area) => (
              <AreaChain key={area.id} area={area} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** One research area, drawn as the five-stage chain. */
function AreaChain({ area }: { area: ExplorerArea }) {
  const [open, setOpen] = useState(false);

  return (
    <section className={styles.panel} aria-label={area.title}>
      <div className={styles.panelHead}>
        <span className={styles.label}>{area.title}</span>
        <span className={`${styles.label} ml-auto`}>
          {area.records.length} record{area.records.length === 1 ? "" : "s"} ·{" "}
          {area.capabilities.length} capabilit
          {area.capabilities.length === 1 ? "y" : "ies"} ·{" "}
          {area.directProducts.length} module
          {area.directProducts.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.panelBody}>
        <p className="max-w-3xl text-sm leading-relaxed text-soft-gray">
          {area.summary}
        </p>
      </div>

      {/* Stage 1 · 2 · 3 */}
      <div className={`${styles.columns} ${styles.columns3}`}>
        <div className={styles.column}>
          <div className={styles.columnHead}>
            <span className={styles.label}>01 · Published research</span>
            <span className={styles.label}>
              {String(area.records.length).padStart(2, "0")}
            </span>
          </div>
          <ul className={styles.list}>
            {area.records.map((record) => (
              <li key={record.id} className={styles.item}>
                <span aria-hidden="true" className={styles.dot} />
                <span>
                  <Link
                    href={record.href}
                    className="text-soft-white transition-colors hover:text-cyan-300"
                  >
                    {record.title}
                  </Link>
                  <span className={`${styles.label} mt-1 block`}>
                    {record.venue} · {record.year} ·{" "}
                    {record.kind === "patent" ? "Patent" : "Journal"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHead}>
            <span className={styles.label}>02 · Research foundation</span>
          </div>
          {area.boundary ? (
            <>
              <ul className={styles.list}>
                {area.boundary.foundation.map((item) => (
                  <li key={item} className={styles.item}>
                    <span aria-hidden="true" className={styles.dot} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className={`${styles.note} mt-3`}>{area.boundary.note}</p>
            </>
          ) : (
            <ul className={styles.list}>
              {Array.from(
                new Set(area.records.flatMap((record) => record.keywords)),
              )
                .slice(0, 6)
                .map((keyword) => (
                  <li key={keyword} className={styles.item}>
                    <span aria-hidden="true" className={styles.dot} />
                    <span>{keyword}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        <div className={styles.column}>
          <div className={styles.columnHead}>
            <span className={styles.label}>03 · Capability informed</span>
            <span className={styles.label}>
              {String(area.capabilities.length).padStart(2, "0")}
            </span>
          </div>
          <ul className={styles.list}>
            {area.capabilities.map((capability) => (
              <li key={capability.id} className={styles.item}>
                <span aria-hidden="true" className={styles.dot} />
                <span>
                  {capability.title}
                  <span className={`${styles.note} mt-0.5 block`}>
                    {capability.description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stage 4 — the split that keeps the chain honest */}
      <div className={styles.panelRule} />
      <div className={`${styles.columns} ${styles.columns2}`}>
        <div className={styles.column}>
          <div className={styles.columnHead}>
            <span className={`${styles.label} ${styles.labelAccent}`}>
              04 · Modules directly informed
            </span>
            <span className={styles.label}>
              {String(area.directProducts.length).padStart(2, "0")}
            </span>
          </div>
          {area.directProducts.length === 0 ? (
            <p className={`${styles.note} mt-3`}>
              No module is built on a capability this record is specifically
              about.
            </p>
          ) : (
            <div className={`${styles.chips} mt-3`}>
              {area.directProducts.map((product) => (
                <Link key={product.id} href={product.href} className={styles.chip}>
                  {product.short}
                </Link>
              ))}
            </div>
          )}
          <p className={`${styles.note} mt-3`}>
            Built on a capability this record addresses directly.
          </p>
        </div>

        <div className={styles.column}>
          <div className={styles.columnHead}>
            <span className={styles.label}>
              04b · Architectural / technical relevance
            </span>
            <span className={styles.label}>
              {String(area.architecturalProducts.length).padStart(2, "0")}
            </span>
          </div>
          {area.architecturalProducts.length === 0 ? (
            <p className={`${styles.note} mt-3`}>None.</p>
          ) : (
            <>
              <div className={`${styles.chips} mt-3`}>
                {(open
                  ? area.architecturalProducts
                  : area.architecturalProducts.slice(0, 6)
                ).map((product) => (
                  <Link
                    key={product.id}
                    href={product.href}
                    className={styles.chip}
                  >
                    {product.short}
                  </Link>
                ))}
              </div>
              {area.architecturalProducts.length > 6 && (
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="mt-2 text-[9.5px] uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
                >
                  {open
                    ? "Show fewer"
                    : `All ${area.architecturalProducts.length} modules`}
                </button>
              )}
            </>
          )}
          <p className={`${styles.note} mt-3`}>
            Reached only through a broad platform capability. Listed for
            traceability — this record does not address these modules, and must
            not be read as evidence for them.
          </p>
        </div>
      </div>

      {/* Stage 5 — where the chain stops */}
      <div className={styles.panelRule} />
      <div className={`${styles.panelBody} bg-white/[0.015]`}>
        <span className={styles.label}>05 · Product-specific validation</span>
        {/* This used to restate the whole foundation-vs-validation argument
            under every pillar. Four identical paragraphs made the page's one
            act of candour read as boilerplate, so the argument is now made
            once, as its own section, and each pillar points at it. What stays
            here is the part that genuinely differs per pillar: the separate
            implementation controls below. */}
        <p className="mt-2.5 max-w-3xl text-[13.5px] leading-relaxed text-soft-gray">
          A separate step, carried out per product and per deployment. See{" "}
          <a
            href="#evidence-boundary"
            className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 transition-colors hover:text-cyan-200"
          >
            research foundation ≠ product validation
          </a>
          .
        </p>
        {area.boundary && (
          <div className="mt-4">
            <span className={styles.label}>{area.boundary.controlsLabel}</span>
            <div className={`${styles.chips} mt-2`}>
              {area.boundary.controls.map((control) => (
                <span key={control} className={styles.chip}>
                  {control}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
