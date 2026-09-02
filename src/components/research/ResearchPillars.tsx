import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { researchAreas } from "@/data/evidence";
import { aiCapabilities } from "@/data/taxonomy";
import styles from "./research.module.css";

/**
 * "What this research enables" — the scannable answer, where the evidence map
 * below is the traceable one.
 *
 * Entirely derived, which is what makes the visual accent worth having. A
 * capability that a research area maps to gets cyan bars, one per backing
 * record; a capability the published record does not reach gets a single
 * violet bar and sits in the second group. So the difference between "this
 * rests on published work" and "this is platform architecture" is visible
 * before a word is read — and the page never has to imply the second kind is
 * the first.
 *
 * Nothing is hand-listed: add a research node or a capability to the graph and
 * it appears in the right group on its own.
 */

const SIGNAL_BARS = 6;

type Pillar = {
  id: string;
  title: string;
  description: string;
  /** Distinct records reaching this capability through its research areas. */
  records: number;
  /** Research areas that map to it. */
  areas: string[];
};

const pillars = (() => {
  const backed = new Map<string, Pillar>();

  for (const area of researchAreas) {
    for (const capability of area.capabilities) {
      const entry: Pillar =
        backed.get(capability.id) ?? {
          id: capability.id,
          title: capability.title,
          description: capability.description,
          records: 0,
          areas: [],
        };
      // Records are counted distinctly: two areas can cite the same paper.
      entry.areas.push(area.title);
      backed.set(capability.id, entry);
    }
  }

  // Second pass for distinct record counts per capability.
  for (const [id, entry] of backed) {
    const ids = new Set<string>();
    for (const area of researchAreas) {
      if (!area.capabilities.some((c) => c.id === id)) continue;
      for (const publication of area.publications) ids.add(publication.id);
    }
    entry.records = ids.size;
  }

  const grounded = Array.from(backed.values()).sort(
    (a, b) => b.records - a.records,
  );
  const architectural = aiCapabilities.filter((c) => !backed.has(c.id));

  return { grounded, architectural };
})();

function SignalBars({ lit, tone }: { lit: number; tone: "cyan" | "arch" }) {
  return (
    <span aria-hidden="true" className={styles.pillarSignal}>
      {Array.from({ length: SIGNAL_BARS }, (_, i) => {
        const on = i < lit;
        return (
          <span
            key={i}
            className={`${styles.pillarBar} ${
              on
                ? tone === "cyan"
                  ? styles.pillarBarLit
                  : styles.pillarBarArch
                : ""
            }`}
            style={{ height: `${5 + i * 1.4}px` }}
          />
        );
      })}
    </span>
  );
}

export function ResearchPillars() {
  return (
    <section
      id="enables"
      className="section relative overflow-hidden bg-obsidian-300/25"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-64 w-[900px] -translate-x-1/2 rounded-full bg-radial-cyan opacity-20 blur-3xl" />
      </div>

      <div className="container-wide">
        <SectionHeading
          eyebrow="What this research enables"
          title={
            <>
              {pillars.grounded.length} capabilities the published record{" "}
              <span className="text-gradient">actually reaches.</span>
            </>
          }
          description="Each capability below is mapped to at least one research area, and its signal bars are the number of records behind it. The platform's remaining capabilities are listed after them, separately, because the record does not reach those."
          align="left"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.grounded.map((pillar, i) => (
            <Reveal key={pillar.id} delay={(i % 3) * 0.06}>
              <article className={styles.pillar}>
                <div className="flex items-start justify-between gap-4">
                  <SignalBars
                    lit={Math.min(SIGNAL_BARS, pillar.records)}
                    tone="cyan"
                  />
                  <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan-300/70">
                    {pillar.records}{" "}
                    {pillar.records === 1 ? "record" : "records"}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-[1.1875rem] leading-snug text-soft-white">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-soft-mute">
                  {pillar.description}
                </p>

                <p className="mt-4 border-t border-white/[0.07] pt-3.5 text-[11.5px] leading-relaxed text-soft-mute/85">
                  From{" "}
                  <span className="text-soft-gray">
                    {Array.from(new Set(pillar.areas)).join(" · ")}
                  </span>
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* The other side of the same fact, stated rather than implied. */}
        {pillars.architectural.length > 0 && (
          <Reveal>
            <div className="mt-10 rounded-2xl border border-violet-300/15 bg-violet-300/[0.03] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <SignalBars lit={1} tone="arch" />
                <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Platform architecture · not covered by the record
                </h3>
              </div>
              <p className="mt-3 max-w-3xl text-[13.5px] leading-relaxed text-soft-mute">
                These {pillars.architectural.length} capabilities are how the
                platform is built, not findings from published work. They carry
                no research record behind them, and nothing on this page should
                be read as validating them.
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {pillars.architectural.map((capability) => (
                  <li key={capability.id}>
                    <span
                      className={`${styles.pill} text-[11.5px] font-medium`}
                      title={capability.shortDescription}
                    >
                      {capability.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
