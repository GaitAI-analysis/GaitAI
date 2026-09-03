import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./observatory.module.css";

/**
 * Research provenance, drawn as a lineage instead of two columns and an arrow.
 *
 * The shape carries the argument: one trunk of founder-led work, the granted
 * patent marked on it as the single milestone that earns the champagne accent,
 * a platform core, and only then the split into the two verticals that the
 * modules hang off. Read top to bottom it answers "whose work is this, and
 * what came out of it" before a word is read.
 *
 * Every figure is passed in from the canonical records; the provenance
 * paragraph underneath is the same sentence the previous strip carried, which
 * is the sentence that keeps academic record and platform implementation
 * distinct.
 *
 * Desktop draws the SVG lineage. Below `lg` the same lineage is an HTML rail —
 * a shrunken diagram would put 8px labels on a phone.
 */

export type LineageProps = {
  papers: number;
  patentNumber: string;
  founder: string;
  yearFrom: number;
  yearTo: number;
  careCount: number;
  secureCount: number;
  moduleCount: number;
};

const CX = 450;

export function ResearchLineage({
  papers,
  patentNumber,
  founder,
  yearFrom,
  yearTo,
  careCount,
  secureCount,
  moduleCount,
}: LineageProps) {
  const careX = 205;
  const secureX = 695;

  const careDown = `M${CX} 206 C${CX} 250 ${careX} 236 ${careX} 282`;
  const secureDown = `M${CX} 206 C${CX} 250 ${secureX} 236 ${secureX} 282`;
  const careJoin = `M${careX} 320 C${careX} 358 ${CX} 344 ${CX} 372`;
  const secureJoin = `M${secureX} 320 C${secureX} 358 ${CX} 344 ${CX} 372`;

  return (
    <>
      {/* ── The lineage, at every width ── */}
      <div className={styles.diagramScroll}>
      <svg
        aria-hidden="true"
        viewBox="0 0 900 430"
        className={styles.lineage}
      >
        {/* Trunk: founder record → core */}
        <line className={styles.lnTrunk} x1={CX} y1={78} x2={CX} y2={172} />
        <path
          className={styles.lnFlow}
          d={`M${CX} 78 L${CX} 172`}
          pathLength={100}
        />

        {/* Founder-led research */}
        <circle className={styles.lnHalo} cx={CX} cy={54} r={26} />
        <circle className={styles.lnNode} cx={CX} cy={54} r={9} />
        <circle className={styles.lnNodeDot} cx={CX} cy={54} r={3} />
        <text className={styles.lnLabel} x={CX} y={26} textAnchor="middle">
          Founder-led research
        </text>
        <text className={styles.lnMeta} x={CX} y={41} textAnchor="middle">
          {yearFrom} → {yearTo}
        </text>
        <text className={styles.lnMeta} x={CX - 22} y={100} textAnchor="end">
          {papers} peer-reviewed papers
        </text>

        {/* The one milestone that carries the champagne accent */}
        <circle className={styles.lnNodeGold} cx={CX} cy={126} r={7.5} />
        <circle className={styles.lnNodeDotGold} cx={CX} cy={126} r={2.6} />
        <line
          className={styles.lnTrunk}
          x1={CX + 12}
          y1={126}
          x2={CX + 34}
          y2={126}
        />
        <text
          className={`${styles.lnMeta} ${styles.lnMetaGold}`}
          x={CX + 42}
          y={129}
        >
          Patent {patentNumber} · granted
        </text>

        {/* Movement intelligence core */}
        <circle className={styles.lnHalo} cx={CX} cy={190} r={34} />
        <circle className={styles.lnNode} cx={CX} cy={190} r={14} />
        <circle className={styles.lnNodeDot} cx={CX} cy={190} r={4} />
        <text className={styles.lnLabel} x={CX} y={166} textAnchor="middle">
          Movement Intelligence Core
        </text>

        {/* Split into the two verticals */}
        <path className={styles.lnBranchCare} d={careDown} />
        <path className={styles.lnBranchSecure} d={secureDown} />
        <path
          className={styles.lnFlow}
          style={{ "--i": 1 } as CSSProperties}
          d={careDown}
          pathLength={100}
        />
        <path
          className={styles.lnFlow}
          style={{ "--i": 1 } as CSSProperties}
          d={secureDown}
          pathLength={100}
        />

        <circle className={styles.lnNode} cx={careX} cy={296} r={8} />
        <circle className={styles.lnNodeDot} cx={careX} cy={296} r={2.8} />
        <text className={styles.lnLabel} x={careX} y={274} textAnchor="middle">
          MobilityCare
        </text>
        <text
          className={`${styles.lnMeta} ${styles.lnMetaCare}`}
          x={careX}
          y={320}
          textAnchor="middle"
        >
          {careCount} modules
        </text>

        <circle className={styles.lnNode} cx={secureX} cy={296} r={8} />
        <circle className={styles.lnNodeDot} cx={secureX} cy={296} r={2.8} />
        <text className={styles.lnLabel} x={secureX} y={274} textAnchor="middle">
          SecureVision
        </text>
        <text
          className={`${styles.lnMeta} ${styles.lnMetaSecure}`}
          x={secureX}
          y={320}
          textAnchor="middle"
        >
          {secureCount} modules
        </text>

        {/* Convergence: the platform total */}
        <path className={styles.lnBranchCare} d={careJoin} />
        <path className={styles.lnBranchSecure} d={secureJoin} />
        <circle className={styles.lnHalo} cx={CX} cy={386} r={24} />
        <circle className={styles.lnNode} cx={CX} cy={386} r={9} />
        <circle className={styles.lnNodeDot} cx={CX} cy={386} r={3} />
        <text className={styles.lnLabel} x={CX} y={415} textAnchor="middle">
          {moduleCount} modular products
        </text>
      </svg>
      </div>


      {/* The distinction, in the same words the page has always used. */}
      <p className={styles.provenanceNote}>
        {papers} peer-reviewed papers and Patent {patentNumber}, authored by{" "}
        {founder} with academic co-authors, constitute the research foundation.
        GaitAI product modules are subsequent platform implementations.{" "}
        <Link
          href="/publications"
          className="text-cyan-300 underline decoration-cyan-300/30 underline-offset-2 transition-colors hover:text-cyan-200"
        >
          View publications
        </Link>
      </p>
    </>
  );
}
