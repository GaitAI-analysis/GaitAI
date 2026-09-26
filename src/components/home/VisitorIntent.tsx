"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CAPTURE_SOURCE_LABEL, recommendStack } from "@/data/analytics";
import { visitorIntentById, visitorIntentPaths } from "@/data/visitor-intent";
import styles from "./intent.module.css";

/**
 * "What brings you to GaitAI?" — seven starting points that pre-fill the
 * product finder and gather the demo, evidence, research and story pages that
 * already exist for that visitor. No account, no cookie: the choice is kept in
 * this browser's localStorage only, and can be cleared here.
 *
 * The module path is `recommendStack()`'s answer for the same three inputs the
 * finder asks, so this section can never recommend a module the finder would
 * not, and "Configure this stack" opens that exact configuration.
 */
const STORAGE_KEY = "gaitai:visitor-intent";

export function VisitorIntent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? visitorIntentById.get(selectedId) ?? null : null;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && visitorIntentById.has(saved)) setSelectedId(saved);
    } catch {
      /* storage unavailable — the section simply starts unselected */
    }
  }, []);

  const choose = (id: string | null) => {
    setSelectedId(id);
    try {
      if (id) window.localStorage.setItem(STORAGE_KEY, id);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const stack = useMemo(
    () =>
      selected && (selected.environmentId || selected.objectiveId)
        ? recommendStack({
            environmentId: selected.environmentId,
            objectiveId: selected.objectiveId,
            sources: selected.sources,
          })
        : null,
    [selected],
  );

  const configureHref = selected?.environmentId
    ? `/products/?environment=${selected.environmentId}${
        selected.objectiveId ? `&goal=${selected.objectiveId}` : ""
      }${selected.sources.length ? `&signal=${selected.sources.join(",")}` : ""}`
    : "/products/";

  return (
    <section
      id="trust"
      className={`home-section section home-band ${styles.intent}`}
      aria-labelledby="visitor-intent-title"
    >
      <div className="container-wide">
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>Find your path</p>
            <h2 id="visitor-intent-title" className="mt-4 font-display text-display-md text-soft-white">
              What brings you to GaitAI?
            </h2>
          </div>
          <p className={styles.lead}>
            Choose a starting point. The modules, demo, evidence and research
            shown come from documented product relationships, not a fit score.
            Your choice is remembered only in this browser.
          </p>
        </div>

        <div className={styles.chips} role="group" aria-label="Choose what brings you to GaitAI">
          {visitorIntentPaths.map((path) => (
            <button
              key={path.id}
              type="button"
              className={styles.chip}
              aria-pressed={selectedId === path.id}
              onClick={() => choose(selectedId === path.id ? null : path.id)}
            >
              {path.label}
            </button>
          ))}
        </div>

        {selected && (
          <div className={styles.panel} aria-live="polite">
            <div className={styles.pathColumn}>
              <p className={styles.summary}>{selected.summary}</p>

              {stack?.primary ? (
                <ol className={styles.stack} aria-label="Recommended module path">
                  {selected.sources.length > 0 && (
                    <li className={styles.stackInput}>
                      {selected.sources.map((source) => CAPTURE_SOURCE_LABEL[source]).join(" / ")}
                    </li>
                  )}
                  <li>
                    <Link href={stack.primary.product.href} className={styles.stackPrimary}>
                      {stack.primary.product.short}
                    </Link>
                    <span className={styles.stackRole}>Primary module</span>
                  </li>
                  {stack.supporting.map((entry) => (
                    <li key={entry.product.id}>
                      <Link href={entry.product.href} className={styles.stackLink}>
                        {entry.product.short}
                      </Link>
                      <span className={styles.stackRole}>Supporting</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={styles.noStack}>
                  {selected.environmentId || selected.objectiveId
                    ? "No module is documented for this combination yet. The product finder shows the closest documented mixes."
                    : "This path is about the platform as a whole rather than one module mix, so it opens the pages below instead of a stack."}
                </p>
              )}

              {stack?.primary && (
                <p className={styles.reason}>
                  Modules appear because they are in this environment&apos;s documented
                  mix or match the objective.{" "}
                  <Link href={configureHref} className={styles.inline}>
                    Configure this stack →
                  </Link>
                </p>
              )}
            </div>

            <dl className={styles.links}>
              <div>
                <dt>Demo</dt>
                <dd><Link href={selected.demo.href}>{selected.demo.label}</Link></dd>
              </div>
              <div>
                <dt>Evidence</dt>
                <dd><Link href={selected.evidence.href}>{selected.evidence.label}</Link></dd>
              </div>
              <div>
                <dt>Research</dt>
                <dd><Link href={selected.research.href}>{selected.research.label}</Link></dd>
              </div>
              {selected.storyId && (
                <div>
                  <dt>Story</dt>
                  <dd><Link href={`/gaitscape/?story=${selected.storyId}`}>Follow it in GaitScape</Link></dd>
                </div>
              )}
              {selected.useCase && (
                <div>
                  <dt>Context</dt>
                  <dd><Link href={selected.useCase.href}>{selected.useCase.label}</Link></dd>
                </div>
              )}
            </dl>

            <div className={styles.actions}>
              <Link href={selected.cta.href} className="btn-primary !px-5 !py-2.5 text-sm">
                {selected.cta.label}
              </Link>
              <button type="button" className={styles.clear} onClick={() => choose(null)}>
                Clear my choice
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
