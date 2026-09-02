import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/layout/PageTransition";
import { assetPath } from "@/lib/paths";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gaitai.in"),
  title: {
    default: "GaitAI — Intelligence in Motion",
    template: "%s | GaitAI",
  },
  description:
    "GaitAI is a research-led AI platform for movement intelligence — security, healthcare, elderly care and smart environments.",
  keywords: [
    "GaitAI",
    "gait analysis",
    "movement intelligence",
    "biometrics",
    "fall-risk screening",
    "computer vision",
    "pose estimation",
    "AI healthcare",
    "privacy-aware video analytics",
  ],
  authors: [{ name: "GaitAI" }],
  applicationName: "GaitAI",
  icons: {
    icon: [
      { url: assetPath("/favicon.ico"), sizes: "any" },
      { url: assetPath("/favicons/favicon-16x16.png"), type: "image/png", sizes: "16x16" },
      { url: assetPath("/favicons/favicon-32x32.png"), type: "image/png", sizes: "32x32" },
      { url: assetPath("/favicons/favicon-64x64.png"), type: "image/png", sizes: "64x64" },
      { url: assetPath("/favicons/favicon-128x128.png"), type: "image/png", sizes: "128x128" },
      { url: assetPath("/favicons/favicon-256x256.png"), type: "image/png", sizes: "256x256" },
      { url: assetPath("/favicons/favicon-512x512.png"), type: "image/png", sizes: "512x512" },
    ],
    shortcut: [assetPath("/favicon.ico")],
    apple: [
      { url: assetPath("/favicons/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: assetPath("/manifest.webmanifest"),
  openGraph: {
    type: "website",
    title: "GaitAI — Intelligence in Motion",
    description:
      "AI that understands human movement — for security, healthcare, elderly care and smart environments.",
    siteName: "GaitAI",
    images: [
      {
        url: assetPath("/brand/logo-main.png"),
        width: 1254,
        height: 1254,
        alt: "GaitAI — Intelligence in Motion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GaitAI — Intelligence in Motion",
    description:
      "AI that understands human movement — for security, healthcare, elderly care and smart environments.",
    images: [assetPath("/brand/logo-main.png")],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8FC" },
    { media: "(prefers-color-scheme: dark)", color: "#070B14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative min-h-screen">
            <Navbar />
            <main className="site-main relative">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
