import { Reveal } from "@/components/ui/Reveal";
import { Intersection } from "@/components/sections/about/Intersection";
import styles from "./usecases.module.css";

/**
 * Who GaitAI serves, as a six-card grid.
 *
 * The same six audiences the page carried as an editorial definition list,
 * condensed to one value line each. The long versions were three-clause
 * sentences — accurate, but the reason this section read as a document rather
 * than a page. Meaning is preserved: each line keeps the audience's actual
 * benefit and drops only the enumeration.
 *
 * The cards carry no icon. Each one used to open with a Lucide glyph in a
 * tinted tile — a heart for patients, a trophy for sports — which marked the
 * card without telling a reader anything the title did not already say. The
 * hierarchy is typographic now: audience name, then its value line.
 *
 * This replaces the two-column definition list this page used to render
 * (the old WhoWeServe section, now removed): that form was a list to read,
 * and the page needs a grid to scan.
 */
const audiences = [
  {
    title: "Patients",
    line: "Mobility screening and rehabilitation progress they can actually see.",
  },
  {
    title: "Elderly people",
    line: "Movement changes surfaced for review, at home or in care.",
  },
  {
    title: "Doctors & physiotherapists",
    line: "Objective gait reports alongside their own clinical judgement.",
  },
  {
    title: "Sports professionals",
    line: "Posture, asymmetry and movement-efficiency analytics for athletes.",
  },
  {
    title: "Security teams",
    line: "Privacy-aware safety intelligence, identity only where authorized.",
  },
  {
    title: "Organizations",
    line: "A movement-intelligence layer for enterprises, campuses and cities.",
  },
];

export function UseCaseAudienceGrid() {
  return (
    <section id="who-we-serve" className="section">
      <div className="container-wide">
        <div className={styles.audienceHead}>
          <span className="eyebrow">
            <span className="h-1 w-6 rounded-full bg-gradient-brand" />
            Who GaitAI serves
          </span>
          <h2 className={styles.audienceTitle}>
            Six people in the loop,{" "}
            <span className="text-gradient">one movement layer.</span>
          </h2>
        </div>

        <Reveal>
          <div className={styles.audienceGrid}>
            {audiences.map((a) => (
              <div key={a.title} className={styles.audienceCard}>
                <h3 className={styles.audienceCardTitle}>{a.title}</h3>
                <p className={styles.audienceLine}>{a.line}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The intersection callout, carried over from the section this
            replaces. It is not in the new page outline, but it was on the
            page, so it stays rather than being quietly dropped. */}
        <Intersection />
      </div>
    </section>
  );
}
