"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CAPTURE_SOURCES,
  analyticsProductById,
  chainForSource,
  type CaptureSource,
} from "@/data/analytics";
import { SegmentTabs } from "./controls";
import { Eyebrow } from "./primitives";
import styles from "./analytics.module.css";

/**
 * "WHAT CAN MOVEMENT TELL US?" — the home teaser.
 *
 * One compact panel, deliberately not a dashboard. Pick an input and the
 * panel traces the chain the whole platform runs on:
 *
 *   signal → measurements → intelligence → modules
 *
 * Every row is derived from the same relationships the explorers use, capped
 * to the first few entries so the home page stays a teaser: the full versions
 * live on /use-cases, /products and /movement-lab, and the two links at the
 * bottom go there.
 *
 * Four inputs rather than six: walking video, CCTV, wearable and pose stream
 * are the four a reader recognises as things they either have or do not. The
 * remaining sources (mobile, multiple sources) are part of the explorers,
 * where a reader is choosing rather than orienting.
 */

const TABS: CaptureSource[] = ["video", "cctv", "wearable", "pose"];
const CAP = 4;

export function MovementTeaser() {
  const [source, setSource] = useState<CaptureSource>("video");
  const chain = useMemo(() => chainForSource(source), [source]);

  const modules = chain.productIds
    .flatMap((id) => {
      const product = analyticsProductById.get(id);
      return product ? [product] : [];
    })
    .slice(0, CAP);

  const rows = [
    { label: "Signal", items: chain.signals.slice(0, CAP), tone: "" },
    {
      label: "Measurements",
      items: chain.outputs.slice(0, CAP),
      tone: styles.dotMute,
    },
    { label: "Intelligence", items: chain.capabilities.slice(0, CAP), tone: "" },
  ];

  const family =
    source === "cctv" ? styles.famSecure : styles.famCare;

  return (
    <section id="movement-chain" className={`section ${styles.lab} ${family}`}>
      <div className="container-wide">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <Eyebrow>What can movement tell us?</Eyebrow>
            <h2 className="mt-5 max-w-2xl font-display text-display-md text-balance text-soft-white">
              One signal in.{" "}
              <span className="text-gradient">A structured answer out.</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-soft-gray">
              Choose what you can capture and follow it through the platform —
              the signals it carries, the measurements taken, the intelligence
              applied and the modules that use them.
            </p>
          </div>
          {/* The selector is the single most important interaction on the
              home page and it used to read as a row of captions above a
              diagram. It now carries the interaction system's segmented
              treatment, one line of helper copy — because nothing about four
              capitalised words says "these change what is below" — and a
              first-visit ring around the already-chosen input. */}
          <SegmentTabs
            label="Capture input"
            hint="Choose an input to explore"
            cueKey="home-input-selector"
            value={source}
            onChange={(id) => setSource(id as CaptureSource)}
            options={TABS.map((id) => ({
              id,
              label: CAPTURE_SOURCES.find((item) => item.id === id)!.label,
            }))}
          />
        </div>

        <div className={`${styles.panel} mt-8`} aria-live="polite">
          <div className={styles.panelHead}>
            <span className={styles.label}>
              {CAPTURE_SOURCES.find((item) => item.id === source)!.label}
            </span>
            <span className={`${styles.label} ml-auto`}>
              {CAPTURE_SOURCES.find((item) => item.id === source)!.note}
            </span>
          </div>

          {/* Keyed on the source, so choosing an input re-mounts the chain and
              it fades up through `.enter`. That transition is the answer to
              "did my click do anything?" — without it the rows swap contents
              in a single frame and the change is easy to miss entirely. */}
          <div
            key={source}
            className={`${styles.enter} grid gap-px sm:grid-cols-2 lg:grid-cols-4`}
          >
            {rows.map((row) => (
              <div key={row.label} className={styles.column}>
                <div className={styles.columnHead}>
                  <span className={styles.label}>{row.label}</span>
                </div>
                <ul className={styles.list}>
                  {row.items.map((item) => (
                    <li key={item} className={styles.item}>
                      <span
                        aria-hidden="true"
                        className={`${styles.dot} ${row.tone}`}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className={styles.column}>
              <div className={styles.columnHead}>
                <span className={`${styles.label} ${styles.labelAccent}`}>
                  GaitAI modules
                </span>
                <span className={styles.label}>
                  {String(chain.productIds.length).padStart(2, "0")}
                </span>
              </div>
              <div className={`${styles.chips} mt-3`}>
                {modules.map((product) => (
                  <Link
                    key={product.id}
                    href={product.href}
                    className={styles.chip}
                  >
                    {product.short}
                  </Link>
                ))}
              </div>
              {chain.productIds.length > CAP && (
                <p className={`${styles.note} mt-3`}>
                  and {chain.productIds.length - CAP} more on this input.
                </p>
              )}
            </div>
          </div>

          <div className={styles.panelRule} />
          <div className="flex flex-wrap items-center gap-3 px-[1.1rem] py-4">
            <Link href="/movement-lab" className="btn-ghost !px-5 !py-2.5 text-[13px]">
              Explore the intelligence layer →
            </Link>
            <Link href="/gaitscape" className="btn-ghost !px-5 !py-2.5 text-[13px]">
              Open the ecosystem map →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
