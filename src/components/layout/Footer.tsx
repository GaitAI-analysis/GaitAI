import siteFacts from "@/data/generated/site-facts.json";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Github, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { FooterGroup } from "./FooterGroup";
import { ctas } from "@/data/content";
import { BOOK_DEMO_HREF, WHATSAPP_HREF, WHATSAPP_LABEL, contact, directEmails, mailSubjects, mailto, socialProfiles } from "@/data/contact";

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
    heading: "Products",
    items: [
      { label: "Product overview", href: "/products" },
      { label: "GaitAI Care", href: "/gaitai-care/" },
      { label: "MobilityCare", href: "/mobilitycare" },
      { label: "SecureVision", href: "/securevision" },
      ...siteFacts.products.filter((p) => p.navigation),
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
      ...siteFacts.environments.filter((environment) => environment.footer),
    ],
  },
  {
    heading: "Evidence",
    items: [
      { label: "Research", href: "/research" },
      { label: "Publications", href: "/publications" },
      { label: "Talks & presentations", href: "/research/talks" },
      { label: "Blog", href: "/insights" },
      { label: "Wiki", href: "https://gaitai-wiki.gait-ai-founder.workers.dev/insights/wiki" },
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
      { label: "Schedule a Meeting", href: BOOK_DEMO_HREF },
      { label: "Contact", href: "/#contact" },
      /* The one chat route, named in words beside the glyph in the social
         row. `external`: a chat opens in a new tab so the site stays where
         the visitor left it; no other column link carries the flag, so the
         rest of the footer behaves exactly as before. */
      { label: WHATSAPP_LABEL, href: WHATSAPP_HREF, external: true },
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
 * WhatsApp's mark, drawn for the same reason as X's: lucide ships no brand
 * glyph for it, and `MessageCircle` would read as a generic chat bubble next
 * to five recognisable logos. The speech-bubble-and-handset outline, as one
 * filled path at the row's weight.
 */
function WhatsAppMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
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
  { icon: Mail, href: mailto(contact.social, mailSubjects.general), label: "Email GaitAI" },
  /* The second way to reach a person, beside the first. `https://wa.me/…`
     starts with http, so it gets the new tab and `rel` like the profiles. */
  { icon: WhatsAppMark, href: WHATSAPP_HREF, label: WHATSAPP_LABEL },
  { icon: XMark, href: socialProfiles.x, label: "GaitAI on X" },
  /* The talks and lab videos: after the feed, before the code. */
  { icon: Youtube, href: socialProfiles.youtube, label: "GaitAI Research Labs on YouTube" },
  /* The second feed, beside the first. lucide's `Instagram` is the plain
     rounded-square glyph, which sits at the same weight as its neighbours. */
  { icon: Instagram, href: socialProfiles.instagram, label: "GaitAI on Instagram" },
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
      {/* COMPACT BY DESIGN (2026-10-09). At 1920×1080 the footer was 722px —
          two-thirds of the screen — mostly padding (80 + 80), a 64px gap above
          the divider and a stacked email list that made the left column the
          tallest thing in it. Now: 56px above the content, the legal bar ~49px
          below it with 20/24px around its text, emails three across beside the
          wordmark. Phones keep their own spacing in mobile.css (THE FOOTER),
          which is loaded last and overrides these paddings and margins. */}
      <div className="container-wide pb-6 pt-12 sm:pt-14">
        <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_2.4fr] lg:gap-12">
          <div>
            <Logo variant="wordmark" size="lg" className="footer-logo" />
            <p className="mt-4 hidden max-w-md text-sm leading-relaxed text-soft-mute sm:block">
              GaitAI is intelligence in motion — a Human Movement Intelligence
              Platform that turns walking videos, wearable signals and crowd
              movement into healthcare, sports, elderly-care and safety
              insight. Informed by academic research in
              gait and human movement.
            </p>
            {/* The same statement at footer length for a phone: what the
                platform does and what it stands on, in two lines rather than
                the home page's proposition told a second time. */}
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-soft-mute sm:hidden">
              Movement intelligence for healthcare, sports and public safety —
              built on gait research since {siteFacts.academicReferences.researchSince}.
            </p>
            <div className="mt-5 flex items-center gap-2">
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
                  className="grid h-8 w-8 place-items-center rounded-full glass transition-all hover:border-cyan-300/40 hover:text-cyan-300 hover:shadow-glow-cyan active:scale-95 touch:h-11 touch:w-11"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </Link>
              ))}
            </div>

            {/* THE DIRECT ROUTES. Three role mailboxes, labelled by purpose so
                a visitor picks the right inbox without reading the address.
                Text, not icons: the mail glyph above already says "email",
                and three more would make the column a toolbar. Stacked on a
                phone and beside the wordmark from `lg`; three across on a
                tablet and desktop alike (stacked, they made this column the
                footer's tallest by ~120px). `break-all` keeps an address inside
                a narrow phone column instead of pushing the page sideways. */}
            <dl className="footer-emails mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-3 sm:gap-y-0">
              {directEmails.map(({ key, label, address, subject }) => (
                <div key={key} className="min-w-0">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-soft-mute">
                    {label}
                  </dt>
                  <dd className="mt-0.5">
                    <a
                      href={mailto(address, subject)}
                      className="inline-block break-all text-sm text-soft-gray underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:text-soft-white hover:decoration-cyan-300/60 focus-visible:text-soft-white focus-visible:decoration-cyan-300/60 touch:py-1.5"
                    >
                      {address}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-10 lg:grid-cols-4">
            {footerLinks.map((col) => (
              <FooterGroup key={col.heading} heading={col.heading}>
                <ul className="footer-group__list mt-4 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        target={"external" in item && item.external ? "_blank" : undefined}
                        rel={"external" in item && item.external ? "noopener noreferrer" : undefined}
                        className="inline-block text-sm text-soft-mute underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:text-soft-white hover:decoration-cyan-300/60 touch:py-1.5"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterGroup>
            ))}
          </div>
        </div>

        {/* The signup used to sit here, between the link columns and the
            bottom bar — which meant it appeared on all seventy pages, in the
            least considered place on any of them. It now lives under the
            deployment card in the contact section, where a visitor who is not
            ready to ask for a demo is already thinking about GaitAI. One
            instance, not two: see CTA.tsx. */}
        <div className="divider mt-7" />

        <div className="mt-5 flex flex-col items-start justify-between gap-4 text-xs text-soft-mute sm:flex-row sm:items-center">
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
          {/* Room for the Ask GaitAI pill. It is fixed bottom-right and parks
              itself only below 1024px (AskGaitAI.tsx); on desktop it relies
              on the margin outside the content column. Between 1024px and
              ~1560px that margin is narrower than the pill, and with this
              bar now 24px from the bottom the pill sat on "Responsible AI".
              From 1560px the margin is wide enough again. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:pr-32 min-[1560px]:pr-0">
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
