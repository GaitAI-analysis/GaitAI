import Link from "next/link";
import { Github, Linkedin, Twitter, Mail } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const footerLinks = [
  {
    heading: "Platform",
    items: [
      { label: "GaitAI Secure", href: "#secure" },
      { label: "GaitAI Care", href: "#care" },
      { label: "How it works", href: "#how" },
      { label: "Use cases", href: "#use-cases" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "Vision", href: "#vision" },
      { label: "Research", href: "#" },
      { label: "Publications", href: "/publications" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    heading: "Contact",
    items: [
      { label: "Request a demo", href: "#contact" },
      { label: "Investors", href: "#contact" },
      { label: "Partnerships", href: "#contact" },
      { label: "Press", href: "#contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/5 bg-obsidian-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-royal-400/40 to-transparent" />
      <div className="container-wide py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo variant="wordmark" size="lg" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-soft-mute">
              GaitAI is intelligence in motion — a research-led AI platform that
              understands how humans move, to protect safety, support health and
              improve lives.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Github, href: "#", label: "GitHub" },
                { icon: Mail, href: "mailto:hello@gaitai.com", label: "Email" },
              ].map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full glass transition-all hover:border-cyan-300/40 hover:text-cyan-300 hover:shadow-glow-cyan"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
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
            © {new Date().getFullYear()} GaitAI. Intelligence in motion. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-soft-white">Privacy</Link>
            <Link href="#" className="hover:text-soft-white">Terms</Link>
            <Link href="#" className="hover:text-soft-white">Security</Link>
            <Link href="#" className="hover:text-soft-white">Compliance</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
