import { gaitaiCare as care } from "./gaitai-care";
import type { PublicationStory } from "@/lib/publication";

/**
 * OFFICIAL ANNOUNCEMENTS — the third source of blog stories.
 * =============================================================================
 * Editorial essays live in data/insights.ts and render at /insights/<slug>/;
 * newsroom posts mirror Firestore and render at /publications/<slug>/. An
 * announcement is different from both: its page already exists under the
 * product it announces (the launch of GaitAI Care is /gaitai-care/launch/,
 * in the product's own styling), and that address is the one canonical URL.
 * The record here is how the Insights hub, the archive, the topic pages, the
 * RSS feed and the sitemap learn about it — the page itself is not copied.
 *
 * Two dates, deliberately distinct. `date` is when the article was first
 * published on this site (the commit that created the page, 13 October 2026
 * at 17:48 IST). The product's official launch date is `care.launchDate`,
 * printed on the page as the dateline. Today they fall on the same day; if a
 * later announcement is written after its launch, the two must not be
 * conflated.
 *
 * The cover is the real GaitAI Care screenshot the product page shows (the
 * document library, empty — no patient data), never an illustration.
 */
export const announcements: readonly PublicationStory[] = [
  {
    id: "announcement:gaitai-care-launch",
    slug: "introducing-gaitai-care",
    href: care.launch,
    source: "announcement",
    title: "Introducing GaitAI Care: Your Health Records. Your History. Your Insights.",
    description:
      "GaitAI Research Labs launches GaitAI Care, a personal and family health-record platform for web and Android: medical documents, medicines, vaccinations and a chronological health history in one private place.",
    date: "2026-10-13T17:48:08+05:30",
    updated: "2026-10-13T22:30:00+05:30",
    type: "launch",
    topics: ["product-updates", "company-news"],
    author: "GaitAI Research Labs",
    featured: true,
    coverArtwork: {
      kind: "image",
      src: "/images/gaitai-care/records-light.png",
      alt: "GaitAI Care document library with upload, review filters and health-record navigation, shown with no records.",
      width: 1360,
      height: 820,
    },
    tags: [
      "GaitAI Care",
      "product launch",
      "personal health records",
      "family medical records",
      "medical history organiser",
      "Android health records app",
    ],
    relatedProducts: ["gaitai-care"],
    relatedResearch: [],
    relatedSlugs: [],
  },
];
