import type { Metadata } from "next";
import { AndroidDownload } from "@/components/apps/AndroidDownload";
import { productApps } from "@/data/product-apps";
import { SITE_URL, SOCIAL_IMAGES, socialCard } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

const app = productApps.securevision;
const TITLE = "GaitAI SecureVision for Android — Download the APK";
const DESCRIPTION = "Download the GaitAI SecureVision Android app free: CrowdSense counts, zone occupancy and dwell from video, analysed on the device. Version, file size and SHA-256 of the signed APK.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/securevision/download/" },
  ...socialCard({ title: TITLE, description: DESCRIPTION, path: "/securevision/download/", image: SOCIAL_IMAGES.securevision }),
};

/* The app as a SoftwareApplication. No `offers`, ever: plans and prices live
   inside the app only (data/subscriptions.ts). */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE_URL}/securevision/download/#app`,
  name: app.name,
  description: DESCRIPTION,
  url: `${SITE_URL}/securevision/download/`,
  applicationCategory: "BusinessApplication",
  operatingSystem: app.android,
  softwareVersion: app.version,
  fileSize: app.release.bytes ? `${app.release.bytes} bytes` : undefined,
  downloadUrl: app.release.publicApk ?? undefined,
};

export default function SecureVisionDownloadPage() {
  return (
    <>
      <JsonLd data={JSON_LD} />
      <AndroidDownload product="securevision" />
    </>
  );
}
