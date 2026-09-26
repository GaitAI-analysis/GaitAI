"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Vertical } from "@/data/products";
import {
  COVERAGE_LABEL,
  COVERAGE_MEANING,
  FAMILY_LABEL,
  analyticsCapabilities,
  analyticsEnvironmentById,
  analyticsEnvironments,
  analyticsProductById,
  coverageFor,
  type CoverageState,
} from "@/data/analytics";
import { SegmentTabs } from "./controls";
import styles from "./analytics.module.css";

/**
 * INTELLIGENCE COVERAGE MAP — capability × environment.
 *
 * The question it answers is the one a buyer actually has: *is the capability
 * I care about part of what GaitAI does in a place like mine?* GaitScape
 * already maps capability × product; this maps capability × environment,
 * which is the join a reader on /products cannot otherwise make.
 *
 * Cells are three discrete states, never a score:
 *
 *   Primary     powers a module in that environment's documented mix
 *   Supporting  available in that product family, not in the documented mix
 *   Not used    no module in that family uses it
 *
 * The repository documents which modules an environment's record lists and
 * nothing finer, so a numeric relevance value here would be invented. The
 * legend states all three meanings on the page rather than in a tooltip.
 *
 * Reading a matrix is a two-step act — find the cell, then find out what it
 * means — so every cell is a button and the meaning appears in a readout
 * panel under the grid rather than in a hover tooltip that a touch device
 * cannot open. On a phone the family filter cuts the grid to six or eleven
 * columns and the whole thing scrolls horizontally with the capability names
 * pinned.
 */

type Cell = { capabilityId: string; environmentId: string };

export function CoverageMatrix() {
  const [family, setFamily] = useState<"all" | Vertical>("all");
  const [cell, setCell] = useState<Cell | null>(null);

  const environments = useMemo(
    () =>
      analyticsEnvironments.filter(
        (environment) => family === "all" || environment.family === family,
      ),
    [family],
  );

  /** Capabilities with at least one primary cell in the visible columns. */
  const capabilities = useMemo(
    () =>
      analyticsCapabilities.filter((capability) =>
        environments.some(
          (environment) =>
            coverageFor(capability.id, environment.id).state !== "none",
        ),
      ),
    [environments],
  );

  const readout = useMemo(() => {
    if (!cell) return null;
    const capability = analyticsCapabilities.find(
      (item) => item.id === cell.capabilityId,
    );
    const environment = analyticsEnvironmentById.get(cell.environmentId);
    if (!capability || !environment) return null;
    const coverage = coverageFor(capability.id, environment.id);
    return { capability, environment, coverage };
  }, [cell]);

  return (
    <div className={styles.lab}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentTabs
          label="Product family"
          value={family}
          onChange={(id) => {
            setFamily(id as "all" | Vertical);
            setCell(null);
          }}
          options={[
            { id: "all", label: "Both families" },
            { id: "mobilitycare", label: FAMILY_LABEL.mobilitycare },
            { id: "securevision", label: FAMILY_LABEL.securevision },
          ]}
        />
        <p className={styles.label}>
          {capabilities.length} capabilities × {environments.length} environments
        </p>
      </div>

      {/* The <caption> already says every cell is a button, but it is sr-only:
          a sighted reader saw a grid of 9px marks and no reason to think it
          answered to them. One visible line, matching the caption. */}
      <p className="ix-hint mt-4">
        Select a cell to see the modules and signals behind it
      </p>

      <div className={`${styles.panel} mt-3`}>
        <div className={styles.matrixScroll}>
          <table className={styles.matrix}>
            <caption className="sr-only">
              Which movement-intelligence capability is part of the documented
              module mix in each environment. Each cell is a button; selecting
              one names the modules and signals involved.
            </caption>
            <thead>
              <tr>
                <th scope="col" className={styles.rowHeadCell}>
                  <span className={`${styles.colHead} block text-left`}>
                    Capability
                  </span>
                </th>
                {environments.map((environment) => (
                  <th key={environment.id} scope="col">
                    <span
                      className={`${styles.colHead} ${
                        cell?.environmentId === environment.id
                          ? styles.colHeadOn
                          : ""
                      }`}
                    >
                      {environment.shortName}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilities.map((capability) => (
                <tr key={capability.id}>
                  <th scope="row" className={styles.rowHeadCell}>
                    <span
                      className={`${styles.rowHead} ${
                        cell?.capabilityId === capability.id ? styles.rowHeadOn : ""
                      }`}
                    >
                      {capability.title}
                    </span>
                  </th>
                  {environments.map((environment) => {
                    const state: CoverageState = coverageFor(
                      capability.id,
                      environment.id,
                    ).state;
                    const on =
                      cell?.capabilityId === capability.id &&
                      cell?.environmentId === environment.id;
                    return (
                      <td key={environment.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setCell(
                              on
                                ? null
                                : {
                                    capabilityId: capability.id,
                                    environmentId: environment.id,
                                  },
                            )
                          }
                          aria-pressed={on}
                          className={`${styles.cell} ${
                            state === "primary"
                              ? styles.cellPrimary
                              : state === "supporting"
                                ? styles.cellSupporting
                                : styles.cellNone
                          } ${
                            environment.family === "securevision"
                              ? styles.cellSecure
                              : ""
                          } ${on ? styles.cellOn : ""}`}
                        >
                          <span aria-hidden="true" className={styles.cellInner} />
                          <span className="sr-only">
                            {capability.title} in {environment.name}:{" "}
                            {COVERAGE_LABEL[state]}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.panelRule} />

        {/* The readout: what the selected cell actually means. */}
        <div className={styles.panelBody} aria-live="polite">
          {!readout ? (
            <>
              <p className={styles.note}>
                Select a cell to see which modules apply that capability in
                that environment, and which movement signals they read.
              </p>
              <div className={styles.legend}>
                {(["primary", "supporting", "none"] as CoverageState[]).map(
                  (state) => (
                    <span key={state} className={styles.legendItem}>
                      <span
                        aria-hidden="true"
                        className={styles.legendSwatch}
                        style={{
                          background:
                            state === "primary"
                              ? "var(--an-cyan)"
                              : state === "supporting"
                                ? "transparent"
                                : "var(--an-grid)",
                          border:
                            state === "supporting"
                              ? "1px solid var(--an-line-mid)"
                              : undefined,
                          borderRadius: state === "none" ? "999px" : undefined,
                        }}
                      />
                      <strong className="font-medium text-soft-gray">
                        {COVERAGE_LABEL[state]}
                      </strong>
                      — {COVERAGE_MEANING[state]}
                    </span>
                  ),
                )}
              </div>
            </>
          ) : (
            <div className={styles.enter}>
              <p className={styles.label}>
                {readout.capability.title} × {readout.environment.name}
              </p>
              <p className={`${styles.value} mt-2 text-[0.9375rem]`}>
                {COVERAGE_LABEL[readout.coverage.state]}
                <span className={`${styles.note} ml-2 font-normal`}>
                  {COVERAGE_MEANING[readout.coverage.state]}
                </span>
              </p>

              {readout.coverage.productIds.length > 0 && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className={styles.label}>
                      {readout.coverage.state === "primary"
                        ? "Modules in this environment"
                        : "Modules in this family"}
                    </span>
                    <div className={`${styles.chips} mt-2`}>
                      {readout.coverage.productIds.map((id) => {
                        const product = analyticsProductById.get(id);
                        if (!product) return null;
                        return (
                          <Link
                            key={id}
                            href={product.href}
                            className={styles.chip}
                          >
                            {product.short}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {readout.coverage.signals.length > 0 && (
                    <div>
                      <span className={styles.label}>Signals read here</span>
                      <ul className={styles.list}>
                        {readout.coverage.signals.map((signal) => (
                          <li key={signal} className={styles.item}>
                            <span aria-hidden="true" className={styles.dot} />
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {readout.environment.detailSlug && (
                <Link
                  href={`/use-cases/${readout.environment.detailSlug}/`}
                  className={`${styles.moduleGo} mt-4`}
                >
                  How {readout.environment.name} deploys
                  <span aria-hidden="true" className={styles.moduleGoArrow}>
                    →
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
