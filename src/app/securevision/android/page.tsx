import type { Metadata } from "next";
import { AndroidDownload } from "@/components/apps/AndroidDownload";
import { productApps } from "@/data/product-apps";
import { SITE_URL, SOCIAL_IMAGES, socialCard } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const app = productApps.securevision;
const TITLE = "GaitAI SecureVision for Android — Download and Subscribe";
const DESCRIPTION = "Download the GaitAI SecureVision Android app free. CrowdSense counts, zone occupancy and dwell, activity history and reports unlock with a monthly or annual subscription on your GaitAI account.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/securevision/android/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION, path: "/securevision/android/", image: SOCIAL_IMAGES.securevision }),
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/securevision/android/#app`,
  name: app.name,
  description: DESCRIPTION,
  url: `${SITE_URL}/securevision/android/`,
  applicationCategory: "BusinessApplication",
  operatingSystem: app.android,
  softwareVersion: app.version,
};

export default function SecureVisionAndroidPage() {
  return (
    <>
      <JsonLd data={JSON_LD} />
      <AndroidDownload product="securevision" />
    </>
  );
}
