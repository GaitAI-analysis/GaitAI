import Image from "next/image";
import Link from "next/link";
import {
  GAIT_LABS_BLURB,
  GAIT_LABS_BOUNDARY,
  GAIT_LABS_EYEBROW,
  GAIT_LABS_TITLE_ACCENT,
  GAIT_LABS_TITLE_LEAD,
} from "@/data/labs";
import { assetPath } from "@/lib/paths";
import { EnterLabButton } from "./EnterLabButton";
import styles from "./labCover.module.css";

export const LAB_COVER_IMAGE = "/assets/images/labs/lab-cover.jpg";

/**
 * The cover of GaitAI Labs: the founder standing at the centre of the
 * biometrics capture room, ringed by the cameras that read a walk.
 *
 * It replaces the text-only hero and keeps every word of it — the eyebrow,
 * the title, the blurb and the boundary line all come from `data/labs.ts` as
 * before — so the page's canon is unchanged; what is added is the room
 * itself, and one action: "Enter the Lab", which opens the interactive
 * three-dimensional reconstruction of this same room over the page.
 *
 * THE PHOTOGRAPH IS THE HERO, GRADED INTO THE SITE. The lab is a bright
 * yellow room in daylight and the site is dark; the image is kept, not
 * recoloured, and read through the site's own ground: a horizontal grade
 * that holds the left third for type and a vertical one that settles it
 * into the page below. The figure stays clear in the right half at every
 * width, which is why the media starts part-way across on a desktop rather
 * than filling the section — filling it put the copy over the subject.
 *
 * The cover is deliberately dark in both themes. Its colours are set here
 * rather than through the theme tokens, because white type over a graded
 * photograph is the design in light mode too.
 */
export function LabCover() {
  return (
    <section className={`site-page-intro ${styles.cover}`}>
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
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{GAIT_LABS_EYEBROW}</span>
          <h1 className={styles.title}>
            {GAIT_LABS_TITLE_LEAD}{" "}
            <span className="text-gradient">{GAIT_LABS_TITLE_ACCENT}</span>
          </h1>
          <p className={styles.blurb}>{GAIT_LABS_BLURB}</p>
          <p className={styles.boundary}>{GAIT_LABS_BOUNDARY}</p>

          <div className={styles.actions}>
            <EnterLabButton className="btn-primary">
              Enter the Lab
              <span aria-hidden="true"> &rarr;</span>
            </EnterLabButton>
            <Link href="#dataset" className={`btn-ghost ${styles.ghost}`}>
              Explore the research assets
            </Link>
          </div>

          <p className={styles.caption}>
            <span className={styles.captionMark} aria-hidden="true" />
            The GaitAI biometrics capture room, with its founder at the centre
            of the camera ring. The interactive lab is built from this room.
          </p>
        </div>
      </div>
    </section>
  );
}
