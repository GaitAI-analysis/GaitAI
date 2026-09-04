"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CAPTURE_SOURCE_LABEL,
  FAMILY_LABEL,
  analyticsCapabilities,
  analyticsEnvironmentById,
  analyticsProductById,
  analyticsProducts,
  responsibleUseFor,
} from "@/data/analytics";
import { researchAreas } from "@/data/evidence";
import {
  comparisonHref,
  comparisonLabel,
  productComparisons,
} from "@/data/comparisons";
import { familyClass } from "./primitives";
import { parseList, useQueryState } from "./useQueryState";
import styles from "./analytics.module.css";

/**
 * PRODUCT COMPARE ANALYTICS — /products
 *
 * GaitScape compares systems inside the ecosystem map; this brings the same
 * behaviour to the product catalogue, wired to the analytics model and to the
 * URL, so `?compare=walkscan,fallrisk,rehabtrack` is a shareable link and the
 * stack configurator can hand its recommendation straight into a comparison.
 *
 * IT OPENS ON A QUESTION, NOT AN EMPTY TABLE. An unpopulated comparison asks
 * the reader to already know which two modules are the confusable ones, so the
 * named pairs from `data/comparisons.ts` sit above the picker as one-click
 * starting points — the four real "which of these two?" decisions, each with
 * the question it answers. The picker is still there for anything else.
 *
 * Every row is canonical data, and no row is prose written for this table:
 * purpose is the module's own one-line label, input and delivery come from
 * `systemFactsFor`, the capability ticks are the documented `powered-by`
 * relationships, outputs are the module's own list, environments are the
 * records that name it, and the responsible-use note is the one canonical
 * statement for that family. Capability rows appear only when at least one
 * selected module has them, so the table never runs thirteen rows of dashes.
 */

const MAX = 3;
const KEYS = ["compare"] as const;
const ALL_IDS = analyticsProducts.map((product) => product.id);

export function ProductCompare({
  selected,
  onSelectedChange,
}: {
  /** Controlled selection, so the configurator can populate it. */
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
}) {
  const { values, setQuery, hydrated } = useQueryState(KEYS);
  const [internal, setInternal] = useState<string[]>([]);
  const [query, setQueryText] = useState("");

  const ids = selected ?? internal;

  const setIds = useCallback(
    (next: string[]) => {
      if (onSelectedChange) onSelectedChange(next);
      else setInternal(next);
      setQuery({ compare: next.length ? next.join(",") : undefined });
    },
    [onSelectedChange, setQuery],
  );

  useEffect(() => {
    if (!hydrated) return;
    const parsed = parseList(values.compare, ALL_IDS, MAX);
    if (parsed.length > 0) {
      if (onSelectedChange) onSelectedChange(parsed);
      else setInternal(parsed);
    }
    // Applied once from the URL and again on Back / Forward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, values.compare]);

  const toggle = (id: string) => {
    if (ids.includes(id)) setIds(ids.filter((item) => item !== id));
    else if (ids.length < MAX) setIds([...ids, id]);
  };

  const chosen = useMemo(
    () =>
      ids.flatMap((id) => {
        const product = analyticsProductById.get(id);
        return product ? [product] : [];
      }),
    [ids],
  );

  const matches = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return analyticsProducts;
    return analyticsProducts.filter((product) =>
      `${product.short} ${product.label}`.toLowerCase().includes(text),
    );
  }, [query]);

  /** Capability rows worth showing for this selection. */
  const capabilityRows = useMemo(
    () =>
      analyticsCapabilities.filter((capability) =>
        chosen.some((product) => product.capabilityIds.includes(capability.id)),
      ),
    [chosen],
  );

  const areaTitle = (id: string) =>
    researchAreas.find((area) => area.id === id)?.title ?? id;

  return (
    <div className={styles.lab}>
      {/* ── THE NAMED PAIRS ──
          The four decisions people actually arrive with. Buttons, not links:
          they populate the table in place, so a reader can move between
          questions without a page load, and the `?compare=` URL still updates
          so the state they land on stays shareable. */}
      <div className="mb-4">
        <span className={styles.label}>Comparisons worth making</span>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {productComparisons.map((comparison) => {
            const on =
              ids.length === comparison.pair.length &&
              comparison.pair.every((id) => ids.includes(id));
            return (
              <li key={comparison.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setIds([...comparison.pair])}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors ${
                    on
                      ? "border-cyan-300/40 bg-cyan-300/[0.07]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <span className="block text-[13.5px] font-medium text-soft-white">
                    {comparisonLabel(comparison)}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-snug text-soft-mute">
                    {comparison.question}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── PICKER ── */}
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <span className={styles.label}>Compare modules</span>
          <span className={`${styles.label} ml-auto`}>
            {ids.length} of {MAX} selected
          </span>
        </div>
        <div className={styles.panelBody}>
          <label className="block">
            <span className="sr-only">Filter modules by name</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder="Filter modules…"
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-soft-white placeholder:text-soft-mute focus:border-cyan-300/40 focus:outline-none focus:ring-1 focus:ring-cyan-300/30"
            />
          </label>

          <div className={`${styles.chips} mt-3`} role="group" aria-label="Modules">
            {matches.map((product) => {
              const on = ids.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  aria-pressed={on}
                  disabled={!on && ids.length >= MAX}
                  onClick={() => toggle(product.id)}
                  className={`${styles.chip} ${on ? styles.chipOn : ""} ${
                    !on && ids.length >= MAX ? styles.chipDisabled : ""
                  }`}
                >
                  {product.short}
                </button>
              );
            })}
          </div>

          {ids.length > 0 && (
            <button
              type="button"
              onClick={() => setIds([])}
              className="mt-3 text-[10px] uppercase tracking-[0.18em] text-soft-mute transition-colors hover:text-soft-white"
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* ── TABLE ── */}
      {chosen.length === 0 ? (
        <p className={`${styles.note} mt-4`}>
          Pick a comparison above, or choose up to {MAX} modules yourself.
          Either way the rows are the same records the module pages use.
        </p>
      ) : (
        <div className={`${styles.panel} ${styles.enter} mt-4`}>
          <div className={styles.matrixScroll}>
            <table className={styles.matrix} style={{ minWidth: "min(100%, 760px)" }}>
              <caption className="sr-only">
                Side-by-side comparison of the selected GaitAI modules.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={styles.rowHeadCell}>
                    <span className={`${styles.colHead} block !text-left`}>
                      Attribute
                    </span>
                  </th>
                  {chosen.map((product) => (
                    <th key={product.id} scope="col" className="align-bottom">
                      <span
                        className={`${familyClass(product.family)} block px-3 py-3 text-left`}
                      >
                        <Link href={product.href} className={styles.moduleName}>
                          {product.short}
                        </Link>
                        <span className={`${styles.label} mt-1 block`}>
                          {FAMILY_LABEL[product.family]}
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Primary purpose", value: (p: (typeof chosen)[number]) => p.label },
                  { label: "Input", value: (p: (typeof chosen)[number]) => p.input },
                  {
                    label: "Capture sources",
                    value: (p: (typeof chosen)[number]) =>
                      p.sources.map((s) => CAPTURE_SOURCE_LABEL[s]).join(" · "),
                  },
                  {
                    label: "Environment context",
                    value: (p: (typeof chosen)[number]) => p.environmentContext,
                  },
                  { label: "Delivery", value: (p: (typeof chosen)[number]) => p.delivery },
                ].map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className={styles.rowHeadCell}>
                      <span className={styles.rowHead}>
                        {row.label}
                      </span>
                    </th>
                    {chosen.map((product) => (
                      <td key={product.id} className="align-top">
                        <span className={`${styles.note} block px-3 py-2.5`}>
                          {row.value(product)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}

                {/* Capability ticks — documented powered-by relationships. */}
                {capabilityRows.map((capability) => (
                  <tr key={capability.id}>
                    <th scope="row" className={styles.rowHeadCell}>
                      <span className={styles.rowHead}>
                        {capability.title}
                      </span>
                    </th>
                    {chosen.map((product) => {
                      const has = product.capabilityIds.includes(capability.id);
                      return (
                        <td key={product.id} className="align-top">
                          <span
                            className={`block px-3 py-2.5 text-center text-[13px] ${
                              has ? "text-cyan-300" : "text-soft-mute/50"
                            }`}
                          >
                            {has ? "✓" : "—"}
                            <span className="sr-only">
                              {has ? "yes" : "not documented"}
                            </span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {[
                  {
                    label: "Main outputs",
                    items: (p: (typeof chosen)[number]) => p.outputs,
                  },
                  {
                    /* "Best fit" is the module's own documented primary user
                       types — not a judgement written for this table. */
                    label: "Best fit",
                    items: (p: (typeof chosen)[number]) => p.users,
                  },
                  {
                    label: "Movement signals",
                    items: (p: (typeof chosen)[number]) => p.signals,
                  },
                  {
                    label: "Typical environments",
                    items: (p: (typeof chosen)[number]) =>
                      p.environmentIds.flatMap((id) => {
                        const environment = analyticsEnvironmentById.get(id);
                        return environment ? [environment.name] : [];
                      }),
                  },
                ].map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className={styles.rowHeadCell}>
                      <span className={styles.rowHead}>
                        {row.label}
                      </span>
                    </th>
                    {chosen.map((product) => {
                      const items = row.items(product);
                      return (
                        <td key={product.id} className="align-top">
                          {items.length === 0 ? (
                            <span className={`${styles.note} block px-3 py-2.5`}>
                              Not named in any environment record.
                            </span>
                          ) : (
                            <ul className={`${styles.list} px-3 py-2.5`}>
                              {items.map((item) => (
                                <li key={item} className={styles.item}>
                                  <span
                                    aria-hidden="true"
                                    className={`${styles.dot} ${styles.dotMute}`}
                                  />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr>
                  <th scope="row" className={styles.rowHeadCell}>
                    <span className={styles.rowHead}>
                      Research basis
                    </span>
                  </th>
                  {chosen.map((product) => (
                    <td key={product.id} className="align-top">
                      <span className={`${styles.note} block px-3 py-2.5`}>
                        {product.researchAreaIds.length === 0 ? (
                          "No published record maps to this module's capabilities."
                        ) : (
                          <>
                            {product.researchAreaIds.map(areaTitle).join("; ")}
                            <Link
                              href="/research#evidence-explorer"
                              className="mt-1.5 block text-cyan-300"
                            >
                              Trace the evidence →
                            </Link>
                          </>
                        )}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <th scope="row" className={styles.rowHeadCell}>
                    <span className={styles.rowHead}>
                      Responsible-use notes
                    </span>
                  </th>
                  {chosen.map((product) => (
                    <td key={product.id} className="align-top">
                      <span className={`${styles.note} block px-3 py-2.5`}>
                        {responsibleUseFor(product.family)}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
