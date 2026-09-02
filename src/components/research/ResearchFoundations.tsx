import Link from "next/link";
import { Cpu, Fingerprint, PersonStanding, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

const ICON: Record<string, LucideIcon> = {
  "res-gait-biometrics": Fingerprint,
  "res-pose-gait": PersonStanding,
  "res-privacy": ShieldCheck,
  "res-edge": Cpu,
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
          const Icon = ICON[area.id] ?? PersonStanding;
          return (
            <li key={area.id}>
              <Link
                href={`/research#evidence-map`}
                className={styles.fCard}
                style={{ ["--f-i" as string]: i }}
              >
                <span aria-hidden="true" className={styles.fCardIcon}>
                  <Icon className="h-[18px] w-[18px]" />
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
