"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Quote } from "lucide-react";

const pillars = [
  {
    title: "Predict",
    desc: "Detect risk before it becomes harm — from a fall, an intrusion, a mobility decline.",
  },
  {
    title: "Prevent",
    desc: "Translate early signals into action — alerts to families, clinicians and operators.",
  },
  {
    title: "Protect",
    desc: "Give every home, hospital and public space an intelligent layer for human safety.",
  },
];

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
            “Every movement tells a story. A walk can reveal identity, balance,
            risk, recovery, weakness, neurological change, or the need for care.
            Our mission is to convert this invisible intelligence into{" "}
            <span className="text-gradient">meaningful AI assistance</span> for
            every home, hospital, airport and city.”
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3 text-sm text-soft-mute">
            <span className="h-px w-10 bg-cyan-300/60" />
            GaitAI · Mission statement
          </figcaption>
        </motion.figure>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-radial-violet opacity-40 blur-2xl" />
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">
                0{i + 1}
              </div>
              <h3 className="mt-3 font-display text-2xl text-soft-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-soft-gray">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
