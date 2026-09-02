import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { industryUseCases, type Vertical } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
import styles from "./usecases.module.css";

/**
 * The environment system map: every environment wired to one shared engine.
 *
 *   MobilityCare rail  →  Movement intelligence core  ←  SecureVision rail
 *
 * The home page already draws the two families hanging off a hub, but with the
 * hub ABOVE both columns. This is the same graph read the other way round: the
 * core sits BETWEEN the two rails, so the page opens on the thing /use-cases is
 * actually about — one engine, two families, and every environment as a spur
 * off it.
 *
 * WHY RAILS AND NOT A COORDINATE FAN
 * The reference composition sweeps a curve from every row into the centre.
 * Drawing that as one stretched SVG behind the grid needs each row's pixel
 * centre, which is not knowable at build time: row height depends on how the
 * environment's output text wraps, and the two columns hold eleven rows and
 * six. So the wiring is built per row instead — a rail down each column's
 * inner edge, a node per row, a short lead into the card, and one trunk from
 * the core to each rail. It survives any row height and any breakpoint, and it
 * is the grammar the rest of the site already uses for this graph.
 *
 * EVERY value comes from `industryUseCases`: the names, the counts, the output
 * line and the per-environment link. The columns finish at their own heights —
 * MobilityCare has eleven environments to SecureVision's six, and padding one
 * out to match would only add empty rail.
 */

const hrefFor = (caseId: string, vertical: Vertical) => {
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  return detail ? `/use-cases/${detail.slug}/` : `/${vertical}/`;
};

/**
 * A movement-signal glyph for the right-hand end of a row.
 *
 * Deliberately NOT a sparkline or a bar chart. The reference puts a small
 * chart there, and a chart shape on a marketing page reads as measured data —
 * there is no per-environment metric in this repository, so drawing one would
 * invent it. This is the site's Motion DNA mark instead: sample ticks over
 * time, varied per environment by its own id so no two rows are identical,
 * with no axis, no baseline and no scale to be misread as a value.
 */
function SignalGlyph({ seed, tone }: { seed: string; tone: "care" | "secure" }) {
  const h = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);
  const ticks = Array.from({ length: 14 }, (_, i) => {
    const v = Math.abs(Math.sin((h % 97) + i * 1.37));
    const w = Math.abs(Math.cos(i * 0.61 + (h % 13)));
    return 2.4 + v * 7.2 * (0.55 + w * 0.45);
  });
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 62 22"
      className={tone === "care" ? styles.mapGlyphCare : styles.mapGlyphSecure}
    >
      {ticks.map((t, i) => {
        const x = 2 + i * 4.3;
        return (
          <line
            key={i}
            x1={x}
            y1={11 - t}
            x2={x}
            y2={11 + t * 0.42}
            className={i % 5 === 0 ? styles.mapTickStrong : styles.mapTick}
          />
        );
      })}
    </svg>
  );
}

function Rail({
  vertical,
  tone,
  label,
  tagline,
  side,
}: {
  vertical: Vertical;
  tone: "care" | "secure";
  label: string;
  tagline: string;
  side: "left" | "right";
}) {
  const rows = industryUseCases.filter((u) => u.vertical === vertical);
  const toneClass = tone === "care" ? styles.mapCare : styles.mapSecure;

  return (
    <div
      className={`${styles.mapRail} ${toneClass} ${
        side === "right" ? styles.mapRailRight : ""
      }`}
    >
      <div className={styles.mapRailHead}>
        <span className={styles.mapRailCount}>
          {rows.length} environments
        </span>
        <span className={styles.mapRailName}>{label}</span>
        <span className={styles.mapRailTagline}>{tagline}</span>
      </div>

      <ol className={styles.mapRows}>
        {rows.map((row, i) => (
          <li key={row.id} className={styles.mapRowItem}>
            <span aria-hidden="true" className={styles.mapIndex}>
              {String(i + 1).padStart(2, "0")}
            </span>

            <Link
              href={hrefFor(row.id, row.vertical)}
              className={styles.mapRow}
              style={{ ["--m-i" as string]: i }}
            >
              {/* The lead and the node: this row's spur off the family rail. */}
              <span aria-hidden="true" className={styles.mapLead} />
              <span aria-hidden="true" className={styles.mapNode} />

              <span aria-hidden="true" className={styles.mapRowIcon}>
                <row.icon className="h-[17px] w-[17px]" />
              </span>

              <span className={styles.mapRowBody}>
                <span className={styles.mapRowName}>{row.industry}</span>
                {/* The record's own Outputs line — what the product mix
                    produces here. Never "outcome": nothing in this repository
                    documents a measured real-world outcome. */}
                <span className={styles.mapRowOut}>{row.outcome}</span>
              </span>

              <SignalGlyph seed={row.id} tone={tone} />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function UseCaseSystemMap() {
  const care = industryUseCases.filter((u) => u.vertical === "mobilitycare");
  const secure = industryUseCases.filter((u) => u.vertical === "securevision");

  return (
    <div className={styles.map}>
      <Rail
        vertical="mobilitycare"
        tone="care"
        label="MobilityCare"
        tagline="Where the question is about one person's mobility."
        side="left"
      />

      {/* ── The core both rails hang off ── */}
      <div className={styles.mapCore}>
        <svg
          aria-hidden="true"
          viewBox="0 0 260 260"
          className={styles.mapCoreArt}
        >
          <defs>
            <radialGradient id="uc-core-glow">
              <stop offset="0" stopColor="#BFE9FF" stopOpacity="0.42" />
              <stop offset="0.5" stopColor="#4FD1FF" stopOpacity="0.16" />
              <stop offset="1" stopColor="#2563FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* The glow reaches past the disc, so the core reads as a source
              the two rails are drawn toward rather than another card. */}
          <circle cx={130} cy={130} r={128} fill="url(#uc-core-glow)" />

          {/* Concentric processing rings. They illuminate rather than spin. */}
          <circle className={styles.mapRingOuter} cx={130} cy={130} r={104} />
          <circle className={styles.mapRingInner} cx={130} cy={130} r={88} />

          {/* Radial sample ticks — the same Motion DNA mark as the rows. */}
          <g className={styles.mapCoreTicks}>
            {Array.from({ length: 60 }, (_, i) => {
              const a = (i / 60) * Math.PI * 2;
              const r0 = 68;
              const r1 = r0 + (i % 5 === 0 ? 9 : 4);
              return (
                <line
                  key={i}
                  x1={130 + Math.cos(a) * r0}
                  y1={130 + Math.sin(a) * r0}
                  x2={130 + Math.cos(a) * r1}
                  y2={130 + Math.sin(a) * r1}
                />
              );
            })}
          </g>

          <circle className={styles.mapCoreDisc} cx={130} cy={130} r={64} />
          <circle className={styles.mapCoreEdge} cx={130} cy={130} r={64} />
          <circle className={styles.mapCorePulse} cx={130} cy={130} r={64} />
        </svg>

        <div className={styles.mapCoreText}>
          <span className={styles.mapCoreTitle}>
            Movement
            <br />
            intelligence
            <br />
            core
          </span>
          <span className={styles.mapCoreSub}>One platform. Two worlds.</span>
        </div>

        {/* Trunks: the core to each rail. Hairlines, drawn only where the
            three-column layout exists. */}
        <span aria-hidden="true" className={styles.mapTrunkCare} />
        <span aria-hidden="true" className={styles.mapTrunkSecure} />
      </div>

      <Rail
        vertical="securevision"
        tone="secure"
        label="SecureVision"
        tagline="Where the question is about how a space is being used."
        side="right"
      />

      {/* ── Counts, all derived ── */}
      <dl className={styles.mapStats}>
        {[
          { v: String(industryUseCases.length), k: "Environments" },
          { v: "2", k: "Product families" },
          { v: "1", k: "Shared engine" },
          {
            v: `${care.length} · ${secure.length}`,
            k: "MobilityCare · SecureVision",
          },
        ].map((s) => (
          <div key={s.k} className={styles.mapStat}>
            <dt className={styles.mapStatValue}>{s.v}</dt>
            <dd className={styles.mapStatLabel}>{s.k}</dd>
          </div>
        ))}
        <div className={styles.mapStatLink}>
          <Link href="/products" className={styles.mapStatCta}>
            See the shared engine
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </dl>
    </div>
  );
}
