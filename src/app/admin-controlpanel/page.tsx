import type { Metadata } from "next";
import { ControlPanel } from "@/components/admin/controlpanel/ControlPanel";

export const metadata: Metadata = {
  title: "Control Panel",
  description: "Manage GaitAI blog stories, publications and community comments.",
  // Never let search engines index the admin surface.
  robots: { index: false, follow: false },
};

export default function AdminControlPanelPage() {
  return <ControlPanel />;
}
