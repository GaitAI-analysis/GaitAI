import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ctas } from "@/data/content";

/**
 * The single footer link source.
 *
 * Every destination here must be a route that exists — the obsolete /about
 * entries were removed with the route, and the Scholar-profile and portfolio
 * links were dropped earlier. /investors is reachable from here rather than
 * from the main navigation, because it is not part of the buyer's path.
 */
const footerLinks = [
  {
    heading: "Platform",
    items: [
      { label: "Product overview", href: "/products" },
      { label: "MobilityCare", href: "/mobilitycare" },
      { label: "SecureVision", href: "/securevision" },
      { label: "GaitScape", href: "/gaitscape" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    heading: "Solutions",
    items: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Hospitals", href: "/use-cases#hospitals" },
      { label: "Sports academies", href: "/use-cases#sports" },
      { label: "Elderly care", href: "/use-cases#elderly" },
      { label: "Smart cities", href: "/use-cases#smartcities" },
    ],
  },
  {
    heading: "Evidence",
    items: [
      { label: "Research", href: "/research" },
      { label: "Publications", href: "/publications" },
      { label: "Journal", href: "/insights" },
      { label: "Responsible AI", href: "/legal/responsible-ai" },
    ],
  },
  {
    heading: "Engage",
    items: [
      { label: ctas.pilot.label, href: ctas.pilot.href },
      { label: "How deployment works", href: "/products#deploy" },
      { label: "Trust Center", href: "/trust" },
      { label: "Security & privacy controls", href: "/legal/security" },
      { label: "Investors & collaboration", href: "/investors" },
      { label: "Contact", href: "/#contact" },
    ],
  },
];

const socials = [
  { icon: Twitter, href: "https://twitter.com/gaitai", label: "Twitter" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/gaitai", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/gaitai", label: "GitHub" },
  { icon: Mail, href: "mailto:hello@gaitai.com", label: "Email" },
];

const legal = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Security", href: "/legal/security" },
  { label: "Responsible AI", href: "/legal/responsible-ai" },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/5 bg-obsidian-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-royal-400/40 to-transparent" />
      <div className="container-wide py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.4fr]">
          <div>
            <Logo variant="wordmark" size="lg" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-soft-mute">
              GaitAI is intelligence in motion — a Human Movement Intelligence
              Platform that turns walking videos, wearable signals and crowd
              movement into healthcare, sports, elderly-care and safety
              insight. Built on 10+ years of founder research experience in
              gait and human movement.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="grid h-9 w-9 place-items-center rounded-full glass transition-all hover:border-cyan-300/40 hover:text-cyan-300 hover:shadow-glow-cyan active:scale-95 touch:h-11 touch:w-11"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerLinks.map((col) => (
              <div key={col.heading}>
                {/* h2, not h4: these sit at the same level as the page's own
                    sections, and jumping h1 → h4 leaves a gap for anyone
                    navigating by headings. */}
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft-white">
                  {col.heading}
                </h2>
                <ul className="mt-5 space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="inline-block text-sm text-soft-mute underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:text-soft-white hover:decoration-cyan-300/60 touch:py-1.5"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="divider mt-16" />

        <div className="mt-8 flex flex-col items-start justify-between gap-4 text-xs text-soft-mute sm:flex-row sm:items-center">
          <p>
            {/* The © glyph doubles as a discreet entrance to the admin panel.
                ::before pads the hit-area outward without moving the glyph. */}
            <Link
              href="/admin-controlpanel"
              aria-label="Admin Control Panel"
              className="relative rounded-sm outline-none before:absolute before:-inset-2 before:content-[''] focus-visible:ring-1 focus-visible:ring-cyan-300/60"
            >
              ©
            </Link>{" "}
            {new Date().getFullYear()} GaitAI · Intelligence in motion. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legal.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:text-soft-white hover:decoration-cyan-300/60"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
