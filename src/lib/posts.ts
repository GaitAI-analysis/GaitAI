/* CLIENT-SAFE: types, category meta, pure helpers. No fs / node imports here. */

import type { PostAttachment } from "@/lib/media";

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
  coverImageUrl?: string;
  coverImagePath?: string;
  coverImageAlt?: string;
  coverImageName?: string;
  coverImageSize?: number;
  coverImageWidth?: number;
  coverImageHeight?: number;
  attachments?: PostAttachment[];
  /** Legacy single-attachment fields retained for existing records. */
  attachmentUrl?: string;
  attachmentName?: string;
  externalUrl?: string;
  tags: string[];
  publishedAt: string;
  author: string;
  featured?: boolean;
  /**
   * Public routes are safe-by-default: only records explicitly marked
   * `verified` are rendered. The bundled seed content remains available in
   * the local editorial tools but is not presented as company evidence.
   */
  publicationStatus?: "draft" | "verified";
  /**
   * Optional: when true, the discussion thread on this post is reserved for
   * subscribers. Read by the comment system's subscription gate. Absent on
   * existing posts, so behaviour is unchanged unless explicitly set.
   */
  subscriberOnly?: boolean;
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
