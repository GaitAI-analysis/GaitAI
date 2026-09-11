"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { workflowStages } from "@/data/products";
import { useAutoDemonstrate } from "@/lib/useAutoDemonstrate";
import { assetPath } from "@/lib/paths";
import styles from "./journey.module.css";

/**
 * CAPTURE → ANALYZE → REPORT → ACT, as a journey you click through.
 * =============================================================================
 * The four stages were four full-width rows down a zigzag rail: about 2,200px
 * of page, four looping videos, and a shape that could only be read by
 * scrolling from the top of it to the bottom. Everything it said is still
 * here. It now says it in one panel.
 *
 * THE CONTROL IS THE STEPPER. Four stages on a connector line, the fill
 * running as far as the stage being read, so the line is the progress rather
 * than a decoration behind it. Clicking one opens it. That is the whole
 * interaction — no scroll coupling, because a stage you cannot ask about is
 * not a stage you can explore.
 *
 * WHAT IT COSTS, AND WHY THAT IS THE POINT
 *
 * All four stage panels are in the DOM; three of them carry `hidden`. So every
 * stage title and every stage description is in the server-rendered HTML for a
 * crawler and for a reader without JavaScript.
 *
 * The FILM is the exception, and deliberately: only the open stage mounts a
 * `<video>`. The old section mounted four, which meant four decoders and four
 * MP4s — about 5 MB — for a section most visitors scrolled past. A closed
 * stage is text. An open one fetches one clip, and reduced motion never
 * fetches any, showing the poster frame instead.
 *
 * ACCESSIBILITY. A real tablist: `aria-selected`, `aria-controls`, roving
 * `tabIndex` so the four stages are one tab stop, and arrows / Home / End
 * inside it. The panel is focusable and labelled by its own tab.
 *
 * THE DEMONSTRATION. One pass through the four stages the first time the
 * section is on screen, then it stops for good — the shared `useAutoDemonstrate`
 * contract. It exists because a stepper that never moves looks like a diagram;
 * one that keeps moving is a carousel. Any interaction ends it permanently.
 */
export function WorkflowJourney() {
  const reduceMotion = Boolean(useReducedMotion());
  const [chosen, setChosen] = useState<number | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const demo = useAutoDemonstrate<HTMLDivElement>({
    steps: workflowStages.length,
    intervalMs: 1400,
    cycles: 1,
    threshold: 0.25,
  });

  /* A visitor's choice beats the demonstration, which beats the resting
     state — the same precedence every other interactive section here uses. */
  const active = chosen ?? demo.index ?? 0;

  const choose = (index: number) => {
    demo.stop();
    setChosen(index);
  };

  const move = (from: number, step: number) => {
    const next = (from + step + workflowStages.length) % workflowStages.length;
    choose(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div ref={demo.ref} className={styles.journey}>
      <div
        role="tablist"
        aria-label="Workflow stages"
        aria-orientation="horizontal"
        className={styles.stepper}
      >
        {workflowStages.map((stage, i) => {
          const on = active === i;
          return (
            <button
              key={stage.step}
              ref={(node) => {
                tabRefs.current[i] = node;
              }}
              id={`${baseId}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={on ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(event) => {
                const key = event.key;
                if (key === "ArrowRight" || key === "ArrowDown") {
                  event.preventDefault();
                  move(i, 1);
                } else if (key === "ArrowLeft" || key === "ArrowUp") {
                  event.preventDefault();
                  move(i, -1);
                } else if (key === "Home") {
                  event.preventDefault();
                  move(0, 0);
                } else if (key === "End") {
                  event.preventDefault();
                  move(workflowStages.length - 1, 0);
                }
              }}
              className={styles.step}
              data-on={on}
              data-passed={i <= active}
            >
              <span aria-hidden="true" className={styles.node} />
              <span aria-hidden="true" className={styles.index}>
                {stage.step}
              </span>
              <span className={styles.short}>{stage.short}</span>
            </button>
          );
        })}
      </div>

      {workflowStages.map((stage, i) => {
        const on = active === i;
        return (
          <div
            key={stage.step}
            id={`${baseId}-panel-${i}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${i}`}
            hidden={!on}
            tabIndex={0}
            className={styles.panel}
          >
            <div className={styles.copy}>
              <p className={styles.stageLabel}>Stage {stage.step}</p>
              <h3 className={styles.stageTitle}>{stage.title}</h3>
              <p className={styles.stageDesc}>{stage.desc}</p>
            </div>
            <div className={styles.film}>
              {on && <StageFilm index={i} reduceMotion={reduceMotion} />}
            </div>
          </div>
        );
      })}
    </div>
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

/** First frame of each clip, so a closed or reduced-motion stage shows the
    stage rather than an empty box. ~140 KB against 5.0 MB of video. */
const STAGE_POSTERS = [
  "/assets/videos/workflow/stage-01-capture-poster.jpg",
  "/assets/videos/workflow/stage-02-analyze-poster.jpg",
  "/assets/videos/workflow/stage-03-report-poster.jpg",
  "/assets/videos/workflow/stage-04-output-poster.jpg",
];

/**
 * The open stage's visual. Mounted only while its stage is open, so exactly
 * one clip is ever in flight.
 *
 * Reduced motion never fetches the video at all: the `<source>` is not
 * rendered and `preload="none"` keeps the element from reaching for anything,
 * so the poster is the whole cost.
 */
function StageFilm({
  index,
  reduceMotion,
}: {
  index: number;
  reduceMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) return;
    // A rejected play() (autoplay policy, detached element) is not an error
    // worth surfacing — the poster frame stays.
    void video.play().catch(() => {});
  }, [reduceMotion]);

  return (
    <div className="card workflow-stage-card relative h-full overflow-hidden">
      <video
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
      <div className={styles.filmTag}>
        <span>stage_0{index + 1}</span>
      </div>
    </div>
  );
}
