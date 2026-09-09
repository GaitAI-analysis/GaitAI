"use client";

import { useEffect, useRef, useState } from "react";
import { gaitscapeStories, storyNode, type GaitscapeStory } from "@/data/gaitscape/stories";
import styles from "./story.module.css";

export function StoryMode({ story, step, reducedMotion, onStory, onStep, onExit }: {
  story: GaitscapeStory;
  step: number;
  reducedMotion: boolean;
  onStory: (id: string) => void;
  onStep: (step: number, automatic?: boolean) => void;
  onExit: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = story.steps[step];
  const node = storyNode(current);

  useEffect(() => setPlaying(false), [story.id, reducedMotion]);
  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) setPlaying(false);
    });
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", pauseWhenHidden); };
  }, []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    if (step >= story.steps.length - 1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => onStep(step + 1, true), 6500);
    return () => window.clearTimeout(timer);
  }, [playing, reducedMotion, step, story.steps.length, onStep]);

  const chooseStep = (next: number) => { setPlaying(false); onStep(next); };

  return (
    <div ref={root} className={styles.rail} aria-label="GaitScape story controls">
      <div className={styles.top}>
        <label className="text-xs text-soft-mute" htmlFor="gaitscape-story">Choose a story</label>
        <select id="gaitscape-story" value={story.id} onChange={(event) => onStory(event.target.value)} className={`gaitscape-select ${styles.select}`}>
          {gaitscapeStories.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </div>
      <div className={styles.body}>
        <ol className={styles.steps} aria-label="Story steps">
          {story.steps.map((item, index) => (
            <li key={`${item.nodeId}-${index}`}>
              <button type="button" className={styles.step} aria-current={index === step ? "step" : undefined} onClick={() => chooseStep(index)}>
                <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {storyNode(item)?.title}
              </button>
            </li>
          ))}
        </ol>
        <div>
          <div aria-live="polite" aria-atomic="true">
            <p className="text-sm font-semibold text-soft-white">{step + 1} / {story.steps.length} · {node?.title}</p>
            <p className={`${styles.explanation} text-soft-gray`}>{current.explanation}</p>
          </div>
          <p className={`${styles.context} text-soft-mute`}>{story.context}</p>
          <div className={styles.controls}>
            <button type="button" className="gaitscape-seg-btn gaitscape-seg-btn--solo" onClick={() => chooseStep(step - 1)} disabled={step === 0}>Previous</button>
            <button type="button" className="gaitscape-seg-btn gaitscape-seg-btn--solo" disabled={reducedMotion} onClick={() => {
              if (step === story.steps.length - 1) onStep(0);
              setPlaying((value) => !value);
            }}>{playing ? "Pause" : "Play"}</button>
            <button type="button" className="gaitscape-seg-btn gaitscape-seg-btn--solo" onClick={() => chooseStep(step + 1)} disabled={step === story.steps.length - 1}>Next</button>
            <button type="button" className="gaitscape-seg-btn" onClick={onExit}>Exit Story</button>
          </div>
          {reducedMotion && <p className={`${styles.context} text-soft-mute`}>Automatic playback is off for reduced motion. Select any step or use Previous and Next.</p>}
        </div>
      </div>
    </div>
  );
}
