import type { Metadata } from "next";
import { AndroidDownload } from "@/components/apps/AndroidDownload";
import { productApps } from "@/data/product-apps";
import { SITE_URL, SOCIAL_IMAGES, socialCard } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const app = productApps.mobilitycare;
const TITLE = "GaitAI MobilityCare for Android — Download and Subscribe";
const DESCRIPTION = "Download the GaitAI MobilityCare Android app free. WalkScan gait analysis, RehabTrack comparisons, history and reports unlock with a monthly or annual subscription on your GaitAI account.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/mobilitycare/android/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION, path: "/mobilitycare/android/", image: SOCIAL_IMAGES.mobilitycare }),
};

/* The app as a SoftwareApplication. No `offers`: the site's SEO contract
   (scripts/check-seo.mjs) refuses structured-data prices until payments are
   live and the prices are final; the page itself prints the announced plans. */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/mobilitycare/android/#app`,
  name: app.name,
  description: DESCRIPTION,
  url: `${SITE_URL}/mobilitycare/android/`,
  applicationCategory: "HealthApplication",
  operatingSystem: app.android,
  softwareVersion: app.version,
};

export default function MobilityCareAndroidPage() {
  return (
    <>
      <JsonLd data={JSON_LD} />
      <AndroidDownload product="mobilitycare" />
    </>
  );
}
