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
      {
        label: "Movement Intelligence Lab",
        href: "/movement-lab",
        // 40 chars, so it sits on one line in the w-72 panel like the two
        // items above it. The requested wording ran to 61 and wrapped,
        // making this the only two-line row in the menu; "Interactive"
        // also repeated GaitScape's subtitle directly above.
        description: "Movement becoming reportable intelligence",
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
 * The four CTA families the whole site draws from.
 *
 * Every conversion surface belongs to exactly one of these, so a visitor meets
 * four consistent asks instead of eight near-synonyms — "Book a demo", "Talk
 * to us", "Pilot with us", "Start a conversation", "Get in touch", "Discuss a
 * study" were all in use at once. Labels live here so they cannot drift apart
 * again, and each call site imports the family that matches its job:
 *
 *   demo      commercial interest — product, vertical and insight surfaces
 *   pilot     deployment interest — products, use cases, the deploy flow
 *   research  research or clinical collaboration — research, publications
 *   investor  investment interest — the investors route only
 *
 * The contact form exists in exactly one place, the home CTA section
 * (`id="contact"`), which is why every default target is the absolute
 * `/#contact` and not a page-relative `#contact` that resolves to nothing
 * on any other route.
 */
export type CtaFamily = "demo" | "pilot" | "research" | "investor";

export const ctas: Record<CtaFamily, { label: string; href: string }> = {
  demo: { label: "Request a demo", href: "/#contact" },
  pilot: { label: "Discuss a pilot", href: "/#contact" },
  research: { label: "Start a research collaboration", href: "/#contact" },
  investor: { label: "Investor enquiries", href: "/#contact" },
};

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
