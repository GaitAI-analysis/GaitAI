"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const [active, setActive] = useState<string>(initialFilter ?? "all");

  const filtered = useMemo<GaitProduct[]>(() => {
    if (active === "all") return products;
    const f = filters.find((x) => x.id === active);
    if (!f) return products;
    return products.filter((p) => f.productIds.includes(p.id));
  }, [active, filters, products]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <FilterPill
          label={`All · ${products.length}`}
          active={active === "all"}
          onClick={() => setActive("all")}
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
              onClick={() => setActive(f.id)}
            />
          );
        })}
      </div>

      <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard product={p} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
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
      onClick={onClick}
      className={`relative rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
        active
          ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_-6px_rgba(79,209,255,0.5)]"
          : "border-white/8 bg-white/[0.02] text-soft-mute hover:border-white/20 hover:text-soft-white"
      }`}
    >
      {label}
    </button>
  );
}
