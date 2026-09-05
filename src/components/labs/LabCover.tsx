import Image from "next/image";
import { GAIT_LABS_EYEBROW } from "@/data/labs";
import { assetPath } from "@/lib/paths";
import { EnterLabButton } from "./EnterLabButton";
import { LAB_PHOTO } from "./photo/lab-photo-layout";
import styles from "./labCover.module.css";

/** The cover: the founder standing in the lab, at the centre of the camera ring. */
export const LAB_COVER_IMAGE = LAB_PHOTO.src;

/**
 * STAGE ONE OF GAITAI LABS — the cover.
 *
 * The founder standing at the centre of the biometrics capture room, seen
 * from behind, with the capture cameras standing around her. "Enter the Lab"
 * opens the same room in three dimensions, from the same side.
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
          alt={LAB_PHOTO.alt}
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
