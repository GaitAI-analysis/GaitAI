import Image from "next/image";
import { GAIT_LABS_EYEBROW } from "@/data/labs";
import { assetPath } from "@/lib/paths";
import { EnterLabButton } from "./EnterLabButton";
import { LAB_SITTING_PHOTO } from "./photo/lab-photo-layout";
import styles from "./labCover.module.css";

/** The cover: the founder at work in the lab. */
export const LAB_COVER_IMAGE = LAB_SITTING_PHOTO.src;

/**
 * STAGE ONE OF GAITAI LABS — the cover.
 *
 * The founder sitting at the round table in the biometrics lab, working at
 * her laptop, seen from behind with the capture cameras standing around the
 * room. This is the human, founder-at-work story, and it is deliberately not
 * the standing figure of the interactive room: the cover says who works
 * here; "Enter the Lab" opens what the room does.
 *
 * Almost no type over the photograph: the eyebrow, one line, one action.
 * The cover is dark in both themes by design, which is why its colours are
 * set here rather than through the theme tokens. The page keeps an `h1` for
 * assistive technology and the document outline.
 */
export function LabCover() {
  return (
    <section className={styles.cover}>
      <div className={styles.media}>
        <Image
          src={assetPath(LAB_COVER_IMAGE)}
          alt="Anubha Parashar seen from behind, sitting at a round table in the GaitAI biometrics lab and working at a laptop that shows a pose skeleton, with camera tripods standing around the bright room."
          fill
          priority
          sizes="100vw"
          className={styles.image}
        />
        <div aria-hidden="true" className={styles.grade} />
      </div>

      <div className={`container-wide ${styles.inner}`}>
        <div className={styles.copy}>
          <h1 className={styles.eyebrow}>{GAIT_LABS_EYEBROW}</h1>
          <p className={styles.line}>A room built to understand movement.</p>
          <div className={styles.actions}>
            <EnterLabButton className={`btn-primary ${styles.enter}`}>
              Enter the Lab
              <span aria-hidden="true"> &rarr;</span>
            </EnterLabButton>
          </div>
        </div>
      </div>
    </section>
  );
}
