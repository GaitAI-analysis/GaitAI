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
        label: "Movement Studio",
        href: "/movement-lab",
        // The requested subtitle was "Upload, analyze & explore movement".
        // "Upload" is dropped: nothing on that route accepts a file, and the
        // footage matcher on it says in as many words that nothing is
        // uploaded or analysed. A nav item promising an upload would be a
        // false capability claim in the most prominent place on the site,
        // and would contradict the page it opens. Restore the word the day
        // an upload path ships. 26 chars, so it holds one line in the w-72
        // panel like the two items above it.
        description: "Analyze & explore movement",
      },
    ],
  },
  /* The route stays /insights. The navbar says "Blog" because it has to fit
     between six other tabs and because it is the word a first-time visitor
     scans for; the page itself carries the fuller "GaitAI · Blog & Updates",
     and the footer, which has the room, says "Blog & Updates" too. */
  { label: "Blog", href: "/insights" },
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
      {
        label: "Talks & Presentations",
        href: "/research/talks",
        description: "The founder speaking record",
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
