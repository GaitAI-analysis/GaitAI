"use client";

import { useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { allProducts, industryUseCases } from "@/data/products";
import {
  nodeById,
  productMapFor,
  systemFactsFor,
} from "@/data/gaitscape/graph";

const MAX_SELECTED = 3;

/**
 * Compare GaitAI systems — pick up to three products and see their signals,
 * capabilities, deployment context and intended outcomes side by side.
 * Every attribute comes from products.ts or the GaitScape mappings.
 */
export function CompareSystems() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const tableRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () =>
      allProducts.filter((p) =>
        `${p.short} ${p.label}`.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [query]
  );

  const toggle = (id: string) => {
    setComparing(false);
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_SELECTED
          ? prev
          : [...prev, id]
    );
  };

  const compareNow = () => {
    setComparing(true);
    requestAnimationFrame(() =>
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    );
  };

  const rows = useMemo(() => {
    if (!comparing) return null;
    const chosen = selected
      .map((id) => allProducts.find((p) => p.id === id)!)
      .filter(Boolean);
    const attr = (
      label: string,
      value: (p: (typeof chosen)[number]) => string
    ) => ({ label, values: chosen.map((p) => value(p)) });

    return {
      products: chosen,
      attributes: [
        attr("Vertical", (p) =>
          p.vertical === "securevision" ? "SecureVision" : "MobilityCare"
        ),
        attr("Primary use case", (p) => p.label),
        attr("Environment", (p) => systemFactsFor(p.id).environment),
        attr("Input", (p) => systemFactsFor(p.id).input),
        attr("Movement signals", (p) =>
          (productMapFor(p.id)?.signals ?? [])
            .map((s) => nodeById.get(s)?.title)
            .filter(Boolean)
            .join(" · ") || "Policy layer — applies across connected analytics"
        ),
        attr("AI capabilities", (p) =>
          (productMapFor(p.id)?.capabilities ?? [])
            .map((c) => nodeById.get(c)?.title)
            .filter(Boolean)
            .join(" · ")
        ),
        attr("Deployment", (p) => systemFactsFor(p.id).deployment),
        attr("Privacy approach", (p) => systemFactsFor(p.id).privacy),
        attr("Output", (p) => p.outputs.join(" · ")),
        attr("Intended users", (p) => p.users.join(" · ")),
        attr("Outcome", (p) =>
          (productMapFor(p.id)?.outcomes ?? [])
            .map((o) => nodeById.get(o)?.title)
            .filter(Boolean)
            .join(" · ") || p.headline
        ),
      ],
    };
  }, [comparing, selected]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products"
          aria-label="Search products"
          className="gaitscape-input"
        />
        <span className="text-xs text-soft-mute" aria-live="polite">
          Selected: {selected.length} of {MAX_SELECTED}
        </span>
        <button
          onClick={compareNow}
          disabled={selected.length < 2}
          className={cn(
            "ml-auto rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all",
            selected.length >= 2
              ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200 hover:bg-cyan-300/[0.16]"
              : "cursor-not-allowed border-white/10 text-soft-mute/60"
          )}
        >
          Compare selected systems
        </button>
      </div>

      {/* selector cards */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((p) => {
          const on = selected.includes(p.id);
          const full = !on && selected.length >= MAX_SELECTED;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              aria-pressed={on}
              disabled={full}
              className={cn(
                "group flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                on
                  ? p.vertical === "securevision"
                    ? "border-indigo-300/45 bg-indigo-400/[0.08]"
                    : "border-teal-300/45 bg-teal-300/[0.07]"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.16]",
                full && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                  on
                    ? p.vertical === "securevision"
                      ? "border-indigo-300/60 bg-indigo-400/30 text-indigo-100"
                      : "border-teal-300/60 bg-teal-300/30 text-teal-100"
                    : "border-white/15 text-transparent"
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-soft-white">
                  {p.short}
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-soft-mute">
                  {p.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* comparison table */}
      {rows && rows.products.length >= 2 && (
        <div ref={tableRef} className="mt-8">
          {/* desktop: table; mobile: stacked cards */}
          <div className="hidden overflow-x-auto rounded-2xl border border-white/[0.08] md:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="w-44 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                    Attribute
                  </th>
                  {rows.products.map((p) => (
                    <th key={p.id} className="px-4 py-3">
                      <span
                        className={cn(
                          "font-display text-base",
                          p.vertical === "securevision"
                            ? "text-indigo-200"
                            : "text-teal-200"
                        )}
                      >
                        {p.short}
                      </span>
                      <span className="block text-[11px] font-normal text-soft-mute">
                        {p.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.attributes.map((row, i) => (
                  <tr
                    key={row.label}
                    className={cn(i % 2 === 0 && "bg-white/[0.015]")}
                  >
                    <th
                      scope="row"
                      className="whitespace-nowrap px-4 py-3 align-top text-[10.5px] font-semibold uppercase tracking-[0.14em] text-soft-mute"
                    >
                      {row.label}
                    </th>
                    {row.values.map((v, j) => (
                      <td
                        key={j}
                        className="px-4 py-3 align-top leading-relaxed text-soft-gray"
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 md:hidden">
            {rows.products.map((p, colIdx) => (
              <section
                key={p.id}
                aria-label={`${p.short} comparison`}
                className="rounded-2xl border border-white/[0.08] bg-obsidian-200/50 p-5"
              >
                <h3
                  className={cn(
                    "font-display text-lg",
                    p.vertical === "securevision"
                      ? "text-indigo-200"
                      : "text-teal-200"
                  )}
                >
                  {p.short}
                </h3>
                <dl className="mt-3 space-y-2.5">
                  {rows.attributes.map((row) => (
                    <div key={row.label}>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-soft-mute">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-[13px] leading-relaxed text-soft-gray">
                        {row.values[colIdx]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
