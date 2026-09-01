"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Quote } from "lucide-react";

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

        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-16 max-w-4xl rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-10 sm:p-14"
        >
          <Quote className="absolute -top-5 left-8 h-10 w-10 rounded-full bg-obsidian p-2 text-cyan-300 ring-1 ring-cyan-300/30" />
          <blockquote className="font-display text-2xl leading-relaxed text-soft-white sm:text-3xl">
            “Walking is more than motion. It is a{" "}
            <span className="text-gradient">signature</span>. It is a{" "}
            <span className="text-gradient">health indicator</span>. It is a{" "}
            <span className="text-gradient">safety signal</span>. It is a{" "}
            <span className="text-gradient">biometric identity</span>. It is a
            story of the human body.”
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3 text-sm text-soft-mute">
            <span className="h-px w-10 bg-cyan-300/60" />
            <span>
              <span className="text-soft-white">Dr. Anubha Parashar</span> ·
              Founder &amp; CEO, GaitAI ·{" "}
              <span className="text-soft-gray">
                Mission: to make human movement measurable, meaningful and
                useful for the world.
              </span>
            </span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
