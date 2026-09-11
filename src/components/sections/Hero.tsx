"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { productCount } from "@/data/products";
import { TryGaitAI } from "@/components/home/TryGaitAI";
import { useEffect, useState } from "react";
import { useVisualBudget } from "@/lib/useVisualBudget";
import { MotionSignature } from "@/components/visuals/MotionSignature";
import { SceneBoundary } from "@/components/three/SceneBoundary";
import living from "./heroLiving.module.css";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
      delay: i * 0.08,
    },
  }),
};

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { ref, eligible, visible } = useVisualBudget();
  const [signatureStage, setSignatureStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const stages = [
    "Human",
    "Pose",
    "Skeleton",
    "Trajectories",
    "Signals",
    "Intelligence",
  ];
  useEffect(() => {
    if (
      reduceMotion ||
      !eligible ||
      !visible ||
      paused ||
      manual ||
      signatureStage >= 5
    )
      return;
    const timer = window.setTimeout(
      () => setSignatureStage((stage) => Math.min(stage + 1, 5)),
      1500,
    );
    return () => window.clearTimeout(timer);
  }, [reduceMotion, eligible, visible, paused, manual, signatureStage]);

  /* What every device without the scene sees: the same Motion DNA, still. */
  const staticSignature = (
    <div aria-hidden="true" className={living.fallback}>
      <MotionSignature stage={2} />
    </div>
  );

  return (
    <section
      ref={ref}
      id="platform"
      aria-labelledby="home-hero-title"
      className="site-viewport-section relative flex w-full items-center overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div className="hero-ambient pointer-events-none absolute inset-0 -z-10" />
      <div className="ring-grid pointer-events-none absolute inset-0 -z-10 opacity-25" />

      {eligible && !reduceMotion ? (
        <SceneBoundary fallback={staticSignature}>
          <div
            aria-hidden="true"
            className="hero-scene-mask pointer-events-none absolute inset-x-0 top-[8%] -z-0 h-[76%] w-full opacity-[0.29]"
          >
            <HeroScene
              running={visible && !paused}
              signatureStage={signatureStage}
            />
          </div>
        </SceneBoundary>
      ) : (
        staticSignature
      )}

      <div className="container-wide relative z-10">
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="show"
          variants={fadeUp}
          className="mx-auto flex max-w-5xl flex-col items-center text-center"
        >
          <motion.div
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center rounded-full border border-cyan-300/20 bg-obsidian/55 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:text-xs"
          >
            10+ years of founder research experience
          </motion.div>

          <motion.h1
            id="home-hero-title"
            variants={fadeUp}
            custom={1}
            className="mt-8 max-w-5xl pb-2 text-balance font-display text-[clamp(1.85rem,9.3vw,3.5rem)] font-semibold leading-[0.95] tracking-[-0.055em] text-soft-white sm:mt-10 sm:pb-2.5 sm:text-[clamp(3rem,8vw,7.25rem)] lg:pb-3.5"
          >
            <span className="block whitespace-nowrap">Intelligence in </span>
            <span className="mt-0.5 block whitespace-nowrap text-[0.9em] leading-[0.95] text-gradient sm:mt-1">
              Motion.
            </span>
          </motion.h1>

          {/* THE QUESTION.
              What stood here was the platform explained: two families, four
              application areas and a module count, in one sentence, before the
              visitor had done anything. It is a good sentence and it was the
              wrong first move — it asks somebody to process the whole platform
              to earn the right to click. A question does the opposite: it
              makes the answer worth going to find, and the answer is the
              section immediately below this one. */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-8 max-w-3xl text-balance font-display text-lg leading-[1.45] text-soft-white/90 sm:mt-10 sm:text-2xl sm:leading-[1.4]"
          >
            What if the way we move could reveal health, risk, recovery and
            safety — before anything goes wrong?
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex w-full max-w-3xl flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:items-center sm:flex-wrap"
          >
            {/* THE TWO DOORS FIRST.
                The demo used to lead. It is the best thing in the hero and it
                is still here, but it answers "show me" — and a visitor who has
                only just read the question is choosing WHICH WORLD they are
                in, not asking for a demonstration. The two families are that
                choice, so they come first and the demo follows them. Nothing
                loads until the demo is pressed. */}
            <Link
              href="/mobilitycare"
              className="hero-product-link hero-product-link--care group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/[0.1] px-6 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-300/50 hover:bg-teal-300/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Explore MobilityCare
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/securevision"
              className="hero-product-link hero-product-link--secure group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-royal-300/35 bg-royal-400/[0.1] px-6 py-3 text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-royal-300/50 hover:bg-royal-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-300/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
            >
              Explore SecureVision
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <TryGaitAI />
          </motion.div>

          {/* The supporting evidence, kept and demoted. One line: the span and
              the module count, derived. It is the sentence the old paragraph
              opened with, at the weight a supporting fact should carry rather
              than the weight of the first thing you read. */}
          <motion.p
            variants={fadeUp}
            custom={4}
            className="mt-9 max-w-xl text-balance text-[13px] leading-relaxed text-soft-gray/80 sm:mt-11 sm:text-sm"
          >
            Clinical mobility and privacy-aware public safety, on one platform —
            MobilityCare and SecureVision, {productCount} connected modules.
          </motion.p>

          {/* The living signature's one line of controls: the six stages the
              scene walks through (selectable, so the progression is legible
              without waiting for it), then the motion control.

              THE STRIDE INSPECTOR IS GONE FROM HERE. It opened a second,
              interactive Motion DNA drawing inside the first viewport, under
              a headline, two doors and a demo — and the section directly below
              this one is now an interactive Motion DNA drawing with room to
              explain itself. One of them had to go and it was not going to be
              the one with the explanation. */}
          <div className={living.living}>
            {eligible && !reduceMotion && (
              <ol
                className={living.sequence}
                aria-label="Stages of the living movement signature"
              >
                {stages.map((stage, index) => (
                  <li key={stage}>
                    <button
                      type="button"
                      aria-pressed={signatureStage === index}
                      onClick={() => {
                        setManual(true);
                        setSignatureStage(index);
                      }}
                    >
                      {stage}
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <div className={living.controls}>
              {eligible && !reduceMotion && (
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  aria-pressed={paused}
                  aria-label={
                    paused ? "Resume hero motion" : "Pause hero motion"
                  }
                >
                  {paused ? "Resume motion" : "Pause motion"}
                </button>
              )}
              {/* Down to the answer. A link rather than a scroll script, so
                  it deep-links, it enters the history and the keyboard
                  reaches it like everything else. */}
              <a href="#overview" className={living.inspect}>
                What can movement tell us?
                <span aria-hidden="true"> ↓</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
