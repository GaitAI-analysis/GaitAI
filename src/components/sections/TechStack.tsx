"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Binary, Boxes, Camera, Cpu, Network, Shield } from "lucide-react";

const tech = [
  { icon: Camera, name: "Computer Vision", desc: "Edge-grade pose estimation across cameras & depth sensors." },
  { icon: Network, name: "Multimodal Sensors", desc: "Vision, IMU, radar and audio fused for robust signals." },
  { icon: Binary, name: "Gait Biometrics", desc: "Identity-preserving movement signatures, on-device." },
  { icon: Cpu, name: "Realtime Inference", desc: "Sub-40ms predictions on edge, cloud-augmented when needed." },
  { icon: Shield, name: "Privacy by design", desc: "On-device processing, encrypted at rest and in transit." },
  { icon: Boxes, name: "Explainable AI", desc: "Every score has a reason — built for clinicians & operators." },
];

export function TechStack() {
  return (
    <section className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Technology"
          title={
            <>
              A research-grade stack built for the{" "}
              <span className="text-gradient">real world.</span>
            </>
          }
          description="GaitAI sits at the intersection of computer vision, pose estimation, multimodal sensor intelligence, biometrics, medical motion analytics and explainable AI."
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/8 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {tech.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-obsidian-200 p-8 transition-colors hover:bg-obsidian-300"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-royal-400/20 to-violet-400/15 text-cyan-300 ring-1 ring-white/10">
                <t.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg text-soft-white">{t.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-soft-mute">{t.desc}</p>
              <div className="pointer-events-none absolute inset-x-8 bottom-6 h-px scale-x-0 bg-gradient-to-r from-cyan-300 to-violet-400 transition-transform duration-500 group-hover:scale-x-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
