"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { allProducts, industryUseCases } from "@/data/products";
import {
  gaitscapeRelationships,
  nodeById,
  productMapFor,
} from "@/data/gaitscape/graph";
import type { Vertical } from "@/data/products";

const capabilityIds = [
  "cap-gait",
  "cap-pose",
  "cap-temporal",
  "cap-biometrics",
  "cap-risk",
  "cap-fusion",
  "cap-edge",
  "cap-privacy",
  "cap-explain",
  "cap-har",
  "cap-trajectory",
  "cap-anomaly",
  "cap-reid",
] as const;

type Cell = { productId: string; capabilityId: string };

/**
 * Display-only: split a compound short name ("WalkScan", "IndustrialSafety")
 * into two balanced lines at a CamelCase boundary so product headers stay
 * horizontal instead of rotating 90°. Short names render on one line.
 */
function shortNameLines(short: string): string[] {
  if (short.length <= 7) return [short];
  const parts = short.split(/(?=[A-Z][a-z])/);
  if (parts.length < 2) return [short];
  let line1 = parts[0];
  let i = 1;
  while (i < parts.length - 1 && line1.length + parts[i].length <= short.length / 2) {
    line1 += parts[i];
    i += 1;
  }
  return [line1, parts.slice(i).join("")];
}

/**
 * Capability-to-Product matrix — which movement-analysis capability powers
 * which GaitAI product. Cells come straight from the documented
 * product→capability relationships in the GaitScape graph.
 */
export function CapabilityMatrix() {
  const [capQuery, setCapQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [vertical, setVertical] = useState<"all" | Vertical>("all");
  const [domainId, setDomainId] = useState("all");
  const [openCell, setOpenCell] = useState<Cell | null>(null);
  const [hoverColId, setHoverColId] = useState<string | null>(null);

  const domainProducts = useMemo(() => {
    if (domainId === "all") return null;
    const uc = industryUseCases.find((u) => u.id === domainId);
    return uc ? new Set(uc.productIds) : null;
  }, [domainId]);

  const products = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          (vertical === "all" || p.vertical === vertical) &&
          (!domainProducts || domainProducts.has(p.id)) &&
          p.short.toLowerCase().includes(productQuery.trim().toLowerCase())
      ),
    [vertical, domainProducts, productQuery]
  );

  const capabilities = useMemo(
    () =>
      capabilityIds
        .map((id) => nodeById.get(id)!)
        .filter((c) =>
          c.title.toLowerCase().includes(capQuery.trim().toLowerCase())
        ),
    [capQuery]
  );

  const hasCapability = (productId: string, capabilityId: string) =>
    productMapFor(productId)?.capabilities.includes(capabilityId) ?? false;

  const clear = () => {
    setCapQuery("");
    setProductQuery("");
    setVertical("all");
    setDomainId("all");
    setOpenCell(null);
  };

  const openDetail = openCell ? buildCellDetail(openCell) : null;

  return (
    <div>
      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-[230px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-mute" />
          <input
            type="search"
            value={capQuery}
            onChange={(e) => setCapQuery(e.target.value)}
            placeholder="Search capability"
            aria-label="Search capability"
            className="capmatrix-input capmatrix-input--icon w-full"
          />
        </div>
        <div className="relative w-full sm:w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-mute" />
          <input
            type="search"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Search product"
            aria-label="Search product"
            className="capmatrix-input capmatrix-input--icon w-full"
          />
        </div>
        <div className="relative w-full sm:w-auto">
          <select
            value={vertical}
            onChange={(e) => setVertical(e.target.value as "all" | Vertical)}
            aria-label="Filter by vertical"
            className="capmatrix-select w-full"
          >
            <option value="all">All verticals</option>
            <option value="mobilitycare">MobilityCare</option>
            <option value="securevision">SecureVision</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-mute" />
        </div>
        <div className="relative w-full sm:w-auto sm:max-w-[250px]">
          <select
            value={domainId}
            onChange={(e) => setDomainId(e.target.value)}
            aria-label="Filter by application domain"
            className="capmatrix-select w-full"
          >
            <option value="all">All application domains</option>
            {industryUseCases.map((u) => (
              <option key={u.id} value={u.id}>
                {u.industry}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-mute" />
        </div>
        <button
          onClick={clear}
          className="inline-flex h-[46px] items-center rounded-[14px] border border-soft-white/10 bg-soft-white/[0.03] px-4 text-[12.5px] font-semibold text-cyan-300 transition-colors hover:border-cyan-300/40 hover:text-cyan-200"
        >
          Clear filters
        </button>
      </div>

      {/* matrix */}
      <div className="capmatrix-panel mt-7">
        <div
          className="capmatrix-scroll"
          onMouseLeave={() => setHoverColId(null)}
        >
          <table className="w-full min-w-max border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                <th className="capmatrix-sticky sticky left-0 top-0 z-30 min-w-[210px] border-b border-r px-4 pb-3 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute sm:px-5">
                  Capability
                </th>
                {products.map((p) => {
                  const lines = shortNameLines(p.short);
                  return (
                    <th
                      key={p.id}
                      className={cn(
                        "capmatrix-sticky sticky top-0 z-20 min-w-[60px] border-b px-1.5 pb-2.5 pt-3 text-center align-bottom",
                        hoverColId === p.id && "capmatrix-col-hot"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className="mx-auto mb-1.5 block h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            p.vertical === "securevision" ? "#8b9cf6" : "#5eead4",
                        }}
                      />
                      <span
                        className={cn(
                          "block text-[10px] font-semibold leading-[1.25] tracking-[0.01em]",
                          p.vertical === "securevision"
                            ? "capmatrix-prod--secure"
                            : "capmatrix-prod--care"
                        )}
                      >
                        {lines.map((line, i) => (
                          <span key={i} className="block">
                            {line}
                          </span>
                        ))}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {capabilities.map((cap, rowIdx) => (
                <tr key={cap.id} className="group/row">
                  <th
                    scope="row"
                    className="capmatrix-sticky sticky left-0 z-10 whitespace-nowrap border-r px-4 py-3 text-[13px] font-medium leading-snug text-soft-white transition-colors group-hover/row:text-cyan-100 sm:px-5 sm:text-[13.5px]"
                  >
                    {cap.title}
                  </th>
                  {products.map((p) => {
                    const on = hasCapability(p.id, cap.id);
                    return (
                      <td
                        key={p.id}
                        onMouseEnter={() => setHoverColId(p.id)}
                        className={cn(
                          "border-b border-soft-white/[0.06] px-1.5 py-2 text-center transition-colors",
                          rowIdx % 2 === 0 && "bg-soft-white/[0.03]",
                          "group-hover/row:bg-cyan-300/[0.045]"
                        )}
                      >
                        {on ? (
                          <button
                            onClick={() =>
                              setOpenCell({ productId: p.id, capabilityId: cap.id })
                            }
                            aria-label={`${cap.title} is used by ${p.short} — open details`}
                            className={cn(
                              "capmatrix-check",
                              p.vertical === "securevision"
                                ? "capmatrix-check--secure"
                                : "capmatrix-check--care"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        ) : (
                          <>
                            {/* The dash is decorative, but the CELL still has
                                to say something: with the dash aria-hidden and
                                nothing else in the td, a screen reader
                                announced an empty cell and the absence of the
                                relationship was carried only by a visual
                                mark. */}
                            <span
                              aria-hidden="true"
                              className="capmatrix-dash mx-auto block"
                            />
                            <span className="sr-only">
                              {`${cap.title} is not used by ${p.short}`}
                            </span>
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* footnote strip */}
        <p className="border-t border-soft-white/[0.08] px-4 py-3 text-left text-[12.5px] leading-relaxed text-soft-mute sm:px-5">
          {capabilities.length} capabilities × {products.length} products · a
          highlighted cell means the capability is documented in that product.
          Click a cell to see how it is used.
        </p>
      </div>

      {/* cell detail */}
      {openDetail && (
        <div className="mt-5 rounded-2xl border border-white/10 bg-obsidian-200/80 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
              How this capability is used
            </div>
            <button
              onClick={() => setOpenCell(null)}
              aria-label="Close capability detail"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-soft-mute transition-colors hover:text-soft-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {openDetail.rows.map((row) => (
              <div key={row.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-[13.5px] leading-relaxed text-soft-white">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function buildCellDetail(cell: Cell) {
  const product = allProducts.find((p) => p.id === cell.productId);
  const capability = nodeById.get(cell.capabilityId);
  if (!product || !capability) return null;

  const map = productMapFor(product.id);
  const firstSignal = map?.signals[0] ? nodeById.get(map.signals[0]) : null;
  const firstOutcome = map?.outcomes[0] ? nodeById.get(map.outcomes[0]) : null;
  const domain = industryUseCases.find((u) => u.productIds.includes(product.id));
  const evidence = gaitscapeRelationships.find(
    (r) =>
      r.source === product.id &&
      r.target === capability.id &&
      r.type === "powered-by"
  )?.evidence;

  return {
    rows: [
      { label: "Product", value: `${product.name} — ${product.label}` },
      { label: "Capability", value: `${capability.title}. ${capability.shortDescription}` },
      {
        label: "Application",
        value: domain ? `${domain.industry} — ${domain.outcome}` : product.users.slice(0, 3).join(", "),
      },
      {
        label: "Signal",
        value: firstSignal
          ? `${firstSignal.title} (with ${Math.max(0, (map?.signals.length ?? 1) - 1)} more)`
          : "Applies across all connected camera analytics",
      },
      { label: "Intended outcome", value: firstOutcome?.title ?? product.headline },
      ...(evidence ? [{ label: "Documented as", value: evidence }] : []),
    ],
  };
}
