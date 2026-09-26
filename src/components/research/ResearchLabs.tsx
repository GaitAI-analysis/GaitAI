import { BiometricResearchVisual } from "./BiometricResearchVisual";
import { PoseBiomechanicsVisual } from "./PoseBiomechanicsVisual";
import { PrivacyTransformationVisual } from "./PrivacyTransformationVisual";
import { EdgeInferenceVisual } from "./EdgeInferenceVisual";
import styles from "./labs.module.css";

/**
 * The four research pillars, as four scenes.
 *
 * This section replaces four cards of prose with a 34px glyph each. A card
 * could say "privacy-preserving gait data"; only a picture can show identity
 * leaving the frame, and only a pipeline with packets in it can show inference
 * happening where the camera is. So each pillar now gets the width of the page
 * and states its method visually, with the copy reduced to what the picture
 * cannot carry: the pillar's name, its one-line summary from the record, and
 * how much published work sits behind it.
 *
 * The scenes alternate sides so four rows never fall into a rhythm.
 *
 * Every field is passed in from `researchAreas`, which resolves the pillars
 * against `publications.ts`. The counts are derived: three of the four pillars
 * rest on a single record each, and a section that rounded that up would
 * misstate the record.
 */

export type LabArea = {
  id: string;
  title: string;
  summary: string;
  papers: number;
  patents: number;
  capabilities: number;
};

const SCENE: Record<string, () => React.ReactElement> = {
  "res-gait-biometrics": BiometricResearchVisual,
  "res-pose-gait": PoseBiomechanicsVisual,
  "res-privacy": PrivacyTransformationVisual,
  "res-edge": EdgeInferenceVisual,
};

export function ResearchLabs({ areas }: { areas: LabArea[] }) {
  return (
    <div className={styles.labs}>
      {areas.map((area, i) => {
        const Scene = SCENE[area.id];
        if (!Scene) return null;
        return (
          <article
            key={area.id}
            className={`${styles.lab} ${i % 2 === 1 ? styles.labFlip : ""}`}
          >
            <div className={styles.labCopy}>
              <span className={styles.labIndex}>
                PILLAR {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className={styles.labTitle}>{area.title}</h3>
              <p className={styles.labSummary}>{area.summary}</p>

              <div className={styles.labRecords}>
                {area.papers > 0 && (
                  <span>
                    <span className={styles.labRecordsCount}>
                      {area.papers}
                    </span>{" "}
                    {area.papers === 1 ? "paper" : "papers"}
                  </span>
                )}
                {area.patents > 0 && (
                  <span>
                    <span className={styles.labRecordsPatent}>
                      {area.patents}
                    </span>{" "}
                    granted {area.patents === 1 ? "patent" : "patents"}
                  </span>
                )}
                <span>
                  <span className={styles.labRecordsCount}>
                    {area.capabilities}
                  </span>{" "}
                  {area.capabilities === 1 ? "capability" : "capabilities"}
                </span>
              </div>
            </div>

            <figure className={styles.labStage}>
              <Scene />
            </figure>
          </article>
        );
      })}
    </div>
  );
}
