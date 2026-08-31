interface MovementIntelligenceSectionProps {
  id: string;
  eyebrow: string;
  emphasis: string;
  description: string;
}

export function MovementIntelligenceSection({
  id,
  eyebrow,
  emphasis,
  description,
}: MovementIntelligenceSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="relative overflow-hidden border-y border-white/5 bg-obsidian-300/40 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-wide text-center">
        <span className="eyebrow inline-flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-gradient-brand" />
          {eyebrow}
        </span>
        <h2
          id={id}
          className="mx-auto mt-3 max-w-3xl text-balance font-display text-2xl text-soft-white sm:text-3xl"
        >
          Signals GaitAI reads from{" "}
          <span className="text-gradient">{emphasis}</span>
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-balance text-sm leading-relaxed text-soft-mute">
          {description}
        </p>
      </div>
    </section>
  );
}
