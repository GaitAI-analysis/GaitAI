import Link from "next/link";
import { ctas } from "@/data/content";
import styles from "./observatory.module.css";

/**
 * The closing statement.
 *
 * Centred type on a very faint field of movement trajectories — the same
 * damped stride function the hero and the journey use, drawn four times at
 * different phases and held at 18% opacity so it reads as a watermark rather
 * than a background image. No panel, no border: the page ends on the sentence.
 *
 * The line, the collaboration paragraph and both calls to action are the ones
 * the page already carried.
 */

const W = 1200;
const H = 420;

function trajectory(offset: number, amplitude: number, y: number) {
  let d = `M0 ${y}`;
  for (let x = 0; x <= W; x += 12) {
    const t = (x + offset) / 260;
    const phase = t - Math.floor(t);
    const damp = phase < 0.5 ? 1 : 0.7;
    const v =
      Math.sin(t * Math.PI * 2) * 0.6 + Math.sin(t * Math.PI * 4 + 0.4) * 0.25;
    d += `L${x} ${Math.round((y - v * amplitude * damp) * 10) / 10}`;
  }
  return d;
}

const TRACES = [
  { offset: 0, amplitude: 34, y: 120 },
  { offset: 90, amplitude: 26, y: 190 },
  { offset: 180, amplitude: 30, y: 262 },
  { offset: 40, amplitude: 22, y: 330 },
];

export function ResearchCollaborationCTA() {
  return (
    <section className={styles.closing}>
      <div aria-hidden="true" className={styles.closingField}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className={styles.closingFieldSvg}
        >
          {TRACES.map((trace) => (
            <path
              key={trace.y}
              className={styles.cTraj}
              d={trajectory(trace.offset, trace.amplitude, trace.y)}
            />
          ))}
          {TRACES.map((trace) =>
            [0.18, 0.42, 0.66, 0.9].map((f) => (
              <circle
                key={`${trace.y}-${f}`}
                className={styles.cNode}
                cx={W * f}
                cy={trace.y}
                r={2.2}
              />
            )),
          )}
        </svg>
      </div>

      <div className="container-wide">
        <h2 className={styles.closingTitle}>
          Research creates the foundation.{" "}
          <span className={styles.heroSpectrum}>
            Validation builds the evidence for use.
          </span>
        </h2>
        <p className={styles.closingLede}>
          GaitAI welcomes research, clinical and technical collaborations that
          can independently evaluate movement-intelligence systems across
          mobility, rehabilitation, sports and safety settings.
        </p>
        <div className={styles.closingActions}>
          <Link href={ctas.research.href} className="btn-primary">
            {ctas.research.label}
          </Link>
          <Link href="/publications" className="btn-ghost">
            Browse publications
          </Link>
        </div>
        <p className={styles.closingNote}>
          Collaborations are scoped around a single environment or cohort so
          findings stay reviewable. Nothing on this page describes a completed
          study.
        </p>
      </div>
    </section>
  );
}
