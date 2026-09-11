import { MissionVision } from "@/components/sections/about/MissionVision";
import { MovementMeanings } from "./MovementMeanings";

/**
 * OVERVIEW — the answer to the hero's question, in one section.
 *
 * The hero asks what movement could reveal. This section answers it twice, at
 * two different altitudes: the Motion DNA band states the mission and the
 * vision over one walking signal, and "One movement. Many meanings." makes
 * that signal something you can point at.
 *
 * They are one section rather than two because they are one answer, and
 * because the navigator should offer "Overview" once rather than offering a
 * mission band and a meanings strip as separate destinations a visitor has to
 * choose between.
 */
export function OverviewSection() {
  return (
    <section
      id="overview"
      aria-label="What GaitAI reads in movement"
      className="home-section relative w-full pb-14 sm:pb-16"
    >
      <MissionVision motion="gait" />
      <div className="container-wide">
        <MovementMeanings />
      </div>
    </section>
  );
}
