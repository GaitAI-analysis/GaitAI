"use client";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { AIPipelineDiagram } from "@/components/visuals/AIPipelineDiagram";

export function TechStack() {
  return (
    <section id="technology" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Technology · Modular AI architecture"
          title={
            <>
              A research-grade movement engine built for the{" "}
              <span className="text-gradient">real world.</span>
            </>
          }
          description="MobilityCare and SecureVision share the same modular AI engine — pose estimation, gait feature extraction, sensor fusion, predictive models, anomaly detection, report generation and a privacy-first layer."
        />

        <div className="mt-14">
          <AIPipelineDiagram />
        </div>
      </div>
    </section>
  );
}
