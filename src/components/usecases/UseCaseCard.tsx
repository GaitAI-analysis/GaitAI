"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { industryUseCases, productById } from "@/data/products";
import { useCaseDetails } from "@/data/usecase-details";
import { facetsFor, outputChipsFor } from "@/data/usecase-facets";
import { EnvironmentGlyph } from "./EnvironmentGlyph";
import styles from "./usecases.module.css";

/**
 * One environment, as a card with progressive disclosure.
 *
 * COLLAPSED it carries the glyph, the environment name, its one-sentence
 * problem, the product chips and up to four output chips — enough to decide
 * "this is my environment" without reading a narrative. EXPANDED it adds the
 * numbered sections the page used to print in full for all seventeen
 * environments at once: the problem, why current workflows fall short, the
 * GaitAI approach, what it produces in the record's own full wording, and why
 * it matters.
 *
 * Everything is rendered either way — `hidden` controls what shows, not a
 * conditional. Seventeen environments' worth of problem statements, approach
 * copy and output lists would otherwise be missing from the static HTML until
 * someone clicked, on the page whose whole job is being found.
 *
 * The expanded panel is a real region with aria-controls/aria-expanded on the
 * toggle. The card is NOT a link: it holds two different destinations (the
 * detail route and the product pages), and nesting those inside a card-wide
 * anchor is what makes a card impossible to use from the keyboard.
 */

type Accent = "teal" | "blue" | "cyan" | "violet" | "gold" | "emerald";

const ACCENT: Record<Accent, string> = {
  teal: styles.aTeal,
  blue: styles.aBlue,
  cyan: styles.aCyan,
  violet: styles.aViolet,
  gold: styles.aGold,
  emerald: styles.aEmerald,
};

export function UseCaseCard({
  caseId,
  open,
  onToggle,
}: {
  caseId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const base = industryUseCases.find((c) => c.id === caseId);
  const detail = useCaseDetails.find((d) => d.caseId === caseId);
  if (!base) return null;

  const accentClass = ACCENT[(base.accent as Accent) ?? "cyan"] ?? styles.aCyan;
  const products = base.productIds
    .map((id) => productById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const chips = outputChipsFor(caseId);
  const facets = facetsFor(caseId);
  const href = detail ? `/use-cases/${detail.slug}/` : `/${base.vertical}/`;
  const panelId = `uc-panel-${caseId}`;
  const family =
    base.vertical === "mobilitycare" ? "MobilityCare" : "SecureVision";

  const sections = detail
    ? [
        { n: "01", title: "The problem", body: base.problem },
        { n: "02", title: "Why current workflows fall short", body: detail.shortfall },
        { n: "03", title: "The GaitAI approach", body: detail.together },
        { n: "05", title: "Why this matters", body: detail.outcome },
      ]
    : [];

  return (
    <article
      id={base.id}
      className={`${styles.card} ${accentClass} ${open ? styles.cardOpen : ""} site-anchor-offset`}
    >
      {/* ── Collapsed head ── */}
      <div className={styles.cardHead}>
        <span className={styles.glyphWrap}>
          <EnvironmentGlyph caseId={caseId} />
        </span>
        <div className="min-w-0 flex-1">
          <span className={styles.family}>{family}</span>
          <h3 className={styles.title}>{base.industry}</h3>
        </div>
      </div>

      <p className={styles.problem}>{base.problem}</p>

      <div className={styles.meta}>
        <span className={styles.metaLabel}>Products</span>
        <div className={styles.chipRow}>
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/${p.vertical}/${p.id}/`}
              className={styles.productChip}
            >
              {p.short}
            </Link>
          ))}
        </div>
      </div>

      {chips.length > 0 && (
        <div className={styles.meta}>
          <span className={styles.metaLabel}>Outputs</span>
          <div className={styles.chipRow}>
            {chips.map((c) => (
              <span key={c} className={styles.outputChip}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Expanded detail ── */}
      <div
        id={panelId}
        role="region"
        aria-label={`${base.industry} — full use case`}
        hidden={!open}
        className={styles.panel}
      >
        <ol className={styles.panelList}>
          {sections.map((s) => (
            <li key={s.n} className={styles.panelItem}>
              <span className={styles.panelNum}>{s.n}</span>
              <div className="min-w-0">
                <h4 className={styles.panelTitle}>{s.title}</h4>
                <p className={styles.panelBody}>{s.body}</p>
              </div>
            </li>
          ))}

          {detail && (
            <li className={styles.panelItem}>
              <span className={styles.panelNum}>04</span>
              <div className="min-w-0">
                <h4 className={styles.panelTitle}>What it produces</h4>
                <ul className={styles.signalList}>
                  {detail.signals.map((s) => (
                    <li key={s} className={styles.signalItem}>
                      <span aria-hidden="true" className={styles.signalDot} />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )}
        </ol>

        {facets.length > 0 && (
          <div className={styles.facetRow}>
            {facets.map((f) => (
              <span key={f} className={styles.facetTag}>
                {f}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className={styles.toggle}
        >
          {open ? "Show less" : "See the full use case"}
          <span aria-hidden="true" className={styles.toggleMark}>
            {open ? "−" : "+"}
          </span>
        </button>

        <Link href={href} className={styles.explore}>
          Explore use case
          {detail ? (
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          ) : (
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          )}
        </Link>
      </div>
    </article>
  );
}
