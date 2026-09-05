import Link from "next/link";
import { GAIT_LAB_STATUS_LABEL, gaitLabs } from "@/data/labs";
import { GAIT_LAB_SCENE } from "./GaitLabScenes";
import styles from "./gaitLabs.module.css";

/**
 * The two research assets, as two full-width rows: copy on one side, the
 * asset's scene on the other, alternating. This is the body of /labs.
 *
 * Everything rendered comes from `data/labs.ts`. The "grounded in N papers"
 * line is the length of the record's `publicationIds`, which the validator
 * checks against `publications.ts` — so the count can never exceed the record.
 * The status is stated in words, not implied by an empty chart.
 */
export function GaitLabAreas() {
  return (
    <div className={styles.root}>
      {gaitLabs.map((lab, i) => {
        const Scene = GAIT_LAB_SCENE[lab.id];
        const papers = lab.publicationIds.length;
        return (
          <article
            key={lab.id}
            id={lab.id}
            className={`${styles.area} ${i % 2 === 1 ? styles.areaFlip : ""} site-anchor-offset`}
          >
            <div className={styles.areaCopy}>
              <span className={styles.areaIndex}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className={styles.areaTitle}>{lab.name}</h2>
              <p className={styles.areaStrap}>{lab.strap}</p>
              <p className={styles.areaBody}>{lab.body}</p>

              <div className={styles.areaMeta}>
                <span>{GAIT_LAB_STATUS_LABEL[lab.status]}</span>
                <span aria-hidden="true">·</span>
                <span>
                  <span className={styles.areaMetaCount}>{papers}</span>{" "}
                  published {papers === 1 ? "paper" : "papers"} behind it
                </span>
              </div>

              <div className={styles.areaCta}>
                <Link href={lab.href} className="btn-primary">
                  {lab.cta}
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>

            {Scene && (
              <figure className={styles.areaStage}>
                <Scene />
              </figure>
            )}
          </article>
        );
      })}
    </div>
  );
}
