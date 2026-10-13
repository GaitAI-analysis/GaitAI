import type { Metadata } from "next";

/**
 * ONE PLACE FOR THE SITE'S SEARCH AND SOCIAL IDENTITY.
 * =============================================================================
 * Every route used to assemble its own Open Graph block by hand, and most did
 * not: a page without one inherited the root layout's, so /securevision/,
 * /mobilitycare/ and /products/ were all shared on social networks as
 * "GaitAI — Intelligence in Motion" with `og:url` pointing at the home page.
 * The helpers here make the correct card the cheap default.
 *
 *   socialCard()   Open Graph + Twitter for a page, from its title,
 *                  description and canonical path. The image defaults to the
 *                  family card for the route (see SOCIAL_IMAGES).
 *   searchTitle()  Strips a trailing full stop so a headline that ends a
 *                  sentence on the page does not end the <title> with ". |"
 *                  in a results list.
 *   organizationRef / SITE_URL
 *                  The identity every JSON-LD node points back at.
 *
 * NOTHING HERE ASSERTS A FACT THAT IS NOT ALREADY ON THE PAGE. Structured
 * data must be built from the same records the page renders — no ratings,
 * reviews, prices, certifications or customer names exist in this
 * repository, so none may appear in markup.
 */

export const SITE_URL = "https://gaitai.in";
export const SITE_NAME = "GaitAI";

/** The 1200×630 social cards in public/brand/og/. Rendered from the hero
 *  stills the pages already show, so a shared link previews the page it
 *  opens. JPEG, because LinkedIn and several messengers still ignore WebP. */
export const SOCIAL_IMAGES = {
  default: {
    url: "/brand/og/gaitai.jpg",
    width: 1200,
    height: 630,
    alt: "GaitAI — one movement intelligence platform for health, safety and identity",
  },
  securevision: {
    url: "/brand/og/securevision.jpg",
    width: 1200,
    height: 630,
    alt: "GaitAI SecureVision — AI video analytics for security monitoring, crowd analytics and anomaly detection",
  },
  mobilitycare: {
    url: "/brand/og/mobilitycare.jpg",
    width: 1200,
    height: 630,
    alt: "GaitAI MobilityCare — AI gait analysis and clinical mobility assessment",
  },
  products: {
    url: "/brand/og/products.jpg",
    width: 1200,
    height: 630,
    alt: "GaitAI products — MobilityCare, SecureVision and GaitAI Care",
  },
  useCases: {
    url: "/brand/og/use-cases.jpg",
    width: 1200,
    height: 630,
    alt: "GaitAI use cases — clinics, hospitals, elderly care, transport hubs, campuses, industry and events",
  },
  care: {
    url: "/images/gaitai-care/records-light.png",
    width: 1360,
    height: 820,
    alt: "GaitAI Care document library with upload, review filters and health-record navigation, shown with no records.",
  },
} as const;

export type SocialImage = (typeof SOCIAL_IMAGES)[keyof typeof SOCIAL_IMAGES];

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** `trailingSlash: true` — every canonical ends in a slash. */
export function canonicalPath(path: string): string {
  if (path === "/" || path === "") return "/";
  return `${path.replace(/\/+$/, "")}/`;
}

/** A page headline that ends a sentence should not end a <title>. */
export function searchTitle(title: string): string {
  return title.replace(/[.。]\s*$/, "").trim();
}

export function socialCard({
  title,
  description,
  path,
  image = SOCIAL_IMAGES.default,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: SocialImage;
  type?: "website" | "article";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const url = canonicalPath(path);
  return {
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image.url, width: image.width, height: image.height, alt: image.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

/** The Organization node every other JSON-LD node refers to by id, so a
 *  crawler sees one publisher rather than several look-alikes. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const organizationRef = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
} as const;

export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(canonicalPath(item.path)),
    })),
  };
}
