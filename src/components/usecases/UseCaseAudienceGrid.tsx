import {
  Activity,
  Building2,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Trophy,
} from "lucide-react";
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
 * This replaces the two-column definition list this page used to render
 * (the old WhoWeServe section, now removed): that form was a list to read,
 * and the page needs a grid to scan.
 */
const audiences = [
  {
    title: "Patients",
    line: "Mobility screening and rehabilitation progress they can actually see.",
    Icon: HeartPulse,
  },
  {
    title: "Elderly people",
    line: "Movement changes surfaced for review, at home or in care.",
    Icon: Activity,
  },
  {
    title: "Doctors & physiotherapists",
    line: "Objective gait reports alongside their own clinical judgement.",
    Icon: Stethoscope,
  },
  {
    title: "Sports professionals",
    line: "Posture, asymmetry and movement-efficiency analytics for athletes.",
    Icon: Trophy,
  },
  {
    title: "Security teams",
    line: "Privacy-aware safety intelligence, identity only where authorized.",
    Icon: ShieldCheck,
  },
  {
    title: "Organizations",
    line: "A movement-intelligence layer for enterprises, campuses and cities.",
    Icon: Building2,
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
                <span className={styles.audienceIcon}>
                  <a.Icon aria-hidden="true" className="h-4 w-4" />
                </span>
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
