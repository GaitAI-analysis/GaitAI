import type { Metadata } from "next";
import { AndroidDownload } from "@/components/apps/AndroidDownload";
import { productApps } from "@/data/product-apps";
import { SITE_URL, SOCIAL_IMAGES, socialCard } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const app = productApps.mobilitycare;
const TITLE = "GaitAI MobilityCare for Android — Download the APK";
const DESCRIPTION = "Download the GaitAI MobilityCare Android app free: WalkScan gait analysis and RehabTrack comparisons from a phone video, analysed on the device. Version, file size and SHA-256 of the signed APK.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/mobilitycare/download/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION, path: "/mobilitycare/download/", image: SOCIAL_IMAGES.mobilitycare }),
};

/* The app as a SoftwareApplication. No `offers`, ever: plans and prices live
   inside the app only (data/subscriptions.ts). */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/mobilitycare/download/#app`,
  name: app.name,
  description: DESCRIPTION,
  url: `${SITE_URL}/mobilitycare/download/`,
  applicationCategory: "HealthApplication",
  operatingSystem: app.android,
  softwareVersion: app.version,
  fileSize: app.release.bytes ? `${app.release.bytes} bytes` : undefined,
  downloadUrl: app.release.publicApk ?? undefined,
};

export default function MobilityCareDownloadPage() {
  return (
    <>
      <JsonLd data={JSON_LD} />
      <AndroidDownload product="mobilitycare" />
    </>
  );
}
