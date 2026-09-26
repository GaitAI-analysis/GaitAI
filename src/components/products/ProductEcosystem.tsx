"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MovementEngineCore,
  type EngineFocus,
} from "@/components/visuals/MovementEngineCore";
/**
 * Only the fields this component renders, and all of them serializable.
 * A whole GaitProduct cannot cross the server -> client boundary: its `icon`
 * is a Lucide component function, and React cannot serialize functions into a
 * client component.
 */
export type EcosystemProduct = {
  id: string;
  short: string;
  label: string;
  vertical: string;
  outputs: string[];
};

/**
 * The /products/ ecosystem: one engine, two worlds, then the suites those
 * worlds contain.
 *
 * Hover state is held here rather than inside the visual so that pointing at
 * a world both lights its side of the engine and lifts the matching suite
 * below it — the link the reference implies between the diagram and the
 * catalogue. It is presentation only: nothing here reads or writes product
 * data, and both suites stay fully visible and reachable at all times.
 */

type Suite = {
  key: "care" | "secure";
  eyebrow: string;
  title: string;
  blurb: string;
  href: string;
  hrefLabel: string;
  accent: string;
  products: EcosystemProduct[];
  total: number;
};

function SuiteBlock({
  suite,
  focus,
  onFocus,
}: {
  suite: Suite;
  focus: EngineFocus;
  onFocus: (focus: EngineFocus) => void;
}) {
  const dimmed = focus !== null && focus !== "engine" && focus !== suite.key;

  return (
    <section
      onMouseEnter={() => onFocus(suite.key)}
      onMouseLeave={() => onFocus(null)}
      className={`transition-opacity duration-500 ${dimmed ? "opacity-55" : "opacity-100"}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <span
            className="text-[10.5px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: suite.accent }}
          >
            {suite.eyebrow}
          </span>
          <h2 className="mt-2.5 font-display text-xl text-soft-white sm:text-[1.4rem]">
            {suite.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-soft-mute">
            {suite.blurb}
          </p>
        </div>
        <Link
          href={suite.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors"
          style={{ color: suite.accent }}
        >
          {suite.hrefLabel}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {suite.products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/${product.vertical}/${product.id}/`}
              aria-label={`View product: ${product.short}`}
              /* One anchor, the whole tile, and the shared card treatment —
                 these tiles used to lift 3px on hover with no cue at all, so
                 nothing on them said where they went. */
              className="card-link group flex h-full flex-col rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5"
              style={{ borderLeftColor: suite.accent, borderLeftWidth: 2 }}
            >
              <span
                className="text-[9.5px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: suite.accent }}
              >
                {suite.eyebrow.split(" ")[0]}
              </span>
              <span className="mt-2.5 font-display text-[1.0625rem] leading-snug text-soft-white transition-colors group-hover:text-cyan-200">
                {product.short}
              </span>
              <span className="mt-2 text-[12.5px] leading-relaxed text-soft-mute">
                {product.label}
              </span>
              <span className="mt-4 flex flex-wrap gap-1.5 pt-1">
                {product.outputs.slice(0, 3).map((output) => (
                  <span
                    key={output}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[9.5px] uppercase tracking-[0.12em] text-soft-mute"
                  >
                    {output}
                  </span>
                ))}
              </span>

              <span aria-hidden="true" className="card-cue mt-4">
                View product
                <span className="card-cue-arrow">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[11.5px] text-soft-mute">
        {suite.products.length} of {suite.total} shown ·{" "}
        <Link href={suite.href} className="text-cyan-300 hover:text-cyan-200">
          see the full suite
        </Link>
      </p>
    </section>
  );
}

export function ProductEcosystem({
  careProducts,
  secureProducts,
  careTotal,
  secureTotal,
}: {
  careProducts: EcosystemProduct[];
  secureProducts: EcosystemProduct[];
  careTotal: number;
  secureTotal: number;
}) {
  const [focus, setFocus] = useState<EngineFocus>(null);

  const suites: Suite[] = [
    {
      key: "care",
      eyebrow: "MobilityCare suite",
      title: "Clinical & human-mobility intelligence",
      blurb:
        "Gait assessment, fall-risk screening, rehabilitation monitoring, neurological and orthopedic movement tracking, sports movement and wearable mobility.",
      href: "/mobilitycare",
      hrefLabel: "View all MobilityCare",
      /* The accent travels as a CSS variable, not a hex, because it is
         applied through inline `style` — and an inline hex is the one thing
         a theme cannot reach. Dark keeps #4fd1ff exactly; the light branch
         deepens it. See SUITE ACCENTS in globals.css. */
      accent: "var(--suite-care-accent)",
      products: careProducts,
      total: careTotal,
    },
    {
      key: "secure",
      eyebrow: "SecureVision suite",
      title: "Privacy-aware movement intelligence for public space",
      blurb:
        "Anomaly detection, crowd flow, worker safety and campus monitoring — plus a separate, governed group for identity and investigation.",
      href: "/securevision",
      hrefLabel: "View all SecureVision",
      accent: "var(--suite-secure-accent)",
      products: secureProducts,
      total: secureTotal,
    },
  ];

  return (
    <>
      {/* The ecosystem itself — a flagship visual, not a diagram in a corner. */}
      <div className="mt-12 sm:mt-14">
        <div className="mx-auto w-full max-w-[1180px]">
          <MovementEngineCore focus={focus} onFocus={setFocus} />
          <MovementEngineCore variant="stacked" focus={focus} onFocus={setFocus} />
        </div>
      </div>

      <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20">
        {suites.map((suite) => (
          <SuiteBlock
            key={suite.key}
            suite={suite}
            focus={focus}
            onFocus={setFocus}
          />
        ))}
      </div>
    </>
  );
}
