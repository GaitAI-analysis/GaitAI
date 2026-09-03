"use client";

import styles from "./analytics.module.css";

/**
 * The stage rail every analytical flow shares.
 *
 * One shape for four different pipelines — the MobilityCare lab (video → pose
 * → gait cycle → features → analytics → report), the SecureVision lab (video
 * → movement extraction → trajectories → density → candidate events →
 * operator view), the environment explorer's read-out and the home teaser's
 * signal chain — so a reader learns the rail once.
 *
 * Stages are buttons, not decoration: selecting one is how the lab moves, and
 * the rail is the lab's only navigation. Stages before the current one are
 * drawn as passed rather than dimmed, because in a pipeline the earlier
 * stages have happened.
 */

export interface PipelineStage {
  id: string;
  name: string;
  note: string;
}

export function AnalyticsPipeline({
  stages,
  activeId,
  onSelect,
  label,
}: {
  stages: PipelineStage[];
  activeId: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  const activeIndex = stages.findIndex((stage) => stage.id === activeId);

  return (
    <div role="tablist" aria-label={label} className={styles.pipeline}>
      {stages.map((stage, i) => {
        const on = stage.id === activeId;
        return (
          <button
            key={stage.id}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onSelect(stage.id)}
            onKeyDown={(event) => {
              const delta =
                event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              if (!delta) return;
              event.preventDefault();
              const next = (i + delta + stages.length) % stages.length;
              onSelect(stages[next].id);
            }}
            className={`${styles.stage} ${on ? styles.stageOn : ""} ${
              i < activeIndex ? styles.stagePast : ""
            }`}
          >
            <span aria-hidden="true" className={styles.stageIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className={styles.stageName}>{stage.name}</span>
            <span className={styles.stageNote}>{stage.note}</span>
          </button>
        );
      })}
    </div>
  );
}
