import Image from "next/image";
import { GAIT_LABS_EYEBROW } from "@/data/labs";
import { assetPath } from "@/lib/paths";
import { EnterLabButton } from "./EnterLabButton";
import styles from "./labCover.module.css";

export const LAB_COVER_IMAGE = "/assets/images/labs/lab-cover.jpg";

/**
 * The cover of GaitAI Labs: the founder standing at the centre of the
 * biometrics capture room, ringed by the cameras that read a walk.
 *
 * THE PHOTOGRAPH IS THE HERO, AND THE ONLY COPY IS ONE ACTION. There is no
 * title, blurb or caption over the image any more — the room says what the
 * page is — so the media runs the full width in every viewport, the figure at
 * the centre of the frame is the centre of the section, and "Enter the Lab"
 * sits beneath it on a vertical grade that settles the image into the page.
 * The page keeps an `h1` for assistive technology and the document outline;
 * it is not drawn.
 *
 * The image is kept, not recoloured: a touch less saturation and light so the
 * daylight room sits inside the dark page instead of in front of it. The
 * cover is dark in both themes by design, which is why its colours are set
 * here rather than through the theme tokens.
 *
 * "Enter the Lab" is a button, not a link: it opens the interactive
 * three-dimensional reconstruction of this same room over the page (see
 * `LabExperience`), and focus returns to it when the room closes.
 */
export function LabCover() {
  return (
    <section className={styles.cover}>
      <h1 className="sr-only">{GAIT_LABS_EYEBROW}</h1>

      <div className={styles.media}>
        <Image
          src={assetPath(LAB_COVER_IMAGE)}
          alt="Anubha Parashar standing at the centre of the GaitAI biometrics lab, a bright room with louvered windows and a ring of camera tripods all pointed at her."
          fill
          priority
          sizes="100vw"
          className={styles.image}
        />
        <div aria-hidden="true" className={styles.grade} />
      </div>

      <div className={`container-wide ${styles.inner}`}>
        <EnterLabButton className={`btn-primary ${styles.enter}`}>
          Enter the Lab
          <span aria-hidden="true"> &rarr;</span>
        </EnterLabButton>
      </div>
    </section>
  );
}
