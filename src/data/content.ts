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

import siteFacts from "@/data/generated/site-facts.json";
const { counts } = siteFacts;

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
        description: "Movement intelligence & personal health records",
      },
      {
        label: "GaitAI Care",
        href: "/gaitai-care",
        description: "Personal & family health records · Web + Android",
      },
      {
        label: "MobilityCare",
        href: "/mobilitycare",
        description: `Clinical movement intelligence · ${counts.mobilitycare}`,
      },
      {
        label: "SecureVision",
        href: "/securevision",
        description: `Privacy-aware movement intelligence · ${counts.securevision}`,
      },
      ...siteFacts.products.filter((p) => p.navigation).map((p) => ({ label: p.label, href: p.href, description: "Governed movement decision support" })),
    ],
  },
  {
    label: "Explore",
    href: "/use-cases",
    children: [
      {
        label: "Use Cases",
        href: "/use-cases",
        description: `${counts.environments} environments and their intended workflows`,
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
  /* The route stays /insights. TWO NAMES, ON PURPOSE: "Blog" is the
     NAVIGATION CATEGORY — the tab, the footer link, the breadcrumb, the back
     links — because it is the word a first-time visitor scans for. "GaitAI
     Insights" is the PUBLICATION a reader arrives at: the masthead, the page
     titles, the social cards and the RSS title. Opening Blog lands on
     "GaitAI Insights · Ideas in motion." Neither word replaces the other.

     Keep the original reading paths in order, with the technical Wiki
     appended after Archive. */
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
      {
        label: "Wiki",
        href: "/insights/wiki",
        description: "Product architecture and technical documentation",
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
  research: { label: "Research collaboration", href: "/#contact" },
  investor: { label: "Investor enquiries", href: "/#contact" },
};

/**
 * Platform counters — every value is derived from a canonical record, so the
 * strip can never drift from the data or assert an unmeasured figure.
 */
export const heroStats = [
  { value: `${counts.productModules}`, label: "Product modules" },
  { value: `${counts.verticals}`, label: "Product families" },
  { value: `${counts.publications}`, label: "Surfaced academic papers" },
  { value: `${counts.patents}`, label: "Granted patents" },
];
