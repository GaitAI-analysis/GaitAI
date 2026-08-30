import { Quote } from "lucide-react";

/**
 * Mission quote card — the GaitAI philosophy statement.
 * Rendered inside the AboutMission section on /about and the home page.
 */
export function AboutPhilosophy() {
  return (
    <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 sm:p-10">
      <Quote className="h-8 w-8 text-cyan-300" />
      <blockquote className="mt-4 font-display text-xl leading-relaxed text-soft-white sm:text-2xl">
        &ldquo;Walking is more than motion. It is a{" "}
        <span className="text-gradient">signature</span>. It is a{" "}
        <span className="text-gradient">health indicator</span>. It is a{" "}
        <span className="text-gradient">safety signal</span>. It is a{" "}
        <span className="text-gradient">biometric identity</span>. It is a story
        of the human body.&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 text-sm text-soft-mute">
        <span className="h-px w-10 bg-cyan-300/60" />
        GaitAI · Philosophy
      </figcaption>
    </div>
  );
}
