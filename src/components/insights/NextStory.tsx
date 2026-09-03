import Link from "next/link";
import type { InsightArticle } from "@/data/insights";
import { insightHref } from "@/data/insights";
import { StoryCard } from "./StoryCard";
import styles from "./journal.module.css";

/**
 * The end of an article is the most important moment on the page: the reader
 * has finished something and is deciding whether to leave.
 *
 * So the foot of the essay is an editorial transition rather than a "related
 * posts" strip — a sentence that names what was just read and what comes next,
 * then one large card for that next piece, then a single alternative. Two
 * options, not four: a wall of choices is how a reader leaves.
 *
 * The series line shows position in the reading path without implying the
 * essays depend on each other.
 */
export function NextStory({
  current,
  next,
  alternate,
  total,
}: {
  current: InsightArticle;
  next: InsightArticle;
  alternate?: InsightArticle;
  total: number;
}) {
  return (
    <div>
      <p className={styles.seriesTag}>
        GaitAI Foundations · {current.seriesStep} of {total}
        <span aria-hidden="true" className={styles.seriesDots}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`${styles.seriesDot} ${
                i < current.seriesStep ? styles.seriesDotOn : ""
              }`}
            />
          ))}
        </span>
      </p>

      <p className={`${styles.transition} mt-6 max-w-3xl`}>
        You&apos;ve read {current.seriesTitle.toLowerCase()}.{" "}
        <span className={styles.transitionMute}>
          Next: {next.seriesTitle.toLowerCase()}.
        </span>
      </p>

      <div className="mt-8">
        <StoryCard article={next} variant="full" />
      </div>

      {alternate && (
        <div className="mt-10">
          <p className={styles.sectionHead}>
            <span className={styles.sectionHeadTitle}>Or start somewhere else</span>
          </p>
          <div className="mt-5">
            <StoryCard article={alternate} variant="wide" />
          </div>
        </div>
      )}

      <p className="mt-10 text-[0.8125rem] leading-relaxed text-soft-mute">
        The full index is on{" "}
        <Link
          href="/insights"
          className="text-cyan-300 underline decoration-cyan-300/35 underline-offset-4"
        >
          The GaitAI Journal
        </Link>
        .
      </p>
    </div>
  );
}
