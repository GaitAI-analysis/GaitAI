"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import type { ResearchArea } from "@/data/evidence";
import { PublicationCard } from "./PublicationCard";
import styles from "./evidence.module.css";

type AreaProduct = ResearchArea["products"][number];

/** Records and products shown before the row is expanded. */
const RECORDS_COLLAPSED = 3;
const PRODUCTS_COLLAPSED = 4;

const FAMILY_LABEL: Record<string, string> = {
  mobilitycare: "MobilityCare",
  securevision: "SecureVision",
};

/**
 * Short anchor aliases. The evidence rows have always been addressable as
 * #res-gait-biometrics and friends, and other pages link straight to them
 * (SecureVision points at #res-privacy), so those ids stay on the article.
 * These shorter aliases are added alongside as empty targets — both forms
 * resolve, and no existing link breaks.
 */
const ALIAS: Record<string, string> = {
  "res-gait-biometrics": "gait-biometrics",
  "res-pose-gait": "pose-gait",
  "res-privacy": "privacy",
  "res-edge": "edge",
};

function ProductChip({
  product,
  compact = false,
}: {
  product: AreaProduct;
  compact?: boolean;
}) {
  const family = FAMILY_LABEL[product.vertical] ?? product.vertical;

  return (
    <Link href={product.href} className={styles.chip}>
      <span className="block text-[13px] font-medium leading-snug text-soft-white">
        {product.short}
      </span>
      <span
        className={`mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] ${
          product.vertical === "mobilitycare"
            ? styles.chipFamilyCare
            : styles.chipFamilySecure
        }`}
      >
        {family}
      </span>
      {!compact && (
        <span className="mt-1.5 block text-[11.5px] leading-snug text-soft-mute">
          {product.label}
        </span>
      )}
    </Link>
  );
}

/**
 * One research area as a traceable chain: the published record that grounds
 * it, the capabilities that record informs, and the products built on those
 * capabilities.
 *
 * The three columns are the page's dominant idea, so the layout states them
 * literally — RESEARCH, CAPABILITY, PRODUCTS with a connector between each —
 * and on mobile the same three become a vertical chain rather than three
 * unreadable narrow columns.
 *
 * Collapsed it carries the area name, its record count, the capability names
 * and four products. Expanded it adds the full record list as publication
 * cards, the capability descriptions with their own connected-product counts,
 * and every remaining product. Nothing is dropped by collapsing — it is all
 * one disclosure away, and the row is a real button with aria-expanded and
 * aria-controls so that is reachable from the keyboard.
 *
 * One thing this deliberately does not do is imply the records validate the
 * products. The column heading says "informed by", the shared evidence-status
 * panel states the distinction once, and nothing here repeats it as a
 * disclaimer on every row.
 */
export function EvidencePillar({
  area,
  capabilityProductCounts,
}: {
  area: ResearchArea;
  /** capability id -> how many products across the platform use it. */
  capabilityProductCounts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const [allRecords, setAllRecords] = useState(false);
  const reactId = useId();
  const safeId = reactId.replace(/:/g, "");
  const panelId = `evidence-panel-${area.id}-${safeId}`;
  const recordsId = `evidence-records-${area.id}-${safeId}`;
  const alias = ALIAS[area.id];

  /**
   * Open the row the URL points at, for either anchor form, so a deep link
   * lands on an expanded row rather than a collapsed one.
   */
  useEffect(() => {
    const target = window.location.hash.replace(/^#/, "");
    if (target && (target === area.id || target === alias)) setOpen(true);
  }, [area.id, alias]);

  /*
   * Every record and product is always rendered; `hidden` controls what is
   * shown. Slicing them out of the tree instead would have left three papers
   * and eleven product links absent from the static HTML until someone
   * clicked — invisible to a crawler and to a reader without JS, on a page
   * whose entire purpose is traceability.
   */
  const hiddenProducts = Math.max(
    0,
    area.directProducts.length - PRODUCTS_COLLAPSED,
  );
  const hiddenRecords = Math.max(
    0,
    area.publications.length - RECORDS_COLLAPSED,
  );

  /** The patent is a granted record, not a paper — label it as such. */
  const patent = area.publications.find((p) => p.kind === "patent");
  const recordSummary = patent
    ? `Patent ${patent.patentNumber}`
    : `${area.publications.length} research ${
        area.publications.length === 1 ? "record" : "records"
      }`;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    // Reflect the open row in the URL without adding a history entry, so
    // Back still leaves the page rather than collapsing rows one by one.
    if (next && alias) {
      window.history.replaceState(null, "", `#${alias}`);
    }
  };

  return (
    <article
      id={area.id}
      className={`${styles.evPillar} ${open ? styles.evOpen : ""} site-anchor-offset`}
    >
      {/* Short alias target — see ALIAS above. */}
      {alias && (
        <span
          id={alias}
          aria-hidden="true"
          className="site-anchor-offset pointer-events-none absolute"
        />
      )}

      <div className={styles.evGrid}>
        {/* ── RESEARCH ── */}
        <div className="min-w-0">
          <span
            className={`${styles.evColLabel} text-[10px] font-semibold uppercase tracking-[0.2em]`}
          >
            Research
          </span>
          <h3 className="mt-3 font-display text-[1.25rem] leading-snug text-soft-white sm:text-[1.375rem]">
            {area.title}
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-300/75">
            {recordSummary}
          </p>
          <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-soft-mute">
            {area.summary}
          </p>
        </div>

        <div className={styles.evConnector}>
          <span aria-hidden="true" className={styles.evSpark} />
        </div>
        <div aria-hidden="true" className={`${styles.evStackArrow} text-sm`}>
          ↓
        </div>

        {/* ── CAPABILITY ── */}
        <div className="min-w-0">
          <span
            className={`${styles.evColLabel} text-[10px] font-semibold uppercase tracking-[0.2em]`}
          >
            Capability informed
          </span>
          <ul className="mt-3 space-y-3">
            {area.capabilities.map((capability) => (
              <li key={capability.id}>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-soft-white">
                  {capability.title}
                </p>
                {/* In the DOM either way, same reason as the records. */}
                <p
                  hidden={!open}
                  className="mt-1.5 max-w-prose text-[12.5px] leading-relaxed text-soft-mute"
                >
                  {capability.description}
                </p>
                <p className="mt-1 font-mono text-[10.5px] tabular-nums text-soft-mute/85">
                  {capabilityProductCounts[capability.id] ?? 0} connected{" "}
                  {capabilityProductCounts[capability.id] === 1
                    ? "product"
                    : "products"}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.evConnector}>
          <span aria-hidden="true" className={styles.evSpark} />
        </div>
        <div aria-hidden="true" className={`${styles.evStackArrow} text-sm`}>
          ↓
        </div>

        {/* ── PRODUCTS, in two tiers ──
            The distinction is the point: a capability this research is
            specifically about versus a broad platform capability many
            products happen to share. Collapsing them made a
            gait-recognition paper look like it stood behind FallRisk. */}
        <div className="min-w-0">
          <span
            className={`${styles.evColLabel} text-[10px] font-semibold uppercase tracking-[0.2em]`}
          >
            Products using capabilities informed by this work
          </span>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {area.directProducts.map((product, i) => (
              <li key={product.id} hidden={!open && i >= PRODUCTS_COLLAPSED}>
                <ProductChip product={product} compact={!open} />
              </li>
            ))}
          </ul>

          {area.architecturalProducts.length > 0 && (
            <div hidden={!open} className="mt-5">
              <span
                className={`${styles.evColLabel} text-[10px] font-semibold uppercase tracking-[0.2em]`}
              >
                Architectural relevance ·{" "}
                {area.architecturalProducts.length}
              </span>
              <p className="mt-2 max-w-prose text-[12px] leading-relaxed text-soft-mute">
                These draw on a broad platform capability this work touches,
                not on what the record specifically addresses. Listed for
                traceability — not as evidence for these products.
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {area.architecturalProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={product.href}
                      className="inline-block rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-soft-gray transition-colors hover:border-cyan-300/35 hover:text-soft-white"
                    >
                      {product.short}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {area.implementationNote && (
            <p
              hidden={!open}
              className="mt-5 border-t border-white/[0.07] pt-4 text-[12px] leading-relaxed text-soft-mute"
            >
              {area.implementationNote}
            </p>
          )}

          {!open && hiddenProducts > 0 && (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={panelId}
              className="mt-3 text-[12px] font-medium text-cyan-300/85 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200"
            >
              +{hiddenProducts} connected{" "}
              {hiddenProducts === 1 ? "product" : "products"}
            </button>
          )}
        </div>
      </div>

      {/* ── EXPANDED: the full record list ── */}
      <div
        id={panelId}
        role="region"
        aria-label={`${area.title} — research records`}
        hidden={!open}
        className="mt-8 border-t border-white/[0.07] pt-7"
      >
        <span
          className={`${styles.evColLabel} text-[10px] font-semibold uppercase tracking-[0.2em]`}
        >
          {area.publications.length === 1
            ? "The record"
            : `All ${area.publications.length} records`}
        </span>
        <ol id={recordsId} className="mt-4 grid gap-2.5">
          {area.publications.map((publication, i) => (
            <li
              key={publication.id}
              hidden={!allRecords && i >= RECORDS_COLLAPSED}
            >
              <PublicationCard publication={publication} index={i + 1} />
            </li>
          ))}
        </ol>

        {hiddenRecords > 0 && (
          <button
            type="button"
            onClick={() => setAllRecords((v) => !v)}
            aria-expanded={allRecords}
            aria-controls={recordsId}
            className="mt-4 rounded-md text-[12px] font-medium text-cyan-300/85 underline decoration-cyan-300/30 underline-offset-4 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
          >
            {allRecords
              ? "Show fewer records"
              : `View all ${area.publications.length} records`}
          </button>
        )}
      </div>

      {/* ── The row's own toggle ── */}
      <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-5">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="group inline-flex items-center gap-2 rounded-md text-[12.5px] font-semibold uppercase tracking-[0.14em] text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
        >
          {open ? "Hide evidence" : "Explore evidence"}
          <span
            aria-hidden="true"
            className={`transition-transform duration-300 ${
              open ? "-rotate-90" : "group-hover:translate-x-0.5"
            }`}
          >
            →
          </span>
        </button>

        <Link
          href="/publications"
          className="shrink-0 text-[11.5px] text-soft-mute transition-colors hover:text-soft-white"
        >
          Sources
        </Link>
      </div>
    </article>
  );
}
