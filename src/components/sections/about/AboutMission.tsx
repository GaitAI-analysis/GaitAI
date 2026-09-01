import { Compass } from "lucide-react";
import { AboutPhilosophy } from "./AboutPhilosophy";
import { VisionPillars } from "@/components/sections/VisionPillars";

/**
 * Mission / origin story — how a decade of gait research became GaitAI —
 * followed by the philosophy quote card. Shared by /about and the home page.
 * The home page passes `pillars` to render the Predict / Prevent / Protect
 * cards immediately below the philosophy quote.
 */
export function AboutMission({ pillars = false }: { pillars?: boolean }) {
  return (
    <section className={pillars ? "section !pb-14" : "section"}>
      <div className="container-wide">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-violet-400/15 text-cyan-300 ring-1 ring-white/10">
              <Compass className="h-5 w-5" />
            </span>
            <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Mission
            </div>
            <h2 className="mt-3 font-display text-display-lg text-balance text-soft-white">
              To make human movement{" "}
              <span className="text-gradient">measurable, meaningful and useful</span>{" "}
              for the world.
            </h2>
          </div>
          <div className="space-y-5 text-soft-gray">
            <p className="text-lg leading-relaxed">
              The journey of GaitAI did not begin as a business idea. It began
              as a deep research vision — a belief that the way humans walk,
              move, balance, recover and behave carries powerful information
              about health, identity, safety and quality of life.
            </p>
            <p className="text-base leading-relaxed">
              The foundation was laid in 2014 around gait analysis for
              Parkinson&apos;s disease and the early prediction of
              movement-related disorders. By 2016 the research expanded into
              gait recognition for surveillance and security applications —
              using gait as a non-contact biometric where face, fingerprint or
              iris recognition fall short. Today, that decade of work powers a
              Human Movement Intelligence Platform with two verticals and 23
              modular products.
            </p>
          </div>
        </div>

        {/* Mission quote */}
        <AboutPhilosophy />

        {/* Predict / Prevent / Protect — directly below the philosophy quote */}
        {pillars && <VisionPillars />}
      </div>
    </section>
  );
}
