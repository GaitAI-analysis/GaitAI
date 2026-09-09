"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MotionSignature } from "@/components/visuals/MotionSignature";
import styles from "./story.module.css";

const STEPS = [
  { title: "A person moves", detail: "A walk carries a sequence of moments. Start with the human, in the context that matters." },
  { title: "Movement becomes structure", detail: "Pose landmarks describe the body. A skeleton connects those landmarks across each frame." },
  { title: "Structure becomes signal", detail: "Joint trajectories, timing and movement patterns turn a sequence into something a person can inspect." },
  { title: "Signal becomes intelligence", detail: "The purpose determines the reading: mobility, recovery, safety or a governed identity-related application." },
  { title: "Intelligence supports action", detail: "MobilityCare supports movement review. SecureVision supports spatial and safety review. People make the decision." },
];

export function MovementStory() {
  const [scrollStep, setScrollStep] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const active = chosen ?? scrollStep;
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.filter((item) => item.isIntersecting).sort((a,b) => Math.abs(a.boundingClientRect.top - window.innerHeight / 2) - Math.abs(b.boundingClientRect.top - window.innerHeight / 2))[0];
      if (entry) setScrollStep(Number((entry.target as HTMLElement).dataset.step));
    }, { rootMargin: '-20% 0px -30% 0px', threshold: .5 });
    items.current.forEach((item) => { if(item) observer.observe(item); });
    return () => observer.disconnect();
  }, []);

  return <section className={`section ${styles.story}`} aria-labelledby="movement-story-title">
    <div className="container-wide">
      <p className={styles.eyebrow}>One walk. A connected story.</p>
      <h2 id="movement-story-title" className="mt-4 font-display text-display-md text-soft-white">From human movement to human decisions.</h2>
      <div className={styles.layout}>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => <li key={step.title}>
            <button ref={(node) => {items.current[index] = node;}} data-step={index} type="button" aria-pressed={active === index} onClick={() => setChosen(index)} className={styles.step}>
              <span className={styles.number}>{String(index + 1).padStart(2,'0')}</span>
              <span><strong>{step.title}</strong><span className={styles.detail}>{step.detail}</span></span>
            </button>
          </li>)}
        </ol>
        <div className={styles.visual}>
          <div className={styles.visualHead}><span>Motion DNA</span><span>Illustrative geometry</span></div>
          <MotionSignature stage={active} interactive={active >= 1} />
          {active === 0 && <p className={styles.context}>One illustrated stride, sampled at five gait events. Select a step to follow its structure and signals.</p>}
          {active >= 3 && <div className={styles.dimensions} aria-label="Movement intelligence dimensions"><span>Mobility</span><span>Recovery</span><span>Safety</span><span>Governed identity</span></div>}
          <div className={styles.links}>
            <Link href="/mobilitycare/">MobilityCare <span aria-hidden="true">↗</span></Link>
            <Link href="/securevision/">SecureVision <span aria-hidden="true">↗</span></Link>
            <Link href="/movement-lab/">Explore Movement Studio <span aria-hidden="true">→</span></Link>
          </div>
          {chosen !== null && <button type="button" className={styles.resume} onClick={() => setChosen(null)}>Follow the scroll again</button>}
        </div>
      </div>
    </div>
  </section>;
}
