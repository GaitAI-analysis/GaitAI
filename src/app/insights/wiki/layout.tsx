import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Wiki",
  description: "Sign in to access the internal GaitAI technical Wiki.",
  robots: { index: false, follow: false },
};

export default function WikiEntryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
