"use client";

/* Signals GaitAI extracts from human movement.
   Two rows — top scrolls left, bottom scrolls right — for cinematic density. */

const rowOne = [
  "Fall-risk prediction",
  "Gait identity",
  "Stride variability",
  "Balance & postural sway",
  "Cadence & rhythm",
  "Step symmetry",
  "Mobility decline",
  "Rehabilitation progress",
  "Tremor detection",
];

const rowTwo = [
  "Pose estimation",
  "Neurological signals",
  "Multimodal sensor fusion",
  "Edge inference",
  "Privacy-by-design",
  "Explainable AI",
  "Movement biometrics",
  "Vital movement insight",
];

type Accent = "cyan" | "violet";

function Pill({
  label,
  accent,
}: {
  label: string;
  accent: Accent;
}) {
  const ring =
    accent === "cyan"
      ? "ring-cyan-300/20 group-hover:ring-cyan-300/45"
      : "ring-violet-300/20 group-hover:ring-violet-300/45";
  return (
    <div
      className={`group inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/[0.02] px-4 py-2 ring-1 ${ring} transition-colors hover:bg-white/[0.04]`}
    >
      <span className="whitespace-nowrap text-sm font-medium text-soft-white">
        {label}
      </span>
    </div>
  );
}

function MarqueeCopy({
  items,
  accent,
  duplicate = false,
}: {
  items: readonly string[];
  accent: Accent;
  duplicate?: boolean;
}) {
  return (
    <div
      aria-hidden={duplicate || undefined}
      className={`flex shrink-0 flex-nowrap items-center gap-3 pr-3 ${
        duplicate
          ? "motion-reduce:hidden"
          : "motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:px-4 motion-reduce:pr-4"
      }`}
    >
      {items.map((item) => (
        <Pill
          key={`${duplicate ? "duplicate" : "primary"}-${item}`}
          label={item}
          accent={accent}
        />
      ))}
    </div>
  );
}

function MarqueeRow({
  items,
  accent,
  reverse = false,
  className = "",
}: {
  items: readonly string[];
  accent: Accent;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`marquee-viewport mask-fade-r relative w-full overflow-hidden ${className}`}
    >
      <div
        className="marquee-track flex w-max flex-nowrap animate-marquee motion-reduce:w-full motion-reduce:animate-none"
        style={
          reverse
            ? { animationDirection: "reverse", animationDuration: "36s" }
            : undefined
        }
      >
        <MarqueeCopy items={items} accent={accent} />
        <MarqueeCopy items={items} accent={accent} duplicate />
      </div>
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
      <MarqueeRow items={rowOne} accent="cyan" />

      {/* Row 2 — scrolls right (reverse) */}
      <MarqueeRow
        items={rowTwo}
        accent="violet"
        reverse
        className="mt-3"
      />
    </section>
  );
}
