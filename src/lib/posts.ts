/* CLIENT-SAFE: types, category meta, pure helpers. No fs / node imports here. */

export type Category =
  | "research"
  | "announcement"
  | "documentation"
  | "approval"
  | "blog"
  | "demo";

export interface Post {
  id: string;
  slug: string;
  title: string;
  category: Category;
  summary: string;
  body: string;
  attachmentUrl?: string;
  attachmentName?: string;
  externalUrl?: string;
  tags: string[];
  publishedAt: string;
  author: string;
  featured?: boolean;
}

export const CATEGORY_META: Record<
  Category,
  { label: string; tone: string; description: string }
> = {
  research: {
    label: "Research",
    tone: "cyan",
    description: "Papers, technical notes & experiments from the GaitAI lab.",
  },
  announcement: {
    label: "Announcement",
    tone: "royal",
    description: "Product launches, partnerships & milestones.",
  },
  documentation: {
    label: "Documentation",
    tone: "violet",
    description: "Guides, SDK references & integration playbooks.",
  },
  approval: {
    label: "Approval",
    tone: "emerald",
    description: "Government, regulatory & certification milestones.",
  },
  blog: {
    label: "Blog",
    tone: "amber",
    description: "Thought leadership from the GaitAI team.",
  },
  demo: {
    label: "Demo",
    tone: "pink",
    description: "Product demos, release videos & showcases.",
  },
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"`’]+/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function generateId(): string {
  return `p_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}
