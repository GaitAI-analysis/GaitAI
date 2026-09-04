/**
 * Optional editorial copy for known topics. Topic existence never comes from
 * this file: filters and routes are generated from story metadata. New topic
 * slugs work immediately and receive humanised labels plus generic copy until
 * an editor chooses to add a richer description here.
 */
export const INSIGHT_TOPIC_CONFIG: Record<
  string,
  { label: string; description: string; priority?: number }
> = {
  "movement-intelligence": {
    label: "Movement intelligence",
    description: "How movement becomes measurable, interpretable signal.",
    priority: 100,
  },
  "responsible-ai": {
    label: "Responsible AI",
    description: "Privacy, governance and the boundaries of movement AI.",
    priority: 90,
  },
  mobility: {
    label: "Mobility",
    description: "Longitudinal movement, ageing and mobility support.",
    priority: 80,
  },
  research: {
    label: "Research",
    description: "Evidence, methods and research translation from GaitAI.",
    priority: 70,
  },
  engineering: {
    label: "Engineering",
    description: "How GaitAI systems, tools and evaluation workflows are built.",
    priority: 50,
  },
  "product-updates": {
    label: "Product updates",
    description: "New capabilities, releases and product decisions at GaitAI.",
    priority: 40,
  },
  "company-news": {
    label: "Company news",
    description: "Announcements, milestones and updates from GaitAI.",
    priority: 30,
  },
};

