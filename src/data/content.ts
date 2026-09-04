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
  /**
   * Extra route prefixes this entry owns, for families whose sections do not
   * nest under one another.
   *
   * The navbar decides which submenu row is lit by prefix match, deepest
   * match wins, which is right wherever the URL tree mirrors the menu —
   * /research/talks/ sits under /research/. The blog does not: its topic
   * pages live at /insights/topic/<slug>/ and its later feed pages at
   * /insights/page/2/, neither of which is under the menu row that owns it.
   * Listing the prefix here is how "Topics" stays lit on a topic page without
   * inventing a /insights/topics/<slug>/ route that would compete with the
   * real one for the same content.
   */
  owns?: readonly string[];
  /**
   * Match this entry's own href exactly, never as a prefix.
   *
   * Only "Latest Stories" needs it, and it needs it badly: its href is
   * /insights, which prefixes every article, topic page and archive route in
   * the publication. Without this, opening any article lights "Latest
   * Stories" in the dropdown — telling the reader they are on the feed while
   * they are reading a story. An article lights the Blog tab and no child,
   * which is the honest answer.
   */
  exact?: boolean;
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
        // Named "Movement Studio" for a while. Back to the lab wording, which
        // is what the rest of the site, the Labs index and this menu's fourth
        // item all call it — one public name for one destination. The earlier
        // note about the subtitle still stands and is why it does not say
        // "upload": nothing on that route accepts a file.
        label: "Movement Intelligence Lab",
        href: "/movement-lab",
        description: "See movement become intelligence",
      },
      {
        label: "GaitAI Labs",
        href: "/labs",
        description: "Experimental movement-intelligence experiences",
      },
    ],
  },
  /* The route stays /insights. The navbar says "Blog" because it has to fit
     between six other tabs and because it is the word a first-time visitor
     scans for; the page itself carries the fuller "GaitAI · Blog & Updates",
     and the footer, which has the room, says "Blog & Updates" too.

     THE FOUR ROWS ARE THE PUBLICATION'S FOUR QUESTIONS, in the order a reader
     asks them: what should I read today, where do I begin, what do you write
     about, and what have you published. Each is a different job — that is why
     they are four destinations and not one page with tabs — and putting them
     in the navbar is what removes the need for a second horizontal strip
     inside the blog itself.

     Series has no row deliberately. The one series that exists canonicalises
     to /insights/start-here/, so a "Series" entry would be a fifth row
     pointing at the second one. */
  {
    label: "Blog",
    href: "/insights",
    children: [
      {
        label: "Latest Stories",
        href: "/insights",
        description: "Recent articles, research notes and GaitAI updates",
        exact: true,
        owns: ["/insights/page"],
      },
      {
        label: "GaitAI Foundations",
        href: "/insights/start-here",
        description: "The five ideas behind movement-intelligence thinking",
        owns: ["/insights/series"],
      },
      {
        label: "Topics",
        href: "/insights/topics",
        description: "Browse the writing by subject",
        owns: ["/insights/topic"],
      },
      {
        label: "Archive",
        href: "/insights/archive",
        description: "Everything GaitAI has published",
      },
    ],
  },
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
