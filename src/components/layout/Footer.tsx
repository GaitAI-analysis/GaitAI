import Link from "next/link";
import { Github, Linkedin, Mail, Twitter } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const footerLinks = [
  {
    heading: "Platform",
    items: [
      { label: "MobilityCare", href: "/mobilitycare" },
      { label: "SecureVision", href: "/securevision" },
      { label: "All products", href: "/products" },
      { label: "Technology", href: "/#technology" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    heading: "Solutions",
    items: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Healthcare & clinics", href: "/use-cases#hospitals" },
      { label: "Sports academies", href: "/use-cases#sports" },
      { label: "Elderly care", href: "/use-cases#elderly" },
      { label: "Smart cities & campuses", href: "/use-cases#smartcities" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Research", href: "/research" },
      { label: "Publications", href: "/publications" },
      { label: "Contact", href: "/#contact" },
    ],
  },
  {
    heading: "Engage",
    items: [
      { label: "Request a demo", href: "/#contact" },
      { label: "Pilot a vertical", href: "/#contact" },
      { label: "Partnerships", href: "/#contact" },
      { label: "Investors", href: "/about#investors" },
      { label: "Press", href: "/#contact" },
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
              Platform that transforms walking videos, wearable signals and
              crowd movement into healthcare, sports, elderly-care and
              safety insights. Grounded in 10+ years of gait research.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="grid h-9 w-9 place-items-center rounded-full glass transition-all hover:border-cyan-300/40 hover:text-cyan-300 hover:shadow-glow-cyan"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {footerLinks.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft-white">
                  {col.heading}
                </h4>
                <ul className="mt-5 space-y-3">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-soft-mute transition-colors hover:text-soft-white"
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
            © {new Date().getFullYear()} GaitAI · Intelligence in motion. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legal.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="transition-colors hover:text-soft-white"
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
