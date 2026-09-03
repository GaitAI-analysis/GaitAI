"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { workflowStages } from "@/data/products";
import { assetPath } from "@/lib/paths";

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" className="section bg-obsidian-300/40">
      <div className="container-wide">
        <SectionHeading
          eyebrow="The GaitAI workflow"
          title={
            <>
              Capture movement.{" "}
              <span className="text-gradient">Act on intelligence.</span>
            </>
          }
          description="A four-stage pipeline that turns walking videos, wearable signals and CCTV movement into insight a clinician or operator can review and act on."
        />

        <div ref={ref} className="relative mt-20">
          {/* central rail (desktop) */}
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/8 lg:block" />
          <motion.div
            style={{ height: lineHeight }}
            className="pointer-events-none absolute left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-cyan-300 via-royal-400 to-violet-400 shadow-[0_0_20px_rgba(79,209,255,0.6)] lg:block"
          />

          <div className="space-y-16 lg:space-y-28">
            {workflowStages.map((s, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="relative grid items-center gap-8 lg:grid-cols-2"
                >
                  {/* Left content (or stays left on mobile) */}
                  <div className={isLeft ? "lg:pr-16 lg:text-right" : "lg:order-2 lg:pl-16"}>
                    <div className="font-mono text-xs uppercase tracking-[0.2em] text-soft-mute">
                      Stage {s.step}
                    </div>
                    <h3 className="mt-3 font-display text-3xl text-soft-white sm:text-4xl">
                      {s.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-soft-gray sm:text-base lg:max-w-md lg:ml-auto">
                      {isLeft ? <span className="lg:inline-block">{s.desc}</span> : s.desc}
                    </p>
                  </div>

                  {/* Center node (desktop) */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div className="relative">
                      <div className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_16px_#4FD1FF]" />
                      <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-cyan-300/40" />
                    </div>
                  </div>

                  {/* Right visual */}
                  <div className={isLeft ? "" : "lg:order-1"}>
                    <StageVisual index={i} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* One animation per workflow stage, from gaitai_poster_animations.zip.
   Order matches workflowStages: capture → analyze → report → act. */
const STAGE_VIDEOS = [
  "/assets/videos/workflow/stage-01-capture.mp4",
  "/assets/videos/workflow/stage-02-analyze.mp4",
  "/assets/videos/workflow/stage-03-report.mp4",
  "/assets/videos/workflow/stage-04-output.mp4",
];

/**
 * First frame of each stage video, extracted from the video itself, so the
 * card shows its own opening frame rather than nothing.
 *
 * These four videos had no poster at all: the comment below claimed "the
 * poster frame stays" when a play() was rejected, but with no poster there was
 * nothing to stay. Together they are ~140 KB against 5.0 MB of video.
 */
const STAGE_POSTERS = [
  "/assets/videos/workflow/stage-01-capture-poster.jpg",
  "/assets/videos/workflow/stage-02-analyze-poster.jpg",
  "/assets/videos/workflow/stage-03-report-poster.jpg",
  "/assets/videos/workflow/stage-04-output-poster.jpg",
];

function StageVisual({ index }: { index: number }) {
  const reduceMotion = Boolean(useReducedMotion());
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /**
   * Four looping renders sit in this section. Autoplaying all of them on mount
   * downloaded and decoded every one the moment the home page loaded, whether
   * or not the section was ever reached. They now start when the section comes
   * into view and pause when it leaves, so the cost follows attention.
   */
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;
    if (inView) {
      // A rejected play() (autoplay policy, detached element) is not an error
      // worth surfacing — the poster frame stays.
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, reduceMotion]);

  return (
    <div
      ref={wrapRef}
      className="card workflow-stage-card relative h-64 overflow-hidden sm:h-72"
    >
      {/* Reduced-motion users get the poster and never fetch the video:
          `preload="auto"` here used to download the full clip — 5.0 MB across
          the four cards — purely to display a still frame the poster now
          provides for ~35 KB. */}
      <video
        key={reduceMotion ? "still" : "loop"}
        ref={videoRef}
        className="workflow-stage-video"
        muted
        loop
        playsInline
        poster={assetPath(STAGE_POSTERS[index])}
        preload={reduceMotion ? "none" : "metadata"}
        aria-hidden="true"
      >
        {!reduceMotion && (
          <source src={assetPath(STAGE_VIDEOS[index])} type="video/mp4" />
        )}
      </video>
      {/* The dot used to sit next to "active", which reads as a running
          system. These are looping renders illustrating the stage. */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-soft-mute">
        <span>stage_0{index + 1}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          demo
        </span>
      </div>
    </div>
  );
}
