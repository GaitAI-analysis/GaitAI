"use client";

import { useState } from "react";
import Link from "next/link";
import { PillarVisual } from "./PillarVisual";
import type { ObservatoryArea } from "./EvidenceObservatory";
import styles from "./observatory.module.css";

/**
 * The evidence map's right-hand panel: a COMPACT summary of the selected
 * research pillar, not the whole evidence record.
 *
 * It used to render three publication rows, every capability with its full
 * description, and six product chips, all at once — which made the right
 * column two to three times taller than the graph beside it and left the
 * section visibly unbalanced. The fix is progressive disclosure, not a
 * fixed-height box with a scrollbar: the default view is a summary, and every
 * piece of detail is one deliberate click away in the same panel.
 *
 * Defaults:
 *   records       2, with "View all N research records" expanding inline
 *   capabilities  names only, as chips; a click reveals that one description
 *   products      4 chips, with "+N more" expanding inline
 *
 * `Explore full evidence` opens all three at once and becomes `Collapse
 * evidence`, so the old complete view is still reachable in one action.
 *
 * NOTHING is removed from the data. `area` still carries every publication,
 * capability and product mapping `researchAreas` resolved — this component
 * only decides how much of it is on screen to begin with.
 *
 * State resets per pillar because EvidenceObservatory keys this component on
 * `area.id`: switching pillars remounts it, so pillar 2 never opens with
 * pillar 1's sections expanded. That is also why there is no effect here.
 */

/** Compact defaults. Everything above these counts is one click away. */
const RECORDS_SHOWN = 2;
const PRODUCTS_SHOWN = 4;

export function EvidencePanel({ area }: { area: ObservatoryArea }) {
  /** The master toggle — opens records, capability descriptions and products. */
  const [expanded, setExpanded] = useState(false);
  /** Independent disclosures, so a reader can open just one group. */
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  /** Which capability's one-line description is showing. */
  const [openCapability, setOpenCapability] = useState<string | null>(null);

  const allRecords = expanded || recordsOpen;
  const allProducts = expanded || productsOpen;

  const records = allRecords
    ? area.publications
    : area.publications.slice(0, RECORDS_SHOWN);
  const products = allProducts
    ? area.products
    : area.products.slice(0, PRODUCTS_SHOWN);

  const hiddenRecords = area.publications.length - RECORDS_SHOWN;
  const hiddenProducts = area.products.length - PRODUCTS_SHOWN;

  const toggleAll = () => {
    const next = !expanded;
    setExpanded(next);
    // Collapsing the master toggle closes the independent disclosures too, so
    // "Collapse evidence" always returns the panel to its compact default
    // rather than to some half-open middle state.
    if (!next) {
      setRecordsOpen(false);
      setProductsOpen(false);
      setOpenCapability(null);
    }
  };

  return (
    <>
      <PillarVisual kind={area.kind} className={styles.panelVisual} />
      <h3 className={styles.panelTitle}>{area.title}</h3>
      <p className={styles.panelSummary}>{area.summary}</p>

      {/* The pillar's shape in one line, so the counts are visible without
          having to expand anything. */}
      <p className={styles.panelMeta}>
        {area.publications.length}{" "}
        {area.publications.length === 1 ? "research record" : "research records"}{" "}
        · {area.capabilities.length}{" "}
        {area.capabilities.length === 1 ? "capability" : "capabilities"} ·{" "}
        {area.products.length}{" "}
        {area.products.length === 1 ? "product" : "products"}
      </p>

      {/* ── Research foundation ── */}
      <section className={styles.panelGroup}>
        <span className={styles.panelGroupLabel}>Research foundation</span>
        <ol className={styles.recordList}>
          {records.map((publication, i) => (
            <li key={publication.id}>
              <Link
                href={`/publications/${publication.id}/`}
                title={publication.title}
                className={styles.recordRow}
              >
                <span className={styles.recordIndex}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className={styles.recordTitle}>
                    {publication.title}
                  </span>
                  <span className={styles.recordFoot}>
                    {publication.venue} · {publication.year}
                  </span>
                </span>
                <span aria-hidden="true" className={styles.recordArrow}>
                  ↗
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {hiddenRecords > 0 && (
          <button
            type="button"
            onClick={() => setRecordsOpen((v) => !v)}
            aria-expanded={allRecords}
            className={styles.panelMore}
          >
            {allRecords
              ? "Show fewer records ↑"
              : `View all ${area.publications.length} research records →`}
          </button>
        )}
      </section>

      {/* ── Capabilities ──
          Names only by default. The descriptions are what made this panel
          long, so each one waits for its own chip to be pressed; `title`
          gives the same sentence on hover for a pointer user. */}
      <section className={styles.panelGroup}>
        <span className={styles.panelGroupLabel}>
          Capabilities · {area.capabilities.length}
        </span>
        <div className={styles.panelChips}>
          {area.capabilities.map((capability) => {
            const open = expanded || openCapability === capability.id;
            return (
              <button
                key={capability.id}
                type="button"
                title={capability.description}
                aria-expanded={open}
                onClick={() =>
                  setOpenCapability((current) =>
                    current === capability.id ? null : capability.id,
                  )
                }
                className={`${styles.capChip}${
                  open ? ` ${styles.capChipOpen}` : ""
                }`}
              >
                {capability.title}
              </button>
            );
          })}
        </div>

        {/* One description at a time when a chip is pressed; all of them only
            in the fully expanded view. */}
        {(expanded || openCapability) && (
          <dl className={styles.capDetails}>
            {area.capabilities
              .filter((c) => expanded || c.id === openCapability)
              .map((capability) => (
                <div key={capability.id}>
                  {expanded && (
                    <dt className={styles.capDetailTerm}>{capability.title}</dt>
                  )}
                  <dd className={styles.capDetailDesc}>
                    {capability.description}
                  </dd>
                </div>
              ))}
          </dl>
        )}
      </section>

      {/* ── Connected products ── */}
      <section className={styles.panelGroup}>
        <span className={styles.panelGroupLabel}>
          Connected products · {area.products.length}
        </span>
        <div className={styles.panelChips}>
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className={`${styles.panelChip} ${
                product.vertical === "mobilitycare"
                  ? styles.panelChipCare
                  : styles.panelChipSecure
              }`}
            >
              {product.short}
            </Link>
          ))}
        </div>

        {hiddenProducts > 0 && (
          <button
            type="button"
            onClick={() => setProductsOpen((v) => !v)}
            aria-expanded={allProducts}
            className={styles.panelMore}
          >
            {allProducts
              ? "Show fewer products ↑"
              : `+${hiddenProducts} connected ${
                  hiddenProducts === 1 ? "product" : "products"
                }`}
          </button>
        )}
      </section>

      {/* ── The one CTA ── */}
      <button type="button" onClick={toggleAll} className={styles.panelCta}>
        {expanded ? "Collapse evidence ↑" : "Explore full evidence →"}
      </button>
    </>
  );
}
