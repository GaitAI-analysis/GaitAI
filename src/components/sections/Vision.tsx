"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Quote } from "lucide-react";

/**
 * The closing statement.
 *
 * Its own `.section` padding put 288px of air around a quote at the end of a
 * page that already ends with the visitor-intent paths and the contact form —
 * three closing gestures in a row, each spaced as though it were the first
 * thing on a page. The spacing is tightened here and nothing else changed: the
 * heading, the quote and the attribution are untouched.
 */
export function Vision() {
  return (
    <section
      id="vision"
      className="relative w-full overflow-hidden py-12 sm:py-14 lg:py-16"
    >
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
          size="lg"
        />

        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-8 max-w-4xl rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent p-7 sm:p-9"
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
              <span className="text-soft-gray">
                To make human movement measurable, meaningful and useful for
                the world.
              </span>{" "}
              <span className="text-soft-white">GaitAI · Philosophy</span>
            </span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
