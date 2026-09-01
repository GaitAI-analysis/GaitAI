"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
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
        <input
          type="search"
          value={capQuery}
          onChange={(e) => setCapQuery(e.target.value)}
          placeholder="Search capability"
          aria-label="Search capability"
          className="gaitscape-input"
        />
        <input
          type="search"
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          placeholder="Search product"
          aria-label="Search product"
          className="gaitscape-input"
        />
        <select
          value={vertical}
          onChange={(e) => setVertical(e.target.value as "all" | Vertical)}
          aria-label="Filter by vertical"
          className="gaitscape-select"
        >
          <option value="all">All verticals</option>
          <option value="mobilitycare">MobilityCare</option>
          <option value="securevision">SecureVision</option>
        </select>
        <select
          value={domainId}
          onChange={(e) => setDomainId(e.target.value)}
          aria-label="Filter by application domain"
          className="gaitscape-select max-w-[220px]"
        >
          <option value="all">All application domains</option>
          {industryUseCases.map((u) => (
            <option key={u.id} value={u.id}>
              {u.industry}
            </option>
          ))}
        </select>
        <button
          onClick={clear}
          className="text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Clear filters
        </button>
      </div>

      {/* matrix */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-obsidian-300/95 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-soft-mute backdrop-blur">
                Capability
              </th>
              {products.map((p) => (
                <th
                  key={p.id}
                  className="whitespace-nowrap px-2 py-3 text-center align-bottom"
                >
                  <span
                    className={cn(
                      "inline-block text-[10.5px] font-semibold tracking-[0.02em] [writing-mode:vertical-rl] [transform:rotate(180deg)]",
                      p.vertical === "securevision"
                        ? "text-indigo-300/90"
                        : "text-teal-300/90"
                    )}
                  >
                    {p.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capabilities.map((cap, rowIdx) => (
              <tr
                key={cap.id}
                className={cn(rowIdx % 2 === 0 && "bg-white/[0.015]")}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 whitespace-nowrap bg-obsidian-300/95 px-4 py-2 text-[12.5px] font-medium text-soft-white backdrop-blur"
                >
                  {cap.title}
                </th>
                {products.map((p) => {
                  const on = hasCapability(p.id, cap.id);
                  return (
                    <td key={p.id} className="px-2 py-1.5 text-center">
                      {on ? (
                        <button
                          onClick={() =>
                            setOpenCell({ productId: p.id, capabilityId: cap.id })
                          }
                          aria-label={`How ${cap.title} is used in ${p.short}`}
                          className={cn(
                            "grid h-6 w-6 place-items-center rounded-md border transition-colors",
                            p.vertical === "securevision"
                              ? "border-indigo-300/30 bg-indigo-400/10 text-indigo-300 hover:bg-indigo-400/25"
                              : "border-teal-300/30 bg-teal-300/10 text-teal-300 hover:bg-teal-300/25",
                            "mx-auto"
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span
                          aria-hidden="true"
                          className="mx-auto block h-1 w-1 rounded-full bg-white/10"
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-soft-mute">
        {capabilities.length} capabilities × {products.length} products · a
        highlighted cell means the capability is documented in that product.
        Click a cell to see how it is used.
      </p>

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
      { label: "Outcome", value: firstOutcome?.title ?? product.headline },
      ...(evidence ? [{ label: "Documented as", value: evidence }] : []),
    ],
  };
}
