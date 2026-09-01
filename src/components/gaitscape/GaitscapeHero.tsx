import { allProducts } from "@/data/products";
import { Reveal } from "@/components/ui/Reveal";

/**
 * GaitScape hero — a premium introduction with real platform stats and a
 * lightweight decorative transition: an abstract gait signal on the left
 * that dissolves into landscape nodes and relationships toward the right,
 * foreshadowing the interactive map below. Pure SVG, no WebGL.
 */
export function GaitscapeHero() {
  const stats = [
    { value: String(allProducts.length), label: "Products" },
    { value: "2", label: "Core verticals" },
    { value: "10+", label: "Years of gait research" },
  ];

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] pb-14 pt-8 sm:pb-16 sm:pt-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 30% 20%, rgb(79 209 255 / 0.07), transparent 70%), radial-gradient(ellipse 45% 40% at 80% 70%, rgb(124 58 237 / 0.08), transparent 70%)",
        }}
      />
      <div className="container-wide relative">
        <Reveal>
          <span className="eyebrow">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            Interactive human movement intelligence map
          </span>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mt-5 max-w-3xl font-display text-display-xl text-balance text-soft-white">
            Explore the GaitAI{" "}
            <span className="text-gradient">intelligence landscape.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-soft-gray sm:text-lg">
            See how movement signals, AI capabilities, research and products
            connect across healthcare, mobility, safety and secure
            environments.
          </p>
          <p className="mt-3 text-[13px] uppercase tracking-[0.16em] text-soft-mute">
            One movement-intelligence layer · Multiple real-world outcomes
          </p>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="mt-8 flex flex-wrap gap-8 sm:gap-14">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="stat-num text-3xl text-soft-white sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft-mute">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* signal → landscape transition */}
        <Reveal delay={0.22} className="mt-10">
          <svg
            aria-hidden="true"
            viewBox="0 0 1200 110"
            preserveAspectRatio="xMidYMid meet"
            className="block h-16 w-full overflow-visible sm:h-20"
          >
            <defs>
              <linearGradient id="gs-hero-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#4fd1ff" stopOpacity="0.75" />
                <stop offset="0.45" stopColor="#2563ff" stopOpacity="0.6" />
                <stop offset="1" stopColor="#8b5cf6" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            {/* continuous gait trace on the left… */}
            <path
              d="M0 62 H120 C150 62 154 34 178 34 C202 34 208 84 232 84 C256 84 262 48 288 48 H400 C424 48 430 26 452 26 C474 26 480 78 502 78 C524 78 530 55 552 55 H640"
              fill="none"
              stroke="url(#gs-hero-stroke)"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />
            {/* …separates into sampled relationships and nodes on the right */}
            {[
              [700, 55, 760, 30],
              [700, 55, 775, 74],
              [775, 74, 852, 52],
              [760, 30, 852, 52],
              [852, 52, 930, 24],
              [852, 52, 942, 82],
              [930, 24, 1030, 46],
              [942, 82, 1030, 46],
              [1030, 46, 1110, 70],
              [1030, 46, 1122, 22],
            ].map(([x1, y1, x2, y2], i) => (
              <path
                key={i}
                d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 9} ${x2} ${y2}`}
                fill="none"
                stroke="url(#gs-hero-stroke)"
                strokeWidth="1"
                strokeDasharray="2.5 6"
                vectorEffect="non-scaling-stroke"
                opacity="0.6"
              />
            ))}
            {[
              [640, 55, 3, "#4fd1ff"],
              [700, 55, 3.4, "#4fd1ff"],
              [760, 30, 3, "#5eead4"],
              [775, 74, 3, "#38bdf8"],
              [852, 52, 4.4, "#2563ff"],
              [930, 24, 3, "#6d7ef0"],
              [942, 82, 3, "#7fb2f7"],
              [1030, 46, 4, "#7c8ef5"],
              [1110, 70, 3, "#8b5cf6"],
              [1122, 22, 3, "#9fe8c9"],
            ].map(([cx, cy, r, c], i) => (
              <circle
                key={i}
                cx={cx as number}
                cy={cy as number}
                r={r as number}
                fill={c as string}
                fillOpacity="0.28"
                stroke={c as string}
                strokeWidth="1"
              />
            ))}
          </svg>
        </Reveal>
      </div>
    </section>
  );
}
