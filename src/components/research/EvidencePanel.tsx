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
 * The architectural tier and the implementation boundary are rendered
 * either way and toggled with `hidden`, not mounted on demand: they ARE the
 * evidence boundary, and a boundary that only exists after a click is
 * absent from the static HTML and from any reader without JS.
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
  /* The chip row shows the DIRECT tier only. Slicing the combined list put
     architectural-relevance products in the row headed "informed by this
     work", which is the claim the two tiers exist to keep apart. */
  const products = allProducts
    ? area.directProducts
    : area.directProducts.slice(0, PRODUCTS_SHOWN);

  const hiddenRecords = area.publications.length - RECORDS_SHOWN;
  const hiddenProducts = area.directProducts.length - PRODUCTS_SHOWN;

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

      {/* ── Products, in two tiers ──
          The distinction is the evidence boundary, not decoration: a
          capability this record is specifically about versus a broad platform
          capability many products happen to share. */}
      <section className={styles.panelGroup}>
        <span className={styles.panelGroupLabel}>
          Products using capabilities informed by this work ·{" "}
          {area.directProducts.length}
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
              : `+${hiddenProducts} more`}
          </button>
        )}
      </section>

      {area.architecturalProducts.length > 0 && (
        <section
          hidden={!(expanded || allProducts)}
          className={styles.panelGroup}
        >
          <span className={styles.panelGroupLabel}>
            Architectural / technical relevance ·{" "}
            {area.architecturalProducts.length}
          </span>
          <p className={styles.capDetailDesc}>
            These draw on a broad platform capability this work touches, not on
            what the record specifically addresses. Listed for traceability —
            not as evidence for these products.
          </p>
          <div className={styles.panelChips}>
            {area.architecturalProducts.map((product) => (
              <Link
                key={product.id}
                href={product.href}
                className={`${styles.panelChip} ${styles.panelChipMuted}`}
              >
                {product.short}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Research principle vs shipped control, as two named lists.
          The privacy row is why this is not one sentence: the page used to
          list skeleton-only analytics, face blur, audit logs and retention as
          the capability the privacy paper informed, and then disclaim them in
          a footnote. Both halves are labelled and separated now. */}
      {area.boundary && (
        <section
          hidden={!(expanded || allProducts)}
          className={styles.panelBoundary}
        >
          <div className={styles.boundaryPair}>
            <div>
              <span className={styles.boundaryLabel}>
                {area.boundary.foundationLabel}
              </span>
              <ul className={styles.boundaryList}>
                {area.boundary.foundation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className={styles.boundaryLabel}>
                {area.boundary.controlsLabel}
              </span>
              <ul className={styles.boundaryList}>
                {area.boundary.controls.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className={styles.boundaryNote}>{area.boundary.note}</p>
        </section>
      )}

      {/* ── The one CTA ── */}
      <button type="button" onClick={toggleAll} className={styles.panelCta}>
        {expanded ? "Collapse evidence ↑" : "Explore full evidence →"}
      </button>
    </>
  );
}
