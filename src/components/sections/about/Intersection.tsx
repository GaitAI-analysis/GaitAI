import { Reveal } from "@/components/ui/Reveal";

/**
 * "The intersection" callout — rendered at the end of the WhoWeServe
 * section on /about and the home page.
 */
export function Intersection() {
  return (
    <Reveal delay={0.2}>
      <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-300/8 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            The intersection
          </span>
        </div>
        <p className="mt-4 font-display text-xl leading-relaxed text-soft-white sm:text-2xl">
          GaitAI stands at the intersection of{" "}
          <span className="text-gradient">healthcare, biometrics, surveillance, rehabilitation, sports science and artificial intelligence</span>
          {" "}— a modular Movement Intelligence Platform for human movement
          analytics.
        </p>
      </div>
    </Reveal>
  );
}
