"use client";

import { useState } from "react";
import Link from "next/link";
import type { Vertical } from "@/data/products";
import { analyticsProductsFor, CAPTURE_SOURCE_LABEL } from "@/data/analytics";
import { familyClass } from "./primitives";
import styles from "./analytics.module.css";

/**
 * ENVIRONMENT VISUAL ANALYTICS — module × stage.
 *
 * Rows are modules, columns are the four stages every GaitAI module runs
 * through: what goes in, what processes it, what is measured, what comes out.
 * Deliberately not a spreadsheet — a 23 × 4 grid of full sentences is
 * unreadable, so a collapsed row shows the module and a one-line summary of
 * each stage, and opening a row expands it into the full lists.
 *
 * Every stage is derived from the module's own record:
 *
 *   Input       systemFactsFor(id).input, plus the capture sources matched
 *               from it
 *   Processing  the module's documented capabilities, in pipeline order
 *   Analytics   the movement signals the module is documented as reading
 *   Output      the module's own output list
 *
 * The row is a disclosure button rather than a hover target, so it works on a
 * phone; the module link sits inside the expanded row rather than wrapping it,
 * so opening a row never navigates away by accident.
 */

/** The order the platform's own pipeline runs in, for the processing column. */
const PIPELINE_ORDER = [
  "Pose estimation",
  "Multimodal sensor fusion",
  "Gait analysis",
  "Human activity recognition",
  "Trajectory analysis",
  "Temporal modelling",
  "Movement biometrics",
  "Person re-identification",
  "Anomaly detection",
  "Risk scoring",
  "Privacy-aware analytics",
  "Edge inference",
  "Explainable reporting",
];

const inPipelineOrder = (capabilities: string[]) =>
  [...capabilities].sort(
    (a, b) => PIPELINE_ORDER.indexOf(a) - PIPELINE_ORDER.indexOf(b),
  );

export function ModuleStageMatrix({
  productIds,
  family,
}: {
  productIds: string[];
  family?: Vertical;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const products = analyticsProductsFor(productIds);

  if (products.length === 0) return null;

  return (
    <div className={`${styles.lab} ${familyClass(family)} ${styles.panel}`}>
      <div className={styles.matrixScroll}>
        <div className="min-w-[640px]">
          {/* Column headings, stated once. */}
          <div className="grid grid-cols-[minmax(9rem,1.1fr)_repeat(4,minmax(0,1fr))] border-b border-white/[0.07]">
            {["Module", "Input", "Processing", "Analytics", "Output"].map(
              (heading) => (
                <span key={heading} className={`${styles.colHead} !text-left px-3`}>
                  {heading}
                </span>
              ),
            )}
          </div>

          {products.map((product) => {
            const open = openId === product.id;
            const processing = inPipelineOrder(product.capabilities);

            return (
              <div key={product.id} className="border-b border-white/[0.06] last:border-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : product.id)}
                  className={`grid w-full grid-cols-[minmax(9rem,1.1fr)_repeat(4,minmax(0,1fr))] items-start gap-0 px-0 py-3 text-left ${
                    open ? styles.cellOn : ""
                  }`}
                >
                  <span className={`${styles.moduleName} px-3 !text-[0.9375rem]`}>
                    {product.short}
                  </span>
                  <span className={`${styles.note} px-3`}>{product.input}</span>
                  <span className={`${styles.note} px-3`}>
                    {processing.slice(0, 3).join(" → ")}
                    {processing.length > 3 ? " →" : ""}
                  </span>
                  <span className={`${styles.note} px-3`}>
                    {product.signals.slice(0, 2).join(", ")}
                    {product.signals.length > 2
                      ? ` +${product.signals.length - 2}`
                      : ""}
                  </span>
                  <span className={`${styles.note} px-3`}>
                    {product.outputs.slice(0, 2).join(", ")}
                    {product.outputs.length > 2 ? "…" : ""}
                  </span>
                </button>

                {open && (
                  <div
                    className={`${styles.enter} grid gap-px border-t border-white/[0.06] sm:grid-cols-2 lg:grid-cols-4`}
                  >
                    <div className={styles.column}>
                      <span className={styles.label}>Input</span>
                      <p className={`${styles.note} mt-2`}>{product.input}</p>
                      <p className={`${styles.note} mt-2`}>
                        {product.sources
                          .map((source) => CAPTURE_SOURCE_LABEL[source])
                          .join(" · ")}
                      </p>
                    </div>

                    <div className={styles.column}>
                      <span className={styles.label}>Processing</span>
                      <ul className={styles.list}>
                        {processing.map((capability, i) => (
                          <li key={capability} className={styles.item}>
                            <span className={styles.stageIndex}>
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.column}>
                      <span className={styles.label}>Analytics</span>
                      <ul className={styles.list}>
                        {product.signals.map((signal) => (
                          <li key={signal} className={styles.item}>
                            <span aria-hidden="true" className={styles.dot} />
                            <span>{signal}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.column}>
                      <span className={styles.label}>Output</span>
                      <ul className={styles.list}>
                        {product.outputs.map((output) => (
                          <li key={output} className={styles.item}>
                            <span
                              aria-hidden="true"
                              className={`${styles.dot} ${styles.dotMute}`}
                            />
                            <span>{output}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={product.href} className={`${styles.moduleGo} mt-3`}>
                        Explore {product.short}
                        <span aria-hidden="true" className={styles.moduleGoArrow}>
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
