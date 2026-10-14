import { ScrollClearance } from "@/components/layout/ScrollClearance";
import { MotionBudget } from "@/components/layout/MotionBudget";
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
/* The site's clickable-card language, loaded after globals so it settles
   ties with the Tailwind hover utilities it replaces. Its own file because
   it is one system read by every card, tile, row and menu item — see
   interactions.css. */
import "./interactions.css";
/* The light visual system. Scoped to `:root.light`; loaded last so it settles
   ties with globals.css and interactions.css. */
import "./light-theme.css";
/* The shared UI tokens (`--ui-*`): aliases of the two branches above, for
   module CSS. Every new page styles itself from these — see
   docs/design-system.md. */
import "./design-system.css";
/* The phone and tablet layer: every rule behind a max-width query, loaded
   last so it settles ties with everything above. See mobile.css. */
import "./mobile.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { IntelligenceSearch } from "@/components/search/IntelligenceSearch";
import { LocationTrail } from "@/components/atlas/LocationTrail";
import { AtlasOverlay } from "@/components/atlas/AtlasOverlay";
import { Footer } from "@/components/layout/Footer";
import { LightPointerSpot } from "@/components/layout/LightPointerSpot";
import { PageTransition } from "@/components/layout/PageTransition";
import { AskGaitAI } from "@/components/assistant/AskGaitAI";
import { assetPath } from "@/lib/paths";
import { DEMO_EMAIL, PUBLIC_CONTACT_EMAIL, SUPPORT_EMAIL, socialProfileUrls } from "@/data/contact";
import { JsonLd } from "@/components/seo/JsonLd";
import { ORGANIZATION_ID, SITE_URL, SOCIAL_IMAGES, WEBSITE_ID } from "@/lib/seo";

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
  /*
   * GitHub Pages serves no custom response headers, so the usual
   * Referrer-Policy header is unavailable. Next emits this as
   * <meta name="referrer">, which every current browser honours — outbound
   * clicks to publishers and DOIs now carry the origin, not the full path.
   * The remaining headers (CSP, HSTS, X-Content-Type-Options,
   * Permissions-Policy, frame-ancestors) cannot be set on this host; see
   * docs/security-headers.md for the config to apply if the site moves.
   */
  referrer: "strict-origin-when-cross-origin",
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
  /*
   * NO canonical here. Next INHERITS metadata into every route, so a
   * root-level `alternates.canonical` silently became the canonical URL
   * of every page that did not override it — /mobilitycare/,
   * /securevision/, /gaitscape/, the legal pages and all nine
   * publication records each declared themselves a duplicate of the home
   * page. Each route now states its own; the home page states "/" in
   * app/page.tsx.
   */
  /*
   * SEARCH CONSOLE OWNERSHIP. Google's HTML-tag verification is a
   * <meta name="google-site-verification"> carrying a token that only the
   * Search Console account holder can mint. The token is public by design
   * (it proves nothing except that whoever controls the deploy also holds
   * the account), so it travels as a repository VARIABLE — not a secret —
   * named GOOGLE_SITE_VERIFICATION and reaches the build through
   * deploy.yml. Unset, Next emits no tag at all. See docs/seo.md.
   */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  /*
   * The DEFAULT social card, for routes that state none of their own. Every
   * primary route now builds its own with `socialCard()` (lib/seo.ts), so
   * this is the fallback for legal pages and the like — a 1200×630 brand
   * card rather than the 1254×1254 logo PNG, which cropped badly in every
   * link preview and weighed 580 KB.
   *
   * NO `url` HERE, for the same reason there is no canonical: it inherits.
   * With `url: "/"` every route that did not override it — the legal pages,
   * the publications, /research/, /investors/ — told every social network
   * it was the home page.
   */
  openGraph: {
    type: "website",
    title: "GaitAI — Intelligence in Motion",
    description:
      "AI that understands human movement — for security, healthcare, elderly care and smart environments.",
    siteName: "GaitAI",
    images: [
      {
        url: assetPath(SOCIAL_IMAGES.default.url),
        width: SOCIAL_IMAGES.default.width,
        height: SOCIAL_IMAGES.default.height,
        alt: SOCIAL_IMAGES.default.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GaitAI — Intelligence in Motion",
    description:
      "AI that understands human movement — for security, healthcare, elderly care and smart environments.",
    images: [assetPath(SOCIAL_IMAGES.default.url)],
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
        {/*
         * Organization node only. Every field here is already stated
         * elsewhere on the site — name, site URL, logo, and now the public
         * profiles. No founder, address, rating or employee count is
         * asserted, because none of those is documented in this repository.
         *
         * `sameAs` was previously omitted on the same grounds, but the
         * profiles ARE documented: they are the four routes the footer has
         * always published. They now come from `socialProfiles` in
         * `data/contact.ts`, so the structured data and the visible footer
         * cannot drift apart — which is exactly how the footer came to link
         * a GitHub account that was not the company's.
         */}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                /* A stable id, so the Service, SoftwareApplication and
                   BlogPosting nodes on other routes can name this publisher
                   by reference instead of restating it. */
                "@id": ORGANIZATION_ID,
                name: "GaitAI",
                url: `${SITE_URL}/`,
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/brand/logo-main.png`,
                  width: 1254,
                  height: 1254,
                },
                description:
                  "Research-led AI platform for movement intelligence — AI gait analysis for clinics and elderly care, privacy-aware video analytics for security operations, and a personal health-record app.",
                /* Role mailboxes only (data/contact.ts); never a person's
                   address. */
                email: PUBLIC_CONTACT_EMAIL,
                contactPoint: [
                  { "@type": "ContactPoint", contactType: "customer service", email: PUBLIC_CONTACT_EMAIL },
                  { "@type": "ContactPoint", contactType: "sales", email: DEMO_EMAIL },
                  { "@type": "ContactPoint", contactType: "technical support", email: SUPPORT_EMAIL },
                ],
                sameAs: socialProfileUrls,
              },
              {
                /* The site itself, so Google can show "GaitAI" as the site
                   name rather than a guess from the domain. No SearchAction:
                   the site's search is a command palette, not a URL. */
                "@type": "WebSite",
                "@id": WEBSITE_ID,
                name: "GaitAI",
                url: `${SITE_URL}/`,
                publisher: { "@id": ORGANIZATION_ID },
                inLanguage: "en",
              },
            ],
          }}
        />
        <Providers>
          <div className="relative min-h-screen">
            <a href="#main-content" className="skip-link">Skip to content</a>
            <Navbar />
            <ScrollClearance />
            <MotionBudget />
            {/* Light mode's pointer highlight: one passive listener that writes
                two custom properties on the card under the pointer. Renders
                nothing. */}
            <LightPointerSpot />
            {/* Cmd/Ctrl + K over the whole site. Mounted once at the root and
                renders nothing until opened, so it costs one keydown listener
                and no markup on any route. */}
            <IntelligenceSearch />
            <main id="main-content" tabIndex={-1} className="site-main relative">
              {/* GaitAI Atlas, level one: a 26px strip saying where this page
                  sits in the site. In the layout rather than on each page so
                  that all ~70 routes — including the fifty generated ones —
                  answer the question the same way, from one tree. */}
              <LocationTrail />
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            {/* Ask GaitAI. Mounted last and positioned fixed, so it overlays
                every route without entering any page's layout. Retrieval runs
                in the tab; prose comes from the Ask GaitAI Worker when one is
                configured, and from the records themselves otherwise. */}
            <AskGaitAI />
            {/* Atlas, level two. Renders nothing until it is opened, so it
                costs one event listener and no markup on any route. */}
            <AtlasOverlay />
          </div>
        </Providers>
      </body>
    </html>
  );
}
