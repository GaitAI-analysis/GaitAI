"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { workflowStages } from "@/data/products";
import { useAutoDemonstrate } from "@/lib/useAutoDemonstrate";
import { assetPath } from "@/lib/paths";
import styles from "./howitworks.module.css";

/**
 * THE WORKFLOW - a pipeline you can address, not just scroll past.
 *
 * It was a scroll-driven zigzag: the rail filled as you went by and nothing
 * else ever responded. That communicates progression, which is real, and
 * nothing else - there was no way to ask "what happens at stage 3?" short of
 * scrolling to it.
 *
 * There is now one active index, and four inputs feed it in a fixed order of
 * precedence:
 *
 *   preview  a hover or focus on the rail - look without moving
 *   locked   a click or tap - hold it, and the scroll stops moving it
 *   demo     the one-time demonstration on first view
 *   scroll   the narrative default, which runs whenever nothing is held
 *
 * `preview ?? locked ?? demo ?? scrollStage` is the whole rule, and it is the
 * same shape the movement lenses use. Rail, connector, node, row and video all
 * read that one index, so they cannot drift out of sync with each other.
 *
 * TWO PERMANENT LOOPS REMOVED. A pinging halo on every centre node and a
 * pulsing dot on every video card ran forever, on the home page, on four
 * elements at once, and communicated nothing. The node now states the active
 * stage instead, which is information.
 */

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const stageButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  /* The narrative default, derived from the same progress value that draws
     the rail - so the lit line and the active stage always agree. */
  const [scrollStage, setScrollStage] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(
      workflowStages.length - 1,
      Math.max(0, Math.floor(p * workflowStages.length)),
    );
    setScrollStage((current) => (current === next ? current : next));
  });

  const [locked, setLocked] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);

  const demo = useAutoDemonstrate<HTMLDivElement>({
    steps: workflowStages.length,
    intervalMs: 1000,
    cycles: 1,
    threshold: 0.2,
  });

  const release = demo.stop;
  const active = preview ?? locked ?? demo.index ?? scrollStage;

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      release();
      const step =
        event.key === "ArrowRight" || event.key === "ArrowDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "ArrowUp"
            ? -1
            : 0;
      if (step) {
        event.preventDefault();
        const next =
          (index + step + workflowStages.length) % workflowStages.length;
        stageButtons.current[next]?.focus();
        return;
      }
      if (event.key === "Escape" && locked !== null) {
        event.preventDefault();
        setLocked(null);
      }
    },
    [locked, release],
  );

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

        {/* THE RAIL - the control. Real buttons in a tablist, so a keyboard
            and a touch device reach exactly what a pointer does. */}
        <div
          ref={demo.ref}
          className={styles.rail}
          role="tablist"
          aria-label="Workflow stages"
        >
          {workflowStages.map((stage, i) => (
            <button
              key={stage.step}
              ref={(node) => {
                stageButtons.current[i] = node;
              }}
              type="button"
              role="tab"
              aria-selected={active === i}
              data-active={active === i}
              data-passed={i <= active}
              data-locked={locked === i}
              onPointerEnter={() => {
                release();
                setPreview(i);
              }}
              onPointerLeave={() => setPreview(null)}
              onFocus={() => {
                release();
                setPreview(i);
              }}
              onBlur={() => setPreview(null)}
              onClick={() => {
                release();
                setLocked((current) => (current === i ? null : i));
              }}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={styles.stage}
            >
              <span aria-hidden="true" className={styles.node} />
              <span aria-hidden="true" className={styles.stageIndex}>
                {stage.step}
              </span>
              <span className={styles.stageName}>{stage.title}</span>
            </button>
          ))}
        </div>

        <div ref={ref} className="relative mt-14">
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
                  data-active={active === i}
                  data-dim={active !== i}
                  className={`${styles.row} relative grid items-center gap-8 lg:grid-cols-2`}
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
                  {/* The node states which stage is being read. It used to be
                      a lit dot with a ping animating behind it, forever, on
                      all four rows at once. */}
                  <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
                    <div aria-hidden="true" className={styles.rowNode} />
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
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          demo
        </span>
      </div>
    </div>
  );
}
