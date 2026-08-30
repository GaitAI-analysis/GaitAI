import Link from "next/link";
import { Handshake, Mail } from "lucide-react";

const stages = [
  {
    title: "Where we are",
    desc: "Research-validated platform with two verticals, 23 products, multiple live pilots in healthcare and sports.",
  },
  {
    title: "What we're building",
    desc: "Clinical-grade WalkScan, FallRisk, RehabTrack and WatchCare commercial rollouts. SecureVision public-safety pilots in smart-city and campus environments.",
  },
  {
    title: "Who we want to work with",
    desc: "Deep-tech and healthcare-focused investors, incubators, research grants, and partners with a long view of human-centric AI.",
  },
];

/**
 * Investors & incubation — fundraising stage overview and contact CTA.
 * Shared by /about and the home page.
 */
export function Investors() {
  return (
    <section id="investors" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-400/20 to-cyan-300/10 text-amber-300 ring-1 ring-amber-300/30">
              <Handshake className="h-5 w-5" />
            </span>
            <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
              Investors &amp; incubation
            </div>
            <h2 className="mt-3 font-display text-display-md text-balance text-soft-white">
              We&apos;re raising for the next stage of{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #FBBF24 0%, #D5A021 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                movement intelligence.
              </span>
            </h2>
          </div>
          <div className="space-y-4">
            {stages.map((c) => (
              <div
                key={c.title}
                className="rounded-xl border border-white/8 bg-white/[0.025] p-4"
              >
                <div className="text-sm font-semibold text-soft-white">
                  {c.title}
                </div>
                <div className="mt-1 text-[13px] leading-relaxed text-soft-mute">
                  {c.desc}
                </div>
              </div>
            ))}
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/8 px-4 py-2 text-xs font-semibold text-amber-200 transition-all hover:border-amber-300/60 hover:bg-amber-300/15"
            >
              <Mail className="h-3.5 w-3.5" />
              Talk to us about investment
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
