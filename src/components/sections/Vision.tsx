import { SectionHeading } from "@/components/ui/SectionHeading";

export function Vision() {
  return (
    <section id="vision" className="section relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-50" />
      <div className="container-wide">
        <SectionHeading
          eyebrow="Our vision"
          title={
            <>
              AI as a{" "}
              <span className="text-gradient">silent guardian</span> for human
              safety, health and identity.
            </>
          }
          description="GaitAI exists for a future where AI doesn’t only respond after something goes wrong, but quietly helps predict, prevent and protect — before it does."
        />
      </div>
    </section>
  );
}
