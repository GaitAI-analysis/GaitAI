import Image from "next/image";
import type { Publication } from "@/data/publications";
import { assetPath } from "@/lib/paths";
import { PublicationCoverArt } from "./PublicationCoverArt";
import { topicsFor } from "./topics";
import styles from "./plate.module.css";

/**
 * The publication plate — a card's art, treated as a research artifact.
 *
 * The grid had the right content and no craft: each card showed its banner
 * flush to the card edges, nine different colour temperatures side by side,
 * with nothing framing them. Read together they looked like nine pasted
 * pictures rather than one archive.
 *
 * A plate is the frame the reference puts around every one of its card
 * visuals, built from five layers:
 *
 *   1  a recessed well — the art sits inside the card, with its own inset
 *      border, rather than bleeding to the card's edge
 *   2  a survey grid over the art at low opacity, so every plate shares one
 *      ground however different the images are
 *   3  corner ticks — the registration marks of a technical plate
 *   4  a topic-keyed accent: a hairline at the top edge and a wash in the
 *      corner, cyan / royal / violet / champagne by what the paper is about,
 *      which is what makes nine plates read as one system
 *   5  a scrim at the foot, so the card's own type never fights the art, and
 *      a hairline caption strip carrying the record number and the plate's
 *      subject
 *
 * The art itself is unchanged: the record's own commissioned `artwork` where
 * it exists, `PublicationCoverArt`'s drawn motif where it does not. This adds
 * frame, ground and system — not new illustration.
 */

type Accent = "cyan" | "royal" | "violet" | "champagne";

/**
 * The plate's accent, chosen from the record's own topics rather than by
 * hand: the patent takes champagne, privacy work violet, pose and
 * computer-vision work royal, and everything else the archive's cyan.
 */
function accentFor(publication: Publication): Accent {
  if (publication.kind === "patent") return "champagne";
  const topics = topicsFor(publication);
  if (topics.includes("Privacy")) return "violet";
  if (topics.includes("Pose Estimation") || topics.includes("Computer Vision")) {
    return "royal";
  }
  return "cyan";
}

/**
 * What the plate is a picture of. Taken from the record's own topics, so the
 * caption cannot describe something the paper is not about.
 */
function subjectFor(publication: Publication): string {
  if (publication.kind === "patent") return "Edge gait analytics";
  const topics = topicsFor(publication);
  return topics[0] ?? "Movement analysis";
}

const ACCENT_CLASS: Record<Accent, string> = {
  cyan: styles.aCyan,
  royal: styles.aRoyal,
  violet: styles.aViolet,
  champagne: styles.aChampagne,
};

export function PublicationPlate({
  publication,
  /** Position in the grid, for the record number. 1-based. */
  index,
  /** The first row loads eagerly; everything below waits. */
  priority = false,
}: {
  publication: Publication;
  index: number;
  priority?: boolean;
}) {
  const accent = accentFor(publication);

  return (
    <div className={`${styles.plate} ${ACCENT_CLASS[accent]}`}>
      <div className={styles.well}>
        {publication.artwork ? (
          <Image
            src={assetPath(publication.artwork)}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className={styles.art}
          />
        ) : (
          <PublicationCoverArt publication={publication} className={styles.art} />
        )}

        {/* One survey grid over every plate: the shared ground. */}
        <span aria-hidden="true" className={styles.grid} />
        {/* A corner wash in the accent, and the top hairline. */}
        <span aria-hidden="true" className={styles.wash} />
        <span aria-hidden="true" className={styles.rule} />
        {/* Registration marks. */}
        <span aria-hidden="true" className={`${styles.tick} ${styles.tickTL}`} />
        <span aria-hidden="true" className={`${styles.tick} ${styles.tickTR}`} />
        <span aria-hidden="true" className={`${styles.tick} ${styles.tickBL}`} />
        <span aria-hidden="true" className={`${styles.tick} ${styles.tickBR}`} />
        {/* The foot scrim and caption. */}
        <span aria-hidden="true" className={styles.scrim} />
        <span aria-hidden="true" className={styles.caption}>
          <span className={styles.captionSubject}>{subjectFor(publication)}</span>
          <span className={styles.captionIndex}>
            {String(index).padStart(2, "0")}
          </span>
        </span>
      </div>
    </div>
  );
}
