"use client";

import {
  Activity,
  AlertTriangle,
  Brain,
  Cpu,
  Eye,
  Fingerprint,
  Footprints,
  HeartPulse,
  Layers,
  MoveHorizontal,
  Network,
  Scale,
  ShieldCheck,
  Timer,
  TrendingDown,
  TrendingUp,
  Waves,
} from "lucide-react";

/* Signals GaitAI extracts from human movement.
   Two rows — top scrolls left, bottom scrolls right — for cinematic density. */

const rowOne = [
  { icon: AlertTriangle, label: "Fall-risk prediction" },
  { icon: Fingerprint, label: "Gait identity" },
  { icon: Footprints, label: "Stride variability" },
  { icon: Scale, label: "Balance & postural sway" },
  { icon: Timer, label: "Cadence & rhythm" },
  { icon: MoveHorizontal, label: "Step symmetry" },
  { icon: TrendingDown, label: "Mobility decline" },
  { icon: TrendingUp, label: "Rehabilitation progress" },
  { icon: Waves, label: "Tremor detection" },
];

const rowTwo = [
  { icon: Layers, label: "Pose estimation" },
  { icon: Brain, label: "Neurological signals" },
  { icon: Network, label: "Multimodal sensor fusion" },
  { icon: Cpu, label: "Edge inference" },
  { icon: ShieldCheck, label: "Privacy-by-design" },
  { icon: Eye, label: "Explainable AI" },
  { icon: Activity, label: "Movement biometrics" },
  { icon: HeartPulse, label: "Vital movement insight" },
];

function Pill({
  Icon,
  label,
  accent,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent: "cyan" | "violet";
}) {
  const ring =
    accent === "cyan"
      ? "ring-cyan-300/20 group-hover:ring-cyan-300/45"
      : "ring-violet-300/20 group-hover:ring-violet-300/45";
  const iconBg =
    accent === "cyan"
      ? "from-royal-400/15 to-cyan-300/10 text-cyan-300"
      : "from-violet-400/15 to-cyan-300/10 text-violet-300";

  return (
    <div
      className={`group inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.02] px-4 py-2 ring-1 ${ring} transition-colors hover:bg-white/[0.04]`}
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${iconBg}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="whitespace-nowrap text-sm font-medium text-soft-white">
        {label}
      </span>
      <span className="ml-1 inline-block h-1 w-1 rounded-full bg-soft-mute/60 group-hover:bg-cyan-300" />
    </div>
  );
}

export function PartnerMarquee() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-obsidian-300/40 py-14">
      <div className="container-wide mb-8 text-center">
        <span className="eyebrow inline-flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-gradient-brand" />
          Movement intelligence
        </span>
        <h3 className="mt-3 font-display text-2xl text-soft-white sm:text-3xl">
          Signals GaitAI reads from{" "}
          <span className="text-gradient">every step.</span>
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-soft-mute">
          From identity to balance to neurological change — a few of the
          movement signatures our platform turns into actionable insight.
        </p>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative overflow-hidden mask-fade-r">
        <div className="flex w-max animate-marquee gap-3 px-4">
          {[...rowOne, ...rowOne].map((item, i) => (
            <Pill
              key={`r1-${i}`}
              Icon={item.icon}
              label={item.label}
              accent="cyan"
            />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right (reverse) */}
      <div className="relative mt-3 overflow-hidden mask-fade-r">
        <div
          className="flex w-max animate-marquee gap-3 px-4"
          style={{ animationDirection: "reverse", animationDuration: "36s" }}
        >
          {[...rowTwo, ...rowTwo].map((item, i) => (
            <Pill
              key={`r2-${i}`}
              Icon={item.icon}
              label={item.label}
              accent="violet"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
