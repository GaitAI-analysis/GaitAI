"use client";

import { useState } from "react";
import type { ProductDetail } from "@/data/product-details";
import { trackInsightEvent } from "@/lib/insight-events";
import { cn } from "@/lib/utils";

type Mode = NonNullable<ProductDetail["modes"]>[number];

/**
 * ONE PRODUCT, THREE CONTEXTS — the service selector on a product page that
 * carries modes (DefenceMotion: Army · Navy · Air Force).
 *
 * A radiogroup of the modes; selecting one changes the drawn scenario, the
 * summary and the focus list. Nothing else on the page changes and there is
 * no separate landing page per service: the modes are configurations of the
 * same movement pipeline and privacy controls, and the section says so.
 *
 * The scenario is line art in the site's own language — a protected
 * perimeter, a walking figure, the signal read from the walk — drawn three
 * ways: an open site, a confined deck, a hangar and apron. No weapon, no
 * vehicle, no camouflage.
 *
 * Analytics: one aggregate event when a mode is selected, keyed by the
 * product and the mode id; nothing about the reader.
 */
export function ServiceModes({
  modes,
  productId,
  accent,
}: {
  modes: Mode[];
  productId: string;
  accent: { text: string; pill: string; dot: string; chip: string };
}) {
  const [active, setActive] = useState(modes[0]?.id ?? "");
  const mode = modes.find((m) => m.id === active) ?? modes[0];
  if (!mode) return null;

  const choose = (id: string) => {
    if (id === active) return;
    setActive(id);
    trackInsightEvent("product_mode_selected", { product: productId, mode: id });
  };

  return (
    <div>
      <p className="text-sm leading-relaxed text-soft-gray sm:text-base">
        One product, configured per service. The modes share the same movement pipeline and privacy
        controls; each names the environments, personnel programmes and access points it is configured
        for.
      </p>

      <div className="mt-5 inline-flex flex-wrap gap-1 rounded-full border border-white/8 bg-white/[0.02] p-1" role="radiogroup" aria-label="Service mode">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={m.id === active}
            onClick={() => choose(m.id)}
            className={cn(
              "touch:min-h-11 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all active:translate-y-px",
              m.id === active
                ? "border-cyan-300/50 bg-cyan-300/[0.10] text-soft-white shadow-[0_0_20px_-6px_rgba(79,209,255,0.45)]"
                : "border-transparent text-soft-gray hover:border-white/15 hover:bg-white/[0.06] hover:text-soft-white",
            )}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className={cn("mt-5 grid gap-5 rounded-2xl border p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-6", accent.chip)}>
        <div className="min-w-0">
          <div className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", accent.text)}>{mode.name} mode</div>
          <p className="mt-2 text-sm leading-relaxed text-soft-gray">{mode.summary}</p>
          <ul className="mt-4 grid gap-2">
            {mode.focus.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13.5px] leading-relaxed text-soft-gray">
                <span aria-hidden className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", accent.dot)} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <figure className="order-first sm:order-none">
          <Scenario mode={mode.id} />
          <figcaption className="mt-2 text-[10.5px] uppercase tracking-[0.16em] text-soft-mute">
            {SCENARIO_CAPTION[mode.id] ?? "Illustrative scenario"}
          </figcaption>
        </figure>
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed text-soft-mute">
        Designed for governed, human-supervised defence applications involving personnel safety, readiness,
        rehabilitation and authorised facility operations. Not designed for autonomous targeting or lethal
        decision-making.
      </p>
    </div>
  );
}

const SCENARIO_CAPTION: Record<string, string> = {
  army: "Open installation · illustrative",
  navy: "Confined deck and gangway · illustrative",
  airforce: "Apron and hangar · illustrative",
};

/* A shield-shaped perimeter, a walking figure and the signal read from the
   walk — drawn three ways. Strokes inherit the section's accent colour. */
function Scenario({ mode }: { mode: string }) {
  return (
    <svg viewBox="0 0 220 160" className="h-auto w-full text-cyan-300" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* ground */}
      <line x1={14} y1={132} x2={206} y2={132} className="opacity-40" strokeDasharray="2 5" />
      {/* perimeter */}
      <path d="M110 18 L166 38 V78 C166 108 144 128 110 140 C76 128 54 108 54 78 V38 Z" className="opacity-45" />
      {mode === "navy" ? (
        <g className="opacity-60">
          {/* confined deck: rails and a ladder */}
          <path d="M62 62 H158 M62 70 H158" />
          <path d="M138 70 V118 M148 70 V118 M138 82 H148 M138 94 H148 M138 106 H148" />
        </g>
      ) : mode === "airforce" ? (
        <g className="opacity-60">
          {/* hangar roof and apron markings */}
          <path d="M66 74 L110 48 L154 74" />
          <path d="M70 118 H92 M104 118 H126 M138 118 H150" strokeDasharray="6 4" />
        </g>
      ) : (
        <g className="opacity-60">
          {/* open site: two low buildings and a track */}
          <path d="M66 96 V78 H84 V96 M136 96 V82 H152 V96" />
          <path d="M60 112 C90 106 130 106 160 112" strokeDasharray="3 5" />
        </g>
      )}
      {/* figure */}
      <g transform="translate(110 96)" strokeWidth={2}>
        <circle cx={0} cy={-32} r={5} />
        <path d="M0 -26 V-6" />
        <path d="M0 -20 L-9 -10 M0 -20 L9 -12" />
        <path d="M0 -6 L-9 14 M0 -6 L9 12" />
        <circle cx={-9} cy={-10} r={1.6} fill="currentColor" stroke="none" />
        <circle cx={9} cy={-12} r={1.6} fill="currentColor" stroke="none" />
        <circle cx={-9} cy={14} r={1.6} fill="currentColor" stroke="none" />
        <circle cx={9} cy={12} r={1.6} fill="currentColor" stroke="none" />
      </g>
      {/* the signal read from the walk */}
      <path d="M172 92 H198 M174 100 H196 M176 108 H192 M178 116 H190" className="opacity-70" />
      <path d="M22 100 C30 92 36 108 44 98 C50 90 56 104 62 96" className="opacity-70" />
    </svg>
  );
}
