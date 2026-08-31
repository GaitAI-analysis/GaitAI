interface MovementIntelligenceSectionProps {
  id: string;
  eyebrow: string;
  emphasis: string;
  description: string;
  rowOne: readonly string[];
  rowTwo: readonly string[];
}

type Accent = "cyan" | "violet";

function Pill({ label, accent }: { label: string; accent: Accent }) {
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
        {[1, 2, 3].map((copy) => (
          <MarqueeCopy
            key={`duplicate-${copy}`}
            items={items}
            accent={accent}
            duplicate
          />
        ))}
      </div>
    </div>
  );
}

export function MovementIntelligenceSection({
  id,
  eyebrow,
  emphasis,
  description,
  rowOne,
  rowTwo,
}: MovementIntelligenceSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="relative overflow-hidden border-y border-white/5 bg-obsidian-300/40 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-wide mb-8 text-center">
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

      <MarqueeRow items={rowOne} accent="cyan" />
      <MarqueeRow
        items={rowTwo}
        accent="violet"
        reverse
        className="mt-3"
      />
    </section>
  );
}
