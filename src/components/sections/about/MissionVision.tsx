import { Reveal } from "@/components/ui/Reveal";

/**
 * Mission & vision statement pair. Shared by /about and the home page.
 */
export function MissionVision() {
  return (
    <section
      aria-label="Mission and vision"
      className="mission-vision-section relative isolate overflow-hidden border-y border-white/[0.06] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="mission-vision-effects pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="mission-vision-ambient">
          <span className="mission-vision-glow mission-vision-glow--cyan" />
          <span className="mission-vision-glow mission-vision-glow--violet" />
        </div>
        <div className="mission-vision-grid" />
        <div className="mission-vision-network" />
        <div className="mission-vision-sweep" />
      </div>

      <div className="container-wide relative z-10">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal className="mission-vision-card-aura mission-vision-card-aura--cyan h-full">
            <article className="mission-vision-card relative z-10 h-full overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-b from-cyan-300/[0.04] to-transparent p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Mission
              </div>
              <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                To turn human movement into actionable intelligence that
                improves mobility, performance, safety and security.
              </p>
            </article>
          </Reveal>

          <Reveal
            delay={0.08}
            className="mission-vision-card-aura mission-vision-card-aura--violet h-full"
          >
            <article className="mission-vision-card relative z-10 h-full overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-b from-violet-300/[0.04] to-transparent p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                Vision
              </div>
              <p className="mt-5 font-display text-2xl leading-snug text-balance text-soft-white sm:text-3xl">
                To make movement intelligence a trusted layer of
                decision-making across healthcare, sports, enterprise and
                public-safety environments.
              </p>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
