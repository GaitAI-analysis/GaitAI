import Image from "next/image";
import { GAIT_LABS_EYEBROW } from "@/data/labs";
import { assetPath } from "@/lib/paths";
import { EnterLabButton } from "./EnterLabButton";
import { LAB_SITTING_PHOTO } from "./photo/lab-photo-layout";
import styles from "./labCover.module.css";

/** The cover: the founder at work in the lab. APPROVED — see the note below. */
export const LAB_COVER_IMAGE = LAB_SITTING_PHOTO.src;

/**
 * STAGE ONE OF GAITAI LABS — the cover.
 *
 * THE APPROVED DESIGN, NOT TO BE CHANGED WITH THE 3D WORK: the founder
 * SITTING at the round table in the biometrics lab, working at her laptop,
 * seen from behind with the capture cameras standing around the room. This is
 * the human, founder-at-work, research-in-progress story. "Enter the Lab"
 * opens the interactive capture room, where she STANDS at the centre of the
 * camera ring — the two states are deliberately different and are never
 * mixed: standing never appears on the cover, sitting never appears in the
 * capture volume, and the 3D room never opens on its own.
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
          alt={LAB_SITTING_PHOTO.alt}
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
