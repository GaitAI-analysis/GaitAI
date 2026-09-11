import { SectionHeading } from "@/components/ui/SectionHeading";
import { CaptureChainDisclosure } from "./CaptureChainDisclosure";
import { WorkflowJourney } from "./WorkflowJourney";

/**
 * TECHNOLOGY — one section, two questions, two different controls.
 *
 *   HOW DOES IT RUN?      the four-stage journey, clicked through
 *   WHAT COMES OUT?       the capture chain, chosen by what you have
 *
 * They used to be two sections, 3,000px apart in total, each with its own
 * heading and its own section padding. They answer halves of one question, so
 * they are one section now — which also means the navigator has one
 * "Technology" destination rather than two that a visitor would have to guess
 * between.
 *
 * TWO CONTROLS, DELIBERATELY NOT THE SAME ONE. The journey is a stepper: a
 * fixed sequence with a position in it. The chain is a selector: four inputs
 * that are alternatives, not steps. Giving both the same treatment would say
 * they work the same way, and they do not.
 *
 * THE CHAIN IS BEHIND A DISCLOSURE. Unrolled, the two together were a second
 * long document: a stepper that explains the pipeline, and under it a panel
 * that explains the pipeline again from the input end. The chain is the better
 * explanation and the stepper is the one a visitor expects first, so the chain
 * keeps all of its content behind one row that says what is in it.
 *
 * `#movement-chain` stays a real anchor inside the section, because it was one
 * before and things link to it — and arriving on it opens the chain.
 */
export function TechnologySection() {
  return (
    <section
      id="technology"
      aria-label="How GaitAI works"
      className="home-section section bg-obsidian-300/40"
    >
      <div className="container-wide">
        <SectionHeading
          eyebrow="The GaitAI workflow"
          title={
            <>
              Capture movement.{" "}
              <span className="text-gradient">Act on intelligence.</span>
            </>
          }
          description="A four-stage pipeline that turns walking videos, wearable signals and CCTV movement into insight a clinician or operator can review and act on. Open a stage to see what happens in it."
          align="left"
          size="lg"
        />

        <WorkflowJourney />

        <CaptureChainDisclosure />
      </div>
    </section>
  );
}
