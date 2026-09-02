// ============================================================================
// SHARED SITE CHROME CONTENT
// ----------------------------------------------------------------------------
// Navigation hierarchy and the derived platform counters.
//
// This file used to also carry `stats`, `secureFeatures`, `careFeatures`,
// `howItWorks` and `useCases` — unused arrays that duplicated (and in places
// contradicted) the canonical sources in products.ts and publications.ts, and
// that carried unsourced figures. They were removed rather than maintained in
// parallel; products, capabilities, signals, domains and outcomes now come
// from products.ts / gaitscape/graph.ts via src/data/taxonomy.ts, and the
// workflow comes from `workflowStages` in products.ts.
// ============================================================================

import { mobilityProducts, productCount, secureProducts } from "@/data/products";
import { papers } from "@/data/publications";

export interface NavItem {
  label: string;
  href: string;
  /** Short purpose line shown in the desktop dropdown and mobile submenu. */
  description?: string;
  children?: readonly NavItem[];
}

// Shared desktop/mobile navigation hierarchy.
export const navLinks: readonly NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Products",
    href: "/products",
    children: [
      {
        label: "Product Overview",
        href: "/products",
        description: `All ${productCount} modular products`,
      },
      {
        label: "MobilityCare",
        href: "/mobilitycare",
        description: `Clinical movement intelligence · ${mobilityProducts.length}`,
      },
      {
        label: "SecureVision",
        href: "/securevision",
        description: `Privacy-aware movement intelligence · ${secureProducts.length}`,
      },
    ],
  },
  {
    label: "Explore",
    href: "/use-cases",
    children: [
      {
        label: "Use Cases",
        href: "/use-cases",
        description: "Problems, by environment",
      },
      {
        label: "GaitScape",
        href: "/gaitscape",
        description: "Interactive intelligence landscape",
      },
    ],
  },
  { label: "Insights", href: "/insights" },
  {
    label: "Research & IP",
    href: "/research",
    children: [
      {
        label: "Research",
        href: "/research",
        description: "Research areas and their evidence",
      },
      {
        label: "Publications",
        href: "/publications",
        description: "Papers and the granted patent",
      },
    ],
  },
];

/**
 * Platform counters — every value is derived from a canonical record, so the
 * strip can never drift from the data or assert an unmeasured figure.
 */
export const heroStats = [
  { value: `${productCount}`, label: "Modular products" },
  { value: "2", label: "Product verticals" },
  { value: `${papers.length}`, label: "Peer-reviewed papers" },
  { value: "1", label: "Granted patent" },
];
