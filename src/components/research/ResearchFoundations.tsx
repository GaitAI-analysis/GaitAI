import Link from "next/link";
import { PillarVisual, type PillarKind } from "./PillarVisual";
import styles from "./observatory.module.css";

/**
 * The four research foundations, as the hero's right-hand column.
 *
 * The hero used to carry a full instrument view of a captured stride. That is
 * a picture of the subject; this is a picture of the *record*, which is what
 * the page's headline actually claims — so the first screen now states the
 * four pillars and how much published work sits behind each one, and the
 * captured-stride language moved into the pipeline below.
 *
 * Every field is passed in from `researchAreas`, which resolves the pillars
 * against `publications.ts`. In particular the counts are derived, never
 * written here: three of the four pillars rest on a single record each, and a
 * card that rounded that up would misstate the record.
 */

export type FoundationCard = {
  id: string;
  title: string;
  summary: string;
  /** Peer-reviewed papers backing this pillar. */
  papers: number;
  /** Granted patents backing this pillar. */
  patents: number;
};

/**
 * Which scientific motif belongs to which pillar. These are the same drawings
 * the evidence map uses, so a reader meets each pillar's visual identity in
 * the hero and recognises it again further down the page. They replaced four
 * generic line icons in bordered boxes — an icon says "there is a category
 * here", where the motif says what the category studies.
 */
const KIND: Record<string, PillarKind> = {
  "res-gait-biometrics": "biometrics",
  "res-pose-gait": "pose",
  "res-privacy": "privacy",
  "res-edge": "edge",
};

/** "6 papers" · "1 paper" · "1 granted patent" — from the record, pluralised. */
function recordLabel({ papers, patents }: FoundationCard) {
  const parts: string[] = [];
  if (papers) parts.push(`${papers} ${papers === 1 ? "paper" : "papers"}`);
  if (patents)
    parts.push(`${patents} granted ${patents === 1 ? "patent" : "patents"}`);
  return parts.join(" · ");
}

export function ResearchFoundations({
  areas,
}: {
  areas: FoundationCard[];
}) {
  return (
    <div className={styles.foundations}>
      <h2 className={styles.foundationsLabel}>
        <span aria-hidden="true" className={styles.eyebrowRule} />
        Research foundations
      </h2>

      <ul className={styles.foundationsGrid}>
        {areas.map((area, i) => {
          const kind = KIND[area.id] ?? "pose";
          return (
            <li key={area.id}>
              <Link
                href={`/research#evidence-map`}
                className={styles.fCard}
                style={{ ["--f-i" as string]: i }}
              >
                <span aria-hidden="true" className={styles.fCardArt}>
                  <PillarVisual kind={kind} />
                </span>
                <span className={styles.fCardTitle}>{area.title}</span>
                <span className={styles.fCardSummary}>{area.summary}</span>
                <span className={styles.fCardCount}>{recordLabel(area)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
