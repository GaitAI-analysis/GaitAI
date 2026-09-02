import { papers, patent } from "@/data/publications";
import styles from "./evidence.module.css";

/**
 * The scientific distinction, stated once and prominently, instead of a
 * disclaimer repeated under every row.
 *
 * Three states with three different shapes — a filled tick, and a dashed open
 * ring — so "established" and "not yet published" are distinguishable without
 * relying on colour, and each row carries its state in words as well.
 *
 * The wording is unchanged in meaning from what the page said before: the
 * papers and the patent establish the research record; no study in that record
 * validates a GaitAI product's output for a particular use.
 */
const rows = [
  {
    label: "Research foundation",
    state: "Published / granted",
    done: true,
    detail: `${papers.length} peer-reviewed papers and granted patent ${patent.patentNumber}.`,
  },
  {
    label: "Capability traceability",
    state: "Documented",
    done: true,
    detail:
      "Each capability is mapped to the research area that informed it, and to the products that draw on that capability.",
  },
  {
    label: "Product-specific validation",
    state: "Not yet published",
    done: false,
    detail:
      "No study in this record evaluates a GaitAI product's output for a particular intended use.",
  },
] as const;

export function EvidenceStatus() {
  return (
    <section id="evidence-status" className="section !pt-0">
      <div className="container-wide">
        <div className="grid gap-10 rounded-3xl border border-white/[0.09] bg-gradient-to-b from-white/[0.035] to-transparent p-7 sm:p-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <span className="eyebrow">
              <span className="h-1 w-6 rounded-full bg-gradient-brand" />
              Evidence status
            </span>
            <h2 className="mt-5 font-display text-[1.75rem] leading-[1.15] tracking-[-0.02em] text-balance text-soft-white sm:text-[2.125rem]">
              Research foundation{" "}
              <span className="text-soft-mute">≠</span> product validation.
            </h2>
            <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-soft-gray">
              The papers and the patent establish the underlying research
              record. Product-specific performance requires separate
              validation for its intended use.
            </p>
          </div>

          <dl className="lg:pt-2">
            {rows.map((row) => (
              <div key={row.label} className={styles.statusRow}>
                <span
                  aria-hidden="true"
                  className={
                    row.done ? styles.statusMarkDone : styles.statusMarkOpen
                  }
                />
                <div className="min-w-0">
                  <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-[0.9375rem] font-semibold text-soft-white">
                      {row.label}
                    </span>
                    <span
                      className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
                        row.done ? "text-emerald-300/90" : "text-soft-mute"
                      }`}
                    >
                      {row.state}
                    </span>
                  </dt>
                  <dd className="mt-1.5 max-w-prose text-[13px] leading-relaxed text-soft-mute">
                    {row.detail}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
