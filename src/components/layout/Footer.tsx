import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Github, Linkedin, Mail } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ctas } from "@/data/content";
import { contact, mailto, socialProfiles } from "@/data/contact";
import { FooterSubscribe } from "@/components/subscribe/FooterSubscribe";

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
    /* Each named environment goes to its own page. These four used to point at
       `/use-cases#hospitals` and the like, but that page carries no such
       anchors, so every one of them silently landed the reader at the top of
       the index — a specific label promising a specific page and delivering a
       generic one. The slugs below are the real routes from
       `usecase-details.ts`. */
    items: [
      { label: "Use cases", href: "/use-cases" },
      { label: "Hospitals", href: "/use-cases/hospitals" },
      { label: "Sports academies", href: "/use-cases/sports-academies" },
      { label: "Elderly care", href: "/use-cases/elderly-care-centers" },
      { label: "Smart cities", href: "/use-cases/smart-cities" },
    ],
  },
  {
    heading: "Evidence",
    items: [
      { label: "Research", href: "/research" },
      { label: "Publications", href: "/publications" },
      { label: "Talks & presentations", href: "/research/talks" },
      { label: "Blog & Updates", href: "/insights" },
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

/**
 * X's own mark, drawn rather than imported: lucide ships a `Twitter` bird and
 * a `X` that is a close cross, and neither is the brand. One path, sized and
 * coloured by the same classes as the lucide glyphs beside it, so the row
 * stays visually uniform.
 */
function XMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/**
 * The order is the order of usefulness to a visitor: the company page first,
 * then the way to reach a person, then the feed, then the code. Labels name
 * the destination rather than the platform ("GaitAI on LinkedIn", not
 * "LinkedIn"), so a screen reader announces whose account it is, and each one
 * doubles as the tooltip.
 */
const socials: Array<{
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  label: string;
}> = [
  {
    icon: Linkedin,
    href: socialProfiles.linkedin,
    label: "GaitAI on LinkedIn",
  },
  { icon: Mail, href: mailto(contact.social), label: "Email GaitAI" },
  { icon: XMark, href: socialProfiles.x, label: "GaitAI on X" },
  /* Was `github.com/gaitai` — a stranger's account. See the note on
     `socialProfiles` for what it is now and why. */
  { icon: Github, href: socialProfiles.github, label: "GaitAI on GitHub" },
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
                  /* Same words as the accessible name, so a pointer and a
                     screen reader are told the same thing. */
                  title={label}
                  /* `mailto:` is deliberately excluded from both: a new tab
                     for a mail client is a blank tab left behind, and `rel`
                     has nothing to protect against on a scheme that opens no
                     document. */
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

        {/* The signup used to sit here on every page, which meant it appeared
            in the least considered place on all seventy of them. It still does
            not: the contact section carries it on the home page, and this one
            renders on the blog family only, where a growing feed keeps pushing
            the in-page block further from the reader. Everywhere else this is
            null. See FooterSubscribe. */}
        <FooterSubscribe />

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
