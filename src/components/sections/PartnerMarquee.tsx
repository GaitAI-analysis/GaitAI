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

function Pill({
  label,
  accent,
}: {
  label: string;
  accent: "cyan" | "violet";
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
              label={item}
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
              label={item}
              accent="violet"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
