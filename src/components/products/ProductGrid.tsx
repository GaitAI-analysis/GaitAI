"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  allProducts,
  mobilityProducts,
  secureProducts,
  type GaitProduct,
  type Vertical,
} from "@/data/products";
import { ProductCard } from "./ProductCard";

// ---------------------------------------------------------------------------
// Filters are defined here (inside the client component) because they contain
// predicate functions that cannot cross the Server → Client component
// boundary. The pages just pass a `vertical` string and we look everything
// up here.
// ---------------------------------------------------------------------------

interface FilterDef {
  id: string;
  label: string;
  productIds: string[];
}

const mobilityFilters: FilterDef[] = [
  {
    id: "clinical",
    label: "Clinical",
    productIds: [
      "walkscan",
      "fallrisk",
      "rehabtrack",
      "neuromotion",
      "orthomotion",
    ],
  },
  { id: "sports", label: "Sports", productIds: ["sportsmotion"] },
  {
    id: "elderly",
    label: "Elderly",
    productIds: ["fallrisk", "seniorcare", "watchcare"],
  },
  {
    id: "wearable",
    label: "Wearable",
    productIds: ["watchcare", "remotecare"],
  },
  { id: "pediatric", label: "Pediatric", productIds: ["pediatricmotion"] },
  {
    id: "research",
    label: "Research",
    productIds: ["clinicaltrials", "neuromotion"],
  },
];

const secureFilters: FilterDef[] = [
  {
    id: "anomaly",
    label: "Anomaly",
    productIds: ["suspiciousmotion", "industrialsafety", "campusshield"],
  },
  {
    id: "crowd",
    label: "Crowd",
    productIds: ["crowdsense", "eventshield", "retailguard"],
  },
  {
    id: "investigation",
    label: "Investigation",
    productIds: ["forensicsearch", "reid"],
  },
  { id: "access", label: "Access", productIds: ["accessmotion", "watchlist"] },
  { id: "privacy", label: "Privacy", productIds: ["privacyguard"] },
];

// Cross-vertical filter taxonomy from the brief (Table 5: Products page).
const allFilters: FilterDef[] = [
  {
    id: "healthcare",
    label: "Healthcare",
    productIds: [
      "walkscan",
      "fallrisk",
      "rehabtrack",
      "neuromotion",
      "orthomotion",
      "seniorcare",
      "pediatricmotion",
      "prostheticfit",
      "remotecare",
    ],
  },
  { id: "sports", label: "Sports", productIds: ["sportsmotion"] },
  {
    id: "elderly",
    label: "Elderly Care",
    productIds: ["fallrisk", "seniorcare", "watchcare"],
  },
  {
    id: "wearables",
    label: "Wearables",
    productIds: ["watchcare", "remotecare"],
  },
  {
    id: "security",
    label: "Security",
    productIds: [
      "suspiciousmotion",
      "campusshield",
      "forensicsearch",
      "reid",
      "accessmotion",
      "watchlist",
    ],
  },
  {
    id: "crowd",
    label: "Crowd",
    productIds: ["crowdsense", "eventshield", "retailguard"],
  },
  {
    id: "industrial",
    label: "Industrial",
    productIds: ["industrialsafety"],
  },
  {
    id: "research",
    label: "Research",
    productIds: ["clinicaltrials", "neuromotion"],
  },
  { id: "privacy", label: "Privacy", productIds: ["privacyguard"] },
];

interface ProductGridProps {
  vertical: Vertical | "all";
  initialFilter?: string;
}

export function ProductGrid({ vertical, initialFilter }: ProductGridProps) {
  const products =
    vertical === "mobilitycare"
      ? mobilityProducts
      : vertical === "securevision"
        ? secureProducts
        : allProducts;
  const filters =
    vertical === "mobilitycare"
      ? mobilityFilters
      : vertical === "securevision"
        ? secureFilters
        : allFilters;

  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<string>(initialFilter ?? "all");

  const validIds = useMemo(() => filters.map((f) => f.id), [filters]);
  const fallbackFilter = initialFilter ?? "all";

  // URL is the source of truth for the filter (?filter=<id>): deep links work,
  // and pressing Back after opening a product detail page restores the filter
  // that was active (the browser restores scroll). Written with
  // router.replace so no extra history entries are created.
  const syncFromUrl = useCallback(
    (fromUrl: string | null) => {
      setActive(
        fromUrl && validIds.includes(fromUrl) ? fromUrl : fallbackFilter
      );
    },
    [validIds, fallbackFilter]
  );

  const selectFilter = useCallback(
    (id: string) => {
      setActive(id); // instant UI response
      router.replace(id === "all" ? pathname : `${pathname}?filter=${id}`, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  const filtered = useMemo<GaitProduct[]>(() => {
    if (active === "all") return products;
    const f = filters.find((x) => x.id === active);
    if (!f) return products;
    return products.filter((p) => f.productIds.includes(p.id));
  }, [active, filters, products]);

  return (
    <div>
      {/* Reads ?filter= reactively (initial load, back/forward). Isolated in
          its own Suspense boundary so useSearchParams does not bail the whole
          grid out of the static HTML export. */}
      <Suspense fallback={null}>
        <FilterUrlSync onFilter={syncFromUrl} />
      </Suspense>
      {/* A single-select filter row is a group, and it was an unnamed one —
          nothing told a screen reader that these pills belong together or
          what they act on. */}
      <div
        role="group"
        aria-label="Filter products by capability"
        className="mb-8 flex flex-wrap items-center gap-2 touch:gap-2.5"
      >
        <FilterPill
          label={`All · ${products.length}`}
          active={active === "all"}
          onClick={() => selectFilter("all")}
        />
        {filters.map((f) => {
          const count = products.filter((p) =>
            f.productIds.includes(p.id)
          ).length;
          return (
            <FilterPill
              key={f.id}
              label={`${f.label} · ${count}`}
              active={active === f.id}
              onClick={() => selectFilter(f.id)}
            />
          );
        })}
      </div>

      {/* Plain keyed grid: each ProductCard animates itself in. (An
          AnimatePresence popLayout wrapper here failed to reconcile children
          after browser Back restored the page, leaving the grid stale.) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Null-rendering child that mirrors the ?filter= search param into grid state.
 * useSearchParams is reactive to router navigations (including popstate), so
 * back/forward always restores the right filter.
 */
function FilterUrlSync({ onFilter }: { onFilter: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");
  useEffect(() => {
    onFilter(filter);
  }, [filter, onFilter]);
  return null;
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`relative inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium transition-all active:translate-y-px touch:min-h-10 touch:px-5 ${
        active
          ? "border-cyan-300/60 bg-cyan-300/12 font-semibold text-cyan-200 shadow-[0_0_24px_-6px_rgba(79,209,255,0.5)]"
          : "border-white/8 bg-white/[0.02] text-soft-mute hover:border-white/25 hover:bg-white/[0.06] hover:text-soft-white"
      }`}
    >
      {label}
    </button>
  );
}
