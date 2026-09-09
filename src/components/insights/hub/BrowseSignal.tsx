import Link from "next/link";
import { publicationTopics, type PublicationStory } from "@/lib/publication";
import styles from "./discovery.module.css";

/**
 * BROWSE THE SIGNAL — the journal's index, set as type.
 *
 *   By subject                        Everything published
 *   Movement intelligence ━━━━━━━━ 4  2026 ──●──●─●──●──●
 *   Responsible AI        ━━━━     2           JUL  AUG
 *   Mobility              ━━━━     2  View the archive →
 *   Research              ━━━━━━   3
 *
 * Each subject is a row whose trajectory is lit to its share of the archive;
 * hover or focus advances it a little and a signal point arrives. The
 * archive is drawn as movement through publication time from the REAL dates
 * of the stories — one node per story, months labelled where they change,
 * the latest node filled. Nothing is fabricated: five stories, five nodes.
 */
export function BrowseSignal({ stories }: { stories: PublicationStory[] }) {
  const topics = publicationTopics(stories).slice(0, 6);
  const most = Math.max(1, ...topics.map((topic) => topic.count));

  /* The timeline: stories in date order, spread across the width by time. */
  const dated = stories
    .map((story) => ({ story, time: new Date(story.date).getTime() }))
    .filter((item) => Number.isFinite(item.time))
    .sort((a, b) => a.time - b.time);
  const first = dated[0]?.time ?? 0;
  const last = dated[dated.length - 1]?.time ?? first;
  const span = Math.max(1, last - first);
  const W = 320;
  const x0 = 54;
  const x1 = 300;
  const xFor = (time: number) => x0 + ((time - first) / span) * (x1 - x0);
  const months = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
  const years = [...new Set(dated.map((item) => new Date(item.time).getUTCFullYear()))];
  /* One label per month, placed at that month's first story. */
  const monthLabels: Array<{ x: number; label: string }> = [];
  const seen = new Set<string>();
  for (const item of dated) {
    const date = new Date(item.time);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    monthLabels.push({ x: xFor(item.time), label: months.format(date) });
  }

  return (
    <section className={styles.section} aria-label="Browse the journal">
      <div className="container-wide">
        <div className={styles.grid}>
          <div>
            <p className={styles.kicker}>Browse the signal</p>
            <h2 className={styles.heading}>By subject</h2>
            <ul className={styles.subjects}>
              {topics.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/insights/topic/${topic.slug}`}
                    className={styles.subject}
                    style={{ ["--reach" as string]: `${Math.round((topic.count / most) * 100)}%` }}
                    aria-label={`${topic.label}, ${topic.count} ${topic.count === 1 ? "story" : "stories"}`}
                  >
                    <span className={styles.subjectLabel}>{topic.label}</span>
                    <span aria-hidden="true" className={styles.track}>
                      <span className={styles.trackLit} />
                      <span className={styles.trackDot} />
                    </span>
                    <span aria-hidden="true" className={styles.count}>
                      {String(topic.count).padStart(2, "0")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.kicker}>Everything published</p>
            <h2 className={styles.heading}>The archive, in time</h2>
            {dated.length > 0 && (
              <svg
                viewBox={`0 0 ${W} 64`}
                className={styles.timeline}
                role="img"
                aria-label={`${dated.length} stories published between ${months.format(new Date(first))} and ${months.format(new Date(last))} ${years.join(", ")}`}
              >
                <text className={styles.tlYear} x={0} y={30}>
                  {years.join(" · ")}
                </text>
                <line className={styles.tlRail} x1={x0 - 12} y1={26} x2={x1 + 12} y2={26} />
                <line className={styles.tlLit} x1={x0} y1={26} x2={x1} y2={26} />
                {dated.map((item, i) => (
                  <circle
                    key={item.story.id}
                    className={`${styles.tlNode} ${i === dated.length - 1 ? styles.tlNodeLatest : ""}`}
                    cx={xFor(item.time)}
                    cy={26}
                    r={i === dated.length - 1 ? 4 : 3}
                  />
                ))}
                {monthLabels.map((month) => (
                  <text key={month.label + month.x} className={styles.tlLabel} x={month.x} y={50} textAnchor="middle">
                    {month.label}
                  </text>
                ))}
              </svg>
            )}
            <p className={styles.archiveBody}>
              Every article, research note, product update and story, by year and month.
            </p>
            <Link href="/insights/archive" className={styles.cta}>
              View the archive <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The signal flattening into the footer: a gait waveform whose swing decays
 * to a straight line, which then bends down to meet the footer's rule.
 * story → signal → platform. Drawn once as it scrolls into view (a
 * scroll-driven animation, so nothing runs while it is off screen and nothing
 * loops); complete from the start where that is unsupported or motion is
 * reduced. `preserveAspectRatio="none"` lets the drawing stretch to the
 * container: the waveform is a gesture, not a measurement.
 */
export function FooterSignal() {
  return (
    <div className="container-wide" aria-hidden="true">
      {/* Wide: eleven swings decaying over the first 40% of the width. */}
      <svg viewBox="0 0 1200 44" preserveAspectRatio="none" className={`${styles.footerSignal} ${styles.fsWide}`}>
        <path
          className={`${styles.fsPath} ${styles.fsDraw}`}
          pathLength={1}
          d="M0 22 C40 22 48 8 64 8 S88 36 104 36 S128 10 144 10 S168 34 184 34 S208 14 224 14 S248 30 264 30 S288 18 304 18 S328 26 344 26 S368 20 384 20 S408 24 424 24 S448 22 470 22 H1040 C1100 22 1140 43.5 1200 43.5"
        />
        <circle className={styles.fsDot} cx="470" cy="22" r="2.4" />
      </svg>
      {/* Narrow: the same gesture with five swings, so a phone does not
          compress the waveform into a scribble. */}
      <svg viewBox="0 0 400 44" preserveAspectRatio="none" className={`${styles.footerSignal} ${styles.fsNarrow}`}>
        <path
          className={`${styles.fsPath} ${styles.fsDraw}`}
          pathLength={1}
          d="M0 22 C16 22 20 8 32 8 S52 36 64 36 S84 12 96 12 S116 32 128 32 S148 18 160 18 S180 24 192 24 S208 22 220 22 H330 C355 22 375 43.5 400 43.5"
        />
        <circle className={styles.fsDot} cx="220" cy="22" r="2.4" />
      </svg>
    </div>
  );
}
