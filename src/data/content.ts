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
   * /research/talks/ sits under /research/. The blog does not: its later feed
   * pages are at /insights/page/2/ and its reading path at
   * /insights/series/<slug>/, neither of which sits under the row that owns
   * it. Listing the prefix here is how "Latest Stories" stays lit on page two
   * without a route being invented to make the URL tree agree with the menu.
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
        // is what the rest of the site and the search palette call it — one
        // public name for one destination. The subtitle names what the page
        // IS — the interactive experiments, including the analyzer and the
        // instruments listed at its foot — so it cannot be confused with the
        // research hub below it.
        label: "Movement Intelligence Lab",
        href: "/movement-lab",
        description: "Interactive movement-analysis experiments",
      },
      {
        // LAST, deliberately: the most specialised item. GaitAI Labs is the
        // gait RESEARCH hub — the gait dataset and the gait biometrics lab —
        // not the experiments, which belong to the Movement Intelligence Lab
        // above. The two subtitles are written to keep that apart.
        label: "GaitAI Labs",
        href: "/labs",
        description: "Gait datasets & biometrics research",
      },
    ],
  },
  /* The route stays /insights. The navbar says "Blog" because it has to fit
     between six other tabs and because it is the word a first-time visitor
     scans for; the page itself carries the fuller "GaitAI · Blog & Updates",
     and the footer, which has the room, says "Blog & Updates" too.

     THE THREE ROWS ARE THE PUBLICATION'S THREE QUESTIONS, in the order a
     reader asks them: what should I read today, where do I begin, and what
     have you published. Each is a different job — that is why they are three
     destinations and not one page with tabs — and putting them in the navbar
     is what removes the need for a second horizontal strip inside the blog
     itself.

     TWO ROWS THAT DO NOT APPEAR, both for the same reason: the menu is for
     destinations a reader chooses between, not an index of every route.

       Topics · /insights/topics/ still exists and is still in the sitemap and
                the command palette, but browsing by subject is what the feed's
                own topic filters are for, one screen below this menu. A fourth
                row for it made the menu longer without making the choice
                easier.
       Series · the one series that exists canonicalises to
                /insights/start-here/, so a row for it would point at the row
                above it. */
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
