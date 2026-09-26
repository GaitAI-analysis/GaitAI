"use client";

import { useState } from "react";
import Link from "next/link";
import { StackConfigurator } from "./StackConfigurator";
import { ProductCompare } from "./ProductCompare";
import { Eyebrow } from "./primitives";
import styles from "./analytics.module.css";

/**
 * The /products analytical block: configure a stack, then compare what it
 * recommended.
 *
 * The two live in one client component so "Compare these modules →" in the
 * configurator can populate the comparison directly — which is the whole
 * reason the pair is worth more than either alone. Selecting from the
 * configurator scrolls the comparison into view rather than jumping the page.
 */
export function ProductAnalytics() {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const compare = (ids: string[]) => {
    setCompareIds(ids);
    requestAnimationFrame(() => {
      document
        .getElementById("compare")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <StackConfigurator onCompare={compare} />

      <p className={`${styles.note} mt-5`}>
        Want to see what the pipeline actually does with a signal before
        choosing modules?{" "}
        <Link href="/movement-lab" className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4">
          Open the Movement Intelligence Lab
        </Link>
        {" "}— an interactive demonstration with example values.
      </p>

      <div id="compare" className="mt-16 scroll-mt-28 sm:mt-20">
        <Eyebrow>Compare modules</Eyebrow>
        <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
          Put two or three modules{" "}
          <span className="text-gradient">side by side.</span>
        </h2>
        <p className={`${styles.note} mt-4 max-w-2xl !text-[0.8125rem]`}>
          Inputs, capture sources, capabilities, outputs, best fit,
          documented environments and the research basis — from the same
          records the module pages use.
        </p>
        <div className="mt-8">
          <ProductCompare
            selected={compareIds}
            onSelectedChange={setCompareIds}
          />
        </div>
      </div>
    </>
  );
}
