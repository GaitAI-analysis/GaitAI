import type { Metadata } from "next";
import { PublicationBrowser } from "@/components/insights/PublicationBrowser";
import { InsightsDiscovery } from "@/components/insights/InsightsDiscovery";
import { readPublicationStories } from "@/lib/publication-store";
import styles from "@/components/insights/journal.module.css";

export const metadata: Metadata = {
  title: { absolute: "GaitAI Blog & Updates — Research, Product & Movement Intelligence" },
  description: "Ideas, research, product stories and the latest from GaitAI — movement intelligence, multimodal AI, privacy and the evidence behind it.",
  alternates: {
    canonical: "/insights",
    types: { "application/rss+xml": "/insights/rss.xml" },
  },
  openGraph: {
    type: "website",
    url: "/insights",
    siteName: "GaitAI",
    title: "GaitAI Blog & Updates",
    description: "Ideas, research, product stories and the latest from GaitAI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GaitAI Blog & Updates",
    description: "Ideas, research, product stories and the latest from GaitAI.",
  },
};

export default async function InsightsPage() {
  const stories = await readPublicationStories();
  return (
    <div className={styles.journal}>
      <PublicationBrowser stories={stories} />
      <InsightsDiscovery stories={stories} />
    </div>
  );
}
